import { EventConfig, Handlers } from 'motia'
import { OpenAI } from 'openai'
import { z } from 'zod'
// import { AzureOpenAI } from 'openai'

export const config: EventConfig = {
  type: 'event',
  name: 'AiResponse',
  description: 'Generate streaming AI response with conversation history',
  subscribes: ['chat-message'],
  emits: ['save-message'],
  input: z.object({
    message: z.string(),
    conversationId: z.string(),
    assistantMessageId: z.string(),
  }),
  flows: ['chat'],
}

interface ConversationHistory {
  conversationId: string
  messages: Array<{
    id: string
    message: string
    from: 'user' | 'assistant'
    timestamp: string
  }>
  createdAt: string
  updatedAt: string
}

export const handler: Handlers['AiResponse'] = async (input, context) => {
  const { logger, streams, state, emit } = context
  const { message, conversationId, assistantMessageId } = input

  logger.info('Generating AI response with conversation history', { conversationId })

  // For Azure OpenAI
  // const openai = new AzureOpenAI({
  //   endpoint: process.env.AZURE_OPENAI_ENDPOINT || 'demo-key',
  //   apiKey: process.env.AZURE_OPENAI_API_KEY || 'demo-key',
  //   deployment: 'gpt-4o-mini',
  //   apiVersion: '2024-12-01-preview'
  // })

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  })

  try {
    // Retrieve conversation history
    const conversationData = await state.get<ConversationHistory>(conversationId, 'conversation_history')

    // Build messages array for OpenAI
    const messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }> = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant. Keep responses concise and friendly.'
      }
    ]

    if (conversationData && conversationData.messages.length > 0) {
      // Add conversation history to messages
      for (const historyMessage of conversationData.messages) {
        messages.push({
          role: historyMessage.from === 'user' ? 'user' : 'assistant',
          content: historyMessage.message
        })
      }
      logger.info('Using conversation history', {
        conversationId,
        historyMessageCount: conversationData.messages.length
      })
    } else {
      // No history found, this is likely the first message
      // The current message should already be saved to history by now, but just in case add it
      messages.push({
        role: 'user',
        content: message
      })
      logger.info('No conversation history found, using current message only', { conversationId })
    }
    await streams.conversation.set(conversationId, assistantMessageId, {
      message: '',
      delta: undefined, // No delta in initial streaming state
      from: 'assistant',
      status: 'streaming',
      timestamp: new Date().toISOString(),
    })

    const stream = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages,
      stream: true
    })

    let fullResponse = ''

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || ''
      if (content) {
        fullResponse += content
        logger.info('Streaming AI response chunk', {
          conversationId,
          content
        })

        // Send only the delta during streaming
        await streams.conversation.set(conversationId, assistantMessageId, {
          message: '', // Empty during streaming - frontend will concatenate
          delta: content, // Send only the new chunk
          from: 'assistant',
          status: 'streaming',
          timestamp: new Date().toISOString(),
        })
      }
    }

    const completedTimestamp = new Date().toISOString()

    // Send the complete message when done (no delta)
    await streams.conversation.set(conversationId, assistantMessageId, {
      message: fullResponse,
      delta: undefined, // No delta in final message
      from: 'assistant',
      status: 'completed',
      timestamp: completedTimestamp,
    })

    // Save AI response to conversation history
    await emit({
      topic: 'save-message',
      data: {
        conversationId,
        messageId: assistantMessageId,
        message: fullResponse,
        from: 'assistant',
        timestamp: completedTimestamp,
      },
    })

    logger.info('AI response completed and saved to history', {
      conversationId,
      responseLength: fullResponse.length
    })

  } catch (error) {
    logger.error('Error generating AI response', { error, conversationId })

    await streams.conversation.set(conversationId, assistantMessageId, {
      message: 'Sorry, I encountered an error. Please try again.',
      delta: undefined, // No delta in error message
      from: 'assistant',
      status: 'completed',
      timestamp: new Date().toISOString(),
    })
  }
}

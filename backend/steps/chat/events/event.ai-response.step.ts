import { EventConfig, Handlers } from 'motia'
import { aiResponseInputSchema, type ConversationHistory } from '../types'
import { ChatService } from '../services/chat'

export const config: EventConfig = {
  type: 'event',
  name: 'AiResponseEvent',
  description: 'Generate streaming AI response with conversation history',
  subscribes: ['chat-message'],
  emits: ['save-message'],
  input: aiResponseInputSchema,
  flows: ['chat'],
}

export const handler: Handlers['AiResponseEvent'] = async (input, context) => {
  const { logger, streams, state, emit } = context
  const { message, conversationId, assistantMessageId } = input

  logger.info('Generating AI response with conversation history', { conversationId })

  // Initialize chat service
  const chatService = ChatService.init({ logger })

  try {
    // Retrieve conversation history
    const conversationData = await state.get<ConversationHistory>(conversationId, 'conversation_history')

    await streams.conversation.set(conversationId, assistantMessageId, {
      message: '',
      delta: undefined, // No delta in initial streaming state
      from: 'assistant',
      status: 'streaming',
      timestamp: new Date().toISOString(),
    })

    // Generate AI response using service
    const responseStream = await chatService.generateResponse({
      message,
      conversationHistory: conversationData ?? undefined
    })

    let fullResponse = ''

    for await (const content of responseStream) {
      if (content) {
        fullResponse += content

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

import { ApiRouteConfig, Handlers } from 'motia'
import { chatInputSchema, streamMessageSchema } from '../types'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'ChatApi',
  description: 'Send a message to the AI chatbot',
  path: '/api/chat/message',
  method: 'POST',
  emits: ['chat-message', 'save-message'],
  bodySchema: chatInputSchema,
  responseSchema: {
    200: streamMessageSchema
  },
  flows: ['chat'],
}

export const handler: Handlers['ChatApi'] = async (req, { logger, emit, streams }) => {
  const conversationId = req.body.conversationId || crypto.randomUUID()
  const userMessageId = crypto.randomUUID()
  const assistantMessageId = crypto.randomUUID()

  logger.info('New chat message received', {
    conversationId,
    message: req.body.message
  })

  const userTimestamp = new Date().toISOString()

  await streams.conversation.set(conversationId, userMessageId, {
    message: req.body.message,
    delta: undefined, // User messages don't have deltas
    from: 'user',
    status: 'completed',
    timestamp: userTimestamp,
  })

  // Save user message to conversation history
  await emit({
    topic: 'save-message',
    data: {
      conversationId,
      messageId: userMessageId,
      message: req.body.message,
      from: 'user',
      timestamp: userTimestamp,
    },
  })

  const aiResponse = await streams.conversation.set(conversationId, assistantMessageId, {
    message: '',
    delta: undefined, // No delta in initial state
    from: 'assistant',
    status: 'created',
    timestamp: new Date().toISOString(),
  })

  await emit({
    topic: 'chat-message',
    data: {
      message: req.body.message,
      conversationId,
      assistantMessageId,
    },
  })

  logger.info('Returning chat response', {
    conversationId,
    messageId: assistantMessageId,
  })

  return {
    status: 200,
    body: aiResponse,
  }
}
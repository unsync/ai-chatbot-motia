import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { conversationHistorySchema, type ConversationHistory } from '../types'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'ConversationHistoryApi',
  description: 'Retrieve conversation history by ID',
  path: '/api/chat/conversation/:conversationId',
  method: 'GET',
  emits: [],
  responseSchema: {
    200: conversationHistorySchema,
    404: z.object({
      error: z.string(),
      message: z.string(),
    }),
    500: z.object({
      error: z.string(),
      message: z.string(),
    }),
  },
  flows: ['chat'],
}

export const handler: Handlers['ConversationHistoryApi'] = async (req, { logger, state }) => {
  const conversationId = req.pathParams.conversationId

  logger.info('Retrieving conversation history', { conversationId })

  try {
    // Retrieve conversation history from state
    const conversationData = await state.get<ConversationHistory>(conversationId, 'conversation_history')
    if (!conversationData) {
      logger.info('Conversation not found', { conversationId })
      return {
        status: 404,
        body: {
          error: 'CONVERSATION_NOT_FOUND',
          message: 'The requested conversation could not be found',
        },
      }
    }

    logger.info('Conversation history retrieved successfully', {
      conversationId,
      messageCount: conversationData.messages.length
    })

    return {
      status: 200,
      body: conversationData,
    }
  } catch (error) {
    logger.error('Error retrieving conversation history', { error, conversationId })

    return {
      status: 500,
      body: {
        error: 'INTERNAL_ERROR',
        message: 'An error occurred while retrieving the conversation',
      },
    }
  }
}
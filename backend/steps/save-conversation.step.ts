import { EventConfig, Handlers } from 'motia'
import { z } from 'zod'
import {ConversationHistory} from "./types";

export const config: EventConfig = {
  type: 'event',
  name: 'SaveConversation',
  description: 'Save messages to conversation history',
  subscribes: ['save-message'],
  emits: [],
  input: z.object({
    conversationId: z.string(),
    messageId: z.string(),
    message: z.string(),
    from: z.enum(['user', 'assistant']),
    timestamp: z.string(),
  }),
  flows: ['chat'],
}

export const handler: Handlers['SaveConversation'] = async (input, { logger, state }) => {
  const { conversationId, messageId, message, from, timestamp } = input

  logger.info('Saving message to conversation history', {
    conversationId,
    messageId,
    from,
    messageLength: message.length
  })

  try {
    // Retrieve existing conversation history
    let conversationData = await state.get<ConversationHistory>(conversationId, 'conversation_history')

    const newMessage = {
      id: messageId,
      message,
      from,
      timestamp,
    }

    if (!conversationData) {
      // Create new conversation
      conversationData = {
        conversationId,
        messages: [newMessage],
        createdAt: timestamp,
        updatedAt: timestamp,
      }

      logger.info('Created new conversation', { conversationId })
    } else {
      // Update existing conversation
      // Check if message already exists (avoid duplicates)
      const existingMessageIndex = conversationData.messages.findIndex(msg => msg.id === messageId)

      if (existingMessageIndex >= 0) {
        // Update existing message (for streaming completion)
        conversationData.messages[existingMessageIndex] = newMessage
        logger.info('Updated existing message', { conversationId, messageId })
      } else {
        // Add new message
        conversationData.messages.push(newMessage)
        logger.info('Added new message to conversation', { conversationId, messageId })
      }

      conversationData.updatedAt = timestamp
    }

    // Save updated conversation history
    await state.set(conversationId, 'conversation_history', conversationData)

    logger.info('Message saved to conversation history successfully', {
      conversationId,
      messageId,
      totalMessages: conversationData.messages.length
    })

  } catch (error) {
    logger.error('Error saving message to conversation history', {
      error,
      conversationId,
      messageId
    })
  }
}

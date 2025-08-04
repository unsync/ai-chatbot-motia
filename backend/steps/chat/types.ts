import { z } from 'zod'

// Base message schema
export const messageSchema = z.object({
  id: z.string(),
  message: z.string(),
  from: z.enum(['user', 'assistant']),
  timestamp: z.string(),
})

// Conversation history schema
export const conversationHistorySchema = z.object({
  conversationId: z.string(),
  messages: z.array(messageSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
})

// Stream message schema (for real-time updates)
export const streamMessageSchema = z.object({
  message: z.string(),
  delta: z.string().optional(), // New field for streaming chunks
  from: z.enum(['user', 'assistant']),
  status: z.enum(['created', 'streaming', 'completed']),
  timestamp: z.string(),
})

// Chat API input schema
export const chatInputSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  conversationId: z.string().optional(),
})

// Save message event schema
export const saveMessageInputSchema = z.object({
  conversationId: z.string(),
  messageId: z.string(),
  message: z.string(),
  from: z.enum(['user', 'assistant']),
  timestamp: z.string(),
})

// AI response event schema
export const aiResponseInputSchema = z.object({
  message: z.string(),
  conversationId: z.string(),
  assistantMessageId: z.string(),
})

// Inferred TypeScript types
export type Message = z.infer<typeof messageSchema>
export type ConversationHistory = z.infer<typeof conversationHistorySchema>
export type StreamMessage = z.infer<typeof streamMessageSchema>
export type ChatInput = z.infer<typeof chatInputSchema>
export type SaveMessageInput = z.infer<typeof saveMessageInputSchema>
export type AiResponseInput = z.infer<typeof aiResponseInputSchema>
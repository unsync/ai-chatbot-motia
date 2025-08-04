export interface ConversationHistory {
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

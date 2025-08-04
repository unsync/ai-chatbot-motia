import type { Logger } from 'motia'
import { OpenAI } from 'openai'
import type { ConversationHistory } from '../types'

export class ChatService {
  private logger: Logger
  private openai: OpenAI

  constructor(_: { logger: Logger }) {
    this.logger = _.logger
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    })
  }

  static init(_: { logger: Logger }): ChatService {
    return new ChatService({
      logger: _.logger,
    })
  }

  public async generateResponse(_: {
    message: string
    conversationHistory?: ConversationHistory
  }): Promise<AsyncIterable<string>> {
    const { message, conversationHistory } = _

    this.logger.info('Generating AI response', {
      messageLength: message.length,
      hasHistory: conversationHistory ?? []
    })

    // Build messages array for OpenAI
    const messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }> = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant. Keep responses concise and friendly.'
      }
    ]

    if (conversationHistory && conversationHistory.messages.length > 0) {
      // Add conversation history to messages
      for (const historyMessage of conversationHistory.messages) {
        messages.push({
          role: historyMessage.from === 'user' ? 'user' : 'assistant',
          content: historyMessage.message
        })
      }
      this.logger.info('Using conversation history', {
        historyMessageCount: conversationHistory.messages.length
      })
    } else {
      // No history found, add current message
      messages.push({
        role: 'user',
        content: message
      })
      this.logger.info('No conversation history found, using current message only')
    }

    const stream = await this.openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages,
      stream: true
    })

    return this.processStream(stream)
  }

  private async* processStream(stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>): AsyncIterable<string> {
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || ''
      if (content) {
        this.logger.info('Streaming AI response chunk', { content })
        yield content
      }
    }
  }
}

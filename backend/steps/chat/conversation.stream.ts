import { StreamConfig } from 'motia'
import { streamMessageSchema } from './types'

export const config: StreamConfig = {
  name: 'conversation',
  schema: streamMessageSchema,
  baseConfig: { storageType: 'default' },
}
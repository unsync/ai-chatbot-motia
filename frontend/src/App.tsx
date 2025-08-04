import { useState, useEffect, useRef } from 'react'
import { Send, MessageCircle, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import { useMotiaStream } from './hooks/useMotiaStream.ts'
import './App.css'

// URL utilities
const updateURL = (conversationId: string) => {
  const url = new URL(window.location.href)
  url.searchParams.set('conversation', conversationId)
  window.history.pushState({}, '', url.toString())
}

const getConversationIdFromURL = () => {
  const params = new URLSearchParams(window.location.search)
  return params.get('conversation')
}

// Types based on your Motia backend
interface Message {
  id: string
  message: string
  delta?: string // New field for streaming chunks
  from: 'user' | 'assistant'
  status: 'created' | 'streaming' | 'completed'
  timestamp: string
}





function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string>(() => getConversationIdFromURL() || '')
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Use official Motia stream client
  const { isConnected, subscribeToStreamItem } = useMotiaStream()

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load conversation history when conversationId is present in URL
  useEffect(() => {
    const loadConversationHistory = async () => {
      if (!conversationId) return

      setIsLoadingHistory(true)
      try {
        const response = await fetch(`http://localhost:3000/api/chat/conversation/${conversationId}`)
        if (response.ok) {
          const conversation = await response.json()
          if (conversation.messages && conversation.messages.length > 0) {
            const historyMessages: Message[] = conversation.messages.map((msg: any) => ({
              id: msg.id || crypto.randomUUID(),
              message: msg.message,
              from: msg.from,
              status: 'completed', // History messages are always completed
              timestamp: msg.timestamp
            }))
            setMessages(historyMessages)
          }
        }
      } catch (error) {
        console.error('Error loading conversation history:', error)
      } finally {
        setIsLoadingHistory(false)
      }
    }

    loadConversationHistory()
  }, []) // Only run on mount

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = inputValue.trim()
    setInputValue('')
    setIsLoading(true)

    // Add user message immediately
    const userMessageObj: Message = {
      id: crypto.randomUUID(),
      message: userMessage,
      from: 'user',
      status: 'completed',
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessageObj])

    try {
      // Call your Motia backend
      const response = await fetch('http://localhost:3000/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId: conversationId || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const chatResponse: any = await response.json()
      console.log('Chat response:', chatResponse)

      // Extract Motia metadata (note: double underscore)
      const motiaData = chatResponse.__motia
      const newConversationId = motiaData?.groupId || conversationId
      const aiMessageId = motiaData?.id || crypto.randomUUID()

      // Update conversation ID and URL
      if (!conversationId && newConversationId) {
        setConversationId(newConversationId)
        updateURL(newConversationId)
      }

      // Add initial AI message
      const aiMessage: Message = {
        id: aiMessageId,
        message: chatResponse.message || '',
        from: 'assistant',
        status: chatResponse.status,
        timestamp: chatResponse.timestamp
      }

      setMessages(prev => [...prev, aiMessage])

                 // Subscribe to real-time updates for this message using Motia metadata
           if (motiaData) {
             console.log('🔗 Subscribing to stream:', motiaData)
             console.log('📋 Stream params:', {
               streamName: motiaData.streamName,
               groupId: motiaData.groupId,
               id: motiaData.id,
               aiMessageId
             })

             subscribeToStreamItem(
               motiaData.streamName,
               motiaData.groupId,
               motiaData.id,
               (data: any) => {
                 console.log('🎉 Stream update received:', data)
                 console.log('📝 Updating message with ID:', aiMessageId)
                 setMessages(prev => {
                   const updated = prev.map(msg => {
                     if (msg.id === aiMessageId) {
                       if (data.delta && data.status === 'streaming') {
                         // Streaming: concatenate the delta to existing message
                         console.log('🔄 Appending delta:', data.delta)
                         return {
                           ...msg,
                           message: msg.message + data.delta,
                           status: data.status,
                           timestamp: data.timestamp
                         }
                       } else if (data.status === 'completed') {
                         // Completed: use the full message from backend
                         console.log('✅ Using complete message:', data.message)
                         return {
                           ...msg,
                           message: data.message,
                           status: data.status,
                           timestamp: data.timestamp
                         }
                       }
                     }
                     return msg
                   })
                   console.log('✅ Messages state updated:', updated.length, 'messages')
                   return updated
                 })
               }
             )
           } else {
             console.error('❌ No Motia metadata found in API response')
           }

    } catch (error) {
      console.error('Error sending message:', error)

      // Add error message
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        message: 'Sorry, I encountered an error. Please try again.',
        from: 'assistant',
        status: 'completed',
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-6 h-6 text-blue-500" />
          <h1 className="font-semibold text-gray-800">AI Chat</h1>
        </div>
        <div className="flex items-center space-x-2">
          <div className={clsx(
            "w-2 h-2 rounded-full",
            isConnected ? "bg-green-500" : "bg-red-500"
          )} />
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingHistory && (
          <div className="text-center text-gray-500 mt-8">
            <Loader2 className="w-8 h-8 mx-auto mb-4 text-gray-400 animate-spin" />
            <p>Loading conversation history...</p>
          </div>
        )}

        {!isLoadingHistory && messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Start a conversation with the AI!</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={clsx(
              "flex",
              message.from === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={clsx(
                "message-bubble",
                message.from === 'user'
                  ? 'user-message'
                  : message.status === 'streaming'
                    ? 'streaming-message'
                    : 'assistant-message'
              )}
            >
              <p className="whitespace-pre-wrap">{message.message}</p>
              {message.status === 'streaming' && (
                <div className="flex items-center mt-1">
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  <span className="text-xs opacity-75">AI is typing...</span>
                </div>
              )}
              <div className="text-xs opacity-50 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="flex space-x-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !inputValue.trim()}
            className={clsx(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              isLoading || !inputValue.trim()
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default App

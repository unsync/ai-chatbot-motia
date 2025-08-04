# Streaming AI Chatbot Frontend

A modern React frontend for the Motia streaming AI chatbot, built with Vite and Tailwind CSS.

## 🚀 Features

- **Real-time Chat Interface**: Clean, responsive chat UI with message bubbles
- **Live Streaming**: Watch AI responses appear token-by-token in real-time
- **WebSocket Integration**: Connects to Motia's streaming backend
- **Conversation Management**: Maintains conversation history and state
- **Modern UI**: Built with Tailwind CSS for a polished experience
- **Type-Safe**: Full TypeScript support

## 🛠️ Technology Stack

- **React 19** - Modern React with hooks
- **TypeScript** - Type safety and better developer experience
- **Vite** - Fast development and build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **WebSocket** - Real-time communication with Motia backend

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 Configuration

The frontend is configured to connect to your Motia backend at:
- **API Endpoint**: `http://localhost:3000/chat`
- **WebSocket**: `ws://localhost:3000`

If your Motia server runs on a different port, update the endpoints in:
- `src/App.tsx` - Update the fetch URL and WebSocket URL
- `src/hooks/useMotiaStream.ts` - Update the default serverUrl

## 🎯 How It Works

### 1. Chat Flow
1. User types a message and hits send
2. Message is sent to your Motia `/chat` endpoint
3. User message appears immediately in the chat
4. AI response starts with empty content and "streaming" status
5. WebSocket receives real-time updates as AI generates tokens
6. Message updates in real-time until completion

### 2. WebSocket Integration
The frontend connects to Motia's streaming system using:
```typescript
// Subscribe to conversation stream updates
subscribeToStreamItem(
  'conversation',        // Stream name
  conversationId,        // Group ID (conversation)
  messageId,            // Specific message ID
  (data) => {           // Update callback
    // Update message in real-time
  }
)
```

### 3. Message Types
```typescript
interface Message {
  id: string
  message: string
  from: 'user' | 'assistant'
  status: 'created' | 'streaming' | 'completed'
  timestamp: string
}
```

## 🎨 UI Components

### Chat Interface
- **Header**: Shows connection status and app title
- **Messages Area**: Scrollable conversation history with message bubbles
- **Input Area**: Text input with send button

### Message Bubbles
- **User Messages**: Blue bubbles aligned to the right
- **AI Messages**: Gray bubbles aligned to the left
- **Streaming Messages**: Special styling with typing indicator
- **Timestamps**: Displayed below each message

### Responsive Design
- Mobile-first approach with Tailwind CSS
- Adaptive message bubble sizes
- Touch-friendly interface

## 🔗 Backend Integration

This frontend is designed to work with your Motia streaming AI chatbot backend:

### Required Backend Endpoints
- `POST /chat` - Send new chat messages
- WebSocket connection for real-time streaming

### Expected API Response
```json
{
  "message": "Initial response text",
  "from": "assistant",
  "status": "streaming",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🚀 Getting Started

1. **Start your Motia backend**:
   ```bash
   cd .. # Go back to the main project
   npm run dev
   ```

2. **Start the frontend** (in a new terminal):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open your browser** to `http://localhost:5173`

4. **Start chatting** with your AI!

## 🐛 Troubleshooting

### Connection Issues
- Ensure your Motia backend is running on port 3000
- Check browser console for WebSocket connection errors
- Verify CORS settings if needed

### Build Issues
- Run `npm run build` to check for TypeScript errors
- Ensure all dependencies are installed: `npm install`

### Styling Issues
- Tailwind CSS classes not working? Check `tailwind.config.js`
- PostCSS errors? Verify `postcss.config.js` configuration

## 📁 Project Structure

```
frontend/
├── src/
│   ├── hooks/
│   │   └── useMotiaStream.ts    # Custom hook for Motia streaming
│   ├── App.tsx                  # Main chat component
│   ├── main.tsx                 # React app entry point
│   └── index.css                # Tailwind CSS styles
├── public/                      # Static assets
├── package.json                 # Dependencies and scripts
├── tailwind.config.js           # Tailwind configuration
├── postcss.config.js            # PostCSS configuration
└── vite.config.ts               # Vite configuration
```

## 🎯 Next Steps

Potential enhancements you could add:
- **User Authentication**: Add login/logout functionality
- **Conversation History**: Persist conversations in localStorage
- **Message Actions**: Copy, delete, or regenerate messages
- **File Upload**: Send images or documents to the AI
- **Theme Toggle**: Dark/light mode switching
- **Multiple Conversations**: Tab-based conversation management

## 📝 Notes

- This frontend uses a custom WebSocket implementation since detailed documentation for `@motiadev/stream-client-browser` wasn't readily available
- The implementation follows Motia's expected streaming patterns based on the framework documentation
- All real-time features depend on your Motia backend's streaming capabilities
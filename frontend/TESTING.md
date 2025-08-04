# Testing Your Motia Streaming AI Chatbot

## 🚀 Quick Start

### 1. Start the Motia Backend
```bash
# From the main project directory
npx motia dev
```
**Expected output:**
```
➜ [CREATED] Flow chat created
➜ [CREATED] Step (API) steps/chat-api.step.ts created
➜ [CREATED] Step (Event) steps/ai-response.step.ts created
➜ [CREATED] Stream steps/conversation.stream.ts created
🚀 Server ready and listening on port 3000
🔗 Open http://localhost:3000/ to open workbench 🛠️
```

### 2. Start the Frontend
```bash
# From the frontend directory
npm run dev
```
**Expected output:**
```
VITE v7.0.6  ready in 95 ms
➜  Local:   http://localhost:5174/
```

### 3. Test the Chat
1. **Open your browser** to `http://localhost:5174`
2. **Send a message** like "Hello!" 
3. **Watch for real-time streaming** as the AI responds token-by-token

## 🔍 What to Look For

### ✅ **Working Signs**
- **Connection Status**: Green dot showing "Connected" in the top-right
- **Message Flow**: Your message appears immediately in blue on the right
- **AI Streaming**: AI response appears in gray on the left, updating in real-time
- **Status Changes**: AI message shows "AI is typing..." then completes
- **Console Logs**: Check browser dev tools for connection and stream logs

### ❌ **Troubleshooting**
- **Red dot "Disconnected"**: Backend not running or WebSocket connection failed
- **No AI response**: Check browser console for API errors
- **"Address already in use"**: Kill processes on port 3000: `lsof -ti:3000 | xargs kill -9`

## 🧪 API Testing

Test the backend API directly:
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from API!"}'
```

**Expected response:**
```json
{
  "message": "",
  "from": "assistant", 
  "status": "created",
  "timestamp": "2025-08-04T13:15:31.583Z",
  "id": "01cb7e38-0cba-408f-a891-75eb3d7499ef",
  "__motia": {
    "type": "state-stream",
    "streamName": "conversation", 
    "groupId": "de5e40bd-f787-4082-a352-badbcd1065c8",
    "id": "01cb7e38-0cba-408f-a891-75eb3d7499ef"
  }
}
```

## 🐛 Debug Mode

### Backend Logs
Look for these log patterns in your terminal:
```
[INFO] ChatApi New chat message received
[INFO] AiResponse Generating AI response  
[INFO] AiResponse AI response completed
```

### Frontend Console
Open browser dev tools (F12) and look for:
```
Chat response: {message: "", __motia: {...}}
Loaded Motia Stream Client: true
Subscribing to stream: {...}
Stream item changed: {...}
```

## 🎯 Expected Flow

1. **User types message** → appears instantly in chat
2. **POST /chat** → creates conversation and assistant message  
3. **Backend emits** `chat-message` event
4. **AI Response step** → generates streaming response
5. **Frontend WebSocket** → receives real-time updates
6. **Message updates** → from "created" → "streaming" → "completed"

## 🔧 Configuration

### Environment Variables
Make sure you have:
```bash
# In main project .env
OPENAI_API_KEY=your-openai-api-key-here
```

### Ports
- **Backend**: `http://localhost:3000` (Motia server)
- **Frontend**: `http://localhost:5174` (Vite dev server)  
- **WebSocket**: `ws://localhost:3000` (Motia streaming)

## 📝 Known Issues

1. **Stream Client Package**: If you see warnings about `@motiadev/stream-client-browser`, that's normal - we have fallback implementations
2. **Port Conflicts**: If port 3000 is busy, kill the processes or use different ports
3. **WebSocket Connection**: May take a few seconds to establish - watch the connection status

## 🎉 Success Criteria

✅ **Frontend loads** without errors  
✅ **Connection status** shows "Connected"  
✅ **Messages send** successfully  
✅ **AI responses** stream in real-time  
✅ **No console errors** in browser dev tools  
✅ **Backend logs** show message processing  

If all these work, your streaming AI chatbot is fully functional! 🚀
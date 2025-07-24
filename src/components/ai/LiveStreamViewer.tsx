import React, { useState, useEffect, useRef } from 'react'
import { Video, MessageCircle, Users, Phone, PhoneOff, Send } from 'lucide-react'
import { LiveStreamService } from '../../services/liveStreamService'
import { createClient } from '../../blink/client'
import type { LiveStreamSession, ChatMessage } from '../../types/ai'

const blink = createClient()

interface LiveStreamViewerProps {
  inspectionId: string
  customerId: string
  onStreamEnd?: () => void
}

export function LiveStreamViewer({ inspectionId, customerId, onStreamEnd }: LiveStreamViewerProps) {
  const [session, setSession] = useState<LiveStreamSession | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Start live stream
  const startStream = async () => {
    try {
      const newSession = await LiveStreamService.startLiveStream(inspectionId, customerId)
      setSession(newSession)
      setIsStreaming(true)

      // Set up real-time chat
      const channel = blink.realtime.channel(`stream_${newSession.id}`)
      
      // Listen for chat messages
      channel.onMessage((message) => {
        if (message.type === 'chat_message') {
          setChatMessages(prev => [...prev, message.data])
        }
      })

      // Listen for presence changes
      channel.onPresence((users) => {
        setOnlineUsers(users)
      })

      // Load chat history
      const history = await LiveStreamService.getChatHistory(newSession.id)
      setChatMessages(history)

    } catch (error) {
      console.error('Failed to start stream:', error)
    }
  }

  // End live stream
  const endStream = async () => {
    if (!session) return

    try {
      await LiveStreamService.endLiveStream(session.id)
      setIsStreaming(false)
      setSession(null)
      onStreamEnd?.()
    } catch (error) {
      console.error('Failed to end stream:', error)
    }
  }

  // Send chat message
  const sendMessage = async () => {
    if (!session || !newMessage.trim()) return

    try {
      await LiveStreamService.sendChatMessage(session.id, 'technician', newMessage)
      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Video className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-semibold text-gray-900">Live Stream</h3>
          {isStreaming && (
            <div className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              LIVE
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {onlineUsers.length > 0 && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              {onlineUsers.length}
            </div>
          )}
          
          {isStreaming ? (
            <button
              onClick={endStream}
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              <PhoneOff className="w-4 h-4" />
              End Stream
            </button>
          ) : (
            <button
              onClick={startStream}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Phone className="w-4 h-4" />
              Start Stream
            </button>
          )}
        </div>
      </div>

      {session && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Stream */}
          <div className="lg:col-span-2">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 lg:h-80 object-cover"
              />
              
              {!isStreaming && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
                  <div className="text-center text-white">
                    <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Stream not active</p>
                  </div>
                </div>
              )}

              {/* Stream Info Overlay */}
              {isStreaming && (
                <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded text-sm">
                  Inspection: {inspectionId.slice(-8)}
                </div>
              )}
            </div>

            {/* Stream URL for Customer */}
            {session && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 mb-2">
                  <strong>Customer Stream URL:</strong>
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={session.stream_url}
                    readOnly
                    className="flex-1 text-sm bg-white border border-blue-200 rounded px-3 py-2"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(session.stream_url)}
                    className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Chat Panel */}
          <div className="flex flex-col h-96 lg:h-80">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-5 h-5 text-gray-600" />
              <h4 className="font-medium text-gray-900">Live Chat</h4>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-3 bg-gray-50 rounded-lg">
              {chatMessages.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'technician' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        message.sender === 'technician'
                          ? 'bg-primary text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p>{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === 'technician' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Message Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                disabled={!isStreaming}
              />
              <button
                onClick={sendMessage}
                disabled={!isStreaming || !newMessage.trim()}
                className="bg-primary text-white p-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!session && (
        <div className="text-center py-8">
          <Video className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Start Live Stream</h4>
          <p className="text-gray-600 mb-4">
            Allow customers to join your inspection live with real-time video and chat.
          </p>
          <ul className="text-sm text-gray-500 space-y-1 max-w-md mx-auto">
            <li>• Customer receives a secure stream URL</li>
            <li>• Real-time chat during inspection</li>
            <li>• Multiple viewers can join</li>
            <li>• Automatic recording for later review</li>
          </ul>
        </div>
      )}
    </div>
  )
}
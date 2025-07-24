import { createClient } from '../blink/client'
import type { LiveStreamSession, ChatMessage } from '../types/ai'

const blink = createClient()

export class LiveStreamService {
  private static activeStreams = new Map<string, LiveStreamSession>()

  // Start a live stream session
  static async startLiveStream(inspectionId: string, customerId: string): Promise<LiveStreamSession> {
    try {
      const streamId = `stream_${Date.now()}`
      const streamUrl = `${window.location.origin}/stream/${streamId}`

      const session: LiveStreamSession = {
        id: streamId,
        inspection_id: inspectionId,
        customer_id: customerId,
        stream_url: streamUrl,
        chat_messages: [],
        is_active: true,
        started_at: new Date().toISOString()
      }

      // Store in database
      await blink.db.live_streams.create({
        id: session.id,
        inspection_id: inspectionId,
        customer_id: customerId,
        stream_url: streamUrl,
        is_active: 1,
        started_at: session.started_at
      })

      // Store in memory for real-time access
      this.activeStreams.set(streamId, session)

      // Set up real-time channel for chat
      const channel = blink.realtime.channel(`stream_${streamId}`)
      await channel.subscribe({
        userId: 'technician',
        metadata: { role: 'technician' }
      })

      return session
    } catch (error) {
      console.error('Failed to start live stream:', error)
      throw new Error('Failed to start live stream')
    }
  }

  // Join a live stream as customer
  static async joinLiveStream(streamId: string, customerId: string): Promise<LiveStreamSession | null> {
    try {
      const session = this.activeStreams.get(streamId)
      if (!session || !session.is_active) {
        return null
      }

      // Set up real-time channel for customer
      const channel = blink.realtime.channel(`stream_${streamId}`)
      await channel.subscribe({
        userId: customerId,
        metadata: { role: 'customer' }
      })

      return session
    } catch (error) {
      console.error('Failed to join live stream:', error)
      return null
    }
  }

  // Send chat message
  static async sendChatMessage(
    streamId: string, 
    sender: 'customer' | 'technician', 
    message: string, 
    mediaUrl?: string
  ): Promise<ChatMessage> {
    try {
      const chatMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        sender,
        message,
        timestamp: new Date().toISOString(),
        media_url: mediaUrl
      }

      // Store in database
      await blink.db.chat_messages.create({
        id: chatMessage.id,
        stream_id: streamId,
        sender,
        message,
        media_url: mediaUrl,
        timestamp: chatMessage.timestamp
      })

      // Broadcast to real-time channel
      const channel = blink.realtime.channel(`stream_${streamId}`)
      await channel.publish('chat_message', chatMessage)

      // Update local session
      const session = this.activeStreams.get(streamId)
      if (session) {
        session.chat_messages.push(chatMessage)
      }

      return chatMessage
    } catch (error) {
      console.error('Failed to send chat message:', error)
      throw new Error('Failed to send chat message')
    }
  }

  // End live stream
  static async endLiveStream(streamId: string): Promise<void> {
    try {
      const session = this.activeStreams.get(streamId)
      if (!session) return

      // Update database
      await blink.db.live_streams.update(streamId, {
        is_active: 0,
        ended_at: new Date().toISOString()
      })

      // Update local session
      session.is_active = false
      session.ended_at = new Date().toISOString()

      // Clean up real-time channel
      const channel = blink.realtime.channel(`stream_${streamId}`)
      await channel.unsubscribe()

      // Remove from active streams
      this.activeStreams.delete(streamId)
    } catch (error) {
      console.error('Failed to end live stream:', error)
      throw new Error('Failed to end live stream')
    }
  }

  // Get chat history
  static async getChatHistory(streamId: string): Promise<ChatMessage[]> {
    try {
      const messages = await blink.db.chat_messages.list({
        where: { stream_id: streamId },
        orderBy: { timestamp: 'asc' }
      })

      return messages.map(msg => ({
        id: msg.id,
        sender: msg.sender as 'customer' | 'technician',
        message: msg.message,
        timestamp: msg.timestamp,
        media_url: msg.media_url
      }))
    } catch (error) {
      console.error('Failed to get chat history:', error)
      return []
    }
  }

  // Get active streams
  static getActiveStreams(): LiveStreamSession[] {
    return Array.from(this.activeStreams.values())
  }

  // Check if stream is active
  static isStreamActive(streamId: string): boolean {
    const session = this.activeStreams.get(streamId)
    return session ? session.is_active : false
  }
}
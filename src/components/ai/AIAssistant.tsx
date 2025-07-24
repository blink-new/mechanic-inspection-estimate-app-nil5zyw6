import React, { useState, useRef, useEffect } from 'react'
import { Camera, Mic, MicOff, Brain, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react'
import { createClient } from '../../blink/client'
import { AIService } from '../../services/aiService'
import type { AIDetectionResult, VoicePromptResult } from '../../types/ai'

const blink = createClient()

interface AIAssistantProps {
  inspectionId: string
  onDetectionResult?: (result: AIDetectionResult) => void
  onVoiceResult?: (result: VoicePromptResult) => void
}

export function AIAssistant({ inspectionId, onDetectionResult, onVoiceResult }: AIAssistantProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [recentResults, setRecentResults] = useState<(AIDetectionResult | VoicePromptResult)[]>([])
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Initialize camera
  useEffect(() => {
    let currentStream: MediaStream | null = null
    
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }, // Use back camera on mobile
          audio: false 
        })
        currentStream = stream
        setCameraStream(stream)
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (error) {
        console.error('Failed to initialize camera:', error)
      }
    }

    initCamera()

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // Capture and analyze photo
  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsAnalyzing(true)
    try {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext('2d')
      
      if (!context) return

      // Set canvas size to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convert to blob and upload
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8)
      })

      // Upload to storage
      const { publicUrl } = await blink.storage.upload(
        blob,
        `inspections/${inspectionId}/ai-analysis/${Date.now()}.jpg`,
        { upsert: true }
      )

      // Analyze with AI
      const result = await AIService.analyzeMedia(publicUrl, inspectionId)
      
      setRecentResults(prev => [result, ...prev.slice(0, 4)])
      onDetectionResult?.(result)

    } catch (error) {
      console.error('Failed to capture and analyze:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Start voice recording
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      const audioChunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
        
        // Convert to base64 for transcription
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const dataUrl = reader.result as string
            const base64Data = dataUrl.split(',')[1]
            resolve(base64Data)
          }
          reader.onerror = reject
          reader.readAsDataURL(audioBlob)
        })

        // Transcribe audio
        const { text: transcription } = await blink.ai.transcribeAudio({
          audio: base64,
          language: 'en'
        })

        setCurrentPrompt(transcription)
        
        // Process voice prompt with AI
        const result = await AIService.processVoicePrompt(transcription, undefined, inspectionId)
        
        setRecentResults(prev => [result, ...prev.slice(0, 4)])
        onVoiceResult?.(result)
        
        // Clean up
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      
    } catch (error) {
      console.error('Failed to start voice recording:', error)
    }
  }

  // Stop voice recording
  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50'
      case 'major': return 'text-orange-600 bg-orange-50'
      case 'minor': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-blue-600 bg-blue-50'
    }
  }

  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />
      case 'major': return <Clock className="w-4 h-4" />
      case 'minor': return <CheckCircle className="w-4 h-4" />
      default: return <Brain className="w-4 h-4" />
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-6 h-6 text-primary" />
        <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
        <div className="flex items-center gap-1 ml-auto">
          <Zap className="w-4 h-4 text-accent" />
          <span className="text-sm text-accent font-medium">Powered by AI</span>
        </div>
      </div>

      {/* Camera View */}
      <div className="relative mb-6">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-48 bg-gray-900 rounded-lg object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Camera Controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3">
          <button
            onClick={captureAndAnalyze}
            disabled={isAnalyzing}
            className="bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAnalyzing ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera className="w-6 h-6" />
            )}
          </button>
          
          <button
            onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
            className={`p-3 rounded-full shadow-lg transition-colors ${
              isRecording 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-accent text-white hover:bg-accent/90'
            }`}
          >
            {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Recording...
          </div>
        )}
      </div>

      {/* Voice Prompt Display */}
      {currentPrompt && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Voice Prompt:</p>
          <p className="text-gray-900">{currentPrompt}</p>
        </div>
      )}

      {/* Recent Results */}
      {recentResults.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Recent AI Analysis</h4>
          {recentResults.map((result) => (
            <div key={result.id} className="border border-gray-200 rounded-lg p-4">
              {'issue_type' in result ? (
                // AI Detection Result
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(result.severity)}`}>
                      {getSeverityIcon(result.severity)}
                      {result.severity.toUpperCase()}
                    </div>
                    <span className="text-xs text-gray-500">
                      {Math.round(result.confidence * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 mb-2">{result.description}</p>
                  <p className="text-xs text-gray-600">Location: {result.location}</p>
                  {result.recommendations.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700 mb-1">Recommendations:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {result.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-primary">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                // Voice Prompt Result
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-blue-600">
                      <Mic className="w-3 h-3" />
                      VOICE RESPONSE
                    </div>
                    <span className="text-xs text-gray-500">
                      {Math.round(result.confidence * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">Q: {result.prompt}</p>
                  <p className="text-sm text-gray-900">{result.response}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-3">Quick Voice Commands:</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            "Is this brake pad below spec?",
            "Check tire tread depth",
            "Analyze fluid leak",
            "Inspect belt condition"
          ].map((command, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPrompt(command)}
              className="text-xs text-left p-2 bg-gray-50 hover:bg-gray-100 rounded border transition-colors"
            >
              "{command}"
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
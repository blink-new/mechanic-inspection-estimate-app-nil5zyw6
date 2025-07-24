import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Video, Square, Pause, Play, Mic, Tag, AlertTriangle } from 'lucide-react'
import { useVoiceCommands } from '../../hooks/useVoiceCommands'

interface VideoIssue {
  id: string
  timestamp: number
  issue: string
  severity: 'critical' | 'major' | 'minor' | 'advisory'
  timeInVideo: number
}

interface VoiceVideoRecorderProps {
  onVideoSave?: (videoBlob: Blob, issues: VideoIssue[]) => void
  className?: string
}

export const VoiceVideoRecorder: React.FC<VoiceVideoRecorderProps> = ({
  onVideoSave,
  className = ''
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [issues, setIssues] = useState<VideoIssue[]>([])
  const [stream, setStream] = useState<MediaStream | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Recording functions
  const startRecording = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      })

      setStream(mediaStream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }

      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: 'video/webm;codecs=vp9'
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(chunksRef.current, { type: 'video/webm' })
        onVideoSave?.(videoBlob, issues)
        chunksRef.current = []
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(1000) // Collect data every second

      setIsRecording(true)
      setIsPaused(false)
      setRecordingTime(0)
      setIssues([])
      startTimeRef.current = Date.now()

    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not start recording. Please check camera permissions.')
    }
  }, [issues, onVideoSave])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        setStream(null)
      }

      setIsRecording(false)
      setIsPaused(false)
      setRecordingTime(0)
    }
  }, [isRecording, stream])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
    }
  }, [isRecording])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
    }
  }, [isRecording, isPaused])

  // Voice command handlers
  const handleFormFill = useCallback((field: string, value: string) => {
    // This would be handled by parent component
    console.log('Voice form fill:', field, value)
  }, [])

  const handleIssueTag = useCallback((issue: string, severity: string) => {
    if (!isRecording) return

    const currentTime = Date.now()
    const timeInVideo = currentTime - startTimeRef.current

    const newIssue: VideoIssue = {
      id: `issue_${currentTime}`,
      timestamp: currentTime,
      issue: issue.trim(),
      severity: severity as VideoIssue['severity'],
      timeInVideo
    }

    setIssues(prev => [...prev, newIssue])
  }, [isRecording])

  const handleVideoCommand = useCallback((command: string) => {
    switch (command) {
      case 'start':
        if (!isRecording) startRecording()
        break
      case 'stop':
        if (isRecording) stopRecording()
        break
      case 'pause':
        if (isRecording && !isPaused) pauseRecording()
        break
      case 'resume':
        if (isRecording && isPaused) resumeRecording()
        break
    }
  }, [isRecording, isPaused, startRecording, stopRecording, pauseRecording, resumeRecording])

  const { isListening, transcript, toggleListening } = useVoiceCommands({
    onFormFill: handleFormFill,
    onIssueTag: handleIssueTag,
    onVideoCommand: handleVideoCommand,
    isRecording
  })

  // Timer effect
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime(Date.now() - startTimeRef.current)
      }, 100)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording, isPaused])

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getSeverityColor = (severity: VideoIssue['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400'
      case 'major': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400'
      case 'minor': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'advisory': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Video className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Voice-Controlled Video Recording
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {isRecording && (
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
              <span className="font-mono text-lg">{formatTime(recordingTime)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Video Preview */}
      <div className="relative mb-6">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-64 bg-gray-900 rounded-lg object-cover"
        />
        
        {!isRecording && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 rounded-lg">
            <div className="text-center text-white">
              <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm opacity-75">Click start to begin recording</p>
            </div>
          </div>
        )}

        {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
            <div className="text-center text-white">
              <Pause className="h-12 w-12 mx-auto mb-2" />
              <p className="text-sm">Recording Paused</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Video className="h-5 w-5" />
            <span>Start Recording</span>
          </button>
        ) : (
          <>
            <button
              onClick={stopRecording}
              className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Square className="h-5 w-5" />
              <span>Stop</span>
            </button>
            
            <button
              onClick={isPaused ? resumeRecording : pauseRecording}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isPaused ? (
                <>
                  <Play className="h-5 w-5" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause className="h-5 w-5" />
                  <span>Pause</span>
                </>
              )}
            </button>
          </>
        )}

        <button
          onClick={toggleListening}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            isListening
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
          }`}
        >
          <Mic className="h-5 w-5" />
          <span>{isListening ? 'Voice Active' : 'Voice Inactive'}</span>
        </button>
      </div>

      {/* Live transcript */}
      {transcript && isRecording && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2 mb-2">
            <Mic className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Live Voice Input:</span>
          </div>
          <p className="text-blue-800 dark:text-blue-200">{transcript}</p>
        </div>
      )}

      {/* Tagged Issues */}
      {issues.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Tag className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
              Tagged Issues ({issues.length})
            </h4>
          </div>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {issue.issue}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      At {formatTime(issue.timeInVideo)}
                    </p>
                  </div>
                </div>
                
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                  {issue.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voice Commands Help */}
      {isRecording && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Voice Commands While Recording:
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
            <div>"Critical issue brake pads worn"</div>
            <div>"Major problem oil leak detected"</div>
            <div>"Minor issue tire pressure low"</div>
            <div>"Recommend air filter replacement"</div>
            <div>"Stop recording"</div>
            <div>"Pause video"</div>
          </div>
        </div>
      )}
    </div>
  )
}
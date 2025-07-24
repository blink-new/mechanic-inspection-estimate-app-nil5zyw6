import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

interface VoiceCommand {
  command: string
  action: (params: string[]) => void
  patterns: RegExp[]
}

interface UseVoiceCommandsProps {
  onFormFill?: (field: string, value: string) => void
  onIssueTag?: (issue: string, severity: string) => void
  onVideoCommand?: (command: string) => void
  isRecording?: boolean
}

export const useVoiceCommands = ({
  onFormFill,
  onIssueTag,
  onVideoCommand,
  isRecording = false
}: UseVoiceCommandsProps) => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Voice commands configuration
  const commands = useMemo<VoiceCommand[]>(() => [
    // Form filling commands
    {
      command: 'fill_make',
      action: (params) => onFormFill?.('make', params.join(' ')),
      patterns: [/(?:set|fill|enter) (?:make|manufacturer) (?:to|as) (.+)/i]
    },
    {
      command: 'fill_model',
      action: (params) => onFormFill?.('model', params.join(' ')),
      patterns: [/(?:set|fill|enter) model (?:to|as) (.+)/i]
    },
    {
      command: 'fill_year',
      action: (params) => onFormFill?.('year', params[0]),
      patterns: [/(?:set|fill|enter) year (?:to|as) (\d{4})/i]
    },
    {
      command: 'fill_mileage',
      action: (params) => onFormFill?.('mileage', params[0]),
      patterns: [/(?:set|fill|enter) (?:mileage|miles) (?:to|as) ([\d,]+)/i]
    },
    {
      command: 'fill_vin',
      action: (params) => onFormFill?.('vin', params[0]),
      patterns: [/(?:set|fill|enter) (?:vin|vehicle identification number) (?:to|as) ([A-Z0-9]+)/i]
    },
    {
      command: 'fill_customer_name',
      action: (params) => onFormFill?.('customerName', params.join(' ')),
      patterns: [/(?:set|fill|enter) (?:customer|owner) name (?:to|as) (.+)/i]
    },
    {
      command: 'fill_customer_phone',
      action: (params) => onFormFill?.('customerPhone', params[0]),
      patterns: [/(?:set|fill|enter) (?:customer|phone) (?:number|phone) (?:to|as) ([\d\-()s]+)/i]
    },
    {
      command: 'fill_customer_email',
      action: (params) => onFormFill?.('customerEmail', params[0]),
      patterns: [/(?:set|fill|enter) (?:customer|email) (?:address|email) (?:to|as) ([^\s]+@[^\s]+)/i]
    },

    // Issue tagging commands (for video recording)
    {
      command: 'tag_critical_issue',
      action: (params) => onIssueTag?.(params.join(' '), 'critical'),
      patterns: [
        /(?:tag|mark|note) (?:critical|urgent|severe) (?:issue|problem) (.+)/i,
        /critical (?:issue|problem) (.+)/i
      ]
    },
    {
      command: 'tag_major_issue',
      action: (params) => onIssueTag?.(params.join(' '), 'major'),
      patterns: [
        /(?:tag|mark|note) (?:major|important) (?:issue|problem) (.+)/i,
        /major (?:issue|problem) (.+)/i
      ]
    },
    {
      command: 'tag_minor_issue',
      action: (params) => onIssueTag?.(params.join(' '), 'minor'),
      patterns: [
        /(?:tag|mark|note) (?:minor|small) (?:issue|problem) (.+)/i,
        /minor (?:issue|problem) (.+)/i
      ]
    },
    {
      command: 'tag_advisory',
      action: (params) => onIssueTag?.(params.join(' '), 'advisory'),
      patterns: [
        /(?:tag|mark|note) (?:advisory|recommendation) (.+)/i,
        /(?:recommend|suggest) (.+)/i
      ]
    },

    // Video recording commands
    {
      command: 'start_recording',
      action: () => onVideoCommand?.('start'),
      patterns: [/(?:start|begin) (?:recording|video)/i]
    },
    {
      command: 'stop_recording',
      action: () => onVideoCommand?.('stop'),
      patterns: [/(?:stop|end) (?:recording|video)/i]
    },
    {
      command: 'pause_recording',
      action: () => onVideoCommand?.('pause'),
      patterns: [/pause (?:recording|video)/i]
    },
    {
      command: 'resume_recording',
      action: () => onVideoCommand?.('resume'),
      patterns: [/resume (?:recording|video)/i]
    }
  ], [onFormFill, onIssueTag, onVideoCommand])

  // Process voice commands
  const processVoiceCommand = useCallback((text: string) => {
    const cleanText = text.trim().toLowerCase()
    
    for (const command of commands) {
      for (const pattern of command.patterns) {
        const match = cleanText.match(pattern)
        if (match) {
          const params = match.slice(1).filter(Boolean)
          command.action(params)
          return
        }
      }
    }
  }, [commands])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        setIsSupported(true)
        const recognition = new SpeechRecognition()
        
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'
        
        recognition.onresult = (event) => {
          let finalTranscript = ''
          let interimTranscript = ''
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }
          
          setTranscript(finalTranscript || interimTranscript)
          
          if (finalTranscript) {
            processVoiceCommand(finalTranscript)
          }
        }
        
        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
        }
        
        recognition.onend = () => {
          setIsListening(false)
        }
        
        recognitionRef.current = recognition
      }
    }
  }, [processVoiceCommand])

  // Start listening
  const startListening = useCallback(() => {
    if (recognitionRef.current && isSupported) {
      setIsListening(true)
      setTranscript('')
      recognitionRef.current.start()
    }
  }, [isSupported])

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [])

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    toggleListening
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}
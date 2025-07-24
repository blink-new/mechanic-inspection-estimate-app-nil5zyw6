import React from 'react'
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { useVoiceCommands } from '../../hooks/useVoiceCommands'

interface VoiceCommandPanelProps {
  onFormFill?: (field: string, value: string) => void
  onIssueTag?: (issue: string, severity: string) => void
  onVideoCommand?: (command: string) => void
  isRecording?: boolean
  className?: string
}

export const VoiceCommandPanel: React.FC<VoiceCommandPanelProps> = ({
  onFormFill,
  onIssueTag,
  onVideoCommand,
  isRecording = false,
  className = ''
}) => {
  const {
    isListening,
    transcript,
    isSupported,
    toggleListening
  } = useVoiceCommands({
    onFormFill,
    onIssueTag,
    onVideoCommand,
    isRecording
  })

  if (!isSupported) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <VolumeX className="h-5 w-5 text-red-500" />
          <span className="text-red-700 dark:text-red-300 text-sm">
            Voice commands not supported in this browser
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Volume2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Voice Commands
          </h3>
        </div>
        
        <button
          onClick={toggleListening}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isListening
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="h-4 w-4" />
              <span>Stop Listening</span>
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              <span>Start Listening</span>
            </>
          )}
        </button>
      </div>

      {/* Status indicator */}
      <div className="flex items-center space-x-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${
          isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'
        }`} />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {isListening ? 'Listening for commands...' : 'Voice commands inactive'}
        </span>
      </div>

      {/* Live transcript */}
      {transcript && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">Transcript:</span> {transcript}
          </p>
        </div>
      )}

      {/* Command examples */}
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Form Filling Commands:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
            <div>"Set make to Toyota"</div>
            <div>"Fill model as Camry"</div>
            <div>"Enter year as 2020"</div>
            <div>"Set mileage to 45,000"</div>
            <div>"Fill customer name as John Smith"</div>
            <div>"Enter phone as 555-1234"</div>
          </div>
        </div>

        {isRecording && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Issue Tagging Commands:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
              <div>"Critical issue brake pads worn"</div>
              <div>"Major problem oil leak"</div>
              <div>"Minor issue tire pressure low"</div>
              <div>"Recommend air filter replacement"</div>
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Video Commands:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
            <div>"Start recording"</div>
            <div>"Stop recording"</div>
            <div>"Pause video"</div>
            <div>"Resume recording"</div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          <span className="font-medium">Tip:</span> Speak clearly and wait for the green indicator. 
          Commands work best in quiet environments.
        </p>
      </div>
    </div>
  )
}
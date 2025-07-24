import React, { useState, useEffect } from 'react'
import { 
  Brain, 
  Video, 
  Car, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock,
  Camera,
  Mic,
  TrendingUp,
  Users,
  Archive
} from 'lucide-react'
import { createClient } from '../../blink/client'
import { AIAssistant } from '../ai/AIAssistant'
import { LiveStreamViewer } from '../ai/LiveStreamViewer'
import { DigitalTwinDashboard } from '../ai/DigitalTwinDashboard'
import { VoiceVideoRecorder } from '../voice/VoiceVideoRecorder'
import { InspectionChecklist } from './InspectionChecklist'
import type { AIDetectionResult, VoicePromptResult } from '../../types/ai'

const blink = createClient()

interface EnhancedInspectionPageProps {
  inspectionId: string
  vehicleData: any
}

export function EnhancedInspectionPage({ inspectionId, vehicleData }: EnhancedInspectionPageProps) {
  const [activeTab, setActiveTab] = useState<'checklist' | 'ai' | 'stream' | 'twin'>('checklist')
  const [aiDetections, setAiDetections] = useState<AIDetectionResult[]>([])
  const [voiceResults, setVoiceResults] = useState<VoicePromptResult[]>([])
  const [predictiveAlerts, setPredictiveAlerts] = useState<any[]>([])

  useEffect(() => {
    const loadPredictiveAlerts = async () => {
      try {
        const { AIService } = await import('../../services/aiService')
        const alerts = await AIService.generatePredictiveAlerts(vehicleData.id)
        setPredictiveAlerts(alerts)
      } catch (error) {
        console.error('Failed to load predictive alerts:', error)
      }
    }

    loadPredictiveAlerts()
  }, [vehicleData.id])

  const handleAIDetection = (result: AIDetectionResult) => {
    setAiDetections(prev => [result, ...prev.slice(0, 9)])
    
    // Show notification for critical issues
    if (result.severity === 'critical') {
      // You could add a toast notification here
      console.log('Critical issue detected:', result.description)
    }
  }

  const handleVoiceResult = (result: VoicePromptResult) => {
    setVoiceResults(prev => [result, ...prev.slice(0, 9)])
  }

  const handleDocumentIssue = (item: any) => {
    // Switch to AI tab for documentation
    setActiveTab('ai')
  }

  const tabs = [
    { id: 'checklist', label: 'Inspection', icon: CheckCircle, color: 'text-blue-600' },
    { id: 'ai', label: 'AI Assistant', icon: Brain, color: 'text-purple-600' },
    { id: 'stream', label: 'Live Stream', icon: Video, color: 'text-red-600' },
    { id: 'twin', label: 'Digital Twin', icon: Car, color: 'text-green-600' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Car className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {vehicleData.year} {vehicleData.make} {vehicleData.model}
                  </h1>
                  <p className="text-sm text-gray-600">
                    Customer: {vehicleData.customerName} • VIN: {vehicleData.vin?.slice(-8)}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Insights Summary */}
            <div className="flex items-center gap-4">
              {aiDetections.length > 0 && (
                <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm">
                  <Brain className="w-4 h-4" />
                  {aiDetections.length} AI Detection{aiDetections.length !== 1 ? 's' : ''}
                </div>
              )}
              
              {predictiveAlerts.length > 0 && (
                <div className="flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm">
                  <TrendingUp className="w-4 h-4" />
                  {predictiveAlerts.length} Predictive Alert{predictiveAlerts.length !== 1 ? 's' : ''}
                </div>
              )}

              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                <Archive className="w-4 h-4" />
                Inspection #{inspectionId.slice(-6)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary' : tab.color}`} />
                {tab.label}
                
                {/* Badge indicators */}
                {tab.id === 'ai' && (aiDetections.length > 0 || voiceResults.length > 0) && (
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
                    {aiDetections.length + voiceResults.length}
                  </span>
                )}
                
                {tab.id === 'twin' && predictiveAlerts.length > 0 && (
                  <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full">
                    {predictiveAlerts.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'checklist' && (
          <div className="space-y-6">
            {/* Quick AI Insights */}
            {(aiDetections.length > 0 || predictiveAlerts.length > 0) && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Recent AI Detections */}
                  {aiDetections.slice(0, 2).map((detection) => (
                    <div key={detection.id} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          detection.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          detection.severity === 'major' ? 'bg-orange-100 text-orange-800' :
                          detection.severity === 'minor' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {detection.issue_type.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {Math.round(detection.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 mb-1">{detection.description}</p>
                      <p className="text-xs text-gray-600">Location: {detection.location}</p>
                    </div>
                  ))}
                  
                  {/* Predictive Alerts */}
                  {predictiveAlerts.slice(0, 2).map((alert) => (
                    <div key={alert.id} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          alert.priority === 'high' ? 'bg-red-100 text-red-800' :
                          alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          PREDICTIVE
                        </span>
                        <span className="text-xs text-gray-500">
                          ${alert.cost_estimate}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 mb-1">{alert.component}</p>
                      <p className="text-xs text-gray-600">{alert.recommended_action}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setActiveTab('ai')}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    View AI Assistant →
                  </button>
                  <button
                    onClick={() => setActiveTab('twin')}
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    View Digital Twin →
                  </button>
                </div>
              </div>
            )}

            {/* Standard Inspection Checklist */}
            <InspectionChecklist 
              vehicleData={vehicleData} 
              onDocumentIssue={handleDocumentIssue}
            />
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6">
            {/* Voice Video Recorder */}
            <VoiceVideoRecorder 
              onVideoSave={(videoBlob, issues) => {
                console.log('Video saved with issues:', issues)
                // Save video and tagged issues to database
                issues.forEach(issue => {
                  handleAIDetection({
                    id: issue.id,
                    issue_type: issue.severity,
                    description: issue.issue,
                    severity: issue.severity,
                    confidence: 1.0,
                    location: 'Video Recording',
                    timestamp: new Date().toISOString(),
                    image_url: '',
                    bounding_box: null
                  })
                })
              }}
            />
            
            <AIAssistant
              inspectionId={inspectionId}
              onDetectionResult={handleAIDetection}
              onVoiceResult={handleVoiceResult}
            />
            
            {/* AI Results Summary */}
            {(aiDetections.length > 0 || voiceResults.length > 0) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Analysis Summary</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* AI Detections */}
                  {aiDetections.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Visual Analysis Results</h4>
                      <div className="space-y-3">
                        {aiDetections.slice(0, 5).map((detection) => (
                          <div key={detection.id} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                detection.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                detection.severity === 'major' ? 'bg-orange-100 text-orange-800' :
                                detection.severity === 'minor' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {detection.issue_type.toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-500">
                                {Math.round(detection.confidence * 100)}%
                              </span>
                            </div>
                            <p className="text-sm text-gray-900">{detection.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Voice Results */}
                  {voiceResults.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Voice Assistant Results</h4>
                      <div className="space-y-3">
                        {voiceResults.slice(0, 5).map((result) => (
                          <div key={result.id} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 text-xs font-medium text-blue-600">
                                <Mic className="w-3 h-3" />
                                VOICE
                              </div>
                              <span className="text-xs text-gray-500">
                                {Math.round(result.confidence * 100)}%
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mb-1">Q: {result.prompt}</p>
                            <p className="text-sm text-gray-900">{result.response}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stream' && (
          <LiveStreamViewer
            inspectionId={inspectionId}
            customerId={vehicleData.customerId || 'demo-customer'}
          />
        )}

        {activeTab === 'twin' && (
          <DigitalTwinDashboard
            vehicleId={vehicleData.id}
            vehicleInfo={vehicleData}
          />
        )}
      </div>
    </div>
  )
}
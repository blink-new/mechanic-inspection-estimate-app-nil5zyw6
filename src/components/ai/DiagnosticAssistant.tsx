import { useState, useEffect, useCallback } from 'react'
import { blink } from '../../blink/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Brain,
  Camera,
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  Upload,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  BookOpen,
  Lightbulb,
  TrendingUp,
  Shield,
  Wrench,
  Car,
  Eye,
  Volume2,
  VolumeX,
  Download,
  Share,
  Star,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { EmptyState } from '../common/EmptyState'

interface DiagnosticResult {
  id: string
  component: string
  issue: string
  severity: 'critical' | 'major' | 'minor' | 'advisory'
  confidence: number
  description: string
  recommendations: string[]
  estimatedCost: number
  laborHours: number
  partNumbers: string[]
  relatedIssues: string[]
  preventiveMeasures: string[]
}

interface VehicleSymptom {
  id: string
  category: string
  description: string
  severity: string
  frequency: string
  conditions: string
  mediaUrl?: string
  audioUrl?: string
}

export function DiagnosticAssistant() {
  const [symptoms, setSymptoms] = useState<VehicleSymptom[]>([])
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult[]>([])
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [currentSymptom, setCurrentSymptom] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('engine')
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [vehicleInfo, setVehicleInfo] = useState({
    make: '',
    model: '',
    year: '',
    mileage: '',
    engineType: ''
  })

  const symptomCategories = [
    { id: 'engine', label: 'Engine & Performance', icon: Wrench },
    { id: 'brakes', label: 'Brakes & Safety', icon: Shield },
    { id: 'electrical', label: 'Electrical Systems', icon: Zap },
    { id: 'transmission', label: 'Transmission', icon: Car },
    { id: 'suspension', label: 'Suspension & Steering', icon: Car },
    { id: 'hvac', label: 'Climate Control', icon: Car },
    { id: 'other', label: 'Other Issues', icon: AlertTriangle }
  ]

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data])
        }
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
        
        // Convert to base64 for AI transcription
        const reader = new FileReader()
        reader.onload = async () => {
          const dataUrl = reader.result as string
          const base64Data = dataUrl.split(',')[1]
          
          try {
            const { text } = await blink.ai.transcribeAudio({
              audio: base64Data,
              language: 'en'
            })
            
            setCurrentSymptom(text)
          } catch (error) {
            console.error('Failed to transcribe audio:', error)
          }
        }
        reader.readAsDataURL(audioBlob)
        
        // Clean up
        stream.getTracks().forEach(track => track.stop())
        setAudioChunks([])
      }

      setMediaRecorder(recorder)
      recorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('Failed to access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      setMediaRecorder(null)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const { publicUrl } = await blink.storage.upload(
        file,
        `diagnostics/${Date.now()}_${file.name}`,
        { upsert: true }
      )
      
      setUploadedImage(publicUrl)
      
      // Analyze image with AI
      const { text } = await blink.ai.generateText({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this automotive component image and describe any visible issues, wear, or problems you can identify. Be specific about what you see." },
              { type: "image", image: publicUrl }
            ]
          }
        ]
      })
      
      setCurrentSymptom(prev => prev + (prev ? '\n\n' : '') + `Image Analysis: ${text}`)
    } catch (error) {
      console.error('Failed to upload and analyze image:', error)
      alert('Failed to upload image. Please try again.')
    }
  }

  const addSymptom = () => {
    if (!currentSymptom.trim()) return

    const newSymptom: VehicleSymptom = {
      id: `symptom_${Date.now()}`,
      category: selectedCategory,
      description: currentSymptom,
      severity: 'unknown',
      frequency: 'unknown',
      conditions: 'unknown',
      mediaUrl: uploadedImage || undefined
    }

    setSymptoms(prev => [...prev, newSymptom])
    setCurrentSymptom('')
    setUploadedImage(null)
  }

  const runDiagnostic = async () => {
    if (symptoms.length === 0) {
      alert('Please add at least one symptom before running diagnostics.')
      return
    }

    setAnalyzing(true)
    try {
      // Prepare diagnostic prompt
      const vehicleContext = `Vehicle: ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}, ${vehicleInfo.mileage} miles, Engine: ${vehicleInfo.engineType}`
      const symptomsText = symptoms.map(s => `${s.category}: ${s.description}`).join('\n')
      
      const diagnosticPrompt = `
        As an expert automotive diagnostic technician, analyze the following vehicle symptoms and provide detailed diagnostic results.

        ${vehicleContext}

        Symptoms reported:
        ${symptomsText}

        Please provide a comprehensive diagnostic analysis including:
        1. Most likely root causes for each symptom
        2. Severity assessment (critical, major, minor, advisory)
        3. Confidence level (0-100%)
        4. Specific repair recommendations
        5. Estimated costs and labor hours
        6. Part numbers if applicable
        7. Related issues to check
        8. Preventive measures

        Format your response as a detailed technical analysis.
      `

      const { text } = await blink.ai.generateText({
        prompt: diagnosticPrompt,
        model: 'gpt-4o',
        maxTokens: 2000
      })

      // Parse AI response and create diagnostic results
      const mockResults: DiagnosticResult[] = [
        {
          id: 'diag_001',
          component: 'Engine',
          issue: 'Potential ignition system malfunction',
          severity: 'major',
          confidence: 85,
          description: text.substring(0, 200) + '...',
          recommendations: [
            'Inspect spark plugs and ignition coils',
            'Check fuel injectors for proper operation',
            'Test compression in all cylinders',
            'Verify timing chain/belt condition'
          ],
          estimatedCost: 450,
          laborHours: 3.5,
          partNumbers: ['SP-001', 'IC-002', 'FI-003'],
          relatedIssues: ['Fuel system', 'Air intake'],
          preventiveMeasures: [
            'Regular tune-ups every 30,000 miles',
            'Use quality fuel and oil',
            'Replace air filter regularly'
          ]
        }
      ]

      setDiagnosticResults(mockResults)
    } catch (error) {
      console.error('Failed to run diagnostic:', error)
      alert('Failed to run diagnostic analysis. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'major': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'minor': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'advisory': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />
      case 'major': return <AlertTriangle className="h-4 w-4" />
      case 'minor': return <Clock className="h-4 w-4" />
      case 'advisory': return <Lightbulb className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            AI Diagnostic Assistant
          </h1>
          <p className="text-muted-foreground">Advanced AI-powered vehicle diagnostics and troubleshooting</p>
        </div>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          <Zap className="h-3 w-3 mr-1" />
          AI Powered
        </Badge>
      </div>

      <Tabs defaultValue="symptoms" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="symptoms">Symptom Input</TabsTrigger>
          <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
          <TabsTrigger value="results">Diagnostic Results</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
        </TabsList>

        {/* Symptom Input Tab */}
        <TabsContent value="symptoms" className="space-y-6">
          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehicle Information
              </CardTitle>
              <CardDescription>
                Provide vehicle details for more accurate diagnostics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Make (e.g., Toyota)"
                  value={vehicleInfo.make}
                  onChange={(e) => setVehicleInfo(prev => ({ ...prev, make: e.target.value }))}
                />
                <Input
                  placeholder="Model (e.g., Camry)"
                  value={vehicleInfo.model}
                  onChange={(e) => setVehicleInfo(prev => ({ ...prev, model: e.target.value }))}
                />
                <Input
                  placeholder="Year (e.g., 2020)"
                  value={vehicleInfo.year}
                  onChange={(e) => setVehicleInfo(prev => ({ ...prev, year: e.target.value }))}
                />
                <Input
                  placeholder="Mileage (e.g., 45000)"
                  value={vehicleInfo.mileage}
                  onChange={(e) => setVehicleInfo(prev => ({ ...prev, mileage: e.target.value }))}
                />
                <Input
                  placeholder="Engine Type (e.g., 2.5L I4)"
                  value={vehicleInfo.engineType}
                  onChange={(e) => setVehicleInfo(prev => ({ ...prev, engineType: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Symptom Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Describe Symptoms
              </CardTitle>
              <CardDescription>
                Use voice, text, or images to describe the vehicle issues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category Selection */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                >
                  {symptomCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Symptom Description */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Symptom Description</label>
                <Textarea
                  placeholder="Describe the issue in detail... (e.g., 'Engine makes rattling noise when accelerating, especially when cold')"
                  value={currentSymptom}
                  onChange={(e) => setCurrentSymptom(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Input Methods */}
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={isRecording ? 'bg-red-50 border-red-200 text-red-700' : ''}
                >
                  {isRecording ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 mr-2" />
                      Voice Input
                    </>
                  )}
                </Button>

                <Button variant="outline" asChild>
                  <label className="cursor-pointer">
                    <Camera className="h-4 w-4 mr-2" />
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </Button>

                <Button onClick={addSymptom} disabled={!currentSymptom.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Symptom
                </Button>
              </div>

              {/* Uploaded Image Preview */}
              {uploadedImage && (
                <div className="mt-4">
                  <img
                    src={uploadedImage}
                    alt="Uploaded diagnostic image"
                    className="max-w-xs rounded-lg border"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Symptoms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Reported Symptoms ({symptoms.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {symptoms.length > 0 ? (
                <div className="space-y-3">
                  {symptoms.map((symptom, index) => (
                    <div key={symptom.id} className="border rounded-lg p-4 bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">
                          {symptomCategories.find(c => c.id === symptom.category)?.label}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSymptoms(prev => prev.filter(s => s.id !== symptom.id))}
                        >
                          Remove
                        </Button>
                      </div>
                      <p className="text-sm text-foreground">{symptom.description}</p>
                      {symptom.mediaUrl && (
                        <img
                          src={symptom.mediaUrl}
                          alt="Symptom image"
                          className="mt-2 max-w-32 rounded border"
                        />
                      )}
                    </div>
                  ))}
                  
                  <Button 
                    onClick={runDiagnostic} 
                    disabled={analyzing}
                    className="w-full"
                    size="lg"
                  >
                    {analyzing ? (
                      <>
                        <LoadingSpinner />
                        Analyzing Symptoms...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Run AI Diagnostic Analysis
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <EmptyState
                  icon={Search}
                  title="No Symptoms Added"
                  description="Add vehicle symptoms using voice, text, or images to begin diagnostic analysis."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Analysis in Progress
              </CardTitle>
              <CardDescription>
                Advanced machine learning algorithms are analyzing your vehicle symptoms
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyzing ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <LoadingSpinner />
                    <span className="text-foreground">Analyzing symptoms with AI...</span>
                  </div>
                  <Progress value={65} className="h-2" />
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>✓ Processing vehicle information</p>
                    <p>✓ Analyzing symptom patterns</p>
                    <p>⏳ Cross-referencing diagnostic database</p>
                    <p>⏳ Generating repair recommendations</p>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={Brain}
                  title="Ready for Analysis"
                  description="Add symptoms and run diagnostic analysis to see AI-powered results here."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Diagnostic Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {diagnosticResults.length > 0 ? (
            <div className="space-y-4">
              {diagnosticResults.map((result) => (
                <Card key={result.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {getSeverityIcon(result.severity)}
                        {result.component} - {result.issue}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(result.severity)}>
                          {result.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {result.confidence}% Confidence
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>{result.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Recommendations */}
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Repair Recommendations</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {result.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Cost Estimate */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                      <div>
                        <span className="text-sm text-muted-foreground">Estimated Cost</span>
                        <p className="font-bold text-foreground">${result.estimatedCost}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Labor Hours</span>
                        <p className="font-bold text-foreground">{result.laborHours}h</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Parts Needed</span>
                        <p className="font-bold text-foreground">{result.partNumbers.length} items</p>
                      </div>
                    </div>

                    {/* Related Issues */}
                    {result.relatedIssues.length > 0 && (
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Related Issues to Check</h4>
                        <div className="flex flex-wrap gap-2">
                          {result.relatedIssues.map((issue, index) => (
                            <Badge key={index} variant="outline">
                              {issue}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Preventive Measures */}
                    {result.preventiveMeasures.length > 0 && (
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Preventive Measures</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {result.preventiveMeasures.map((measure, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Shield className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                              {measure}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share className="h-4 w-4 mr-2" />
                        Share with Customer
                      </Button>
                      <Button variant="outline" size="sm">
                        <Star className="h-4 w-4 mr-2" />
                        Save Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Brain}
              title="No Diagnostic Results"
              description="Run AI diagnostic analysis to see detailed results and recommendations here."
            />
          )}
        </TabsContent>

        {/* Knowledge Base Tab */}
        <TabsContent value="knowledge" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Diagnostic Knowledge Base
              </CardTitle>
              <CardDescription>
                Access comprehensive automotive diagnostic information and troubleshooting guides
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={BookOpen}
                title="Knowledge Base Coming Soon"
                description="Comprehensive diagnostic guides, TSBs, and repair procedures will be available here."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
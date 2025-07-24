import { useState, useEffect, useCallback } from 'react'
import { blink } from '../../blink/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  MessageSquare, 
  Video, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  DollarSign,
  Car,
  Calendar,
  Phone,
  Mail,
  Download,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Send,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Camera,
  Star,
  User,
  Wrench,
  Shield,
  Zap
} from 'lucide-react'
import { format } from 'date-fns'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { EmptyState } from '../common/EmptyState'

interface CustomerPortalProps {
  inspectionId?: string
}

interface CustomerInspection {
  id: string
  vehicle: {
    make: string
    model: string
    year: number
    vin: string
    mileage: number
    licensePlate: string
    color: string
  }
  customer: {
    name: string
    email: string
    phone: string
  }
  status: 'draft' | 'in-progress' | 'completed' | 'sent-to-customer' | 'approved' | 'declined'
  progress: number
  totalEstimate: number
  createdAt: string
  completedAt?: string
  mechanicNotes: string
  categories: any[]
  messages: any[]
  estimates: any[]
  media: any[]
  inspectionItems: any[]
}

export function CustomerPortal({ inspectionId }: CustomerPortalProps) {
  const [inspection, setInspection] = useState<CustomerInspection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [videoPlaying, setVideoPlaying] = useState(false)
  const [videoMuted, setVideoMuted] = useState(false)
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'declined'>('pending')
  const [customerSignature, setCustomerSignature] = useState('')

  const loadInspectionData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // For demo purposes, use the demo inspection
      const targetInspectionId = inspectionId || 'inspection_demo_001'

      // Load inspection details
      const inspectionData = await blink.db.inspections.list({
        where: { id: targetInspectionId },
        limit: 1
      })

      if (inspectionData.length === 0) {
        throw new Error('Inspection not found')
      }

      const inspectionRecord = inspectionData[0]

      // Load vehicle data
      const vehicleData = await blink.db.vehicles.list({
        where: { id: inspectionRecord.vehicleId || inspectionRecord.vehicle_id },
        limit: 1
      })

      // Load messages
      const messages = await blink.db.customer_messages.list({
        where: { inspectionId: targetInspectionId },
        orderBy: { createdAt: 'asc' }
      })

      // Load estimates
      const estimates = await blink.db.estimate_items.list({
        where: { inspectionId: targetInspectionId }
      })

      // Load inspection items for progress calculation and media
      const inspectionItems = await blink.db.inspection_items.list({
        where: { inspectionId: targetInspectionId }
      })

      // Load media files for each inspection item
      const mediaPromises = inspectionItems.map(async (item) => {
        const itemMedia = await blink.db.inspection_media.list({
          where: { inspectionItemId: item.id }
        })
        return itemMedia.map(media => ({
          ...media,
          component: item.itemName || item.item_name,
          type: media.mediaType || media.media_type,
          url: media.mediaUrl || media.media_url,
          thumbnailUrl: media.mediaUrl || media.media_url
        }))
      })

      const allMedia = (await Promise.all(mediaPromises)).flat()

      const completedItems = inspectionItems.filter(item => item.status !== 'pending').length
      const progress = inspectionItems.length > 0 ? (completedItems / inspectionItems.length) * 100 : 0

      const vehicle = vehicleData[0] || {}
      
      const customerInspection: CustomerInspection = {
        id: inspectionRecord.id,
        vehicle: {
          make: vehicle.make || 'Unknown',
          model: vehicle.model || 'Unknown',
          year: vehicle.year || 0,
          vin: vehicle.vin || '',
          mileage: vehicle.mileage || 0,
          licensePlate: vehicle.licensePlate || vehicle.license_plate || '',
          color: vehicle.color || 'Unknown'
        },
        customer: {
          name: inspectionRecord.customerName || inspectionRecord.customer_name || vehicle.customerName || vehicle.customer_name || 'Unknown Customer',
          email: inspectionRecord.customerEmail || inspectionRecord.customer_email || vehicle.customerEmail || vehicle.customer_email || '',
          phone: inspectionRecord.customerPhone || inspectionRecord.customer_phone || vehicle.customerPhone || vehicle.customer_phone || ''
        },
        status: inspectionRecord.status,
        progress,
        totalEstimate: estimates.reduce((sum, est) => sum + (est.total || 0), 0),
        createdAt: inspectionRecord.createdAt || inspectionRecord.created_at,
        completedAt: inspectionRecord.completedAt || inspectionRecord.completed_at,
        mechanicNotes: inspectionRecord.mechanicNotes || inspectionRecord.mechanic_notes || '',
        categories: [], // Will be populated from inspection items
        messages: messages.map(msg => ({
          ...msg,
          type: msg.messageType || msg.message_type,
          fromMechanic: msg.fromMechanic || msg.from_mechanic,
          read: msg.read || msg.is_read,
          createdAt: msg.createdAt || msg.created_at
        })),
        estimates,
        media: allMedia,
        inspectionItems: inspectionItems.map(item => ({
          ...item,
          name: item.itemName || item.item_name,
          category: item.categoryName || item.category_name,
          estimatedCost: item.estimatedCost || item.estimated_cost,
          estimatedLabor: item.estimatedLabor || item.estimated_labor
        }))
      }

      setInspection(customerInspection)
      setApprovalStatus(inspectionRecord.customerApproved || inspectionRecord.customer_approved ? 'approved' : 'pending')
    } catch (err) {
      console.error('Failed to load inspection:', err)
      setError(err instanceof Error ? err.message : 'Failed to load inspection data')
    } finally {
      setLoading(false)
    }
  }, [inspectionId])

  useEffect(() => {
    loadInspectionData()
  }, [loadInspectionData])

  const sendMessage = async () => {
    if (!newMessage.trim() || !inspection) return

    try {
      setSendingMessage(true)
      
      const message = {
        id: `msg_${Date.now()}`,
        inspectionId: inspection.id,
        messageType: 'text',
        content: newMessage,
        fromMechanic: false,
        isRead: false,
        userId: 'demo_user',
        createdAt: new Date().toISOString()
      }

      await blink.db.customer_messages.create(message)
      
      setInspection(prev => prev ? {
        ...prev,
        messages: [...prev.messages, {
          ...message,
          type: message.messageType,
          fromMechanic: message.fromMechanic,
          read: message.isRead,
          createdAt: message.createdAt
        }]
      } : null)
      
      setNewMessage('')
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setSendingMessage(false)
    }
  }

  const approveEstimate = async (approved: boolean) => {
    if (!inspection) return

    try {
      await blink.db.inspections.update(inspection.id, {
        customerApproved: approved,
        status: approved ? 'approved' : 'declined',
        updatedAt: new Date().toISOString()
      })

      setApprovalStatus(approved ? 'approved' : 'declined')
      
      // Send notification message
      const message = {
        id: `msg_${Date.now()}`,
        inspectionId: inspection.id,
        messageType: 'text',
        content: approved ? 'Customer approved the estimate' : 'Customer declined the estimate',
        fromMechanic: false,
        isRead: false,
        userId: 'demo_user',
        createdAt: new Date().toISOString()
      }

      await blink.db.customer_messages.create(message)
    } catch (err) {
      console.error('Failed to update approval:', err)
    }
  }

  const downloadReport = async () => {
    if (!inspection) return
    
    // Generate PDF report (placeholder)
    console.log('Generating PDF report for inspection:', inspection.id)
    // In a real app, this would generate and download a PDF
    alert('PDF report download would start here. This is a demo feature.')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!inspection) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Car}
          title="No Inspection Found"
          description="We couldn't find any inspection data for your account."
        />
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'approved': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
      case 'declined': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'fail': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'advisory': return <Clock className="h-4 w-4 text-yellow-600" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto bg-background dark:bg-background">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Vehicle Inspection Report</h1>
            <p className="text-muted-foreground">
              {inspection.vehicle.year} {inspection.vehicle.make} {inspection.vehicle.model}
            </p>
          </div>
          <Badge className={getStatusColor(inspection.status)}>
            {inspection.status.replace('-', ' ').toUpperCase()}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Inspection Progress</span>
            <span className="text-sm text-muted-foreground">{Math.round(inspection.progress)}% Complete</span>
          </div>
          <Progress value={inspection.progress} className="h-2" />
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inspection">Inspection Details</TabsTrigger>
          <TabsTrigger value="media">Photos & Videos</TabsTrigger>
          <TabsTrigger value="estimate">Estimate</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vehicle Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Vehicle Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Make:</span>
                    <p className="text-foreground">{inspection.vehicle.make}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Model:</span>
                    <p className="text-foreground">{inspection.vehicle.model}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Year:</span>
                    <p className="text-foreground">{inspection.vehicle.year}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Mileage:</span>
                    <p className="text-foreground">{inspection.vehicle.mileage?.toLocaleString()} miles</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">VIN:</span>
                    <p className="font-mono text-xs text-foreground">{inspection.vehicle.vin}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">License:</span>
                    <p className="text-foreground">{inspection.vehicle.licensePlate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{inspection.customer.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{inspection.customer.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{inspection.customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">Inspected on {format(new Date(inspection.createdAt), 'PPP')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Inspection Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Inspection Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">
                    {inspection.inspectionItems.filter(item => item.status === 'pass').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Items Passed</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-600">
                    {inspection.inspectionItems.filter(item => item.status === 'fail').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Items Failed</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-yellow-600">
                    {inspection.inspectionItems.filter(item => item.status === 'advisory').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Advisory Items</div>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">
                    ${inspection.totalEstimate.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Estimate</div>
                </div>
              </div>

              {/* Mechanic Notes */}
              {inspection.mechanicNotes && (
                <div className="mt-6">
                  <h4 className="font-medium mb-2">Mechanic Notes</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap bg-muted p-4 rounded-lg">
                    {inspection.mechanicNotes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inspection Details Tab */}
        <TabsContent value="inspection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Detailed Inspection Results
              </CardTitle>
              <CardDescription>
                Complete breakdown of all inspected components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inspection.inspectionItems.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(item.status)}
                        <div>
                          <h4 className="font-medium text-foreground">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">{item.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(item.status)}>
                          {item.status.toUpperCase()}
                        </Badge>
                        {item.severity && (
                          <Badge variant="outline" className={getSeverityColor(item.severity)}>
                            {item.severity.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {item.notes && (
                      <p className="text-sm text-muted-foreground mt-2 bg-muted p-3 rounded">
                        {item.notes}
                      </p>
                    )}
                    {(item.estimatedCost > 0 || item.estimatedLabor > 0) && (
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        {item.estimatedCost > 0 && (
                          <span className="text-muted-foreground">
                            Estimated Cost: <span className="font-medium text-foreground">${item.estimatedCost.toFixed(2)}</span>
                          </span>
                        )}
                        {item.estimatedLabor > 0 && (
                          <span className="text-muted-foreground">
                            Labor Hours: <span className="font-medium text-foreground">{item.estimatedLabor}h</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Photos & Videos
              </CardTitle>
              <CardDescription>
                Visual documentation from your vehicle inspection
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inspection.media.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inspection.media.map((item, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardContent className="p-0">
                        {item.type === 'video' ? (
                          <div className="relative">
                            <video
                              className="w-full h-48 object-cover"
                              controls
                              poster={item.thumbnailUrl}
                            >
                              <source src={item.url} type="video/mp4" />
                            </video>
                            <div className="absolute top-2 left-2">
                              <Badge variant="secondary">
                                <Video className="h-3 w-3 mr-1" />
                                Video
                              </Badge>
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <img
                              src={item.url}
                              alt={item.description || 'Inspection photo'}
                              className="w-full h-48 object-cover"
                            />
                            <div className="absolute top-2 left-2">
                              <Badge variant="secondary">
                                <Camera className="h-3 w-3 mr-1" />
                                Photo
                              </Badge>
                            </div>
                          </div>
                        )}
                        <div className="p-3">
                          <p className="text-sm font-medium text-foreground">{item.component || 'General'}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Camera}
                  title="No Media Available"
                  description="No photos or videos have been uploaded for this inspection yet."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Estimate Tab */}
        <TabsContent value="estimate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Repair Estimate
                </span>
                <div className="text-2xl font-bold text-primary">
                  ${inspection.totalEstimate.toFixed(2)}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inspection.estimates.length > 0 ? (
                <div className="space-y-4">
                  {inspection.estimates.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-foreground">{item.partName || item.part_name}</h4>
                        <span className="font-bold text-foreground">${item.total?.toFixed(2)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span>Quantity: {item.quantity}</span>
                        </div>
                        <div>
                          <span>Unit Price: ${item.unitPrice?.toFixed(2) || item.unit_price?.toFixed(2)}</span>
                        </div>
                        <div>
                          <span>Labor Hours: {item.laborHours || item.labor_hours}</span>
                        </div>
                        <div>
                          <span>Labor Rate: ${item.laborRate?.toFixed(2) || item.labor_rate?.toFixed(2)}/hr</span>
                        </div>
                      </div>
                      {(item.partNumber || item.part_number) && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Part #: {item.partNumber || item.part_number}
                        </p>
                      )}
                    </div>
                  ))}

                  <Separator />

                  {/* Approval Section */}
                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-medium mb-3 text-foreground">Estimate Approval</h4>
                    {approvalStatus === 'pending' ? (
                      <div className="flex gap-3">
                        <Button 
                          onClick={() => approveEstimate(true)}
                          className="flex-1"
                        >
                          <ThumbsUp className="h-4 w-4 mr-2" />
                          Approve Estimate
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => approveEstimate(false)}
                          className="flex-1"
                        >
                          <ThumbsDown className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Badge className={approvalStatus === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}>
                          {approvalStatus === 'approved' ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Estimate Approved
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Estimate Declined
                            </>
                          )}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={DollarSign}
                  title="No Estimate Available"
                  description="The repair estimate is being prepared and will be available soon."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Communication
              </CardTitle>
              <CardDescription>
                Chat with your mechanic about the inspection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                {inspection.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.fromMechanic ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.fromMechanic
                          ? 'bg-muted text-foreground'
                          : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.fromMechanic ? 'text-muted-foreground' : 'text-primary-foreground/70'
                      }`}>
                        {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                  rows={2}
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={sendingMessage || !newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="mt-8 flex flex-wrap gap-4">
        <Button onClick={downloadReport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
        <Button variant="outline">
          <Star className="h-4 w-4 mr-2" />
          Leave Review
        </Button>
        <Button variant="outline">
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Service
        </Button>
      </div>
    </div>
  )
}
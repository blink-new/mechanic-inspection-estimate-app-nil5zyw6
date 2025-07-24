import { useState, useEffect, useCallback } from 'react'
import { blink } from '../../blink/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  Share,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Car,
  User,
  DollarSign,
  MessageSquare,
  Star,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Shield,
  Wrench,
  Camera
} from 'lucide-react'
import { format } from 'date-fns'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { EmptyState } from '../common/EmptyState'

interface Inspection {
  id: string
  vehicleId: string
  vehicle: {
    make: string
    model: string
    year: number
    licensePlate: string
    customerName: string
    customerEmail: string
  }
  status: 'draft' | 'in-progress' | 'completed' | 'sent-to-customer' | 'approved' | 'declined'
  progress: number
  totalEstimate: number
  createdAt: string
  updatedAt: string
  completedAt?: string
  mechanicNotes: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  serviceType: string
  itemsCount: number
  issuesCount: number
  mediaCount: number
}

interface InspectionStats {
  total: number
  completed: number
  inProgress: number
  approved: number
  declined: number
  totalRevenue: number
  averageTime: number
  customerSatisfaction: number
}

export function InspectionManager() {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [stats, setStats] = useState<InspectionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const loadInspections = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const user = await blink.auth.me()
      
      // Load all inspections
      const inspectionData = await blink.db.inspections.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 100
      })

      // Load vehicle data for each inspection
      const inspectionsWithVehicles = await Promise.all(
        inspectionData.map(async (inspection) => {
          const vehicleData = await blink.db.vehicles.list({
            where: { id: inspection.vehicleId || inspection.vehicle_id },
            limit: 1
          })

          const vehicle = vehicleData[0] || {}

          // Load inspection items to calculate progress and counts
          const inspectionItems = await blink.db.inspection_items.list({
            where: { inspectionId: inspection.id }
          })

          // Load media count
          const mediaPromises = inspectionItems.map(async (item) => {
            const itemMedia = await blink.db.inspection_media.list({
              where: { inspectionItemId: item.id }
            })
            return itemMedia.length
          })
          const mediaCounts = await Promise.all(mediaPromises)
          const totalMediaCount = mediaCounts.reduce((sum, count) => sum + count, 0)

          const completedItems = inspectionItems.filter(item => item.status !== 'pending').length
          const issuesCount = inspectionItems.filter(item => item.status === 'fail' || item.status === 'advisory').length
          const progress = inspectionItems.length > 0 ? (completedItems / inspectionItems.length) * 100 : 0

          return {
            id: inspection.id,
            vehicleId: inspection.vehicleId || inspection.vehicle_id,
            vehicle: {
              make: vehicle.make || 'Unknown',
              model: vehicle.model || 'Unknown',
              year: vehicle.year || 0,
              licensePlate: vehicle.licensePlate || vehicle.license_plate || '',
              customerName: vehicle.customerName || vehicle.customer_name || inspection.customerName || inspection.customer_name || 'Unknown',
              customerEmail: vehicle.customerEmail || vehicle.customer_email || inspection.customerEmail || inspection.customer_email || ''
            },
            status: inspection.status,
            progress,
            totalEstimate: inspection.totalEstimate || inspection.total_estimate || 0,
            createdAt: inspection.createdAt || inspection.created_at,
            updatedAt: inspection.updatedAt || inspection.updated_at,
            completedAt: inspection.completedAt || inspection.completed_at,
            mechanicNotes: inspection.mechanicNotes || inspection.mechanic_notes || '',
            priority: inspection.priority || 'medium',
            serviceType: inspection.serviceType || inspection.service_type || 'General Inspection',
            itemsCount: inspectionItems.length,
            issuesCount,
            mediaCount: totalMediaCount
          }
        })
      )

      setInspections(inspectionsWithVehicles)

      // Calculate stats
      const totalInspections = inspectionsWithVehicles.length
      const completedInspections = inspectionsWithVehicles.filter(i => i.status === 'completed').length
      const inProgressInspections = inspectionsWithVehicles.filter(i => i.status === 'in-progress').length
      const approvedInspections = inspectionsWithVehicles.filter(i => i.status === 'approved').length
      const declinedInspections = inspectionsWithVehicles.filter(i => i.status === 'declined').length
      const totalRevenue = inspectionsWithVehicles.reduce((sum, i) => sum + i.totalEstimate, 0)

      setStats({
        total: totalInspections,
        completed: completedInspections,
        inProgress: inProgressInspections,
        approved: approvedInspections,
        declined: declinedInspections,
        totalRevenue,
        averageTime: 2.5, // Mock data
        customerSatisfaction: 4.8 // Mock data
      })

    } catch (err) {
      console.error('Failed to load inspections:', err)
      setError(err instanceof Error ? err.message : 'Failed to load inspections')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInspections()
  }, [loadInspections])

  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = 
      inspection.vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.vehicle.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || inspection.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || inspection.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'approved': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
      case 'declined': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'sent-to-customer': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'in-progress': return <Clock className="h-4 w-4" />
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'declined': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const deleteInspection = async (inspectionId: string) => {
    if (!confirm('Are you sure you want to delete this inspection? This action cannot be undone.')) {
      return
    }

    try {
      await blink.db.inspections.delete(inspectionId)
      setInspections(prev => prev.filter(i => i.id !== inspectionId))
    } catch (err) {
      console.error('Failed to delete inspection:', err)
      alert('Failed to delete inspection. Please try again.')
    }
  }

  const shareInspection = async (inspection: Inspection) => {
    // Generate shareable link for customer
    const shareUrl = `${window.location.origin}/customer-portal?inspection=${inspection.id}`
    
    try {
      await navigator.clipboard.writeText(shareUrl)
      alert('Customer portal link copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy link:', err)
      alert(`Customer portal link: ${shareUrl}`)
    }
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
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inspection Manager</h1>
          <p className="text-muted-foreground">Manage all vehicle inspections and track progress</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Inspection
        </Button>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Inspections</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-foreground">${stats.totalRevenue.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer Rating</p>
                  <p className="text-2xl font-bold text-foreground">{stats.customerSatisfaction}/5</p>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="inspections" className="space-y-6">
        <TabsList>
          <TabsTrigger value="inspections">All Inspections</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="inspections" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by vehicle, customer, or license plate..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-background text-foreground"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="sent-to-customer">Sent to Customer</option>
                  <option value="approved">Approved</option>
                  <option value="declined">Declined</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-background text-foreground"
                >
                  <option value="all">All Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Inspections List */}
          {filteredInspections.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredInspections.map((inspection) => (
                <Card key={inspection.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Car className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {inspection.vehicle.year} {inspection.vehicle.make} {inspection.vehicle.model}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {inspection.vehicle.licensePlate} • {inspection.vehicle.customerName}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(inspection.status)}>
                          {getStatusIcon(inspection.status)}
                          <span className="ml-1">{inspection.status.replace('-', ' ').toUpperCase()}</span>
                        </Badge>
                        <Badge variant="outline" className={getPriorityColor(inspection.priority)}>
                          {inspection.priority.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Items:</span>
                        <span className="font-medium text-foreground">{inspection.itemsCount}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Issues:</span>
                        <span className="font-medium text-foreground">{inspection.issuesCount}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Camera className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Media:</span>
                        <span className="font-medium text-foreground">{inspection.mediaCount}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Estimate:</span>
                        <span className="font-medium text-foreground">${inspection.totalEstimate.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">Progress</span>
                        <span className="text-sm text-muted-foreground">{Math.round(inspection.progress)}%</span>
                      </div>
                      <Progress value={inspection.progress} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Created {format(new Date(inspection.createdAt), 'MMM d, yyyy')} • 
                        {inspection.serviceType}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => shareInspection(inspection)}>
                          <Share className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => deleteInspection(inspection.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Car}
              title="No Inspections Found"
              description="No inspections match your current filters. Try adjusting your search criteria."
            />
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Inspection Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Completed</span>
                      <span className="font-medium text-foreground">{stats.completed}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">In Progress</span>
                      <span className="font-medium text-foreground">{stats.inProgress}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Approved</span>
                      <span className="font-medium text-foreground">{stats.approved}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Declined</span>
                      <span className="font-medium text-foreground">{stats.declined}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Average Completion Time</span>
                      <span className="font-medium text-foreground">{stats.averageTime}h</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Customer Satisfaction</span>
                      <span className="font-medium text-foreground">{stats.customerSatisfaction}/5</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Revenue per Inspection</span>
                      <span className="font-medium text-foreground">
                        ${stats.total > 0 ? (stats.totalRevenue / stats.total).toFixed(2) : '0.00'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Approval Rate</span>
                      <span className="font-medium text-foreground">
                        {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Inspection Templates
              </CardTitle>
              <CardDescription>
                Create and manage reusable inspection templates for different vehicle types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={Wrench}
                title="Templates Coming Soon"
                description="Customizable inspection templates will be available in the next update."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
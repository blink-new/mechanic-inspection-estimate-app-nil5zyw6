export interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  vin: string
  licensePlate: string
  mileage: number
  color: string
  customerName: string
  customerEmail: string
  customerPhone: string
}

export interface InspectionItem {
  id: string
  name: string
  category: string
  description?: string
  isRequired: boolean
  status: 'pending' | 'pass' | 'fail' | 'advisory'
  notes?: string
  photos?: string[]
  videos?: string[]
  severity?: 'critical' | 'major' | 'minor' | 'advisory'
  estimatedCost?: number
  estimatedLabor?: number
}

export interface InspectionCategory {
  id: string
  name: string
  icon: string
  items: InspectionItem[]
  completed: number
  total: number
}

export interface Inspection {
  id: string
  vehicleId: string
  vehicle: Vehicle
  status: 'draft' | 'in-progress' | 'completed' | 'sent-to-customer' | 'approved'
  categories: InspectionCategory[]
  createdAt: string
  updatedAt: string
  completedAt?: string
  totalEstimate: number
  customerApproved?: boolean
  customerSignature?: string
  mechanicNotes?: string
}

export interface EstimateItem {
  id: string
  inspectionItemId: string
  partName: string
  partNumber?: string
  quantity: number
  unitPrice: number
  laborHours: number
  laborRate: number
  total: number
  approved: boolean
}

export interface CustomerMessage {
  id: string
  inspectionId: string
  type: 'video' | 'text' | 'estimate'
  content: string
  videoUrl?: string
  timestamp: string
  fromMechanic: boolean
  read: boolean
}
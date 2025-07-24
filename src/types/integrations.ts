export interface APIIntegration {
  id: string
  name: string
  type: 'shop_management' | 'inventory' | 'payment' | 'crm'
  status: 'connected' | 'disconnected' | 'error'
  logo: string
  description: string
  features: string[]
  config?: {
    apiKey?: string
    baseUrl?: string
    shopId?: string
    username?: string
    customFields?: Record<string, any>
  }
  lastSync?: string
  syncEnabled: boolean
}

export interface SyncData {
  vehicles?: any[]
  customers?: any[]
  parts?: any[]
  labor?: any[]
  inspections?: any[]
}

export interface SyncResult {
  success: boolean
  message: string
  recordsProcessed: number
  errors?: string[]
}

export const SUPPORTED_INTEGRATIONS: Omit<APIIntegration, 'id' | 'status' | 'config' | 'lastSync' | 'syncEnabled'>[] = [
  {
    name: 'Tekmetric',
    type: 'shop_management',
    logo: '/integrations/tekmetric.png',
    description: 'Complete shop management system with customer management, inventory, and invoicing',
    features: [
      'Customer sync',
      'Vehicle history import',
      'Parts catalog integration',
      'Labor time estimates',
      'Invoice generation',
      'Appointment scheduling'
    ]
  },
  {
    name: 'Mitchell 1',
    type: 'shop_management',
    logo: '/integrations/mitchell1.png',
    description: 'Comprehensive automotive repair information and shop management',
    features: [
      'Repair procedures',
      'Parts lookup',
      'Labor estimates',
      'Customer management',
      'Inventory tracking'
    ]
  },
  {
    name: 'AutoFluent',
    type: 'shop_management',
    logo: '/integrations/autofluent.png',
    description: 'Cloud-based shop management with customer communication tools',
    features: [
      'Customer portal',
      'Digital inspections',
      'Estimate approval',
      'Payment processing',
      'Marketing automation'
    ]
  },
  {
    name: 'Shop-Ware',
    type: 'shop_management',
    logo: '/integrations/shopware.png',
    description: 'All-in-one automotive shop management solution',
    features: [
      'Work order management',
      'Inventory control',
      'Customer database',
      'Accounting integration',
      'Reporting dashboard'
    ]
  },
  {
    name: 'R.O. Writer',
    type: 'shop_management',
    logo: '/integrations/rowriter.png',
    description: 'Repair order and shop management software',
    features: [
      'Digital repair orders',
      'Customer history',
      'Parts ordering',
      'Labor tracking',
      'Invoice printing'
    ]
  },
  {
    name: 'AutoLeap',
    type: 'shop_management',
    logo: '/integrations/autoleap.png',
    description: 'Modern shop management with customer engagement features',
    features: [
      'Digital vehicle inspections',
      'Customer communication',
      'Estimate management',
      'Payment processing',
      'Analytics dashboard'
    ]
  },
  {
    name: 'Protractor',
    type: 'shop_management',
    logo: '/integrations/protractor.png',
    description: 'Comprehensive automotive shop management system',
    features: [
      'Work order management',
      'Customer database',
      'Inventory management',
      'Accounting integration',
      'Multi-location support'
    ]
  },
  {
    name: 'CCC ONE',
    type: 'shop_management',
    logo: '/integrations/cccone.png',
    description: 'Collision repair and automotive service management',
    features: [
      'Estimate writing',
      'Parts procurement',
      'Workflow management',
      'Insurance integration',
      'Photo documentation'
    ]
  }
]
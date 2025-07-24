export interface AIDetectionResult {
  id: string
  issue_type: 'leak' | 'corrosion' | 'wear' | 'damage' | 'normal'
  confidence: number
  description: string
  severity: 'critical' | 'major' | 'minor' | 'advisory'
  location: string
  recommendations: string[]
  created_at: string
}

export interface VoicePromptResult {
  id: string
  prompt: string
  response: string
  confidence: number
  media_url?: string
  created_at: string
}

export interface PredictiveMaintenanceAlert {
  id: string
  vehicle_id: string
  component: string
  current_condition: string
  predicted_failure_date: string
  confidence: number
  recommended_action: string
  cost_estimate: number
  priority: 'high' | 'medium' | 'low'
  created_at: string
}

export interface DigitalTwin {
  id: string
  vehicle_id: string
  maintenance_history: MaintenanceRecord[]
  inspection_history: InspectionRecord[]
  media_timeline: MediaRecord[]
  predictive_alerts: PredictiveMaintenanceAlert[]
  resale_value_impact: number
  created_at: string
  updated_at: string
}

export interface MaintenanceRecord {
  id: string
  date: string
  service_type: string
  mileage: number
  parts_replaced: string[]
  cost: number
  shop_name: string
  notes: string
}

export interface InspectionRecord {
  id: string
  date: string
  inspector: string
  overall_score: number
  issues_found: number
  media_count: number
  report_url: string
}

export interface MediaRecord {
  id: string
  type: 'photo' | 'video'
  url: string
  timestamp: string
  component: string
  ai_analysis?: AIDetectionResult
}

export interface LiveStreamSession {
  id: string
  inspection_id: string
  customer_id: string
  stream_url: string
  chat_messages: ChatMessage[]
  is_active: boolean
  started_at: string
  ended_at?: string
}

export interface ChatMessage {
  id: string
  sender: 'customer' | 'technician'
  message: string
  timestamp: string
  media_url?: string
}

export interface AROverlay {
  id: string
  component: string
  repair_type: string
  overlay_data: {
    bolt_locations: Point3D[]
    torque_specs: TorqueSpec[]
    diagrams: string[]
    instructions: string[]
  }
  created_at: string
}

export interface Point3D {
  x: number
  y: number
  z: number
  label: string
}

export interface TorqueSpec {
  bolt_id: string
  torque_value: number
  unit: 'ft-lbs' | 'nm'
  sequence: number
}

export interface TrainingSession {
  id: string
  technician_id: string
  inspection_type: string
  start_time: string
  end_time?: string
  accuracy_score: number
  speed_score: number
  completeness_score: number
  overall_grade: 'A' | 'B' | 'C' | 'D' | 'F'
  feedback: string[]
  areas_for_improvement: string[]
}

export interface EstimateValidation {
  id: string
  estimate_id: string
  market_average: number
  suggested_price: number
  variance_percentage: number
  warning_level: 'none' | 'low' | 'medium' | 'high'
  justification: string
  created_at: string
}

export interface ShopBranding {
  id: string
  shop_id: string
  logo_url: string
  brand_colors: {
    primary: string
    secondary: string
    accent: string
  }
  contact_info: {
    phone: string
    email: string
    address: string
    website: string
  }
  marketing_videos: string[]
  promotional_offers: PromotionalOffer[]
  social_media: {
    facebook?: string
    instagram?: string
    google_business?: string
  }
}

export interface PromotionalOffer {
  id: string
  title: string
  description: string
  discount_percentage?: number
  discount_amount?: number
  valid_until: string
  terms: string
}
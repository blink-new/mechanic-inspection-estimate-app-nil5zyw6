export interface Review {
  id: string
  inspection_id: string
  customer_id: string
  mechanic_id: string
  rating: number // 1-5 stars
  title: string
  comment: string
  photos?: string[]
  response?: string // Mechanic response
  response_date?: string
  created_at: string
  updated_at: string
  is_verified: boolean
  is_featured: boolean
  helpful_count: number
  tags: string[]
  service_type: 'inspection' | 'repair' | 'maintenance' | 'diagnostic'
  would_recommend: boolean
}

export interface ReviewStats {
  total_reviews: number
  average_rating: number
  rating_distribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
  recent_reviews: Review[]
  featured_reviews: Review[]
}

export interface ReviewFilters {
  rating?: number
  service_type?: string
  date_range?: 'week' | 'month' | 'quarter' | 'year' | 'all'
  verified_only?: boolean
  with_photos?: boolean
  sort_by?: 'newest' | 'oldest' | 'highest_rating' | 'lowest_rating' | 'most_helpful'
}

export interface ReviewFormData {
  rating: number
  title: string
  comment: string
  service_type: 'inspection' | 'repair' | 'maintenance' | 'diagnostic'
  would_recommend: boolean
  photos?: File[]
}
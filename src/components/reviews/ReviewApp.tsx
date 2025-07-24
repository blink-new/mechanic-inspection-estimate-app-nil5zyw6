import React, { useState, useEffect, useCallback } from 'react'
import { Star, Filter, MessageSquare, ThumbsUp, Calendar, User, Award, TrendingUp } from 'lucide-react'
import { ReviewService } from '../../services/reviewService'
import { useDarkMode } from '../../hooks/useDarkMode'
import type { Review, ReviewStats, ReviewFilters } from '../../types/review'

export function ReviewApp() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [filters, setFilters] = useState<ReviewFilters>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'analytics'>('overview')
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [reviewsData, statsData] = await Promise.all([
        ReviewService.getReviews(filters),
        ReviewService.getReviewStats()
      ])
      setReviews(reviewsData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading review data:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleMarkHelpful = async (reviewId: string) => {
    const success = await ReviewService.markHelpful(reviewId)
    if (success) {
      loadData() // Refresh data
    }
  }

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    }
    
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    )
  }

  const renderOverview = () => {
    if (!stats) return null

    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card dark:bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Reviews</p>
                <p className="text-2xl font-bold text-foreground">{stats.total_reviews}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="bg-card dark:bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-foreground">{stats.average_rating}</p>
                  {renderStars(Math.round(stats.average_rating), 'sm')}
                </div>
              </div>
              <Star className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-card dark:bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">5-Star Reviews</p>
                <p className="text-2xl font-bold text-foreground">{stats.rating_distribution[5]}</p>
              </div>
              <Award className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-card dark:bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Featured Reviews</p>
                <p className="text-2xl font-bold text-foreground">{stats.featured_reviews.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-card dark:bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Rating Distribution</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.rating_distribution[rating as keyof typeof stats.rating_distribution]
              const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0
              
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm text-foreground">{rating}</span>
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="bg-card dark:bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Reviews</h3>
          <div className="space-y-4">
            {stats.recent_reviews.slice(0, 3).map((review) => (
              <div key={review.id} className="border-b border-border last:border-b-0 pb-4 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {renderStars(review.rating, 'sm')}
                    <span className="text-sm font-medium text-foreground">{review.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderReviews = () => {
    return (
      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-card dark:bg-card border border-border rounded-lg p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Filters:</span>
            </div>
            
            <select 
              className="px-3 py-1 text-sm border border-border rounded-md bg-background text-foreground"
              value={filters.rating || ''}
              onChange={(e) => setFilters({...filters, rating: e.target.value ? Number(e.target.value) : undefined})}
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>

            <select 
              className="px-3 py-1 text-sm border border-border rounded-md bg-background text-foreground"
              value={filters.service_type || ''}
              onChange={(e) => setFilters({...filters, service_type: e.target.value || undefined})}
            >
              <option value="">All Services</option>
              <option value="inspection">Inspection</option>
              <option value="repair">Repair</option>
              <option value="maintenance">Maintenance</option>
              <option value="diagnostic">Diagnostic</option>
            </select>

            <select 
              className="px-3 py-1 text-sm border border-border rounded-md bg-background text-foreground"
              value={filters.sort_by || 'newest'}
              onChange={(e) => setFilters({...filters, sort_by: e.target.value as any})}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest_rating">Highest Rating</option>
              <option value="lowest_rating">Lowest Rating</option>
              <option value="most_helpful">Most Helpful</option>
            </select>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.verified_only || false}
                onChange={(e) => setFilters({...filters, verified_only: e.target.checked})}
                className="rounded border-border"
              />
              <span className="text-foreground">Verified Only</span>
            </label>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No reviews found</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="bg-card dark:bg-card border border-border rounded-lg p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {renderStars(review.rating, 'sm')}
                        {review.is_verified && (
                          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-full">
                            Verified
                          </span>
                        )}
                        {review.is_featured && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full">
                            Featured
                          </span>
                        )}
                      </div>
                      <h4 className="font-medium text-foreground">{review.title}</h4>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(review.created_at).toLocaleDateString()}
                    </div>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground capitalize">
                      {review.service_type}
                    </span>
                  </div>
                </div>

                <p className="text-foreground mb-4">{review.comment}</p>

                {review.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {review.tags.map((tag, index) => (
                      <span key={index} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {review.response && (
                  <div className="bg-muted rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-xs text-primary-foreground font-medium">M</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">Mechanic Response</span>
                      <span className="text-xs text-muted-foreground">
                        {review.response_date && new Date(review.response_date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{review.response}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleMarkHelpful(review.id)}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Helpful ({review.helpful_count})
                    </button>
                    {review.would_recommend && (
                      <span className="text-sm text-green-600 dark:text-green-400">
                        ✓ Would recommend
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  const renderAnalytics = () => {
    if (!stats) return null

    return (
      <div className="space-y-6">
        <div className="bg-card dark:bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Review Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-foreground mb-3">Service Type Breakdown</h4>
              <div className="space-y-2">
                {['inspection', 'repair', 'maintenance', 'diagnostic'].map((type) => {
                  const count = reviews.filter(r => r.service_type === type).length
                  const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0
                  
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-foreground capitalize">{type}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-3">Recommendation Rate</h4>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {reviews.length > 0 
                    ? Math.round((reviews.filter(r => r.would_recommend).length / reviews.length) * 100)
                    : 0}%
                </div>
                <p className="text-sm text-muted-foreground">
                  of customers would recommend our service
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Future Enhancement Placeholders */}
        <div className="bg-card dark:bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Future Enhancements</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-dashed border-border rounded-lg text-center">
              <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <h4 className="font-medium text-foreground mb-1">Trend Analysis</h4>
              <p className="text-xs text-muted-foreground">Track rating trends over time</p>
            </div>
            <div className="p-4 border border-dashed border-border rounded-lg text-center">
              <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <h4 className="font-medium text-foreground mb-1">Sentiment Analysis</h4>
              <p className="text-xs text-muted-foreground">AI-powered review sentiment</p>
            </div>
            <div className="p-4 border border-dashed border-border rounded-lg text-center">
              <Award className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <h4 className="font-medium text-foreground mb-1">Competitor Comparison</h4>
              <p className="text-xs text-muted-foreground">Benchmark against competitors</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Review Management</h1>
            <p className="text-muted-foreground">Monitor and manage customer reviews</p>
          </div>
          <button
            onClick={toggleDarkMode}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-muted p-1 rounded-lg w-fit">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'reviews', label: 'Reviews', icon: MessageSquare },
            { id: 'analytics', label: 'Analytics', icon: Award }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'reviews' && renderReviews()}
        {activeTab === 'analytics' && renderAnalytics()}
      </div>
    </div>
  )
}
import { blink } from '../blink/client'
import type { Review, ReviewStats, ReviewFilters, ReviewFormData } from '../types/review'

export class ReviewService {
  // Get all reviews with optional filters
  static async getReviews(filters?: ReviewFilters): Promise<Review[]> {
    try {
      const query: any = {}
      
      if (filters?.rating) {
        query.rating = filters.rating
      }
      
      if (filters?.service_type) {
        query.service_type = filters.service_type
      }
      
      if (filters?.verified_only) {
        query.is_verified = "1"
      }

      const reviews = await blink.db.reviews.list({
        where: query,
        orderBy: this.getSortOrder(filters?.sort_by),
        limit: 50
      })

      return reviews.map(this.transformReview)
    } catch (error) {
      console.error('Error fetching reviews:', error)
      return []
    }
  }

  // Get review statistics
  static async getReviewStats(): Promise<ReviewStats> {
    try {
      const allReviews = await blink.db.reviews.list()
      const reviews = allReviews.map(this.transformReview)
      
      const totalReviews = reviews.length
      const averageRating = totalReviews > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
        : 0

      const ratingDistribution = {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length,
      }

      const recentReviews = reviews
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)

      const featuredReviews = reviews
        .filter(r => r.is_featured)
        .slice(0, 3)

      return {
        total_reviews: totalReviews,
        average_rating: Math.round(averageRating * 10) / 10,
        rating_distribution: ratingDistribution,
        recent_reviews: recentReviews,
        featured_reviews: featuredReviews
      }
    } catch (error) {
      console.error('Error fetching review stats:', error)
      return {
        total_reviews: 0,
        average_rating: 0,
        rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        recent_reviews: [],
        featured_reviews: []
      }
    }
  }

  // Create a new review
  static async createReview(reviewData: ReviewFormData, inspectionId: string, customerId: string): Promise<Review | null> {
    try {
      const user = await blink.auth.me()
      const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const review = await blink.db.reviews.create({
        id: reviewId,
        inspection_id: inspectionId,
        customer_id: customerId,
        mechanic_id: user.id,
        rating: reviewData.rating,
        title: reviewData.title,
        comment: reviewData.comment,
        service_type: reviewData.service_type,
        would_recommend: reviewData.would_recommend ? 1 : 0,
        user_id: user.id,
        tags: JSON.stringify([]),
        photos: reviewData.photos ? JSON.stringify([]) : null,
        is_verified: 0,
        is_featured: 0,
        helpful_count: 0
      })

      return this.transformReview(review)
    } catch (error) {
      console.error('Error creating review:', error)
      return null
    }
  }

  // Mark review as helpful
  static async markHelpful(reviewId: string): Promise<boolean> {
    try {
      const user = await blink.auth.me()
      const helpfulId = `help_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      await blink.db.review_helpful.create({
        id: helpfulId,
        review_id: reviewId,
        user_id: user.id
      })

      // Update helpful count
      const currentReview = await blink.db.reviews.list({
        where: { id: reviewId },
        limit: 1
      })

      if (currentReview.length > 0) {
        const helpfulCount = (currentReview[0].helpful_count || 0) + 1
        await blink.db.reviews.update(reviewId, {
          helpful_count: helpfulCount
        })
      }

      return true
    } catch (error) {
      console.error('Error marking review as helpful:', error)
      return false
    }
  }

  // Respond to a review (mechanic response)
  static async respondToReview(reviewId: string, response: string): Promise<boolean> {
    try {
      await blink.db.reviews.update(reviewId, {
        response: response,
        response_date: new Date().toISOString()
      })
      return true
    } catch (error) {
      console.error('Error responding to review:', error)
      return false
    }
  }

  // Private helper methods
  private static transformReview(dbReview: any): Review {
    return {
      id: dbReview.id,
      inspection_id: dbReview.inspection_id,
      customer_id: dbReview.customer_id,
      mechanic_id: dbReview.mechanic_id,
      rating: dbReview.rating,
      title: dbReview.title,
      comment: dbReview.comment,
      photos: dbReview.photos ? JSON.parse(dbReview.photos) : undefined,
      response: dbReview.response,
      response_date: dbReview.response_date,
      created_at: dbReview.created_at,
      updated_at: dbReview.updated_at,
      is_verified: Number(dbReview.is_verified) > 0,
      is_featured: Number(dbReview.is_featured) > 0,
      helpful_count: dbReview.helpful_count || 0,
      tags: dbReview.tags ? JSON.parse(dbReview.tags) : [],
      service_type: dbReview.service_type,
      would_recommend: Number(dbReview.would_recommend) > 0
    }
  }

  private static getSortOrder(sortBy?: string) {
    switch (sortBy) {
      case 'oldest':
        return { created_at: 'asc' as const }
      case 'highest_rating':
        return { rating: 'desc' as const }
      case 'lowest_rating':
        return { rating: 'asc' as const }
      case 'most_helpful':
        return { helpful_count: 'desc' as const }
      default:
        return { created_at: 'desc' as const }
    }
  }
}
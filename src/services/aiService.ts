import { createClient } from '../blink/client'
import type { AIDetectionResult, VoicePromptResult, PredictiveMaintenanceAlert } from '../types/ai'

const blink = createClient()

export class AIService {
  // AI Auto-Detection from video/image
  static async analyzeMedia(mediaUrl: string, inspectionId: string): Promise<AIDetectionResult> {
    try {
      // Use Blink AI to analyze the image/video for common issues
      const { text } = await blink.ai.generateText({
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: "Analyze this automotive component image for common issues like leaks, corrosion, wear, or damage. Provide a detailed assessment with confidence level, severity, and specific recommendations." 
              },
              { type: "image", image: mediaUrl }
            ]
          }
        ]
      })

      // Parse AI response and extract structured data
      const analysis = this.parseAIAnalysis(text)
      
      const detection: AIDetectionResult = {
        id: `ai_${Date.now()}`,
        issue_type: analysis.issueType,
        confidence: analysis.confidence,
        description: analysis.description,
        severity: analysis.severity,
        location: analysis.location,
        recommendations: analysis.recommendations,
        created_at: new Date().toISOString()
      }

      // Store in database
      await blink.db.ai_detections.create({
        ...detection,
        inspection_id: inspectionId,
        media_url: mediaUrl,
        recommendations: JSON.stringify(detection.recommendations)
      })

      return detection
    } catch (error) {
      console.error('AI analysis failed:', error)
      throw new Error('Failed to analyze media with AI')
    }
  }

  // Voice prompt analysis
  static async processVoicePrompt(prompt: string, mediaUrl?: string, inspectionId?: string): Promise<VoicePromptResult> {
    try {
      const messages: any[] = [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `As an expert automotive technician, answer this question: "${prompt}". Provide a detailed, technical response with confidence level.` 
            }
          ]
        }
      ]

      // Add image if provided
      if (mediaUrl) {
        messages[0].content.push({ type: "image", image: mediaUrl })
      }

      const { text } = await blink.ai.generateText({ messages })

      const result: VoicePromptResult = {
        id: `voice_${Date.now()}`,
        prompt,
        response: text,
        confidence: this.extractConfidence(text),
        media_url: mediaUrl,
        created_at: new Date().toISOString()
      }

      // Store in database if inspection ID provided
      if (inspectionId) {
        await blink.db.voice_prompts.create({
          ...result,
          inspection_id: inspectionId
        })
      }

      return result
    } catch (error) {
      console.error('Voice prompt processing failed:', error)
      throw new Error('Failed to process voice prompt')
    }
  }

  // Predictive maintenance analysis
  static async generatePredictiveAlerts(vehicleId: string): Promise<PredictiveMaintenanceAlert[]> {
    try {
      // Get vehicle history and current inspection data
      const inspections = await blink.db.inspections.list({
        where: { vehicle_id: vehicleId },
        orderBy: { created_at: 'desc' },
        limit: 10
      })

      const maintenanceHistory = await blink.db.maintenance_records.list({
        where: { vehicle_id: vehicleId },
        orderBy: { date: 'desc' }
      })

      // Use AI to analyze patterns and predict future issues
      const { object } = await blink.ai.generateObject({
        prompt: `Analyze this vehicle's inspection and maintenance history to predict future maintenance needs. Consider wear patterns, service intervals, and component lifecycles. Generate specific alerts with timeline predictions.
        
        Recent Inspections: ${JSON.stringify(inspections.slice(0, 3))}
        Maintenance History: ${JSON.stringify(maintenanceHistory.slice(0, 5))}`,
        schema: {
          type: 'object',
          properties: {
            alerts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  component: { type: 'string' },
                  current_condition: { type: 'string' },
                  predicted_failure_date: { type: 'string' },
                  confidence: { type: 'number' },
                  recommended_action: { type: 'string' },
                  cost_estimate: { type: 'number' },
                  priority: { type: 'string', enum: ['high', 'medium', 'low'] }
                }
              }
            }
          }
        }
      })

      const alerts: PredictiveMaintenanceAlert[] = object.alerts.map((alert: any) => ({
        id: `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        vehicle_id: vehicleId,
        ...alert,
        created_at: new Date().toISOString()
      }))

      // Store alerts in database
      for (const alert of alerts) {
        await blink.db.predictive_alerts.create(alert)
      }

      return alerts
    } catch (error) {
      console.error('Predictive analysis failed:', error)
      return []
    }
  }

  // Smart estimate validation
  static async validateEstimate(estimateData: any): Promise<any> {
    try {
      const { object } = await blink.ai.generateObject({
        prompt: `Analyze this repair estimate for accuracy and fairness. Compare against industry standards and provide validation feedback.
        
        Estimate Details: ${JSON.stringify(estimateData)}`,
        schema: {
          type: 'object',
          properties: {
            market_average: { type: 'number' },
            suggested_price: { type: 'number' },
            variance_percentage: { type: 'number' },
            warning_level: { type: 'string', enum: ['none', 'low', 'medium', 'high'] },
            justification: { type: 'string' },
            recommendations: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      })

      return {
        id: `val_${Date.now()}`,
        ...object,
        created_at: new Date().toISOString()
      }
    } catch (error) {
      console.error('Estimate validation failed:', error)
      return null
    }
  }

  // Training session grading
  static async gradeTrainingSession(sessionData: any): Promise<any> {
    try {
      const { object } = await blink.ai.generateObject({
        prompt: `Grade this technician training session based on accuracy, speed, and completeness. Provide detailed feedback and areas for improvement.
        
        Session Data: ${JSON.stringify(sessionData)}`,
        schema: {
          type: 'object',
          properties: {
            accuracy_score: { type: 'number' },
            speed_score: { type: 'number' },
            completeness_score: { type: 'number' },
            overall_grade: { type: 'string', enum: ['A', 'B', 'C', 'D', 'F'] },
            feedback: {
              type: 'array',
              items: { type: 'string' }
            },
            areas_for_improvement: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      })

      return object
    } catch (error) {
      console.error('Training grading failed:', error)
      return null
    }
  }

  // Helper methods
  private static parseAIAnalysis(text: string): any {
    // Extract structured data from AI response
    // This is a simplified parser - in production, you'd use more sophisticated NLP
    const confidence = this.extractConfidence(text)
    const severity = this.extractSeverity(text)
    const issueType = this.extractIssueType(text)
    
    return {
      issueType: issueType || 'normal',
      confidence,
      description: text.substring(0, 200) + '...',
      severity: severity || 'advisory',
      location: this.extractLocation(text) || 'Unknown',
      recommendations: this.extractRecommendations(text)
    }
  }

  private static extractConfidence(text: string): number {
    const match = text.match(/confidence[:\s]+(\d+)%?/i)
    return match ? parseInt(match[1]) / 100 : 0.8
  }

  private static extractSeverity(text: string): 'critical' | 'major' | 'minor' | 'advisory' {
    const lowerText = text.toLowerCase()
    if (lowerText.includes('critical') || lowerText.includes('urgent')) return 'critical'
    if (lowerText.includes('major') || lowerText.includes('serious')) return 'major'
    if (lowerText.includes('minor') || lowerText.includes('small')) return 'minor'
    return 'advisory'
  }

  private static extractIssueType(text: string): 'leak' | 'corrosion' | 'wear' | 'damage' | 'normal' {
    const lowerText = text.toLowerCase()
    if (lowerText.includes('leak')) return 'leak'
    if (lowerText.includes('corrosion') || lowerText.includes('rust')) return 'corrosion'
    if (lowerText.includes('wear') || lowerText.includes('worn')) return 'wear'
    if (lowerText.includes('damage') || lowerText.includes('broken')) return 'damage'
    return 'normal'
  }

  private static extractLocation(text: string): string {
    // Simple location extraction - could be enhanced with NLP
    const locationKeywords = ['front', 'rear', 'left', 'right', 'driver', 'passenger', 'engine', 'brake', 'tire']
    for (const keyword of locationKeywords) {
      if (text.toLowerCase().includes(keyword)) {
        return keyword.charAt(0).toUpperCase() + keyword.slice(1)
      }
    }
    return 'General'
  }

  private static extractRecommendations(text: string): string[] {
    // Extract recommendation sentences
    const sentences = text.split(/[.!?]+/)
    return sentences
      .filter(s => s.toLowerCase().includes('recommend') || s.toLowerCase().includes('should'))
      .map(s => s.trim())
      .filter(s => s.length > 10)
      .slice(0, 3)
  }
}
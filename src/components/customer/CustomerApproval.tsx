import React, { useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  MessageCircle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  FileText,
  Download,
  Eye,
  AlertTriangle,
  Wrench,
  Calendar,
  User,
  Phone,
  Mail
} from 'lucide-react';
import { blink } from '../../blink/client';
import { VideoAnnotation } from '../../types/videoAnnotation';

interface CustomerApprovalProps {
  inspectionId: string;
}

interface EstimateItem {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'major' | 'minor' | 'advisory';
  laborHours: number;
  laborRate: number;
  partsPrice: number;
  totalPrice: number;
  status: 'pending' | 'approved' | 'declined';
  aiInsights?: string;
  videoTimestamp?: number;
  annotationId?: string;
}

interface Comment {
  id: string;
  estimateId?: string;
  message: string;
  author: 'customer' | 'mechanic';
  timestamp: Date;
}

export const CustomerApproval: React.FC<CustomerApprovalProps> = ({ inspectionId }) => {
  const [inspection, setInspection] = useState<any>(null);
  const [video, setVideo] = useState<any>(null);
  const [annotations, setAnnotations] = useState<VideoAnnotation[]>([]);
  const [estimates, setEstimates] = useState<EstimateItem[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [selectedEstimate, setSelectedEstimate] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showAIInsights, setShowAIInsights] = useState(true);

  const videoRef = React.useRef<HTMLVideoElement>(null);

  const loadInspectionData = useCallback(async () => {
    try {
      // Load inspection
      const inspectionData = await blink.db.inspections.list({
        where: { id: inspectionId },
        limit: 1
      });
      
      if (inspectionData.length > 0) {
        setInspection(inspectionData[0]);
      }

      // Load video
      const videoData = await blink.db.inspection_media.list({
        where: { 
          inspection_id: inspectionId,
          type: 'video'
        },
        limit: 1
      });
      
      if (videoData.length > 0) {
        setVideo(videoData[0]);
        
        // Parse annotations
        try {
          const parsedAnnotations = JSON.parse(videoData[0].annotations || '[]');
          setAnnotations(parsedAnnotations);
        } catch (error) {
          console.error('Error parsing annotations:', error);
        }
      }

      // Load estimates (mock data for now)
      const mockEstimates: EstimateItem[] = [
        {
          id: 'est_1',
          title: 'Brake Pad Replacement',
          description: 'Front brake pads are worn below minimum thickness. Immediate replacement required for safety.',
          severity: 'critical',
          laborHours: 2,
          laborRate: 120,
          partsPrice: 180,
          totalPrice: 420,
          status: 'pending',
          aiInsights: 'AI analysis detected brake pad thickness at 2mm (minimum safe: 3mm). Rotor surface shows minor scoring but within acceptable limits.',
          videoTimestamp: 45,
          annotationId: 'annotation_1'
        },
        {
          id: 'est_2',
          title: 'Oil Change Service',
          description: 'Engine oil is due for replacement based on mileage and condition.',
          severity: 'minor',
          laborHours: 0.5,
          laborRate: 120,
          partsPrice: 45,
          totalPrice: 105,
          status: 'pending',
          aiInsights: 'Oil analysis shows normal wear metals. Viscosity within acceptable range but approaching service interval.',
          videoTimestamp: 120
        },
        {
          id: 'est_3',
          title: 'Air Filter Replacement',
          description: 'Air filter shows moderate contamination and should be replaced for optimal engine performance.',
          severity: 'advisory',
          laborHours: 0.25,
          laborRate: 120,
          partsPrice: 25,
          totalPrice: 55,
          status: 'pending',
          aiInsights: 'Filter contamination at 60%. Engine performance impact minimal but fuel efficiency may be affected.',
          videoTimestamp: 180
        }
      ];
      
      setEstimates(mockEstimates);

      // Load comments (mock data)
      const mockComments: Comment[] = [
        {
          id: 'comment_1',
          estimateId: 'est_1',
          message: 'How urgent is this brake repair? Can I drive for a few more days?',
          author: 'customer',
          timestamp: new Date(Date.now() - 3600000)
        },
        {
          id: 'comment_2',
          estimateId: 'est_1',
          message: 'This is a critical safety issue. I recommend addressing this immediately. The brake pads are below the minimum safe thickness.',
          author: 'mechanic',
          timestamp: new Date(Date.now() - 1800000)
        }
      ];
      
      setComments(mockComments);

    } catch (error) {
      console.error('Error loading inspection data:', error);
    }
  }, [inspectionId]);

  useEffect(() => {
    loadInspectionData();
  }, [loadInspectionData]);

  const handleVideoTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleVideoLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  const seekToTimestamp = useCallback((timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      videoRef.current.play();
      setIsVideoPlaying(true);
    }
  }, []);

  const toggleVideoPlayback = useCallback(() => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  }, [isVideoPlaying]);

  const toggleVideoMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isVideoMuted;
      setIsVideoMuted(!isVideoMuted);
    }
  }, [isVideoMuted]);

  const handleEstimateAction = useCallback(async (estimateId: string, action: 'approve' | 'decline') => {
    try {
      setEstimates(prev => prev.map(est => 
        est.id === estimateId 
          ? { ...est, status: action === 'approve' ? 'approved' : 'declined' }
          : est
      ));

      // Save to database
      await blink.db.estimates.upsert({
        id: estimateId,
        inspection_id: inspectionId,
        status: action === 'approve' ? 'approved' : 'declined',
        updated_at: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error updating estimate:', error);
    }
  }, [inspectionId]);

  const handleApproveAll = useCallback(async () => {
    try {
      const pendingEstimates = estimates.filter(est => est.status === 'pending');
      
      for (const estimate of pendingEstimates) {
        await handleEstimateAction(estimate.id, 'approve');
      }
    } catch (error) {
      console.error('Error approving all estimates:', error);
    }
  }, [estimates, handleEstimateAction]);

  const addComment = useCallback(async (estimateId?: string) => {
    if (!newComment.trim()) return;

    try {
      const comment: Comment = {
        id: `comment_${Date.now()}`,
        estimateId,
        message: newComment,
        author: 'customer',
        timestamp: new Date()
      };

      setComments(prev => [...prev, comment]);
      setNewComment('');

      // Save to database
      await blink.db.customer_messages.create({
        id: comment.id,
        inspection_id: inspectionId,
        estimate_id: estimateId || null,
        message: comment.message,
        sender_type: 'customer',
        created_at: comment.timestamp.toISOString()
      });

    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }, [newComment, inspectionId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'major': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'minor': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'advisory': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'major': return <Wrench className="w-4 h-4" />;
      case 'minor': return <Clock className="w-4 h-4" />;
      case 'advisory': return <Eye className="w-4 h-4" />;
      default: return null;
    }
  };

  const totalEstimate = estimates.reduce((sum, est) => sum + est.totalPrice, 0);
  const approvedTotal = estimates.filter(est => est.status === 'approved').reduce((sum, est) => sum + est.totalPrice, 0);

  if (!inspection) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Inspection Results & Estimates
          </h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Inspection Date: {new Date(inspection.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Vehicle & Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Vehicle Information</h3>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <p><span className="font-medium">Vehicle:</span> {inspection.year} {inspection.make} {inspection.model}</p>
              <p><span className="font-medium">VIN:</span> {inspection.vin || 'Not available'}</p>
              <p><span className="font-medium">Mileage:</span> {inspection.mileage?.toLocaleString() || 'N/A'} miles</p>
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Customer Information</h3>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>{inspection.customer_name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>{inspection.customer_phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>{inspection.customer_email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video Player */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Inspection Video
          </h2>
          
          {video ? (
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  src={video.url}
                  className="w-full h-64 bg-black rounded-lg"
                  onTimeUpdate={handleVideoTimeUpdate}
                  onLoadedMetadata={handleVideoLoadedMetadata}
                />
                
                {/* Video Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 rounded-b-lg">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={toggleVideoPlayback}
                        className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                      >
                        {isVideoPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={toggleVideoMute}
                        className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                      >
                        {isVideoMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </button>
                      <span className="text-sm">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Video Annotations */}
              {annotations.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Tagged Issues</h3>
                  <div className="space-y-2">
                    {annotations.map(annotation => (
                      <button
                        key={annotation.id}
                        onClick={() => seekToTimestamp(annotation.timestamp)}
                        className="w-full flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            annotation.severity === 'critical' ? 'bg-red-500' :
                            annotation.severity === 'major' ? 'bg-orange-500' :
                            annotation.severity === 'minor' ? 'bg-yellow-500' : 'bg-blue-500'
                          }`}></div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{annotation.title}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{annotation.description}</p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatTime(annotation.timestamp)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400">No video available</p>
            </div>
          )}
        </div>

        {/* Estimates */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Repair Estimates
            </h2>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Estimate</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalEstimate)}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {estimates.map(estimate => (
              <div key={estimate.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">{estimate.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(estimate.severity)}`}>
                        <div className="flex items-center space-x-1">
                          {getSeverityIcon(estimate.severity)}
                          <span className="capitalize">{estimate.severity}</span>
                        </div>
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{estimate.description}</p>
                    
                    {/* Price Breakdown */}
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <div className="flex justify-between">
                        <span>Labor ({estimate.laborHours}h @ {formatCurrency(estimate.laborRate)}/h):</span>
                        <span>{formatCurrency(estimate.laborHours * estimate.laborRate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Parts:</span>
                        <span>{formatCurrency(estimate.partsPrice)}</span>
                      </div>
                      <div className="flex justify-between font-medium text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-600 pt-1">
                        <span>Total:</span>
                        <span>{formatCurrency(estimate.totalPrice)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {estimate.videoTimestamp && (
                    <button
                      onClick={() => seekToTimestamp(estimate.videoTimestamp!)}
                      className="ml-4 p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                      title="View in video"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* AI Insights */}
                {estimate.aiInsights && showAIInsights && (
                  <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">AI Analysis</h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">{estimate.aiInsights}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {estimate.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleEstimateAction(estimate.id, 'approve')}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleEstimateAction(estimate.id, 'decline')}
                          className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Decline</span>
                        </button>
                      </>
                    ) : (
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        estimate.status === 'approved' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {estimate.status === 'approved' ? 'Approved' : 'Declined'}
                      </span>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setSelectedEstimate(selectedEstimate === estimate.id ? null : estimate.id)}
                    className="flex items-center space-x-1 px-3 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Comment</span>
                  </button>
                </div>

                {/* Comments Section */}
                {selectedEstimate === estimate.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="space-y-3 mb-3">
                      {comments.filter(c => c.estimateId === estimate.id).map(comment => (
                        <div key={comment.id} className={`p-3 rounded-lg ${
                          comment.author === 'customer' 
                            ? 'bg-blue-50 dark:bg-blue-900/20 ml-4' 
                            : 'bg-gray-50 dark:bg-gray-700 mr-4'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {comment.author === 'customer' ? 'You' : 'Mechanic'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {comment.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{comment.message}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Ask a question about this estimate..."
                        className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && addComment(estimate.id)}
                      />
                      <button
                        onClick={() => addComment(estimate.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bulk Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Approved: {formatCurrency(approvedTotal)} of {formatCurrency(totalEstimate)}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleApproveAll}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve All</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Calendar className="w-4 h-4" />
                  <span>Schedule Service</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* General Comments */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          General Questions & Comments
        </h2>
        
        <div className="space-y-3 mb-4">
          {comments.filter(c => !c.estimateId).map(comment => (
            <div key={comment.id} className={`p-3 rounded-lg ${
              comment.author === 'customer' 
                ? 'bg-blue-50 dark:bg-blue-900/20 ml-8' 
                : 'bg-gray-50 dark:bg-gray-700 mr-8'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {comment.author === 'customer' ? 'You' : 'Mechanic'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {comment.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{comment.message}</p>
            </div>
          ))}
        </div>
        
        <div className="flex space-x-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Ask a general question about your vehicle..."
            className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            onKeyPress={(e) => e.key === 'Enter' && addComment()}
          />
          <button
            onClick={() => addComment()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      </div>

      {/* AI Insights Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">AI Analysis & Insights</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Show AI-powered analysis and recommendations alongside mechanic findings
            </p>
          </div>
          <button
            onClick={() => setShowAIInsights(!showAIInsights)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              showAIInsights 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'
            }`}
          >
            {showAIInsights ? 'Hide AI Insights' : 'Show AI Insights'}
          </button>
        </div>
      </div>
    </div>
  );
};
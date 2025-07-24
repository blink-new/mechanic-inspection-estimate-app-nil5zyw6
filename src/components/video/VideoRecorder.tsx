import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Video, 
  Square, 
  Play, 
  Pause, 
  RotateCcw,
  Timer,
  Mic,
  MicOff,
  Tag,
  Pencil,
  Circle,
  Square as RectIcon,
  ArrowRight,
  Type,
  Palette,
  Save,
  Trash2
} from 'lucide-react';
import { blink } from '../../blink/client';
import { VideoAnnotation, DrawingData, Point } from '../../types/videoAnnotation';

interface VideoRecorderProps {
  inspectionId: string;
  onVideoSaved?: (videoId: string) => void;
}

export const VideoRecorder: React.FC<VideoRecorderProps> = ({ inspectionId, onVideoSaved }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [annotations, setAnnotations] = useState<VideoAnnotation[]>([]);
  const [currentAnnotation, setCurrentAnnotation] = useState<Partial<VideoAnnotation> | null>(null);
  const [drawingMode, setDrawingMode] = useState<'freehand' | 'rectangle' | 'circle' | 'arrow' | 'text' | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#ff0000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [showAnnotationForm, setShowAnnotationForm] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState<VideoAnnotation | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const drawingPathRef = useRef<Point[]>([]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: isAudioEnabled
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  }, [isAudioEnabled]);

  const startRecording = useCallback(async () => {
    if (!streamRef.current) {
      await startCamera();
    }

    // Start countdown
    setCountdown(3);
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          
          // Start actual recording
          try {
            const mediaRecorder = new MediaRecorder(streamRef.current!, {
              mimeType: 'video/webm;codecs=vp9'
            });
            
            mediaRecorderRef.current = mediaRecorder;
            recordedChunksRef.current = [];
            
            mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                recordedChunksRef.current.push(event.data);
              }
            };
            
            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            
            // Start timer
            timerRef.current = setInterval(() => {
              setRecordingTime(prev => prev + 1);
            }, 1000);
            
          } catch (error) {
            console.error('Error starting recording:', error);
          }
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [startCamera]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        if (timerRef.current) {
          timerRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
          }, 1000);
        }
      } else {
        mediaRecorderRef.current.pause();
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
      setIsPaused(!isPaused);
    }
  }, [isRecording, isPaused]);

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Wait for data to be available
      setTimeout(async () => {
        try {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const videoFile = new File([blob], `inspection_${Date.now()}.webm`, { type: 'video/webm' });
          
          // Upload video to storage
          const { publicUrl } = await blink.storage.upload(
            videoFile,
            `inspections/${inspectionId}/videos/${videoFile.name}`,
            { upsert: true }
          );
          
          // Save video record to database
          const videoRecord = await blink.db.inspection_media.create({
            id: `video_${Date.now()}`,
            inspection_id: inspectionId,
            type: 'video',
            url: publicUrl,
            filename: videoFile.name,
            size: blob.size,
            duration: recordingTime,
            annotations: JSON.stringify(annotations),
            created_at: new Date().toISOString()
          });
          
          if (onVideoSaved) {
            onVideoSaved(videoRecord.id);
          }
          
          // Reset state
          setRecordingTime(0);
          setAnnotations([]);
          recordedChunksRef.current = [];
          
        } catch (error) {
          console.error('Error saving video:', error);
        }
      }, 1000);
    }
  }, [isRecording, recordingTime, annotations, inspectionId, onVideoSaved]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingMode || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    drawingPathRef.current = [{ x, y }];
    
    if (drawingMode === 'text') {
      // For text mode, immediately show annotation form
      setCurrentAnnotation({
        timestamp: recordingTime,
        position: { x, y },
        type: 'issue'
      });
      setShowAnnotationForm(true);
    }
  }, [drawingMode, recordingTime]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawingMode || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    drawingPathRef.current.push({ x, y });
    
    // Draw on canvas
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = drawingColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      
      if (drawingMode === 'freehand') {
        const path = drawingPathRef.current;
        if (path.length > 1) {
          ctx.beginPath();
          ctx.moveTo(path[path.length - 2].x, path[path.length - 2].y);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      }
    }
  }, [isDrawing, drawingMode, drawingColor, strokeWidth]);

  const handleCanvasMouseUp = useCallback(() => {
    if (!isDrawing || !drawingMode) return;
    
    setIsDrawing(false);
    
    if (drawingMode !== 'text' && drawingPathRef.current.length > 0) {
      // Create annotation for non-text drawings
      const drawing: DrawingData = {
        type: drawingMode,
        points: drawingPathRef.current,
        color: drawingColor,
        strokeWidth,
      };
      
      setCurrentAnnotation({
        timestamp: recordingTime,
        position: drawingPathRef.current[0],
        type: 'issue',
        drawing
      });
      setShowAnnotationForm(true);
    }
    
    drawingPathRef.current = [];
  }, [isDrawing, drawingMode, drawingColor, strokeWidth, recordingTime]);

  const saveAnnotation = useCallback((title: string, description: string, severity: 'critical' | 'major' | 'minor' | 'advisory') => {
    if (!currentAnnotation) return;
    
    const annotation: VideoAnnotation = {
      id: `annotation_${Date.now()}`,
      videoId: `video_${Date.now()}`, // This will be updated when video is saved
      timestamp: currentAnnotation.timestamp!,
      type: currentAnnotation.type!,
      severity,
      title,
      description,
      position: currentAnnotation.position!,
      drawing: currentAnnotation.drawing,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setAnnotations(prev => [...prev, annotation]);
    setCurrentAnnotation(null);
    setShowAnnotationForm(false);
    setDrawingMode(null);
  }, [currentAnnotation]);

  const deleteAnnotation = useCallback((annotationId: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== annotationId));
    setSelectedAnnotation(null);
  }, []);

  useEffect(() => {
    startCamera();
  }, [startCamera]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Video Recording & Issue Tagging
        </h1>
        
        {/* Recording Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={countdown > 0}
                className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <Video className="w-5 h-5" />
                <span>{countdown > 0 ? `Starting in ${countdown}...` : 'Start Recording'}</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={pauseRecording}
                  className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>
                <button
                  onClick={stopRecording}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop</span>
                </button>
              </div>
            )}
            
            <button
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              className={`p-2 rounded-lg border transition-colors ${
                isAudioEnabled 
                  ? 'bg-green-100 text-green-800 border-green-300' 
                  : 'bg-red-100 text-red-800 border-red-300'
              }`}
            >
              {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <Timer className="w-5 h-5" />
              <span className="font-mono text-lg">{formatTime(recordingTime)}</span>
            </div>
            {isRecording && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                <span className="text-red-600 font-medium">REC</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Preview & Annotation Canvas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            muted
            className="w-full h-96 bg-black rounded-lg"
          />
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="absolute top-0 left-0 w-full h-96 cursor-crosshair"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            style={{ display: drawingMode ? 'block' : 'none' }}
          />
          
          {/* Countdown Overlay */}
          {countdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
              <div className="text-6xl font-bold text-white animate-pulse">
                {countdown}
              </div>
            </div>
          )}
        </div>

        {/* Drawing Tools */}
        {isRecording && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Issue Tagging Tools</h3>
            
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setDrawingMode(drawingMode === 'freehand' ? null : 'freehand')}
                  className={`p-2 rounded-lg border transition-colors ${
                    drawingMode === 'freehand' 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-500'
                  }`}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDrawingMode(drawingMode === 'rectangle' ? null : 'rectangle')}
                  className={`p-2 rounded-lg border transition-colors ${
                    drawingMode === 'rectangle' 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-500'
                  }`}
                >
                  <RectIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDrawingMode(drawingMode === 'circle' ? null : 'circle')}
                  className={`p-2 rounded-lg border transition-colors ${
                    drawingMode === 'circle' 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-500'
                  }`}
                >
                  <Circle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDrawingMode(drawingMode === 'arrow' ? null : 'arrow')}
                  className={`p-2 rounded-lg border transition-colors ${
                    drawingMode === 'arrow' 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-500'
                  }`}
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDrawingMode(drawingMode === 'text' ? null : 'text')}
                  className={`p-2 rounded-lg border transition-colors ${
                    drawingMode === 'text' 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-500'
                  }`}
                >
                  <Type className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Palette className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <input
                  type="color"
                  value={drawingColor}
                  onChange={(e) => setDrawingColor(e.target.value)}
                  className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600"
                />
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">{strokeWidth}px</span>
              </div>
            </div>
            
            {drawingMode && (
              <div className="text-sm text-blue-600 dark:text-blue-400">
                Click and drag on the video to {drawingMode === 'text' ? 'add text annotation' : `draw ${drawingMode}`}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Annotations List */}
      {annotations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Tagged Issues ({annotations.length})
          </h2>
          
          <div className="space-y-3">
            {annotations.map(annotation => (
              <div key={annotation.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    annotation.severity === 'critical' ? 'bg-red-500' :
                    annotation.severity === 'major' ? 'bg-orange-500' :
                    annotation.severity === 'minor' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{annotation.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {annotation.description} • {formatTime(annotation.timestamp)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteAnnotation(annotation.id)}
                  className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Annotation Form Modal */}
      {showAnnotationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tag Issue
            </h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              saveAnnotation(
                formData.get('title') as string,
                formData.get('description') as string,
                formData.get('severity') as 'critical' | 'major' | 'minor' | 'advisory'
              );
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Issue Title
                  </label>
                  <input
                    name="title"
                    type="text"
                    required
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Brake pad wear"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={3}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    placeholder="Describe the issue in detail..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Severity
                  </label>
                  <select
                    name="severity"
                    required
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="critical">Critical - Immediate attention required</option>
                    <option value="major">Major - Should be addressed soon</option>
                    <option value="minor">Minor - Can wait for next service</option>
                    <option value="advisory">Advisory - Recommend monitoring</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAnnotationForm(false);
                    setCurrentAnnotation(null);
                    setDrawingMode(null);
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Issue</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
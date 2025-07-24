export interface VideoAnnotation {
  id: string;
  videoId: string;
  timestamp: number; // seconds into video
  type: 'issue' | 'note' | 'highlight';
  severity?: 'critical' | 'major' | 'minor' | 'advisory';
  title: string;
  description: string;
  position: {
    x: number;
    y: number;
  };
  drawing?: DrawingData;
  estimateId?: string;
  aiSuggested?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DrawingData {
  type: 'freehand' | 'rectangle' | 'circle' | 'arrow' | 'text';
  points: Point[];
  color: string;
  strokeWidth: number;
  fillColor?: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface VideoRecording {
  id: string;
  inspectionId: string;
  filename: string;
  url: string;
  duration: number;
  size: number;
  annotations: VideoAnnotation[];
  aiAnalysis?: AIVideoAnalysis;
  createdAt: Date;
}

export interface AIVideoAnalysis {
  id: string;
  videoId: string;
  detectedIssues: DetectedIssue[];
  confidence: number;
  processingTime: number;
  analysisDate: Date;
}

export interface DetectedIssue {
  type: string;
  description: string;
  confidence: number;
  timestamp: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  severity: 'critical' | 'major' | 'minor' | 'advisory';
  suggestedAction: string;
}
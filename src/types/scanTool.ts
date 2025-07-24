export interface ScanTool {
  id: string;
  name: string;
  type: 'bluetooth' | 'usb';
  status: 'connected' | 'disconnected' | 'connecting';
  manufacturer: string;
  model: string;
  protocols: string[];
}

export interface ScanData {
  id: string;
  toolId: string;
  vehicleId: string;
  timestamp: Date;
  dtcCodes: DTCCode[];
  liveData: LiveDataPoint[];
  freezeFrameData: FreezeFrameData[];
  readinessMonitors: ReadinessMonitor[];
}

export interface DTCCode {
  code: string;
  description: string;
  severity: 'critical' | 'major' | 'minor';
  system: string;
  status: 'active' | 'pending' | 'permanent' | 'history';
}

export interface LiveDataPoint {
  parameter: string;
  value: number;
  unit: string;
  min?: number;
  max?: number;
  status: 'normal' | 'warning' | 'critical';
}

export interface FreezeFrameData {
  dtcCode: string;
  parameters: LiveDataPoint[];
  timestamp: Date;
}

export interface ReadinessMonitor {
  name: string;
  status: 'ready' | 'not_ready' | 'not_applicable';
  description: string;
}

export interface VINData {
  vin: string;
  make: string;
  model: string;
  year: number;
  engine: string;
  transmission: string;
  drivetrain: string;
  fuelType: string;
  bodyStyle: string;
}
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Car, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Wrench,
  DollarSign,
  BarChart3,
  Activity,
  Battery,
  Thermometer,
  Gauge
} from 'lucide-react';
import { blink } from '../../blink/client';

interface VehicleHealth {
  overall: number;
  engine: number;
  brakes: number;
  transmission: number;
  electrical: number;
  suspension: number;
}

interface MaintenanceAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  dueDate: Date;
  mileage?: number;
  estimatedCost: number;
}

interface HistoricalData {
  date: Date;
  mileage: number;
  healthScore: number;
  maintenanceCost: number;
  issues: number;
}

interface DigitalTwinDashboardProps {
  vehicleId: string;
}

export const DigitalTwinDashboard: React.FC<DigitalTwinDashboardProps> = ({ vehicleId }) => {
  const [vehicleHealth, setVehicleHealth] = useState<VehicleHealth>({
    overall: 85,
    engine: 90,
    brakes: 75,
    transmission: 88,
    electrical: 92,
    suspension: 80
  });
  
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<MaintenanceAlert[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVehicleData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load vehicle inspections and generate health data
      const inspections = await blink.db.inspections.list({
        where: { vehicle_id: vehicleId },
        orderBy: { created_at: 'desc' },
        limit: 10
      });

      // Generate mock maintenance alerts based on vehicle data
      const alerts: MaintenanceAlert[] = [
        {
          id: 'alert_1',
          type: 'warning',
          title: 'Brake Pad Replacement Due',
          description: 'Front brake pads are approaching minimum thickness',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          mileage: 75000,
          estimatedCost: 420
        },
        {
          id: 'alert_2',
          type: 'info',
          title: 'Oil Change Recommended',
          description: 'Next oil change due based on mileage',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
          mileage: 73500,
          estimatedCost: 85
        },
        {
          id: 'alert_3',
          type: 'critical',
          title: 'Timing Belt Inspection',
          description: 'Timing belt should be inspected at this mileage interval',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          mileage: 75000,
          estimatedCost: 650
        }
      ];
      
      setMaintenanceAlerts(alerts);

      // Generate historical data
      const historical: HistoricalData[] = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        
        historical.push({
          date,
          mileage: 70000 + (11 - i) * 500,
          healthScore: 85 + Math.random() * 10 - 5,
          maintenanceCost: Math.random() * 500 + 100,
          issues: Math.floor(Math.random() * 3)
        });
      }
      
      setHistoricalData(historical);
      
    } catch (error) {
      console.error('Error loading vehicle data:', error);
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    loadVehicleData();
  }, [loadVehicleData]);

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 75) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-5 h-5" />;
    if (score >= 75) return <Clock className="w-5 h-5" />;
    return <AlertTriangle className="w-5 h-5" />;
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning': return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'info': return <CheckCircle className="w-5 h-5 text-blue-600" />;
      default: return <CheckCircle className="w-5 h-5" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Vehicle Health Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Vehicle Health Overview
          </h2>
          <div className="flex items-center space-x-2">
            <Car className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Digital Twin</span>
          </div>
        </div>

        {/* Overall Health Score */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Health</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{vehicleHealth.overall}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${
                vehicleHealth.overall >= 90 ? 'bg-green-500' :
                vehicleHealth.overall >= 75 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${vehicleHealth.overall}%` }}
            ></div>
          </div>
        </div>

        {/* System Health Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { name: 'Engine', score: vehicleHealth.engine, icon: Activity },
            { name: 'Brakes', score: vehicleHealth.brakes, icon: Gauge },
            { name: 'Transmission', score: vehicleHealth.transmission, icon: Wrench },
            { name: 'Electrical', score: vehicleHealth.electrical, icon: Battery },
            { name: 'Suspension', score: vehicleHealth.suspension, icon: TrendingUp },
          ].map(system => {
            const Icon = system.icon;
            return (
              <div key={system.name} className={`p-3 rounded-lg border ${getHealthColor(system.score)}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{system.name}</span>
                  </div>
                  {getHealthIcon(system.score)}
                </div>
                <div className="text-lg font-bold">{system.score}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Predictive Maintenance Alerts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Predictive Maintenance Alerts
          </h2>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded text-sm">
            {maintenanceAlerts.length} alerts
          </span>
        </div>

        <div className="space-y-3">
          {maintenanceAlerts.map(alert => (
            <div key={alert.id} className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
              {getAlertIcon(alert.type)}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">{alert.title}</h3>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(alert.estimatedCost)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{alert.description}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>Due: {alert.dueDate.toLocaleDateString()}</span>
                  </div>
                  {alert.mileage && (
                    <div className="flex items-center space-x-1">
                      <Gauge className="w-3 h-3" />
                      <span>{alert.mileage.toLocaleString()} miles</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Trends */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Historical Trends
          </h2>
          <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Health Score Trend */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Health Score Trend</h3>
            <div className="space-y-2">
              {historicalData.slice(-6).map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {data.date.toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                      <div 
                        className="h-1 bg-blue-500 rounded-full"
                        style={{ width: `${data.healthScore}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium text-gray-900 dark:text-white w-8">
                      {Math.round(data.healthScore)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Maintenance Costs */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Maintenance Costs</h3>
            <div className="space-y-2">
              {historicalData.slice(-6).map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {data.date.toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                      {formatCurrency(data.maintenanceCost)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Issues Detected */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Issues Detected</h3>
            <div className="space-y-2">
              {historicalData.slice(-6).map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {data.date.toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                      {data.issues}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Resale Value Impact */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Resale Value Impact
          </h2>
          <TrendingUp className="w-5 h-5 text-green-600" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Estimated Value</h3>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">$18,500</div>
            <div className="flex items-center space-x-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-green-600">+2.5% from last month</span>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Maintenance Impact</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Regular maintenance</span>
                <span className="text-sm font-medium text-green-600">+$1,200</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Documented history</span>
                <span className="text-sm font-medium text-green-600">+$800</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pending issues</span>
                <span className="text-sm font-medium text-red-600">-$350</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
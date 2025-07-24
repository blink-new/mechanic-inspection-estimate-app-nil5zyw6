import React, { useState, useEffect, useCallback } from 'react';
import { 
  Car, 
  Scan, 
  Mic, 
  MicOff, 
  Play, 
  Upload, 
  Bluetooth, 
  Usb,
  CheckCircle,
  AlertTriangle,
  Clock,
  Settings
} from 'lucide-react';
import { blink } from '../../blink/client';
import { useVoiceCommands } from '../../hooks/useVoiceCommands';
import { scanToolService } from '../../services/scanToolService';
import { ScanTool, ScanData, VINData } from '../../types/scanTool';
import { inspectionTemplates } from '../../data/inspectionTemplates';

interface InspectionChecklistProps {
  inspectionId: string;
}

export const InspectionChecklist: React.FC<InspectionChecklistProps> = ({ inspectionId }) => {
  const [inspection, setInspection] = useState<any>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, 'pass' | 'fail' | 'advisory'>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [availableTools, setAvailableTools] = useState<ScanTool[]>([]);
  const [connectedTool, setConnectedTool] = useState<ScanTool | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanData, setScanData] = useState<ScanData | null>(null);
  const [vinData, setVinData] = useState<VINData | null>(null);
  const [isVinScanning, setIsVinScanning] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const loadInspection = useCallback(async () => {
    try {
      const inspectionData = await blink.db.inspections.list({
        where: { id: inspectionId },
        limit: 1
      });
      
      if (inspectionData.length > 0) {
        setInspection(inspectionData[0]);
        
        // Load existing checklist items
        const items = await blink.db.inspection_items.list({
          where: { inspection_id: inspectionId }
        });
        
        const itemsMap: Record<string, 'pass' | 'fail' | 'advisory'> = {};
        const notesMap: Record<string, string> = {};
        
        items.forEach(item => {
          itemsMap[item.item_name] = item.status as 'pass' | 'fail' | 'advisory';
          if (item.notes) {
            notesMap[item.item_name] = item.notes;
          }
        });
        
        setCheckedItems(itemsMap);
        setNotes(notesMap);
      }
    } catch (error) {
      console.error('Error loading inspection:', error);
    }
  }, [inspectionId]);

  const loadScanTools = useCallback(async () => {
    try {
      const tools = await scanToolService.getAvailableTools();
      setAvailableTools(tools);
      
      const connected = scanToolService.getConnectedTools();
      if (connected.length > 0) {
        setConnectedTool(connected[0]);
      }
    } catch (error) {
      console.error('Error loading scan tools:', error);
    }
  }, []);

  const handleItemCheck = useCallback(async (itemName: string, status: 'pass' | 'fail' | 'advisory') => {
    try {
      setCheckedItems(prev => ({ ...prev, [itemName]: status }));
      
      // Save to database
      await blink.db.inspection_items.upsert({
        inspection_id: inspectionId,
        item_name: itemName,
        status,
        notes: notes[itemName] || '',
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating item:', error);
    }
  }, [inspectionId, notes]);

  const handleNoteChange = async (itemName: string, note: string) => {
    try {
      setNotes(prev => ({ ...prev, [itemName]: note }));
      
      // Save to database
      await blink.db.inspection_items.upsert({
        inspection_id: inspectionId,
        item_name: itemName,
        status: checkedItems[itemName] || 'pass',
        notes: note,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleConnectTool = async (toolId: string) => {
    try {
      const success = await scanToolService.connectTool(toolId);
      if (success) {
        const tool = availableTools.find(t => t.id === toolId);
        if (tool) {
          setConnectedTool(tool);
        }
      }
    } catch (error) {
      console.error('Error connecting tool:', error);
    }
  };

  const handleVinScan = useCallback(async () => {
    if (!connectedTool) return;
    
    try {
      setIsVinScanning(true);
      const vin = await scanToolService.scanVIN(connectedTool.id);
      if (vin) {
        setVinData(vin);
        
        // Update inspection with VIN data
        await blink.db.inspections.update(inspectionId, {
          vin: vin.vin,
          make: vin.make,
          model: vin.model,
          year: vin.year.toString(),
          updated_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error scanning VIN:', error);
    } finally {
      setIsVinScanning(false);
    }
  }, [connectedTool, inspectionId]);

  const handleDiagnosticScan = useCallback(async () => {
    if (!connectedTool || !inspection) return;
    
    try {
      setIsScanning(true);
      const data = await scanToolService.performDiagnosticScan(connectedTool.id, inspection.vehicle_id);
      if (data) {
        setScanData(data);
        
        // Auto-populate checklist based on scan data
        if (data.dtcCodes.length > 0) {
          const updates: Record<string, 'pass' | 'fail' | 'advisory'> = {};
          
          data.dtcCodes.forEach(code => {
            if (code.system.toLowerCase().includes('engine')) {
              updates['Engine Oil Level'] = code.severity === 'critical' ? 'fail' : 'advisory';
            } else if (code.system.toLowerCase().includes('emission')) {
              updates['Exhaust System'] = code.severity === 'critical' ? 'fail' : 'advisory';
            } else if (code.system.toLowerCase().includes('fuel')) {
              updates['Fuel System'] = code.severity === 'critical' ? 'fail' : 'advisory';
            }
          });
          
          setCheckedItems(prev => ({ ...prev, ...updates }));
        }
      }
    } catch (error) {
      console.error('Error performing diagnostic scan:', error);
    } finally {
      setIsScanning(false);
    }
  }, [connectedTool, inspection]);

  const handleVoiceCommand = useCallback((command: string) => {
    const lowerCommand = command.toLowerCase();
    
    // Voice commands for checklist items
    if (lowerCommand.includes('pass') || lowerCommand.includes('good') || lowerCommand.includes('ok')) {
      const itemMatch = lowerCommand.match(/(engine|brake|tire|light|fluid|belt|battery|suspension)/);
      if (itemMatch) {
        const item = itemMatch[1];
        handleItemCheck(item, 'pass');
      }
    } else if (lowerCommand.includes('fail') || lowerCommand.includes('bad') || lowerCommand.includes('problem')) {
      const itemMatch = lowerCommand.match(/(engine|brake|tire|light|fluid|belt|battery|suspension)/);
      if (itemMatch) {
        const item = itemMatch[1];
        handleItemCheck(item, 'fail');
      }
    } else if (lowerCommand.includes('advisory') || lowerCommand.includes('recommend')) {
      const itemMatch = lowerCommand.match(/(engine|brake|tire|light|fluid|belt|battery|suspension)/);
      if (itemMatch) {
        const item = itemMatch[1];
        handleItemCheck(item, 'advisory');
      }
    }
    
    // Voice commands for scan tools
    if (lowerCommand.includes('scan vin')) {
      handleVinScan();
    } else if (lowerCommand.includes('diagnostic scan')) {
      handleDiagnosticScan();
    }
  }, [handleItemCheck, handleVinScan, handleDiagnosticScan]);

  const { startListening, stopListening, isListening } = useVoiceCommands({
    onCommand: handleVoiceCommand,
    commands: []
  });

  useEffect(() => {
    loadInspection();
    loadScanTools();
  }, [loadInspection, loadScanTools]);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const getStatusColor = (status: 'pass' | 'fail' | 'advisory') => {
    switch (status) {
      case 'pass': return 'text-green-600 bg-green-50 border-green-200';
      case 'fail': return 'text-red-600 bg-red-50 border-red-200';
      case 'advisory': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'advisory') => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-4 h-4" />;
      case 'fail': return <AlertTriangle className="w-4 h-4" />;
      case 'advisory': return <Clock className="w-4 h-4" />;
      default: return null;
    }
  };

  if (!inspection) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Inspection Checklist
          </h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsVoiceActive(!isVoiceActive)}
              className={`p-2 rounded-lg border transition-colors ${
                isVoiceActive 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'
              }`}
            >
              {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Vehicle Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Vehicle
            </label>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {vinData ? `${vinData.year} ${vinData.make} ${vinData.model}` : `${inspection.year} ${inspection.make} ${inspection.model}`}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              VIN
            </label>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {vinData?.vin || inspection.vin || 'Not scanned'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mileage
            </label>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {inspection.mileage?.toLocaleString() || 'N/A'} miles
            </p>
          </div>
        </div>
      </div>

      {/* Scan Tools Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Scan Tools & Diagnostics
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Available Tools */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Available Tools
            </h3>
            <div className="space-y-2">
              {availableTools.map(tool => (
                <div key={tool.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {tool.type === 'bluetooth' ? (
                      <Bluetooth className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Usb className="w-5 h-5 text-green-600" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{tool.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{tool.manufacturer} {tool.model}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleConnectTool(tool.id)}
                    disabled={tool.status === 'connected'}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      tool.status === 'connected'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {tool.status === 'connected' ? 'Connected' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Scan Actions */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Scan Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={handleVinScan}
                disabled={!connectedTool || isVinScanning}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Scan className="w-5 h-5" />
                <span>{isVinScanning ? 'Scanning VIN...' : 'Scan VIN'}</span>
              </button>
              
              <button
                onClick={handleDiagnosticScan}
                disabled={!connectedTool || isScanning}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Car className="w-5 h-5" />
                <span>{isScanning ? 'Scanning...' : 'Diagnostic Scan'}</span>
              </button>
              
              <button className="w-full flex items-center justify-center space-x-2 p-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
                <Upload className="w-5 h-5" />
                <span>Upload Scan Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scan Results */}
        {scanData && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Scan Results</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">DTC Codes: {scanData.dtcCodes.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Live Data Points: {scanData.liveData.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ready Monitors: {scanData.readinessMonitors.filter(m => m.status === 'ready').length}/{scanData.readinessMonitors.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inspection Checklist */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Inspection Items
          </h2>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Play className="w-4 h-4" />
            <span>Start Inspection</span>
          </button>
        </div>

        <div className="space-y-4">
          {inspectionTemplates.automotive.categories.map(category => (
            <div key={category.name} className="border border-gray-200 dark:border-gray-600 rounded-lg">
              <button
                onClick={() => toggleCategory(category.name)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <h3 className="font-medium text-gray-900 dark:text-white">{category.name}</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {category.items.filter(item => checkedItems[item.name]).length}/{category.items.length}
                  </span>
                  <div className={`transform transition-transform ${expandedCategories[category.name] ? 'rotate-180' : ''}`}>
                    ▼
                  </div>
                </div>
              </button>
              
              {expandedCategories[category.name] && (
                <div className="border-t border-gray-200 dark:border-gray-600 p-4 space-y-3">
                  {category.items.map(item => (
                    <div key={item.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-medium text-gray-900 dark:text-white">
                          {item.name}
                        </label>
                        <div className="flex items-center space-x-2">
                          {['pass', 'fail', 'advisory'].map(status => (
                            <button
                              key={status}
                              onClick={() => handleItemCheck(item.name, status as 'pass' | 'fail' | 'advisory')}
                              className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                                checkedItems[item.name] === status
                                  ? getStatusColor(status as 'pass' | 'fail' | 'advisory')
                                  : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              <div className="flex items-center space-x-1">
                                {checkedItems[item.name] === status && getStatusIcon(status as 'pass' | 'fail' | 'advisory')}
                                <span className="capitalize">{status}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <textarea
                        value={notes[item.name] || ''}
                        onChange={(e) => handleNoteChange(item.name, e.target.value)}
                        placeholder="Add notes..."
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Voice Commands Help */}
      {isVoiceActive && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Voice Commands</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800 dark:text-blue-200">
            <div>• "Engine pass" - Mark engine as pass</div>
            <div>• "Brake fail" - Mark brake as fail</div>
            <div>• "Tire advisory" - Mark tire as advisory</div>
            <div>• "Scan VIN" - Start VIN scanning</div>
            <div>• "Diagnostic scan" - Start diagnostic scan</div>
          </div>
        </div>
      )}
    </div>
  );
};
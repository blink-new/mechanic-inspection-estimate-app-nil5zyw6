import React, { useState, useEffect, useCallback } from 'react';
import { 
  Settings, 
  User, 
  CheckSquare, 
  GitBranch, 
  Bluetooth, 
  Brain, 
  Link, 
  Save, 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  Download, 
  Upload,
  ToggleLeft,
  ToggleRight,
  Sliders,
  Wrench,
  Database
} from 'lucide-react';
import { blink } from '../../blink/client';
import { inspectionTemplates } from '../../data/inspectionTemplates';

interface ChecklistTemplate {
  id: string;
  name: string;
  version: string;
  categories: Array<{
    name: string;
    items: Array<{
      name: string;
      description: string;
      required: boolean;
    }>;
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ScanToolConfig {
  id: string;
  name: string;
  type: 'bluetooth' | 'usb';
  connectionString: string;
  autoConnect: boolean;
  enabled: boolean;
}

interface AIConfig {
  enabled: boolean;
  analysisLevel: 'basic' | 'standard' | 'advanced';
  autoSuggestIssues: boolean;
  confidenceThreshold: number;
  enableVoiceCommands: boolean;
  enableImageAnalysis: boolean;
  enablePredictiveMaintenance: boolean;
}

interface IntegrationConfig {
  id: string;
  name: string;
  type: string;
  apiKey: string;
  baseUrl: string;
  enabled: boolean;
  syncSettings: {
    customers: boolean;
    vehicles: boolean;
    parts: boolean;
    estimates: boolean;
  };
}

export const ComprehensiveSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [checklistTemplates, setChecklistTemplates] = useState<ChecklistTemplate[]>([]);
  const [scanToolConfigs, setScanToolConfigs] = useState<ScanToolConfig[]>([]);
  const [aiConfig, setAIConfig] = useState<AIConfig>({
    enabled: true,
    analysisLevel: 'standard',
    autoSuggestIssues: true,
    confidenceThreshold: 0.7,
    enableVoiceCommands: true,
    enableImageAnalysis: true,
    enablePredictiveMaintenance: false
  });
  const [integrationConfigs, setIntegrationConfigs] = useState<IntegrationConfig[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      // Load user profile
      const user = await blink.auth.me();
      setUserProfile(user);

      // Load checklist templates
      const templates = await blink.db.checklist_templates.list();
      const parsedTemplates: ChecklistTemplate[] = templates.map(t => ({
        id: t.id,
        name: t.name,
        version: t.version,
        categories: JSON.parse(t.categories),
        isActive: Number(t.is_active) > 0,
        createdAt: new Date(t.created_at),
        updatedAt: new Date(t.updated_at)
      }));
      setChecklistTemplates(parsedTemplates);

      // Load scan tool configs
      const scanTools = await blink.db.scan_tool_configs.list();
      const parsedScanTools: ScanToolConfig[] = scanTools.map(st => ({
        id: st.id,
        name: st.name,
        type: st.type as 'bluetooth' | 'usb',
        connectionString: st.connection_string,
        autoConnect: Number(st.auto_connect) > 0,
        enabled: Number(st.enabled) > 0
      }));
      setScanToolConfigs(parsedScanTools);

      // Load AI config
      const aiSettings = await blink.db.ai_settings.list({ limit: 1 });
      if (aiSettings.length > 0) {
        const settings = aiSettings[0];
        setAIConfig({
          enabled: Number(settings.enabled) > 0,
          analysisLevel: settings.analysis_level as 'basic' | 'standard' | 'advanced',
          autoSuggestIssues: Number(settings.auto_suggest_issues) > 0,
          confidenceThreshold: settings.confidence_threshold,
          enableVoiceCommands: Number(settings.enable_voice_commands) > 0,
          enableImageAnalysis: Number(settings.enable_image_analysis) > 0,
          enablePredictiveMaintenance: Number(settings.enable_predictive_maintenance) > 0
        });
      }

      // Load integration configs
      const integrations = await blink.db.integration_configs.list();
      const parsedIntegrations: IntegrationConfig[] = integrations.map(i => ({
        id: i.id,
        name: i.name,
        type: i.type,
        apiKey: i.api_key,
        baseUrl: i.base_url,
        enabled: Number(i.enabled) > 0,
        syncSettings: JSON.parse(i.sync_settings)
      }));
      setIntegrationConfigs(parsedIntegrations);

    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveUserProfile = useCallback(async (profileData: any) => {
    try {
      await blink.auth.updateMe(profileData);
      setUserProfile({ ...userProfile, ...profileData });
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  }, [userProfile]);

  const saveChecklistTemplate = useCallback(async (template: ChecklistTemplate) => {
    try {
      await blink.db.checklist_templates.upsert({
        id: template.id,
        name: template.name,
        version: template.version,
        categories: JSON.stringify(template.categories),
        is_active: template.isActive ? "1" : "0",
        updated_at: new Date().toISOString()
      });
      
      setChecklistTemplates(prev => 
        prev.map(t => t.id === template.id ? template : t)
      );
      setShowTemplateEditor(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Error saving template:', error);
    }
  }, []);

  const createNewTemplate = useCallback(() => {
    const newTemplate: ChecklistTemplate = {
      id: `template_${Date.now()}`,
      name: 'New Template',
      version: '1.0',
      categories: inspectionTemplates.automotive.categories,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setEditingTemplate(newTemplate);
    setShowTemplateEditor(true);
  }, []);

  const duplicateTemplate = useCallback((template: ChecklistTemplate) => {
    const duplicated: ChecklistTemplate = {
      ...template,
      id: `template_${Date.now()}`,
      name: `${template.name} (Copy)`,
      version: '1.0',
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setEditingTemplate(duplicated);
    setShowTemplateEditor(true);
  }, []);

  const deleteTemplate = useCallback(async (templateId: string) => {
    try {
      await blink.db.checklist_templates.delete(templateId);
      setChecklistTemplates(prev => prev.filter(t => t.id !== templateId));
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  }, []);

  const setActiveTemplate = useCallback(async (templateId: string) => {
    try {
      // Deactivate all templates
      for (const template of checklistTemplates) {
        await blink.db.checklist_templates.update(template.id, {
          is_active: "0",
          updated_at: new Date().toISOString()
        });
      }
      
      // Activate selected template
      await blink.db.checklist_templates.update(templateId, {
        is_active: "1",
        updated_at: new Date().toISOString()
      });
      
      setChecklistTemplates(prev => 
        prev.map(t => ({ ...t, isActive: t.id === templateId }))
      );
    } catch (error) {
      console.error('Error setting active template:', error);
    }
  }, [checklistTemplates]);

  const saveScanToolConfig = useCallback(async (config: ScanToolConfig) => {
    try {
      await blink.db.scan_tool_configs.upsert({
        id: config.id,
        name: config.name,
        type: config.type,
        connection_string: config.connectionString,
        auto_connect: config.autoConnect ? "1" : "0",
        enabled: config.enabled ? "1" : "0",
        updated_at: new Date().toISOString()
      });
      
      setScanToolConfigs(prev => 
        prev.map(st => st.id === config.id ? config : st)
      );
    } catch (error) {
      console.error('Error saving scan tool config:', error);
    }
  }, []);

  const saveAIConfig = useCallback(async (config: AIConfig) => {
    try {
      await blink.db.ai_settings.upsert({
        id: 'ai_config_1',
        enabled: config.enabled ? "1" : "0",
        analysis_level: config.analysisLevel,
        auto_suggest_issues: config.autoSuggestIssues ? "1" : "0",
        confidence_threshold: config.confidenceThreshold,
        enable_voice_commands: config.enableVoiceCommands ? "1" : "0",
        enable_image_analysis: config.enableImageAnalysis ? "1" : "0",
        enable_predictive_maintenance: config.enablePredictiveMaintenance ? "1" : "0",
        updated_at: new Date().toISOString()
      });
      
      setAIConfig(config);
    } catch (error) {
      console.error('Error saving AI config:', error);
    }
  }, []);

  const saveIntegrationConfig = useCallback(async (config: IntegrationConfig) => {
    try {
      await blink.db.integration_configs.upsert({
        id: config.id,
        name: config.name,
        type: config.type,
        api_key: config.apiKey,
        base_url: config.baseUrl,
        enabled: config.enabled ? "1" : "0",
        sync_settings: JSON.stringify(config.syncSettings),
        updated_at: new Date().toISOString()
      });
      
      setIntegrationConfigs(prev => 
        prev.map(i => i.id === config.id ? config : i)
      );
    } catch (error) {
      console.error('Error saving integration config:', error);
    }
  }, []);

  const exportTemplate = useCallback((template: ChecklistTemplate) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${template.name.replace(/\s+/g, '_')}_v${template.version}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, []);

  const importTemplate = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const template = JSON.parse(e.target?.result as string);
        template.id = `template_${Date.now()}`;
        template.isActive = false;
        template.createdAt = new Date();
        template.updatedAt = new Date();
        
        setEditingTemplate(template);
        setShowTemplateEditor(true);
      } catch (error) {
        console.error('Error importing template:', error);
      }
    };
    reader.readAsText(file);
  }, []);

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'checklists', name: 'Checklists', icon: CheckSquare },
    { id: 'versions', name: 'Versions', icon: GitBranch },
    { id: 'scantools', name: 'Scan Tools', icon: Bluetooth },
    { id: 'ai', name: 'AI Features', icon: Brain },
    { id: 'integrations', name: 'Integrations', icon: Link }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Settings & Configuration
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Customize your inspection app, manage templates, and configure integrations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <nav className="space-y-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Management</h2>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  saveUserProfile({
                    displayName: formData.get('displayName'),
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                    shopName: formData.get('shopName'),
                    address: formData.get('address')
                  });
                }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Display Name
                      </label>
                      <input
                        name="displayName"
                        type="text"
                        defaultValue={userProfile?.displayName || ''}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <input
                        name="email"
                        type="email"
                        defaultValue={userProfile?.email || ''}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone
                      </label>
                      <input
                        name="phone"
                        type="tel"
                        defaultValue={userProfile?.phone || ''}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Shop Name
                      </label>
                      <input
                        name="shopName"
                        type="text"
                        defaultValue={userProfile?.shopName || ''}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Address
                      </label>
                      <textarea
                        name="address"
                        rows={3}
                        defaultValue={userProfile?.address || ''}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-6">
                    <button
                      type="submit"
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Profile</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Checklists Tab */}
            {activeTab === 'checklists' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Checklist Customization</h2>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept=".json"
                      onChange={importTemplate}
                      className="hidden"
                      id="import-template"
                    />
                    <label
                      htmlFor="import-template"
                      className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Import</span>
                    </label>
                    <button
                      onClick={createNewTemplate}
                      className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New Template</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {checklistTemplates.map(template => (
                    <div key={template.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium text-gray-900 dark:text-white">{template.name}</h3>
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-sm">
                            v{template.version}
                          </span>
                          {template.isActive && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-sm">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => exportTemplate(template)}
                            className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => duplicateTemplate(template)}
                            className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingTemplate(template);
                              setShowTemplateEditor(true);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteTemplate(template.id)}
                            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {template.categories.length} categories, {template.categories.reduce((sum, cat) => sum + cat.items.length, 0)} items
                      </p>
                      
                      {!template.isActive && (
                        <button
                          onClick={() => setActiveTemplate(template.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Set as Active
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Features Tab */}
            {activeTab === 'ai' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Configuration</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Enable AI Features</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Turn on AI-powered analysis and suggestions
                      </p>
                    </div>
                    <button
                      onClick={() => saveAIConfig({ ...aiConfig, enabled: !aiConfig.enabled })}
                      className="text-blue-600"
                    >
                      {aiConfig.enabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                    </button>
                  </div>

                  <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">Analysis Level</h3>
                    <div className="space-y-2">
                      {['basic', 'standard', 'advanced'].map(level => (
                        <label key={level} className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="analysisLevel"
                            value={level}
                            checked={aiConfig.analysisLevel === level}
                            onChange={(e) => saveAIConfig({ ...aiConfig, analysisLevel: e.target.value as any })}
                            className="text-blue-600"
                          />
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white capitalize">{level}</span>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {level === 'basic' && 'Basic issue detection and suggestions'}
                              {level === 'standard' && 'Comprehensive analysis with confidence scores'}
                              {level === 'advanced' && 'Deep learning analysis with predictive insights'}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">Confidence Threshold</h3>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={aiConfig.confidenceThreshold}
                        onChange={(e) => saveAIConfig({ ...aiConfig, confidenceThreshold: parseFloat(e.target.value) })}
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-12">
                        {Math.round(aiConfig.confidenceThreshold * 100)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Minimum confidence level for AI suggestions
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { key: 'autoSuggestIssues', label: 'Auto-suggest Issues', desc: 'Automatically suggest potential issues during inspection' },
                      { key: 'enableVoiceCommands', label: 'Voice Commands', desc: 'Enable voice-controlled inspection features' },
                      { key: 'enableImageAnalysis', label: 'Image Analysis', desc: 'AI-powered analysis of inspection photos and videos' },
                      { key: 'enablePredictiveMaintenance', label: 'Predictive Maintenance', desc: 'Predict future maintenance needs based on vehicle history' }
                    ].map(feature => (
                      <div key={feature.key} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{feature.label}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{feature.desc}</p>
                        </div>
                        <button
                          onClick={() => saveAIConfig({ ...aiConfig, [feature.key]: !aiConfig[feature.key as keyof AIConfig] })}
                          className="text-blue-600"
                        >
                          {aiConfig[feature.key as keyof AIConfig] ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Scan Tools Tab */}
            {activeTab === 'scantools' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Scan Tool Configuration</h2>
                  <button
                    onClick={() => {
                      const newConfig: ScanToolConfig = {
                        id: `tool_${Date.now()}`,
                        name: 'New Scan Tool',
                        type: 'bluetooth',
                        connectionString: '',
                        autoConnect: false,
                        enabled: true
                      };
                      setScanToolConfigs(prev => [...prev, newConfig]);
                    }}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Tool</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {scanToolConfigs.map(config => (
                    <div key={config.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tool Name
                          </label>
                          <input
                            type="text"
                            value={config.name}
                            onChange={(e) => {
                              const updated = { ...config, name: e.target.value };
                              setScanToolConfigs(prev => prev.map(c => c.id === config.id ? updated : c));
                            }}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Connection Type
                          </label>
                          <select
                            value={config.type}
                            onChange={(e) => {
                              const updated = { ...config, type: e.target.value as 'bluetooth' | 'usb' };
                              setScanToolConfigs(prev => prev.map(c => c.id === config.id ? updated : c));
                            }}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="bluetooth">Bluetooth</option>
                            <option value="usb">USB</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Connection String
                          </label>
                          <input
                            type="text"
                            value={config.connectionString}
                            onChange={(e) => {
                              const updated = { ...config, connectionString: e.target.value };
                              setScanToolConfigs(prev => prev.map(c => c.id === config.id ? updated : c));
                            }}
                            placeholder="e.g., COM3, /dev/ttyUSB0, or Bluetooth MAC address"
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={config.autoConnect}
                              onChange={(e) => {
                                const updated = { ...config, autoConnect: e.target.checked };
                                setScanToolConfigs(prev => prev.map(c => c.id === config.id ? updated : c));
                              }}
                              className="text-blue-600"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Auto-connect</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={config.enabled}
                              onChange={(e) => {
                                const updated = { ...config, enabled: e.target.checked };
                                setScanToolConfigs(prev => prev.map(c => c.id === config.id ? updated : c));
                              }}
                              className="text-blue-600"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Enabled</span>
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => saveScanToolConfig(config)}
                            className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            <Save className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={() => setScanToolConfigs(prev => prev.filter(c => c.id !== config.id))}
                            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">API Integrations</h2>
                  <button
                    onClick={() => setShowIntegrationModal(true)}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Integration</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {integrationConfigs.map(config => (
                    <div key={config.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900 dark:text-white">{config.name}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          config.enabled 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {config.enabled ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Type: {config.type}
                      </p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Customers:</span>
                          <span className={config.syncSettings.customers ? 'text-green-600' : 'text-gray-400'}>
                            {config.syncSettings.customers ? 'Synced' : 'Disabled'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Vehicles:</span>
                          <span className={config.syncSettings.vehicles ? 'text-green-600' : 'text-gray-400'}>
                            {config.syncSettings.vehicles ? 'Synced' : 'Disabled'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Parts:</span>
                          <span className={config.syncSettings.parts ? 'text-green-600' : 'text-gray-400'}>
                            {config.syncSettings.parts ? 'Synced' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <button
                          onClick={() => saveIntegrationConfig({ ...config, enabled: !config.enabled })}
                          className={`px-3 py-1 rounded text-sm font-medium ${
                            config.enabled
                              ? 'bg-red-100 text-red-800 hover:bg-red-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {config.enabled ? 'Disable' : 'Enable'}
                        </button>
                        <button className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded">
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Versions Tab */}
            {activeTab === 'versions' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Template Versioning</h2>
                
                <div className="space-y-4">
                  {checklistTemplates.map(template => (
                    <div key={template.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">{template.name}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm">
                            v{template.version}
                          </span>
                          {template.isActive && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-sm">
                              Current
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <p>Created: {template.createdAt.toLocaleDateString()}</p>
                        <p>Last Modified: {template.updatedAt.toLocaleDateString()}</p>
                        <p>Categories: {template.categories.length}</p>
                        <p>Items: {template.categories.reduce((sum, cat) => sum + cat.items.length, 0)}</p>
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-3">
                        <button
                          onClick={() => {
                            const newVersion = {
                              ...template,
                              id: `template_${Date.now()}`,
                              version: `${parseFloat(template.version) + 0.1}`,
                              isActive: false,
                              createdAt: new Date(),
                              updatedAt: new Date()
                            };
                            setEditingTemplate(newVersion);
                            setShowTemplateEditor(true);
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          New Version
                        </button>
                        <button
                          onClick={() => exportTemplate(template)}
                          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                        >
                          Export
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
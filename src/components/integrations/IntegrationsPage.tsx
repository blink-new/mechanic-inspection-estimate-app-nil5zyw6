import React, { useState, useEffect } from 'react'
import { Settings, Zap, CheckCircle, XCircle, AlertCircle, RotateCw, Plus, ExternalLink, HelpCircle } from 'lucide-react'
import { blink } from '../../blink/client'
import { APIIntegration, SUPPORTED_INTEGRATIONS, SyncResult } from '../../types/integrations'
import IntegrationGuide from './IntegrationGuide'

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<APIIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [showSetup, setShowSetup] = useState<string | null>(null)
  const [showGuide, setShowGuide] = useState<string | null>(null)

  const loadIntegrations = async () => {
    try {
      const user = await blink.auth.me()
      const result = await blink.db.integrations.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })

      // Merge with supported integrations
      const mergedIntegrations = SUPPORTED_INTEGRATIONS.map(supported => {
        const existing = result.find(r => r.name === supported.name)
        return {
          id: existing?.id || `integration_${Date.now()}_${Math.random()}`,
          ...supported,
          status: existing?.status || 'disconnected',
          config: existing?.config || {},
          lastSync: existing?.lastSync,
          syncEnabled: existing?.syncEnabled || false
        } as APIIntegration
      })

      setIntegrations(mergedIntegrations)
    } catch (error) {
      console.error('Failed to load integrations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadIntegrations()
  }, [])

  const handleConnect = async (integration: APIIntegration) => {
    setShowSetup(integration.id)
  }

  const handleDisconnect = async (integrationId: string) => {
    try {
      const user = await blink.auth.me()
      await blink.db.integrations.update(integrationId, {
        status: 'disconnected',
        config: {},
        syncEnabled: false,
        updatedAt: new Date().toISOString()
      })
      
      setIntegrations(prev => prev.map(int => 
        int.id === integrationId 
          ? { ...int, status: 'disconnected', config: {}, syncEnabled: false }
          : int
      ))
    } catch (error) {
      console.error('Failed to disconnect integration:', error)
    }
  }

  const handleSync = async (integrationId: string) => {
    setSyncing(integrationId)
    try {
      const integration = integrations.find(i => i.id === integrationId)
      if (!integration) {
        throw new Error('Integration not found')
      }

      // Import the integration service dynamically
      const { IntegrationService } = await import('../../services/integrationService')
      const result = await IntegrationService.syncIntegration(integration)
      
      if (result.success) {
        const user = await blink.auth.me()
        await blink.db.integrations.update(integrationId, {
          lastSync: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })

        setIntegrations(prev => prev.map(int => 
          int.id === integrationId 
            ? { ...int, lastSync: new Date().toISOString() }
            : int
        ))

        // Show success message
        console.log(`✅ ${result.message}`)
      } else {
        console.error(`❌ Sync failed: ${result.message}`)
      }
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setSyncing(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <XCircle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-50'
      case 'error':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          </div>
          <p className="text-gray-600">
            Connect MechPro Inspector with your existing shop management software to sync data and streamline workflows.
          </p>
        </div>

        <div className="grid gap-6">
          {integrations.map((integration) => (
            <div key={integration.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Settings className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-semibold text-gray-900">{integration.name}</h3>
                      {getStatusIcon(integration.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(integration.status)}`}>
                        {integration.status.charAt(0).toUpperCase() + integration.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-gray-600">{integration.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowGuide(integration.name)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Guide
                  </button>

                  {integration.status === 'connected' && (
                    <button
                      onClick={() => handleSync(integration.id)}
                      disabled={syncing === integration.id}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 disabled:opacity-50"
                    >
                      <RotateCw className={`w-4 h-4 ${syncing === integration.id ? 'animate-spin' : ''}`} />
                      {syncing === integration.id ? 'Syncing...' : 'Sync'}
                    </button>
                  )}
                  
                  {integration.status === 'connected' ? (
                    <button
                      onClick={() => handleDisconnect(integration.id)}
                      className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(integration)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90"
                    >
                      <Plus className="w-4 h-4" />
                      Connect
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Features:</h4>
                <div className="flex flex-wrap gap-2">
                  {integration.features.map((feature, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              {integration.status === 'connected' && integration.lastSync && (
                <div className="text-sm text-gray-500">
                  Last synced: {new Date(integration.lastSync).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Need a Custom Integration?</h3>
              <p className="text-blue-700 mb-3">
                Don't see your shop management software listed? We can build custom integrations for your specific needs.
              </p>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                Request Custom Integration
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSetup && (
        <IntegrationSetupModal
          integration={integrations.find(i => i.id === showSetup)!}
          onClose={() => setShowSetup(null)}
          onSave={(config) => {
            // Handle saving integration config
            setShowSetup(null)
            loadIntegrations()
          }}
        />
      )}

      {showGuide && (
        <IntegrationGuide
          integrationName={showGuide}
          onClose={() => setShowGuide(null)}
        />
      )}
    </div>
  )
}

interface IntegrationSetupModalProps {
  integration: APIIntegration
  onClose: () => void
  onSave: (config: any) => void
}

function IntegrationSetupModal({ integration, onClose, onSave }: IntegrationSetupModalProps) {
  const [config, setConfig] = useState({
    apiKey: '',
    baseUrl: '',
    shopId: '',
    username: ''
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const user = await blink.auth.me()
      
      // Create or update integration
      await blink.db.integrations.create({
        id: integration.id,
        userId: user.id,
        name: integration.name,
        type: integration.type,
        status: 'connected',
        config,
        syncEnabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      onSave(config)
    } catch (error) {
      console.error('Failed to save integration:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Connect {integration.name}
        </h2>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter your API key"
            />
          </div>

          {integration.name === 'Tekmetric' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shop ID
                </label>
                <input
                  type="text"
                  value={config.shopId}
                  onChange={(e) => setConfig(prev => ({ ...prev, shopId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Your Tekmetric shop ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={config.username}
                  onChange={(e) => setConfig(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Your Tekmetric username"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base URL (Optional)
            </label>
            <input
              type="url"
              value={config.baseUrl}
              onChange={(e) => setConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="https://api.example.com"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !config.apiKey}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  )
}
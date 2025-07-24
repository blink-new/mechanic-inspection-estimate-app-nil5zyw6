import React from 'react'
import { Book, ExternalLink, Key, Database, RotateCw } from 'lucide-react'

interface IntegrationGuideProps {
  integrationName: string
  onClose: () => void
}

export default function IntegrationGuide({ integrationName, onClose }: IntegrationGuideProps) {
  const getGuideContent = () => {
    switch (integrationName) {
      case 'Tekmetric':
        return {
          title: 'Tekmetric Integration Setup',
          description: 'Connect your Tekmetric shop management system to sync customers, vehicles, and service history.',
          steps: [
            {
              icon: Key,
              title: 'Get API Credentials',
              content: 'Log into your Tekmetric account and navigate to Settings > API Keys. Generate a new API key with read/write permissions.'
            },
            {
              icon: Database,
              title: 'Find Your Shop ID',
              content: 'In Tekmetric, go to Settings > Shop Information. Copy your Shop ID from the details section.'
            },
            {
              icon: RotateCw,
              title: 'Configure Sync Settings',
              content: 'Choose which data to sync: customers, vehicles, service history, parts inventory, and labor rates.'
            }
          ],
          features: [
            'Automatic customer import from Tekmetric',
            'Vehicle history synchronization',
            'Parts catalog integration',
            'Labor time estimates',
            'Service history tracking',
            'Automated invoicing'
          ],
          apiDocs: 'https://api.tekmetric.com/docs'
        }
      
      case 'Mitchell 1':
        return {
          title: 'Mitchell 1 Integration Setup',
          description: 'Integrate with Mitchell 1 for comprehensive repair information and parts lookup.',
          steps: [
            {
              icon: Key,
              title: 'API Access Setup',
              content: 'Contact Mitchell 1 support to enable API access for your account. You\'ll receive API credentials via email.'
            },
            {
              icon: Database,
              title: 'Configure Data Access',
              content: 'Set up which Mitchell 1 databases you want to access: repair procedures, parts catalog, labor guides.'
            },
            {
              icon: RotateCw,
              title: 'Sync Preferences',
              content: 'Choose sync frequency and data types: parts pricing, labor times, repair procedures, and diagnostic information.'
            }
          ],
          features: [
            'Comprehensive repair procedures',
            'Parts lookup and pricing',
            'Labor time estimates',
            'Diagnostic information',
            'Technical service bulletins',
            'Wiring diagrams'
          ],
          apiDocs: 'https://mitchell1.com/api-documentation'
        }

      case 'AutoFluent':
        return {
          title: 'AutoFluent Integration Setup',
          description: 'Connect with AutoFluent for digital inspections and customer communication.',
          steps: [
            {
              icon: Key,
              title: 'Generate API Key',
              content: 'In AutoFluent, go to Settings > Integrations > API Keys. Create a new key with inspection and customer permissions.'
            },
            {
              icon: Database,
              title: 'Shop Configuration',
              content: 'Configure your shop settings in AutoFluent to match your MechPro Inspector workflow preferences.'
            },
            {
              icon: RotateCw,
              title: 'Sync Setup',
              content: 'Enable two-way sync for inspections, customer communications, and approval workflows.'
            }
          ],
          features: [
            'Digital inspection sync',
            'Customer communication portal',
            'Estimate approval workflow',
            'Photo and video sharing',
            'Payment processing',
            'Marketing automation'
          ],
          apiDocs: 'https://autofluent.com/developers'
        }

      default:
        return {
          title: 'Integration Setup Guide',
          description: 'Follow these general steps to set up your shop management integration.',
          steps: [
            {
              icon: Key,
              title: 'Obtain API Credentials',
              content: 'Contact your software provider to get API access credentials for integration.'
            },
            {
              icon: Database,
              title: 'Configure Data Access',
              content: 'Set up which data you want to sync between systems.'
            },
            {
              icon: RotateCw,
              title: 'Test Connection',
              content: 'Verify the integration works correctly with a test sync.'
            }
          ],
          features: [
            'Data synchronization',
            'Workflow automation',
            'Reduced data entry',
            'Improved accuracy'
          ],
          apiDocs: '#'
        }
    }
  }

  const guide = getGuideContent()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Book className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-gray-900">{guide.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <p className="text-gray-600 mt-2">{guide.description}</p>
        </div>

        <div className="p-6">
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Setup Steps</h3>
            <div className="space-y-4">
              {guide.steps.map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">{step.title}</h4>
                      <p className="text-gray-600 text-sm">{step.content}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Features & Benefits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {guide.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Need Help?</h4>
                <p className="text-blue-700 text-sm mb-3">
                  Check the official API documentation for detailed technical information.
                </p>
                <a
                  href={guide.apiDocs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  View API Documentation
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
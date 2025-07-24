import { useState, useEffect } from 'react'
import { blink } from './blink/client'
import { Header } from './components/layout/Header'
import { Navigation } from './components/layout/Navigation'
import { Dashboard } from './components/dashboard/Dashboard'
import { NewInspection } from './components/inspection/NewInspection'
import { InspectionChecklist } from './components/inspection/InspectionChecklist'
import { EnhancedInspectionPage } from './components/inspection/EnhancedInspectionPage'
import { InspectionManager } from './components/inspection/InspectionManager'
import { DiagnosticAssistant } from './components/ai/DiagnosticAssistant'
import IntegrationsPage from './components/integrations/IntegrationsPage'
import { CustomerPortal } from './components/customer/CustomerPortal'
import { SettingsPage } from './components/settings/SettingsPage'
import { ReviewApp } from './components/reviews/ReviewApp'
import { VideoRecorder } from './components/video/VideoRecorder'
import { CustomerApproval } from './components/customer/CustomerApproval'
import { ComprehensiveSettings } from './components/settings/ComprehensiveSettings'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { Toaster } from './components/ui/toaster'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState('dashboard')
  const [currentInspection, setCurrentInspection] = useState(null)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const handleNewInspection = () => {
    setCurrentView('new-inspection')
  }

  const handleStartInspection = (vehicleData: any) => {
    setCurrentInspection(vehicleData)
    setCurrentView('checklist')
  }

  const handleDocumentIssue = (item: any) => {
    // TODO: Implement issue documentation
    console.log('Document issue for:', item)
    setCurrentView('documentation')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading MechPro Inspector...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">MechPro Inspector</h1>
          <p className="text-gray-600 mb-6">Please sign in to continue</p>
          <button
            onClick={() => blink.auth.login()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNewInspection={handleNewInspection} />
      case 'inspections':
        return <InspectionManager />
      case 'new-inspection':
        return <NewInspection onStartInspection={handleStartInspection} />
      case 'ai-diagnostic':
        return <DiagnosticAssistant />
      case 'checklist':
        return currentInspection ? (
          <EnhancedInspectionPage 
            inspectionId={currentInspection.id || `insp_${Date.now()}`}
            vehicleData={currentInspection}
          />
        ) : (
          <Dashboard onNewInspection={handleNewInspection} />
        )
      case 'documentation':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-foreground mb-4">Issue Documentation</h1>
            <p className="text-muted-foreground">Photo and video documentation feature coming soon...</p>
          </div>
        )
      case 'estimate':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-foreground mb-4">Estimate Builder</h1>
            <p className="text-muted-foreground">Estimate builder feature coming soon...</p>
          </div>
        )
      case 'integrations':
        return <IntegrationsPage />
      case 'customer':
        return <CustomerPortal />
      case 'customer-approval':
        return currentInspection ? (
          <CustomerApproval inspectionId={currentInspection.id || `insp_${Date.now()}`} />
        ) : (
          <CustomerPortal />
        )
      case 'video-recording':
        return currentInspection ? (
          <VideoRecorder 
            inspectionId={currentInspection.id || `insp_${Date.now()}`}
            onVideoSaved={(videoId) => console.log('Video saved:', videoId)}
          />
        ) : (
          <Dashboard onNewInspection={handleNewInspection} />
        )
      case 'reviews':
        return <ReviewApp />
      case 'settings':
        return <SettingsPage />
      case 'comprehensive-settings':
        return <ComprehensiveSettings />
      default:
        return <Dashboard onNewInspection={handleNewInspection} />
    }
  }

  return (
    <div className="min-h-screen bg-background dark:bg-background transition-colors duration-200">
      <Header />
      <div className="flex">
        <Navigation currentView={currentView} onViewChange={setCurrentView} />
        <main className="flex-1">
          <ErrorBoundary>
            {renderCurrentView()}
          </ErrorBoundary>
        </main>
      </div>
      <Toaster />
    </div>
  )
}

export default App
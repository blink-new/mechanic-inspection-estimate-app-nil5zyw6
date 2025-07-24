import { Button } from '@/components/ui/button'
import { 
  Home, 
  Plus, 
  ClipboardList, 
  Camera, 
  Calculator, 
  MessageSquare,
  Settings,
  Zap,
  Star,
  Brain,
  Video,
  CheckCircle,
  Sliders
} from 'lucide-react'

interface NavigationProps {
  currentView: string
  onViewChange: (view: string) => void
}

export function Navigation({ currentView, onViewChange }: NavigationProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'inspections', label: 'All Inspections', icon: ClipboardList },
    { id: 'new-inspection', label: 'New Inspection', icon: Plus },
    { id: 'ai-diagnostic', label: 'AI Diagnostic', icon: Brain },
    { id: 'video-recording', label: 'Video Recording', icon: Video },
    { id: 'documentation', label: 'Document Issues', icon: Camera },
    { id: 'estimate', label: 'Estimate', icon: Calculator },
    { id: 'customer-approval', label: 'Customer Approval', icon: CheckCircle },
    { id: 'integrations', label: 'Integrations', icon: Zap },
    { id: 'customer', label: 'Customer Portal', icon: MessageSquare },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'comprehensive-settings', label: 'Advanced Settings', icon: Sliders },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  return (
    <nav className="bg-card dark:bg-card border-r border-border w-64 min-h-screen p-4">
      <div className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant={currentView === item.id ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => onViewChange(item.id)}
            >
              <Icon className="h-4 w-4 mr-2" />
              {item.label}
            </Button>
          )
        })}
      </div>
    </nav>
  )
}
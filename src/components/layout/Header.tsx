import { Button } from '@/components/ui/button'
import { Settings, User, Bell } from 'lucide-react'
import { DarkModeToggle } from '../reviews/DarkModeToggle'

export function Header() {
  return (
    <header className="bg-card dark:bg-card border-b border-border px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-foreground">MechPro Inspector</h1>
      </div>
      
      <div className="flex items-center space-x-2">
        <DarkModeToggle />
        <Button variant="ghost" size="sm">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <User className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
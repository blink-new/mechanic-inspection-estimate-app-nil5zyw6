import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useDarkMode } from '../../hooks/useDarkMode'

export function DarkModeToggle() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  return (
    <button
      onClick={toggleDarkMode}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:bg-muted transition-colors"
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      {isDarkMode ? (
        <>
          <Sun className="w-4 h-4 text-foreground" />
          <span className="text-sm text-foreground">Light</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-foreground" />
          <span className="text-sm text-foreground">Dark</span>
        </>
      )}
    </button>
  )
}
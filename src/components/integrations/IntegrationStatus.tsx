import React from 'react'
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

interface IntegrationStatusProps {
  status: 'connected' | 'disconnected' | 'error' | 'syncing'
  lastSync?: string
  message?: string
}

export default function IntegrationStatus({ status, lastSync, message }: IntegrationStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Connected'
        }
      case 'error':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'Error'
        }
      case 'syncing':
        return {
          icon: Clock,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: 'Syncing'
        }
      default:
        return {
          icon: AlertTriangle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: 'Disconnected'
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${config.bgColor} ${config.borderColor}`}>
      <Icon className={`w-4 h-4 ${config.color} ${status === 'syncing' ? 'animate-spin' : ''}`} />
      <span className={`text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
      {lastSync && status === 'connected' && (
        <span className="text-xs text-gray-500 ml-1">
          • {new Date(lastSync).toLocaleDateString()}
        </span>
      )}
    </div>
  )
}
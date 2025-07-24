import { useState, useEffect } from 'react'
import { blink } from '../../blink/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Building, 
  Bell, 
  Shield, 
  Palette, 
  Download,
  Upload,
  Trash2,
  Save,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { LoadingSpinner } from '../common/LoadingSpinner'

interface ShopSettings {
  id: string
  shopName: string
  address: string
  phone: string
  email: string
  website: string
  logo: string
  laborRate: number
  taxRate: number
  currency: string
  timezone: string
}

interface NotificationSettings {
  emailNotifications: boolean
  smsNotifications: boolean
  inspectionComplete: boolean
  customerApproval: boolean
  paymentReceived: boolean
  systemUpdates: boolean
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: string
  dateFormat: string
  timeFormat: '12h' | '24h'
  autoSave: boolean
  soundEffects: boolean
}

export function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [shopSettings, setShopSettings] = useState<ShopSettings>({
    id: '',
    shopName: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logo: '',
    laborRate: 120,
    taxRate: 8.5,
    currency: 'USD',
    timezone: 'America/New_York'
  })

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    inspectionComplete: true,
    customerApproval: true,
    paymentReceived: true,
    systemUpdates: false
  })

  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'light',
    language: 'en',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '12h',
    autoSave: true,
    soundEffects: true
  })

  const loadSettings = async () => {
    try {
      setLoading(true)
      const user = await blink.auth.me()

      // Load shop settings
      const shopData = await blink.db.shop_settings.list({
        where: { user_id: user.id },
        limit: 1
      })

      if (shopData.length > 0) {
        setShopSettings(shopData[0])
      }

      // Load notification settings
      const notificationData = await blink.db.notification_settings.list({
        where: { user_id: user.id },
        limit: 1
      })

      if (notificationData.length > 0) {
        setNotifications(notificationData[0])
      }

      // Load user preferences
      const preferencesData = await blink.db.user_preferences.list({
        where: { user_id: user.id },
        limit: 1
      })

      if (preferencesData.length > 0) {
        setPreferences(preferencesData[0])
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      setMessage({ type: 'error', text: 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }

  const saveShopSettings = async () => {
    try {
      setSaving(true)
      const user = await blink.auth.me()

      const settingsData = {
        ...shopSettings,
        user_id: user.id,
        updated_at: new Date().toISOString()
      }

      if (shopSettings.id) {
        await blink.db.shop_settings.update(shopSettings.id, settingsData)
      } else {
        const newSettings = await blink.db.shop_settings.create({
          id: `shop_${Date.now()}`,
          ...settingsData
        })
        setShopSettings(prev => ({ ...prev, id: newSettings.id }))
      }

      setMessage({ type: 'success', text: 'Shop settings saved successfully' })
    } catch (error) {
      console.error('Failed to save shop settings:', error)
      setMessage({ type: 'error', text: 'Failed to save shop settings' })
    } finally {
      setSaving(false)
    }
  }

  const saveNotificationSettings = async () => {
    try {
      setSaving(true)
      const user = await blink.auth.me()

      const notificationData = {
        ...notifications,
        user_id: user.id,
        updated_at: new Date().toISOString()
      }

      // Check if settings exist
      const existing = await blink.db.notification_settings.list({
        where: { user_id: user.id },
        limit: 1
      })

      if (existing.length > 0) {
        await blink.db.notification_settings.update(existing[0].id, notificationData)
      } else {
        await blink.db.notification_settings.create({
          id: `notif_${Date.now()}`,
          ...notificationData
        })
      }

      setMessage({ type: 'success', text: 'Notification settings saved successfully' })
    } catch (error) {
      console.error('Failed to save notification settings:', error)
      setMessage({ type: 'error', text: 'Failed to save notification settings' })
    } finally {
      setSaving(false)
    }
  }

  const savePreferences = async () => {
    try {
      setSaving(true)
      const user = await blink.auth.me()

      const preferencesData = {
        ...preferences,
        user_id: user.id,
        updated_at: new Date().toISOString()
      }

      // Check if preferences exist
      const existing = await blink.db.user_preferences.list({
        where: { user_id: user.id },
        limit: 1
      })

      if (existing.length > 0) {
        await blink.db.user_preferences.update(existing[0].id, preferencesData)
      } else {
        await blink.db.user_preferences.create({
          id: `pref_${Date.now()}`,
          ...preferencesData
        })
      }

      setMessage({ type: 'success', text: 'Preferences saved successfully' })
    } catch (error) {
      console.error('Failed to save preferences:', error)
      setMessage({ type: 'error', text: 'Failed to save preferences' })
    } finally {
      setSaving(false)
    }
  }

  const exportData = async () => {
    try {
      const user = await blink.auth.me()
      
      // Export all user data
      const inspections = await blink.db.inspections.list({
        where: { user_id: user.id }
      })
      
      const vehicles = await blink.db.vehicles.list({
        where: { user_id: user.id }
      })

      const exportData = {
        user: user,
        shopSettings,
        notifications,
        preferences,
        inspections,
        vehicles,
        exportDate: new Date().toISOString()
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mechpro-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setMessage({ type: 'success', text: 'Data exported successfully' })
    } catch (error) {
      console.error('Failed to export data:', error)
      setMessage({ type: 'error', text: 'Failed to export data' })
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" text="Loading settings..." />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your shop settings and preferences</p>
      </div>

      {message && (
        <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
          {message.type === 'error' ? (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="shop" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="shop">Shop Settings</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="data">Data & Security</TabsTrigger>
        </TabsList>

        {/* Shop Settings */}
        <TabsContent value="shop" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Shop Information
              </CardTitle>
              <CardDescription>
                Configure your shop details and business information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shopName">Shop Name</Label>
                  <Input
                    id="shopName"
                    value={shopSettings.shopName}
                    onChange={(e) => setShopSettings(prev => ({ ...prev, shopName: e.target.value }))}
                    placeholder="Your Auto Shop"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={shopSettings.phone}
                    onChange={(e) => setShopSettings(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={shopSettings.address}
                  onChange={(e) => setShopSettings(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Main St, City, State 12345"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={shopSettings.email}
                    onChange={(e) => setShopSettings(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contact@yourshop.com"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={shopSettings.website}
                    onChange={(e) => setShopSettings(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://yourshop.com"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="laborRate">Labor Rate ($/hour)</Label>
                  <Input
                    id="laborRate"
                    type="number"
                    value={shopSettings.laborRate}
                    onChange={(e) => setShopSettings(prev => ({ ...prev, laborRate: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={shopSettings.taxRate}
                    onChange={(e) => setShopSettings(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={shopSettings.currency}
                    onChange={(e) => setShopSettings(prev => ({ ...prev, currency: e.target.value }))}
                    placeholder="USD"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveShopSettings} disabled={saving}>
                  {saving ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Shop Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to be notified about important events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-gray-600">Receive notifications via email</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailNotifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="smsNotifications">SMS Notifications</Label>
                    <p className="text-sm text-gray-600">Receive notifications via text message</p>
                  </div>
                  <Switch
                    id="smsNotifications"
                    checked={notifications.smsNotifications}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, smsNotifications: checked }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Event Notifications</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="inspectionComplete">Inspection Complete</Label>
                    <p className="text-sm text-gray-600">When an inspection is completed</p>
                  </div>
                  <Switch
                    id="inspectionComplete"
                    checked={notifications.inspectionComplete}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, inspectionComplete: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="customerApproval">Customer Approval</Label>
                    <p className="text-sm text-gray-600">When customer approves or declines estimate</p>
                  </div>
                  <Switch
                    id="customerApproval"
                    checked={notifications.customerApproval}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, customerApproval: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="paymentReceived">Payment Received</Label>
                    <p className="text-sm text-gray-600">When payment is received from customer</p>
                  </div>
                  <Switch
                    id="paymentReceived"
                    checked={notifications.paymentReceived}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, paymentReceived: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="systemUpdates">System Updates</Label>
                    <p className="text-sm text-gray-600">Updates about new features and improvements</p>
                  </div>
                  <Switch
                    id="systemUpdates"
                    checked={notifications.systemUpdates}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, systemUpdates: checked }))}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveNotificationSettings} disabled={saving}>
                  {saving ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                User Preferences
              </CardTitle>
              <CardDescription>
                Customize your app experience and interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <select
                    id="theme"
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                    value={preferences.theme}
                    onChange={(e) => setPreferences(prev => ({ ...prev, theme: e.target.value as 'light' | 'dark' | 'auto' }))}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="language">Language</Label>
                  <select
                    id="language"
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                    value={preferences.language}
                    onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <select
                    id="dateFormat"
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                    value={preferences.dateFormat}
                    onChange={(e) => setPreferences(prev => ({ ...prev, dateFormat: e.target.value }))}
                  >
                    <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                    <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                    <option value="yyyy-MM-dd">YYYY-MM-DD</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="timeFormat">Time Format</Label>
                  <select
                    id="timeFormat"
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                    value={preferences.timeFormat}
                    onChange={(e) => setPreferences(prev => ({ ...prev, timeFormat: e.target.value as '12h' | '24h' }))}
                  >
                    <option value="12h">12 Hour</option>
                    <option value="24h">24 Hour</option>
                  </select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoSave">Auto Save</Label>
                    <p className="text-sm text-gray-600">Automatically save changes as you work</p>
                  </div>
                  <Switch
                    id="autoSave"
                    checked={preferences.autoSave}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, autoSave: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="soundEffects">Sound Effects</Label>
                    <p className="text-sm text-gray-600">Play sounds for notifications and actions</p>
                  </div>
                  <Switch
                    id="soundEffects"
                    checked={preferences.soundEffects}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, soundEffects: checked }))}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={savePreferences} disabled={saving}>
                  {saving ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data & Security */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Export, backup, and manage your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Export Data</h4>
                    <p className="text-sm text-gray-600">Download all your inspection data and settings</p>
                  </div>
                  <Button onClick={exportData} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Import Data</h4>
                    <p className="text-sm text-gray-600">Import data from a previous export</p>
                  </div>
                  <Button variant="outline" disabled>
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">Danger Zone</h4>
                <p className="text-sm text-red-700 mb-4">
                  These actions cannot be undone. Please be careful.
                </p>
                <Button variant="destructive" disabled>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
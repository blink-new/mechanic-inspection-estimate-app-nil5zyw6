import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Car, User, Phone, Mail, FileText, ArrowRight } from 'lucide-react'
import { VoiceCommandPanel } from '../voice/VoiceCommandPanel'

interface NewInspectionProps {
  onStartInspection: (vehicleData: any) => void
}

export function NewInspection({ onStartInspection }: NewInspectionProps) {
  const [vehicleData, setVehicleData] = useState({
    make: '',
    model: '',
    year: '',
    vin: '',
    licensePlate: '',
    mileage: '',
    color: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    serviceType: '',
    notes: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setVehicleData(prev => ({ ...prev, [field]: value }))
  }

  const handleVoiceFormFill = (field: string, value: string) => {
    // Map voice command field names to form field names
    const fieldMapping: { [key: string]: string } = {
      'make': 'make',
      'manufacturer': 'make',
      'model': 'model',
      'year': 'year',
      'mileage': 'mileage',
      'miles': 'mileage',
      'vin': 'vin',
      'vehicle identification number': 'vin',
      'customerName': 'customerName',
      'customer name': 'customerName',
      'customerPhone': 'customerPhone',
      'customer phone': 'customerPhone',
      'phone': 'customerPhone',
      'customerEmail': 'customerEmail',
      'customer email': 'customerEmail',
      'email': 'customerEmail',
      'color': 'color',
      'licensePlate': 'licensePlate',
      'license plate': 'licensePlate',
      'notes': 'notes'
    }

    const mappedField = fieldMapping[field.toLowerCase()] || field
    if (mappedField in vehicleData) {
      handleInputChange(mappedField, value)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onStartInspection(vehicleData)
  }

  const isFormValid = vehicleData.make && vehicleData.model && vehicleData.year && 
                     vehicleData.customerName && vehicleData.customerPhone

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Vehicle Inspection</h1>
        <p className="text-gray-600 dark:text-gray-400">Enter vehicle and customer information to begin inspection</p>
      </div>

      {/* Voice Command Panel */}
      <div className="mb-6">
        <VoiceCommandPanel 
          onFormFill={handleVoiceFormFill}
          className="mb-4"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vehicle Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Car className="h-5 w-5" />
              <span>Vehicle Information</span>
            </CardTitle>
            <CardDescription>Basic vehicle details for the inspection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="make">Make *</Label>
                <Input
                  id="make"
                  placeholder="Honda, Toyota, Ford..."
                  value={vehicleData.make}
                  onChange={(e) => handleInputChange('make', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  placeholder="Civic, Camry, F-150..."
                  value={vehicleData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="2020"
                  min="1900"
                  max="2025"
                  value={vehicleData.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vin">VIN</Label>
                <Input
                  id="vin"
                  placeholder="17-character VIN"
                  maxLength={17}
                  value={vehicleData.vin}
                  onChange={(e) => handleInputChange('vin', e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <Label htmlFor="licensePlate">License Plate</Label>
                <Input
                  id="licensePlate"
                  placeholder="ABC-1234"
                  value={vehicleData.licensePlate}
                  onChange={(e) => handleInputChange('licensePlate', e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mileage">Mileage</Label>
                <Input
                  id="mileage"
                  type="number"
                  placeholder="85,000"
                  value={vehicleData.mileage}
                  onChange={(e) => handleInputChange('mileage', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  placeholder="Silver, Black, White..."
                  value={vehicleData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Customer Information</span>
            </CardTitle>
            <CardDescription>Contact details for the vehicle owner</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                placeholder="John Smith"
                value={vehicleData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerPhone">Phone Number *</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={vehicleData.customerPhone}
                  onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">Email Address</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={vehicleData.customerEmail}
                  onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Service Information</span>
            </CardTitle>
            <CardDescription>Additional details about the inspection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="serviceType">Service Type</Label>
              <Select value={vehicleData.serviceType} onValueChange={(value) => handleInputChange('serviceType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select inspection type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Inspection</SelectItem>
                  <SelectItem value="pre-purchase">Pre-Purchase Inspection</SelectItem>
                  <SelectItem value="annual">Annual Safety Inspection</SelectItem>
                  <SelectItem value="diagnostic">Diagnostic Inspection</SelectItem>
                  <SelectItem value="warranty">Warranty Inspection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Customer concerns, special instructions, etc."
                rows={3}
                value={vehicleData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={!isFormValid}
            className="flex items-center space-x-2"
          >
            <span>Start Inspection</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
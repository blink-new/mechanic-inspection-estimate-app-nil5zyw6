import { InspectionCategory } from '../types/inspection'

export const inspectionTemplates = {
  automotive: {
    categories: [
      {
        id: 'engine',
        name: 'Engine & Powertrain',
        icon: 'Engine',
        completed: 0,
        total: 12,
        items: [
          {
            id: 'engine-oil',
            name: 'Engine Oil Level & Condition',
            category: 'engine',
            description: 'Check oil level, color, and consistency',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'coolant',
            name: 'Coolant Level & Condition',
            category: 'engine',
            description: 'Check coolant level and color',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'air-filter',
            name: 'Air Filter',
            category: 'engine',
            description: 'Inspect air filter condition',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'belts',
            name: 'Drive Belts',
            category: 'engine',
            description: 'Check belt condition and tension',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'hoses',
            name: 'Radiator Hoses',
            category: 'engine',
            description: 'Inspect hoses for cracks or leaks',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'battery',
            name: 'Battery & Terminals',
            category: 'engine',
            description: 'Check battery condition and terminal corrosion',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'spark-plugs',
            name: 'Spark Plugs',
            category: 'engine',
            description: 'Inspect spark plug condition',
            isRequired: false,
            status: 'pending'
          },
          {
            id: 'transmission-fluid',
            name: 'Transmission Fluid',
            category: 'engine',
            description: 'Check transmission fluid level and condition',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'engine-mounts',
            name: 'Engine Mounts',
            category: 'engine',
            description: 'Inspect engine mount condition',
            isRequired: false,
            status: 'pending'
          },
          {
            id: 'pcv-valve',
            name: 'PCV Valve',
            category: 'engine',
            description: 'Check PCV valve operation',
            isRequired: false,
            status: 'pending'
          },
          {
            id: 'fuel-filter',
            name: 'Fuel Filter',
            category: 'engine',
            description: 'Inspect fuel filter condition',
            isRequired: false,
            status: 'pending'
          },
          {
            id: 'engine-performance',
            name: 'Engine Performance',
            category: 'engine',
            description: 'Overall engine performance assessment',
            isRequired: true,
            status: 'pending'
          }
        ]
      },
      {
        id: 'brakes',
        name: 'Brakes & Safety',
        icon: 'Disc',
        completed: 0,
        total: 10,
        items: [
          {
            id: 'brake-pads-front',
            name: 'Front Brake Pads',
            category: 'brakes',
            description: 'Check brake pad thickness and condition',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'brake-pads-rear',
            name: 'Rear Brake Pads',
            category: 'brakes',
            description: 'Check brake pad thickness and condition',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'brake-rotors-front',
            name: 'Front Brake Rotors',
            category: 'brakes',
            description: 'Inspect rotor condition and thickness',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'brake-rotors-rear',
            name: 'Rear Brake Rotors',
            category: 'brakes',
            description: 'Inspect rotor condition and thickness',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'brake-fluid',
            name: 'Brake Fluid',
            category: 'brakes',
            description: 'Check brake fluid level and condition',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'brake-lines',
            name: 'Brake Lines & Hoses',
            category: 'brakes',
            description: 'Inspect brake lines for leaks or damage',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'parking-brake',
            name: 'Parking Brake',
            category: 'brakes',
            description: 'Test parking brake operation',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'brake-pedal',
            name: 'Brake Pedal Feel',
            category: 'brakes',
            description: 'Test brake pedal feel and travel',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'abs-system',
            name: 'ABS System',
            category: 'brakes',
            description: 'Check ABS warning lights and operation',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'brake-calipers',
            name: 'Brake Calipers',
            category: 'brakes',
            description: 'Inspect brake caliper condition',
            isRequired: false,
            status: 'pending'
          }
        ]
      },
      {
        id: 'suspension',
        name: 'Suspension & Steering',
        icon: 'Settings',
        completed: 0,
        total: 8,
        items: [
          {
            id: 'shock-absorbers',
            name: 'Shock Absorbers/Struts',
            category: 'suspension',
            description: 'Check shock absorber condition and leaks',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'steering-wheel',
            name: 'Steering Wheel Play',
            category: 'suspension',
            description: 'Test steering wheel play and alignment',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'tie-rods',
            name: 'Tie Rod Ends',
            category: 'suspension',
            description: 'Inspect tie rod end condition',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'ball-joints',
            name: 'Ball Joints',
            category: 'suspension',
            description: 'Check ball joint condition and play',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'control-arms',
            name: 'Control Arms',
            category: 'suspension',
            description: 'Inspect control arm bushings',
            isRequired: false,
            status: 'pending'
          },
          {
            id: 'sway-bar',
            name: 'Sway Bar Links',
            category: 'suspension',
            description: 'Check sway bar link condition',
            isRequired: false,
            status: 'pending'
          },
          {
            id: 'power-steering',
            name: 'Power Steering Fluid',
            category: 'suspension',
            description: 'Check power steering fluid level',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'alignment',
            name: 'Wheel Alignment',
            category: 'suspension',
            description: 'Visual alignment check',
            isRequired: false,
            status: 'pending'
          }
        ]
      },
      {
        id: 'tires',
        name: 'Tires & Wheels',
        icon: 'Circle',
        completed: 0,
        total: 6,
        items: [
          {
            id: 'tire-tread-front',
            name: 'Front Tire Tread Depth',
            category: 'tires',
            description: 'Measure tire tread depth',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'tire-tread-rear',
            name: 'Rear Tire Tread Depth',
            category: 'tires',
            description: 'Measure tire tread depth',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'tire-pressure',
            name: 'Tire Pressure',
            category: 'tires',
            description: 'Check tire pressure all around',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'tire-condition',
            name: 'Tire Condition',
            category: 'tires',
            description: 'Inspect for cracks, bulges, or damage',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'wheel-condition',
            name: 'Wheel Condition',
            category: 'tires',
            description: 'Inspect wheels for damage or cracks',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'spare-tire',
            name: 'Spare Tire',
            category: 'tires',
            description: 'Check spare tire condition and pressure',
            isRequired: false,
            status: 'pending'
          }
        ]
      },
      {
        id: 'electrical',
        name: 'Electrical Systems',
        icon: 'Zap',
        completed: 0,
        total: 7,
        items: [
          {
            id: 'headlights',
            name: 'Headlights',
            category: 'electrical',
            description: 'Test headlight operation and alignment',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'taillights',
            name: 'Taillights',
            category: 'electrical',
            description: 'Test taillight operation',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'turn-signals',
            name: 'Turn Signals',
            category: 'electrical',
            description: 'Test turn signal operation',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'brake-lights',
            name: 'Brake Lights',
            category: 'electrical',
            description: 'Test brake light operation',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'dashboard-lights',
            name: 'Dashboard Warning Lights',
            category: 'electrical',
            description: 'Check for warning lights',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'alternator',
            name: 'Charging System',
            category: 'electrical',
            description: 'Test alternator output',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'starter',
            name: 'Starter System',
            category: 'electrical',
            description: 'Test starter operation',
            isRequired: false,
            status: 'pending'
          }
        ]
      },
      {
        id: 'fluids',
        name: 'Fluids & Filters',
        icon: 'Droplets',
        completed: 0,
        total: 6,
        items: [
          {
            id: 'windshield-washer',
            name: 'Windshield Washer Fluid',
            category: 'fluids',
            description: 'Check washer fluid level',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'differential-fluid',
            name: 'Differential Fluid',
            category: 'fluids',
            description: 'Check differential fluid level',
            isRequired: false,
            status: 'pending'
          },
          {
            id: 'cabin-filter',
            name: 'Cabin Air Filter',
            category: 'fluids',
            description: 'Inspect cabin air filter condition',
            isRequired: false,
            status: 'pending'
          },
          {
            id: 'oil-filter',
            name: 'Oil Filter',
            category: 'fluids',
            description: 'Check oil filter condition',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'power-steering-fluid',
            name: 'Power Steering Fluid',
            category: 'fluids',
            description: 'Check power steering fluid condition',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'transfer-case-fluid',
            name: 'Transfer Case Fluid',
            category: 'fluids',
            description: 'Check transfer case fluid (4WD vehicles)',
            isRequired: false,
            status: 'pending'
          }
        ]
      },
      {
        id: 'exhaust',
        name: 'Exhaust System',
        icon: 'Wind',
        completed: 0,
        total: 4,
        items: [
          {
            id: 'exhaust-pipes',
            name: 'Exhaust Pipes',
            category: 'exhaust',
            description: 'Inspect exhaust pipes for damage or leaks',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'muffler',
            name: 'Muffler',
            category: 'exhaust',
            description: 'Check muffler condition',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'catalytic-converter',
            name: 'Catalytic Converter',
            category: 'exhaust',
            description: 'Inspect catalytic converter',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'exhaust-hangers',
            name: 'Exhaust Hangers',
            category: 'exhaust',
            description: 'Check exhaust system hangers',
            isRequired: false,
            status: 'pending'
          }
        ]
      },
      {
        id: 'body',
        name: 'Body & Interior',
        icon: 'Car',
        completed: 0,
        total: 5,
        items: [
          {
            id: 'wipers',
            name: 'Windshield Wipers',
            category: 'body',
            description: 'Test wiper operation and blade condition',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'mirrors',
            name: 'Mirrors',
            category: 'body',
            description: 'Check mirror condition and adjustment',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'seatbelts',
            name: 'Seatbelts',
            category: 'body',
            description: 'Test seatbelt operation',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'horn',
            name: 'Horn',
            category: 'body',
            description: 'Test horn operation',
            isRequired: true,
            status: 'pending'
          },
          {
            id: 'body-condition',
            name: 'Body Condition',
            category: 'body',
            description: 'Overall body condition assessment',
            isRequired: false,
            status: 'pending'
          }
        ]
      }
    ]
  }
}

export const defaultInspectionTemplate: InspectionCategory[] = inspectionTemplates.automotive.categories;
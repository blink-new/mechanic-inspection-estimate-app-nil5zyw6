import { createClient as createBlinkClient } from '@blinkdotnew/sdk'

export const blink = createBlinkClient({
  projectId: 'mechanic-inspection-estimate-app-nil5zyw6',
  authRequired: true
})

export const createClient = () => blink
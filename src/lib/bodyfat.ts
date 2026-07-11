import { Gender } from '@/types'

export interface BodyFatInputs {
  gender: Gender | null
  height_cm: number | null
  neck_cm: number | null
  waist_cm: number | null
  hip_cm: number | null
}

// US Navy circumference method
export function calculateBodyFatPercent({ gender, height_cm, neck_cm, waist_cm, hip_cm }: BodyFatInputs): number | null {
  if (!gender || !height_cm || !neck_cm || !waist_cm) return null

  if (gender === 'male') {
    const diff = waist_cm - neck_cm
    if (diff <= 0) return null
    const pct = 495 / (1.0324 - 0.19077 * Math.log10(diff) + 0.15456 * Math.log10(height_cm)) - 450
    return pct > 0 ? pct : null
  }

  if (!hip_cm) return null
  const diff = waist_cm + hip_cm - neck_cm
  if (diff <= 0) return null
  const pct = 495 / (1.29579 - 0.35004 * Math.log10(diff) + 0.221 * Math.log10(height_cm)) - 450
  return pct > 0 ? pct : null
}

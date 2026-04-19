import { GarminConnect } from 'garmin-connect'

let client: GarminConnect | null = null
let loginPromise: Promise<GarminConnect> | null = null

async function getClient(): Promise<GarminConnect> {
  if (client) return client
  if (loginPromise) return loginPromise

  loginPromise = (async () => {
    const gc = new GarminConnect({
      username: process.env.GARMIN_EMAIL!,
      password: process.env.GARMIN_PASSWORD!,
    })
    await gc.login()
    client = gc
    loginPromise = null
    return gc
  })()

  return loginPromise
}

export async function getStepsForDate(date: Date): Promise<number | null> {
  try {
    const gc = await getClient()
    const steps = await gc.getSteps(date)
    return typeof steps === 'number' && steps > 0 ? steps : null
  } catch {
    client = null
    return null
  }
}

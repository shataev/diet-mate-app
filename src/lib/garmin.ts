import { GarminConnect } from 'garmin-connect'

let client: GarminConnect | null = null

async function getClient(): Promise<GarminConnect> {
  if (client) return client

  const gc = new GarminConnect({
    username: process.env.GARMIN_EMAIL!,
    password: process.env.GARMIN_PASSWORD!,
  })
  await gc.login()
  client = gc
  return gc
}

export async function getStepsForDate(date: Date): Promise<number | null> {
  const gc = await getClient()
  const steps = await gc.getSteps(date)
  return typeof steps === 'number' && steps > 0 ? steps : null
}

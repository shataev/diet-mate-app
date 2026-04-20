export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { isAuthorized, hasAuthError } from '@/lib/fatsecret'

export async function GET() {
  return NextResponse.json({
    authorized: isAuthorized(),
    authError: hasAuthError(),
  })
}

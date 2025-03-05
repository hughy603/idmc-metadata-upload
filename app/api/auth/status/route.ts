import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API route for checking OAuth authentication status
 *
 * @param request The incoming request
 * @returns Authentication status information
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('informatica_access_token')

  if (!accessToken) {
    return NextResponse.json({ authenticated: false })
  }

  // Since the token is already validated server-side during creation
  // we can just check its existence here
  return NextResponse.json({
    authenticated: true,
  })
}

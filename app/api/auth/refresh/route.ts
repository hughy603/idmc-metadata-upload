import { NextRequest, NextResponse } from 'next/server'
import { InformaticaAuthCredentials } from '@/lib/utils/auth'
import { refreshTokenIfNeeded } from '@/lib/services/auth-service'

/**
 * API route for refreshing an Informatica Cloud token
 * 
 * @param request The incoming request
 * @returns A response with the refreshed token
 */
export async function POST(request: NextRequest) {
  try {
    // Get credentials from request body
    const body = await request.json()
    
    // Validate required fields
    if (!body.username || !body.password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }
    
    const credentials: InformaticaAuthCredentials = {
      username: body.username,
      password: body.password
    }
    
    // Refresh token if needed
    const token = await refreshTokenIfNeeded(credentials)
    
    if (!token) {
      return NextResponse.json(
        { error: 'Failed to refresh token' },
        { status: 401 }
      )
    }
    
    // Return refreshed token
    return NextResponse.json({
      accessToken: token.accessToken,
      expiresAt: token.expiresAt
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Token refresh failed' },
      { status: 401 }
    )
  }
} 
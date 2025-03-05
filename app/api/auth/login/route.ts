import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/services/auth-service'
import { InformaticaAuthCredentials, INFORMATICA_REGIONS } from '@/lib/utils/auth'

/**
 * API route for authenticating with Informatica Cloud
 * 
 * @param request The incoming request
 * @returns A response with the authentication token
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
    
    // Get the region from request or use default
    const region = body.region && INFORMATICA_REGIONS[body.region as keyof typeof INFORMATICA_REGIONS]
      ? (body.region as keyof typeof INFORMATICA_REGIONS)
      : 'US'
    
    // Authenticate with Informatica Cloud
    const token = await authenticate(credentials, region)
    
    // Return token and expiration
    return NextResponse.json({
      accessToken: token.accessToken,
      expiresAt: token.expiresAt
    })
  } catch (error) {
    console.error('Authentication error:', error)
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Authentication failed' },
      { status: 401 }
    )
  }
} 
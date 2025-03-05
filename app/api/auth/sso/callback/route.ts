import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { InformaticaAuthCredentials, INFORMATICA_REGIONS } from '@/lib/utils/auth'
import { authenticate } from '@/lib/services/auth-service'

/**
 * API route for handling OAuth callbacks from Informatica Cloud
 * 
 * @param request The incoming request
 * @returns A response redirecting to the app with authentication info
 */
export async function GET(request: NextRequest) {
  try {
    // Get the authorization code from the request
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')
    
    // Check for errors from the OAuth provider
    if (error) {
      return NextResponse.redirect(
        `${url.origin}?error=${encodeURIComponent(error)}`
      )
    }
    
    // Validate the code and state parameters
    if (!code || !state) {
      return NextResponse.redirect(
        `${url.origin}?error=${encodeURIComponent('Invalid callback parameters')}`
      )
    }
    
    // Verify state parameter (should match what was sent in the initial request)
    const cookieStore = cookies()
    const storedState = cookieStore.get('informatica_oauth_state')?.value
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        `${url.origin}?error=${encodeURIComponent('Invalid state parameter')}`
      )
    }
    
    // Extract region from state (encoded as region:randomString)
    const [region] = state.split(':')
    
    // Exchange the authorization code for an access token
    const tokenResponse = await fetch(`${INFORMATICA_REGIONS[region as keyof typeof INFORMATICA_REGIONS]}/api/v1/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${url.origin}/api/auth/sso/callback`,
        client_id: process.env.INFORMATICA_CLIENT_ID
      })
    })
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({ error: 'Unknown error' }))
      return NextResponse.redirect(
        `${url.origin}?error=${encodeURIComponent(errorData.error || 'Failed to exchange authorization code')}`
      )
    }
    
    const tokenData = await tokenResponse.json()
    
    // Store the token in cookies
    const expiresAt = Date.now() + tokenData.expires_in * 1000
    
    cookieStore.set({
      name: 'informatica_access_token',
      value: tokenData.access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: new Date(expiresAt)
    })
    
    cookieStore.set({
      name: 'informatica_refresh_token',
      value: tokenData.refresh_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    })
    
    // Redirect back to the application
    return NextResponse.redirect(`${url.origin}?auth=success`)
  } catch (error) {
    console.error('OAuth callback error:', error)
    
    const url = new URL(request.url)
    return NextResponse.redirect(
      `${url.origin}?error=${encodeURIComponent('Authentication failed')}`
    )
  }
} 
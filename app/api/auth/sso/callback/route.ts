import { cookies } from 'next/headers';
import { NextResponse , NextRequest } from 'next/server';



/**
 * API route for handling OAuth callbacks from Informatica Cloud
 *
 * @param request The incoming request
 * @returns A response redirecting to the app with authentication info
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    // Get the authorization code from the query parameters
    const url = new URL(request.url)
    const searchParams = url.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Check for errors from the OAuth provider
    if (error) {
      return NextResponse.redirect(
        `${url.origin}?error=${encodeURIComponent(error)}`
      )
    }

    // Validate the code and state parameters
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/?error=missing_code_or_state', request.url)
      )
    }

    // Verify state parameter (should match what was sent in the initial request)
    const cookieStore = await cookies()
    const storedState = cookieStore.get('informatica_oauth_state')?.value
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        `${url.origin}?error=${encodeURIComponent('Invalid state parameter')}`
      )
    }

    // Extract region from state (encoded as region:randomString)
    const [
      _region,
      _sessionId,
      _redirectUrl,
    ] = await Promise.all([
      state.split(':')[0],
      state.split(':')[1],
      state.split(':')[2],
    ])

    // Exchange the authorization code for an access token
    const tokenResponse = await fetch(
      `${process.env.INFORMATICA_SSO_TOKEN_URL}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: process.env.INFORMATICA_CLIENT_ID || '',
          client_secret: process.env.INFORMATICA_CLIENT_SECRET || '',
          code: code,
          redirect_uri: `${url.origin}/api/auth/sso/callback`,
        }),
      }
    )

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse
        .json()
        .catch(() => ({ error: 'Unknown error' }))
      return NextResponse.redirect(
        `${url.origin}?error=${encodeURIComponent(errorData.error || 'Failed to exchange authorization code')}`
      )
    }

    const tokenData = await tokenResponse.json()

    // Store the token in cookies
    const expiresAt = Date.now() + tokenData.expires_in * 1000

    await cookieStore.set({
      name: 'informatica_access_token',
      value: tokenData.access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: new Date(expiresAt),
    })

    await cookieStore.set({
      name: 'informatica_refresh_token',
      value: tokenData.refresh_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
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

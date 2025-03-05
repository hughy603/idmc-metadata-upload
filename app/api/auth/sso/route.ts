import { randomBytes } from 'crypto';

import { cookies } from 'next/headers';
import { NextResponse, NextRequest } from 'next/server';

import { INFORMATICA_REGIONS } from '@/lib/utils/auth';

/**
 * API route for initiating OAuth authentication with Informatica Cloud
 *
 * @param request The incoming request
 * @returns A response redirecting to Informatica's OAuth authorization endpoint
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    // Get the region from the query parameters (default to US)
    const url = new URL(request.url);
    const region = url.searchParams.get('region') || 'US';

    // Check if the region is supported
    if (!INFORMATICA_REGIONS[region as keyof typeof INFORMATICA_REGIONS]) {
      return NextResponse.json(
        { error: 'Unsupported region' },
        { status: 400 }
      );
    }

    // Generate a random state parameter for security
    const stateValue = `${region}:${randomBytes(16).toString('hex')}`;

    // Store the state in a cookie for verification in the callback
    const cookieStore = await cookies();

    await cookieStore.set({
      name: 'informatica_oauth_state',
      value: stateValue,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 10, // 10 minutes
    });

    // Build the authorization URL
    const authEndpoint = `${INFORMATICA_REGIONS[region as keyof typeof INFORMATICA_REGIONS]}/api/v1/oauth/authorize`;
    const redirectUri = `${url.origin}/api/auth/sso/callback`;

    const authUrl = new URL(authEndpoint);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append(
      'client_id',
      process.env.INFORMATICA_CLIENT_ID || ''
    );
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', 'read write');
    authUrl.searchParams.append('state', stateValue);

    // Redirect the user to Informatica's authorization endpoint
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('OAuth initialization error:', error);

    return NextResponse.json(
      { error: 'Failed to initialize OAuth flow' },
      { status: 500 }
    );
  }
}

import { NextResponse, NextRequest } from 'next/server';

import { authenticateWithInformatica } from '@/lib/services/informatica-mapping-service';

import { InformaticaAuthCredentials } from '@/lib/types';

interface InformaticaAuthCredentials {
  username: string;
  password: string;
}

// Define regions
const _INFORMATICA_REGIONS = {
  US: {
    baseUrl: 'https://dm-us.informaticacloud.com',
    apiUrl: 'https://idmc-api.dm-us.informaticacloud.com',
  },
  EMEA: {
    baseUrl: 'https://dm-em.informaticacloud.com',
    apiUrl: 'https://idmc-api.dm-em.informaticacloud.com',
  },
  APJ: {
    baseUrl: 'https://dm-ap.informaticacloud.com',
    apiUrl: 'https://idmc-api.dm-ap.informaticacloud.com',
  },
};

/**
 * API route for authenticating with Informatica Cloud
 *
 * @param request The incoming request
 * @returns A response with the authentication token
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Get credentials from request body
    const body = await request.json();

    // Validate required fields
    if (!body.username || !body.password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const credentials: InformaticaAuthCredentials = {
      username: body.username,
      password: body.password,
      baseUrl: body.baseUrl || 'https://dm-us.informaticacloud.com',
      apiUrl: body.apiUrl || 'https://idmc-api.dm-us.informaticacloud.com',
    };

    // Authenticate with Informatica Cloud
    const authResult = await authenticateWithInformatica(credentials);

    // Return token and session info
    return NextResponse.json({
      token: authResult.token,
      session: authResult.session,
    });
  } catch (error) {
    console.error('Authentication error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Authentication failed',
      },
      { status: 401 }
    );
  }
}

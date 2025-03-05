import { NextResponse } from 'next/server';

import { logout } from '@/lib/services/auth-service';

/**
 * API route for logging out and clearing authentication
 *
 * @returns A response indicating successful logout
 */
export async function POST(): Promise<NextResponse> {
  try {
    // Clear server-side authentication state
    logout();

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error during logout',
      },
      { status: 500 }
    );
  }
}

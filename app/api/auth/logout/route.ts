import { NextRequest, NextResponse } from 'next/server'
import { clearAuth } from '@/lib/services/auth-service'

/**
 * API route for logging out and clearing authentication
 * 
 * @param request The incoming request
 * @returns A response indicating successful logout
 */
export async function POST(request: NextRequest) {
  try {
    // Clear server-side authentication state
    clearAuth()
    
    // Return success
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    console.error('Logout error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error during logout'
      },
      { status: 500 }
    )
  }
} 
import { useState, useEffect } from 'react'
import { SessionInfo, AuthTokenInfo, checkImportJobStatus } from '../services/informatica-mapping-service'

export interface JobTrackingState {
  jobId: string | null
  status: string | null
  error: string | null
  isPolling: boolean
  details: any
}

export interface UseJobTrackingReturn {
  jobState: JobTrackingState
  startTracking: (auth: { session: SessionInfo; token: AuthTokenInfo }, jobId: string) => void
  stopTracking: () => void
  checkStatus: (auth: { session: SessionInfo; token: AuthTokenInfo }, jobId: string) => Promise<boolean>
}

export function useJobTracking(): UseJobTrackingReturn {
  const [jobState, setJobState] = useState<JobTrackingState>({
    jobId: null,
    status: null,
    error: null,
    isPolling: false,
    details: null
  })
  
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  const checkStatus = async (
    auth: { session: SessionInfo; token: AuthTokenInfo }, 
    jobId: string
  ): Promise<boolean> => {
    try {
      const result = await checkImportJobStatus(auth, jobId)
      
      setJobState(prev => ({
        ...prev,
        status: result.status,
        details: result.details || null,
        error: null
      }))
      
      // Return true if job is complete (success or failure)
      return ['COMPLETED', 'FAILED', 'ABORTED'].includes(result.status)
    } catch (error) {
      setJobState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error checking job status'
      }))
      
      return false
    }
  }

  const startTracking = (
    auth: { session: SessionInfo; token: AuthTokenInfo }, 
    jobId: string
  ) => {
    // Clear any existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }
    
    setJobState({
      jobId,
      status: 'PENDING',
      error: null,
      isPolling: true,
      details: null
    })
    
    // Start polling
    const interval = setInterval(async () => {
      const isComplete = await checkStatus(auth, jobId)
      
      if (isComplete) {
        stopTracking()
      }
    }, 3000) // Poll every 3 seconds
    
    setPollingInterval(interval)
  }

  const stopTracking = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
    
    setJobState(prev => ({
      ...prev,
      isPolling: false
    }))
  }

  return {
    jobState,
    startTracking,
    stopTracking,
    checkStatus
  }
} 
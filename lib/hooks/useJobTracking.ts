import { useEffect, useState } from 'react';

import { mappingService } from '@/lib/services/informatica-mapping-service';
import type { AuthResult } from '@/lib/services/informatica-mapping-service';

const POLLING_INTERVAL = 5000; // 5 seconds

export interface JobState {
  jobId: string | null;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'QUEUED' | null;
  error: string | null;
  isPolling: boolean;
}

export interface UseJobTrackingReturn {
  jobState: JobState;
  startTracking: (auth: AuthResult, jobId: string) => void;
  stopTracking: () => void;
}

/**
 * Custom hook for tracking job status
 */
export function useJobTracking(): UseJobTrackingReturn {
  const [jobState, setJobState] = useState<JobState>({
    jobId: null,
    status: null,
    error: null,
    isPolling: false,
  });

  // Polling interval reference
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  /**
   * Start tracking a job
   */
  const startTracking = async (auth: AuthResult, jobId: string): Promise<void> => {
    // Clear any existing polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    setJobState({
      jobId,
      status: 'PENDING',
      error: null,
      isPolling: true,
    });

    // Function to check job status
    const checkStatus = async () => {
      try {
        const status = await mappingService.getJobStatus(jobId);

        // Map the API status to our internal status
        let mappedStatus: JobState['status'];
        switch (status.status) {
          case 'QUEUED':
            mappedStatus = 'PENDING';
            break;
          case 'RUNNING':
          case 'COMPLETED':
          case 'FAILED':
            mappedStatus = status.status;
            break;
          default:
            mappedStatus = 'FAILED';
            break;
        }

        setJobState(prev => ({
          ...prev,
          status: mappedStatus,
          error: status.error || null,
        }));

        // If job is complete or failed, stop polling
        if (status.status === 'COMPLETED' || status.status === 'FAILED') {
          stopTracking();
        }
      } catch (error) {
        console.error('Error checking job status:', error);
        setJobState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to check job status',
        }));
        stopTracking();
      }
    };

    // Start polling
    const interval = setInterval(checkStatus, POLLING_INTERVAL);
    setPollingInterval(interval);

    // Do an immediate check
    await checkStatus();
  };

  /**
   * Stop tracking the current job
   */
  const stopTracking = (): void => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }

    setJobState(prev => ({
      ...prev,
      isPolling: false,
    }));
  };

  return {
    jobState,
    startTracking,
    stopTracking,
  };
}

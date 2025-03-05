/**
 * API Rate Limiter Service
 *
 * This service manages API call rate limiting to ensure we don't exceed
 * Informatica Cloud's 120 API calls per minute limit.
 *
 * @module services/api-rate-limiter
 */

/**
 * Represents an item in the API call queue
 */
interface QueueItem<T> {
  /** Function that executes the API call */
  execute: () => Promise<T>;
  /** Function to call when the API call succeeds */
  resolve: (value: T | PromiseLike<T>) => void;
  /** Function to call when the API call fails */
  reject: (reason?: any) => void;
  /** Priority of the queue item (lower numbers = higher priority) */
  priority?: number | undefined;
  /** Optional metadata for tracking and debugging purposes */
  metadata?: Record<string, any> | undefined;
}

/**
 * Options for enqueueing an API call
 */
interface EnqueueOptions {
  /** Priority of the API call (lower numbers = higher priority) */
  priority?: number | undefined;
  /** Optional metadata for tracking and debugging purposes */
  metadata?: Record<string, any> | undefined;
}

/**
 * Options for batch enqueueing multiple API calls
 */
interface BatchEnqueueOptions<T> {
  /** Callback function that gets called when progress is made */
  onProgress?: (
    completed: number,
    total: number,
    results: Array<T | Error>
  ) => void;
  /** Priority of the API calls (lower numbers = higher priority) */
  priority?: number;
}

/**
 * Status of the rate limiter
 */
interface RateLimitStatus {
  /** Number of API calls made in the last minute */
  callsInLastMinute: number;
  /** Maximum number of API calls allowed per minute */
  maxCallsPerMinute: number;
  /** Number of items in the queue */
  queueLength: number;
  /** Number of API calls remaining before hitting the limit */
  remaining: number;
  /** The rate limit */
  limit: number;
  /** Unix timestamp when the rate limit will reset */
  resetAt: number;
}

/**
 * Manages API call rate limiting to ensure we don't exceed the API rate limit
 */
export class ApiRateLimiter {
  private static instance: ApiRateLimiter;
  private queue: QueueItem<any>[] = [];
  private processing = false;
  private callsInLastMinute = 0;
  private callTimestamps: number[] = [];
  private readonly MAX_CALLS_PER_MINUTE = 120;
  private readonly MINUTE_IN_MS = 60 * 1000;
  private nextResetTime: number = Date.now() + this.MINUTE_IN_MS;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.startResetTimeTracking();
  }

  /**
   * Get the singleton instance of the rate limiter
   * @returns The ApiRateLimiter instance
   */
  public static getInstance(): ApiRateLimiter {
    if (!ApiRateLimiter.instance) {
      ApiRateLimiter.instance = new ApiRateLimiter();
    }
    return ApiRateLimiter.instance;
  }

  /**
   * Start tracking reset time to provide better visibility to users
   */
  private startResetTimeTracking(): void {
    // Update the reset time every second
    setInterval(() => {
      if (this.callTimestamps.length > 0) {
        // Reset time is one minute after the oldest timestamp
        this.nextResetTime = this.callTimestamps[0] + this.MINUTE_IN_MS;
      } else {
        // If no calls have been made, reset time is one minute from now
        this.nextResetTime = Date.now() + this.MINUTE_IN_MS;
      }
      this.cleanupOldTimestamps(Date.now());
    }, 1000);
  }

  /**
   * Enqueue an API call to be executed with rate limiting
   * @param apiCall Function that executes the API call
   * @param options Optional configuration for priority and metadata
   * @returns Promise that resolves with the API call result
   */
  public enqueue<T>(
    apiCall: () => Promise<T>,
    options: EnqueueOptions = {}
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        execute: apiCall,
        resolve,
        reject,
        priority: options.priority,
        metadata: options.metadata,
      });

      // Sort queue by priority if needed
      if (options.priority !== undefined) {
        this.queue.sort((a, b) => (a.priority || 0) - (b.priority || 0));
      }

      if (!this.processing) {
        void this.processQueue();
      }
    });
  }

  /**
   * Process the queue of API calls with rate limiting
   */
  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;

    // Check if we can make another API call
    const waitTime = this.getWaitTimeForNextCall();

    if (waitTime > 0) {
      // Wait until we can make another call
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Get the next item from the queue
    const item = this.queue.shift();
    if (!item) {
      void this.processQueue();
      return;
    }

    try {
      // Record this call
      this.recordApiCall();

      // Execute the API call
      const result = await item.execute();
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    }

    // Process the next item in the queue
    void this.processQueue();
  }

  /**
   * Record an API call for rate limiting purposes
   */
  private recordApiCall(): void {
    const now = Date.now();
    this.callTimestamps.push(now);
    this.callsInLastMinute++;

    // Clean up old timestamps
    this.cleanupOldTimestamps(now);
  }

  /**
   * Remove timestamps older than 1 minute
   * @param now Current timestamp
   */
  private cleanupOldTimestamps(now: number): void {
    const oneMinuteAgo = now - this.MINUTE_IN_MS;

    // Remove timestamps older than 1 minute
    const newTimestamps = this.callTimestamps.filter(
      timestamp => timestamp >= oneMinuteAgo
    );

    // Update counts
    this.callsInLastMinute = newTimestamps.length;
    this.callTimestamps = newTimestamps;
  }

  /**
   * Calculate how long to wait before making the next API call
   * @returns Time to wait in milliseconds
   */
  private getWaitTimeForNextCall(): number {
    const now = Date.now();

    // Clean up old timestamps first
    this.cleanupOldTimestamps(now);

    // If we haven't reached the limit, no need to wait
    if (this.callsInLastMinute < this.MAX_CALLS_PER_MINUTE) {
      return 0;
    }

    // We've reached the limit, calculate when we can make the next call
    const oldestTimestamp = this.callTimestamps[0];
    const timeToWait = oldestTimestamp + this.MINUTE_IN_MS - now;

    return Math.max(0, timeToWait);
  }

  /**
   * Get the current rate limit status
   * @returns Rate limit status object
   */
  public getRateLimitStatus(): RateLimitStatus {
    // Clean up old timestamps first
    this.cleanupOldTimestamps(Date.now());

    return {
      callsInLastMinute: this.callsInLastMinute,
      maxCallsPerMinute: this.MAX_CALLS_PER_MINUTE,
      queueLength: this.queue.length,
      remaining: this.MAX_CALLS_PER_MINUTE - this.callsInLastMinute,
      limit: this.MAX_CALLS_PER_MINUTE,
      resetAt: this.nextResetTime,
    };
  }

  /**
   * Batch enqueue multiple API calls with automatic rate limiting
   * Useful for uploading many items at once
   * @param apiCalls Array of functions that execute API calls
   * @param options Optional batch configuration
   * @returns Promise that resolves when all calls are complete
   */
  public async batchEnqueue<T>(
    apiCalls: Array<() => Promise<T>>,
    options: BatchEnqueueOptions<T> = {}
  ): Promise<(T | Error)[]> {
    const { onProgress } = options;
    const total = apiCalls.length;
    const results: Array<T | Error> = new Array(total);
    let completed = 0;

    const promises = apiCalls.map((apiCall, index) => {
      return this.enqueue(() => apiCall(), { priority: options.priority })
        .then(result => {
          results[index] = result;
          completed++;
          onProgress?.(completed, total, results);
          return result;
        })
        .catch(error => {
          results[index] = error;
          completed++;
          onProgress?.(completed, total, results);
          return error;
        });
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Pause processing the queue temporarily
   */
  public pause(): void {
    this.processing = false;
  }

  /**
   * Resume processing the queue if paused
   */
  public resume(): void {
    if (!this.processing && this.queue.length > 0) {
      void this.processQueue();
    }
  }

  /**
   * Clear all items from the queue
   */
  public clearQueue(): void {
    // Reject all pending items
    this.queue.forEach(item => {
      item.reject(new Error('Queue was cleared'));
    });
    this.queue = [];
  }
}

// Export a singleton instance
export const apiRateLimiter = ApiRateLimiter.getInstance();

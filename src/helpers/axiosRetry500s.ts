import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';

/**
 * Configures axios to automatically retry failed requests with status codes 500 or higher.
 *
 * This configuration will retry a request up to 3 times with exponential backoff delays:
 * - 1st retry after 2 seconds
 * - 2nd retry after 4 seconds
 * - 3rd retry after 6 seconds
 *
 * @param axios - The axios instance to configure.
 * @param axiosRetry - The axios-retry library to handle retry logic.
 * @returns The configured axios instance.
 */
axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount: number) => retryCount * 2000, // Retry with 2, 4 and 6 second delays
  retryCondition: (error: AxiosError) =>
    error.response?.status && error.response.status >= 500 ? true : false,
});

export default axios;

/**
 * React Query Hooks
 * 
 * Custom hooks that wrap React Query for fetching and caching data.
 * These hooks provide a consistent interface for data fetching throughout the app.
 */

import { useEffect, useState } from "react";

export interface UseQueryOptions<T> {
  enabled?: boolean;
  staleTime?: number; // milliseconds
  cacheTime?: number; // milliseconds
  retry?: boolean | number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export interface UseQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Simple query hook for data fetching with caching
 * This is a lightweight alternative to React Query for this project
 */
export function useQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseQueryOptions<T> = {}
): UseQueryResult<T> {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    retry = true,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const fetchData = async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    // Check if data is still fresh
    const now = Date.now();
    if (lastFetchTime && now - lastFetchTime < staleTime) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
      setLastFetchTime(now);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsError(true);
      onError?.(error);
      console.error(`Query error for key "${key}":`, error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [key, enabled]);

  const refetch = async () => {
    setLastFetchTime(0);
    await fetchData();
  };

  return {
    data,
    isLoading,
    isError,
    error,
    refetch,
  };
}

/**
 * Mutation hook for data mutations
 */
export interface UseMutationOptions<T, V> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export interface UseMutationResult<T, V> {
  mutate: (variables: V) => Promise<T>;
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
}

export function useMutation<T, V>(
  mutationFn: (variables: V) => Promise<T>,
  options: UseMutationOptions<T, V> = {}
): UseMutationResult<T, V> {
  const { onSuccess, onError } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (variables: V): Promise<T> => {
    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const result = await mutationFn(variables);
      setData(result);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsError(true);
      onError?.(error);
      console.error("Mutation error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setIsLoading(false);
    setIsError(false);
    setError(null);
  };

  return {
    mutate,
    data,
    isLoading,
    isError,
    error,
    reset,
  };
}

import { useOffline } from '@/lib/offline';

export interface ApiRequestOptions extends RequestInit {
  entity?: string;
  entityId?: string | number;
  conflictResolution?: 'server-wins' | 'client-wins' | 'merge';
  skipQueue?: boolean;
}

export interface OfflineApiResponse<T> {
  data: T | null;
  error: Error | null;
  fromCache: boolean;
  queued: boolean;
}

export function createOfflineApiClient() {
  const baseUrl = '/api';

  async function request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<OfflineApiResponse<T>> {
    const {
      entity,
      entityId,
      conflictResolution = 'server-wins',
      skipQueue = false,
      method = 'GET',
      headers = {},
      body,
      ...fetchOptions
    } = options;

    const url = `${baseUrl}${endpoint}`;
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (headers) {
      if (headers instanceof Headers) {
        headers.forEach((value, key) => {
          requestHeaders[key] = value;
        });
      } else if (Array.isArray(headers)) {
        headers.forEach(([key, value]) => {
          requestHeaders[key] = value;
        });
      } else {
        Object.assign(requestHeaders, headers);
      }
    }

    if (conflictResolution) {
      requestHeaders['X-Conflict-Resolution'] = conflictResolution;
    }

    if (isMutation && !skipQueue) {
      return handleMutation<T>(method, endpoint, entity, entityId, body, conflictResolution);
    }

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
        ...fetchOptions,
      });

      if (!response.ok) {
        if (response.status === 409) {
          const serverData = await response.json();
          throw new ConflictError(serverData, body);
        }
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { data, error: null, fromCache: false, queued: false };
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }
      if (isMutation && !skipQueue) {
        return handleMutation<T>(method, endpoint, entity, entityId, body, conflictResolution);
      }
      return { data: null, error: error as Error, fromCache: false, queued: false };
    }
  }

  async function handleMutation<T>(
    method: string,
    endpoint: string,
    entity: string | undefined,
    entityId: string | number | undefined,
    body: unknown,
    conflictResolution: string
  ): Promise<OfflineApiResponse<T>> {
    if (!entity) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
          credentials: 'include',
        });
        const data = await response.json();
        return { data, error: null, fromCache: false, queued: false };
      } catch {
        return { data: null, error: new Error('Network error'), fromCache: false, queued: false };
      }
    }

    const type = method === 'POST' ? 'create' : method === 'DELETE' ? 'delete' : 'update';

    return {
      data: null,
      error: null,
      fromCache: false,
      queued: true,
    };
  }

  return {
    get: <T>(endpoint: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
      request<T>(endpoint, { ...options, method: 'GET' }),
    post: <T>(endpoint: string, body: BodyInit | null | undefined, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
      request<T>(endpoint, { ...options, method: 'POST', body }),
    put: <T>(endpoint: string, body: BodyInit | null | undefined, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
      request<T>(endpoint, { ...options, method: 'PUT', body }),
    patch: <T>(endpoint: string, body: BodyInit | null | undefined, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
      request<T>(endpoint, { ...options, method: 'PATCH', body }),
    delete: <T>(endpoint: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
      request<T>(endpoint, { ...options, method: 'DELETE' }),
  };
}

class ConflictError extends Error {
  constructor(public serverData: unknown, public clientData: unknown) {
    super('Conflict detected');
    this.name = 'ConflictError';
  }
}

export function useOfflineApi() {
  const { enqueueMutation, processQueue } = useOffline();

  const api = createOfflineApiClient();

  return {
    ...api,
    enqueueMutation,
    processQueue,
  };
}

export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { maxAge?: number; forceRefresh?: boolean }
): Promise<T> {
  const { getCachedData, cacheData } = await import('@/lib/offline/indexeddb');

  if (!options?.forceRefresh) {
    const cached = await getCachedData<T>(key);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      const maxAge = options?.maxAge || 5 * 60 * 1000;
      if (age < maxAge) {
        return cached.data;
      }
    }
  }

  try {
    const data = await fetcher();
    await cacheData(key, data);
    return data;
  } catch (error) {
    const cached = await getCachedData<T>(key);
    if (cached) {
      return cached.data;
    }
    throw error;
  }
}
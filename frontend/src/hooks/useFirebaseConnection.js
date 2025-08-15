import { useState, useEffect, useCallback, useRef } from 'react';
import { createConnectionMonitor, retryFirestoreOperation, handleFirestoreError } from '../firebase/config';
import { useToast } from '../contexts/ToastContext';

export const useFirebaseConnection = () => {
  const [connectionStatus, setConnectionStatus] = useState({
    browserOnline: navigator.onLine,
    firestoreConnected: true,
    overall: navigator.onLine,
    lastError: null,
    retryCount: 0
  });
  
  const { toast } = useToast();
  const monitorRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const prevStatusRef = useRef(connectionStatus); // Track previous status

  const handleStatusChange = useCallback((status) => {
    setConnectionStatus((prev) => {
      const newStatus = {
        ...prev,
        ...status,
        lastError: !status.overall ? 'Connection interrupted' : null
      };

      // Compare previous and new status for toast notifications
      const prevOverall = prevStatusRef.current.overall;
      if (!status.overall && prevOverall) {
        toast?.warning({ 
          message: 'Connexion interrompue. Tentative de reconnexion...',
          duration: 5000 
        });
      } else if (status.overall && !prevOverall) {
        toast?.success({ 
          message: 'Connexion rétablie',
          duration: 3000 
        });
      }

      // Update the ref with the new status
      prevStatusRef.current = newStatus;
      return newStatus;
    });
  }, [toast]);

  const retryConnection = useCallback(async () => {
    try {
      setConnectionStatus((prev) => ({ ...prev, retryCount: prev.retryCount + 1 }));
      
      // Test with a simple operation
      await retryFirestoreOperation(async () => {
        return Promise.resolve();
      }, 1, 1000);

      setConnectionStatus((prev) => ({
        ...prev,
        firestoreConnected: true,
        overall: navigator.onLine && true,
        lastError: null
      }));

      toast?.success({ 
        message: 'Reconnexion réussie',
        duration: 3000 
      });
    } catch (error) {
      const errorMessage = handleFirestoreError(error, 'retry connection');
      setConnectionStatus((prev) => ({
        ...prev,
        lastError: errorMessage
      }));
      
      toast?.error({ 
        message: errorMessage,
        duration: 5000 
      });
    }
  }, [toast]);

  // Auto-retry with exponential backoff
  useEffect(() => {
    if (!connectionStatus.overall && connectionStatus.retryCount < 5) {
      const delay = Math.min(1000 * Math.pow(2, connectionStatus.retryCount), 30000);
      
      retryTimeoutRef.current = setTimeout(() => {
        retryConnection();
      }, delay);

      return () => {
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
      };
    }
  }, [connectionStatus.overall, connectionStatus.retryCount, retryConnection]);

  useEffect(() => {
    // Initialize connection monitor
    monitorRef.current = createConnectionMonitor(handleStatusChange);

    // Cleanup on unmount
    return () => {
      if (monitorRef.current) {
        monitorRef.current();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [handleStatusChange]);

  // Manual retry function for UI
  const manualRetry = useCallback(() => {
    setConnectionStatus((prev) => ({ ...prev, retryCount: 0 }));
    retryConnection();
  }, [retryConnection]);

  return {
    ...connectionStatus,
    retryConnection: manualRetry,
    isOffline: !connectionStatus.overall
  };
};

// Enhanced hook for Firestore operations with automatic retry
export const useFirestoreOperation = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const executeOperation = useCallback(async (operation, options = {}) => {
    const {
      maxRetries = 3,
      showSuccessToast = false,
      successMessage = 'Opération réussie',
      loadingMessage = 'Chargement...',
      context = 'operation'
    } = options;

    setIsLoading(true);
    setError(null);

    if (loadingMessage && toast) {
      toast.info({ message: loadingMessage });
    }

    try {
      const result = await retryFirestoreOperation(operation, maxRetries);
      
      if (showSuccessToast && toast) {
        toast.success({ message: successMessage });
      }

      setIsLoading(false);
      return result;
    } catch (error) {
      const errorMessage = handleFirestoreError(error, context);
      setError(errorMessage);
      setIsLoading(false);

      if (toast) {
        toast.error({ message: errorMessage });
      }

      throw error;
    }
  }, [toast]);

  return {
    executeOperation,
    isLoading,
    error,
    clearError: () => setError(null)
  };
};

// Hook for handling offline-first data with caching
export const useOfflineData = (key, fetchFunction, options = {}) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const { connectionStatus } = useFirebaseConnection();
  const { executeOperation } = useFirestoreOperation();
  
  const {
    cacheTimeout = 5 * 60 * 1000, // 5 minutes default
    enableCache = true,
    refetchOnReconnect = true
  } = options;

  const getCacheKey = useCallback((key) => `firebase_cache_${key}`, []);
  
  const getCachedData = useCallback(() => {
    if (!enableCache) return null;
    
    try {
      const cached = localStorage.getItem(getCacheKey(key));
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const isExpired = Date.now() - timestamp > cacheTimeout;
        
        if (!isExpired) {
          return { data, timestamp };
        }
      }
    } catch (error) {
      console.warn('Error reading cache:', error);
    }
    
    return null;
  }, [key, cacheTimeout, enableCache, getCacheKey]);

  const setCachedData = useCallback((data) => {
    if (!enableCache) return;
    
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(getCacheKey(key), JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Error setting cache:', error);
    }
  }, [key, enableCache, getCacheKey]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const cached = getCachedData();
      if (cached) {
        setData(cached.data);
        setLastUpdated(new Date(cached.timestamp));
        setIsLoading(false);
        return cached.data;
      }
    }

    // If offline and we have cached data, use it
    if (!connectionStatus.overall && data) {
      setError('Mode hors ligne - données mises en cache affichées');
      setIsLoading(false);
      return data;
    }

    // Fetch fresh data
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await executeOperation(fetchFunction, {
        context: `fetch ${key}`,
        maxRetries: connectionStatus.overall ? 3 : 1
      });
      
      setData(result);
      setLastUpdated(new Date());
      setCachedData(result);
      
      return result;
    } catch (error) {
      setError(error.message);
      
      // If we have cached data, use it as fallback
      const cached = getCachedData();
      if (cached) {
        setData(cached.data);
        setLastUpdated(new Date(cached.timestamp));
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [connectionStatus.overall, data, executeOperation, fetchFunction, getCachedData, setCachedData, key]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Refetch on reconnection
  useEffect(() => {
    if (refetchOnReconnect && connectionStatus.overall && lastUpdated) {
      const timeSinceUpdate = Date.now() - lastUpdated.getTime();
      
      // Only refetch if data is older than 1 minute
      if (timeSinceUpdate > 60000) {
        fetchData(true);
      }
    }
  }, [connectionStatus.overall, refetchOnReconnect, lastUpdated, fetchData]);

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    refetch: () => fetchData(true),
    isStale: lastUpdated ? Date.now() - lastUpdated.getTime() > cacheTimeout : false,
    isOffline: !connectionStatus.overall
  };
};
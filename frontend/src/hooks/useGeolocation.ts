import { useEffect, useState, useCallback } from 'react';

interface GeolocationPosition {
  latitude: number;
  longitude: number;
}

interface GeolocationState {
  position: GeolocationPosition | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

export function useGeolocation(options: PositionOptions = DEFAULT_OPTIONS) {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    accuracy: null,
    error: null,
    loading: true,
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refresh = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        position: null,
        accuracy: null,
        error: 'Geolocation is not supported by your browser',
        loading: false,
      });
      return;
    }

    let isMounted = true;
    setState((prev) => ({ ...prev, loading: true }));

    const handleSuccess = (pos: GeolocationPosition & { coords: { latitude: number; longitude: number; accuracy: number } }) => {
      if (!isMounted) return;
      setState({
        position: {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        },
        accuracy: pos.coords.accuracy,
        error: null,
        loading: false,
      });
    };

    const handleError = (err: GeolocationPositionError) => {
      if (!isMounted) return;
      setState({
        position: null,
        accuracy: null,
        error: err.message || 'Unable to retrieve your location',
        loading: false,
      });
    };

    // Get current position once immediately
    navigator.geolocation.getCurrentPosition(
      (pos) => handleSuccess(pos as any),
      handleError,
      options
    );

    // Watch position
    const watchId = navigator.geolocation.watchPosition(
      (pos) => handleSuccess(pos as any),
      handleError,
      options
    );

    return () => {
      isMounted = false;
      navigator.geolocation.clearWatch(watchId);
    };
  }, [refreshTrigger, options]);

  return {
    ...state,
    refresh,
  };
}

export default useGeolocation;

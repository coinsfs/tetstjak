import { useState, useEffect } from 'react';

export const useRouter = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [currentFullUrl, setCurrentFullUrl] = useState(window.location.pathname + window.location.search);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
      setCurrentFullUrl(window.location.pathname + window.location.search);
    };

    // Listen to our custom routechange event
    const handleRouteChange = (event: CustomEvent) => {
      setCurrentPath(event.detail.path);
      setCurrentFullUrl(event.detail.fullUrl || event.detail.path);
    };

    // Handle initial load and direct URL access
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
      setCurrentFullUrl(window.location.pathname + window.location.search);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('routechange', handleRouteChange as EventListener);
    
    // Set initial path on mount
    handleLocationChange();

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('routechange', handleRouteChange as EventListener);
    };
  }, []);

  const navigate = (path: string) => {
    const fullUrl = path;
    const pathOnly = path.split('?')[0];
    
    if (fullUrl !== currentFullUrl) {
      window.history.pushState({}, '', path);
      
      // Immediately update both path states
      setCurrentPath(pathOnly);
      setCurrentFullUrl(fullUrl);
      
      // Also dispatch custom event for other components that might need it
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('routechange', { detail: { path: pathOnly, fullUrl } }));
      }, 0);
    }
  };

  const replace = (path: string) => {
    const fullUrl = path;
    const pathOnly = path.split('?')[0];
    
    window.history.replaceState({}, '', path);
    
    // Immediately update both path states
    setCurrentPath(pathOnly);
    setCurrentFullUrl(fullUrl);
    
    // Also dispatch custom event for other components that might need it
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('routechange', { detail: { path: pathOnly, fullUrl } }));
    }, 0);
  };

  return { currentPath, currentFullUrl, navigate, replace };
};
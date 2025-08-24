import { useState, useEffect } from 'react';

export const useRouter = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    // Listen to our custom routechange event
    const handleRouteChange = (event: CustomEvent) => {
      setCurrentPath(event.detail.path);
    };

    // Handle initial load and direct URL access
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
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
    if (path !== currentPath) {
      window.history.pushState({}, '', path);
      
      // Immediately update the current path state
      setCurrentPath(path);
      
      // Also dispatch custom event for other components that might need it
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('routechange', { detail: { path } }));
      }, 0);
    }
  };

  const replace = (path: string) => {
    window.history.replaceState({}, '', path);
    
    // Immediately update the current path state
    setCurrentPath(path);
    
    // Also dispatch custom event for other components that might need it
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('routechange', { detail: { path } }));
    }, 0);
  };

  return { currentPath, navigate, replace };
};
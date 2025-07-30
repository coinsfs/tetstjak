import { useState, useEffect } from 'react';

export const useRouter = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    // Handle initial load and direct URL access
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    
    // Set initial path on mount
    handleLocationChange();

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (path !== currentPath) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
    }
  };

  const replace = (path: string) => {
    window.history.replaceState({}, '', path);
    setCurrentPath(path);
  };

  return { currentPath, navigate, replace };
};
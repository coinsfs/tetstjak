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
  if (window.location.pathname !== path) {
    window.history.pushState({}, '', path);
    setCurrentPath(path); // ini oke, karena kamu bandingin langsung ke real path
  }
};


  const replace = (path: string) => {
    window.history.replaceState({}, '', path);
    setCurrentPath(path);
  };

  return { currentPath, navigate, replace };
};
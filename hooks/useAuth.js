// hooks/useAuth.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export function useAuth(redirectTo = "/login") {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");

      if (token) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setRedirecting(true);  // Set redirecting to true to block rendering
        if (redirectTo && router.pathname !== redirectTo) {
          router.replace(redirectTo).then(() => setRedirecting(false));  // Replace to avoid back history
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router, redirectTo]);

  return { isAuthenticated, isLoading, redirecting };
}

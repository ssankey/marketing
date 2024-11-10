import { useEffect } from "react";
import { useRouter } from "next/router";

export function useAuth() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login"); // Redirect to login if not authenticated
    }
  }, [router]);
}

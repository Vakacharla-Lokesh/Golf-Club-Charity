import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useUser() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/user');

        if (!response.ok) {
          setUser(null);
          setAccessToken(null);
          setIsLoading(false);
          router.push('/login');
          return;
        }

        const userData = await response.json();
        setUser(userData.user || null);

        const token = localStorage.getItem('sb-access-token');
        setAccessToken(token);
      } catch (error) {
        console.error('Error fetching user:', error);
        setUser(null);
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  return { user, accessToken, isLoading };
}

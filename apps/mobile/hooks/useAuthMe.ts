import { useCallback, useEffect, useRef, useState } from 'react';

import { api, type ApiUser } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

type UseAuthMeOptions = {
  enabled?: boolean;
};

type UseAuthMeResult = {
  data: ApiUser | null;
  loading: boolean;
  reload: () => Promise<void>;
};

export function useAuthMe(options: UseAuthMeOptions = {}): UseAuthMeResult {
  const { enabled = true } = options;
  const [data, setData] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(false);
  const activeRef = useRef(true);

  useEffect(() => {
    return () => {
      activeRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!enabled) return;
    if (activeRef.current) {
      setLoading(true);
    }
    const token = await getAccessToken();
    if (!token) {
      if (activeRef.current) {
        setData(null);
        setLoading(false);
      }
      return;
    }
    try {
      const me = await api.fetchAuthMe(token);
      if (activeRef.current) {
        setData(me);
      }
    } catch {
      if (activeRef.current) {
        setData(null);
      }
    } finally {
      if (activeRef.current) {
        setLoading(false);
      }
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  return { data, loading, reload: load };
}

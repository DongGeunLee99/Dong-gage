import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/authContext';

/**
 * iOS 단축어가 문자를 보낼 때 쓰는 인제스트 토큰.
 * 토큰 값 자체는 DB 기본값(pgcrypto)이 만들고, 앱은 user_id만 넣고 돌려받는다.
 */
export function useSmsIngestToken() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setToken(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    supabase
      .from('sms_ingest_tokens')
      .select('token')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.warn('Failed to load ingest token', error);
        setToken(data?.[0]?.token ?? null);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  /** 새 토큰을 발급한다. 기존 토큰은 지워지므로 단축어도 새 값으로 고쳐야 한다. */
  const issueToken = useCallback(async () => {
    if (!userId) return null;
    await supabase.from('sms_ingest_tokens').delete().eq('user_id', userId);
    const { data, error } = await supabase
      .from('sms_ingest_tokens')
      .insert({ user_id: userId })
      .select('token')
      .single();

    if (error || !data) {
      console.warn('Failed to issue ingest token', error);
      return null;
    }
    setToken(data.token);
    return data.token as string;
  }, [userId]);

  return { token, isLoading, issueToken };
}

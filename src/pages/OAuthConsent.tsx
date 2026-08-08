import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthPage } from '@/components/AuthPage';
import { useAuth } from '@/hooks/useAuth';
import { Music2 } from 'lucide-react';

type OAuthResult = {
  data: {
    client?: { name?: string; client_name?: string } | null;
    redirect_url?: string;
    redirect_to?: string;
  } | null;
  error: { message: string } | null;
};

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};

const oauthApi = () =>
  (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get('authorization_id') ?? '';
  const { isLoggedIn, loading: authLoading, signIn, signUp } = useAuth();

  const [details, setDetails] = useState<OAuthResult['data']>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError('Missing authorization_id');
        return;
      }
      if (authLoading || !isLoggedIn) return;
      const { data, error: err } = await oauthApi().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (err) {
        setError(err.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId, authLoading, isLoggedIn]);

  const decide = useCallback(
    async (approve: boolean) => {
      setBusy(true);
      const api = oauthApi();
      const { data, error: err } = approve
        ? await api.approveAuthorization(authorizationId)
        : await api.denyAuthorization(authorizationId);
      if (err) {
        setBusy(false);
        setError(err.message);
        return;
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setBusy(false);
        setError('No redirect returned by the authorization server.');
        return;
      }
      window.location.href = target;
    },
    [authorizationId]
  );

  if (!authLoading && !isLoggedIn) {
    return <AuthPage onBack={() => undefined} onSignIn={signIn} onSignUp={signUp} />;
  }

  const clientName = details?.client?.name ?? details?.client?.client_name ?? 'aplikasi ini';

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Music2 className="text-primary" size={20} />
          </div>
          <span className="font-bold text-foreground">Harmony Hub</span>
        </div>

        {error ? (
          <p className="text-sm text-destructive">Tidak dapat memuat permintaan ini: {error}</p>
        ) : !details ? (
          <p className="text-sm text-muted-foreground">Memuat…</p>
        ) : (
          <>
            <h1 className="text-xl font-bold text-foreground mb-2">
              Hubungkan {clientName} ke akunmu
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              {clientName} akan dapat mencari lagu, membaca, dan mengubah playlist milikmu di Harmony Hub.
            </p>
            <div className="flex gap-3">
              <button
                disabled={busy}
                onClick={() => decide(true)}
                className="flex-1 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                Izinkan
              </button>
              <button
                disabled={busy}
                onClick={() => decide(false)}
                className="flex-1 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-foreground disabled:opacity-50"
              >
                Tolak
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

import React, { useEffect, useState } from 'react';
import { authClient, authConfigured, authenticatedFetch } from './client';

type Identity = { userId: string; tenantId: string };
export function AuthPanel() {
  const [email, setEmail] = useState('');
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [status, setStatus] = useState<'idle' | 'checking' | 'sending'>('idle');
  const [notice, setNotice] = useState('');
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    if (!authClient) return;
    let mounted = true;
    const check = async () => {
      setStatus('checking');
      try {
        const { data: { session } } = await authClient!.auth.getSession();
        if (!mounted) return;
        setHasSession(Boolean(session));
        if (!session) { setIdentity(null); setStatus('idle'); return; }
        const res = await authenticatedFetch('/api/session');
        if (!mounted) return;
        if (!res.ok) throw new Error(res.status === 403 ? 'Ehhez a fiókhoz nincs jóváhagyott szervezet.' : 'Szerveroldali hitelesítés sikertelen.');
        setIdentity(await res.json() as Identity);
        setNotice('');
      } catch (err) {
        if (mounted) { setIdentity(null); setNotice(err instanceof Error ? err.message : 'Sikertelen azonosítás'); }
      } finally { if (mounted) setStatus('idle'); }
    };
    void check();
    const { data: { subscription } } = authClient.auth.onAuthStateChange(() => { void check(); });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const sendLink = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!authClient || !email.trim()) return;
    setStatus('sending'); setNotice('');
    try {
      const { error } = await authClient.auth.signInWithOtp({
        email: email.trim(), options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      setNotice('Ha a cím engedélyezett, a belépési hivatkozást elküldtük.');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Belépési hiba');
    } finally { setStatus('idle'); }
  };

  return (
    <div className="flex flex-col gap-1 text-[11px] text-neutral-300 min-w-[145px]" aria-label="Szerveres bejelentkezés">
      {identity ? (
        <div className="flex items-center gap-2">
          <span className="text-emerald-300 font-semibold" title={identity.userId}>Azonosítva · {identity.tenantId}</span>
          <button className="underline" onClick={() => { void authClient?.auth.signOut(); setIdentity(null); }}>Kilépés</button>
        </div>
      ) : !authConfigured ? (
        <span className="text-amber-400">Szerveres belépés nincs beállítva · DEMO</span>
      ) : hasSession ? (
        <div className="text-amber-400">Belépve, de a szervezet nincs jóváhagyva
          <button className="ml-2 underline" onClick={() => {void authClient?.auth.signOut(); setHasSession(false);}}>Kilépés</button>
        </div>
      ) : (
        <form className="flex gap-1" onSubmit={sendLink}>
          <input aria-label="E-mail cím" type="email" required value={email} onChange={e=>setEmail(e.target.value)}
            placeholder="E-mailes belépés" className="w-36 rounded bg-neutral-950 p-1.5 border border-neutral-700 text-white" />
          <button type="submit" disabled={status !== 'idle'} className="rounded bg-emerald-700 px-2 text-white disabled:opacity-50">Küldés</button>
        </form>
      )}
      {notice && <span role="status" className="text-amber-400 max-w-[220px]">{notice}</span>}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { createClient, Session } from '@supabase/supabase-js';
import Login from './components/Login.tsx';
import Sidebar from './components/Sidebar.tsx';
import Topbar from './components/Topbar.tsx';
import Overview from './components/Overview.tsx';
import Catalog from './components/Catalog.tsx';
import Logs from './components/Logs.tsx';

// ─── Supabase Configuration ───────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

type TabType = 'overview' | 'catalog' | 'logs';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<TabType>('overview');

  useEffect(() => {
    // 1. Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Auth State Changed Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center z-50">
        <div className="w-12 h-12 border-3 border-emerald-500/10 rounded-full border-t-emerald-400 animate-spin"></div>
      </div>
    );
  }

  // If not authenticated, render Login
  if (!session) {
    return <Login onLoginSuccess={() => checkSession()} />;
  }

  // Helper to force session refresh on login success
  async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-50 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar currentTab={currentTab} onChangeTab={setCurrentTab} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        <Topbar email={session.user.email ?? 'admin@pinjamkuy.com'} currentTab={currentTab} />
        
        <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">
          {currentTab === 'overview' && <Overview />}
          {currentTab === 'catalog' && <Catalog />}
          {currentTab === 'logs' && <Logs />}
        </main>
      </div>
    </div>
  );
}

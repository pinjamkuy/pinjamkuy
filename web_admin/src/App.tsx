import { useState, useEffect } from 'react';
import { createClient, Session } from '@supabase/supabase-js';
import Login from './components/Login';
import ResetPassword from './components/ResetPassword';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Overview from './components/Overview';
import Catalog from './components/Catalog';
import Logs from './components/Logs';

// ─── Supabase Configuration ───────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

type TabType = 'overview' | 'catalog' | 'logs';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<TabType>('overview');

  // Theme state: defaults to light to match user preference for a bright setup
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'light'; // Clean light theme by default
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const checkIfResetMode = () => {
    return window.location.hash.includes('recovery') || 
           window.location.hash.includes('type=recovery') || 
           window.location.search.includes('type=recovery') ||
           window.location.search.includes('mode=reset') ||
           window.location.href.includes('recovery') ||
           window.location.href.includes('reset');
  };

  const [isResetMode, setIsResetMode] = useState(() => checkIfResetMode());

  const validateSession = (currentSession: Session | null) => {
    if (checkIfResetMode()) return currentSession;
    if (currentSession && currentSession.user.email !== 'pinj4mkuy@gmail.com') {
      supabase.auth.signOut();
      alert('Akses Ditolak: Surel Anda tidak terdaftar sebagai Administrator.');
      return null;
    }
    return currentSession;
  };

  useEffect(() => {
    // 1. Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(validateSession(session));
      setLoading(false);
    });

    // 2. Auth State Changed Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      let resetActive = checkIfResetMode() || event === 'PASSWORD_RECOVERY';
      if (event === 'PASSWORD_RECOVERY') {
        setIsResetMode(true);
      }
      if (event === 'SIGNED_OUT') {
        setIsResetMode(false);
        resetActive = false;
      }
      
      if (resetActive) {
        setSession(session);
      } else {
        setSession(validateSession(session));
      }
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

  // If PASSWORD_RECOVERY event or recovery type hash is present, render password reset UI
  if (isResetMode || checkIfResetMode()) {
    return <ResetPassword />;
  }

  // If not authenticated, render Login
  if (!session) {
    return <Login onLoginSuccess={() => checkSession()} />;
  }

  // Helper to force session refresh on login success
  async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(validateSession(session));
  }

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-50 font-sans transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar currentTab={currentTab} onChangeTab={setCurrentTab} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        <Topbar 
          email={session.user.email ?? 'pinj4mkuy@gmail.com'} 
          currentTab={currentTab} 
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">
          {currentTab === 'overview' && <Overview />}
          {currentTab === 'catalog' && <Catalog />}
          {currentTab === 'logs' && <Logs />}
        </main>
      </div>
    </div>
  );
}

import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Github, Chrome, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { GeometricBackground } from '../components/ui/geometric-background';
import { supabase, isSupabaseConfigured, clearSupabaseOverrides } from '../lib/supabase';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<React.ReactNode | null>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const cursorX = useSpring(mouseX, { stiffness: 800, damping: 40 });
  const cursorY = useSpring(mouseY, { stiffness: 800, damping: 40 });
  const [isHovering, setIsHovering] = React.useState(false);

  // Center the cursor follower (w-48 = 192px, so offset by 96px)
  const centeredX = useTransform(cursorX, (val) => val - 96);
  const centeredY = useTransform(cursorY, (val) => val - 96);

  const [diagnosticResult, setDiagnosticResult] = React.useState<string | null>(null);
  const [isDiagnosing, setIsDiagnosing] = React.useState(false);

  const runDiagnostic = async () => {
    setIsDiagnosing(true);
    setDiagnosticResult(null);
    try {
      const start = Date.now();
      
      // Test 1: Auth Service
      const { error: authError } = await supabase.auth.getSession();
      const authDuration = Date.now() - start;
      
      if (authError) {
        setDiagnosticResult(`❌ Auth API Error: ${authError.message}`);
        return;
      }

      // Test 2: Database Service (Simple query)
      const dbStart = Date.now();
      const { error: dbError } = await supabase.from('profiles').select('count', { count: 'exact', head: true }).limit(1);
      const dbDuration = Date.now() - dbStart;

      if (dbError) {
        setDiagnosticResult(`✅ Auth OK (${authDuration}ms) | ❌ DB Error: ${dbError.message}. Your database might still be locked.`);
      } else {
        setDiagnosticResult(`✅ All Systems OK. Auth: ${authDuration}ms, DB: ${dbDuration}ms. Connection is healthy.`);
      }
    } catch (err: any) {
      setDiagnosticResult(`❌ Network Error: ${err.message}. Your browser cannot reach Supabase.`);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSupabaseConfigured) {
      setError(
        <div className="flex flex-col gap-2">
          <span>Supabase is not connected.</span>
          <Link to="/settings?tab=connection" className="text-primary hover:underline font-bold flex items-center gap-1">
            Go to Connection Settings <ArrowRight size={14} />
          </Link>
        </div>
      );
      return;
    }

    setLoading(true);
    setError(null);
    console.log('Attempting login for:', email);

    try {
      // Add a timeout to the login process
      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timed out. Your database might be locked by a previous SQL query.')), 60000)
      );

      console.log('Waiting for Supabase response...');
      const result = await Promise.race([loginPromise, timeoutPromise]) as any;
      console.log('Supabase response received:', result);

      if (result.error) throw result.error;
      
      console.log('Login successful, navigating to dashboard...');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message.includes('timed out') || err.message === 'Failed to fetch') {
        setError(
          <div className="flex flex-col gap-3">
            <span className="text-red-500 font-medium">
              {err.message.includes('timed out') ? 'Login timed out.' : 'Connection failed.'} 
              The Supabase server is not responding.
            </span>
            <div className="flex flex-col gap-2">
              <button 
                onClick={runDiagnostic}
                disabled={isDiagnosing}
                className="text-primary hover:underline font-bold flex items-center gap-1 text-left disabled:opacity-50"
              >
                {isDiagnosing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} 
                Run Connection Diagnostic
              </button>
              {diagnosticResult && (
                <div className="p-2 bg-surface-alt rounded text-[10px] font-mono border border-border/50">
                  {diagnosticResult}
                </div>
              )}
              <button 
                onClick={() => clearSupabaseOverrides()}
                className="text-primary hover:underline font-bold flex items-center gap-1 text-left"
              >
                <RefreshCw size={14} /> Reset Connection to Defaults
              </button>
              <button 
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.reload();
                }}
                className="text-primary hover:underline font-bold flex items-center gap-1 text-left"
              >
                <Lock size={14} /> Force Sign Out (Clear Session)
              </button>
              <Link to="/settings?tab=connection" className="text-primary hover:underline font-bold flex items-center gap-1">
                <ArrowRight size={14} /> Manually Check Settings
              </Link>
            </div>
            <p className="text-[10px] text-text-muted mt-1">
              Tip: If you just ran a heavy SQL query, your database might be temporarily busy.
            </p>
          </div>
        );
      } else {
        setError(err.message || 'Failed to log in');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    if (!isSupabaseConfigured) {
      setError('Supabase is not connected. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.');
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + '/dashboard',
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || `Failed to log in with ${provider}`);
    }
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      const target = e.target as HTMLElement;
      const isInteractive = target.closest('button, a, .btn-primary, .btn-secondary, .btn-accent, .btn-outline');
      setIsHovering(!!isInteractive);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Blurred Light Cursor Follower */}
      <motion.div
        className="fixed top-0 left-0 w-48 h-48 bg-primary/10 rounded-full pointer-events-none z-[100] blur-[60px]"
        animate={{
          scale: isHovering ? 1.4 : 1,
          opacity: isHovering ? 0.4 : 0.2,
        }}
        style={{
          x: centeredX,
          y: centeredY,
        }}
      />
      <motion.div
        className="fixed top-0 left-0 w-24 h-24 bg-primary/20 rounded-full pointer-events-none z-[100] blur-[30px]"
        animate={{
          scale: isHovering ? 1.2 : 1,
          opacity: isHovering ? 0.5 : 0.1,
        }}
        style={{
          x: useTransform(cursorX, (val) => val - 48),
          y: useTransform(cursorY, (val) => val - 48),
        }}
      />

      {/* Moving Background */}
      <GeometricBackground className="z-0" />
      <Link 
        to="/" 
        className="absolute top-8 left-8 p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white hover:bg-primary hover:border-primary transition-all shadow-xl group"
        title="Back to Home"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <span className="text-xl font-bold text-primary">Aether Study</span>
          </Link>
          <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tighter">Welcome Back</h1>
          <p className="text-primary font-medium">Log in to continue your study journey.</p>
        </div>

        <div className="glass-card p-8 bg-slate-950/40 backdrop-blur-2xl border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <Mail size={16} /> Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <Lock size={16} /> Password
                </label>
                <Link to="/reset-password" title="Reset Password" className="text-xs text-primary font-bold hover:underline">Forgot?</Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-4">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <>Log In <ArrowRight size={18} /></>}
              </button>
              
              {loading && (
                <button 
                  type="button"
                  onClick={() => setLoading(false)}
                  className="w-full py-2 text-xs font-bold text-slate-500 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-grow h-px bg-white/10"></div>
            <span className="text-sm text-slate-500 font-medium whitespace-nowrap">Or continue with</span>
            <div className="flex-grow h-px bg-white/10"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleSocialLogin('google')}
              className="flex items-center justify-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors"
            >
              <Chrome size={20} /> <span className="text-sm font-bold">Google</span>
            </button>
            <button 
              onClick={() => handleSocialLogin('github')}
              className="flex items-center justify-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors"
            >
              <Github size={20} /> <span className="text-sm font-bold">GitHub</span>
            </button>
          </div>
        </div>

        <p className="text-center mt-8 text-sm text-slate-400">
          Don't have an account? <Link to="/signup" className="text-primary font-bold hover:underline">Sign up for free</Link>
        </p>
      </motion.div>
    </div>
  );
}

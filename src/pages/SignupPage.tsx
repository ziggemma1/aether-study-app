import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Github, Chrome, ArrowLeft } from 'lucide-react';
import { GeometricBackground } from '../components/ui/geometric-background';

export default function SignupPage() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const cursorX = useSpring(mouseX, { stiffness: 800, damping: 40 });
  const cursorY = useSpring(mouseY, { stiffness: 800, damping: 40 });
  const [isHovering, setIsHovering] = React.useState(false);

  // Center the cursor follower (w-48 = 192px, so offset by 96px)
  const centeredX = useTransform(cursorX, (val) => val - 96);
  const centeredY = useTransform(cursorY, (val) => val - 96);

  React.useEffect(() => {
    console.log("SignupPage Loaded - Version 3");
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
          <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tighter">Create Account</h1>
          <p className="text-primary font-medium">Join thousands of students studying smarter.</p>
        </div>

        <div className="glass-card p-8 bg-slate-950/40 backdrop-blur-2xl border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <User size={16} /> Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <Mail size={16} /> Email Address
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <Lock size={16} /> Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
            <div className="pt-4">
              <Link to="/dashboard" className="w-full btn-primary flex items-center justify-center gap-2">
                Create Account <ArrowRight size={18} />
              </Link>
            </div>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-grow h-px bg-white/10"></div>
            <span className="text-sm text-slate-500 font-medium whitespace-nowrap">Or sign up with</span>
            <div className="flex-grow h-px bg-white/10"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors">
              <Chrome size={20} /> <span className="text-sm font-bold">Google</span>
            </button>
            <button className="flex items-center justify-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors">
              <Github size={20} /> <span className="text-sm font-bold">GitHub</span>
            </button>
          </div>
        </div>

        <p className="text-center mt-8 text-sm text-slate-400">
          Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
}

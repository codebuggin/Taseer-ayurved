import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    navigate('/');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-theme-bg-secondary flex items-center justify-center py-24 px-6 relative overflow-hidden"
    >
      {/* Decorative background circle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-theme-bg-primary rounded-full blur-3xl opacity-50 z-0 pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-[24px] p-8 md:p-10 shadow-xl border border-theme relative z-10">
        
        <div className="text-center mb-8">
          <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
            <span className="font-heading font-bold text-2xl text-theme-text-primary tracking-tight block">Taseer Ayurved</span>
          </Link>
          <h1 className="font-heading italic text-[32px] text-theme-text-primary mt-6 mb-2">Welcome Back</h1>
          <p className="font-body text-[14px] text-theme-text-muted">Sign in to access your formulation history and consultations.</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl font-body text-[14px]">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] text-theme-text-muted uppercase tracking-wider">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 border border-theme rounded-xl px-4 font-body outline-none focus:border-theme-bg-deep focus:ring-1 focus:ring-theme-bg-deep transition-all bg-theme-bg-secondary" 
              placeholder="you@email.com" 
              required
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="font-mono text-[11px] text-theme-text-muted uppercase tracking-wider">Password</label>
              <Link to="#" className="font-body text-[12px] text-theme-accent hover:underline">Forgot Password?</Link>
            </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 border border-theme rounded-xl px-4 font-body outline-none focus:border-theme-bg-deep focus:ring-1 focus:ring-theme-bg-deep transition-all bg-theme-bg-secondary" 
              placeholder="••••••••" 
              required
            />
          </div>

          <button disabled={loading} type="submit" className="w-full bg-theme-bg-deep text-white font-body font-medium px-6 py-4 rounded-xl mt-4 hover:shadow-lg hover:bg-theme-bg-deep/90 transition-all magnetic-btn disabled:opacity-70 flex justify-center items-center">
            {loading ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> : "Sign In"}
          </button>
        </form>

        <div className="mt-8 flex items-center gap-4">
          <div className="flex-1 h-px bg-theme" />
          <span className="font-mono text-[11px] text-theme-text-muted uppercase tracking-wider">OR</span>
          <div className="flex-1 h-px bg-theme" />
        </div>

        <div className="mt-8 text-center">
          <span className="font-body text-[14px] text-theme-text-muted">New to Taseer Ayurved? </span>
          <Link to="/register" className="font-body text-[14px] font-medium text-theme-bg-deep hover:text-theme-accent transition-colors">Create an account</Link>
        </div>

      </div>
    </motion.div>
  );
}

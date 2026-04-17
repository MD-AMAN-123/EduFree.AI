import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, ArrowRight, Loader2, BrainCircuit, Sparkles, ShieldCheck, Zap, Star, Globe, GraduationCap, Sun, Moon } from 'lucide-react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';

interface AuthPageProps {
  onLogin: (user: User) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, isDarkMode, toggleDarkMode }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!supabase) {
        throw new Error("Database connection is not configured. Please use 'Continue as Guest' or check your environment variables.");
      }

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        if (data.user) {
          const user: User = {
            id: data.user.id,
            name: data.user.user_metadata.full_name || data.user.email?.split('@')[0] || 'Student',
            email: data.user.email || '',
            avatar: `https://ui-avatars.com/api/?name=${data.user.email}&background=6366f1&color=fff`
          };
          onLogin(user);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
            }
          }
        });

        if (error) throw error;

        if (data.user) {
          const user: User = {
            id: data.user.id,
            name: formData.name || data.user.email?.split('@')[0] || 'Student',
            email: data.user.email || '',
            avatar: `https://ui-avatars.com/api/?name=${formData.name}&background=6366f1&color=fff`
          };
          onLogin(user);
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error.message);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    const guestUser: User = {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Test Student',
      email: 'test@edufree.ai',
      avatar: 'https://ui-avatars.com/api/?name=Test+Student&background=6366f1&color=fff'
    };
    onLogin(guestUser);
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Top Right Actions */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
        <button 
          onClick={toggleDarkMode}
          className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-white hover:bg-white/20 transition-all shadow-xl"
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Subtle Blobs (Blending with Map) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-25%] left-[-15%] w-[80%] h-[80%] rounded-full bg-indigo-600/20 blur-[150px] animate-[pulse_8s_infinite]"></div>
        <div className="absolute bottom-[-25%] right-[-15%] w-[80%] h-[80%] rounded-full bg-purple-600/20 blur-[150px] animate-[pulse_8s_infinite]" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] left-[20%] w-[30%] h-[30%] rounded-full bg-blue-500/10 blur-[100px] animate-bounce duration-[10s]"></div>
      </div>

      <div className="max-w-6xl w-full grid md:grid-cols-2 bg-slate-900/40 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.7)] overflow-hidden relative z-10 scale-in-center">
        
        {/* Left Side: immersive Brand Experience */}
        <div className="hidden md:flex flex-col items-center justify-center p-20 bg-gradient-to-br from-indigo-600 to-indigo-900 relative group">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
          
          <div className="relative z-10 text-center">
            {/* Floating Icons Decor */}
            <div className="absolute -top-12 -left-12 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 rotate-12 animate-float">
               <GraduationCap className="text-indigo-200" size={32} />
            </div>
            <div className="absolute -bottom-12 -right-12 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 -rotate-12 animate-float-delayed">
               <Globe className="text-indigo-200" size={32} />
            </div>

            <div className="inline-flex p-8 bg-white/10 backdrop-blur-2xl rounded-[2.5rem] border border-white/20 mb-8 shadow-2xl transform group-hover:scale-110 transition-transform duration-700">
              <BrainCircuit size={80} className="text-white animate-pulse" />
            </div>
            
            <h1 className="text-6xl font-black text-white mb-6 tracking-tighter drop-shadow-2xl">
              EduFree<span className="text-indigo-300">.AI</span>
            </h1>
            <p className="text-indigo-100 text-xl font-bold leading-relaxed max-w-sm mx-auto opacity-80 mb-12">
              The world's first AI-powered learning ecosystem optimized for speed and accessibility.
            </p>
            
            <div className="grid grid-cols-1 gap-4 text-left">
               {[
                 { icon: Zap, text: "Ultra-Fast Reasoning", sub: "Latency optimized models" },
                 { icon: ShieldCheck, text: "Private & Secure", sub: "Zero-knowledge encryption" },
                 { icon: Star, text: "Premium Content", sub: "Curated by top educators" }
               ].map((item, idx) => (
                 <div key={idx} className="flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all cursor-default group/item">
                   <div className="p-3 bg-white/10 rounded-2xl text-indigo-300 group-hover/item:scale-110 transition-transform">
                      <item.icon size={22} />
                   </div>
                   <div>
                      <p className="text-white font-bold text-sm tracking-wide">{item.text}</p>
                      <p className="text-indigo-200/50 text-[10px] font-bold uppercase tracking-widest">{item.sub}</p>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Right Side: High-End Auth Form */}
        <div className="p-12 md:p-20 flex flex-col justify-center relative">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-black text-white mb-2 italic">
                {isLogin ? 'Hello Again!' : 'Join the Elite'}
              </h2>
              <div className="h-1.5 w-12 bg-indigo-600 rounded-full"></div>
            </div>
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="px-6 py-2 rounded-full border border-indigo-500/30 text-xs font-black uppercase tracking-widest text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all active:scale-95"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {!isLogin && (
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Identity</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <UserIcon size={20} className="text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    required 
                    placeholder="Full Name"
                    className="w-full pl-14 pr-6 py-5 bg-slate-800/40 border border-white/5 rounded-3xl focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all text-white placeholder:text-slate-700 font-bold"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Email Terminal</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Mail size={20} className="text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input 
                  type="email" 
                  required 
                  placeholder="name@example.com"
                  className="w-full pl-14 pr-6 py-5 bg-slate-800/40 border border-white/5 rounded-3xl focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all text-white placeholder:text-slate-700 font-bold"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Secure Vault</label>
                 <button type="button" className="text-[10px] font-bold text-indigo-500 hover:underline">RECOVER</button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Lock size={20} className="text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••"
                  className="w-full pl-14 pr-6 py-5 bg-slate-800/40 border border-white/5 rounded-3xl focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all text-white placeholder:text-slate-700 font-bold"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <div className="pt-4 space-y-4">
               <button
                type="submit"
                disabled={isLoading}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-[2rem] shadow-2xl shadow-indigo-900/50 transition-all flex items-center justify-center gap-4 group active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 size={24} className="animate-spin" /> : (
                  <>
                    <span className="tracking-widest uppercase text-sm">{isLogin ? 'Initialize Session' : 'Create Credentials'}</span>
                    <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleGuestLogin}
                className="w-full py-5 bg-transparent border-2 border-slate-800 text-slate-400 font-black rounded-[2rem] hover:bg-slate-800 hover:text-white transition-all text-xs tracking-[0.2em] uppercase"
              >
                Continue as Guest
              </button>
            </div>
          </form>

          <div className="mt-16 text-center">
             <div className="flex items-center gap-4 mb-6">
                <div className="h-px bg-slate-800 flex-1"></div>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Verified Secure</span>
                <div className="h-px bg-slate-800 flex-1"></div>
             </div>
             <p className="text-[10px] text-slate-600 font-bold leading-relaxed px-10">
               By accessing this portal, you acknowledge our global security protocols and privacy standards.
             </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(12deg); }
          50% { transform: translateY(-20px) rotate(15deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0) rotate(-12deg); }
          50% { transform: translateY(-20px) rotate(-15deg); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 6s ease-in-out infinite; animation-delay: 2s; }
        .scale-in-center { animation: scale-in-center 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both; }
        @keyframes scale-in-center {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default AuthPage;
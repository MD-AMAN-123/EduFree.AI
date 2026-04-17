import React, { useState, useEffect } from 'react';
import { BookOpen, BarChart2, MessageCircle, PenTool, Layout, Leaf, Menu, X, Map, GraduationCap, LogOut, Moon, Sun, Camera, Activity, Trophy } from 'lucide-react';
import { AppView, User, Language } from '../types';
import { getLabel, persistLanguage, loadLanguage } from '../services/i18nService';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  user: User;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isMobileMenuOpen, setIsMobileMenuOpen, user, onLogout, onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user.name);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [uiLanguage, setUiLanguage] = useState<Language>(loadLanguage());

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const t = (key: Parameters<typeof getLabel>[0]) => getLabel(key, uiLanguage);

  const handleLanguageToggle = () => {
    const next = uiLanguage === Language.ENGLISH ? Language.HINDI : Language.ENGLISH;
    setUiLanguage(next);
    persistLanguage(next);
  };

  const navItems = [
    { id: AppView.DASHBOARD,        label: t('dashboard'),        icon: Layout },
    { id: AppView.LEARNING_PATH,    label: t('learningPath'),     icon: Map },
    { id: AppView.CONCEPT_COACH,    label: t('conceptCoach'),     icon: MessageCircle },
    { id: AppView.DOUBT_SOLVER,     label: t('doubtSolver'),      icon: Camera },
    { id: AppView.EXAM_ARENA,       label: t('examArena'),        icon: PenTool },
    { id: AppView.LEADERBOARD,      label: t('leaderboard'),      icon: Trophy },
    { id: AppView.SMART_ANALYTICS,  label: t('smartAnalytics'),   icon: Activity },
    { id: AppView.CREATOR_STUDIO,   label: t('creatorStudio'),    icon: BookOpen },
    { id: AppView.TEACHER_DASHBOARD,label: t('teacherDashboard'), icon: GraduationCap },
    { id: AppView.ECO_TRACKER,      label: 'Eco Impact',          icon: Leaf },
  ];

  const handleSave = async () => {
    if (newName.trim()) {
      const updated = await (await import('../services/authService')).updateProfile(user.id, { name: newName.trim() });
      onUpdateUser(updated ?? { ...user, name: newName.trim() });
    }
    setIsEditing(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b dark:border-slate-800 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
           <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">EduFree<span className="text-orange-500">.AI</span></span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 glass border-r dark:border-slate-800 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:h-screen flex flex-col
      `}>
        <div className="flex flex-col h-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl">
          <div className="h-20 flex items-center px-6 border-b dark:border-slate-800 hidden md:flex shrink-0">
             <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Edu<span className="text-indigo-600">Free</span><span className="text-indigo-400">.AI</span>
             </span>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto mt-16 md:mt-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onChangeView(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all duration-200
                    ${isActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 scale-[1.02]' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}
                  `}
                >
                  <Icon size={18} strokeWidth={isActive ? 3 : 2} />
                  {item.label}
                </button>
              );
            })}
            {/* Exam Streak Card (Parity with Educlarity) */}
            <div className="mx-2 mt-6 p-4 premium-gradient rounded-3xl text-white shadow-lg overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-2 opacity-20 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform">
                <Activity size={80} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Current Streak</p>
              <div className="flex items-center gap-2 mb-3">
                <Flame className="text-orange-400 fill-orange-400" size={24} />
                <span className="text-2xl font-black italic">14 DAYS</span>
              </div>
              <div className="relative h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-white rounded-full transition-all duration-1000" style={{ width: '70%' }}></div>
              </div>
              <p className="text-[10px] mt-2 font-bold opacity-90">3 days to next reward! 🎁</p>
            </div>
          </nav>
          
          <div className="p-4 border-t dark:border-slate-800 space-y-4">
            {/* User Profile */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 border dark:border-slate-700 shadow-sm">
              <div className="relative">
                <img 
                  src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=4f46e5&color=fff`} 
                  alt={user.name}
                  className="w-10 h-10 rounded-xl"
                />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate tracking-tight">{user.email}</p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleLanguageToggle}
                className="flex items-center justify-center gap-1 p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-bold"
                title="Toggle Language"
              >
                {uiLanguage === Language.ENGLISH ? 'EN' : 'HI'}
              </button>
               <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="flex items-center justify-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Toggle Theme"
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button 
                onClick={onLogout}
                className="flex items-center justify-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
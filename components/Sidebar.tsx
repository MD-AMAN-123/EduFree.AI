import React, { useState, useEffect } from 'react';
import { BookOpen, BarChart2, MessageCircle, PenTool, Layout, Leaf, Menu, X, Map, GraduationCap, LogOut, Moon, Sun, Camera, Activity, Trophy, FileText, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isMobileMenuOpen, setIsMobileMenuOpen, user, onLogout, onUpdateUser, isDarkMode, toggleDarkMode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user.name);
  const [uiLanguage, setUiLanguage] = useState<Language>(loadLanguage());

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
    { id: AppView.ASSIGNMENT_GENERATOR, label: 'Assignments',     icon: FileText },
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
            onClick={toggleDarkMode}
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
      <AnimatePresence>
        {(isMobileMenuOpen || !window.matchMedia('(max-width: 768px)').matches) && (
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed md:sticky top-0 inset-y-0 left-0 z-40 w-64 glass border-r dark:border-slate-800 flex flex-col h-screen"
          >
            <div className="flex flex-col h-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl">
              <div className="h-20 flex items-center px-6 border-b dark:border-slate-800 hidden md:flex shrink-0">
                 <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Edu<span className="text-indigo-600">Free</span><span className="text-indigo-400">.AI</span>
                 </span>
              </div>

              <nav className="flex-1 p-4 space-y-2 overflow-y-auto mt-16 md:mt-4">
                {navItems.map((item, idx) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + idx * 0.03 }}
                      onClick={() => {
                        onChangeView(item.id);
                        if (window.matchMedia('(max-width: 768px)').matches) setIsMobileMenuOpen(false);
                      }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all duration-200
                        ${isActive 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 scale-[1.02]' 
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}
                      `}
                    >
                      <Icon size={18} strokeWidth={isActive ? 3 : 2} />
                      {item.label}
                    </motion.button>
                  );
                })}
              </nav>
              
              <div className="p-4 border-t dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 border dark:border-slate-700 shadow-sm">
                  <div className="relative">
                    <img src={user.avatar} alt="" className="w-10 h-10 rounded-xl" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate tracking-tight">{user.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
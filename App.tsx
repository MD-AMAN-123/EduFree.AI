import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import ConceptCoach from "./components/ConceptCoach";
import DoubtSolver from "./components/DoubtSolver";
import SmartAnalytics from "./components/SmartAnalytics";
import LearningPath from "./components/LearningPath";
import TeacherDashboard from "./components/TeacherDashboard";
import CreatorStudio from "./components/CreatorStudio";
import AuthPage from "./components/AuthPage";
import Leaderboard from "./components/Leaderboard";
import AssignmentGenerator from "./components/AssignmentGenerator";
import OfflineBanner from "./components/OfflineBanner";
import { AppView, User, DashboardStats } from "./types";
import { generateDashboardInsights } from "./services/geminiService";
import {
  Home,
  Layout,
  MessageSquare,
  Settings,
  LogOut,
  BookOpen,
  Zap,
  Globe,
  Search,
  Menu,
  X,
  Sun,
  Moon,
  Trophy,
  Activity,
  GraduationCap,
  BrainCircuit,
  Camera,
  FileText
} from 'lucide-react';
import { SpaceBackground } from "./components/SpaceBackground";

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    topicsMastered: 12,
    studyHours: 45,
    avgScore: 88,
    weakAreas: 3,
    streak: 14,
    xp: 2450,
    dailyGoals: [
      { id: "1", title: "Complete Physics Quiz", completed: true, xp: 100 },
      { id: "2", title: "Review Chemistry Notes", completed: false, xp: 50 },
      { id: "3", title: "Practice Math Problems", completed: false, xp: 150 },
    ],
    weeklyActivity: [
      { day: "Mon", hours: 4 },
      { day: "Tue", hours: 6 },
      { day: "Wed", hours: 3 },
      { day: "Thu", hours: 7 },
      { day: "Fri", hours: 5 },
      { day: "Sat", hours: 8 },
      { day: "Sun", hours: 4 },
    ],
    syllabusProgress: [
      { name: "Physics", value: 75, color: "#4f46e5" },
      { name: "Chemistry", value: 60, color: "#7c3aed" },
      { name: "Math", value: 90, color: "#10b981" },
      { name: "Biology", value: 45, color: "#f59e0b" },
    ],
    aiInsights: [],
  });

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const insights = await generateDashboardInsights(user?.name || "Student", stats);
        if (insights && insights.length > 0) {
          setStats((prev) => ({ ...prev, aiInsights: insights }));
        }
      } catch (error) {
        console.error("Failed to fetch AI insights:", error);
      }
    };

    if (user) {
      fetchInsights();
    }
  }, [user]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard user={user!} stats={stats} onNavigate={setCurrentView} />;
      case AppView.CONCEPT_COACH:
        return <ConceptCoach />;
      case AppView.DOUBT_SOLVER:
        return <DoubtSolver />;
      case AppView.SMART_ANALYTICS:
        return <SmartAnalytics stats={stats} />;
      case AppView.LEARNING_PATH:
        return <LearningPath onNavigate={setCurrentView} studentId={user?.id} />;
      case AppView.TEACHER_DASHBOARD:
        return <TeacherDashboard user={user} />;
      case AppView.CREATOR_STUDIO:
        return <CreatorStudio />;
      case AppView.LEADERBOARD:
        return <Leaderboard currentUserId={user?.id} />;
      case AppView.ASSIGNMENT_GENERATOR:
        return <AssignmentGenerator />;
      default:
        return <Dashboard user={user!} stats={stats} onNavigate={setCurrentView} />;
    }
  };

  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <div className={isDarkMode ? "dark" : ""}>
      {/* Absolute Root Viewport Lock */}
      <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-500 overscroll-none touch-none">
        <SpaceBackground isDarkMode={isDarkMode} />
        
        {/* Sidebar - Direct Parent for Mobile/Desktop Overlay */}
        <Sidebar
          currentView={currentView}
          onChangeView={setCurrentView}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          user={user}
          onLogout={handleLogout}
          onUpdateUser={setUser}
          isDarkMode={isDarkMode}
          toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />

        {/* Dynamic App Shell */}
        <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
          
          {/* TOP BAR - GUARANTEED IMMOVABLE */}
          <header className="md:hidden shrink-0 h-16 bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-5 relative z-[60] shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <BrainCircuit className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-slate-800 dark:text-white text-lg tracking-tight">
                EduFree<span className="text-indigo-600">.AI</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all active:scale-95"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95"
              >
                <Menu size={24} />
              </button>
            </div>
          </header>

            <div className={`${(currentView === AppView.CONCEPT_COACH || currentView === AppView.DOUBT_SOLVER) ? '' : 'pb-32 md:pb-8'}`}>
              <div className={`${(currentView === AppView.CONCEPT_COACH || currentView === AppView.DOUBT_SOLVER) ? 'p-0' : 'p-4 md:p-8'} max-w-7xl mx-auto w-full box-border`}>
                <OfflineBanner />
                {renderView()}
              </div>
            </div>
          </main>

          {/* BOTTOM BAR - GUARANTEED IMMOVABLE */}
          <nav className="md:hidden shrink-0 h-20 bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 flex items-center justify-around px-2 relative z-[60] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pb-4">
            {[
              { id: AppView.DASHBOARD, icon: Home, label: 'Home' },
              { id: AppView.CONCEPT_COACH, icon: MessageSquare, label: 'Coach' },
              { id: AppView.DOUBT_SOLVER, icon: Camera, label: 'Ask' },
              { id: AppView.LEADERBOARD, icon: Trophy, label: 'Ranking' },
              { id: AppView.ASSIGNMENT_GENERATOR, icon: FileText, label: 'Tasks' },
            ].map((item) => {
              const isActive = currentView === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className="relative flex flex-col items-center justify-center p-2 group transition-all duration-300"
                >
                  {isActive && (
                    <span className="absolute inset-x-0 inset-y-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl transition-all scale-110" />
                  )}
                  <Icon 
                    size={22} 
                    className={`relative z-10 transition-transform duration-300 ${isActive ? 'text-indigo-600 dark:text-indigo-400 scale-110' : 'text-slate-500 dark:text-slate-400'}`} 
                  />
                  <span className={`relative z-10 text-[9px] font-bold mt-1.5 transition-colors uppercase tracking-widest ${isActive ? 'text-indigo-600 dark:text-indigo-400 opacity-100' : 'text-slate-500 dark:text-slate-400 opacity-70'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default App;
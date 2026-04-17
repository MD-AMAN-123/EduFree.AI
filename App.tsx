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
  BrainCircuit,
  Camera,
  PenTool
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
      <div className="flex bg-slate-50 dark:bg-transparent font-sans min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-500 relative overflow-hidden">
        <SpaceBackground isDarkMode={isDarkMode} />
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

        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b dark:border-slate-800 sticky top-0 z-30 w-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BrainCircuit className="text-white w-5 h-5" />
            </div>
            <span className="font-bold dark:text-white">EduFree.AI</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} className="text-slate-600 dark:text-slate-400" /> : <Menu className="text-slate-600 dark:text-slate-400" size={24} />}
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto overflow-x-hidden relative h-screen w-full">
          <div className="p-4 md:p-8 max-w-full mx-auto pb-32 md:pb-8">
            <OfflineBanner />
            {renderView()}
          </div>

          {/* Floating Background Decorations (Parity with Educlarity) */}
          <div className="fixed top-0 right-0 -z-10 w-[500px] h-[500px] opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-full h-full bg-indigo-500 rounded-full blur-[120px] -mr-64 -mt-64"></div>
          </div>
        </main>

        {/* Premium Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t dark:border-slate-800 z-50 px-6 flex items-center justify-between pb-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
          {[
            { active: currentView === AppView.DASHBOARD, icon: Home, label: 'Home', view: AppView.DASHBOARD },
            { active: currentView === AppView.LEARNING_PATH, icon: Layout, label: 'Path', view: AppView.LEARNING_PATH },
            { active: currentView === AppView.CONCEPT_COACH, icon: MessageSquare, label: 'Coach', view: AppView.CONCEPT_COACH },
            { active: currentView === AppView.DOUBT_SOLVER, icon: Camera, label: 'Ask', view: AppView.DOUBT_SOLVER },
            { active: currentView === AppView.ASSIGNMENT_GENERATOR, icon: Zap, label: 'Exam', view: AppView.ASSIGNMENT_GENERATOR },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => setCurrentView(item.view)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all ${item.active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                }`}
            >
              <item.icon size={20} className={item.active ? 'scale-110' : ''} />
              <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default App;
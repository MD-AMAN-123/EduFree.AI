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
import { Layout, MessageCircle, Camera, PenTool, Menu } from "lucide-react";
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

        <main className="flex-1 overflow-y-auto relative h-screen">
          <div className="p-4 md:p-8 max-w-7xl mx-auto pb-32 md:pb-8">
            <OfflineBanner />
            {renderView()}
          </div>

          {/* Floating Background Decorations (Parity with Educlarity) */}
          <div className="fixed top-0 right-0 -z-10 w-[500px] h-[500px] opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-full h-full bg-indigo-500 rounded-full blur-[120px] -mr-64 -mt-64"></div>
          </div>
        </main>

        {/* Premium Mobile Bottom Navigation (Fixing Syntax Error) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t dark:border-slate-800 z-50 px-6 flex items-center justify-between pb-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
          {[
            { id: AppView.DASHBOARD, icon: Layout, label: 'Home' },
            { id: AppView.CONCEPT_COACH, icon: MessageCircle, label: 'Coach' },
            { id: AppView.DOUBT_SOLVER, icon: Camera, label: 'Solver' },
            { id: AppView.EXAM_ARENA, icon: PenTool, label: 'Exams' },
            { id: 'more', icon: Menu, label: 'More' },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            const isMore = item.id === 'more';

            return (
              <button
                key={item.id}
                onClick={() => isMore ? setIsMobileMenuOpen(true) : setCurrentView(item.id as AppView)}
                className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-indigo-600 dark:text-indigo-400 scale-110' : 'text-slate-400 dark:text-slate-500'
                  }`}
              >
                <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
                {isActive && <div className="w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full"></div>}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default App;
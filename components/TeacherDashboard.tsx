import React, { useState, useEffect, useRef } from 'react';
import { GraduationCap, Users, AlertCircle, TrendingUp, Loader2, Send, Radio, CheckCircle, BarChart3, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { User, StudentActivity, ClassAnalytics as ClassAnalyticsType } from '../types';
import {
  subscribeToStudentActivity,
  fetchStudentActivity,
  fetchClassAnalytics,
  broadcastToClass,
} from '../services/realtimeService';
import { supabase } from '../services/supabaseClient';
import { generateTeacherInsights } from '../services/geminiService';

interface TeacherDashboardProps {
  user?: User | null;
}

// ── Status badge ─────────────────────────────────────────────
const StatusBadge: React.FC<{ status: StudentActivity['status'] }> = ({ status }) => {
  const styles = {
    'At Risk':   'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    'Stable':    'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
    'Excelling': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles[status]}`}>{status}</span>
  );
};

// ── BroadcastPanel ───────────────────────────────────────────
const BroadcastPanel: React.FC<{ teacherId: string }> = ({ teacherId }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    await broadcastToClass(teacherId, message);
    setSending(false);
    setSent(true);
    setMessage('');
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Radio className="text-indigo-500" size={18} />
        <h3 className="font-bold text-slate-800 dark:text-slate-100">Broadcast to Class</h3>
      </div>
      <div className="flex gap-3">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Send a message to all active students..."
          className="flex-1 border dark:border-slate-700 rounded-xl px-4 py-2.5 bg-slate-50 dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
        <button
          onClick={handleSend}
          disabled={sending || !message.trim()}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : sent ? <CheckCircle size={16} /> : <Send size={16} />}
          {sent ? 'Sent!' : 'Send'}
        </button>
      </div>
    </div>
  );
};

// ── ClassAnalytics ───────────────────────────────────────────
const ClassAnalyticsPanel: React.FC = () => {
  const [analytics, setAnalytics] = useState<ClassAnalyticsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClassAnalytics().then(data => { setAnalytics(data); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin text-indigo-500" size={24} /></div>;
  if (!analytics) return null;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border dark:border-slate-700 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="text-purple-500" size={18} />
        <h3 className="font-bold text-slate-800 dark:text-slate-100">Class Analytics</h3>
        <span className="ml-auto text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
          {analytics.engagementRate}% engaged
        </span>
      </div>

      {analytics.avgScorePerTopic.length > 0 ? (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.avgScorePerTopic}>
              <XAxis dataKey="topic" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: 12 }} />
              <Bar dataKey="avgScore" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-slate-400 text-sm text-center py-4">No quiz data yet.</p>
      )}

      {analytics.mostCommonWeakAreas.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Most Common Weak Areas</p>
          <div className="flex flex-wrap gap-2">
            {analytics.mostCommonWeakAreas.map((area, i) => (
              <span key={i} className="px-2 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-lg text-xs font-semibold">
                {area}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── StudentDetailPanel ───────────────────────────────────────
const StudentDetailPanel: React.FC<{ student: StudentActivity; onClose: () => void }> = ({ student, onClose }) => {
  const [quizHistory, setQuizHistory] = useState<any[]>([]);
  const [aiRec, setAiRec] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (supabase) {
        const { data } = await supabase
          .from('quiz_results')
          .select('topic, score, difficulty, created_at, weak_areas')
          .eq('student_id', student.studentId)
          .order('created_at', { ascending: false })
          .limit(10);
        setQuizHistory(data ?? []);
      }

      // Stream AI recommendation
      const stream = (await import('../services/geminiService')).generateCoachResponseStream(
        [],
        `Student ${student.name} has avg score ${student.avgScore}% and status ${student.status}. Give a 2-sentence intervention recommendation for their teacher.`,
        (await import('../types')).CoachMode.ANSWER,
        (await import('../types')).Language.ENGLISH
      );
      let text = '';
      for await (const chunk of stream) {
        text += chunk;
        setAiRec(text);
      }
      setLoading(false);
    };
    load();
  }, [student.studentId]);

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto border dark:border-slate-800" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{student.name}</h3>
            <StatusBadge status={student.status} />
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl leading-none">×</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-center">
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{student.avgScore}%</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Avg Score</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-center">
              <p className={`text-sm font-bold mt-1 ${student.isOnline ? 'text-green-600' : 'text-slate-400'}`}>
                {student.isOnline ? '🟢 Online' : '⚫ Offline'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Status</p>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2">🤖 AI Intervention Recommendation</p>
            {loading && !aiRec ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={14} className="animate-spin" /> Generating...</div>
            ) : (
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{aiRec}</p>
            )}
          </div>

          {/* Quiz History */}
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Recent Quiz History</p>
            {quizHistory.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-3">No quiz history yet.</p>
            ) : (
              <div className="space-y-2">
                {quizHistory.map((q, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm">
                    <div>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">{q.topic}</p>
                      <p className="text-xs text-slate-400">{q.difficulty} · {new Date(q.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`font-bold text-lg ${q.score >= 70 ? 'text-green-600' : 'text-red-500'}`}>{q.score}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main TeacherDashboard ────────────────────────────────────
const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user }) => {
  const [students, setStudents] = useState<StudentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentActivity | null>(null);
  const [broadcastReceived, setBroadcastReceived] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch
    fetchStudentActivity().then(data => { setStudents(data); setLoading(false); });

    // Live subscription
    const unsub = subscribeToStudentActivity(data => setStudents(data));
    return unsub;
  }, []);

  // Listen for broadcasts (student side)
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel('broadcast-listener')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'broadcasts' }, (payload) => {
        setBroadcastReceived((payload.new as any).message);
        setTimeout(() => setBroadcastReceived(null), 5000);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const atRiskCount = students.filter(s => s.status === 'At Risk').length;
  const onlineCount = students.filter(s => s.isOnline).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in pb-24">
      {/* Broadcast toast */}
      {broadcastReceived && (
        <div className="fixed top-4 right-4 z-50 bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
          <Radio size={16} />
          <span className="text-sm font-semibold">{broadcastReceived}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-xl">
              <GraduationCap className="text-indigo-600 dark:text-indigo-400" size={28} />
            </div>
            Teacher Console
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Live student monitoring & class analytics</p>
        </div>
        <button
          onClick={() => fetchStudentActivity().then(setStudents)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Students', value: students.length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
          { label: 'Online Now', value: onlineCount, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/30' },
          { label: 'At Risk', value: atRiskCount, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/30' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className={`p-3 ${stat.bg} ${stat.color} rounded-2xl`}><stat.icon size={24} /></div>
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Student List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl border dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-5 border-b dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Users size={16} className="text-indigo-500" /> Live Students
            </h3>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-indigo-500" size={28} /></div>
          ) : (
            <div className="divide-y dark:divide-slate-700 max-h-96 overflow-y-auto">
              {students.length === 0 ? (
                <p className="text-center text-slate-400 py-8 text-sm">No students found. Make sure profiles exist in Supabase.</p>
              ) : (
                students.map(student => (
                  <div
                    key={student.studentId}
                    onClick={() => setSelectedStudent(student)}
                    className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      {student.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">{student.name}</p>
                      <p className="text-xs text-slate-400 truncate">{student.currentTopic ?? 'No recent activity'}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-sm font-bold ${student.avgScore >= 70 ? 'text-green-600' : 'text-red-500'}`}>
                        {student.avgScore}%
                      </span>
                      <StatusBadge status={student.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {user && <BroadcastPanel teacherId={user.id} />}
          <ClassAnalyticsPanel />
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentDetailPanel student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      )}
    </div>
  );
};

export default TeacherDashboard;

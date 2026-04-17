import React, { useState, useEffect } from 'react';
import { generateLearningPath } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';
import { LearningNode, AppView } from '../types';
import { Map, Lock, Unlock, CheckCircle, PlayCircle, Loader2, Info, WifiOff } from 'lucide-react';

const CACHE_KEY = 'edufree_learning_path';

interface LearningPathProps {
  onNavigate: (view: AppView, topic?: string) => void;
  studentId?: string;
}

// ── Node unlock logic (pure) ─────────────────────────────────
export function unlockSuccessors(nodes: LearningNode[], completedId: string): LearningNode[] {
  const completedIdx = nodes.findIndex(n => n.id === completedId);
  if (completedIdx === -1) return nodes;

  return nodes.map((node, idx) => {
    // Mark completed node as MASTERED
    if (node.id === completedId) return { ...node, status: 'MASTERED' };
    // Unlock the immediate next node
    if (idx === completedIdx + 1 && node.status === 'LOCKED') return { ...node, status: 'UNLOCKED' };
    return node;
  });
}

const LearningPath: React.FC<LearningPathProps> = ({ onNavigate, studentId }) => {
  const [subject, setSubject] = useState('');
  const [nodes, setNodes] = useState<LearningNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<LearningNode | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  const handleGenerate = async () => {
    if (!subject.trim()) return;
    setLoading(true);
    setNodes([]);
    setSelectedNode(null);

    let path: LearningNode[];

    if (!navigator.onLine) {
      // 12.3 Offline fallback: load from localStorage
      const cached = localStorage.getItem(CACHE_KEY);
      path = cached ? JSON.parse(cached) : [
        { id: '1', title: `Introduction to ${subject}`, description: 'Fundamentals and core principles.', status: 'UNLOCKED', difficulty: 'Beginner', rationale: 'Essential first step.' },
        { id: '2', title: 'Core Concepts', description: 'Deep dive into key topics.', status: 'LOCKED', difficulty: 'Intermediate', rationale: 'Building on basics.' },
        { id: '3', title: 'Mastery & Application', description: 'Final project and real-world application.', status: 'LOCKED', difficulty: 'Advanced', rationale: 'Final evaluation.' },
      ];
    } else {
      path = await generateLearningPath(subject);
      // Cache for offline use
      localStorage.setItem(CACHE_KEY, JSON.stringify(path));
    }

    // Load saved node statuses from Supabase if available
    if (studentId && supabase && navigator.onLine) {
      const { data } = await supabase
        .from('learning_nodes')
        .select('node_id, status')
        .eq('student_id', studentId)
        .eq('subject', subject);

      if (data && data.length > 0) {
        const statusMap: Record<string, LearningNode['status']> = {};
        data.forEach((r: any) => { statusMap[r.node_id] = r.status; });
        path = path.map(n => statusMap[n.id] ? { ...n, status: statusMap[n.id] } : n);
      }
    }

    setNodes(path);
    setLoading(false);
  };

  // 12.1 Called when a quiz for a node is completed with score ≥ 70
  const handleNodeComplete = async (nodeId: string, score: number) => {
    if (score < 70) return;

    const updated = unlockSuccessors(nodes, nodeId);
    setNodes(updated);

    // Persist to Supabase
    if (studentId && supabase && navigator.onLine) {
      const upserts = updated
        .filter(n => n.id === nodeId || (n.status === 'UNLOCKED'))
        .map(n => ({
          student_id: studentId,
          subject,
          node_id: n.id,
          title: n.title,
          status: n.status,
          completed_at: n.status === 'MASTERED' ? new Date().toISOString() : null,
        }));

      await supabase.from('learning_nodes').upsert(upserts, { onConflict: 'student_id,subject,node_id' });
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-12 animate-fade-in pb-32">
      {/* Offline indicator */}
      {isOffline && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl text-amber-700 dark:text-amber-400 text-sm font-semibold">
          <WifiOff size={16} /> Offline — showing cached learning path
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border dark:border-slate-700 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5"><Map size={120} /></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <Map size={24} />
            </div>
            AI Learning Roadmap
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xl">
            Enter a subject to generate your personalized path to mastery. Complete quizzes to unlock the next level.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Physics, Data Science, Guitar..."
              className="flex-1 bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium dark:text-white"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !subject}
              className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Build My Path'}
            </button>
          </div>
        </div>
      </div>

      {nodes.length > 0 && (
        <div className="relative pt-10 px-4">
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-indigo-500 z-0 hidden md:block" />

          <div className="space-y-16 relative z-10">
            {nodes.map((node, index) => {
              const isEven = index % 2 === 0;
              const isLocked = node.status === 'LOCKED';

              return (
                <div
                  key={node.id}
                  className={`flex flex-col md:flex-row items-center gap-8 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse text-right'}`}
                >
                  {/* Node Icon */}
                  <div className="relative">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center border-8 transition-all duration-500 shadow-xl
                      ${node.status === 'MASTERED'     ? 'bg-green-500 border-green-100 dark:border-green-900/30 text-white' : ''}
                      ${node.status === 'IN_PROGRESS'  ? 'bg-blue-500 border-blue-100 dark:border-blue-900/30 text-white animate-pulse' : ''}
                      ${node.status === 'UNLOCKED'     ? 'bg-indigo-600 border-indigo-100 dark:border-indigo-900/30 text-white' : ''}
                      ${node.status === 'LOCKED'       ? 'bg-slate-200 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400' : ''}
                    `}>
                      {node.status === 'MASTERED'    && <CheckCircle size={40} />}
                      {node.status === 'IN_PROGRESS' && <PlayCircle size={40} />}
                      {node.status === 'UNLOCKED'    && <Unlock size={40} />}
                      {node.status === 'LOCKED'      && <Lock size={40} />}
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 border dark:border-slate-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm">
                      Level {index + 1}
                    </div>
                  </div>

                  {/* Content Card */}
                  <div
                    className={`flex-1 w-full max-w-sm bg-white dark:bg-slate-800 p-6 rounded-3xl border dark:border-slate-700 shadow-lg transition-all
                      ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:scale-105 hover:shadow-2xl'}
                      ${selectedNode?.id === node.id ? 'ring-4 ring-indigo-500/20 md:ring-8' : ''}
                    `}
                    onClick={() => !isLocked && setSelectedNode(node)}
                  >
                    <div className={`flex flex-col ${!isEven ? 'md:items-end' : ''}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider
                          ${node.difficulty === 'Beginner'     ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                          ${node.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                          ${node.difficulty === 'Advanced'     ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                        `}>
                          {node.difficulty}
                        </span>
                        {node.status === 'MASTERED' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">✓ Mastered</span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">{node.title}</h3>
                    </div>
                    <p className={`text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 ${!isEven ? 'md:text-right' : ''}`}>
                      {node.description}
                    </p>

                    {selectedNode?.id === node.id && !isLocked && (
                      <div className="mt-6 pt-6 border-t dark:border-slate-700 animate-fade-in">
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl mb-6">
                          <h4 className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                            <Info size={14} /> AI Rationale
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">"{node.rationale}"</p>
                        </div>
                        <div className={`flex gap-3 ${!isEven ? 'md:justify-end' : ''}`}>
                          <button
                            onClick={(e) => { e.stopPropagation(); onNavigate(AppView.CONCEPT_COACH, node.title); }}
                            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                          >
                            Learn
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onNavigate(AppView.EXAM_ARENA, node.title); }}
                            className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95"
                          >
                            Quiz (unlock next)
                          </button>
                        </div>
                        {/* Demo: simulate completing with 80% */}
                        {node.status !== 'MASTERED' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleNodeComplete(node.id, 80); setSelectedNode(null); }}
                            className="mt-3 w-full text-xs text-green-600 dark:text-green-400 font-bold border border-green-200 dark:border-green-800/40 rounded-xl py-2 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                          >
                            ✓ Mark as Completed (80%)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningPath;

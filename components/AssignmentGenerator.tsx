import React, { useState } from 'react';
import { Loader2, FileText, CheckCircle, Download, BookOpen } from 'lucide-react';
import { DifficultyLevel } from '../types';

interface AssignmentGeneratorProps {
  onClearTopic?: () => void;
}

const AssignmentGenerator: React.FC<AssignmentGeneratorProps> = ({ onClearTopic }) => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Intermediate');
  const [assignment, setAssignment] = useState<any>(null);

  const generateOfflineAssignment = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setAssignment(null);
    
    // Simulate offline AI generation delay
    setTimeout(() => {
      setAssignment({
        title: `Comprehensive Assignment: ${topic}`,
        difficulty,
        sections: [
          {
            type: 'Short Answer',
            questions: [
              `Explain the core principles of ${topic} passingly.`,
              `List three major real-world applications of ${topic}.`
            ]
          },
          {
            type: 'Long Answer / Essay',
            questions: [
              `Discuss the historical evolution and future potential of ${topic} in depth.`,
              `Compare and contrast different methodologies used within ${topic}.`
            ]
          },
          {
            type: 'Problem Solving',
            questions: [
              `Analyze a hypothetical scenario where ${topic} fails. What are the root causes and how would you mitigate them?`
            ]
          }
        ]
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border dark:border-slate-700 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5"><FileText size={120} /></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg">
              <FileText size={24} />
            </div>
            AI Assignment Generator
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xl">
            Generate custom assignments instantly, fully offline. Test your knowledge with structured questions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Quantum Mechanics, Machine Learning..."
              className="flex-1 bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium dark:text-white"
            />
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
              className="border dark:border-slate-700 rounded-2xl px-4 py-4 bg-slate-50 dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 min-w-[150px]"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
            <button
              onClick={generateOfflineAssignment}
              disabled={loading || !topic}
              className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Generate'}
            </button>
          </div>
        </div>
      </div>

      {assignment && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{assignment.title}</h3>
            <button className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">
              <Download size={16} /> Save Offline (PDF)
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {assignment.sections.map((section: any, sIdx: number) => (
              <div key={sIdx} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border dark:border-slate-700 shadow-sm">
                <h4 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <BookOpen className="text-indigo-500" size={20} /> {section.type}
                </h4>
                <div className="space-y-4 pl-4">
                  {section.questions.map((q: string, qIdx: number) => (
                    <div key={qIdx} className="flex gap-4">
                      <span className="font-bold text-slate-400">Q{qIdx + 1}.</span>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">{q}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentGenerator;

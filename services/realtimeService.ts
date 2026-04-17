import { supabase } from './supabaseClient';
import {
  BroadcastMessage,
  ClassroomEvent,
  LeaderboardEntry,
  StudentActivity,
  ClassAnalytics,
} from '../types';

// ── Leaderboard subscription ─────────────────────────────────
export function subscribeToLeaderboard(
  callback: (entries: LeaderboardEntry[]) => void
): () => void {
  if (!supabase) return () => {};

  const channel = supabase
    .channel('leaderboard')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'profiles' },
      async () => {
        // Re-fetch sorted leaderboard on any profile change
        const { data } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, xp, streak')
          .order('xp', { ascending: false })
          .limit(20);

        if (data) {
          callback(
            data.map((p, idx) => ({
              id: p.id,
              name: p.name,
              avatar: p.avatar_url,
              xp: p.xp ?? 0,
              streak: p.streak ?? 0,
              rank: idx + 1,
            }))
          );
        }
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

// ── Classroom / broadcast subscription ──────────────────────
export function subscribeToClassroom(
  _teacherId: string,
  callback: (event: ClassroomEvent) => void
): () => void {
  if (!supabase) return () => {};

  const channel = supabase
    .channel('classroom-broadcasts')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'broadcasts' },
      (payload) => {
        callback({
          type: 'broadcast',
          data: payload.new,
        });
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

// ── Student activity subscription (for teacher dashboard) ───
export function subscribeToStudentActivity(
  callback: (students: StudentActivity[]) => void
): () => void {
  if (!supabase) return () => {};

  const channel = supabase
    .channel('student-activity')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'profiles' },
      async () => {
        const students = await fetchStudentActivity();
        callback(students);
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

// ── Broadcast to class ───────────────────────────────────────
export async function broadcastToClass(
  teacherId: string,
  message: string
): Promise<void> {
  if (!supabase) return;
  await supabase.from('broadcasts').insert({
    teacher_id: teacherId,
    message,
  });
}

// ── Fetch student activity (used by teacher dashboard) ──────
export async function fetchStudentActivity(): Promise<StudentActivity[]> {
  if (!supabase) return [];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, avatar_url, xp, streak, last_activity_at, role')
    .eq('role', 'student')
    .order('last_activity_at', { ascending: false });

  if (!profiles) return [];

  // Fetch avg scores per student
  const { data: quizData } = await supabase
    .from('quiz_results')
    .select('student_id, score');

  const scoreMap: Record<string, number[]> = {};
  (quizData ?? []).forEach((r: any) => {
    if (!scoreMap[r.student_id]) scoreMap[r.student_id] = [];
    scoreMap[r.student_id].push(r.score);
  });

  const now = Date.now();

  return profiles.map((p: any) => {
    const scores = scoreMap[p.id] ?? [];
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    const lastActive = new Date(p.last_activity_at).getTime();
    const hoursAgo = (now - lastActive) / (1000 * 60 * 60);
    const isOnline = hoursAgo < 0.5; // active in last 30 min

    const status: StudentActivity['status'] =
      avgScore < 50 ? 'At Risk' : avgScore >= 80 ? 'Excelling' : 'Stable';

    return {
      studentId: p.id,
      name: p.name,
      avatar: p.avatar_url,
      status,
      avgScore,
      lastActive: p.last_activity_at,
      isOnline,
    };
  });
}

// ── Class analytics ──────────────────────────────────────────
export async function fetchClassAnalytics(): Promise<ClassAnalytics> {
  if (!supabase) {
    return { avgScorePerTopic: [], mostCommonWeakAreas: [], engagementRate: 0, totalActiveStudents: 0 };
  }

  const { data: results } = await supabase
    .from('quiz_results')
    .select('topic, score, weak_areas, student_id');

  if (!results || results.length === 0) {
    return { avgScorePerTopic: [], mostCommonWeakAreas: [], engagementRate: 0, totalActiveStudents: 0 };
  }

  // Average score per topic
  const topicMap: Record<string, number[]> = {};
  const weakAreaCount: Record<string, number> = {};

  results.forEach((r: any) => {
    if (!topicMap[r.topic]) topicMap[r.topic] = [];
    topicMap[r.topic].push(r.score);

    (r.weak_areas ?? []).forEach((area: string) => {
      weakAreaCount[area] = (weakAreaCount[area] ?? 0) + 1;
    });
  });

  const avgScorePerTopic = Object.entries(topicMap).map(([topic, scores]) => ({
    topic,
    avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }));

  const mostCommonWeakAreas = Object.entries(weakAreaCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([area]) => area);

  // Engagement: students active in last 24h / total students
  const { count: totalStudents } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'student');

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: activeStudents } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'student')
    .gte('last_activity_at', yesterday);

  const engagementRate = totalStudents
    ? Math.round(((activeStudents ?? 0) / totalStudents) * 100)
    : 0;

  return {
    avgScorePerTopic,
    mostCommonWeakAreas,
    engagementRate,
    totalActiveStudents: activeStudents ?? 0,
  };
}

// ── Classify student status (pure, used in tests) ────────────
export function classifyStudentStatus(avgScore: number): StudentActivity['status'] {
  if (avgScore < 50) return 'At Risk';
  if (avgScore >= 80) return 'Excelling';
  return 'Stable';
}

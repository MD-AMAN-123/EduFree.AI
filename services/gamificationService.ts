import { supabase } from './supabaseClient';
import {
  ActivityType,
  LeaderboardEntry,
  MilestoneResult,
  RankInfo,
  XPResult,
} from '../types';

// ── XP Points Table ──────────────────────────────────────────
export const XP_TABLE: Record<ActivityType, number> = {
  quiz_complete: 0,      // dynamic: 10 × correct answers
  concept_session: 25,
  doubt_solved: 15,
  streak_bonus: 0,       // dynamic: depends on streak milestone
  node_complete: 50,
};

export const XP_PER_CORRECT_ANSWER = 10;

// ── Milestone Definitions ────────────────────────────────────
export const XP_MILESTONES: { threshold: number; title: string; description: string; bonus: number }[] = [
  { threshold: 500,  title: '🌟 Rising Star',    description: 'Reached 500 XP!',   bonus: 25  },
  { threshold: 1000, title: '🔥 Knowledge Seeker', description: 'Reached 1000 XP!', bonus: 50  },
  { threshold: 2500, title: '💎 Scholar',          description: 'Reached 2500 XP!', bonus: 100 },
  { threshold: 5000, title: '🏆 Grand Master',     description: 'Reached 5000 XP!', bonus: 250 },
];

export const STREAK_MILESTONES: { threshold: number; title: string; description: string; bonus: number }[] = [
  { threshold: 7,  title: '🔥 Week Warrior',   description: '7-day streak!',  bonus: 50  },
  { threshold: 14, title: '⚡ Fortnight Force', description: '14-day streak!', bonus: 150 },
  { threshold: 30, title: '🌙 Monthly Master',  description: '30-day streak!', bonus: 500 },
];

// ── checkMilestones ──────────────────────────────────────────
/**
 * Returns any milestones crossed when moving from oldXP→newXP
 * or oldStreak→newStreak. Pure function — no side effects.
 */
export function checkMilestones(
  oldXP: number,
  newXP: number,
  oldStreak: number,
  newStreak: number
): MilestoneResult[] {
  const results: MilestoneResult[] = [];

  for (const m of XP_MILESTONES) {
    if (oldXP < m.threshold && newXP >= m.threshold) {
      results.push({ type: 'xp_milestone', title: m.title, description: m.description, xpBonus: m.bonus });
    }
  }

  for (const m of STREAK_MILESTONES) {
    if (oldStreak < m.threshold && newStreak >= m.threshold) {
      results.push({ type: 'streak_badge', title: m.title, description: m.description, xpBonus: m.bonus });
    }
  }

  return results;
}

// ── computeXP ────────────────────────────────────────────────
/**
 * Computes XP for an activity. For quiz_complete pass
 * metadata.correctAnswers. For streak_bonus pass metadata.streakDays.
 */
export function computeXP(activity: ActivityType, metadata?: { correctAnswers?: number; streakDays?: number }): number {
  if (activity === 'quiz_complete') {
    return (metadata?.correctAnswers ?? 0) * XP_PER_CORRECT_ANSWER;
  }
  if (activity === 'streak_bonus') {
    const days = metadata?.streakDays ?? 0;
    const m = STREAK_MILESTONES.find(s => s.threshold === days);
    return m?.bonus ?? 0;
  }
  return XP_TABLE[activity];
}

// ── awardXP ──────────────────────────────────────────────────
export async function awardXP(
  studentId: string,
  activity: ActivityType,
  metadata?: { correctAnswers?: number; streakDays?: number }
): Promise<XPResult> {
  const xpAwarded = computeXP(activity, metadata);

  // Fetch current profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('xp, streak')
    .eq('id', studentId)
    .single();

  if (error || !profile) {
    return { xpAwarded, newTotal: xpAwarded, milestones: [] };
  }

  const oldXP = profile.xp ?? 0;
  const newXP = oldXP + xpAwarded;
  const milestones = checkMilestones(oldXP, newXP, profile.streak ?? 0, profile.streak ?? 0);

  // Add milestone bonuses
  const bonusXP = milestones.reduce((sum, m) => sum + m.xpBonus, 0);
  const finalXP = newXP + bonusXP;

  await supabase
    .from('profiles')
    .update({ xp: finalXP, last_activity_at: new Date().toISOString() })
    .eq('id', studentId);

  // Persist achievements
  if (milestones.length > 0) {
    await supabase.from('achievements').insert(
      milestones.map(m => ({
        student_id: studentId,
        type: m.type,
        title: m.title,
        xp_bonus: m.xpBonus,
      }))
    );
  }

  return { xpAwarded: xpAwarded + bonusXP, newTotal: finalXP, milestones };
}

// ── getLeaderboard ───────────────────────────────────────────
export async function getLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, avatar_url, xp, streak')
    .order('xp', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((p, idx) => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar_url,
    xp: p.xp ?? 0,
    streak: p.streak ?? 0,
    rank: idx + 1,
  }));
}

// ── getRanking ───────────────────────────────────────────────
export async function getRanking(studentId: string): Promise<RankInfo> {
  const { data: all, error } = await supabase
    .from('profiles')
    .select('id, xp')
    .order('xp', { ascending: false });

  if (error || !all || all.length === 0) {
    return { rank: 0, xpToNext: 0, percentile: 0 };
  }

  const idx = all.findIndex(p => p.id === studentId);
  if (idx === -1) return { rank: 0, xpToNext: 0, percentile: 0 };

  const rank = idx + 1;
  const myXP = all[idx].xp ?? 0;
  const nextXP = idx > 0 ? (all[idx - 1].xp ?? 0) : myXP;
  const xpToNext = Math.max(0, nextXP - myXP);
  const percentile = Math.round(((all.length - rank) / all.length) * 100);

  return { rank, xpToNext, percentile };
}

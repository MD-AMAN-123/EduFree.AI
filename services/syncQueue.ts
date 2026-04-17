import { supabase } from './supabaseClient';
import { SyncOperation } from '../types';

const STORAGE_KEY = 'edufree_sync_queue';

// ── Persistence helpers ──────────────────────────────────────
function load(): SyncOperation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SyncOperation[]) : [];
  } catch {
    return [];
  }
}

function save(ops: SyncOperation[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ops));
}

// ── Public API ───────────────────────────────────────────────
export function enqueue(operation: Omit<SyncOperation, 'id' | 'timestamp'>): void {
  const ops = load();
  ops.push({
    ...operation,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
  });
  save(ops);
}

export function getPending(): SyncOperation[] {
  return load();
}

export async function flush(): Promise<{ succeeded: number; failed: number }> {
  const ops = load();
  if (ops.length === 0) return { succeeded: 0, failed: 0 };

  const remaining: SyncOperation[] = [];
  let succeeded = 0;
  let failed = 0;

  for (const op of ops) {
    try {
      if (op.type === 'insert') {
        const { error } = await supabase.from(op.table).insert(op.data);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(op.table).upsert(op.data);
        if (error) throw error;
      }
      succeeded++;
    } catch {
      failed++;
      remaining.push(op);
    }
  }

  save(remaining);
  return { succeeded, failed };
}

export function clear(): void {
  localStorage.removeItem(STORAGE_KEY);
}

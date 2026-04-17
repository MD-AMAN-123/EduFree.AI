import { supabase } from './supabaseClient';
import { User } from '../types';

export const logUserLogin = async (user: User) => {
  try {
    if (!supabase) return;

    const { error } = await supabase
      .from('user_logins')
      .insert([
        {
          user_id: user.id,
          email: user.email,
          login_at: new Date().toISOString(),
          metadata: {
            name: user.name,
            userAgent: navigator.userAgent,
            platform: navigator.platform
          }
        }
      ]);

    if (error) {
      console.error('Error logging user login:', error.message);
    }
  } catch (err) {
    console.error('Failed to log user login:', err);
  }
};

export const updateProfile = async (userId: string, updates: { name?: string; avatar_url?: string }): Promise<User | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select('id, name, email, avatar_url')
    .single();

  if (error) {
    console.error('Profile update error:', error);
    return null;
  }

  return data ? { id: data.id, name: data.name, email: data.email, avatar: data.avatar_url } : null;
};

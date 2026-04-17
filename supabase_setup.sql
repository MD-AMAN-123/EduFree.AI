-- 1. Update Students table to be user-specific
CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    grade TEXT,
    attendance TEXT,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own students" ON public.students;
CREATE POLICY "Users can manage their own students" ON public.students
    FOR ALL USING (auth.uid() = user_id);

-- 2. Create User Profiles/Stats table for persistence
CREATE TABLE IF NOT EXISTS public.user_stats (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    stats JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own stats" ON public.user_stats;
CREATE POLICY "Users can manage their own stats" ON public.user_stats
    FOR ALL USING (auth.uid() = user_id);

-- 3. Ensure user_logins is also secure
ALTER TABLE public.user_logins ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.user_logins;
CREATE POLICY "Enable insert for authenticated users" ON public.user_logins
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- ============================================================
-- EduFree.AI Advanced Schema
-- ============================================================

-- 4. Extended profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    avatar_url TEXT,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teacher')),
    xp INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    preferred_language TEXT DEFAULT 'English',
    difficulty_level TEXT DEFAULT 'Beginner',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read all profiles" ON public.profiles;
CREATE POLICY "Users can read all profiles" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- 5. Quiz results
CREATE TABLE IF NOT EXISTS public.quiz_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    time_taken_seconds INTEGER,
    difficulty TEXT NOT NULL,
    weak_areas TEXT[],
    xp_earned INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can manage own quiz results" ON public.quiz_results;
CREATE POLICY "Students can manage own quiz results" ON public.quiz_results
    FOR ALL USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Teachers can read all quiz results" ON public.quiz_results;
CREATE POLICY "Teachers can read all quiz results" ON public.quiz_results
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
    );

-- 6. Doubt history
CREATE TABLE IF NOT EXISTS public.doubt_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    image_url TEXT,
    topic TEXT,
    solution JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.doubt_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can manage own doubt history" ON public.doubt_history;
CREATE POLICY "Students can manage own doubt history" ON public.doubt_history
    FOR ALL USING (auth.uid() = student_id);

-- 7. Learning path nodes
CREATE TABLE IF NOT EXISTS public.learning_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    node_id TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'LOCKED' CHECK (status IN ('LOCKED','UNLOCKED','IN_PROGRESS','MASTERED')),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, subject, node_id)
);

ALTER TABLE public.learning_nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can manage own learning nodes" ON public.learning_nodes;
CREATE POLICY "Students can manage own learning nodes" ON public.learning_nodes
    FOR ALL USING (auth.uid() = student_id);

-- 8. Classroom broadcasts
CREATE TABLE IF NOT EXISTS public.broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can insert broadcasts" ON public.broadcasts;
CREATE POLICY "Teachers can insert broadcasts" ON public.broadcasts
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
    );

DROP POLICY IF EXISTS "All authenticated users can read broadcasts" ON public.broadcasts;
CREATE POLICY "All authenticated users can read broadcasts" ON public.broadcasts
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- 9. Achievements / badges
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    xp_bonus INTEGER DEFAULT 0,
    earned_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can manage own achievements" ON public.achievements;
CREATE POLICY "Students can manage own achievements" ON public.achievements
    FOR ALL USING (auth.uid() = student_id);

-- Enable Realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcasts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_results;

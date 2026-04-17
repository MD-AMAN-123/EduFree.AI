import { Language } from '../types';

const STORAGE_KEY = 'edufree_language';

// ── RTL languages ────────────────────────────────────────────
const RTL_LANGUAGES: Language[] = [Language.URDU];

export function getTextDirection(language: Language): 'ltr' | 'rtl' {
  return RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';
}

// ── Persist / load preference ────────────────────────────────
export function persistLanguage(language: Language): void {
  localStorage.setItem(STORAGE_KEY, language);
}

export function loadLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && Object.values(Language).includes(stored as Language)) {
    return stored as Language;
  }
  return Language.ENGLISH;
}

// ── Translation table ────────────────────────────────────────
type TranslationKey =
  | 'dashboard'
  | 'conceptCoach'
  | 'doubtSolver'
  | 'examArena'
  | 'learningPath'
  | 'teacherDashboard'
  | 'leaderboard'
  | 'smartAnalytics'
  | 'creatorStudio'
  | 'logout'
  | 'settings'
  | 'streak'
  | 'totalXP'
  | 'dailyGoals'
  | 'weeklyfocus'
  | 'syllabusCoverage'
  | 'aiInsights'
  | 'askAIBrain'
  | 'instantQuiz'
  | 'scanDoubt'
  | 'startRevision'
  | 'offlineMode'
  | 'onlineMode'
  | 'send'
  | 'listening'
  | 'thinking'
  | 'submit'
  | 'next'
  | 'previous'
  | 'score'
  | 'timeTaken'
  | 'xpEarned'
  | 'weakAreas'
  | 'rank'
  | 'topStudents'
  | 'broadcastMessage'
  | 'activeStudents'
  | 'atRisk'
  | 'stable'
  | 'excelling';

const translations: Record<TranslationKey, Record<'English' | 'Hindi', string>> = {
  dashboard:        { English: 'Dashboard',          Hindi: 'डैशबोर्ड' },
  conceptCoach:     { English: 'Concept Coach',      Hindi: 'कॉन्सेप्ट कोच' },
  doubtSolver:      { English: 'Doubt Solver',       Hindi: 'संदेह समाधान' },
  examArena:        { English: 'Exam Arena',         Hindi: 'परीक्षा अखाड़ा' },
  learningPath:     { English: 'Learning Path',      Hindi: 'सीखने का मार्ग' },
  teacherDashboard: { English: 'Teacher Dashboard',  Hindi: 'शिक्षक डैशबोर्ड' },
  leaderboard:      { English: 'Leaderboard',        Hindi: 'लीडरबोर्ड' },
  smartAnalytics:   { English: 'Smart Analytics',    Hindi: 'स्मार्ट विश्लेषण' },
  creatorStudio:    { English: 'Creator Studio',     Hindi: 'क्रिएटर स्टूडियो' },
  logout:           { English: 'Logout',             Hindi: 'लॉग आउट' },
  settings:         { English: 'Settings',           Hindi: 'सेटिंग्स' },
  streak:           { English: 'Streak',             Hindi: 'स्ट्रीक' },
  totalXP:          { English: 'Total XP',           Hindi: 'कुल XP' },
  dailyGoals:       { English: 'Daily Goals',        Hindi: 'दैनिक लक्ष्य' },
  weeklyfocus:      { English: 'Weekly Focus',       Hindi: 'साप्ताहिक फोकस' },
  syllabusCoverage: { English: 'Syllabus Coverage',  Hindi: 'पाठ्यक्रम कवरेज' },
  aiInsights:       { English: 'AI Insights',        Hindi: 'AI अंतर्दृष्टि' },
  askAIBrain:       { English: 'Ask AI Brain',       Hindi: 'AI से पूछें' },
  instantQuiz:      { English: 'Instant Quiz',       Hindi: 'तत्काल क्विज़' },
  scanDoubt:        { English: 'Scan Doubt',         Hindi: 'संदेह स्कैन करें' },
  startRevision:    { English: 'Start Revision',     Hindi: 'रिवीजन शुरू करें' },
  offlineMode:      { English: 'Offline Mode',       Hindi: 'ऑफलाइन मोड' },
  onlineMode:       { English: 'Online Mode',        Hindi: 'ऑनलाइन मोड' },
  send:             { English: 'Send',               Hindi: 'भेजें' },
  listening:        { English: 'Listening...',       Hindi: 'सुन रहा हूँ...' },
  thinking:         { English: 'Thinking...',        Hindi: 'सोच रहा हूँ...' },
  submit:           { English: 'Submit',             Hindi: 'जमा करें' },
  next:             { English: 'Next',               Hindi: 'अगला' },
  previous:         { English: 'Previous',           Hindi: 'पिछला' },
  score:            { English: 'Score',              Hindi: 'स्कोर' },
  timeTaken:        { English: 'Time Taken',         Hindi: 'लिया गया समय' },
  xpEarned:         { English: 'XP Earned',         Hindi: 'अर्जित XP' },
  weakAreas:        { English: 'Weak Areas',         Hindi: 'कमज़ोर क्षेत्र' },
  rank:             { English: 'Rank',               Hindi: 'रैंक' },
  topStudents:      { English: 'Top Students',       Hindi: 'शीर्ष छात्र' },
  broadcastMessage: { English: 'Broadcast Message',  Hindi: 'प्रसारण संदेश' },
  activeStudents:   { English: 'Active Students',    Hindi: 'सक्रिय छात्र' },
  atRisk:           { English: 'At Risk',            Hindi: 'जोखिम में' },
  stable:           { English: 'Stable',             Hindi: 'स्थिर' },
  excelling:        { English: 'Excelling',          Hindi: 'उत्कृष्ट' },
};

export function getLabel(key: TranslationKey, language: Language): string {
  const lang = language === Language.HINDI ? 'Hindi' : 'English';
  return translations[key]?.[lang] ?? translations[key]?.['English'] ?? key;
}

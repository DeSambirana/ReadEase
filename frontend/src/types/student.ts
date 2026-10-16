export type ReadingMode = 'focus' | 'comfortable';
export type FontSize = 'normal' | 'large' | 'xlarge';
export type AccentColor = 'yellow' | 'blue' | 'purple' | 'green' | 'pink';
export type StudentFontFamily = 'standard' | 'dyslexic';

export interface AdaptivePreferences {
  readingMode: ReadingMode; // 'comfortable' = semua kartu, 'focus' = 1 kartu bergantian
  sentenceThreshold: number; // ambang kalimat panjang (10-30 kata, bawaan 16-20)
  fontSize: FontSize; // Normal, Besar, Sangat Besar
  bionicReading: boolean; // aktif/nonaktif
  fontFamily: StudentFontFamily; // Standar atau Font Disleksia (OpenDyslexic)
  cardPacingMinutes?: number; // rekomendasi jeda per sesi
}

export interface StudentProfile {
  id: string;
  name: string; // Nama lengkap
  nickname: string; // Nama panggilan
  gradeClass: string; // Kelas / jenjang (misal: "Kelas 4B")
  avatarId: string; // ID preset avatar 3D clay
  needsTag: string; // Label kebutuhan khusus utama (misal: "ADHD - Perlu Fokus Singkat")
  secondaryTag?: string; // Tag tambahan (opsional)
  pedagogicalNotes: string; // Catatan observasi guru / strategi pedagogis
  preferences: AdaptivePreferences; // Pengaturan adaptasi bawaan murid
  lastSessionDate: string; // Tanggal sesi terakhir (misal: "19 Mar")
  lastTopic?: string; // Topik bacaan terakhir (misal: "Meet the Patient")
  completionRate: number; // Persentase ketuntasan (0 - 100%)
  accentColor: AccentColor; // Aksen warna pastel kartu
}

export type Student = StudentProfile;

export interface ReadingSessionLog {
  id: string;
  studentId: string;
  studentName: string;
  materialTitle: string;
  date: string; // ISO format
  formattedDate: string; // Misal: "19 Mar" atau "14 Okt 2026"
  cardCount: number;
  avgWordsPerSentence: number;
  exercisesCompleted: number;
  totalExercises: number;
  comprehensionScore: number | null; // 0 - 100
  status: 'completed' | 'in_progress' | 'printed';
  teacherEvaluation: string; // Catatan evaluasi guru pasca-membaca
}

export interface TeacherQuickNote {
  id: string;
  studentId?: string;
  studentName?: string;
  content: string;
  createdAt: string; // Jam / tanggal
  tag?: string;
}

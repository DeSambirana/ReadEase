import { apiFetch } from './api';
import { AuthGate } from './AuthGate';
import { AccessPanel } from './AccessPanel';
import React, { useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import type { components } from './api-types';
import { config } from './config';
import './style.css';
import './accounts.css';
import './theme.css';
import './editor.css';
import { loadDraft, storageKey, resultSchema, type Draft } from './draft';
import { PresetCards } from './PresetCards';
import { presets, type PresetId } from './presets';
import { Reader } from './Reader';
import { PrintPreview } from './PrintPreview';
import { Worksheet } from './Worksheet';
import { Review } from './Review';
import { samples } from './samples';

// Student Profile & Progress Tracker Imports
import { StudentProfile, ReadingSessionLog, TeacherQuickNote } from './types/student';
import {
  recordSession,
  getStorageWarning,
  saveReadingLogs,
  getStoredStudents,
  saveStudent,
  deleteStudent,
  getStoredLogs,
  addReadingLog,
  getStoredQuickNotes,
  addQuickNote,
  deleteQuickNote,
} from './studentStorage';
import { Navbar } from './components/Navbar';
import { StudentGrid } from './components/StudentGrid';
import { StudentSidebar } from './components/StudentSidebar';
import { StudentModal } from './components/StudentModal';
import { ReadingHistoryModal } from './components/ReadingHistoryModal';
import { AvatarClay } from './components/AvatarClay';
import { AdaptivePreviewCards } from './components/AdaptivePreviewCards';
import { ReadingComfortTest, type ComfortTestResults } from './components/ReadingComfortTest';

type Result = components['schemas']['AnalyzeResponse'];

function App() {
  const [loaded] = useState(loadDraft);
  const [draft, setDraft] = useState<Draft>(loaded.draft);
  const [storageWarning, setStorageWarning] = useState(loaded.warning || getStorageWarning());
  const [teacherStep,setTeacherStep]=useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Routing: default to 'murid' (Student Dashboard)
  const [route, setRoute] = useState(() => {
    const hash = location.hash.slice(1);
    if (!hash || hash === 'pilih' || hash === 'siswa') return 'murid';
    return hash;
  });

  // Student Profile & Tracking States
  const [students, setStudents] = useState<StudentProfile[]>(getStoredStudents);
  const [readingLogs, setReadingLogs] = useState<ReadingSessionLog[]>(getStoredLogs);
  const [quickNotes, setQuickNotes] = useState<TeacherQuickNote[]>(getStoredQuickNotes);

  const [targetStudentId, setTargetStudentId] = useState<string | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyFilterStudent, setHistoryFilterStudent] = useState<string | null>(null);
  const [isComfortTestOpen, setIsComfortTestOpen] = useState(false);
  const [comfortTestStudent, setComfortTestStudent] = useState<StudentProfile | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  const targetStudent = students.find((s) => s.id === targetStudentId) || null;

  const isMuridView = route === 'murid';
  const isTeacherView = route === 'guru' || route === 'adaptasi';
  const isReaderView = route === 'baca';

  const isLegacyPresetView = route === 'preset';
  const isTextInputOnly = route === 'teks';

  const heading = useRef<HTMLHeadingElement>(null);
  const profile = presets.find((p) => p.id === draft.readingProfile) || presets[0];

  useEffect(() => {
    const sync = () => {
      const hash = location.hash.slice(1);
      setRoute(hash || 'murid');
    };
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  useEffect(() => {
    heading.current?.focus();
    window.scrollTo(0, 0);
  }, [route]);

  function navigate(target: string) {
    location.hash = target;
    setRoute(target);
  }

  function choosePreset(id: PresetId) {
    const p = presets.find((item) => item.id === id)!;
    update({
      readingProfile: id,
      preset: id,
      preferences: { ...p.preferences },
      mode: p.mode,
    });
    setError('');
    navigate('teks');
  }

  const { text, threshold, result } = draft;
  const update = (change: Partial<Draft>) =>
    setDraft((previous) => ({ ...previous, ...change }));

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(draft));
    } catch {
      setStorageWarning('Draf tidak dapat disimpan di browser. Jangan tutup halaman sebelum selesai.');
    }
  }, [draft]);

  const words = text.split(/\s+/u).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
  const thresholdValue = Number(threshold);
  const validThreshold = Number.isInteger(thresholdValue) && thresholdValue >= 1 && thresholdValue <= 200;
  const tooLong = words > config.max_words || text.length > config.max_text_characters;

  function changeInput(change: Partial<Draft>) {
    update({
      ...change,
      result: null,
      worksheet: null,
      worksheetSelections: [],
      index: 0,
      completed: [],
      editBuffers: {},
    });
    setError('');
  }

  async function processText() {
    const originHash = location.hash;
    setBusy(true);
    setError('');
    update({
      result: null,
      worksheet: null,
      worksheetSelections: [],
      index: 0,
      completed: [],
      editBuffers: {},
    });
    try {
      const response = await apiFetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          important_terms: draft.importantTerms
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          options: { threshold: thresholdValue, max_sentences_per_card: draft.maxSentencesPerCard },
        }),
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        const detail =
          typeof data === 'object' && data !== null && 'detail' in data && typeof data.detail === 'string'
            ? data.detail
            : 'Masukan tidak valid.';
        setError(detail);
        return;
      }

      const parsedResult = resultSchema.parse(data) satisfies Result;
      update({ result: parsedResult });
      if(isTeacherView)setTeacherStep(1);

      setToastMessage('✅ Teks berhasil dianalisis! Buka langkah Tinjauan untuk memeriksa hasilnya.');
      setTimeout(() => setToastMessage(''), 6000);

      // Scroll smoothly to results
      setTimeout(() => {
        document.getElementById('hasil-analisis-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 150);

      if (!isTeacherView && location.hash === originHash) navigate('baca');
    } catch (err) {
      console.error('Process text error:', err);
      setError('Teks gagal diproses. Periksa koneksi backend lalu coba lagi.');
    } finally {
      setBusy(false);
    }
  }

  async function handleQuickExportPdf(forStudent?: StudentProfile) {
    if (forStudent && forStudent.id !== targetStudentId) {
      handleCreateWorksheetForStudent(forStudent);
      setToastMessage('Murid dipilih. Analisis dan periksa materi sebelum mengekspor PDF.');
      return;
    }
    if (!draft.result) {
      navigate('guru');
      setError('Tempel teks lalu tekan Mulai Adaptasi Teks sebelum membuat PDF.');
      return;
    }
    // Semua ekspor melewati panel sasaran dan persetujuan catatan yang sama.
    navigate('guru');
    setTeacherStep(3);
    setTimeout(()=>document.querySelector('.print-section-card')?.scrollIntoView({behavior:'smooth'}),100);
    setToastMessage('Periksa nama sasaran dan catatan, lalu tekan Unduh PDF A4 pada panel cetak.');
  }

  // --- Student Management Actions ---
  const handleCreateWorksheetForStudent = (student: StudentProfile) => {
    if (draft.result && student.id !== targetStudentId && !window.confirm('Mengganti murid akan mengosongkan hasil analisis dan tinjauan agar pengaturan baru diterapkan. Teks asli tetap tersedia. Lanjutkan?')) return;
    setTargetStudentId(student.id);
    setTeacherStep(0);

    // Apply student's adaptive preferences directly into draft
    const newPrefs = { ...presets.find(p=>p.id === (student.preferences.readingMode==='focus'?'focus':'comfortable'))!.preferences };
    if (student.preferences.fontFamily === 'dyslexic') {
      newPrefs.fontFamily = 'dyslexie';
    } else {
      newPrefs.fontFamily = 'sans';
    }

    if (student.preferences.fontSize === 'xlarge') {
      newPrefs.fontSize = 26;
    } else if (student.preferences.fontSize === 'large') {
      newPrefs.fontSize = 22;
    } else {
      newPrefs.fontSize = 18;
    }

    newPrefs.bionic = student.preferences.bionicReading;

    // Auto load a sample text if composer is currently empty
    const defaultText = text;

    changeInput({
      maxSentencesPerCard:student.preferences.readingMode==='focus'?1:2,
      threshold: String(student.preferences.sentenceThreshold),
      mode: student.preferences.readingMode,
      readingProfile: student.preferences.readingMode === 'focus' ? 'focus' : 'comfortable',
      preferences: newPrefs,
      text: defaultText,
    });

    setToastMessage(
      `🎯 Lembar baca disiapkan untuk ${student.name} (${student.gradeClass}). Ambang diset ${student.preferences.sentenceThreshold} kata.`
    );
    setTimeout(() => setToastMessage(''), 6000);

    navigate('guru');
  };

  function runStoredAction(action:()=>void):boolean {
    try { action(); return true; } catch(e) {
      const message=e instanceof Error?e.message:'Data belum tersimpan';
      setStorageWarning(message); window.alert(message); return false;
    }
  }
  function updateLogs(logs:ReadingSessionLog[]):boolean {
    return runStoredAction(()=>{saveReadingLogs(logs);setReadingLogs(getStoredLogs());});
  }
  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (student: StudentProfile) => {
    setEditingStudent(student);
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = (saved: StudentProfile) => runStoredAction(()=>{
    const updated = saveStudent(saved);
    setStudents(updated);
  });

  const handleDeleteStudent = (id: string) => {
    const updated = deleteStudent(id);
    setReadingLogs(getStoredLogs());
    setQuickNotes(getStoredQuickNotes());
    setStudents(updated);
    if (targetStudentId === id) {
      setTargetStudentId(null);
    }
  };

  const handleOpenHistoryModal = (student?: StudentProfile) => {
    setHistoryFilterStudent(student ? student.id : 'all');
    setIsHistoryModalOpen(true);
  };

  const handleAddQuickNote = (noteData: {
    studentId?: string;
    studentName?: string;
    content: string;
    tag?: string;
  }) => {
    const updated = addQuickNote(noteData);
    setQuickNotes(updated);
  };

  const handleDeleteQuickNote = (id: string) => {
    const updated = deleteQuickNote(id);
    setQuickNotes(updated);
  };

  const handleWorksheetGenerated = (
    student: StudentProfile,
    title: string,
    cardCount: number,
    avgWords: number,
    exerciseCount: number
  ) => {
    const newLog = {
      studentId: student.id,
      studentName: student.name,
      materialTitle: title,
      date: new Date().toISOString(),
      formattedDate: new Date().toLocaleDateString('id-ID'),
      cardCount,
      avgWordsPerSentence: Math.round(avgWords * 10) / 10,
      exercisesCompleted: 0,
      totalExercises: exerciseCount,
      comprehensionScore: null,
      status: 'printed' as const,
      teacherEvaluation: student.pedagogicalNotes
        ? `PDF dibuat untuk ${student.name}. Belum dinilai.`
        : 'PDF dibuat; belum ada penilaian guru.',
    };


    // Update student's last session date
    const updatedStudent: StudentProfile = {
      ...student,
      lastSessionDate: 'Hari ini',
      lastTopic: title.length > 25 ? title.slice(0, 25) + '...' : title,
      completionRate: student.completionRate,
    };
    recordSession(updatedStudent,newLog);
    setStudents(getStoredStudents());
    setReadingLogs(getStoredLogs());
  };

  const handleOpenComfortTest = (student: StudentProfile) => {
    setComfortTestStudent(student);
    setIsComfortTestOpen(true);
  };

  const handleSaveComfortTestResults = (student: StudentProfile, results: ComfortTestResults) => {
    // 1. Calculate updated preferences based on results
    const newPrefs = { ...student.preferences };

    if (results.preferredStyle === 'bionic') {
      newPrefs.bionicReading = true;
      newPrefs.fontFamily = 'standard';
    } else if (results.preferredStyle === 'dyslexic') {
      newPrefs.fontFamily = 'dyslexic';
      newPrefs.bionicReading = false;
      newPrefs.fontSize = 'large';
    } else {
      newPrefs.bionicReading = false;
      newPrefs.fontFamily = 'standard';
    }

    const testSummary = `[Uji Kenyamanan]: Gaya ${results.preferredStyleLabel}, skor pemahaman ${results.comprehensionAccuracy}%, kec. jawab ${results.avgComprehensionTimeSeconds}s/soal.`;

    const updatedStudent: StudentProfile = {
      ...student,
      preferences: newPrefs,
      pedagogicalNotes: student.pedagogicalNotes
        ? `${testSummary} | ${student.pedagogicalNotes}`
        : testSummary,
      completionRate: student.completionRate,
      lastSessionDate: 'Hari ini',
      lastTopic: `Uji Kenyamanan: ${results.preferredStyleLabel}`,
    };


    // Also add to teacher quick notes
    const sessionNote = {
      studentId: student.id,
      studentName: student.name,
      content: `Selesai Uji Kenyamanan Baca! Memilih tampilan ${results.preferredStyleLabel} (Akurasi: ${results.comprehensionAccuracy}%, Waktu: ${results.totalReadingTimeSeconds} detik). Preferensi adaptasi otomatis diperbarui.`,
      tag: 'Uji Baca',
    };

    // Also add to reading logs so it appears in history
    const testLog: ReadingSessionLog = {
      id: `log-test-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      materialTitle: `Uji Kenyamanan: ${results.preferredStyleLabel}`,
      date: new Date().toISOString(),
      formattedDate: new Date().toLocaleDateString('id-ID'),
      cardCount: 3,
      avgWordsPerSentence: results.averageWordsPerSentence,
      exercisesCompleted: results.comprehensionAnswers.length,
      totalExercises: results.comprehensionAnswers.length,
      comprehensionScore: results.comprehensionAccuracy,
      status: 'completed',
      teacherEvaluation: `Latihan preferensi baca selesai; bukan diagnosis. Murid memilih ${results.preferredStyleLabel}. Rekomendasi: ${results.recommendations.join('; ')}`,
    };
    recordSession(updatedStudent,testLog,sessionNote);
    setStudents(getStoredStudents());
    setReadingLogs(getStoredLogs());
    setQuickNotes(getStoredQuickNotes());

    setToastMessage(
      `Hasil Uji Kenyamanan untuk ${student.name} berhasil disimpan! Pengaturan ${results.preferredStyleLabel} otomatis diterapkan.`
    );
    setTimeout(() => setToastMessage(''), 7000);
  };

  return (
    <div className="app-shell">
      {/* 1. TOP NAVIGATION BAR (DARK AESTHETIC) */}
      <Navbar
        currentRoute={route}
        onNavigate={(newRoute) => {
          if (newRoute === 'riwayat') {
            handleOpenHistoryModal();
          } else {
            navigate(newRoute);
          }
        }}
        studentCount={students.length}
      />

      {/* Floating feedback toast */}
      {toastMessage && (
        <div className="targeted-student-banner" role="status">
          <div className="banner-left">
            <span style={{ fontSize: 24 }}>✨</span>
            <div>
              <div className="banner-target-title">Informasi</div>
              <div className="banner-target-details">{toastMessage}</div>
            </div>
          </div>
          <button
            type="button"
            className="btn-switch-target"
            onClick={() => setToastMessage('')}
          >
            Tutup
          </button>
        </div>
      )}

      {/* 2. MAIN VIEWS */}
      {/* VIEW A: MURID BIMBINGAN (DASHBOARD WITH 3D PLAYFUL CARDS & RIGHT PROGRESS SIDEBAR) */}
      {isMuridView && (
        <div className="dashboard-main-grid">
          {/* Main Canvas - Left Column: Student Grid */}
          <AccessPanel students={students} />
          <StudentGrid
            students={students}
            onCreateWorksheet={handleCreateWorksheetForStudent}
            onEditStudent={handleOpenEditStudent}
            onAddNewStudent={handleOpenAddStudent}
            onViewHistory={handleOpenHistoryModal}
            onQuickExportPdf={handleQuickExportPdf}
            onRunComfortTest={handleOpenComfortTest}
          />

          {/* Right Sidebar - Activity & Progress Tracker */}
          <StudentSidebar
            students={students}
            quickNotes={quickNotes}
            readingLogs={readingLogs}
            onAddQuickNote={note=>runStoredAction(()=>handleAddQuickNote(note))}
            onDeleteQuickNote={id=>runStoredAction(()=>handleDeleteQuickNote(id))}
            onSelectStudent={handleOpenEditStudent}
          />
        </div>
      )}

      {/* VIEW B: RUANG ADAPTASI & RUANG GURU */}
      {isTeacherView && (
        <main className="teacher-studio" style={{ maxWidth: 1040, margin: '0 auto', padding: 0 }}>
          {/* Target Student Indicator Banner */}
          {targetStudent ? (
            <div className="targeted-student-banner">
              <div className="banner-left">
                <AvatarClay avatarId={targetStudent.avatarId} size={46} />
                <div>
                  <div className="banner-target-title">
                    Untuk: {targetStudent.name} ({targetStudent.gradeClass})
                  </div>
                  <div className="banner-target-details">
                    Preferensi: <strong>{targetStudent.needsTag}</strong> · Penanda kalimat panjang: {targetStudent.preferences.sentenceThreshold} kata
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn-switch-target"
                  onClick={() => navigate('murid')}
                >
                  Ganti Murid 
                </button>
              </div>
            </div>
          ) : (
            <div className="targeted-student-banner" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
              <div className="banner-left">
                <span style={{ fontSize: 24 }}></span>
                <div>
                  <div className="banner-target-title" style={{ color: '#0f172a' }}>
                    Lembar baca umum
                  </div>
                  <div className="banner-target-details">
                    Pilih murid untuk memuat preset kebutuhan khusus atau gunakan pengaturan bebas di bawah.
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn-switch-target"
                onClick={() => navigate('murid')}
              >
                Pilih Murid
              </button>
            </div>
          )}

          <div className="intro">
            <p className="eyebrow">RUANG GURU / LEMBAR BACA</p>
            <h1 ref={heading} tabIndex={-1}>Lembar baca baru</h1>
            <p>Susun materi, periksa isinya, lalu bagikan kepada murid.</p>
          </div>

          <div className="editor-layout"><aside className="editor-rail"><p className="rail-caption">PENYUSUNAN</p>
          <nav className="teacher-steps" aria-label="Langkah menyiapkan bacaan">{['Teks','Tinjauan','Soal','Cetak & Bagikan'].map((label,i)=><button key={label} aria-current={teacherStep===i?'step':undefined} disabled={busy||(!result&&i>0)} onClick={()=>setTeacherStep(i)}><span>{i+1}</span>{label}</button>)}</nav><div className="rail-note"><strong>Materi tetap milik guru.</strong><p>Perubahan bahasa menjadi usulan. Periksa sebelum membagikan.</p></div></aside><div className="editor-document">
          <div hidden={teacherStep!==0}>
          <section className="composer" aria-label="Siapkan bacaan">
            <div className="section-heading">
              <h2>Teks sumber</h2>
              <span className="privacy-note">Draf hanya di tab ini</span>
            </div>

            <label htmlFor="text">Teks bacaan</label>
            <textarea
              id="text"
              rows={6}
              placeholder="Tempel cerita, artikel, atau materi pelajaran di sini…"
              disabled={busy}
              value={text}
              onChange={(e) => {
                changeInput({ text: e.target.value });
              }}
              aria-describedby="input-guide"
            />
            <p id="input-guide">
              {words} kata. Dianjurkan {config.recommended_min_words}–{config.recommended_max_words} kata; maksimal 1.500 kata.
            </p>

            {words > 0 &&
              (words < config.recommended_min_words || words > config.recommended_max_words) &&
              !tooLong && (
                <p className="notice">Di luar rentang anjuran. Teks tetap dapat diproses.</p>
              )}
            {tooLong && (
              <p role="alert">
                Teks melebihi batas. Kurangi hingga maksimal 1.500 kata dan 30.000 karakter.
              </p>
            )}

            <div className="samples" aria-label="Contoh materi">
              <span>Coba contoh:</span>
              {samples.map((sample) => (
                <button
                  className="sample-button"
                  disabled={busy}
                  key={sample.id}
                  onClick={() => changeInput({ text: sample.text })}
                >
                  Muat {sample.id === 'ipa' ? 'IPA' : sample.id === 'ips' ? 'IPS' : 'Bahasa Indonesia'}
                </button>
              ))}
            </div>

            <details className="teacher-settings"><summary>Pengaturan tambahan · istilah dan ambang kalimat</summary>
              <label htmlFor="terms">Istilah sulit/penting (pisahkan dengan koma)</label>
              <input
                id="terms"
                className="terms-input"
                disabled={busy}
                value={draft.importantTerms}
                onChange={(e) => changeInput({ importantTerms: e.target.value })}
                placeholder="Contoh: hemoglobin, alveolus, transpirasi"
              />
              <p>
                Mengubah daftar istilah menghapus hasil dan tinjauan lama. Tekan Mulai Adaptasi Teks untuk menerapkannya.
              </p>

              <label htmlFor="threshold">
                Ambang kalimat panjang (kata) {targetStudent ? `— Bawaan ${targetStudent.nickname}: ${targetStudent.preferences.sentenceThreshold} kata` : ''}
              </label>
              <input
                id="threshold"
                type="number"
                min={1}
                max={200}
                step={1}
                disabled={busy}
                value={threshold}
                onChange={(e) => {
                  changeInput({ threshold: e.target.value });
                }}
              />
              {!validThreshold && (
                <p role="alert">Ambang harus berupa bilangan bulat antara 1 dan 200.</p>
              )}
            </details>

            <div className="process-row" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                className="primary-button"
                disabled={!words || busy || tooLong || !validThreshold}
                onClick={() => void processText()}
              >
                {busy ? 'Memproses…' : 'Mulai Adaptasi Teks'}
                <span aria-hidden="true"> →</span>
              </button>

              <p role="status" className="save-note" style={{ marginLeft: 'auto' }}>
                {storageWarning || 'Draf tersimpan selama tab ini terbuka; dihapus saat keluar akun.'}
              </p>
            </div>
            {error && <p role="alert">{error}</p>}
          </section>

          </div>
          <div className="teacher-workspace">
            <div hidden={teacherStep!==1}>
            <section aria-live="polite" aria-label="Hasil" id="hasil-analisis-section" className="text-analysis-section-card">
              <div className="section-title-wrap">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24 }}></span>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 20 }}>Ringkasan teks</h2>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13.5 }}>
                      Periksa panjang kalimat dan usulan perubahan sebelum melanjutkan.
                    </p>
                  </div>
                </div>
              </div>

              {result ? (
                <>
                  {(result.warnings ?? []).length > 0 && (
                    <div className="proposal-warnings-box" style={{ marginTop: 14 }}>
                      {(result.warnings ?? []).map((w) => (
                        <span key={w} className="warning-item"> {w}</span>
                      ))}
                    </div>
                  )}

                  {/* 3 Modern Metric Cards */}
                  <div className="teacher-metrics-cards-grid">
                    <div className="metric-stat-card">
                      <div className="stat-card-top">
                        <span className="stat-icon"></span>
                        <span className="stat-label">Rata-rata Panjang Kalimat</span>
                      </div>
                      <div className="stat-number-wrap">
                        <strong data-testid="average" className="stat-number">
                          {result.document.metrics_before.avg_words_per_sentence}
                        </strong>
                        <span className="stat-unit">kata / kalimat</span>
                      </div>
                      <div className="stat-status-badge green">
                        {result.document.metrics_before.avg_words_per_sentence <= 12
                          ? ' Sangat Ringkas & Mudah'
                          : result.document.metrics_before.avg_words_per_sentence <= 18
                          ? ' Sedang & Nyaman Dibaca'
                          : ' Perlu Penyederhanaan'}
                      </div>
                    </div>

                    <div className="metric-stat-card">
                      <div className="stat-card-top">
                        <span className="stat-icon"></span>
                        <span className="stat-label">Kalimat Panjang (&gt;{result.document.metrics_before.threshold} kata)</span>
                      </div>
                      <div className="stat-number-wrap">
                        <strong data-testid="over-threshold" className="stat-number">
                          {result.document.metrics_before.sentences_over_threshold}
                        </strong>
                        <span className="stat-unit">kalimat</span>
                      </div>
                      <div className={`stat-status-badge ${result.document.metrics_before.sentences_over_threshold === 0 ? 'green' : 'amber'}`}>
                        {result.document.metrics_before.sentences_over_threshold === 0
                          ? ' Semua kalimat sudah ringkas'
                          : ' Ada usulan penyederhanaan di bawah'}
                      </div>
                    </div>

                    <div className="metric-stat-card">
                      <div className="stat-card-top">
                        <span className="stat-icon"></span>
                        <span className="stat-label">Jumlah Kartu Baca</span>
                      </div>
                      <div className="stat-number-wrap">
                        <strong className="stat-number">{result.cards.length}</strong>
                        <span className="stat-unit">kartu baca</span>
                      </div>
                      <div className="stat-status-badge blue">
                         Terbagi rapi per ide pokok
                      </div>
                    </div>
                  </div>

                  <p className="pedagogical-disclaimer">
                     <em>Indikator struktur teks; bukan penentuan tingkat kelas.</em>
                  </p>

                  {/* Clean collapsible sentence inspector */}
                  <details className="sentence-inspector-details">
                    <summary className="inspector-summary">
                      <span> Rincian Seluruh Kalimat Sumber ({result.document.sentences.length} Kalimat)</span>
                      <span className="summary-hint">Klik untuk melihat penanda panjang tiap kalimat</span>
                    </summary>
                    <div className="inspector-sentence-list">
                      {result.document.sentences.map((sentence, sIdx) => {
                        const long = sentence.word_count > result.document.metrics_before.threshold;
                        return (
                          <div
                            key={sentence.id}
                            className={`inspector-sentence-item ${long ? 'is-long' : ''}`}
                            data-long={long}
                          >
                            <div className="sentence-meta-bar">
                              <span className="sentence-number-chip">Kalimat #{sIdx + 1}</span>
                              <span className="sentence-words-chip">{sentence.word_count} kata</span>
                              {long && <span className="sentence-warning-chip"> Tergolong Panjang</span>}
                            </div>
                            <p className="sentence-body-text">{sentence.text}</p>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                </>
              ) : (
                <div className="empty-analysis-box">
                  <span style={{ fontSize: 32 }}></span>
                  <p>Hasil analisis akan muncul di sini setelah tombol <strong>Mulai Adaptasi Teks</strong> ditekan.</p>
                </div>
              )}
            </section>

            <Review draft={draft} update={update} busy={busy} setBusy={setBusy} />
            <button className="studio-next" onClick={()=>setTeacherStep(2)}>Lanjut ke soal →</button>
            </div>
            <div hidden={teacherStep!==2}>
            <Worksheet draft={draft} update={update} busy={busy} setBusy={setBusy} />

            <button className="studio-next" onClick={()=>setTeacherStep(3)}>Lanjut ke cetak & bagikan →</button>
            </div>
            <div hidden={teacherStep!==3}>
            <details className="studio-preview"><summary>Lihat kartu bacaan sebelum dicetak</summary>
            {/* Adaptive Preview Cards - Visual card preview with Bionic/Dyslexia formatting */}
            {draft.result && (
              <AdaptivePreviewCards
                draft={draft}
                student={targetStudent}
                onExportPdf={() => void handleQuickExportPdf(targetStudent || undefined)}
                busy={busy}
              />
            )}

            </details>
            {/* Print Preview with Student Selection & Pedagogical Notes */}
            <PrintPreview
              draft={draft}
              update={update}
              busy={busy}
              setBusy={setBusy}
              students={students}
              targetStudentId={targetStudentId}
              onSelectTargetStudent={(id) => {
                if(id === targetStudentId) return;
                const selected=students.find(s=>s.id===id);
                if(selected) handleCreateWorksheetForStudent(selected);
                else setTargetStudentId(null);
              }}
              onWorksheetGenerated={(...args)=>runStoredAction(()=>handleWorksheetGenerated(...args))}
            />
            </div>
          </div>
          </div></div>
        </main>
      )}

      {/* VIEW C: MODE BACA SISWA */}
      {isReaderView && (
        <main style={{ maxWidth: 860, margin: '0 auto', padding: 0 }}>
          <div className="flow-toolbar">
            <button onClick={() => navigate('murid')}>← Kembali ke Daftar Murid</button>
            <span className="profile-badge">
              {targetStudent ? `Membaca: ${targetStudent.name}` : profile.title}
            </span>
            <button onClick={() => navigate('guru')}>Buka Ruang Guru →</button>
          </div>

          <div className="intro">
            <p className="eyebrow">
              {targetStudent ? `MODE BACA KHUSUS: ${targetStudent.name.toUpperCase()}` : 'MODE BACA SISWA'}
            </p>
            <h1 ref={heading} tabIndex={-1}>
              {draft.result ? 'Bacaanmu sudah siap.' : 'Belum ada teks yang diproses.'}
            </h1>
            <p>
              {draft.result
                ? 'Gunakan tombol panah untuk berpindah kartu. Atur ukuran huruf dan kontras jika diperlukan.'
                : 'Pilih murid atau masukkan teks bacaan di Ruang Guru terlebih dahulu.'}
            </p>
          </div>

          {draft.result ? (
            <Reader draft={draft} update={update} />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <button
                type="button"
                className="primary-button"
                onClick={() => navigate('guru')}
              >
                Buka Ruang Guru & Masukkan Teks
              </button>
            </div>
          )}
        </main>
      )}

      {/* VIEW D: LEGACY PRESET SELECTION */}
      {(isLegacyPresetView || isTextInputOnly) && (
        <main style={{ maxWidth: 860, margin: '0 auto' }}>
          <div className="intro">
            <p className="eyebrow">PANDUAN MEMBACA</p>
            <h1>Bagaimana kamu ingin membaca?</h1>
            <p>Pilih bantuan yang ingin kamu coba. Tidak perlu membuat akun.</p>
          </div>
          <PresetCards selected={draft.readingProfile} onSelect={choosePreset} disabled={busy} />
        </main>
      )}

      {storageWarning && <p role="alert" style={{padding:16,background:'#fff3cc',color:'#493b0d'}}>{storageWarning}</p>}
      {/* 3. MODALS */}
      {/* Student Profile & Progress Modal */}
      <StudentModal
        isOpen={isStudentModalOpen}
        student={editingStudent}
        onClose={() => setIsStudentModalOpen(false)}
        onSave={handleSaveStudent}
        onDelete={id=>runStoredAction(()=>handleDeleteStudent(id))}
        onRunComfortTest={handleOpenComfortTest}
        onCreateWorksheet={handleCreateWorksheetForStudent}
        onQuickExportPdf={handleQuickExportPdf}
        logs={readingLogs}
        onUpdateLog={updateLogs}
        onAddLog={(newLog) => runStoredAction(()=>{
          const updated = addReadingLog(newLog);
          setReadingLogs(updated);
        })}
      />

      {/* Reading Session History & Progress Tracker Modal */}
      <ReadingHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        logs={readingLogs}
        students={students}
        selectedStudentFilter={historyFilterStudent}
        onUpdateLog={updateLogs}
      />

      {/* Reading Comfort & Diagnostic Test Modal */}
      <ReadingComfortTest
        isOpen={isComfortTestOpen}
        student={comfortTestStudent}
        onClose={() => setIsComfortTestOpen(false)}
        onSaveResults={(student,results)=>runStoredAction(()=>handleSaveComfortTestResults(student,results))}
      />

      {/* Footer */}
      <footer className="app-footer" style={{ marginTop: 50, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
        ReadEase · Bacaan dan lembar kerja untuk kebutuhan belajar yang beragam. Akun dan materi tersimpan pada server aplikasi.
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<AuthGate><App /></AuthGate>);

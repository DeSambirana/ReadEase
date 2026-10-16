import {useModalAccessibility} from '../useModalAccessibility';
import {LogProgressEditor} from './LogProgressEditor';
import React, { useState, useEffect } from 'react';
import {
  StudentProfile,
  AccentColor,
  FontSize,
  ReadingMode,
  StudentFontFamily,
  ReadingSessionLog,
} from '../types/student';
import { AvatarClay, AVATAR_PRESETS, resolveAvatarId } from './AvatarClay';

interface StudentModalProps {
  isOpen: boolean;
  student: StudentProfile | null; // null means adding new student
  onClose: () => void;
  onSave: (student: StudentProfile) => boolean;
  onDelete?: (studentId: string) => boolean;
  onRunComfortTest?: (student: StudentProfile) => void;
  onCreateWorksheet?: (student: StudentProfile) => void;
  onQuickExportPdf?: (student: StudentProfile) => void;
  logs?: ReadingSessionLog[];
  onUpdateLog?: (updatedLogs: ReadingSessionLog[]) => boolean;
  onAddLog?: (newLog: Omit<ReadingSessionLog, 'id'>) => boolean;
  initialTab?: 'perkembangan' | 'pengaturan';
}

export function StudentModal({
  isOpen,
  student,
  onClose,
  onSave,
  onDelete,
  onRunComfortTest,
  onCreateWorksheet,
  onQuickExportPdf,
  logs = [],
  onUpdateLog,
  onAddLog,
  initialTab = 'perkembangan',
}: StudentModalProps) {
  useModalAccessibility(isOpen,onClose,'.modal-backdrop');
  const [activeTab, setActiveTab] = useState<'perkembangan' | 'pengaturan'>(
    student ? initialTab : 'pengaturan'
  );

  // Form States
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [gradeClass, setGradeClass] = useState('Kelas 4A');
  const [avatarId, setAvatarId] = useState('uploaded-1');
  const [needsTag, setNeedsTag] = useState('ADHD · Perlu Fokus Singkat');
  const [secondaryTag, setSecondaryTag] = useState('');
  const [pedagogicalNotes, setPedagogicalNotes] = useState('');
  const [accentColor, setAccentColor] = useState<AccentColor>('blue');

  // Adaptive Preferences
  const [readingMode, setReadingMode] = useState<ReadingMode>('comfortable');
  const [sentenceThreshold, setSentenceThreshold] = useState(16);
  const [fontSize, setFontSize] = useState<FontSize>('large');
  const [bionicReading, setBionicReading] = useState(false);
  const [fontFamily, setFontFamily] = useState<StudentFontFamily>('standard');
  const [completionRate, setCompletionRate] = useState(0);

  // Inline Log Edit States
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editEvaluationText, setEditEvaluationText] = useState('');

  // New Manual Log Form State
  const [showAddLogForm, setShowAddLogForm] = useState(false);
  const [newMaterialTitle, setNewMaterialTitle] = useState('');
  const [newMaterialScore, setNewMaterialScore] = useState('');
  const [newMaterialCardCount, setNewMaterialCardCount] = useState(5);
  const [newMaterialAvgWords, setNewMaterialAvgWords] = useState(0);
  const [newMaterialEvaluation, setNewMaterialEvaluation] = useState('');

  useEffect(() => {
    if (student) {
      setName(student.name);
      setNickname(student.nickname);
      setGradeClass(student.gradeClass);
      setAvatarId(resolveAvatarId(student.avatarId));
      setNeedsTag(student.needsTag);
      setSecondaryTag(student.secondaryTag || '');
      setPedagogicalNotes(student.pedagogicalNotes);
      setAccentColor(student.accentColor);
      setReadingMode(student.preferences.readingMode);
      setSentenceThreshold(student.preferences.sentenceThreshold);
      setFontSize(student.preferences.fontSize);
      setBionicReading(student.preferences.bionicReading);
      setFontFamily(student.preferences.fontFamily);
      setCompletionRate(student.completionRate);
      setActiveTab(initialTab);
    } else {
      setName('');
      setNickname('');
      setGradeClass('Kelas 4A');
      setAvatarId('uploaded-1');
      setNeedsTag('Preferensi personal');
      setSecondaryTag('');
      setPedagogicalNotes('');
      setAccentColor('blue');
      setReadingMode('comfortable');
      setSentenceThreshold(16);
      setFontSize('large');
      setBionicReading(false);
      setFontFamily('standard');
      setCompletionRate(0);
      setActiveTab('pengaturan');
    }
    setShowAddLogForm(false);
    setEditingLogId(null);
  }, [student, isOpen, initialTab]);

  if (!isOpen) return null;

  // Filter logs for this specific student
  const studentLogs = logs.filter((l) => l.studentId === student?.id);

  // Calculate Progress Stats
  const assessedLogs = studentLogs.filter(l => l.comprehensionScore !== null);
  const totalSessions = studentLogs.length;
  const avgScore =
    assessedLogs.length > 0
      ? Math.round(assessedLogs.reduce((acc, l) => acc + (l.comprehensionScore ?? 0), 0) / assessedLogs.length)
      : null;
  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const savedStudent: StudentProfile = {
      id: student ? student.id : crypto.randomUUID(),
      name: name.trim(),
      nickname: nickname.trim() || name.trim().split(' ')[0],
      gradeClass: gradeClass.trim() || 'Kelas 4A',
      avatarId,
      needsTag: needsTag.trim() || 'Kebutuhan Khusus',
      secondaryTag: secondaryTag.trim() || undefined,
      pedagogicalNotes: pedagogicalNotes.trim(),
      accentColor,
      completionRate,
      lastSessionDate: student ? student.lastSessionDate : 'Hari ini',
      lastTopic: student ? student.lastTopic : 'Materi Pertama',
      preferences: {
        readingMode,
        sentenceThreshold: Number(sentenceThreshold),
        fontSize,
        bionicReading,
        fontFamily,
      },
    };

    if (onSave(savedStudent)) onClose();
  };

  const handleSaveEvaluation = (logId: string) => {
    if (!onUpdateLog) return;
    const updated = logs.map((l) =>
      l.id === logId ? { ...l, teacherEvaluation: editEvaluationText } : l
    );
    if(!onUpdateLog(updated))return;
    setEditingLogId(null);
  };

  const handleAddNewSessionLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !newMaterialTitle.trim() || !onAddLog) return;

    const newLog: Omit<ReadingSessionLog, 'id'> = {
      studentId: student.id,
      studentName: student.name,
      materialTitle: newMaterialTitle.trim(),
      date: new Date().toISOString(),
      formattedDate: 'Hari ini',
      cardCount: Number(newMaterialCardCount) || 5,
      avgWordsPerSentence: Number(newMaterialAvgWords),
      exercisesCompleted: 0,
      totalExercises: 0,
      comprehensionScore: newMaterialScore === '' ? null : Number(newMaterialScore),
      status: 'in_progress',
      teacherEvaluation:
        newMaterialEvaluation.trim() ||
        `Sesi dicatat guru. Lengkapi hasil pengerjaan setelah kegiatan.`,
    };

    if(!onAddLog(newLog))return;
    setNewMaterialTitle('');
    setNewMaterialEvaluation('');
    setShowAddLogForm(false);
  };

  const presetNeedsTags = [
    'ADHD · Perlu Fokus Singkat',
    'Disleksia · Font Dyslexie lokal / Arial',
    'Sensori Visual · Kontras Lembut',
    'Kecemasan Membaca · 1 Kartu',
    'Konsentrasi Dinamis · Bionic',
    'Kosakata · Glosarium Mandiri',
    'Pemrosesan Lambat · Butuh Jeda',
  ];

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="student-profile-rich-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="profile-modal-top-bar">
          <div className="top-bar-left">
            {student ? (
              <div className="student-modal-header-hero">
                <AvatarClay avatarId={student.avatarId} size={54} />
                <div>
                  <h2 className="student-hero-name">
                    {student.name} <span className="student-hero-class">({student.gradeClass})</span>
                  </h2>
                  <span className="student-hero-tag">{student.needsTag}</span>
                </div>
              </div>
            ) : (
              <div className="student-modal-header-hero">
                <div style={{
                  width: 54, height: 54, borderRadius: 18,
                  background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)',
                }}>
                  🎒
                </div>
                <div>
                  <h2 className="student-hero-name">Tambah Murid Bimbingan Baru</h2>
                  <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                    Daftarkan profil murid untuk mempersonalisasi materi bacaan LKPD.
                  </span>
                </div>
              </div>
            )}
          </div>

          <button type="button" className="modal-close-btn" onClick={onClose} title="Tutup">
            ✕
          </button>
        </div>

        {/* Tab Navigation if existing student */}
        {student && (
          <div className="profile-tabs-nav">
            <button
              type="button"
              className={`profile-tab-btn ${activeTab === 'perkembangan' ? 'active' : ''}`}
              onClick={() => setActiveTab('perkembangan')}
            >
              <span>📈 Detail Perkembangan & Riwayat Materi</span>
              {studentLogs.length > 0 && <span className="tab-count-pill">{studentLogs.length}</span>}
            </button>
            <button
              type="button"
              className={`profile-tab-btn ${activeTab === 'pengaturan' ? 'active' : ''}`}
              onClick={() => setActiveTab('pengaturan')}
            >
              <span>⚙️ Pengaturan Kebutuhan Khusus & Preferensi</span>
            </button>
          </div>
        )}

        {/* TAB 1: PERKEMBANGAN & RIWAYAT MATERI */}
        {student && activeTab === 'perkembangan' && (
          <div className="profile-tab-content perkembangan-content">
            {/* Quick Action Bar for this student */}
            <div className="student-quick-actions-banner">
              <div className="quick-actions-info">
                <strong>Aksi Pembelajaran {student.nickname}:</strong>
                <span>Mulai materi baru atau pilihan kenyamanan membaca siswa ini.</span>
              </div>
              <div className="quick-actions-buttons">
                {onCreateWorksheet && (
                  <button
                    type="button"
                    className="btn-action-highlight adaptasi"
                    onClick={() => {
                      onClose();
                      onCreateWorksheet(student);
                    }}
                  >
                    <span>⚡ Buat Bahan Bacaan Baru</span>
                  </button>
                )}
                {onRunComfortTest && (
                  <button
                    type="button"
                    className="btn-action-highlight comfort"
                    onClick={() => {
                      onClose();
                      onRunComfortTest(student);
                    }}
                  >
                    <span>🧪 Uji Gaya Baca</span>
                  </button>
                )}
                {onQuickExportPdf && (
                  <button
                    type="button"
                    className="btn-action-highlight pdf"
                    onClick={() => onQuickExportPdf(student)}
                  >
                    <span>📥 Unduh PDF</span>
                  </button>
                )}
              </div>
            </div>

            {/* 3 Overview Stat Cards */}
            <div className="student-stats-overview-grid">
              <div className="stat-metric-card">
                <span className="metric-icon">📚</span>
                <div className="metric-value">{totalSessions} Materi</div>
                <div className="metric-label">Total Sesi Baca / LKPD</div>
                <span className="metric-subtext">Tercatat di sistem</span>
              </div>

              <div className="stat-metric-card">
                <span className="metric-icon">⭐</span>
                <div className="metric-value">{avgScore === null ? 'Belum dinilai' : `${avgScore}%`}</div>
                <div className="metric-label">Rata-rata Nilai Latihan</div>
                <span className="metric-subtext">Dari latihan soal isian</span>
              </div>

              <div className="stat-metric-card">
                <span className="metric-icon">🎯</span>
                <div className="metric-value">{totalSessions ? Math.round(studentLogs.filter(l=>l.status==='completed').length/totalSessions*100) : 0}%</div>
                <div className="metric-label">Sesi dikonfirmasi selesai</div>
                <div className="progress-bar-wrap">
                  <div className="progress-fill" style={{ width: `${totalSessions ? Math.round(studentLogs.filter(l=>l.status==='completed').length/totalSessions*100) : 0}%` }} />
                </div>
              </div>

              <div className="stat-metric-card">
                <span className="metric-icon">📐</span>
                <div className="metric-value">{student.preferences.sentenceThreshold} kata</div>
                <div className="metric-label">Ambang Penanda Kalimat Panjang</div>
                <span className="metric-subtext">
                  {student.preferences.readingMode === 'focus' ? '🎯 Mode 1 Kartu' : '📑 Mode Semua Kartu'}
                </span>
              </div>
            </div>

            {/* Pedagogical Observations & Active Configuration */}
            <div className="pedagogical-notes-card">
              <div className="notes-card-header">
                <span style={{ fontSize: 20 }}>💡</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15 }}>Catatan Observasi Guru & Strategi Khusus</h4>
                  <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748b' }}>
                    Panduan pendampingan berdasarkan karakteristik belajar {student.nickname}.
                  </p>
                </div>
              </div>

              <p className="pedagogical-full-text">
                {student.pedagogicalNotes || 'Belum ada catatan observasi guru khusus.'}
              </p>

              <div className="student-active-config-chips">
                <span className="config-chip">
                  Ambang: <strong>Tandai di atas {student.preferences.sentenceThreshold} kata/kalimat</strong>
                </span>
                <span className="config-chip">
                  Font:{' '}
                  <strong>
                    {student.preferences.fontFamily === 'dyslexic' ? 'Dyslexie lokal / Arial (Ramah Huruf)' : 'Standar'}
                  </strong>
                </span>
                <span className="config-chip">
                  Ukuran Teks: <strong>{student.preferences.fontSize}</strong>
                </span>
                {student.preferences.bionicReading && (
                  <span className="config-chip bionic">
                    <b>B</b>ionic Reading: <strong>Aktif</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Materials History Timeline */}
            <div className="materials-history-section">
              <div className="materials-history-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: 17 }}>
                    📚 Riwayat Materi yang Pernah Diberikan ({studentLogs.length} Sesi)
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: 13, color: '#64748b' }}>
                    Daftar materi bacaan adaptif, hasil latihan, dan evaluasi perkembangan siswa.
                  </p>
                </div>

                {onAddLog && (
                  <button
                    type="button"
                    className="btn-add-session-log"
                    onClick={() => setShowAddLogForm((v) => !v)}
                  >
                    <span>{showAddLogForm ? '✕ Tutup Form' : '➕ Catat Materi Tambahan'}</span>
                  </button>
                )}
              </div>

              {/* Form to add a manual log entry */}
              {showAddLogForm && (
                <form onSubmit={handleAddNewSessionLog} className="add-log-inline-form">
                  <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>Catat Sesi / Materi Bacaan Baru</h4>
                  <div className="form-grid-row">
                    <div className="form-group" style={{ flex: 2 }}>
                      <label>Judul Materi Bacaan</label>
                      <input
                        type="text"
                        placeholder="Contoh: Metamorfosis Kupu-Kupu & Siklus Hidup"
                        value={newMaterialTitle}
                        onChange={(e) => setNewMaterialTitle(e.target.value)}
                        required
                        className="modal-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Nilai latihan (%) — opsional</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={newMaterialScore}
                        onChange={(e) => setNewMaterialScore(e.target.value)}
                        className="modal-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Jumlah Kartu</label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={newMaterialCardCount}
                        onChange={(e) => setNewMaterialCardCount(Number(e.target.value))}
                        className="modal-input"
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: 10 }}>
                    <label>Catatan Perkembangan / Respon Murid Terhadap Materi Ini</label>
                    <label>Rata-rata kata per kalimat (hasil analisis)<input type="number" min={0} step="0.01" value={newMaterialAvgWords} onChange={e=>setNewMaterialAvgWords(Number(e.target.value))}/></label>
                  <textarea
                      rows={2}
                      placeholder="Contoh: Sangat antusias membaca 5 kartu. Mampu menjawab soal isian dengan percaya diri..."
                      value={newMaterialEvaluation}
                      onChange={(e) => setNewMaterialEvaluation(e.target.value)}
                      className="modal-input"
                    />
                  </div>

                  <div className="form-actions-inline" style={{ marginTop: 12 }}>
                    <button type="submit" className="btn-save-new-log">
                      Simpan ke Riwayat Siswa
                    </button>
                    <button
                      type="button"
                      className="btn-cancel-new-log"
                      onClick={() => setShowAddLogForm(false)}
                    >
                      Batal
                    </button>
                  </div>
                </form>
              )}

              {/* Timeline Cards */}
              <div className="materials-timeline-list">
                {studentLogs.length > 0 ? (
                  studentLogs.map((log) => {
                    const isEditing = editingLogId === log.id;
                    const isHighScore = (log.comprehensionScore ?? 0) >= 80;

                    return (
                      <div className="material-timeline-item" key={log.id}>
                        <div className="timeline-item-header">
                          <div className="timeline-title-area">
                            <span className="material-book-icon">📖</span>
                            <div>
                              <h4 className="material-title-text">{log.materialTitle}</h4>
                              <span className="material-date-badge">📅 {log.formattedDate}</span>
                            </div>
                          </div>

                          <div className={`material-score-badge ${isHighScore ? 'high' : 'normal'}`}>
                            <span className="score-num">{log.comprehensionScore === null ? 'Belum dinilai' : `${log.comprehensionScore}%`}</span>
                            <span className="score-label">Nilai latihan</span>
                          </div>
                        </div>

                        {/* Material Technical Parameters */}
                        <div className="material-stats-chips">
                          <span className="chip-item">📑 {log.cardCount} Kartu Baca</span>
                          <span className="chip-item">📐 Rata-rata {log.avgWordsPerSentence} kata/kalimat</span>
                          <span className="chip-item">
                            ✍️ {log.exercisesCompleted} / {log.totalExercises} Soal Isian Tuntas
                          </span>
                          <span className="chip-item status">
                            {log.status === 'completed' ? '✅ Selesai' : '📄 Tercetak'}
                          </span>
                        </div>

                        {/* Teacher's Progress Note for this specific material */}
                        <div className="material-progress-note-box">
                          <div className="progress-note-head">
                            <span className="note-title">
                              📝 <strong>Catatan Perkembangan & Respon Siswa:</strong>
                            </span>
                            {onUpdateLog && <LogProgressEditor key={JSON.stringify(log)} log={log} onSave={changed=>onUpdateLog(logs.map(l=>l.id===changed.id?changed:l))}/>}
{!isEditing && onUpdateLog && (
                              <button
                                type="button"
                                className="btn-edit-eval-inline"
                                onClick={() => {
                                  setEditingLogId(log.id);
                                  setEditEvaluationText(log.teacherEvaluation);
                                }}
                              >
                                ✏️ Edit Catatan
                              </button>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="inline-eval-editor">
                              <textarea
                                rows={2}
                                value={editEvaluationText}
                                onChange={(e) => setEditEvaluationText(e.target.value)}
                                className="eval-textarea"
                              />
                              <div className="eval-editor-actions">
                                <button
                                  type="button"
                                  className="btn-eval-save"
                                  onClick={() => handleSaveEvaluation(log.id)}
                                >
                                  Simpan Catatan
                                </button>
                                <button
                                  type="button"
                                  className="btn-eval-cancel"
                                  onClick={() => setEditingLogId(null)}
                                >
                                  Batal
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="progress-note-body">
                              "{log.teacherEvaluation || 'Belum ada catatan khusus untuk materi ini.'}"
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-materials-state">
                    <span style={{ fontSize: 32 }}>📂</span>
                    <p style={{ margin: '6px 0 0', fontWeight: 600 }}>
                      Belum ada riwayat materi bacaan untuk {student.name}.
                    </p>
                    <p style={{ margin: '4px 0 14px', fontSize: 13, color: '#64748b' }}>
                      Klik tombol di bawah untuk membuat bahan bacaan adaptif pertama bagi murid ini!
                    </p>
                    {onCreateWorksheet && (
                      <button
                        type="button"
                        className="btn-action-highlight adaptasi"
                        onClick={() => {
                          onClose();
                          onCreateWorksheet(student);
                        }}
                      >
                        ⚡ Buat Materi Pertama Sekarang
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PENGATURAN KEBUTUHAN KHUSUS & FORM */}
        {(!student || activeTab === 'pengaturan') && (
          <form onSubmit={handleSubmit} className="student-modal-form">
            <div className="modal-two-columns">
              {/* Left Column: Avatar Selection Gallery */}
              <div className="avatar-selection-panel">
                <label className="section-label">Pilih avatar murid:</label>
                <div className="avatar-preview-current">
                  <AvatarClay avatarId={avatarId} size={110} />
                  <span className="current-avatar-name">
                    {AVATAR_PRESETS.find((p) => p.id === avatarId)?.name || 'Karakter'}
                  </span>
                </div>

                <div className="avatar-presets-grid">
                  {AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className={`avatar-preset-btn ${avatarId === preset.id ? 'selected' : ''}`}
                      aria-pressed={avatarId === preset.id}
                      onClick={() => setAvatarId(preset.id)}
                      title={`${preset.name}: ${preset.description}`}
                    >
                      <AvatarClay avatarId={preset.id} size={42} />
                      <span className="preset-tiny-label">{preset.name}</span>
                    </button>
                  ))}
                </div>

                {/* Accent Color Picker */}
                <div className="accent-color-picker">
                  <label className="section-label">Warna Aksen Kartu:</label>
                  <div className="accent-colors-row">
                    {(['blue', 'yellow', 'purple', 'green', 'pink'] as AccentColor[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`color-dot-btn ${c} ${accentColor === c ? 'selected' : ''}`}
                        onClick={() => setAccentColor(c)}
                        title={`Pilih warna aksen ${c}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Identity & Needs Inputs */}
              <div className="identity-inputs-panel">
                <div className="form-group">
                  <label htmlFor="student-name">Nama Lengkap Murid *</label>
                  <input
                    id="student-name"
                    type="text"
                    required
                    placeholder="Contoh: Michael Kopfler"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="modal-input"
                  />
                </div>

                <div className="form-row-two">
                  <div className="form-group">
                    <label htmlFor="student-nickname">Nama Panggilan</label>
                    <input
                      id="student-nickname"
                      type="text"
                      placeholder="Contoh: Michael"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="modal-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="student-grade">Kelas / Jenjang</label>
                    <input
                      id="student-grade"
                      type="text"
                      placeholder="Contoh: Kelas 4B"
                      value={gradeClass}
                      onChange={(e) => setGradeClass(e.target.value)}
                      className="modal-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="student-needs">Label Kebutuhan Khusus Utama *</label>
                  <input
                    id="student-needs"
                    type="text"
                    required
                    placeholder="Contoh: ADHD · Perlu Fokus Singkat"
                    value={needsTag}
                    onChange={(e) => setNeedsTag(e.target.value)}
                    className="modal-input"
                  />

                  {/* Preset Needs Badges */}
                  <div className="preset-needs-chips">
                    <span className="chips-label">Preset cepat:</span>
                    {presetNeedsTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className="preset-chip-btn"
                        onClick={() => {
                          setNeedsTag(tag);
                          if (tag.includes('ADHD') || tag.includes('Fokus')) {
                            setReadingMode('comfortable');
                            setSentenceThreshold(16);
                            setBionicReading(true);
                          } else if (tag.includes('Disleksia')) {
                            setFontFamily('dyslexic');
                            setFontSize('large');
                            setBionicReading(false);
                          } else if (tag.includes('Sensori')) {
                            setFontFamily('standard');
                            setFontSize('normal');
                            setSentenceThreshold(15);
                          }
                        }}
                      >
                        {tag.split('·')[0].trim()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="pedagogical-notes">
                    Catatan Strategi Pedagogis Guru
                  </label>
                  <textarea
                    id="pedagogical-notes"
                    rows={3}
                    placeholder="Contoh: Cenderung terdistraksi jika kalimat >16 kata. Berikan jeda tiap 2 kartu..."
                    value={pedagogicalNotes}
                    onChange={(e) => setPedagogicalNotes(e.target.value)}
                    className="modal-input textarea-pedagogy"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Section: Automatic Adaptive Preferences */}
            <div className="modal-adaptive-settings-box">
              <h3 className="settings-box-title">
                <span>⚙️</span> Pengaturan Adaptasi Otomatis Bahan Bacaan
              </h3>

              <div className="adaptive-controls-grid">
                {/* Ambang Kalimat Slider */}
                <div className="control-item">
                  <div className="slider-label-row">
                    <label htmlFor="sentence-threshold-slider">
                      Ambang Kalimat Panjang: <strong>{sentenceThreshold} kata</strong>
                    </label>
                  </div>
                  <input
                    id="sentence-threshold-slider"
                    type="range"
                    min={10}
                    max={25}
                    step={1}
                    value={sentenceThreshold}
                    onChange={(e) => setSentenceThreshold(Number(e.target.value))}
                    className="range-slider"
                  />
                  <div className="slider-hints">
                    <span>10 kata (penanda)</span>
                    <span>16 kata (penanda)</span>
                    <span>25 kata (penanda)</span>
                  </div>
                </div>

                {/* Mode Baca Kartu */}
                <div className="control-item">
                  <label>Mode Penyajian Kartu:</label>
                  <div className="radio-pills-row">
                    <button
                      type="button"
                      className={`radio-pill-btn ${readingMode === 'focus' ? 'active' : ''}`}
                      onClick={() => setReadingMode('focus')}
                    >
                      🎯 1 Kartu Fokus
                    </button>
                    <button
                      type="button"
                      className={`radio-pill-btn ${readingMode === 'comfortable' ? 'active' : ''}`}
                      onClick={() => setReadingMode('comfortable')}
                    >
                      📑 Tampilkan Semua
                    </button>
                  </div>
                </div>

                {/* Font Choice */}
                <div className="control-item">
                  <label>Pilihan Font Bacaan:</label>
                  <div className="radio-pills-row">
                    <button
                      type="button"
                      className={`radio-pill-btn ${fontFamily === 'standard' ? 'active' : ''}`}
                      onClick={() => setFontFamily('standard')}
                    >
                      Standar (Arial)
                    </button>
                    <button
                      type="button"
                      className={`radio-pill-btn ${fontFamily === 'dyslexic' ? 'active' : ''}`}
                      onClick={() => setFontFamily('dyslexic')}
                    >
                      📖 Dyslexie lokal / Arial
                    </button>
                  </div>
                </div>

                {/* Bionic Reading Toggle */}
                <div className="control-item">
                  <label>Bionic Reading eksperimental (Penebalan Awal Kata):</label>
                  <label className="toggle-switch-label">
                    <input
                      type="checkbox"
                      checked={bionicReading}
                      onChange={(e) => setBionicReading(e.target.checked)}
                      className="toggle-checkbox"
                    />
                    <span className="toggle-text">
                      {bionicReading ? 'Aktif (eksperimental)' : 'Nonaktif'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="modal-actions-footer">
              {student && onDelete && (
                <button
                  type="button"
                  className="btn-modal-delete"
                  onClick={() => {
                    if (confirm(`Yakin ingin menghapus profil murid "${student.name}"?`)) {
                      if(onDelete(student.id))onClose();
                    }
                  }}
                >
                  🗑️ Hapus Murid
                </button>
              )}

              <div className="actions-right" style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
                <button type="button" className="btn-modal-cancel" onClick={onClose}>
                  Batal
                </button>
                <button type="submit" className="btn-modal-save">
                  {student ? 'Simpan Perubahan' : 'Tambahkan Murid'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

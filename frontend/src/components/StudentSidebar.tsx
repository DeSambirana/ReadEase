import React, { useState } from 'react';
import { StudentProfile, TeacherQuickNote, ReadingSessionLog } from '../types/student';
import { AvatarClay } from './AvatarClay';

interface StudentSidebarProps {
  students: StudentProfile[];
  quickNotes: TeacherQuickNote[];
  readingLogs: ReadingSessionLog[];
  onAddQuickNote: (note: { studentId?: string; studentName?: string; content: string; tag?: string }) => boolean;
  onDeleteQuickNote: (id: string) => void;
  onSelectStudent: (student: StudentProfile) => void;
}

export function StudentSidebar({
  students,
  quickNotes,
  readingLogs,
  onAddQuickNote,
  onDeleteQuickNote,
  onSelectStudent,
}: StudentSidebarProps) {
  const [newNoteText, setNewNoteText] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [selectedTag, setSelectedTag] = useState<string>('Observasi');
  const [showNoteForm, setShowNoteForm] = useState(false);

  const recent = [...readingLogs].sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)).slice(0,5);
  const totalActive = new Set(readingLogs.filter(l=>Date.parse(l.date)>=Date.now()-7*86400000).map(l=>l.studentId)).size;
  const totalLogs = readingLogs.length;
  const assessed = readingLogs.filter(l=>l.status !== 'printed');
  const completed = assessed.filter(l=>l.status === 'completed').length;

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const targetStudent = students.find((s) => s.id === selectedStudentId);
    const saved = onAddQuickNote({
      studentId: targetStudent?.id,
      studentName: targetStudent ? targetStudent.name : 'Catatan Umum',
      content: newNoteText.trim(),
      tag: selectedTag,
    });

    if(!saved)return;
    setNewNoteText('');
    setShowNoteForm(false);
  };

  return (
    <aside className="student-sidebar-panel" aria-label="Perkembangan Siswa">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <h2 className="sidebar-title">
          Perkembangan Siswa <span className="title-trophy"></span>
        </h2>
        <span className="sidebar-subtitle">Aktivitas & Ketuntasan Belajar</span>
      </div>

      <div className="sidebar-progress-section">
        <h3>Aktivitas terbaru</h3>
        {!recent.length&&<p>Belum ada aktivitas. Tambahkan murid dan siapkan bacaan.</p>}
        {recent.map(log=>{const student=students.find(s=>s.id===log.studentId);return <div className="progress-student-row" key={log.id}>
          <AvatarClay avatarId={student?.avatarId||'clay-michael'} size={40}/><div>
          <button type="button" disabled={!student} onClick={()=>student&&onSelectStudent(student)}>{log.studentName}</button>
          <p>{log.materialTitle}</p><small>{log.status==='printed'?'PDF dibuat · belum dinilai':log.status==='completed'?'Selesai · catatan guru':'Sedang dikerjakan'} · {new Date(log.date).toLocaleDateString('id-ID')}</small>
          </div></div>;})}
      </div>
      <div className="sidebar-stats-banner">
        <div className="stat-box"><div className="stat-number">{totalActive}</div><div className="stat-label">Murid aktif 7 hari</div></div>
        <div className="stat-box"><div className="stat-number">{completed}/{assessed.length}</div><div className="stat-label">Sesi selesai / dicatat</div></div>
        <div className="stat-box"><div className="stat-number">{totalLogs}</div><div className="stat-label">Catatan sesi</div></div>
      </div>
      <p>Ekspor PDF tidak dihitung sebagai pemahaman atau penyelesaian tugas.</p>

      {/* Teacher's Quick Notes Section */}
      <div className="sidebar-notes-section">
        <div className="notes-header-row">
          <div className="notes-header-title">
            <span className="notes-icon"></span>
            <span>Catatan Cepat Guru</span>
          </div>
          <button
            type="button"
            className="btn-toggle-note-form"
            onClick={() => setShowNoteForm(!showNoteForm)}
          >
            {showNoteForm ? 'Tutup' : '＋ Catatan'}
          </button>
        </div>

        {/* Quick Note Add Form */}
        {showNoteForm && (
          <form onSubmit={handleSubmitNote} className="quick-note-form">
            <div className="form-group-sm">
              <label htmlFor="quick-note-student">Pilih Murid:</label>
              <select
                id="quick-note-student"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="select-sm"
              >
                <option value="">Catatan umum</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.gradeClass})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group-sm">
              <label htmlFor="quick-note-tag">Kategori:</label>
              <select
                id="quick-note-tag"
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="select-sm"
              >
                <option value="Observasi">Observasi Membaca</option>
                <option value="Fokus">Fokus & Atensi</option>
                <option value="Disleksia">Disleksia</option>
                <option value="Kecemasan">Kenyamanan Emosional</option>
                <option value="Apresiasi">Apresiasi Capaian</option>
              </select>
            </div>

            <div className="form-group-sm">
              <textarea
                placeholder="Tulis observasi perkembangan belajar..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                rows={3}
                className="textarea-sm"
                required
              />
            </div>

            <div className="form-actions-sm">
              <button type="submit" className="btn-save-note-sm">
                Simpan Catatan
              </button>
            </div>
          </form>
        )}

        {/* List of Recent Notes */}
        <div className="notes-list">
          {quickNotes.slice(0, 4).map((note) => (
            <div key={note.id} className="quick-note-card">
              <div className="note-card-top">
                <span className="note-student-badge">{note.studentName}</span>
                <span className="note-time">{note.createdAt}</span>
                <button
                  type="button"
                  className="note-delete-btn"
                  onClick={() => onDeleteQuickNote(note.id)}
                  title="Hapus catatan"
                >
                  ✕
                </button>
              </div>
              <p className="note-content-text">{note.content}</p>
              {note.tag && <span className="note-tag-pill">{note.tag}</span>}
            </div>
          ))}

          {quickNotes.length === 0 && (
            <p className="empty-notes-hint">
              Belum ada catatan observasi guru. Tekan <strong>+ Catatan</strong> untuk menambahkan.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}

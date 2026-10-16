import {useModalAccessibility} from '../useModalAccessibility';
import {LogProgressEditor} from './LogProgressEditor';
import { getStoredQuickNotes } from '../studentStorage';
import React, { useState, useEffect } from 'react';
import { ReadingSessionLog, StudentProfile } from '../types/student';
import { AvatarClay } from './AvatarClay';

interface ReadingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ReadingSessionLog[];
  students: StudentProfile[];
  selectedStudentFilter?: string | null;
  onUpdateLog?: (updatedLogs: ReadingSessionLog[]) => boolean;
}

export function ReadingHistoryModal({
  isOpen,
  onClose,
  logs,
  students,
  selectedStudentFilter = null,
  onUpdateLog,
}: ReadingHistoryModalProps) {
  useModalAccessibility(isOpen,onClose,'.modal-backdrop');
  const [filterStudentId, setFilterStudentId] = useState<string>(selectedStudentFilter || 'all');
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editEvaluationText, setEditEvaluationText] = useState('');

  useEffect(()=>{if(isOpen)setFilterStudentId(selectedStudentFilter||'all');},[isOpen,selectedStudentFilter]);
  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    if (filterStudentId === 'all') return true;
    return log.studentId === filterStudentId;
  });

  const handleStartEdit = (log: ReadingSessionLog) => {
    setEditingLogId(log.id);
    setEditEvaluationText(log.teacherEvaluation);
  };

  const handleSaveEvaluation = (logId: string) => {
    if (!onUpdateLog) return;
    const updated = logs.map((l) =>
      l.id === logId ? { ...l, teacherEvaluation: editEvaluationText } : l
    );
    if(!onUpdateLog(updated))return;
    setEditingLogId(null);
  };

  const handleExportData = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      students,
      logs,
      quickNotes: getStoredQuickNotes(),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aksarainklusi-data-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="history-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-text">
            <h2>
              Riwayat Pembelajaran & LKPD <span className="icon">📊</span>
            </h2>
            <p>Log adaptasi bacaan, hasil latihan, dan evaluasi berkala guru.</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} title="Tutup">
            ✕
          </button>
        </div>

        {/* Toolbar & Filter */}
        <div className="history-toolbar">
          <div className="history-filter-item">
            <label htmlFor="history-student-filter">Filter Menurut Murid:</label>
            <select
              id="history-student-filter"
              value={filterStudentId}
              onChange={(e) => setFilterStudentId(e.target.value)}
              className="select-field"
            >
              <option value="all">Semua Murid ({logs.length} sesi)</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.gradeClass})
                </option>
              ))}
            </select>
          </div>

          <div className="history-export-action">
            <button
              type="button"
              className="btn-export-json"
              onClick={handleExportData}
              title="Unduh backup data murid dan riwayat pembelajaran ke format JSON lokal"
            >
              <span>💾 Ekspor Backup JSON (Privat)</span>
            </button>
          </div>
        </div>

        {/* Logs List */}
        <div className="history-logs-container">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => {
              const student = students.find((s) => s.id === log.studentId);
              return (
                <div key={log.id} className="history-log-row">
                  <div className="log-avatar-col">
                    <AvatarClay avatarId={student?.avatarId || 'clay-michael'} size={52} />
                  </div>

                  <div className="log-details-col">
                    <div className="log-top-row">
                      <span className="log-student-name">{log.studentName}</span>
                      <span className="log-date">{log.formattedDate}</span>
                      <span className={`log-status-badge ${log.status}`}>
                        {log.status === 'completed' ? 'Selesai (catatan guru)' : log.status === 'printed' ? 'PDF dibuat · belum dinilai' : 'Sedang dikerjakan'}
                      </span>
                    </div>

                    <h4 className="log-material-title">{log.materialTitle}</h4>

                    <div className="log-metrics-chips">
                      <span className="log-chip">📑 {log.cardCount} Kartu Baca</span>
                      <span className="log-chip">
                        📐 Rata-rata {log.avgWordsPerSentence} kata/kalimat
                      </span>
                      <span className="log-chip">
                        ✍️ {log.exercisesCompleted} / {log.totalExercises} Soal Isian
                      </span>
                      <span className="log-chip-score">
                        ⭐ Skor: {log.comprehensionScore === null ? 'Belum dinilai' : `${log.comprehensionScore}%`}
                      </span>
                    </div>

                    {onUpdateLog && <LogProgressEditor key={JSON.stringify(log)} log={log} onSave={changed=>onUpdateLog(logs.map(l=>l.id===changed.id?changed:l))}/>}
{/* Teacher Evaluation Note */}
                    <div className="log-eval-box">
                      {editingLogId === log.id ? (
                        <div className="eval-edit-area">
                          <textarea
                            rows={2}
                            value={editEvaluationText}
                            onChange={(e) => setEditEvaluationText(e.target.value)}
                            className="textarea-eval-edit"
                          />
                          <div className="eval-edit-actions">
                            <button
                              type="button"
                              className="btn-cancel-sm"
                              onClick={() => setEditingLogId(null)}
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              className="btn-save-sm"
                              onClick={() => handleSaveEvaluation(log.id)}
                            >
                              Simpan Evaluasi
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="eval-display-area">
                          <span className="eval-label">Evaluasi Guru:</span>
                          <span className="eval-text">
                            {log.teacherEvaluation || 'Belum ada catatan evaluasi khusus.'}
                          </span>
                          <button
                            type="button"
                            className="btn-edit-eval"
                            onClick={() => handleStartEdit(log)}
                            title="Edit evaluasi guru"
                          >
                            ✏️ Edit
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-history-state">
              <span className="empty-icon">📂</span>
              <p>Belum ada riwayat lembar baca untuk filter murid ini.</p>
            </div>
          )}
        </div>

        {/* Footer info about local privacy */}
        <div className="modal-footer-info">
          <span className="lock-icon">🔒</span>
          <span>
            Profil dan catatan riwayat tersimpan pada server untuk akun guru ini. Cadangan JSON berisi data pribadi; simpan dengan hati-hati.
            Nama, kelas, dan catatan cetak dikirim sementara ke backend saat membuat PDF.
          </span>
        </div>
      </div>
    </div>
  );
}

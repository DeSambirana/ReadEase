import { apiFetch, apiError } from './api';
import React, { useState } from 'react';
import { worksheetSchema, type Draft } from './draft';
import { config } from './config';

// Friendly Indonesian terms for parts of speech
const posFriendly: Record<string, string> = {
  nomina: 'Kata Benda',
  verba: 'Kata Kerja',
  adjektiva: 'Kata Sifat',
  numeralia: 'Angka',
  pronomina: 'Kata Ganti',
  adverbia: 'Keterangan',
};

export function Worksheet({
  draft: d,
  update,
  busy,
  setBusy,
}: {
  draft: Draft;
  update: (v: Partial<Draft>) => void;
  busy: boolean;
  setBusy: (v: boolean) => void;
}) {
  const [error, setError] = useState('');
  const result = d.result;
  if (!result) return null;

  async function generate(loadOnly = false) {
    if (!result) return;
    setBusy(true);
    setError('');
    const selections = loadOnly
      ? []
      : (d.worksheet?.candidates ?? [])
          .filter((c) => d.worksheetSelections.includes(c.id))
          .map((c) => ({
            source_sentence_id: c.source_sentence_id,
            keyword: c.keyword,
            start: c.start,
          }));
    try {
      const response = await apiFetch('/api/worksheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document: result.document, selections }),
      });
      if (!response.ok) {
        setError(await apiError(response, 'Pilihan kata tidak valid. Muat ulang pilihan kata.'));
        return;
      }
      const data = worksheetSchema.parse(await response.json());
      update({
        worksheet: {
          candidates: data.candidates,
          warnings: data.warnings,
          is_example: data.is_example,
        },
        worksheetSelections: loadOnly ? [] : d.worksheetSelections,
        result: { ...result, exercises: data.exercises },
      });
    } catch {
      setError('Soal gagal dibuat. Periksa koneksi dan pilihan kata, lalu coba lagi.');
    } finally {
      setBusy(false);
    }
  }

  function select(id: string, checked: boolean) {
    if (!result) return;
    update({
      worksheetSelections: checked
        ? [...d.worksheetSelections, id]
        : d.worksheetSelections.filter((v) => v !== id),
      result: { ...result, exercises: [] },
    });
  }

  const selectedCount = d.worksheetSelections.length;
  const maxExercises = config.worksheet_max_exercises;
  const hasLoadedCandidates = !!d.worksheet;
  const exercises = result.exercises || [];

  return (
    <section aria-label="Soal isian" className="worksheet-section-card">
      {/* Title Header */}
      <div className="section-title-wrap">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🎯</span>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>Pembuat Soal Latihan (Kalimat Rumpang / Titik-Titik)</h2>
            <p className="section-subtitle" style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13.5 }}>
              Pilih kata penting dari bacaan untuk dikosongkan <code>( . . . . . )</code>. Soal latihan dan kunci jawaban otomatis tersusun dan siap dicetak ke lembar kerja siswa (LKPD).
            </p>
          </div>
        </div>
      </div>

      {/* Button to detect candidate words if not yet loaded */}
      {!hasLoadedCandidates && (
        <div className="empty-candidates-cta">
          <p>
            Sistem dapat mendeteksi kata-kata kunci (kata benda, nama tempat, istilah penting) dari teks bacaan yang cocok untuk dijadikan soal isian.
          </p>
          <button
            type="button"
            className="btn-primary-action"
            disabled={busy}
            onClick={() => void generate(true)}
          >
            <span>🔍 Temukan Pilihan Kata Kunci Bacaan</span>
          </button>
        </div>
      )}

      {error && <p role="alert" className="error-banner">{error}</p>}

      {/* When candidates are available */}
      {hasLoadedCandidates && (
        <div className="worksheet-builder-box">
          <div className="builder-header-bar">
            <div>
              <h3 style={{ margin: 0, fontSize: 16 }}>Pilih Kata untuk Dikosongkan:</h3>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
                Centang maksimal {maxExercises} kata kunci di bawah.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div className="selection-counter-badge">
                <span>{selectedCount === maxExercises ? '🎯' : '✏️'}</span>
                <span>
                  <strong>{selectedCount}</strong> dari {maxExercises} kata
                </span>
              </div>

              {selectedCount > 0 && (
                <button
                  type="button"
                  className="btn-create-worksheet-compact"
                  disabled={busy}
                  onClick={() => void generate()}
                >
                  <span>✨ Buat Soal Sekarang ({selectedCount})</span>
                </button>
              )}
            </div>
          </div>

          {(d.worksheet?.warnings ?? []).length > 0 && (
            <div className="proposal-warnings-box" style={{ marginBottom: 16 }}>
              {d.worksheet?.warnings.map((w) => (
                <span role="status" key={w} className="warning-item">
                  ⚠️ {w}
                </span>
              ))}
            </div>
          )}

          {/* Sentence by Sentence Keyword Selection */}
          <div className="sentence-keywords-list">
            {result.document.sentences.map((s, sentenceIdx) => {
              const candidates =
                d.worksheet?.candidates.filter((c) => c.source_sentence_id === s.id) ?? [];
              if (candidates.length === 0) return null;

              return (
                <div key={s.id} className="sentence-keyword-card">
                  <div className="sentence-keyword-head">
                    <span className="sentence-badge">Kalimat #{sentenceIdx + 1}</span>
                    <p className="sentence-full-text">"{s.text}"</p>
                  </div>

                  <div className="keyword-chips-row">
                    {candidates.map((c) => {
                      const isChecked = d.worksheetSelections.includes(c.id);
                      const isMaxReached = !isChecked && selectedCount >= maxExercises;
                      const posLabel = posFriendly[c.part_of_speech] || c.part_of_speech;

                      return (
                        <label
                          key={c.id}
                          className={`keyword-chip-label ${isChecked ? 'selected' : ''} ${
                            isMaxReached ? 'disabled' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={busy || isMaxReached}
                            onChange={(e) => select(c.id, e.target.checked)}
                          />
                          <span className="chip-word">{c.keyword}</span>
                          <span className="chip-pos">({posLabel})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Row */}
          <div className="builder-bottom-actions">
            <button
              type="button"
              className="btn-create-worksheet"
              disabled={busy || selectedCount === 0}
              onClick={() => void generate()}
            >
              <span>✨</span>
              <span>
                {busy
                  ? 'Menyusun Soal...'
                  : selectedCount === 0
                  ? 'Pilih Minimal 1 Kata di Atas'
                  : `Buat ${selectedCount} Soal Isian Sekarang →`}
              </span>
            </button>

            <button
              type="button"
              className="btn-reload-keywords"
              disabled={busy}
              onClick={() => void generate(true)}
              title="Perbarui daftar kata jika Anda baru saja mengubah teks bacaan"
            >
              🔄 Muat Ulang Pilihan Kata
            </button>
          </div>
        </div>
      )}

      {/* Generated Exercises Review */}
      {exercises.length > 0 && (
        <div className="exercises-review-section">
          <div className="review-exercises-header">
            <div>
              <h3 style={{ margin: 0, fontSize: 17 }}>📋 Pratinjau Soal Latihan & Kunci Jawaban</h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                Berikut soal isian yang akan dicetak di lembar kerja siswa beserta kunci jawaban untuk guru.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div className="reviewed-count-pill" role="status">
                <span>{exercises.filter((e) => e.reviewed).length === exercises.length ? '✅' : '⏳'}</span>
                <span>
                  {exercises.filter((e) => e.reviewed).length} dari {exercises.length} soal sudah ditinjau
                </span>
              </div>
              {exercises.some((e) => !e.reviewed) && (
                <button
                  type="button"
                  style={{ background: '#059669', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                  onClick={() =>
                    update({
                      result: {
                        ...result,
                        exercises: result.exercises.map((item) => ({ ...item, reviewed: true })),
                      },
                    })
                  }
                >
                  ✓ Setujui Semua Soal
                </button>
              )}
            </div>

          </div>

          <div className="exercises-cards-grid">
            {exercises.map((e, i) => {
              const sourceSentence = result.document.sentences.find(
                (s) => s.id === e.source_sentence_id
              )?.text;

              return (
                <div className={`exercise-card-item ${e.reviewed ? 'is-reviewed' : ''}`} key={e.id}>
                  <div className="exercise-card-top">
                    <span className="exercise-num-badge">Soal #{i + 1}</span>
                    <span className="exercise-tag">Latihan Kalimat Rumpang</span>
                  </div>

                  <div className="exercise-body">
                    <div className="exercise-question-box">
                      <div className="box-title">📝 Teks di Lembar Siswa:</div>
                      <p className="blank-question-text" data-testid="blank-text">
                        {e.blank_text}
                      </p>
                    </div>

                    <div className="exercise-answer-box">
                      <div className="box-title">🔑 Kunci Jawaban:</div>
                      <strong className="answer-highlight" data-testid="answer">
                        {e.answer}
                      </strong>
                    </div>

                    {sourceSentence && (
                      <details className="source-details">
                        <summary>Lihat kalimat asli cerita</summary>
                        <p className="source-quote">{sourceSentence}</p>
                      </details>
                    )}
                  </div>

                  <div className="exercise-review-check">
                    <label className="checkbox-reviewed">
                      <input
                        type="checkbox"
                        disabled={busy}
                        checked={e.reviewed}
                        onChange={(event) =>
                          update({
                            result: {
                              ...result,
                              exercises: result.exercises.map((item) =>
                                item.id === e.id ? { ...item, reviewed: event.target.checked } : item
                              ),
                            },
                          })
                        }
                      />
                      <span>Saya sudah meninjau soal dan kunci ini ✓</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="worksheet-ready-banner">
            <span>🖨️</span>
            <div>
              <strong>Soal siap digunakan!</strong>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#047857' }}>
                Gulir ke bawah ke bagian <strong>Profil Cetak Lembar Kerja</strong> untuk langsung mengunduh LKPD PDF A4 siap print.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import type { Draft } from '../draft';
import { StudentProfile } from '../types/student';
import { BionicText } from '../BionicText';
import { AvatarClay } from './AvatarClay';
import { fontFamilies } from '../fonts';

interface AdaptivePreviewCardsProps {
  draft: Draft;
  student: StudentProfile | null;
  onExportPdf?: () => void;
  busy?: boolean;
}

/**
 * Shows a card-based preview of adapted text using the student's specific
 * reading preferences (Bionic, Dyslexie lokal / Arial, focus mode, etc.)
 * Lets the teacher visually review the material before PDF export.
 * Clicking a card immediately advances to the next card for seamless review.
 */
export function AdaptivePreviewCards({
  draft,
  student,
  onExportPdf,
  busy = false,
}: AdaptivePreviewCardsProps) {
  const result = draft.result;
  if (!result || !result.cards.length) return null;

  const [viewedCards, setViewedCards] = useState<Set<string>>(new Set());
  const [focusIndex, setFocusIndex] = useState(0);
  const [showAllCards, setShowAllCards] = useState(false);
  const [justAdvanced, setJustAdvanced] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation for card review
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only capture when preview section is somewhat in view
      const activeEl = document.activeElement;
      if (!previewRef.current?.contains(activeEl) || activeEl?.closest('button,input,textarea,select,[role=dialog]')) return;

      if (!showAllCards) {
        if (e.key === 'ArrowRight' || e.key === ' ') {
          if (focusIndex < result.cards.length - 1) {
            e.preventDefault();
            handleCardClick(result.cards[focusIndex].id);
          }
        } else if (e.key === 'ArrowLeft') {
          if (focusIndex > 0) {
            e.preventDefault();
            setFocusIndex((prev) => Math.max(0, prev - 1));
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusIndex, showAllCards, result.cards]);

  // Determine student-specific display settings
  const isADHD = student?.needsTag?.toLowerCase().includes('adhd') || false;
  const isDyslexia =
    student?.needsTag?.toLowerCase().includes('disleksia') ||
    student?.preferences?.fontFamily === 'dyslexic' ||
    false;
  const isBionicEnabled = draft.preferences.bionic;
  const isFocusMode = draft.mode === 'focus';
  const getFontFamily = () => fontFamilies[draft.preferences.fontFamily];
  const getFontSize = () => draft.preferences.fontSize;
  const getLetterSpacing = () => draft.preferences.letterSpacing;
  const getWordSpacing = () => draft.preferences.wordSpacing;
  const getLineHeight = () => draft.preferences.lineHeight;

  const previewStyle: React.CSSProperties = {
    fontFamily: getFontFamily(),
    fontSize: getFontSize(),
    letterSpacing: getLetterSpacing(),
    wordSpacing: getWordSpacing(),
    lineHeight: getLineHeight(),
  };

  const totalCards = result.cards.length;
  const currentCard = result.cards[Math.min(focusIndex, totalCards - 1)];

  // Cards to show
  const cardsToShow = isFocusMode && !showAllCards
    ? [currentCard]
    : result.cards;

  const allViewed = result.cards.every((c) => viewedCards.has(c.id));

  const handleMarkViewed = (cardId: string) => {
    setViewedCards((prev) => new Set([...prev, cardId]));
  };

  // Immediate Click to Next action
  const handleCardClick = (cardId: string) => {
    handleMarkViewed(cardId);

    if (!showAllCards) {
      if (focusIndex < totalCards - 1) {
        setJustAdvanced(true);
        setTimeout(() => setJustAdvanced(false), 250);
        setFocusIndex((prev) => prev + 1);
      }
    }
  };

  const handleMarkAllViewed = () => {
    const allIds = new Set(result.cards.map((c) => c.id));
    setViewedCards(allIds);
  };

  // Determine special profile badge info
  const getProfileInfo = () => {
    if (isADHD)
      return {
        label: 'ADHD · Fokus Singkat',
        color: '#FEF3C7',
        textColor: '#92400E',
        icon: '🎯',
        desc: 'Mode fokus menampilkan satu kartu per layar, tanpa mengubah isi kalimat.',
      };
    if (isDyslexia)
      return {
        label: 'Disleksia · Font Ramah Huruf',
        color: '#E0F2FE',
        textColor: '#0369A1',
        icon: '📖',
        desc: 'Dyslexie digunakan jika tersedia di perangkat; alternatifnya Arial. Pengaturan dapat diubah.',
      };
    return {
      label: 'Format Kartu Nyaman',
      color: '#F3E8FF',
      textColor: '#6B21A8',
      icon: '✨',
      desc: 'Teks dibagi menjadi kartu-kartu kecil agar murid tidak lelah membaca paragraf panjang.',
    };
  };

  const profileInfo = getProfileInfo();

  return (
    <section className="adaptive-preview-section" ref={previewRef} aria-label="Pratinjau Kartu Baca">
      {/* Section Header */}
      <div className="adaptive-preview-header">
        <div className="preview-title-row">
          <div className="preview-title-badge">
            <span className="icon" style={{ fontSize: 26 }}>🎴</span>
            <div>
              <h2 style={{ fontSize: 20, margin: 0 }}>Pratinjau Kartu Baca Murid</h2>
              <p className="preview-desc" style={{ marginTop: 4 }}>
                Pratinjau tampilan di layar. PDF memakai profil cetak hitam-putih dengan font tetap. <strong>Klik kartu untuk langsung lanjut ke kartu berikutnya!</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Student Profile Badge */}
      {student && (
        <div
          className="preview-profile-badge"
          style={{ backgroundColor: profileInfo.color, color: profileInfo.textColor }}
        >
          <div className="profile-badge-left">
            <AvatarClay avatarId={student.avatarId} size={48} />
            <div className="profile-badge-info">
              <div className="profile-badge-name">
                <span className="profile-icon">{profileInfo.icon}</span>
                <strong>{student.name}</strong>
                <span className="profile-class">({student.gradeClass})</span>
              </div>
              <div className="profile-badge-label">{profileInfo.label}</div>
              <div className="profile-badge-desc">{profileInfo.desc}</div>
            </div>
          </div>
          <div className="profile-badge-features">
            {isBionicEnabled && (
              <span className="feature-pill bionic-pill">
                <b>B</b>ionic Reading ✓
              </span>
            )}
            {isDyslexia && (
              <span className="feature-pill dyslexia-pill">Dyslexie lokal / Arial ✓</span>
            )}
            {isFocusMode && (
              <span className="feature-pill focus-pill">Mode 1 Kartu ✓</span>
            )}
            <span className="feature-pill threshold-pill">
              Penanda kalimat panjang: &gt;{student.preferences.sentenceThreshold} kata
            </span>
          </div>
        </div>
      )}

      {/* View Mode Toggle & Interactive Progress */}
      <div className="preview-mode-toggle">
        <div className="mode-toggle-row">
          <button
            type="button"
            className={`mode-btn ${!showAllCards ? 'active' : ''}`}
            onClick={() => setShowAllCards(false)}
          >
            🎯 Mode Fokus (Satu per Satu)
          </button>
          <button
            type="button"
            className={`mode-btn ${showAllCards ? 'active' : ''}`}
            onClick={() => setShowAllCards(true)}
          >
            📑 Tampilkan Semua Kartu
          </button>
        </div>

        <div className="view-progress">
          <span className="viewed-count" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{viewedCards.size === totalCards ? '✅' : '👀'}</span>
            <strong>{viewedCards.size} dari {totalCards}</strong> kartu selesai ditinjau
          </span>
          <div className="progress-bar-mini" style={{ width: 100 }}>
            <div
              className="progress-fill-mini"
              style={{
                width: `${(viewedCards.size / totalCards) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Focus Mode Card Stepper & Navigation */}
      {!showAllCards && (
        <div className="focus-nav-bar-enhanced">
          <div className="focus-nav-left">
            <button
              type="button"
              disabled={focusIndex === 0}
              className="focus-nav-btn prev-btn"
              onClick={() => setFocusIndex((i) => Math.max(0, i - 1))}
              title="Kembali ke kartu sebelumnya (atau panah kiri)"
            >
              ← Sebelumnya
            </button>
          </div>

          {/* Dot / Pill Stepper */}
          <div className="card-pill-stepper" title="Klik nomor kartu untuk langsung lompat">
            {result.cards.map((c, i) => {
              const isCurrent = i === focusIndex;
              const isChecked = viewedCards.has(c.id);
              return (
                <button
                  type="button"
                  key={c.id}
                  className={`stepper-dot ${isCurrent ? 'active' : ''} ${isChecked ? 'done' : ''}`}
                  onClick={() => setFocusIndex(i)}
                  aria-label={`Buka kartu ${i + 1}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <div className="focus-nav-right">
            <button
              type="button"
              disabled={focusIndex >= totalCards - 1}
              className="focus-nav-btn next-btn"
              onClick={() => {
                handleMarkViewed(result.cards[focusIndex].id);
                setFocusIndex((i) => Math.min(totalCards - 1, i + 1));
              }}
              title="Lanjut ke kartu berikutnya (atau panah kanan / spasi)"
            >
              Berikutnya →
            </button>
          </div>
        </div>
      )}

      {/* Cards Preview Container */}
      <div className={`preview-cards-container ${showAllCards ? 'all-mode' : 'focus-mode'}`}>
        {cardsToShow.map((card, idx) => {
          const isViewed = viewedCards.has(card.id);
          const cardIndex = showAllCards ? idx : focusIndex;
          const isLastCard = cardIndex === totalCards - 1;
          const wordCount = card.adapted_text
            .split(/\s+/u)
            .filter((t) => /[\p{L}\p{N}]/u.test(t)).length;

          return (
            <article
              key={card.id}
              className={`preview-card enhanced-card ${isViewed ? 'viewed' : ''} ${
                isADHD ? 'adhd-card' : ''
              } ${isDyslexia ? 'dyslexia-card' : ''} ${justAdvanced ? 'pulse-advance' : ''}`}
              onClick={() => handleCardClick(card.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick(card.id);
                }
              }}
              title="Klik pada kartu untuk lanjut ke kartu berikutnya!"
            >
              {/* Card Number Badge */}
              <div className="card-num-badge">
                <span>{cardIndex + 1}</span>
              </div>

              {/* Status & Click-to-Next Prompt */}
              <div className="card-header-prompts">
                <div className={`card-viewed-check ${isViewed ? 'checked' : ''}`}>
                  {isViewed ? '✓ Sudah ditinjau' : '○ Belum ditinjau'}
                </div>

                {!showAllCards && (
                  <div className="click-next-hint-chip">
                    {isLastCard ? (
                      <span>🎉 Kartu Terakhir! (Klik untuk tandai selesai)</span>
                    ) : (
                      <span>👆 <strong>Klik kartu</strong> untuk lanjut ke kartu {cardIndex + 2} →</span>
                    )}
                  </div>
                )}
              </div>

              {/* Card text with Bionic + appropriate font */}
              <div className="card-text-preview" style={previewStyle}>
                <BionicText text={card.adapted_text} enabled={isBionicEnabled} />
              </div>

              {/* Card metadata row */}
              <div className="card-meta-row">
                <span className="meta-word-count">
                  📏 {wordCount} kata
                </span>
                {(card.flagged_terms ?? []).length > 0 && (
                  <span className="meta-terms">
                    🔑 Istilah: {(card.flagged_terms ?? []).join(', ')}
                  </span>
                )}
                {(card.warnings ?? []).length > 0 && (
                  <span className="meta-warning">
                    💡 {(card.warnings ?? []).join('; ')}
                  </span>
                )}
              </div>

              {/* Visual features indicators */}
              <div className="card-features-row">
                {isBionicEnabled && (
                  <span className="card-feature-chip bionic">
                    <b>B</b>ionic Focus
                  </span>
                )}
                {isDyslexia && (
                  <span className="card-feature-chip dyslexia">Dyslexie lokal / Arial</span>
                )}
                {isADHD && (
                  <span className="card-feature-chip adhd">Kartu Ringkas</span>
                )}
                {!showAllCards && (
                  <span className="card-feature-chip click-hint">
                    Klik untuk Lanjut ⏩
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Completion Banner if all cards viewed */}
      {allViewed && (
        <div className="preview-completion-card">
          <div className="completion-icon">🌟</div>
          <div className="completion-text">
            <h4>Semua {totalCards} Kartu Selesai Ditinjau!</h4>
            <p>Materi bacaan sudah siap dicetak atau dipakai belajar murid.</p>
          </div>
          {onExportPdf && (
            <button
              type="button"
              className="btn-quick-pdf-completion"
              disabled={busy}
              onClick={onExportPdf}
            >
              📥 Unduh LKPD PDF Sekarang
            </button>
          )}
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="preview-action-bar">
        {!allViewed && (
          <button
            type="button"
            className="btn-mark-all-viewed"
            onClick={handleMarkAllViewed}
          >
            ✓ Tandai Semua Kartu Selesai Ditinjau
          </button>
        )}

        <div className="export-status-row" style={{ marginLeft: 'auto' }}>
          {allViewed ? (
            <div className="export-ready-badge">
              <span>✅</span>
              <span>Siap Dicetak ke PDF A4</span>
            </div>
          ) : (
            <div className="export-pending-badge">
              <span>📋</span>
              <span>Tinjau {totalCards - viewedCards.size} kartu lagi</span>
            </div>
          )}
        </div>

        {onExportPdf && (
          <button
            type="button"
            className="btn-export-pdf-preview"
            disabled={busy}
            onClick={onExportPdf}
          >
            <span>📥</span>
            <span>
              Unduh PDF A4 {student ? `(${student.nickname})` : ''}
            </span>
          </button>
        )}
      </div>
    </section>
  );
}

import {useModalAccessibility} from '../useModalAccessibility';
import React, { useState, useEffect, useRef } from 'react';
import { StudentProfile } from '../types/student';
import { BionicText } from '../BionicText';
import { AvatarClay } from './AvatarClay';
import { fontFamilies } from '../fonts';

// ============================================================================
// Uji Kenyamanan Baca (Reading Comfort Assessment)
// Interactive assessment to determine optimal reading settings for each student
// ============================================================================

interface ReadingComfortTestProps {
  isOpen: boolean;
  student: StudentProfile | null;
  onClose: () => void;
  onSaveResults: (student: StudentProfile, results: ComfortTestResults) => boolean;
}

export interface ComfortTestResults {
  preferredStyle: 'normal' | 'bionic' | 'dyslexic';
  preferredStyleLabel: string;
  comfortRatings: { style: string; rating: number }[];
  comprehensionAnswers: {
    questionId: string;
    correct: boolean;
    timeSpentSeconds: number;
  }[];
  totalReadingTimeSeconds: number;
  avgComprehensionTimeSeconds: number;
  comprehensionAccuracy: number;
  averageWordsPerSentence: number;
  recommendations: string[];
  testDate: string;
}

// Short reading passages for testing (2 paragraphs each, age-appropriate)
const TEST_PASSAGES = [
  {
    id: 'passage-1',
    text: 'Kupu-kupu mempunyai empat sayap yang ditutupi sisik halus. Sisik itulah yang memberi warna indah pada sayapnya. Saat terbang, kupu-kupu mengepakkan sayapnya sekitar 5 sampai 12 kali per detik. Kecepatannya lebih lambat daripada lebah, tetapi gerakannya tampak lebih anggun di udara.',
    questions: [
      {
        id: 'q1a',
        text: 'Apa yang menutupi sayap kupu-kupu?',
        options: ['Bulu halus', 'Sisik halus', 'Serbuk sari', 'Lapisan lilin'],
        correctIndex: 1,
      },
      {
        id: 'q1b',
        text: 'Berapa kali per detik kupu-kupu mengepakkan sayapnya?',
        options: ['1 sampai 3 kali', '5 sampai 12 kali', '20 sampai 30 kali', '50 kali'],
        correctIndex: 1,
      },
    ],
  },
  {
    id: 'passage-2',
    text: 'Air hujan yang jatuh ke tanah tidak langsung hilang. Sebagian air meresap ke dalam tanah dan menjadi air tanah. Sebagian lagi mengalir di permukaan menuju sungai dan danau. Dari sana, air menguap ke udara karena panas matahari. Uap air kemudian naik dan membentuk awan.',
    questions: [
      {
        id: 'q2a',
        text: 'Apa yang terjadi pada sebagian air hujan yang jatuh ke tanah?',
        options: [
          'Langsung menguap',
          'Meresap menjadi air tanah',
          'Berubah menjadi es',
          'Diserap oleh pohon',
        ],
        correctIndex: 1,
      },
      {
        id: 'q2b',
        text: 'Mengapa air di sungai dan danau bisa menguap?',
        options: ['Karena angin kencang', 'Karena panas matahari', 'Karena tekanan udara', 'Karena pasang surut'],
        correctIndex: 1,
      },
    ],
  },
  {
    id: 'passage-3',
    text: 'Semut hidup dalam kelompok besar yang disebut koloni. Di dalam koloni, setiap semut memiliki tugas berbeda. Ratu semut bertugas bertelur, sedangkan semut pekerja mencari makanan. Semut berkomunikasi menggunakan bahan kimia yang disebut feromon. Mereka meninggalkan jejak feromon di jalan agar semut lain bisa mengikuti.',
    questions: [
      {
        id: 'q3a',
        text: 'Apa tugas ratu semut dalam koloni?',
        options: ['Mencari makanan', 'Bertelur', 'Menjaga sarang', 'Memimpin pasukan'],
        correctIndex: 1,
      },
      {
        id: 'q3b',
        text: 'Bagaimana semut berkomunikasi satu sama lain?',
        options: ['Dengan suara', 'Dengan gerakan', 'Dengan feromon', 'Dengan cahaya'],
        correctIndex: 2,
      },
    ],
  },
];

type Phase = 'intro' | 'style-compare' | 'reading-test' | 'results';
type StyleKey = 'normal' | 'bionic' | 'dyslexic';

const STYLE_LABELS: Record<StyleKey, string> = {
  normal: 'Standar (Normal)',
  bionic: 'Bionic Reading',
  dyslexic: 'Font Ramah Disleksia',
};

const STYLE_DESCRIPTIONS: Record<StyleKey, string> = {
  normal: 'Teks biasa dengan font Arial standar tanpa efek khusus.',
  bionic: 'Bagian awal setiap kata ditebalkan untuk membantu mata mengikuti alur baca.',
  dyslexic: 'Font khusus dengan spasi lebih lebar, ukuran lebih besar, dan jarak baris yang lebih lapang.',
};

export function ReadingComfortTest({
  isOpen,
  student,
  onClose,
  onSaveResults,
}: ReadingComfortTestProps) {
  useModalAccessibility(isOpen,onClose,'.comfort-test-overlay');
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentStyleIndex, setCurrentStyleIndex] = useState(0);
  const [comfortRatings, setComfortRatings] = useState<Record<StyleKey, number>>({
    normal: 0,
    bionic: 0,
    dyslexic: 0,
  });
  const [preferredStyle, setPreferredStyle] = useState<StyleKey | null>(null);

  // Reading test state
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isReading, setIsReading] = useState(true);
  const [readingStartTime, setReadingStartTime] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [totalReadingTime, setTotalReadingTime] = useState(0);
  const [comprehensionAnswers, setComprehensionAnswers] = useState<
    { questionId: string; correct: boolean; timeSpentSeconds: number }[]
  >([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [readingTimer, setReadingTimer] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const styles: StyleKey[] = ['normal', 'bionic', 'dyslexic'];
  const passage = TEST_PASSAGES[currentPassageIndex];
  const currentQuestion = passage?.questions[currentQuestionIndex];

  // Timer for reading phase
  useEffect(() => {
    if (phase === 'reading-test' && isReading) {
      setReadingStartTime(Date.now());
      setReadingTimer(0);
      timerRef.current = setInterval(() => {
        setReadingTimer((t) => t + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, isReading, currentPassageIndex]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setPhase('intro');
      setCurrentStyleIndex(0);
      setComfortRatings({ normal: 0, bionic: 0, dyslexic: 0 });
      setPreferredStyle(null);
      setCurrentPassageIndex(0);
      setCurrentQuestionIndex(0);
      setIsReading(true);
      setTotalReadingTime(0);
      setComprehensionAnswers([]);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setReadingTimer(0);
    }
  }, [isOpen]);

  // Prevent scroll behind modal
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !student) return null;

  const getStyleCSS = (style: StyleKey): React.CSSProperties => {
    switch (style) {
      case 'dyslexic':
        return {
          fontFamily: fontFamilies['dyslexie'] || "'Dyslexie lokal / Arial', Arial, sans-serif",
          fontSize: 22,
          letterSpacing: 2,
          wordSpacing: 5,
          lineHeight: 2.2,
        };
      case 'bionic':
        return {
          fontFamily: 'Arial, sans-serif',
          fontSize: 19,
          letterSpacing: 0.5,
          lineHeight: 1.9,
        };
      default:
        return {
          fontFamily: 'Arial, sans-serif',
          fontSize: 18,
          lineHeight: 1.8,
        };
    }
  };

  const handleRateStyle = (rating: number) => {
    const currentStyle = styles[currentStyleIndex];
    setComfortRatings((prev) => ({ ...prev, [currentStyle]: rating }));

  };
  const nextStyle = () => {
    if(!comfortRatings[styles[currentStyleIndex]])return;
    if(currentStyleIndex < styles.length-1)setCurrentStyleIndex(i=>i+1);
    else setPreferredStyle((Object.entries(comfortRatings) as [StyleKey,number][]).sort((a,b)=>b[1]-a[1])[0][0]);
  };

  const handleConfirmStyle = () => {
    if (preferredStyle) {
      setPhase('reading-test');
      setIsReading(true);
      setCurrentPassageIndex(0);
      setCurrentQuestionIndex(0);
    }
  };

  const handleFinishReading = () => {
    const timeSpent = Math.round((Date.now() - readingStartTime) / 1000);
    setTotalReadingTime((t) => t + timeSpent);
    setIsReading(false);
    setQuestionStartTime(Date.now());
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (showFeedback) return;
    setSelectedAnswer(answerIndex);
    setShowFeedback(true);

    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
    const isCorrect = answerIndex === currentQuestion.correctIndex;

    setComprehensionAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        correct: isCorrect,
        timeSpentSeconds: timeSpent,
      },
    ]);

  };
  const nextQuestion = () => {
    if(!showFeedback)return;
      setShowFeedback(false);
      setSelectedAnswer(null);

      if (currentQuestionIndex < passage.questions.length - 1) {
        // Next question for same passage
        setCurrentQuestionIndex((i) => i + 1);
        setQuestionStartTime(Date.now());
      } else if (currentPassageIndex < TEST_PASSAGES.length - 1) {
        // Next passage
        setCurrentPassageIndex((i) => i + 1);
        setCurrentQuestionIndex(0);
        setIsReading(true);
      } else {
        // All done, show results
        setPhase('results');
      }
  };

  const generateResults = (): ComfortTestResults => {
    const correctAnswers = comprehensionAnswers.filter((a) => a.correct).length;
    const totalAnswers = comprehensionAnswers.length;
    const avgTime =
      totalAnswers > 0
        ? Math.round(
            comprehensionAnswers.reduce((sum, a) => sum + a.timeSpentSeconds, 0) / totalAnswers
          )
        : 0;
    const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

    const recommendations = ['Pilihan tampilan berdasarkan penilaian kenyamanan murid pada sesi ini; dapat diubah guru.','Nilai hanya menunjukkan jawaban pada latihan ini, bukan diagnosis atau bukti efektivitas suatu font.','Ambang kata hanya menandai kalimat panjang, tidak memendekkan teks.'];

    return {
      preferredStyle: preferredStyle || 'normal',
      preferredStyleLabel: STYLE_LABELS[preferredStyle || 'normal'],
      comfortRatings: Object.entries(comfortRatings).map(([style, rating]) => ({
        style: STYLE_LABELS[style as StyleKey],
        rating,
      })),
      comprehensionAnswers,
      totalReadingTimeSeconds: totalReadingTime,
      avgComprehensionTimeSeconds: avgTime,
      comprehensionAccuracy: accuracy,
      averageWordsPerSentence: Math.round(TEST_PASSAGES.reduce((n,p)=>n+p.text.split(/\s+/u).length,0)/TEST_PASSAGES.reduce((n,p)=>n+p.text.split(/[.!?]+/u).filter(t=>t.trim()).length,0)*100)/100,
      recommendations,
      testDate: new Date().toISOString(),
    };
  };

  const handleSaveAndClose = () => {
    if (!student) return;
    const results = generateResults();
    if(onSaveResults(student, results)) onClose();
  };

  // ---- RENDER PHASES ----

  const renderIntro = () => (
    <div className="comfort-phase comfort-intro">
      <div className="comfort-hero">
        <div className="hero-avatar">
          <AvatarClay avatarId={student.avatarId} size={80} />
        </div>
        <h2>Uji Kenyamanan Baca</h2>
        <p className="hero-student-name">
          Untuk: <strong>{student.name}</strong> ({student.gradeClass})
        </p>
        <p className="hero-desc">
          Tes ini membantu guru menemukan gaya baca yang paling nyaman untuk {student.nickname}.
          Murid akan mencoba 3 gaya tampilan teks, memilih yang paling nyaman, lalu menjawab
          beberapa pertanyaan pemahaman sederhana.
        </p>
      </div>

      <div className="intro-steps-grid">
        <div className="intro-step-card">
          <div className="step-num">1</div>
          <div className="step-icon">👀</div>
          <h4>Bandingkan Gaya Baca</h4>
          <p>Coba 3 gaya tampilan dan beri bintang kenyamanan.</p>
        </div>
        <div className="intro-step-card">
          <div className="step-num">2</div>
          <div className="step-icon">📖</div>
          <h4>Baca & Jawab</h4>
          <p>Baca teks pendek, lalu jawab pertanyaan pemahaman.</p>
        </div>
        <div className="intro-step-card">
          <div className="step-num">3</div>
          <div className="step-icon">📊</div>
          <h4>Lihat Hasil</h4>
          <p>Rekomendasi gaya baca terbaik berdasarkan hasil tes.</p>
        </div>
      </div>

      <div className="intro-info-badge">
        <span>⏱️</span>
        <span>Tidak ada batas waktu. Pilihan kenyamanan bebas; kuis memiliki jawaban acuan.</span>
      </div>

      <button
        type="button"
        className="btn-comfort-start"
        onClick={() => setPhase('style-compare')}
      >
        Mulai Uji Kenyamanan 🚀
      </button>
    </div>
  );

  const renderStyleCompare = () => {
    const currentStyle = styles[currentStyleIndex];


    if (preferredStyle) {
      // Show summary and let them confirm
      return (
        <div className="comfort-phase comfort-style-summary">
          <h2>Pilih Gaya Baca Favorit</h2>
          <p className="phase-desc">
            Berdasarkan penilaian {student.nickname}, berikut peringkat kenyamanan:
          </p>

          <div className="style-rankings">
            {(Object.entries(comfortRatings) as [StyleKey, number][])
              .sort((a, b) => b[1] - a[1])
              .map(([style, rating], idx) => (
                <div
                  key={style}
                  className={`ranking-card ${
                    preferredStyle === style ? 'selected' : ''
                  } ${idx === 0 ? 'top-rank' : ''}`}
                  role="button" tabIndex={0} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setPreferredStyle(style);}}}
                  onClick={() => setPreferredStyle(style)}
                >
                  <div className="rank-badge">{idx + 1}</div>
                  <div className="rank-info">
                    <div className="rank-style-name">{STYLE_LABELS[style]}</div>
                    <div className="rank-stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`star ${star <= rating ? 'filled' : ''}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  {preferredStyle === style && (
                    <span className="rank-check">✓ Dipilih</span>
                  )}
                </div>
              ))}
          </div>

          <p className="phase-tip">
            💡 Klik pada gaya lain untuk mengubah pilihan. Gaya yang terpilih akan digunakan
            untuk tes pemahaman selanjutnya.
          </p>

          <button
            type="button"
            className="btn-comfort-next"
            onClick={handleConfirmStyle}
          >
            Lanjut ke Tes Pemahaman 📖
          </button>
        </div>
      );
    }

    return (
      <div className="comfort-phase comfort-style-compare">
        <div className="phase-progress-bar">
          <div className="phase-label">Fase 1: Bandingkan Gaya Baca</div>
          <div className="progress-dots">
            {styles.map((s, i) => (
              <span
                key={s}
                className={`progress-dot ${
                  i < currentStyleIndex ? 'done' : i === currentStyleIndex ? 'active' : ''
                }`}
              />
            ))}
          </div>
        </div>

        <h2>
          Gaya {currentStyleIndex + 1} dari 3: {STYLE_LABELS[currentStyle]}
        </h2>
        <p className="style-description">{STYLE_DESCRIPTIONS[currentStyle]}</p>

        {/* Preview text */}
        <div className={`comfort-text-preview style-${currentStyle}`}>
          <div className="preview-text-content" style={getStyleCSS(currentStyle)}>
            <BionicText text={TEST_PASSAGES[0].text} enabled={currentStyle === 'bionic'} />
          </div>
        </div>

<p>Dyslexie memakai font lokal jika tersedia, atau Arial. Bionic bersifat eksperimental. Tidak ada batas waktu.</p>
        {/* Star Rating */}
        <div className="comfort-rating-area">
          <p className="rating-question">
            Seberapa nyaman {student.nickname} membaca teks di atas?
          </p>
          <button type="button" disabled={!comfortRatings[currentStyle]} onClick={nextStyle}>Lanjut gaya berikutnya</button>
          <div className="star-rating-row">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`star-btn ${
                  comfortRatings[currentStyle] >= star ? 'filled' : ''
                }`}
                onClick={() => handleRateStyle(star)}
                title={
                  star === 1
                    ? 'Tidak nyaman'
                    : star === 2
                    ? 'Kurang nyaman'
                    : star === 3
                    ? 'Cukup nyaman'
                    : star === 4
                    ? 'Nyaman'
                    : 'Sangat nyaman'
                }
              >
                <span className="star-icon">★</span>
                <span className="star-label">
                  {star === 1
                    ? 'Sulit'
                    : star === 2
                    ? 'Kurang'
                    : star === 3
                    ? 'Cukup'
                    : star === 4
                    ? 'Nyaman'
                    : 'Sangat'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderReadingTest = () => {
    if (!passage || !currentQuestion) return null;

    return (
      <div className="comfort-phase comfort-reading-test">
        <div className="phase-progress-bar">
          <div className="phase-label">Fase 2: Baca & Jawab Pertanyaan</div>
          <div className="test-progress-info">
            Bacaan {currentPassageIndex + 1}/{TEST_PASSAGES.length} ·
            Soal {currentQuestionIndex + 1}/{passage.questions.length}
          </div>
        </div>

        {isReading ? (
          /* READING PHASE */
          <div className="reading-area">
            <div className="reading-top-bar">
              <span className="reading-badge">
                📖 Baca dengan gaya: <strong>{STYLE_LABELS[preferredStyle || 'normal']}</strong>
              </span>
              <div className="reading-timer-display">
                <span className="timer-icon">⏱️</span>
                <span className="timer-value">{readingTimer} detik</span>
              </div>
            </div>

            <div
              className={`comfort-text-preview reading-mode style-${preferredStyle}`}
            >
              <div
                className="preview-text-content"
                style={getStyleCSS(preferredStyle || 'normal')}
              >
                <BionicText
                  text={passage.text}
                  enabled={preferredStyle === 'bionic'}
                />
              </div>
            </div>

            <div className="reading-done-area">
              <p>Sudah selesai membaca? Tekan tombol di bawah untuk menjawab pertanyaan.</p>
              <button
                type="button"
                className="btn-done-reading"
                onClick={handleFinishReading}
              >
                ✅ Selesai Membaca — Jawab Pertanyaan
              </button>
            </div>
          </div>
        ) : (
          /* QUESTION PHASE */
          <div className="question-area">
            {showFeedback && <button type="button" onClick={nextQuestion}>Lanjutkan</button>}
            <div className="question-card">
              <div className="question-number">
                Pertanyaan {currentQuestionIndex + 1}
              </div>
              <h3 className="question-text">{currentQuestion.text}</h3>

              <div className="answer-options">
                {currentQuestion.options.map((option, idx) => {
                  let optionClass = 'answer-option';
                  if (showFeedback) {
                    if (idx === currentQuestion.correctIndex) {
                      optionClass += ' correct';
                    } else if (idx === selectedAnswer && idx !== currentQuestion.correctIndex) {
                      optionClass += ' incorrect';
                    }
                  } else if (idx === selectedAnswer) {
                    optionClass += ' selected';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      className={optionClass}
                      onClick={() => handleAnswerSelect(idx)}
                      disabled={showFeedback}
                    >
                      <span className="option-letter">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="option-text">{option}</span>
                    </button>
                  );
                })}
              </div>

              {showFeedback && (
                <div
                  className={`feedback-banner ${
                    selectedAnswer === currentQuestion.correctIndex ? 'correct' : 'incorrect'
                  }`}
                >
                  {selectedAnswer === currentQuestion.correctIndex
                    ? '🎉 Benar! Bagus sekali!'
                    : `❌ Belum tepat. Jawaban yang benar: ${
                        currentQuestion.options[currentQuestion.correctIndex]
                      }`}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderResults = () => {
    const results = generateResults();

    return (
      <div className="comfort-phase comfort-results">
        <div className="results-hero">
          <div className="results-avatar">
            <AvatarClay avatarId={student.avatarId} size={70} />
          </div>
          <h2>Hasil Uji Kenyamanan Baca</h2>
          <p className="results-subtitle">
            <strong>{student.name}</strong> — {student.gradeClass}
          </p>
        </div>

        {/* Main Results Grid */}
        <div className="results-stats-grid">
          <div className="stat-card preferred-style-card">
            <div className="stat-icon">🎨</div>
            <div className="stat-label">Gaya Baca Favorit</div>
            <div className="stat-value">{results.preferredStyleLabel}</div>
          </div>

          <div className="stat-card accuracy-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-label">Jawaban Benar pada Latihan</div>
            <div className={`stat-value ${results.comprehensionAccuracy >= 80 ? 'good' : results.comprehensionAccuracy >= 50 ? 'medium' : 'low'}`}>
              {results.comprehensionAccuracy}%
            </div>
          </div>

          <div className="stat-card time-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-label">Rata-rata Jawab</div>
            <div className="stat-value">{results.avgComprehensionTimeSeconds} detik</div>
          </div>

          <div className="stat-card reading-time-card">
            <div className="stat-icon">📖</div>
            <div className="stat-label">Total Waktu Baca</div>
            <div className="stat-value">{results.totalReadingTimeSeconds} detik</div>
          </div>
        </div>

        {/* Comfort Ratings Comparison */}
        <div className="results-ratings-section">
          <h3>Peringkat Kenyamanan Gaya Baca</h3>
          <div className="ratings-bars">
            {results.comfortRatings
              .sort((a, b) => b.rating - a.rating)
              .map((item, idx) => (
                <div key={item.style} className={`rating-bar-item ${idx === 0 ? 'top' : ''}`}>
                  <div className="rating-bar-label">{item.style}</div>
                  <div className="rating-bar-track">
                    <div
                      className="rating-bar-fill"
                      style={{ width: `${(item.rating / 5) * 100}%` }}
                    />
                  </div>
                  <div className="rating-bar-value">{item.rating}/5 ★</div>
                </div>
              ))}
          </div>
        </div>

        {/* Comprehension Detail */}
        <div className="results-comprehension-section">
          <h3>Detail Jawaban Pemahaman</h3>
          <div className="comprehension-answers-grid">
            {results.comprehensionAnswers.map((answer, idx) => (
              <div
                key={answer.questionId}
                className={`answer-result-chip ${answer.correct ? 'correct' : 'incorrect'}`}
              >
                <span className="answer-icon">{answer.correct ? '✅' : '❌'}</span>
                <span>Soal {idx + 1}</span>
                <span className="answer-time">{answer.timeSpentSeconds}s</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        {results.recommendations.length > 0 && (
          <div className="results-recommendations">
            <h3>💡 Rekomendasi untuk Guru</h3>
            <ul className="reco-list">
              {results.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="results-actions">
          <button
            type="button"
            className="btn-save-results"
            onClick={handleSaveAndClose}
          >
            💾 Simpan Hasil & Terapkan Preferensi
          </button>
          <button
            type="button"
            className="btn-retake-test"
            onClick={() => {
              setPhase('intro');
              setCurrentStyleIndex(0);
              setComfortRatings({ normal: 0, bionic: 0, dyslexic: 0 });
              setPreferredStyle(null);
              setCurrentPassageIndex(0);
              setCurrentQuestionIndex(0);
              setComprehensionAnswers([]);
              setTotalReadingTime(0);
            }}
          >
            🔄 Ulangi Tes
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="comfort-test-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="comfort-test-modal" ref={modalRef}>
        {/* Modal Header */}
        <div className="comfort-modal-header">
          <div className="comfort-header-left">
            <AvatarClay avatarId={student.avatarId} size={36} />
            <div>
              <div className="comfort-header-title">Uji Kenyamanan Baca</div>
              <div className="comfort-header-student">{student.nickname} · {student.gradeClass}</div>
            </div>
          </div>
          <button type="button" className="comfort-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Phase Progress Indicators */}
        <div className="comfort-phase-indicators">
          {(['intro', 'style-compare', 'reading-test', 'results'] as Phase[]).map((p, i) => (
            <div
              key={p}
              className={`phase-indicator ${
                phase === p ? 'active' : 
                ['intro', 'style-compare', 'reading-test', 'results'].indexOf(phase) > i ? 'done' : ''
              }`}
            >
              <span className="indicator-dot" />
              <span className="indicator-label">
                {p === 'intro' ? 'Mulai' : p === 'style-compare' ? 'Gaya Baca' : p === 'reading-test' ? 'Pemahaman' : 'Hasil'}
              </span>
            </div>
          ))}
        </div>

        {/* Phase Content */}
        <div className="comfort-modal-body">
          {phase === 'intro' && renderIntro()}
          {phase === 'style-compare' && renderStyleCompare()}
          {phase === 'reading-test' && renderReadingTest()}
          {phase === 'results' && renderResults()}
        </div>
      </div>
    </div>
  );
}

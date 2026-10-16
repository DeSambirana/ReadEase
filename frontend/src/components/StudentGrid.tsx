import React, { useState, useMemo } from 'react';
import { StudentProfile } from '../types/student';
import { StudentCard } from './StudentCard';

interface StudentGridProps {
  students: StudentProfile[];
  onCreateWorksheet: (student: StudentProfile) => void;
  onEditStudent: (student: StudentProfile) => void;
  onAddNewStudent: () => void;
  onViewHistory?: (student: StudentProfile) => void;
  onQuickExportPdf?: (student: StudentProfile) => void;
  onRunComfortTest?: (student: StudentProfile) => void;
}

export function StudentGrid({
  students,
  onCreateWorksheet,
  onEditStudent,
  onAddNewStudent,
  onViewHistory,
  onQuickExportPdf,
  onRunComfortTest,
}: StudentGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('Semua');

  const filterTags = ['Semua', 'ADHD', 'Disleksia', 'Sensori', 'Fokus', 'Bionic'];

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.gradeClass.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.needsTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.pedagogicalNotes.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (selectedTag === 'Semua') return true;
      if (selectedTag === 'ADHD') return student.needsTag.toLowerCase().includes('adhd');
      if (selectedTag === 'Disleksia')
        return (
          student.needsTag.toLowerCase().includes('disleksia') ||
          student.preferences.fontFamily === 'dyslexic'
        );
      if (selectedTag === 'Sensori') return student.needsTag.toLowerCase().includes('sensori');
      if (selectedTag === 'Fokus')
        return (
          student.preferences.readingMode === 'focus' ||
          student.needsTag.toLowerCase().includes('fokus')
        );
      if (selectedTag === 'Bionic') return student.preferences.bionicReading;

      return true;
    });
  }, [students, searchQuery, selectedTag]);

  return (
    <div className="student-grid-wrapper">
      {/* Top Header Row with Title, Search, and Add Button */}
      <div className="student-grid-header">
        <div className="header-title-area">
          <h1 className="header-main-title">
            Murid Bimbingan 
          </h1>
          <p className="header-subtitle">
            Profil belajar anak berkebutuhan khusus & pengaturan adaptasi lembar baca.
          </p>
        </div>

        <div className="header-controls-area">
          {/* Modern Search Bar */}
          <div className="modern-search-bar">
            <span className="search-icon">⌕</span>
            <input
              aria-label="Cari murid"
              type="text"
              placeholder="Cari murid, kelas, atau kebutuhan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                title="Hapus pencarian"
              >
                ✕
              </button>
            )}
          </div>

          {/* Add Student Button */}
          <button
            type="button"
            className="btn-add-student"
            onClick={onAddNewStudent}
          >
            <span className="btn-plus">＋</span>
            <span>Tambah Murid</span>
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="filter-chips-row">
        <span className="filter-label">Filter Kategori:</span>
        <div className="filter-chips">
          {filterTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`filter-chip ${selectedTag === tag ? 'active' : ''}`}
              onClick={() => setSelectedTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="student-count-indicator">
          Menampilkan {filteredStudents.length} dari {students.length} murid
        </div>
      </div>

      {/* Grid Canvas */}
      {filteredStudents.length > 0 ? (
        <div className="students-cards-grid">
          {filteredStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onCreateWorksheet={onCreateWorksheet}
              onEditStudent={onEditStudent}
              onViewHistory={onViewHistory}
              onQuickExportPdf={onQuickExportPdf}
              onRunComfortTest={onRunComfortTest}
            />
          ))}
        </div>
      ) : (
        <div className="student-empty-state">
          <div className="empty-icon">⌕</div>
          <h3>{students.length?'Tidak ada murid yang cocok':'Belum ada murid'}</h3>
          <p>
            {students.length?'Coba kata kunci lain atau bersihkan filter pencarian.':'Klik Tambah Murid untuk membuat profil pertama. Data contoh tidak dimasukkan otomatis.'}
          </p>
          <button
            type="button"
            className="btn-reset-filter"
            onClick={() => {
              setSearchQuery('');
              setSelectedTag('Semua');
            }}
          >
            Tampilkan Semua Murid
          </button>
        </div>
      )}
    </div>
  );
}

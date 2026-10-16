import React from 'react';
import {BrandLogo} from '../BrandLogo';
import {useAccount} from '../AuthGate';

interface NavbarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  studentCount?: number;
}

export function Navbar({ currentRoute, onNavigate, studentCount = 8 }: NavbarProps) {
  const account=useAccount();
  return (
    <header className="dark-navbar-container">
      <div className="dark-navbar">
        {/* Brand Logo Left */}
        <div className="dark-brand" onClick={() => onNavigate('murid')} role="button" tabIndex={0} onKeyDown={e => {if(e.key === "Enter" || e.key === " "){e.preventDefault();onNavigate("murid");}}}>
          <BrandLogo />
        </div>

        {/* Center Navigation Pills */}
        <nav className="dark-nav-pills" aria-label="Menu Utama">
          <button
            type="button"
            className={`nav-pill ${currentRoute === 'murid' ? 'active' : ''}`}
            onClick={() => onNavigate('murid')}
          >
            <span className="pill-icon"></span>
            <span>Murid Bimbingan</span>
            {studentCount > 0 && <span className="pill-badge">{studentCount}</span>}
          </button>

          <button
            type="button"
            className={`nav-pill ${currentRoute === 'guru' || currentRoute === 'adaptasi' ? 'active' : ''}`}
            onClick={() => onNavigate('guru')}
          >
            <span className="pill-icon">✍</span>
            <span>Ruang Adaptasi & LKPD</span>
          </button>

          <button
            type="button"
            className={`nav-pill ${currentRoute === 'baca' ? 'active' : ''}`}
            onClick={() => onNavigate('baca')}
          >
            <span className="pill-icon"></span>
            <span>Pratinjau Bacaan</span>
          </button>

          <button
            type="button"
            className={`nav-pill ${currentRoute === 'riwayat' ? 'active' : ''}`}
            onClick={() => onNavigate('riwayat')}
          >
            <span className="pill-icon"></span>
            <span>Riwayat LKPD</span>
          </button>
        </nav>

        {/* Right Teacher Profile */}
        <div className="dark-teacher-profile">
          <div className="teacher-avatar-circle">
            <svg viewBox="0 0 40 40" width="38" height="38">
              <circle cx="20" cy="20" r="19" fill="#3B82F6" />
              <circle cx="20" cy="15" r="7" fill="#FED7AA" />
              <path d="M 10 34 C 10 26, 15 23, 20 23 C 25 23, 30 26, 30 34 Z" fill="#1E3A8A" />
              <circle cx="18" cy="14" r="1.2" fill="#1E293B" />
              <circle cx="22" cy="14" r="1.2" fill="#1E293B" />
              <path d="M 18 17 Q 20 19 22 17" stroke="#9A3412" strokeWidth="1" fill="none" />
            </svg>
            <span className="online-indicator" title="Aktif" />
          </div>
          <div className="teacher-info">
            <div className="teacher-name">{account.name}</div>
            <div className="teacher-role">{account.email}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

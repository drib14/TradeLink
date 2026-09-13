import React, { useState, useEffect } from 'react';
import {
  Code2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  MapPin,
  HeartHandshake,
  Crown,
  CheckCircle2,
  Cpu,
  Layers,
  Terminal
} from 'lucide-react';

interface DevelopersPageProps {
  onNavigate: (view: string, param?: any) => void;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  category: 'Lead' | 'Management' | 'Database' | 'UI/UX' | 'Frontend';
  categoryBadge: string;
  badgeColor: string;
  accentGlow: string;
  campus: string;
  avatarUrl: string;
  initials: string;
  fallbackColor: string;
  bio: string;
  skills: string[];
  githubUrl: string;
  facebookUrl: string;
}

export const DevelopersPage: React.FC<DevelopersPageProps> = ({ onNavigate }) => {
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');

  // The 8 Official Platform Developers with Assigned Roles, Campuses & Socials
  const teamMembers: TeamMember[] = [
    {
      id: 'jhonrid',
      name: 'Jhonrid Ramirez',
      role: 'Lead Developer',
      category: 'Lead',
      categoryBadge: 'Lead Architect',
      badgeColor: 'linear-gradient(135deg, #002B7F 0%, #001744 100%)',
      accentGlow: 'rgba(0, 43, 127, 0.28)',
      campus: 'UC Main Campus',
      avatarUrl: 'https://avatars.githubusercontent.com/u/112171139?v=4',
      initials: 'JR',
      fallbackColor: '#002B7F',
      bio: 'Primary system architect and lead engineer of TradeLink. Engineered the end-to-end full-stack architecture, REST APIs, WebSocket real-time messaging, face-to-ID biometric verification, MySQL database schemas, and responsive web & mobile clients.',
      skills: ['Full-Stack Architecture', 'Node.js & Express REST API', 'WebSocket & Socket.IO Engine', 'MySQL & Knex.js Modeling', 'Security & Handshake Protocols'],
      githubUrl: 'https://www.github.com/drib14',
      facebookUrl: 'https://www.facebook.com/drib14'
    },
    {
      id: 'richie',
      name: 'Richie Ann Armenion',
      role: 'Project Manager',
      category: 'Management',
      categoryBadge: 'Project Management',
      badgeColor: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
      accentGlow: 'rgba(124, 58, 237, 0.25)',
      campus: 'UC Main Campus',
      avatarUrl: '',
      initials: 'RA',
      fallbackColor: '#7C3AED',
      bio: 'Directs project roadmaps, agile development sprints, cross-campus team milestones, and student stakeholder alignment. Ensures platform deliveries align with University of Cebu student guidelines and academic timelines.',
      skills: ['Agile Project Planning', 'Sprint & Delivery Management', 'Student Council Liaison', 'Feature Prioritization', 'Product Quality Standards'],
      githubUrl: 'https://github.com/RichieArmenion',
      facebookUrl: 'https://www.facebook.com/richieaaann'
    },
    {
      id: 'visayas',
      name: 'Tim Jaylord Visayas',
      role: 'Database Engineer',
      category: 'Database',
      categoryBadge: 'Database Infrastructure',
      badgeColor: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
      accentGlow: 'rgba(2, 132, 199, 0.25)',
      campus: 'UC Main Campus',
      avatarUrl: '',
      initials: 'TV',
      fallbackColor: '#0284C7',
      bio: 'Architects and tunes MySQL 8 relational schemas, foreign key integrity, Knex.js automated migrations, and transaction logs. Specializes in indexing strategies, query execution plans, and data scalability.',
      skills: ['MySQL 8 Schema Design', 'Knex.js Query Optimization', 'Relational Constraints & Indexing', 'Transaction Logging', 'Data Normalization'],
      githubUrl: 'https://github.com/taymtim',
      facebookUrl: 'https://www.facebook.com/timjaylordrendon'
    },
    {
      id: 'taray',
      name: 'John Paul Taray',
      role: 'Database Engineer',
      category: 'Database',
      categoryBadge: 'Database & Data Ops',
      badgeColor: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
      accentGlow: 'rgba(2, 132, 199, 0.25)',
      campus: 'UC Banilad Campus',
      avatarUrl: '',
      initials: 'JT',
      fallbackColor: '#0284C7',
      bio: 'Co-engineers database models, automated data seeding, user statistic calculations (0-transaction defaults, ratings, punctuality metrics), and query caching for high campus traffic.',
      skills: ['Data Seeding & Migrations', 'User Stats & Trust Calculation', 'Transaction Storage Engines', 'Data Integrity & Constraints', 'Query Performance'],
      githubUrl: 'https://github.com/johnpaultaray',
      facebookUrl: 'https://www.facebook.com/tarayjohn02'
    },
    {
      id: 'fernandez',
      name: 'Gabriel Fernandez',
      role: 'UI/UX Designer',
      category: 'UI/UX',
      categoryBadge: 'UI/UX Design',
      badgeColor: 'linear-gradient(135deg, #DB2777 0%, #9D174D 100%)',
      accentGlow: 'rgba(219, 39, 119, 0.25)',
      campus: 'UC LM Campus',
      avatarUrl: '',
      initials: 'GF',
      fallbackColor: '#DB2777',
      bio: 'Crafts modern student user interfaces, intuitive user journeys, interactive wireframes, and design systems anchored by official University of Cebu branding tokens and accessibility standards.',
      skills: ['Figma UI/UX Prototyping', 'Design System Architecture', 'User Journey Mapping', 'Visual Hierarchy & Typography', 'Student Usability Research'],
      githubUrl: '',
      facebookUrl: 'https://www.facebook.com/iduckinfhatwu'
    },
    {
      id: 'coyoca',
      name: 'Earl Justine Coyoca',
      role: 'UI/UX Designer',
      category: 'UI/UX',
      categoryBadge: 'Experience & Aesthetics',
      badgeColor: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
      accentGlow: 'rgba(217, 119, 6, 0.25)',
      campus: 'UC Main Campus',
      avatarUrl: '',
      initials: 'EC',
      fallbackColor: '#D97706',
      bio: 'Focuses on visual micro-interactions, responsive mobile layouts, modal states, accessibility guidelines, and interactive campus marketplace card aesthetics.',
      skills: ['Micro-Interactions & Animation', 'Responsive Mobile Layouts', 'Modal & Dialog UI Design', 'Accessibility & Usability', 'Color Token Systems'],
      githubUrl: '',
      facebookUrl: 'https://www.facebook.com/earljustino'
    },
    {
      id: 'sanchez',
      name: 'John Kith Sanchez',
      role: 'Frontend Developer',
      category: 'Frontend',
      categoryBadge: 'Frontend Engineering',
      badgeColor: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      accentGlow: 'rgba(5, 150, 105, 0.25)',
      campus: 'UC Banilad Campus',
      avatarUrl: '',
      initials: 'JS',
      fallbackColor: '#059669',
      bio: 'Develops interactive React 18 & TypeScript frontend components, state management contexts, real-time message drawers, and high-performance campus marketplace catalog filters.',
      skills: ['React 18 & TypeScript', 'Context API State Management', 'Real-Time Chat & Sockets', 'Dynamic Filtering Engines', 'Performance Optimization'],
      githubUrl: 'https://github.com/FlyingSteps04',
      facebookUrl: 'https://www.facebook.com/johnkithsanchez04'
    },
    {
      id: 'bersales',
      name: 'Lloel Bersales',
      role: 'Frontend Developer',
      category: 'Frontend',
      categoryBadge: 'Client State & Views',
      badgeColor: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
      accentGlow: 'rgba(13, 148, 136, 0.25)',
      campus: 'UC Main Campus',
      avatarUrl: '',
      initials: 'LB',
      fallbackColor: '#0D9488',
      bio: 'Builds responsive client views, modal dialogues, interactive form validation, student ID verification flows, and smooth CSS keyframe transitions.',
      skills: ['Responsive Client Views', 'Form Validations & Feedback', 'Verification Modal Flow', 'Interactive Animations', 'Cross-Browser Testing'],
      githubUrl: 'https://github.com/bersalespaul9-ctrl',
      facebookUrl: 'https://www.facebook.com/paul.bersales.15'
    }
  ];

  // Carousel navigation handlers
  const handlePrev = () => {
    setCarouselIndex((prev) => (prev === 0 ? teamMembers.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCarouselIndex((prev) => (prev === teamMembers.length - 1 ? 0 : prev + 1));
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'carousel') return;
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, teamMembers.length]);

  return (
    <div className="container" style={{ maxWidth: '1100px', padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <style>{`
        .dev-card-wrapper {
          transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .dev-card-wrapper:hover {
          transform: translateY(-4px);
        }
        .social-btn {
          transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
        }
        .social-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.08);
        }
        .campus-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: #EBF1FC;
          color: #002B7F;
          font-weight: 700;
          font-size: 0.76rem;
          padding: 0.3rem 0.75rem;
          border-radius: 9999px;
          border: 1px solid rgba(0, 43, 127, 0.15);
        }
        .member-thumb-btn {
          transition: all 0.2s ease;
        }
        .member-thumb-btn:hover {
          transform: translateY(-2px);
        }
      `}</style>

      {/* Page Header */}
      <div>
        <button
          onClick={() => onNavigate('home')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            color: '#64748B',
            fontSize: '0.84rem',
            fontWeight: 700,
            marginBottom: '0.75rem',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: 0,
            transition: 'color 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--uc-blue)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
        >
          <ChevronLeft size={16} /> Back to Marketplace
        </button>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', backgroundColor: 'rgba(0, 43, 127, 0.08)', color: 'var(--uc-blue)', padding: '0.3rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          <Code2 size={15} /> Core Engineering & Development Team
        </div>

        <h1 style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.5rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          The Developers Behind TradeLink
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '0.5rem', maxWidth: '780px' }}>
          Meet the 8 student creators and engineers who conceptualized, designed, and built the TradeLink platform for the University of Cebu community.
        </p>
      </div>

      {/* Subheader Toolbar: Member Quick Selector & View Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem' }}>
        {/* Member Quick Jumper (Click to view developer directly) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem', maxWidth: '100%' }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '0.25rem' }}>
            Jump To:
          </span>
          {teamMembers.map((m, idx) => {
            const isSelected = viewMode === 'carousel' && carouselIndex === idx;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setCarouselIndex(idx);
                  if (viewMode !== 'carousel') setViewMode('carousel');
                }}
                className="member-thumb-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.7rem',
                  borderRadius: '9999px',
                  border: isSelected ? '1.5px solid var(--uc-blue)' : '1px solid var(--border-subtle)',
                  backgroundColor: isSelected ? 'rgba(0, 43, 127, 0.08)' : 'var(--bg-card)',
                  color: isSelected ? 'var(--uc-blue)' : 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {m.avatarUrl ? (
                  <img
                    src={m.avatarUrl}
                    alt={m.name}
                    style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: m.badgeColor,
                      color: '#FFF',
                      fontSize: '0.58rem',
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {m.initials}
                  </span>
                )}
                <span>{m.name.split(' ')[0]}</span>
                {m.id === 'jhonrid' && (
                  <span style={{ fontSize: '0.6rem', color: '#B45309', fontWeight: 900 }}>★</span>
                )}
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle: 3D Carousel vs Full Grid */}
        <div style={{ display: 'inline-flex', padding: '0.25rem', backgroundColor: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setViewMode('carousel')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              backgroundColor: viewMode === 'carousel' ? 'var(--uc-blue)' : 'transparent',
              color: viewMode === 'carousel' ? '#FFFFFF' : 'var(--text-secondary)'
            }}
          >
            <Sparkles size={14} /> 3D Carousel View
          </button>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              backgroundColor: viewMode === 'grid' ? 'var(--uc-blue)' : 'transparent',
              color: viewMode === 'grid' ? '#FFFFFF' : 'var(--text-secondary)'
            }}
          >
            <LayoutGrid size={14} /> Full Grid View
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* VIEW MODE 1: 3D CAROUSEL VIEW                            */}
      {/* ======================================================== */}
      {viewMode === 'carousel' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2.25rem', padding: '0.5rem 0 1rem 0' }}>
          {/* 3D Carousel Stage */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '920px',
              height: '590px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              perspective: '1400px',
              overflow: 'hidden'
            }}
          >
            {teamMembers.map((member, idx) => {
              const total = teamMembers.length;
              let diff = (idx - carouselIndex + total) % total;
              if (diff > total / 2) diff -= total;

              const isCenter = diff === 0;
              const isVisible = Math.abs(diff) <= 2;

              if (!isVisible) return null;

              const translateX = diff * 295;
              const translateZ = isCenter ? 0 : -240;
              const rotateY = diff * -16;
              const opacity = isCenter ? 1 : Math.abs(diff) === 1 ? 0.6 : 0.2;
              const scale = isCenter ? 1 : 0.86;
              const zIndex = 20 - Math.abs(diff) * 5;

              return (
                <div
                  key={member.id}
                  onClick={() => {
                    if (!isCenter) setCarouselIndex(idx);
                  }}
                  style={{
                    position: 'absolute',
                    width: '410px',
                    maxWidth: '92%',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '24px',
                    border: isCenter ? '2px solid rgba(0, 43, 127, 0.3)' : '1px solid #E2E8F0',
                    boxShadow: isCenter
                      ? `0 24px 50px -12px ${member.accentGlow}, 0 0 0 1px rgba(0, 43, 127, 0.08), 0 10px 20px -5px rgba(0,0,0,0.06)`
                      : '0 12px 30px -8px rgba(0, 0, 0, 0.12)',
                    transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                    transformStyle: 'preserve-3d',
                    transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
                    opacity,
                    zIndex,
                    cursor: isCenter ? 'default' : 'pointer',
                    userSelect: 'none',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Top Gradient Header Accent */}
                  <div
                    style={{
                      height: '96px',
                      background: member.badgeColor,
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      padding: '1rem 1.25rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#FFFFFF', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {member.id === 'jhonrid' ? <Crown size={14} color="#FFC72C" /> : <Terminal size={14} />}
                      <span>{member.category}</span>
                    </div>

                    <div
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.22)',
                        backdropFilter: 'blur(8px)',
                        color: '#FFFFFF',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.22rem 0.65rem',
                        borderRadius: '9999px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        border: '1px solid rgba(255, 255, 255, 0.3)'
                      }}
                    >
                      {member.categoryBadge}
                    </div>
                  </div>

                  {/* Card Content Container */}
                  <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', marginTop: '-48px' }}>
                    {/* Avatar & Identifiers */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                      <div style={{ position: 'relative' }}>
                        {member.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={member.name}
                            style={{
                              width: '96px',
                              height: '96px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '4px solid #FFFFFF',
                              boxShadow: '0 10px 24px rgba(0, 43, 127, 0.22), 0 0 0 2px #FFC72C',
                              backgroundColor: '#F8FAFC'
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '96px',
                              height: '96px',
                              borderRadius: '50%',
                              background: member.badgeColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#FFFFFF',
                              fontSize: '2rem',
                              fontWeight: 900,
                              letterSpacing: '0.04em',
                              border: '4px solid #FFFFFF',
                              boxShadow: `0 10px 24px ${member.accentGlow}, inset 0 -3px 6px rgba(0,0,0,0.25)`,
                              textShadow: '0 2px 5px rgba(0,0,0,0.25)'
                            }}
                          >
                            {member.initials}
                          </div>
                        )}
                        {member.id === 'jhonrid' && (
                          <span
                            style={{
                              position: 'absolute',
                              bottom: '-2px',
                              right: '-2px',
                              backgroundColor: '#FFC72C',
                              color: '#002B7F',
                              fontSize: '0.64rem',
                              fontWeight: 900,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '9999px',
                              border: '2px solid #FFFFFF',
                              textTransform: 'uppercase',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem'
                            }}
                          >
                            <Crown size={10} color="#002B7F" /> LEAD
                          </span>
                        )}
                      </div>

                      <div style={{ marginTop: '0.65rem' }}>
                        <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>
                          {member.name}
                        </h3>

                        {/* Role Pill */}
                        <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.22rem 0.75rem',
                              borderRadius: '9999px',
                              background: member.badgeColor,
                              color: '#FFFFFF',
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              letterSpacing: '0.02em',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                            }}
                          >
                            {member.role}
                          </span>

                          {/* Campus Pill */}
                          <span className="campus-pill">
                            <MapPin size={12} color="#002B7F" />
                            <span>{member.campus}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bio Card Inset (High Readability) */}
                    <div
                      style={{
                        backgroundColor: '#F8FAFC',
                        borderRadius: '14px',
                        padding: '0.9rem 1rem',
                        border: '1px solid #E2E8F0',
                        fontSize: '0.86rem',
                        color: '#334155',
                        lineHeight: 1.6,
                        textAlign: 'left'
                      }}
                    >
                      {member.bio}
                    </div>

                    {/* Key Technical Focus / Skills Chips */}
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                        Core Expertise
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {member.skills.slice(0, 3).map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: '#1E293B',
                              backgroundColor: '#F1F5F9',
                              border: '1px solid #E2E8F0',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px'
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Card Bottom: Official Social Buttons */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        borderTop: '1px solid #E2E8F0',
                        paddingTop: '0.9rem',
                        flexWrap: 'wrap'
                      }}
                    >
                      {/* Official Facebook Button */}
                      {member.facebookUrl && member.facebookUrl.trim() !== '' && (
                        <a
                          href={member.facebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`${member.name} on Facebook`}
                          className="social-btn"
                          style={{
                            flex: 1,
                            minWidth: '130px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.45rem',
                            padding: '0.55rem 1rem',
                            borderRadius: '10px',
                            backgroundColor: '#1877F2',
                            color: '#FFFFFF',
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            textDecoration: 'none',
                            boxShadow: '0 3px 10px rgba(24, 119, 242, 0.28)'
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                          <span>Facebook</span>
                        </a>
                      )}

                      {/* Official GitHub Button (Omitted if no GH link) */}
                      {member.githubUrl && member.githubUrl.trim() !== '' && (
                        <a
                          href={member.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`${member.name} on GitHub`}
                          className="social-btn"
                          style={{
                            flex: 1,
                            minWidth: '130px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.45rem',
                            padding: '0.55rem 1rem',
                            borderRadius: '10px',
                            backgroundColor: '#0F172A',
                            color: '#FFFFFF',
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            textDecoration: 'none',
                            boxShadow: '0 3px 10px rgba(15, 23, 42, 0.25)'
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                          </svg>
                          <span>GitHub</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Carousel Controls: Arrows & Active Indicator Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button
              onClick={handlePrev}
              aria-label="Previous developer"
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                border: '1.5px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                color: 'var(--uc-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--uc-blue)';
                e.currentTarget.style.color = '#FFFFFF';
                e.currentTarget.style.transform = 'scale(1.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.color = 'var(--uc-blue)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <ChevronLeft size={22} />
            </button>

            {/* Pagination Indicators */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {teamMembers.map((m, idx) => (
                <button
                  key={m.id}
                  onClick={() => setCarouselIndex(idx)}
                  aria-label={`Go to ${m.name}`}
                  style={{
                    width: idx === carouselIndex ? '30px' : '9px',
                    height: '9px',
                    borderRadius: '5px',
                    backgroundColor: idx === carouselIndex ? 'var(--uc-blue)' : '#CBD5E1',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    padding: 0
                  }}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              aria-label="Next developer"
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                border: '1.5px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                color: 'var(--uc-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--uc-blue)';
                e.currentTarget.style.color = '#FFFFFF';
                e.currentTarget.style.transform = 'scale(1.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.color = 'var(--uc-blue)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <ChevronRight size={22} />
            </button>
          </div>

          <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>Tip: Use left & right keyboard arrows to rotate developer cards</span>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW MODE 2: FULL GRID VIEW                             */}
      {/* ======================================================== */}
      {viewMode === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="dev-card-wrapper"
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                border: member.id === 'jhonrid' ? '2px solid rgba(255, 199, 44, 0.7)' : '1px solid #E2E8F0',
                boxShadow: member.id === 'jhonrid' ? '0 10px 30px rgba(0, 43, 127, 0.12)' : '0 6px 20px rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Header Accent Bar */}
              <div
                style={{
                  height: '8px',
                  background: member.id === 'jhonrid' ? 'linear-gradient(90deg, #FFC72C 0%, #002B7F 100%)' : member.badgeColor
                }}
              />

              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                {/* Header Row: Avatar + Name + Campus */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  {member.avatarUrl ? (
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        style={{
                          width: '68px',
                          height: '68px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '3px solid #FFC72C',
                          boxShadow: '0 4px 14px rgba(0, 43, 127, 0.2)'
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '-2px',
                          right: '-2px',
                          backgroundColor: '#FFC72C',
                          color: '#002B7F',
                          fontSize: '0.56rem',
                          fontWeight: 900,
                          padding: '0.1rem 0.35rem',
                          borderRadius: '9999px',
                          border: '1.5px solid #FFFFFF'
                        }}
                      >
                        LEAD
                      </span>
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '68px',
                        height: '68px',
                        borderRadius: '50%',
                        background: member.badgeColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        fontSize: '1.45rem',
                        fontWeight: 900,
                        letterSpacing: '0.04em',
                        border: '3px solid #FFFFFF',
                        boxShadow: `0 6px 16px ${member.accentGlow}, inset 0 -2px 5px rgba(0,0,0,0.25)`,
                        textShadow: '0 2px 4px rgba(0,0,0,0.25)',
                        flexShrink: 0
                      }}
                    >
                      {member.initials}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '1.18rem', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>
                        {member.name}
                      </h4>
                    </div>

                    <div style={{ display: 'inline-block', fontSize: '0.76rem', fontWeight: 800, color: '#002B7F', marginTop: '0.2rem' }}>
                      {member.role}
                    </div>

                    {/* Campus Badge */}
                    <div style={{ marginTop: '0.3rem' }}>
                      <span className="campus-pill" style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem' }}>
                        <MapPin size={11} color="#002B7F" />
                        <span>{member.campus}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bio in Inset Box for Readability */}
                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: '12px',
                    padding: '0.85rem 0.95rem',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.84rem',
                    color: '#334155',
                    lineHeight: 1.55,
                    flex: 1
                  }}
                >
                  {member.bio}
                </div>

                {/* Skills Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {member.skills.slice(0, 3).map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: '#334155',
                        backgroundColor: '#F1F5F9',
                        border: '1px solid #E2E8F0',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Social Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.85rem', flexWrap: 'wrap' }}>
                  {member.facebookUrl && member.facebookUrl.trim() !== '' && (
                    <a
                      href={member.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Facebook"
                      className="social-btn"
                      style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        padding: '0.45rem 0.85rem',
                        borderRadius: '8px',
                        backgroundColor: '#1877F2',
                        color: '#FFF',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        textDecoration: 'none'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      <span>Facebook</span>
                    </a>
                  )}
                  {member.githubUrl && member.githubUrl.trim() !== '' && (
                    <a
                      href={member.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="GitHub"
                      className="social-btn"
                      style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        padding: '0.45rem 0.85rem',
                        borderRadius: '8px',
                        backgroundColor: '#0F172A',
                        color: '#FFF',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        textDecoration: 'none'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                      </svg>
                      <span>GitHub</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cross-Campus Collaboration Banner */}
      <div
        style={{
          padding: '2.25rem',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(0, 43, 127, 0.05) 0%, rgba(255, 199, 44, 0.09) 100%)',
          border: '1.5px solid rgba(0, 43, 127, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
          boxShadow: '0 8px 24px rgba(0, 43, 127, 0.06)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              backgroundColor: 'var(--uc-blue)',
              color: '#FFC72C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 6px 16px rgba(0, 43, 127, 0.3)'
            }}
          >
            <HeartHandshake size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
              Built by UC Students, For UC Students
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', maxWidth: '640px', lineHeight: 1.5 }}>
              Developed through cross-campus student collaboration spanning UC Main, UC Banilad, and UC LM. Fostering safer, trust-backed peer-to-peer student commerce.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('marketplace')}
          className="btn-primary"
          style={{
            padding: '0.75rem 1.4rem',
            fontSize: '0.88rem',
            fontWeight: 800,
            borderRadius: '12px',
            boxShadow: '0 4px 14px rgba(0, 43, 127, 0.25)'
          }}
        >
          Explore Campus Marketplace
        </button>
      </div>
    </div>
  );
};

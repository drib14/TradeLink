import React, { useState } from 'react';
import { Logo } from '../components/common/Logo';
import {
  Users,
  Code2,
  ShieldCheck,
  Building2,
  Download,
  ChevronLeft,
  ChevronRight,
  Award,
  Layers,
  CheckCircle2,
  Camera,
  AlertTriangle,
  ExternalLink,
  Shield,
  FileCheck,
  LayoutGrid,
  Sparkles,
  MapPin
} from 'lucide-react';

interface ResourcesPageProps {
  onNavigate: (view: string, param?: any) => void;
  initialTab?: 'team' | 'hierarchy' | 'downloads';
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  category: 'Lead' | 'Management' | 'Database' | 'UI/UX' | 'Frontend';
  categoryBadge: string;
  badgeColor: string;
  campus: string;
  avatarUrl: string;
  initials: string;
  fallbackColor: string;
  bio: string;
  skills: string[];
  githubUrl: string;
  facebookUrl: string;
}

export const ResourcesPage: React.FC<ResourcesPageProps> = ({ onNavigate, initialTab = 'team' }) => {
  const [activeTab, setActiveTab] = useState<'team' | 'hierarchy' | 'downloads'>(initialTab);
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // 8 Official Platform Team Members with Assigned Roles & Campuses
  const teamMembers: TeamMember[] = [
    {
      id: 'jhonrid',
      name: 'Jhonrid Ramirez',
      role: 'Lead Developer',
      category: 'Lead',
      categoryBadge: 'Lead Architect',
      badgeColor: 'linear-gradient(135deg, #002B7F 0%, #001744 100%)',
      campus: 'UC Main Campus',
      avatarUrl: 'https://avatars.githubusercontent.com/u/112171139?v=4',
      initials: 'JR',
      fallbackColor: '#002B7F',
      bio: 'Primary system architect and lead developer of TradeLink. Built the full-stack architecture, REST APIs, real-time WebSocket messaging, biometric ID verification, database migrations, and responsive web & mobile clients.',
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
      campus: 'UC Main Campus',
      avatarUrl: '',
      initials: 'RA',
      fallbackColor: '#7C3AED',
      bio: 'Manages project roadmaps, development sprints, team delivery schedules, and student stakeholder alignment. Ensures platform milestones align with University of Cebu student guidelines and timelines.',
      skills: ['Project Planning & Milestones', 'Sprint & Delivery Management', 'Stakeholder & SAO Liaison', 'Feature Prioritization', 'Product Quality Standards'],
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
      campus: 'UC Main Campus',
      avatarUrl: '',
      initials: 'TV',
      fallbackColor: '#0284C7',
      bio: 'Architects and optimizes MySQL 8 relational schemas, Knex.js migrations, and transaction logs. Oversees relational integrity, indexing strategies, and database scalability.',
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
      campus: 'UC Banilad Campus',
      avatarUrl: '',
      initials: 'JT',
      fallbackColor: '#0284C7',
      bio: 'Co-engineers database models, automated data seeding, user statistic calculations (0-transaction defaults, ratings, punctuality), and backend data caching.',
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
      campus: 'UC LM Campus',
      avatarUrl: '',
      initials: 'GF',
      fallbackColor: '#DB2777',
      bio: 'Designs modern student user interfaces, intuitive user journeys, interactive wireframes, and design systems with official University of Cebu branding tokens.',
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
      campus: 'UC Main Campus',
      avatarUrl: '',
      initials: 'EC',
      fallbackColor: '#D97706',
      bio: 'Focuses on visual micro-interactions, responsive mobile layouts, modal states, accessibility guidelines, and interactive marketplace cards.',
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
      campus: 'UC Banilad Campus',
      avatarUrl: '',
      initials: 'JS',
      fallbackColor: '#059669',
      bio: 'Develops interactive React 18 & TypeScript frontend components, state management contexts, real-time message drawers, and high-performance marketplace filters.',
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
      campus: 'UC Main Campus',
      avatarUrl: '',
      initials: 'LB',
      fallbackColor: '#0D9488',
      bio: 'Builds responsive client views, modal dialogues, interactive form validation, student verification flows, and smooth CSS animations.',
      skills: ['Responsive Client Views', 'Form Validations & Feedback', 'Verification Modal Flow', 'Interactive Animations', 'Cross-Browser Testing'],
      githubUrl: 'https://github.com/bersalespaul9-ctrl',
      facebookUrl: 'https://www.facebook.com/paul.bersales.15'
    }
  ];

  const campusCoordinators = [
    { campus: 'UC Main Campus', rep: 'College of Computer Studies (CCS) & Supreme Student Council' },
    { campus: 'UC Banilad Campus', rep: 'College of Nursing & Allied Health Sciences Representatives' },
    { campus: 'UC Lapu-Lapu & Mandaue (LM)', rep: 'College of Engineering & Hospitality Management Council' },
    { campus: 'UC METC (Mambaling)', rep: 'Maritime Cadets Muster Liaison & Midshipman Corps' },
    { campus: 'UC PRI (High School)', rep: 'Senior High School Student Leaders (STEM / ABM / HUMSS)' },
    { campus: 'UC Pardo-Talisay', rep: 'Student Activities & Campus Registration Desk' },
    { campus: 'UC South Campus', rep: 'Basic Education & High School Faculty Advisor' },
    { campus: 'UC Medical Center (UCMC)', rep: 'Medical & Clinical Interns Coordination Desk' }
  ];

  const downloadResources = [
    {
      title: 'Safe Campus Meetup Guide & Checkpoints (PDF)',
      category: 'Safety & Meetup Handbook',
      desc: 'Official guide listing guarded meetup booths, recommended daytime hours, and guard post contact numbers across all 8 UC campuses.',
      file: 'TradeLink-Safe-Meetup-Guide.pdf'
    },
    {
      title: 'Student Seller & Barter Code of Conduct',
      category: 'Policy & Academic Integrity',
      desc: 'Rules regarding prohibited academic materials (exam questionnaires, leak keys), pricing fairness, and student honor code standards.',
      file: 'TradeLink-Student-Code-of-Conduct.pdf'
    },
    {
      title: '4-Digit Handshake Verification Protocol Sheet',
      category: 'Transaction Security',
      desc: 'Step-by-step visual infographic explaining how buyers and sellers exchange and verify the 4-digit code in front of campus security.',
      file: 'TradeLink-Handshake-Protocol.pdf'
    },
    {
      title: 'TradeLink Brand Kit & Style Tokens',
      category: 'Design & Visual Assets',
      desc: 'Official University of Cebu Blue (#002B7F), Gold (#FFC72C), vector logos, typography specifications, and social media assets.',
      file: 'TradeLink-Brand-Kit-2026.zip'
    }
  ];

  // Carousel navigation handlers
  const handlePrev = () => {
    setCarouselIndex((prev) => (prev === 0 ? teamMembers.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCarouselIndex((prev) => (prev === teamMembers.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="container" style={{ maxWidth: '1040px', padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Page Header */}
      <div>
        <button
          onClick={() => onNavigate('home')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            color: '#64748B',
            fontSize: '0.82rem',
            fontWeight: 600,
            marginBottom: '0.5rem',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: 0
          }}
        >
          <ChevronLeft size={16} /> Back to Home
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--uc-blue)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <Users size={15} /> Platform Creators & Core Team
        </div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.25rem', fontFamily: 'var(--font-display)' }}>
          The Team Behind TradeLink
        </h1>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '0.35rem' }}>
          Meet the 8 student creators and engineers who conceptualized, designed, and developed the TradeLink platform for the University of Cebu community.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border-subtle)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
        {[
          { id: 'team', label: 'Development & Engineering Team', icon: Code2 },
          { id: 'hierarchy', label: 'Campus Governance & Liaisons', icon: Building2 },
          { id: 'downloads', label: 'Downloadable Resources & Guides', icon: Download }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.65rem 1.15rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: isActive ? 800 : 600,
                backgroundColor: isActive ? 'var(--uc-blue)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: 3D CAROUSEL & TEAM ROSTER */}
      {activeTab === 'team' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {/* Controls Bar: Carousel / Grid Switcher & Counter */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {teamMembers[carouselIndex].name}
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                ({carouselIndex + 1} of {teamMembers.length})
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => setViewMode('carousel')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: viewMode === 'carousel' ? 800 : 500,
                  backgroundColor: viewMode === 'carousel' ? 'var(--uc-blue)' : 'var(--bg-surface)',
                  color: viewMode === 'carousel' ? '#FFFFFF' : 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer'
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
                  padding: '0.45rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: viewMode === 'grid' ? 800 : 500,
                  backgroundColor: viewMode === 'grid' ? 'var(--uc-blue)' : 'var(--bg-surface)',
                  color: viewMode === 'grid' ? '#FFFFFF' : 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
              >
                <LayoutGrid size={14} /> All Members Grid
              </button>
            </div>
          </div>

          {/* VIEW 1: 3D CAROUSEL PRESENTATION */}
          {viewMode === 'carousel' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.75rem' }}>
              {/* 3D Stage */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '750px',
                  height: '490px',
                  perspective: '1200px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}
              >
                {teamMembers.map((member, idx) => {
                  // Calculate relative offset from current center card
                  let offset = (idx - carouselIndex + teamMembers.length) % teamMembers.length;
                  if (offset > teamMembers.length / 2) {
                    offset -= teamMembers.length;
                  }

                  const isActive = offset === 0;
                  const isPrev = offset === -1;
                  const isNext = offset === 1;
                  const isVisible = Math.abs(offset) <= 2;

                  if (!isVisible) return null;

                  // 3D Transform calculations
                  let translateX = 0;
                  let translateZ = 0;
                  let rotateY = 0;
                  let scale = 1;
                  let opacity = 1;
                  let zIndex = 10;

                  if (isActive) {
                    translateX = 0;
                    translateZ = 60;
                    rotateY = 0;
                    scale = 1;
                    opacity = 1;
                    zIndex = 30;
                  } else if (isNext) {
                    translateX = 220;
                    translateZ = -70;
                    rotateY = -24;
                    scale = 0.86;
                    opacity = 0.78;
                    zIndex = 20;
                  } else if (isPrev) {
                    translateX = -220;
                    translateZ = -70;
                    rotateY = 24;
                    scale = 0.86;
                    opacity = 0.78;
                    zIndex = 20;
                  } else if (offset === 2) {
                    translateX = 360;
                    translateZ = -160;
                    rotateY = -35;
                    scale = 0.74;
                    opacity = 0.4;
                    zIndex = 10;
                  } else if (offset === -2) {
                    translateX = -360;
                    translateZ = -160;
                    rotateY = 35;
                    scale = 0.74;
                    opacity = 0.4;
                    zIndex = 10;
                  }

                  return (
                    <div
                      key={member.id}
                      onClick={() => !isActive && setCarouselIndex(idx)}
                      style={{
                        position: 'absolute',
                        width: '320px',
                        height: '450px',
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: '20px',
                        padding: '1.75rem',
                        boxShadow: isActive
                          ? '0 25px 50px -12px rgba(0, 43, 127, 0.35), 0 0 0 2px #FFC72C'
                          : '0 10px 25px -5px rgba(0,0,0,0.1)',
                        border: isActive ? '2px solid #FFC72C' : '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                        transition: 'all 0.45s cubic-bezier(0.25, 1, 0.5, 1)',
                        zIndex,
                        opacity,
                        cursor: isActive ? 'default' : 'pointer',
                        userSelect: 'none',
                        boxSizing: 'border-box'
                      }}
                    >
                      {/* Card Top: Photo & Identity */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.65rem' }}>
                        {/* Avatar */}
                        <div style={{ position: 'relative' }}>
                          {member.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt={member.name}
                              style={{
                                width: '92px',
                                height: '92px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: `3.5px solid ${member.fallbackColor}`,
                                boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
                                backgroundColor: 'var(--bg-subtle)'
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '92px',
                                height: '92px',
                                borderRadius: '50%',
                                background: member.badgeColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#FFFFFF',
                                fontSize: '1.9rem',
                                fontWeight: 900,
                                letterSpacing: '0.04em',
                                border: '3.5px solid #FFFFFF',
                                boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                              }}
                            >
                              {member.initials}
                            </div>
                          )}
                          {member.id === 'jhonrid' && (
                            <span
                              style={{
                                position: 'absolute',
                                bottom: '-4px',
                                right: '-4px',
                                backgroundColor: '#FFC72C',
                                color: '#002B7F',
                                fontSize: '0.62rem',
                                fontWeight: 900,
                                padding: '0.15rem 0.45rem',
                                borderRadius: '9999px',
                                border: '2px solid #FFFFFF',
                                textTransform: 'uppercase'
                              }}
                            >
                              LEAD
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                            {member.name}
                          </h3>
                          <div
                            style={{
                              display: 'inline-block',
                              marginTop: '0.35rem',
                              padding: '0.2rem 0.65rem',
                              borderRadius: '9999px',
                              background: member.badgeColor,
                              color: '#FFFFFF',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              letterSpacing: '0.03em'
                            }}
                          >
                            {member.role}
                          </div>

                          {/* CAMPUS BADGE (PROMINENTLY DISPLAYED IN CARD) */}
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.35rem',
                              backgroundColor: 'rgba(0, 43, 127, 0.08)',
                              color: 'var(--uc-blue)',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '6px',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              marginTop: '0.45rem'
                            }}
                          >
                            <MapPin size={13} color="var(--uc-blue)" />
                            <span>{member.campus}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Middle: Bio snippet */}
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, textAlign: 'center' }}>
                        {member.bio}
                      </p>

                      {/* Card Bottom: ONLY Official Socials (Facebook & GitHub - NO EMAIL) */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.85rem',
                          borderTop: '1px solid var(--border-subtle)',
                          paddingTop: '1rem',
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
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              padding: '0.45rem 0.95rem',
                              borderRadius: '8px',
                              backgroundColor: '#1877F2',
                              color: '#FFFFFF',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              textDecoration: 'none',
                              transition: 'transform 0.15s ease, filter 0.15s ease',
                              boxShadow: '0 2px 6px rgba(24, 119, 242, 0.3)'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                          >
                            {/* Official Facebook SVG Logo */}
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            <span>Facebook</span>
                          </a>
                        )}

                        {/* Official GitHub Button - OMITTED IF NO GITHUB LINK */}
                        {member.githubUrl && member.githubUrl.trim() !== '' && (
                          <a
                            href={member.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`${member.name} on GitHub`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              padding: '0.45rem 0.95rem',
                              borderRadius: '8px',
                              backgroundColor: '#24292F',
                              color: '#FFFFFF',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              textDecoration: 'none',
                              transition: 'transform 0.15s ease, filter 0.15s ease',
                              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                          >
                            {/* Official GitHub Invertocat SVG Logo */}
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                            </svg>
                            <span>GitHub</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Carousel Controls: Arrows & Indicator Dots */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <button
                  onClick={handlePrev}
                  aria-label="Previous member"
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1.5px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--uc-blue)';
                    e.currentTarget.style.color = '#FFFFFF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                >
                  <ChevronLeft size={20} />
                </button>

                {/* Dots */}
                <div style={{ display: 'flex', gap: '0.45rem' }}>
                  {teamMembers.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCarouselIndex(i)}
                      aria-label={`Jump to team member ${i + 1}`}
                      style={{
                        width: i === carouselIndex ? '24px' : '8px',
                        height: '8px',
                        borderRadius: '9999px',
                        backgroundColor: i === carouselIndex ? 'var(--uc-blue)' : 'var(--border-subtle)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        padding: 0
                      }}
                    />
                  ))}
                </div>

                <button
                  onClick={handleNext}
                  aria-label="Next member"
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1.5px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--uc-blue)';
                    e.currentTarget.style.color = '#FFFFFF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}

          {/* VIEW 2: FULL TEAM GRID PRESENTATION */}
          {viewMode === 'grid' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="clean-card"
                  style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    borderTop: member.id === 'jhonrid' ? '4px solid #FFC72C' : '4px solid var(--uc-blue)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: `2.5px solid ${member.fallbackColor}`,
                          boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                          flexShrink: 0
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '50%',
                          background: member.badgeColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          fontSize: '1.35rem',
                          fontWeight: 900,
                          letterSpacing: '0.04em',
                          border: '2.5px solid #FFFFFF',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
                          textShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          flexShrink: 0
                        }}
                      >
                        {member.initials}
                      </div>
                    )}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                          {member.name}
                        </h4>
                        {member.id === 'jhonrid' && (
                          <span style={{ fontSize: '0.62rem', backgroundColor: '#FFC72C', color: '#002B7F', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 900 }}>
                            LEAD
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--uc-blue)', marginTop: '2px' }}>
                        {member.role}
                      </div>
                      {/* Campus Badge */}
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: 'var(--uc-blue)', fontWeight: 700, marginTop: '3px' }}>
                        <MapPin size={12} /> {member.campus}
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    {member.bio}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem', flexWrap: 'wrap' }}>
                    {member.facebookUrl && member.facebookUrl.trim() !== '' && (
                      <a
                        href={member.facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Facebook"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          backgroundColor: '#1877F2',
                          color: '#FFF',
                          fontSize: '0.74rem',
                          fontWeight: 700,
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
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          backgroundColor: '#24292F',
                          color: '#FFF',
                          fontSize: '0.74rem',
                          fontWeight: 700,
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
              ))}
            </div>
          )}

          {/* CRITICAL VERIFICATION POLICY NOTICE: ID ONLY, NO COR */}
          <div className="clean-card" style={{ padding: '1.5rem', backgroundColor: '#FEF3C7', border: '1.5px solid #FDE68A', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#B45309', fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase' }}>
              <AlertTriangle size={17} /> Official Campus Verification Policy
            </div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#92400E', margin: 0 }}>
              Why TradeLink ONLY Accepts Official Student IDs (Not COR / Study Load)
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#78350F', lineHeight: 1.65, margin: 0 }}>
              To ensure 100% scam-free and safe campus transactions, TradeLink’s verification protocol requires matching your <strong>live camera selfie</strong> directly to the <strong>facial portrait on your official physical or digital UC Student ID card</strong>.
            </p>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.7)', padding: '0.85rem', borderRadius: '8px', fontSize: '0.82rem', color: '#92400E', lineHeight: 1.6 }}>
              <strong>Study Load / COR (Certificate of Registration) is strictly NOT accepted</strong> because study loads lack photographic facial biometric data, which would allow bad actors to impersonate students. Only official UC Student ID cards with photo are approved.
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CAMPUS GOVERNANCE & HIERARCHY */}
      {activeTab === 'hierarchy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div className="clean-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={20} color="var(--uc-blue)" /> Multi-Campus Governance Model
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              To maintain physical safety and academic honor standards across all 8 University of Cebu hubs, TradeLink coordinates with student bodies and campus security desks in a decentralized network.
            </p>

            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', borderLeft: '4px solid #FFC72C' }}>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Tier 1: University & SAO Alignment</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Sets community rules, enforces academic honesty (no test questionnaires/answers), and oversees severe grievance escalations.
                </div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', borderLeft: '4px solid var(--uc-blue)' }}>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Tier 2: Campus Safety & Guard Posts</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Staffed security stations at UC Main, Banilad, LM, METC, PRI, PT, South, and UCMC serve as the mandatory meeting checkpoints for in-person handshakes.
                </div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', borderLeft: '4px solid var(--accent-green)' }}>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Tier 3: Student Ambassadors & Peer Moderators</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Student councils and college representatives help verify student IDs, maintain active campus wanted boards, and assist peers.
                </div>
              </div>
            </div>
          </div>

          {/* 8 Campus Coordinators Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Building2 size={18} color="var(--uc-blue)" /> Campus Liaison Directory
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.85rem' }}>
              {campusCoordinators.map((item, i) => (
                <div key={i} className="clean-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--uc-blue)' }}>{item.campus}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{item.rep}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DOWNLOADABLE RESOURCES & GUIDES */}
      {activeTab === 'downloads' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="clean-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Download size={20} color="var(--uc-blue)" /> Student Guides & Official Platform Assets
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              Download official guides, printable safety infographics, and student seller toolkits to stay protected and get the most out of TradeLink.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {downloadResources.map((res, idx) => (
              <div
                key={idx}
                className="clean-card"
                style={{
                  padding: '1.35rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.85rem'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--uc-blue)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {res.category}
                  </div>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                    {res.title}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: '0.35rem' }}>
                    {res.desc}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>{res.file}</span>
                  <button
                    onClick={() => {
                      alert(`Downloading resource: ${res.title}\nIn case of questions, contact uc.tradelink@gmail.com.`);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--uc-blue)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    <Download size={14} /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

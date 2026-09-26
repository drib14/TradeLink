import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Building2, Plus, GraduationCap, ArrowRight } from 'lucide-react';
import { Campus } from '../../types';

export interface CampusSlide {
  id: string;
  campusName: string;
  shortTag: Campus | 'All Campuses';
  title: string;
  subtitle: string;
  imageUrl: string;
  highlight: string;
  colleges: string;
}

export const CAMPUS_SLIDES: CampusSlide[] = [
  // 1. UC Main Campus
  {
    id: 'slide-main',
    campusName: 'UC Main Campus',
    shortTag: 'UC Main',
    title: 'UC Main Student Marketplace',
    subtitle: 'Trade CCS coding books, Engineering drafting tools, Law and CBA reviewers, laptops, and uniforms safely with campus peers.',
    imageUrl: '/images/campuses/uc-main.jpg',
    highlight: 'Sanciangko & J. Alcantara Student Hub',
    colleges: 'CCS • CBA • Law • Criminology • SHS'
  },
  // 2. UC Banilad Campus
  {
    id: 'slide-banilad',
    campusName: 'UC Banilad Campus',
    shortTag: 'UC Banilad',
    title: 'UC Banilad Peer Exchange',
    subtitle: 'Buy, sell, and swap clinical scrubs, nursing duty kits, medical reviewers, and dorm essentials with fellow Banilad students.',
    imageUrl: '/images/campuses/uc-banilad.jpg',
    highlight: 'Banilad Atrium & Cafeteria Plaza',
    colleges: 'Nursing • Allied Health • CBA • Medicine'
  },
  // 3. UC Lapu-Lapu & Mandaue (LM)
  {
    id: 'slide-lm',
    campusName: 'UC Lapu-Lapu & Mandaue (LM)',
    shortTag: 'UC LM',
    title: 'UC LM Tech & Engineering Barter',
    subtitle: 'Peer-to-peer campus exchange for Engineering tools, scientific calculators, PC peripherals, uniforms, and gadgets in Mandaue.',
    imageUrl: '/images/campuses/uc-lm.jpg',
    highlight: 'A.C. Cortes Campus Hub',
    colleges: 'Engineering • IT • Business • Tourism'
  },
  // 4. UC METC Maritime Education & Training Center
  {
    id: 'slide-metc',
    campusName: 'UC METC Maritime Center',
    shortTag: 'UC METC',
    title: 'UC METC Maritime Trading Post',
    subtitle: 'Cadet-to-cadet marketplace for merchant marine uniforms, shoulder boards, navigation reviewers, gear, and student electronics.',
    imageUrl: '/images/campuses/uc-metc.jpg',
    highlight: 'Alumnos St. Campus Grounds',
    colleges: 'BSMT • BSMarE • Naval Architecture'
  },
  // 5. UC PRI (Junior & Senior High Campus)
  {
    id: 'slide-pri',
    campusName: 'UC PRI (Junior & Senior High)',
    shortTag: 'UC PRI',
    title: 'UC PRI High School Marketplace',
    subtitle: 'Direct student exchange for Junior High (Grades 7–10) reviewers, Senior High STEM/ABM modules, PE uniforms, and calculators.',
    imageUrl: '/images/campuses/uc-main.jpg',
    highlight: 'J. Alcantara Student Zone',
    colleges: 'Junior High (7-10) • STEM • ABM • HUMSS • TVL'
  },
  // 6. UC Pardo-Talisay Campus
  {
    id: 'slide-pt',
    campusName: 'UC Pardo-Talisay',
    shortTag: 'UC Pardo-Talisay',
    title: 'UC Pardo-Talisay Student Market',
    subtitle: 'South Cebu student board for pre-loved textbooks, uniforms, tech gadgets, and school gear with verified campus peers.',
    imageUrl: '/images/campuses/uc-pardo-talisay.jpg',
    highlight: 'Pardo-Talisay Campus Plaza',
    colleges: 'SHS • Education • Criminology • CBA'
  },
  // 7. UC South Campus
  {
    id: 'slide-south',
    campusName: 'UC South Campus',
    shortTag: 'UC South Campus',
    title: 'UC South Campus Exchange',
    subtitle: 'Local campus marketplace for secondary modules, reference books, drawing kits, and student uniforms on Sanciangko corridor.',
    imageUrl: '/images/campuses/uc-south.jpg',
    highlight: 'South Campus Student Plaza',
    colleges: 'Senior High • Junior High • Academics'
  },
  // 8. UC Medical Center (UCMed)
  {
    id: 'slide-ucmed',
    campusName: 'UC Medical Center (UCMed)',
    shortTag: 'UC Medical Center',
    title: 'UCMed Clinical & Medical Exchange',
    subtitle: 'Medical student exchange for clinical diagnostic kits, stethoscopes, medical textbooks, and healthcare essentials.',
    imageUrl: '/images/campuses/uc-ucmed.jpg',
    highlight: 'Ouano Ave. Student Lounge',
    colleges: 'Medicine • Clinical Interns • Health Sciences'
  },
  // 9. All Campuses Network
  {
    id: 'slide-all',
    campusName: 'All Campuses Network',
    shortTag: 'All Campuses',
    title: 'TradeLink Inter-Campus Network',
    subtitle: 'Our student-powered marketplace and barter network connecting peers across all 8 campuses. 0% fees, 100% verified students.',
    imageUrl: '/images/campuses/uc-all-campuses.jpg',
    highlight: 'Unified Student Barter Network',
    colleges: 'All 8 Campuses • High School • College • Grad'
  }
];

interface CampusCarouselBannerProps {
  onSelectCampus?: (campus: Campus | 'ALL') => void;
  onPostListing?: () => void;
  onExplore?: () => void;
}

export const CampusCarouselBanner: React.FC<CampusCarouselBannerProps> = ({
  onSelectCampus,
  onPostListing,
  onExplore: _onExplore
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % CAMPUS_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev === 0 ? CAMPUS_SLIDES.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIdx((prev) => (prev + 1) % CAMPUS_SLIDES.length);
  };

  const slide = CAMPUS_SLIDES[currentIdx];

  const touchStartXRef = React.useRef<number | null>(null);
  const touchEndXRef = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const diff = touchStartXRef.current - touchEndXRef.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  const handleCampusClick = (targetSlide: CampusSlide) => {
    if (onSelectCampus) {
      if (targetSlide.shortTag === 'All Campuses') {
        onSelectCampus('ALL');
      } else {
        onSelectCampus(targetSlide.shortTag);
      }
    }
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'relative',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 20px 40px -10px rgba(0, 43, 127, 0.35)',
        backgroundColor: '#001D59',
        minHeight: 'clamp(360px, 42vw, 440px)',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        touchAction: 'pan-y'
      }}
    >
      {/* 1. Crossfade Slide Backgrounds */}
      {CAMPUS_SLIDES.map((s, index) => {
        const isCurrent = index === currentIdx;
        return (
          <div
            key={s.id}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: isCurrent ? 1 : 0,
              transform: isCurrent ? 'scale(1)' : 'scale(1.04)',
              transition: 'opacity 750ms cubic-bezier(0.4, 0, 0.2, 1), transform 1000ms cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: isCurrent ? 'auto' : 'none',
              zIndex: isCurrent ? 1 : 0
            }}
          >
            <img
              src={s.imageUrl}
              alt={s.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center'
              }}
            />
          </div>
        );
      })}

      {/* 2. Solid High-Contrast Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 29, 89, 0.85)',
          backdropFilter: 'blur(2px)',
          zIndex: 2
        }}
      />

      {/* 3. Foreground Content Container — Ultra Responsive */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 'clamp(1.2rem, 3.5vw, 2.5rem)',
          paddingLeft: 'clamp(1.5rem, 4.5vw, 4rem)',
          paddingRight: 'clamp(1.5rem, 4.5vw, 4rem)',
          zIndex: 5,
          maxWidth: '100%',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* Top Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span
            style={{
              backgroundColor: '#FFC72C',
              color: '#002B7F',
              padding: '0.3rem 0.8rem',
              borderRadius: '9999px',
              fontSize: 'clamp(0.7rem, 1.2vw, 0.75rem)',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              boxShadow: '0 2px 8px rgba(255, 199, 44, 0.4)'
            }}
          >
            <Building2 size={13} /> {slide.shortTag === 'All Campuses' ? 'TradeLink Network' : `Campus ${currentIdx + 1} of 8`}
          </span>

          <span
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              padding: '0.3rem 0.75rem',
              borderRadius: '9999px',
              fontSize: 'clamp(0.7rem, 1.2vw, 0.75rem)',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              lineHeight: 1
            }}
          >
            <MapPin size={12} color="#FFC72C" style={{ flexShrink: 0 }} />
            <span>{slide.highlight}</span>
          </span>
        </div>

        {/* Hero Title & Subtitle with Clean Layout */}
        <div key={slide.id} style={{ animation: 'fadeInUp 0.45s ease-out', margin: '0.75rem 0' }}>
          <h2
            style={{
              fontSize: 'clamp(1.25rem, 2.8vw, 2.2rem)',
              fontWeight: 900,
              color: '#FFFFFF',
              lineHeight: 1.2,
              textShadow: '0 2px 10px rgba(0,0,0,0.35)',
              fontFamily: 'var(--font-display)',
              margin: 0
            }}
          >
            {slide.title}
          </h2>

          <p
            style={{
              fontSize: 'clamp(0.8rem, 1.2vw, 0.92rem)',
              color: '#E2E8F0',
              marginTop: '0.45rem',
              marginBottom: 0,
              lineHeight: 1.5,
              maxWidth: '620px',
              textShadow: '0 1px 4px rgba(0,0,0,0.4)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {slide.subtitle}
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginTop: '0.65rem',
              color: '#FFC72C',
              fontSize: 'clamp(0.74rem, 1.1vw, 0.82rem)',
              fontWeight: 700,
              lineHeight: 1
            }}
          >
            <GraduationCap size={15} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{slide.colleges}</span>
          </div>
        </div>

        {/* 4. Action Buttons & Indicator row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleCampusClick(slide)}
              style={{
                backgroundColor: '#FFC72C',
                color: '#002B7F',
                padding: '0.6rem 1.25rem',
                borderRadius: '10px',
                fontSize: 'clamp(0.78rem, 1.2vw, 0.86rem)',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                border: 'none',
                boxShadow: '0 4px 14px rgba(255, 199, 44, 0.35)',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 199, 44, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(255, 199, 44, 0.35)';
              }}
            >
              <span>{slide.shortTag === 'All Campuses' ? 'Browse All Items' : `Browse ${slide.shortTag}`}</span>
              <ArrowRight size={14} style={{ flexShrink: 0 }} />
            </button>

            <button
              onClick={() => onPostListing?.()}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(10px)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '0.6rem 1.2rem',
                borderRadius: '10px',
                fontSize: 'clamp(0.78rem, 1.2vw, 0.84rem)',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.22)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Plus size={15} style={{ flexShrink: 0 }} />
              <span>Post Listing</span>
            </button>
          </div>

          {/* Quick Slide Indicator Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: 'rgba(0, 29, 89, 0.65)',
              padding: '4px 8px',
              borderRadius: '9999px',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            {CAMPUS_SLIDES.map((s, idx) => {
              const isActive = idx === currentIdx;
              return (
                <button
                  key={s.id}
                  onClick={() => setCurrentIdx(idx)}
                  title={`${idx + 1}. ${s.campusName}`}
                  aria-label={`Go to slide ${idx + 1}: ${s.campusName}`}
                  style={{
                    width: isActive ? '20px' : '6px',
                    height: '6px',
                    borderRadius: '9999px',
                    backgroundColor: isActive ? '#FFC72C' : 'rgba(255, 255, 255, 0.4)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    border: 'none',
                    padding: 0
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Arrows (Desktop Only) */}
      <button
        onClick={handlePrev}
        aria-label="Previous campus slide"
        className="desktop-only"
        style={{
          position: 'absolute',
          left: '0.75rem',
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: 'transparent',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '50%',
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          opacity: 0.8
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.8';
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
        }}
      >
        <ChevronLeft size={24} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
      </button>

      <button
        onClick={handleNext}
        aria-label="Next campus slide"
        className="desktop-only"
        style={{
          position: 'absolute',
          right: '0.75rem',
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: 'transparent',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '50%',
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          opacity: 0.8
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.8';
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
        }}
      >
        <ChevronRight size={24} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
      </button>
    </div>
  );
};

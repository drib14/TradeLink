import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Sparkles, GraduationCap, ArrowRight } from 'lucide-react';
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
    title: 'UC Main Marketplace Hub',
    subtitle: 'Trade CCS coding books, Engineering drafting tools, Law and CBA reviewers, laptops, and uniforms safely at Sanciangko Gate.',
    imageUrl: '/images/campuses/uc-main.jpg',
    highlight: 'Sanciangko & J. Alcantara Trading Hub',
    colleges: 'CCS • CBA • Law • Criminology • SHS'
  },
  // 2. UC Banilad Campus
  {
    id: 'slide-banilad',
    campusName: 'UC Banilad Campus',
    shortTag: 'UC Banilad',
    title: 'UC Banilad Student Exchange',
    subtitle: 'Buy, sell, and swap clinical scrubs, nursing duty kits, medical reviewers, and dorm essentials with fellow Banilad students.',
    imageUrl: '/images/campuses/uc-banilad.jpg',
    highlight: 'Banilad Atrium & Cafeteria Meetup Desk',
    colleges: 'Nursing • Allied Health • CBA • Medicine'
  },
  // 3. UC Lapu-Lapu & Mandaue (LM)
  {
    id: 'slide-lm',
    campusName: 'UC Lapu-Lapu & Mandaue (LM)',
    shortTag: 'UC LM',
    title: 'UC LM Engineering & Tech Barter',
    subtitle: 'Peer-to-peer campus exchange for Engineering kits, scientific calculators, PC peripherals, uniforms, and student gadgets in Mandaue.',
    imageUrl: '/images/campuses/uc-lm.jpg',
    highlight: 'A.C. Cortes Guarded Turnstile Zone',
    colleges: 'Engineering • IT • Business • Tourism'
  },
  // 4. UC METC Maritime Education & Training Center
  {
    id: 'slide-metc',
    campusName: 'UC METC Maritime Center',
    shortTag: 'UC METC',
    title: 'UC METC Maritime Trading Post',
    subtitle: 'Cadet-to-cadet marketplace for merchant marine uniforms, shoulder boards, navigation reviewers, safety gear, and electronics.',
    imageUrl: '/images/campuses/uc-metc.jpg',
    highlight: 'Alumnos St. Guarded Security Post',
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
    highlight: 'J. Alcantara High School Safety Zone',
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
    highlight: 'Pardo-Talisay Guarded Main Gate',
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
    title: 'UCMed Clinical & Med Exchange',
    subtitle: 'Medical student exchange for clinical diagnostic kits, stethoscopes, medical textbooks, and healthcare essentials.',
    imageUrl: '/images/campuses/uc-ucmed.jpg',
    highlight: 'Ouano Ave. Clinical Lobby Desk',
    colleges: 'Medicine • Clinical Interns • Health Sciences'
  },
  // 9. University of Cebu - All Campuses Network
  {
    id: 'slide-all',
    campusName: 'All UC Campuses',
    shortTag: 'All Campuses',
    title: 'University of Cebu Marketplace Network',
    subtitle: 'The official verified student trading platform for Junior High, Senior High, and College students across all UC campuses. 0% fees, 100% verified.',
    imageUrl: '/images/campuses/uc-all-campuses.jpg',
    highlight: 'System-Wide Safe Student Trading',
    colleges: 'All 8 Campuses • JHS • SHS • College'
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
  onExplore
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % CAMPUS_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isPaused]);

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev === 0 ? CAMPUS_SLIDES.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIdx((prev) => (prev + 1) % CAMPUS_SLIDES.length);
  };

  const slide = CAMPUS_SLIDES[currentIdx];

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
      style={{
        position: 'relative',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 20px 40px -10px rgba(0, 43, 127, 0.35)',
        backgroundColor: '#001D59',
        height: 'clamp(350px, 45vw, 440px)',
        width: '100%',
        transition: 'all 0.3s ease'
      }}
    >
      {/* 1. Authentic Local Campus Photograph (100% Guaranteed Render) */}
      <img
        key={slide.imageUrl}
        src={slide.imageUrl}
        alt={slide.title}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          transition: 'opacity 0.5s ease-in-out',
          zIndex: 1
        }}
      />

      {/* 2. Layered High-Contrast Gradient & Glass Overlay for Maximum Readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, rgba(0, 29, 89, 0.94) 0%, rgba(0, 43, 127, 0.85) 45%, rgba(0, 29, 89, 0.45) 100%)',
          backdropFilter: 'blur(1.5px)',
          zIndex: 2
        }}
      />

      {/* 3. Foreground Content Container */}
      <div
        style={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 'clamp(1.25rem, 3.5vw, 2.5rem)',
          zIndex: 5,
          maxWidth: '860px'
        }}
      >
        {/* Top Badges & Campus Index Counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span
            style={{
              backgroundColor: '#FFC72C',
              color: '#002B7F',
              padding: '0.3rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              boxShadow: '0 2px 8px rgba(255, 199, 44, 0.4)'
            }}
          >
            <Sparkles size={13} /> {slide.shortTag === 'All Campuses' ? 'UC Marketplace Network' : `Campus ${currentIdx + 1} of 8`}
          </span>

          <span
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              padding: '0.3rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <MapPin size={12} color="#FFC72C" /> {slide.highlight}
          </span>
        </div>

        {/* Hero Title & Subtitle */}
        <div>
          <h2
            style={{
              fontSize: 'clamp(1.75rem, 3.8vw, 2.75rem)',
              fontWeight: 800,
              color: '#FFFFFF',
              lineHeight: 1.15,
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
              fontFamily: 'var(--font-display)'
            }}
          >
            {slide.title}
          </h2>

          <p
            style={{
              fontSize: 'clamp(0.85rem, 1.5vw, 1.05rem)',
              color: '#E2E8F0',
              marginTop: '0.65rem',
              lineHeight: 1.55,
              maxWidth: '650px',
              textShadow: '0 1px 4px rgba(0,0,0,0.4)'
            }}
          >
            {slide.subtitle}
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              marginTop: '0.75rem',
              color: '#FFC72C',
              fontSize: '0.8rem',
              fontWeight: 700
            }}
          >
            <GraduationCap size={15} />
            <span>{slide.colleges}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', width: '100%' }}>
          <button
            onClick={() => handleCampusClick(slide)}
            className="btn-gold"
            style={{
              padding: '0.7rem 1.25rem',
              fontSize: '0.86rem',
              fontWeight: 800,
              boxShadow: '0 6px 20px rgba(255, 199, 44, 0.35)',
              flex: '1 1 auto',
              justifyContent: 'center'
            }}
          >
            <span>{slide.shortTag === 'All Campuses' ? 'Browse All Campuses' : `Browse ${slide.campusName}`}</span>
            <ArrowRight size={15} />
          </button>

          <button
            onClick={() => onPostListing?.()}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              color: '#FFFFFF',
              border: '1.5px solid rgba(255, 255, 255, 0.4)',
              padding: '0.68rem 1.2rem',
              borderRadius: '10px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              flex: '1 1 auto',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)')}
          >
            Post Item for Sale / Swap
          </button>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        aria-label="Previous campus slide"
        style={{
          position: 'absolute',
          left: '1rem',
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: 'rgba(0, 29, 89, 0.65)',
          backdropFilter: 'blur(6px)',
          color: '#FFFFFF',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20,
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#002B7F')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 29, 89, 0.65)')}
      >
        <ChevronLeft size={20} />
      </button>

      <button
        onClick={handleNext}
        aria-label="Next campus slide"
        style={{
          position: 'absolute',
          right: '1rem',
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: 'rgba(0, 29, 89, 0.65)',
          backdropFilter: 'blur(6px)',
          color: '#FFFFFF',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20,
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#002B7F')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 29, 89, 0.65)')}
      >
        <ChevronRight size={20} />
      </button>

      {/* 8-Campus Quick Slide Indicator Buttons */}
      <div
        style={{
          position: 'absolute',
          bottom: '1rem',
          right: 'clamp(1rem, 4vw, 2.5rem)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          zIndex: 20,
          backgroundColor: 'rgba(0, 29, 89, 0.6)',
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
                width: isActive ? '24px' : '7px',
                height: '7px',
                borderRadius: '9999px',
                backgroundColor: isActive ? '#FFC72C' : 'rgba(255, 255, 255, 0.4)',
                transition: 'all 0.25s ease',
                cursor: 'pointer'
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

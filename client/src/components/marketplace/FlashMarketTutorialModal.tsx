import React, { useState } from 'react';
import {
  X,
  Zap,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  DollarSign
} from 'lucide-react';

interface FlashMarketTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FlashMarketTutorialModal: React.FC<FlashMarketTutorialModalProps> = ({
  isOpen,
  onClose
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const slides = [
    {
      badge: 'Step 1 of 3: Fast Requests',
      title: 'Urgent Campus Requests',
      description:
        'Post what you need and receive fast offers from fellow students across UC campuses.',
      icon: <Zap size={28} color="#FFC72C" />,
      features: [
        'Post requests for textbooks, uniforms, reviewers, or tools',
        'Direct responses from verified students on your campus',
        'Automatic expiration ensures active, real-time requests'
      ]
    },
    {
      badge: 'Step 2 of 3: Flexible Options',
      title: 'Budget & Barter Modes',
      description:
        'Choose the option that fits your budget:',
      icon: <DollarSign size={28} color="#10B981" />,
      modes: [
        {
          label: 'Target Budget',
          badge: '₱ Price',
          desc: 'Set the amount you want to pay.'
        },
        {
          label: 'Open to Offers',
          badge: 'Barter',
          desc: 'Invite sellers to propose terms or trades.'
        },
        {
          label: 'Donation',
          badge: 'FREE',
          desc: 'Request passed-down reviewers or supplies.'
        }
      ]
    },
    {
      badge: 'Step 3 of 3: Direct Handover',
      title: 'Direct Chat & Handover',
      description:
        'Coordinate safely with fellow students via built-in campus messaging.',
      icon: <ShieldCheck size={28} color="#002B7F" />,
      features: [
        'Private messaging with verified student profiles',
        'Meet at convenient on-campus spots like the library or canteen',
        'Inspect items before completing the transaction'
      ]
    }
  ];

  const slide = slides[currentSlide];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      localStorage.setItem('tradelink_flash_tutorial_seen', 'true');
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('tradelink_flash_tutorial_seen', 'true');
    onClose();
  };

  return (
    <div
      className="modal-backdrop-custom"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 20, 50, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        className="modal-card-custom"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '560px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 43, 127, 0.35)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#002B7F',
            color: '#FFFFFF',
            padding: '1.5rem 1.75rem',
            position: 'relative'
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: '#FFFFFF',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            aria-label="Close tutorial"
          >
            <X size={16} />
          </button>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: 'rgba(255, 199, 44, 0.2)',
              color: '#FFC72C',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '0.65rem'
            }}
          >
            <Zap size={13} />
            <span>{slide.badge}</span>
          </div>

          <h2
            style={{
              fontSize: '1.45rem',
              fontWeight: 900,
              color: '#FFFFFF',
              margin: 0,
              lineHeight: 1.25,
              fontFamily: 'var(--font-display)'
            }}
          >
            {slide.title}
          </h2>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
            {slide.description}
          </p>

          {/* Slide 1 Features */}
          {slide.features && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {slide.features.map((feat, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem',
                    backgroundColor: '#F8FAFC',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0'
                  }}
                >
                  <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontSize: '0.82rem', color: '#1E293B', fontWeight: 600, lineHeight: 1.45 }}>
                    {feat}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Slide 2 Modes */}
          {slide.modes && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {slide.modes.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    backgroundColor: '#F8FAFC',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--uc-blue, #002B7F)' }}>
                      {m.label}
                    </span>
                    <span
                      style={{
                        backgroundColor: '#FFFBEB',
                        color: '#D97706',
                        border: '1px solid #FDE68A',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        fontWeight: 800
                      }}
                    >
                      {m.badge}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4 }}>
                    {m.desc}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Step Dots Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                style={{
                  width: currentSlide === idx ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '9999px',
                  backgroundColor: currentSlide === idx ? 'var(--uc-blue, #002B7F)' : '#CBD5E1',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginTop: '0.5rem' }}>
            {currentSlide > 0 ? (
              <button
                onClick={handlePrev}
                style={{
                  padding: '0.65rem 1.25rem',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: '#475569',
                  backgroundColor: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={15} /> Previous
              </button>
            ) : (
              <button
                onClick={handleFinish}
                style={{
                  padding: '0.65rem 1.25rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#64748B',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Skip Tutorial
              </button>
            )}

            <button
              onClick={handleNext}
              className="btn-primary"
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '0.88rem',
                fontWeight: 800,
                borderRadius: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: 'var(--uc-blue, #002B7F)',
                color: '#FFFFFF'
              }}
            >
              <span>{currentSlide === slides.length - 1 ? 'Got It — Explore Flash Market' : 'Next Step'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

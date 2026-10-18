import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import {
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

  const slides = [
    {
      badge: 'Step 1 of 3: Fast Requests',
      title: 'Urgent Campus Requests',
      description:
        'Post what you need and receive fast offers from fellow students across UC campuses.',
      icon: <Zap size={22} color="#FFC72C" />,
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
      icon: <DollarSign size={22} color="#10B981" />,
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
      icon: <ShieldCheck size={22} color="#002B7F" />,
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={slide.title}
      subtitle={slide.badge}
      icon={slide.icon}
      maxWidth="560px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted, #475569)', lineHeight: 1.6, margin: 0 }}>
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
                  backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                  padding: '0.75rem 0.9rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle, #E2E8F0)'
                }}
              >
                <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.82rem', color: 'var(--text-primary, #1E293B)', fontWeight: 600, lineHeight: 1.45 }}>
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
                  backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                  padding: '0.75rem 0.9rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle, #E2E8F0)'
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
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748B)', lineHeight: 1.4 }}>
                  {m.desc}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Step Dots Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginTop: '0.25rem' }}>
          {currentSlide > 0 ? (
            <button
              type="button"
              onClick={handlePrev}
              style={{
                padding: '0.65rem 1.25rem',
                fontSize: '0.84rem',
                fontWeight: 700,
                color: 'var(--text-secondary, #475569)',
                backgroundColor: 'var(--bg-subtle, #F1F5F9)',
                border: '1px solid var(--border-subtle, #CBD5E1)',
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
              type="button"
              onClick={handleFinish}
              style={{
                padding: '0.65rem 1.25rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--text-muted, #64748B)',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Skip Tutorial
            </button>
          )}

          <button
            type="button"
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
              color: '#FFFFFF',
              cursor: 'pointer'
            }}
          >
            <span>{currentSlide === slides.length - 1 ? 'Got It — Explore Flash Market' : 'Next Step'}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </Modal>
  );
};

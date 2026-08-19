import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, ChevronLeft, ShieldCheck, Zap, ArrowLeftRight, QrCode } from 'lucide-react';

interface FAQPageProps {
  onNavigate: (view: string, param?: any) => void;
}

interface FAQItem {
  question: string;
  answer: string;
  category: 'General' | 'Buying & Selling' | 'Meetups & Safety' | 'Senior High';
}

export const FAQPage: React.FC<FAQPageProps> = ({ onNavigate }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const faqs: FAQItem[] = [
    {
      category: 'General',
      question: 'Who can register and trade on TradeLink?',
      answer: 'TradeLink is open to all enrolled University of Cebu students across all 8 official campuses—including Junior High School (Grades 7–10), Senior High School (STEM, ABM, HUMSS, TVL/GAS), College undergraduates, maritime cadets, and medical students.'
    },
    {
      category: 'Meetups & Safety',
      question: 'How does the 4-Digit Handshake / QR Code verification work?',
      answer: 'When a buyer clicks "Buy Now", an encrypted 4-digit code and Handshake QR Code are generated. During the physical meetup inside the campus guard station, the buyer shows their QR code or gives the 4-digit code to the seller after inspecting the item. Once entered, both students receive +10 Campus Trust Score points!'
    },
    {
      category: 'Buying & Selling',
      question: 'Are there any transaction or listing fees on TradeLink?',
      answer: 'No! TradeLink is 100% free for University of Cebu students. We do not charge fees or take commissions from student trades.'
    },
    {
      category: 'Buying & Selling',
      question: 'Can I sell items other than textbooks and uniforms?',
      answer: 'Yes! While designed for academic life, students can list and swap anything they want—smartphones, laptops, iPads, sneakers, dorm mini-fridges, musical instruments, gaming gear, calculators, and tools.'
    },
    {
      category: 'Senior High',
      question: 'Can Senior High School students use TradeLink?',
      answer: 'Absolutely! Senior High students from UC Main, UC Banilad, UC LM, UC PRI, UC South Campus, UC Pardo-Talisay, and UC METC can buy and sell SHS track reviewers, textbooks, uniforms, and calculators safely.'
    },
    {
      category: 'Meetups & Safety',
      question: 'Where do meetups take place?',
      answer: 'All meetups must occur strictly within designated campus security hubs (such as UC Main Sanciangko Gate, UC Banilad Cuenco Station, UC LM Innovation Lobby, UC METC Muster Station, UC PRI High School Gate, UC PT Talisay Booth, UC South Campus Lobby, or UCMC Hospital Atrium).'
    }
  ];

  const categories = ['All', 'General', 'Buying & Selling', 'Meetups & Safety', 'Senior High'];

  const filteredFAQs = selectedCategory === 'All'
    ? faqs
    : faqs.filter((f) => f.category === selectedCategory);

  return (
    <div className="container" style={{ maxWidth: '860px', padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
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
            marginBottom: '0.5rem'
          }}
        >
          <ChevronLeft size={16} /> Back to Home
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--uc-blue)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <HelpCircle size={15} /> Student Knowledge Base
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.25rem', fontFamily: 'var(--font-display)' }}>
          Frequently Asked Questions
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Everything you need to know about buying, selling, swapping, and safe meetups on campus.
        </p>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '0.45rem 0.95rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: selectedCategory === cat ? 800 : 600,
              backgroundColor: selectedCategory === cat ? 'var(--uc-blue)' : 'var(--bg-surface)',
              color: selectedCategory === cat ? '#FFFFFF' : 'var(--text-secondary)',
              border: selectedCategory === cat ? '1.5px solid var(--uc-blue)' : '1px solid var(--border-subtle)',
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Accordion FAQ List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {filteredFAQs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="clean-card"
              style={{
                overflow: 'hidden',
                transition: 'all 0.15s ease',
                padding: 0
              }}
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                style={{
                  width: '100%',
                  padding: '1.15rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: isOpen ? 'var(--bg-subtle)' : 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: 'none'
                }}
              >
                <span>{faq.question}</span>
                {isOpen ? <ChevronUp size={18} color="var(--uc-blue)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
              </button>

              {isOpen && (
                <div style={{ padding: '0 1.25rem 1.25rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, backgroundColor: 'var(--bg-subtle)', borderTop: '1px solid var(--border-subtle)' }}>
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

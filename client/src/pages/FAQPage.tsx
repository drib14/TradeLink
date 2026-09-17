import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Search,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface FAQPageProps {
  onNavigate: (view: string, param?: any) => void;
}

interface FAQItem {
  question: string;
  answer: string;
  category: 'Meetups & Safety' | 'Handshake & Trust' | 'Buying & Swapping' | 'Student Verification';
  badge?: string;
}

export const FAQPage: React.FC<FAQPageProps> = ({ onNavigate }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const faqs: FAQItem[] = [
    {
      category: 'Meetups & Safety',
      badge: 'Campus Rule',
      question: 'Where do trades take place, and can we meet outside campus?',
      answer: 'All trades must take place strictly inside designated, guarded University of Cebu security booths during daytime hours (7:00 AM – 6:00 PM). Never agree to meet in boarding houses, private dorm rooms, or secluded spots. Meeting at campus security gates ensures physical safety, CCTV coverage, and honest exchanges for both parties.'
    },
    {
      category: 'Handshake & Trust',
      badge: 'Core Protocol',
      question: 'How does the 4-Digit Handshake Code and Trust Score work?',
      answer: 'The 4-digit Handshake Code is your final transaction confirmation. Never give the seller your code until you have physically held, tested, and confirmed the item condition. Once the seller enters your code in the app, the transaction completes and Trust Score points are awarded. All new student accounts start at 0% Trust Score and earn ratings through verified peer transactions.'
    },
    {
      category: 'Meetups & Safety',
      badge: 'Payment Safety',
      question: 'How should I pay for items? Is advance payment allowed?',
      answer: 'Both physical cash and in-person GCash/Maya transfers are accepted. However, you must NEVER send money in advance prior to the physical campus meetup. If paying via GCash, transfer the funds in front of the campus guard desk only after thoroughly inspecting the item.'
    },
    {
      category: 'Meetups & Safety',
      badge: 'Inspection Rights',
      question: 'What happens if an item is damaged or the student does not show up?',
      answer: 'You have zero obligation to accept an item that does not match its listing photos or description—simply decline the trade and do not give your handshake code. For meetups, wait 10 to 15 minutes at the security desk. If the other student fails to arrive without notice, you can safely cancel. Repeated unexcused no-shows trigger automatic punctuality penalties and account suspension.'
    },
    {
      category: 'Student Verification',
      badge: 'Security System',
      question: 'How does the Student Verification System work, and how fast is approval?',
      answer: 'TradeLink uses a secure 3-step verification system requiring your physical UC Student ID card and a live webcam biometric selfie with anti-spoofing challenge actions. Submissions with clear credentials and valid liveness verification (>90% confidence score) are automatically approved instantly. Submissions with blur, mismatched credentials, or suspicious signals are held for manual campus administrator review.'
    },
    {
      category: 'Buying & Swapping',
      badge: 'Direct Barter',
      question: 'How do peer item swaps (barter trades) work without money?',
      answer: 'On items marked "Open to Swap", click "Propose Swap" to select an item from your own active listings to offer in exchange. You and the other student can agree on a straight 1:1 trade, or an uneven trade with a cash difference. Meet at the campus security gate, inspect both items, and exchange the mutual handshake code to finalize the barter.'
    },
    {
      category: 'Buying & Swapping',
      badge: 'Zero Fees',
      question: 'Are there any platform fees or commissions on student sales?',
      answer: 'None at all. TradeLink is 100% free for all University of Cebu students across all 8 campus branches. There are zero listing fees, zero transaction cuts, and zero commissions. 100% of the agreed amount stays between you and your fellow student.'
    },
    {
      category: 'Meetups & Safety',
      badge: 'Dispute & Reports',
      question: 'How do I report scam attempts, abusive behavior, or meetup disputes?',
      answer: 'Click the "Report" button inside the peer chat drawer or on any item listing. You can also contact our student safety desk directly at uc.tradelink@gmail.com. Campus security administrators review flagged accounts and reports within 24 hours to suspend fraudulent or abusive users.'
    }
  ];

  const categories = [
    'All',
    'Meetups & Safety',
    'Handshake & Trust',
    'Buying & Swapping',
    'Student Verification'
  ];

  const filteredFAQs = useMemo(() => {
    return faqs.filter((f) => {
      const matchesCategory = selectedCategory === 'All' || f.category === selectedCategory;
      const matchesQuery =
        !searchQuery.trim() ||
        f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="container" style={{ maxWidth: '880px', padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
            marginBottom: '0.5rem',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: 0
          }}
        >
          <ChevronLeft size={16} /> Back to Home
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--uc-blue)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <HelpCircle size={15} /> Student Help Center
        </div>
        <h1 style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.25rem', fontFamily: 'var(--font-display)' }}>
          Frequently Asked Questions
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '0.35rem' }}>
          Essential answers on campus security booth meetups, 4-digit handshake codes, payment safety, student verification, and item swaps.
        </p>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative' }}>
        <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search frequently asked questions..."
          style={{
            width: '100%',
            padding: '0.85rem 1rem 0.85rem 3rem',
            borderRadius: '10px',
            border: '1.5px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 700
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: selectedCategory === cat ? 800 : 600,
              backgroundColor: selectedCategory === cat ? 'var(--uc-blue)' : 'var(--bg-surface)',
              color: selectedCategory === cat ? '#FFFFFF' : 'var(--text-secondary)',
              border: selectedCategory === cat ? '1.5px solid var(--uc-blue)' : '1px solid var(--border-subtle)',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Accordion FAQ List */}
      {filteredFAQs.length === 0 ? (
        <div className="clean-card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>No matching questions found for "{searchQuery}".</p>
          <p style={{ fontSize: '0.82rem', marginTop: '0.35rem' }}>
            Need direct help? Contact our student helpdesk at{' '}
            <a href="mailto:uc.tradelink@gmail.com" style={{ color: 'var(--uc-blue)', fontWeight: 700 }}>
              uc.tradelink@gmail.com
            </a>
          </p>
        </div>
      ) : (
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
                  padding: 0,
                  border: isOpen ? '1.5px solid var(--uc-blue)' : '1px solid var(--border-subtle)'
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
                    border: 'none',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span>{faq.question}</span>
                    {faq.badge && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          backgroundColor: 'var(--uc-gold-light, #FEF3C7)',
                          color: '#92400E',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          textTransform: 'uppercase'
                        }}
                      >
                        {faq.badge}
                      </span>
                    )}
                  </div>
                  {isOpen ? (
                    <ChevronUp size={18} color="var(--uc-blue)" style={{ flexShrink: 0 }} />
                  ) : (
                    <ChevronDown size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  )}
                </button>

                {isOpen && (
                  <div
                    style={{
                      padding: '0 1.25rem 1.25rem 1.25rem',
                      color: 'var(--text-secondary)',
                      fontSize: '0.86rem',
                      lineHeight: 1.65,
                      backgroundColor: 'var(--bg-subtle)',
                      borderTop: '1px solid var(--border-subtle)'
                    }}
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Support Card */}
      <div
        className="clean-card"
        style={{
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '0.75rem',
          backgroundColor: 'var(--bg-subtle)'
        }}
      >
        <Mail size={24} color="var(--uc-blue)" />
        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Have an urgent question or meetup dispute?
        </h4>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '520px' }}>
          Our campus moderation board and security liaisons are ready to assist with account verification, trade disputes, or safety concerns.
        </p>
        <a
          href="mailto:uc.tradelink@gmail.com"
          className="btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.65rem 1.35rem', textDecoration: 'none' }}
        >
          <Mail size={16} /> Contact Support: uc.tradelink@gmail.com
        </a>
      </div>
    </div>
  );
};

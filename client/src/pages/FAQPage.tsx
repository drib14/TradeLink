import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Search,
  KeyRound,
  ShieldCheck,
  ShoppingBag,
  MapPin,
  GraduationCap,
  Sparkles,
  Mail,
  AlertTriangle,
  Clock,
  DollarSign
} from 'lucide-react';

interface FAQPageProps {
  onNavigate: (view: string, param?: any) => void;
}

interface FAQItem {
  question: string;
  answer: string;
  category: 'Meetups & Payment' | 'Handshake & Trust Score' | 'Buying, Selling & Swapping' | 'Account & Verification' | 'Senior High & Campuses';
  badge?: string;
}

export const FAQPage: React.FC<FAQPageProps> = ({ onNavigate }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const faqs: FAQItem[] = [
    // 1. Meetups & Payment
    {
      category: 'Meetups & Payment',
      badge: 'Crucial Rule',
      question: 'What happens if the buyer or seller doesn’t show up to the scheduled campus meetup?',
      answer: 'Wait 10 to 15 minutes at the designated security booth and send a quick message in chat. If they fail to show up without notifying you beforehand, you can safely cancel the transaction. Repeated unexcused no-shows are penalized: the user’s punctuality rate and campus trust score drop automatically, and chronic no-shows face temporary account suspension.'
    },
    {
      category: 'Meetups & Payment',
      badge: 'Inspection Tip',
      question: 'What should I do if the item is damaged or doesn’t match the listing photos?',
      answer: 'You have ZERO obligation to proceed with the trade! Politely decline the item and do NOT give the seller your 4-digit Handshake Code. The handshake code is your final confirmation that the item is in acceptable condition; once you release the code, the transaction is finalized. Always inspect book pages, uniform sizing, or electronics thoroughly in person before handing over the code.'
    },
    {
      category: 'Meetups & Payment',
      question: 'How should I pay the seller? Can I use GCash or cash?',
      answer: 'Both cash and GCash/Maya are widely accepted. Agree on your preferred payment method in chat before meeting. If paying via GCash, send the money in front of the campus guard desk after physically inspecting the item, and show the completed receipt screen to the seller. Never send money in advance prior to the physical meetup.'
    },
    {
      category: 'Meetups & Payment',
      question: 'Can we meet outside campus, such as at a nearby cafe or boarding house?',
      answer: 'For your safety, all trades must occur inside designated, guarded University of Cebu security booths. For bulky items (like dorm mini-fridges or large drawing boards), you may only meet in high-visibility student hubs immediately adjacent to campus security (such as E-Mall for UC Main or Country Mall for UC Banilad) during daytime hours (7:00 AM – 6:00 PM). Never agree to meet in private boarding houses or secluded spots.'
    },

    // 2. Handshake & Trust Score
    {
      category: 'Handshake & Trust Score',
      badge: 'Handshake Rule',
      question: 'When exactly should I give the seller my 4-Digit Handshake Code?',
      answer: 'Only give the 4-digit code (or present your Handshake QR code) after: (1) You have held and inspected the item, (2) You confirmed it functions and matches the description, and (3) You have paid the agreed price. Once the seller enters the code in the app, the transaction is marked completed and trust points are awarded.'
    },
    {
      category: 'Handshake & Trust Score',
      badge: 'Zero Default',
      question: 'Why does my profile show 0% Trust Score and 0.0 Rating as a new user?',
      answer: 'All new student accounts and accounts with zero completed transactions strictly start at 0% Trust Score, 0.0 Rating, and 0 completed trades. Trust on TradeLink is authentic and must be earned through real, successful campus handshakes. This protects the community by ensuring no one can spoof high trust scores.'
    },
    {
      category: 'Handshake & Trust Score',
      question: 'How is the Campus Trust Score calculated, and how do I increase it?',
      answer: 'The Trust Score (0% to 100%) evaluates four components: (1) Completed handshake trades (up to 40 pts), (2) Average verified peer review rating (up to 30 pts), (3) On-time punctuality rate at meetups (up to 15 pts), and (4) Official Student ID & live selfie verification badge (+15 pts). Maintaining on-time arrival and accurate item descriptions keeps you at 95%+.'
    },

    // 3. Buying, Selling & Swapping
    {
      category: 'Buying, Selling & Swapping',
      badge: 'Barter',
      question: 'How do direct item swaps work without exchanging money?',
      answer: 'When viewing an item marked "Open to Swap", click "Propose Swap" and select an item from your own active listings to offer in exchange. You and the other student can agree to a direct 1:1 trade, or an uneven trade with a cash top-up difference. At the campus security desk, both students inspect each other’s items and exchange the mutual handshake code to complete the swap.'
    },
    {
      category: 'Buying, Selling & Swapping',
      question: 'Can I cancel a trade or swap after agreeing in chat?',
      answer: 'Yes. As long as the 4-digit handshake code has not been entered, either student can cancel the transaction. If you change your mind, message the other student respectfully as early as possible so they don’t commute or wait at the campus guard desk.'
    },
    {
      category: 'Buying, Selling & Swapping',
      question: 'Why was my listing removed or flagged by moderators?',
      answer: 'Listings are automatically or manually taken down if they violate campus policies. Prohibited items include: exam questionnaires, test answer keys, thesis commissions, counterfeit uniforms, weapons, illegal substances, vapes, alcohol, or off-campus commercial spam. Check your notifications for moderator notes.'
    },
    {
      category: 'Buying, Selling & Swapping',
      question: 'Are there any platform fees or commissions on student sales?',
      answer: 'None at all! TradeLink is 100% free for all University of Cebu students. We take zero commissions, zero listing fees, and zero hidden cuts. 100% of the funds stay between you and your fellow student.'
    },

    // 4. Account & Verification
    {
      category: 'Account & Verification',
      badge: 'Direct Reset',
      question: 'How do I reset my password? Does a campus admin need to approve it?',
      answer: 'Password resets are 100% automated and direct—no administrator approval is required! Click "Forgot Password" on the sign-in modal, enter your registered email address, and an encrypted 4-digit verification code will be sent straight to your inbox within seconds. Enter this code along with your new password in the modal to regain access immediately. Codes remain valid for 30 minutes.'
    },
    {
      category: 'Account & Verification',
      badge: 'ID Only Policy',
      question: 'What documents are accepted for student verification? Can I submit a Study Load or COR?',
      answer: 'TradeLink ONLY accepts official physical or digital UC Student ID cards with a clear photo. We strictly DO NOT accept Study Loads or CORs (Certificates of Registration). This is because our biometric security protocol matches your live camera selfie directly to the facial portrait printed on your Student ID to prevent impersonation and fraud.'
    },
    {
      category: 'Account & Verification',
      question: 'How do I report a scam attempt, defective item, or abusive behavior?',
      answer: 'Click the "Report" button inside the peer chat drawer or on any item listing. You can also email us directly at uc.tradelink@gmail.com with screenshots. Our student safety team reviews reports within 24 hours and can suspend fraudulent accounts.'
    },

    // 5. Senior High & Campuses
    {
      category: 'Senior High & Campuses',
      badge: 'SHS Ready',
      question: 'Can Senior High School (SHS) students trade on TradeLink?',
      answer: 'Yes, absolutely! Senior High School students across STEM, ABM, HUMSS, TVL, and GAS tracks—as well as Junior High School students—are fully eligible to trade textbooks, uniforms, reviewers, and supplies safely across all UC campuses.'
    },
    {
      category: 'Senior High & Campuses',
      question: 'Can a UC Main student trade with a student from UC Banilad, LM, or other campuses?',
      answer: 'Yes! TradeLink interconnects all 8 UC campuses: UC Main, UC Banilad, UC LM, UC METC, UC PRI, UC Pardo-Talisay, UC South, and UC Medical Center. You can coordinate in chat to meet at whichever campus security desk is most convenient for both of you.'
    }
  ];

  const categories = [
    'All',
    'Meetups & Payment',
    'Handshake & Trust Score',
    'Buying, Selling & Swapping',
    'Account & Verification',
    'Senior High & Campuses'
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
          Clear, honest answers on campus meetups, no-shows, handshake codes, trust scores, payments, and account safety.
        </p>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative' }}>
        <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search questions (e.g. no show, damaged item, gcash, password reset, swap)..."
          style={{
            width: '100%',
            padding: '0.85rem 1rem 0.85rem 2.75rem',
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
            Need help with an unusual situation? Email our student helpdesk at{' '}
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
                  border: isOpen ? '1px solid var(--uc-blue)' : '1px solid var(--border-subtle)'
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
                          backgroundColor: 'var(--uc-gold-light)',
                          color: '#B45309',
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

      {/* Still Need Assistance Banner */}
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
          Our student moderation board and security liaisons are ready to assist with account verification, trade disputes, or safety concerns.
        </p>
        <a
          href="mailto:uc.tradelink@gmail.com"
          className="btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.65rem 1.35rem', textDecoration: 'none' }}
        >
          <Mail size={16} /> Contact Support Desk: uc.tradelink@gmail.com
        </a>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ChevronLeft,
  Lock,
  Eye,
  Camera,
  FileText,
  MessageSquare,
  Sparkles,
  MapPin,
  Clock,
  ThumbsUp
} from 'lucide-react';
import { SAFE_MEETUP_CHECKLIST } from '../data/campusLocations';

interface HelpSafetyPageProps {
  onNavigate: (view: string, param?: any) => void;
}

export const HelpSafetyPage: React.FC<HelpSafetyPageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'tips' | 'verification'>('tips');

  return (
    <div className="container page-enter" style={{ maxWidth: '960px', paddingTop: 'clamp(1rem, 2.5vw, 2rem)', paddingBottom: '5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--uc-blue)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <ShieldCheck size={16} /> TradeLink Safety & Trust Manual
        </div>
        <h1 style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.25rem', fontFamily: 'var(--font-display)' }}>
          Trade Safely with Verified Peers
        </h1>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '0.35rem' }}>
          TradeLink connects verified students across all campus hubs. Buy, sell, and swap pre-loved textbooks, uniforms, tech, and gear with mutual trust, clear communication, and complete flexibility.
        </p>
      </div>

      {/* 4 Core Safety Pillars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'var(--uc-blue-subtle)', color: 'var(--uc-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileCheck size={20} />
          </div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>1. Student Verification</h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Students authenticate with their Student ID Card and selfie verification to earn the verified checkmark badge.
          </p>
        </div>

        <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'var(--uc-gold-light)', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={20} />
          </div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>2. Flexible Public Meetups</h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            You and your peer decide where to meet—library lounges, student dining halls, quadrangles, or nearby public hubs.
          </p>
        </div>

        <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'var(--accent-green-subtle)', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={20} />
          </div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>3. In-Person Inspection</h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Inspect item condition physically before paying. Settle with Cash, GCash, Maya, or Bank Transfer in person.
          </p>
        </div>

        <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'var(--accent-red-subtle)', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={20} />
          </div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>4. Fast Community Protection</h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Suspicious listings, prohibited exam materials, and fraudulent accounts are quickly flagged and suspended by our moderation team.
          </p>
        </div>
      </div>

      {/* Safety Guidelines Card (Replaces the UC security phone directory) */}
      <div
        style={{
          backgroundColor: '#001D59',
          color: '#FFFFFF',
          borderRadius: '16px',
          padding: '2rem clamp(1.25rem, 3vw, 2rem)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          boxShadow: 'var(--shadow-lg)',
          border: '1.5px solid rgba(255, 199, 44, 0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Sparkles size={24} color="#FFC72C" />
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-display)', margin: 0 }}>
              Smart Student Trading Guidelines
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#CBD5E1', marginTop: '2px', marginBottom: 0 }}>
              Follow these recommended practices for smooth and dependable peer exchanges
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1.15rem', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFC72C', fontWeight: 800, fontSize: '0.88rem' }}>
              <Clock size={16} /> Daytime Meetings
            </div>
            <p style={{ fontSize: '0.82rem', color: '#E2E8F0', marginTop: '0.45rem', lineHeight: 1.55 }}>
              Always schedule meetups during daytime hours between 7:00 AM and 6:30 PM when campus areas and public plazas are well-lit and busy.
            </p>
          </div>

          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1.15rem', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#86EFAC', fontWeight: 800, fontSize: '0.88rem' }}>
              <MapPin size={16} /> Public Spaces Only
            </div>
            <p style={{ fontSize: '0.82rem', color: '#E2E8F0', marginTop: '0.45rem', lineHeight: 1.55 }}>
              Choose open public spaces such as the campus library, cafeteria atrium, student lounge, or busy coffee shops. Never meet in private dorms or secluded alleys.
            </p>
          </div>

          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1.15rem', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#93C5FD', fontWeight: 800, fontSize: '0.88rem' }}>
              <Eye size={16} /> Thorough Item Inspection
            </div>
            <p style={{ fontSize: '0.82rem', color: '#E2E8F0', marginTop: '0.45rem', lineHeight: 1.55 }}>
              Test gadgets, check textbook bindings, verify calculator screens, and check uniform sizing in person before sending payment.
            </p>
          </div>

          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1.15rem', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FCD34D', fontWeight: 800, fontSize: '0.88rem' }}>
              <ThumbsUp size={16} /> In-Person Handover
            </div>
            <p style={{ fontSize: '0.82rem', color: '#E2E8F0', marginTop: '0.45rem', lineHeight: 1.55 }}>
              Never send down payments or full balances in advance prior to the physical handover. Exchange payment via Cash, GCash, or Maya while you are together.
            </p>
          </div>
        </div>
      </div>

      {/* Safe Trade Checklist */}
      <div className="clean-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.85rem' }}>
          Safe Trading Checklist for Students
        </h3>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.86rem', color: 'var(--text-secondary)', padding: 0, margin: 0 }}>
          {SAFE_MEETUP_CHECKLIST.map((tip, idx) => (
            <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', lineHeight: 1.55 }}>
              <CheckCircle2 size={17} color="var(--accent-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Student ID Verification Section */}
      <div className="clean-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--uc-blue)', fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase' }}>
          <ShieldCheck size={16} /> How Verification Works
        </div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)' }}>
          Obtaining Your Verified Student Badge
        </h3>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          The Gold Verified Student Badge indicates that a student account has been authenticated with a matching Student ID Card and selfie check.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '1rem', borderRadius: '10px', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <Camera size={20} color="var(--uc-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>1. Clear Photo Upload</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.45 }}>
                Submit a crisp, glare-free snapshot of your current Student ID card.
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '1rem', borderRadius: '10px', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <FileText size={20} color="var(--accent-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>2. Proof of Enrollment</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.45 }}>
                Provide your Certificate of Registration (COR) or current study load assessment.
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '1rem', borderRadius: '10px', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <Lock size={20} color="#B45309" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>3. Official Campus KYC</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.45 }}>
                Authorized campus staff verify credentials to activate your verified student badge.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Community Standards & Dispute Resolution */}
      <div className="clean-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Community Standards & Dispute Resolution
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          TradeLink maintains zero tolerance for scams, counterfeit gear, abusive communication, or leaked academic tests. If you encounter any issue:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={16} color="var(--uc-blue)" />
            <span>Use the <strong>"Report"</strong> button directly inside any peer chat conversation or item listing.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={16} color="var(--accent-green)" />
            <span>Reports are reviewed promptly by student moderators with rapid account suspension for bad actors.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  BookOpen,
  Scale,
  AlertTriangle,
  ChevronLeft,
  Lock,
  MapPin,
  CheckCircle2,
  Mail,
  FileText,
  Clock,
  EyeOff
} from 'lucide-react';

interface TermsPrivacyPageProps {
  onNavigate: (view: string, param?: any) => void;
  initialTab?: 'honor-code' | 'privacy' | 'meetup-rules';
}

export const TermsPrivacyPage: React.FC<TermsPrivacyPageProps> = ({ onNavigate, initialTab = 'honor-code' }) => {
  const [activeTab, setActiveTab] = useState<'honor-code' | 'privacy' | 'meetup-rules'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  return (
    <div className="container" style={{ maxWidth: '900px', padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
          <Scale size={15} /> University of Cebu Governance & Policies
        </div>
        <h1 style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.25rem', fontFamily: 'var(--font-display)' }}>
          TradeLink Community Standards & Policies
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '0.35rem' }}>
          Official terms of service, academic honor code, safe campus trade regulations, and data privacy safeguards compliant with Republic Act No. 10173.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border-subtle)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
        {[
          { id: 'honor-code', label: 'Campus Honor Code & Terms', icon: BookOpen },
          { id: 'privacy', label: 'Data Privacy Policy (RA 10173)', icon: Lock },
          { id: 'meetup-rules', label: 'Safe Meetup Regulations', icon: MapPin }
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

      {/* TAB 1: HONOR CODE & TERMS */}
      {activeTab === 'honor-code' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="clean-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--uc-blue)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--uc-blue)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={20} /> 1. Academic Honesty & Prohibited Items
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              TradeLink is designed to make educational materials and everyday student supplies affordable and accessible. To preserve academic integrity, the listing, sale, or barter of the following is <strong>strictly prohibited</strong>:
            </p>
            <ul style={{ marginTop: '0.65rem', paddingLeft: '1.25rem', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <li>Current or past examination questionnaires, test keys, and answer sheets.</li>
              <li>Commissioned academic work, thesis writing services, or proxy test-taking arrangements.</li>
              <li>Counterfeit school uniforms, falsified campus passes, or forged teacher signatures.</li>
              <li>Weapons, blades, illegal drugs, prescription narcotics, vapes, tobacco, or alcohol.</li>
              <li>Stolen University property or laboratory instruments.</li>
            </ul>
            <p style={{ fontSize: '0.82rem', color: 'var(--accent-red)', fontWeight: 700, marginTop: '0.65rem' }}>
              Violation triggers immediate account termination and formal referral to the University Student Affairs Office (SAO) and College Dean.
            </p>
          </div>

          <div className="clean-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-green)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-green)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} /> 2. In-Person Settlement & Review Integrity
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              All exchanges must occur in-person at designated campus security checkpoints. The seller marks the order completed only after both parties have inspected the item and confirmed payment. Buyers can then leave honest product ratings and reviews.
            </p>
            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: '8px', marginTop: '0.65rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <strong>Review Farming Prohibited:</strong> Submitting fake or manipulated reviews to artificially inflate item ratings or mislead student buyers is strictly forbidden and subject to account suspension.
            </div>
          </div>

          <div className="clean-card" style={{ padding: '1.5rem', borderLeft: '4px solid #F59E0B' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#B45309', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Scale size={20} /> 3. 100% Free • Zero Platform Fees
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              TradeLink is a non-profit, student-first platform. We do not charge listing fees, transaction fees, or membership dues. Commercial vendors, outside resellers, and predatory price gouging are prohibited. Prices for second-hand textbooks and course gear must reflect fair, student-friendly rates.
            </p>
          </div>

          <div className="clean-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--uc-blue)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--uc-blue)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={20} /> 4. Student Eligibility & Senior High Participation
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              Any enrolled student of the University of Cebu (including Junior High, Senior High School STEM/ABM/HUMSS/TVL/GAS tracks, undergraduate colleges, Maritime academy cadets, and medical students) is welcome to register and trade. All students are bound by the UC Student Code of Discipline.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: PRIVACY POLICY (RA 10173) */}
      {activeTab === 'privacy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="clean-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--uc-blue)', fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase' }}>
              <Lock size={15} /> Republic Act No. 10173 Compliance
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              Philippine Data Privacy Act Statement
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '0.45rem' }}>
              TradeLink respects your fundamental right to privacy. We collect and process your personal information strictly in adherence to the principles of transparency, legitimate purpose, and proportionality under the <strong>Data Privacy Act of 2012 (RA 10173)</strong> and its Implementing Rules and Regulations.
            </p>
          </div>

          <div className="clean-card" style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <FileText size={18} color="var(--uc-blue)" /> 1. Information We Collect
            </h4>
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              <li><strong>Student Credentials:</strong> Official Student ID number, full name, university or personal email, campus affiliation, and course/grade level.</li>
              <li><strong>Verification Media:</strong> Clear photo of official UC Student ID card and live camera selfie submitted exclusively for biometric facial matching and verification badge approval (Study Load / COR is not accepted as it lacks a photo).</li>
              <li><strong>Transaction & Meetup Records:</strong> Item listings, agreed meetup checkpoints, order completions, and product reviews.</li>
              <li><strong>Communications:</strong> Encrypted in-app peer-to-peer chat messages exchanged regarding listings and trade coordination.</li>
            </ul>
          </div>

          <div className="clean-card" style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <ShieldCheck size={18} color="var(--accent-green)" /> 2. Direct Password Reset & Credential Protection
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              Student passwords are encrypted using high-cost salted cryptographic hashes (bcrypt). For enhanced student privacy and speed:
            </p>
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              <li><strong>Direct Reset Dispatch:</strong> Password reset requests generate a secure, temporary 4-digit numeric code dispatched directly to your registered email address.</li>
              <li><strong>No Administrator Interception:</strong> Password resets are fully automated and do <em>not</em> require manual administrator approval or human review.</li>
              <li><strong>Automatic Expiry:</strong> Reset verification tokens automatically expire after 30 minutes. Once consumed, the token hash is permanently cleared.</li>
            </ul>
          </div>

          <div className="clean-card" style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <EyeOff size={18} color="var(--uc-blue)" /> 3. Data Storage, Confidentiality & Non-Disclosure
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              We do <strong>not</strong> sell, rent, monetize, or disclose student personal data to any external advertising networks, marketers, or third parties. Verification documents are accessible solely to authorized campus administrators for the sole purpose of confirming enrollment and safeguarding the student community from external fraudulent actors.
            </p>
          </div>

          <div className="clean-card" style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Mail size={18} color="#B45309" /> 4. Your Rights as a Data Subject & Inquiries
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              Under RA 10173, you have the right to access your stored data, rectify inaccurate records, or request account deactivation and removal upon graduation. For privacy requests or questions, contact our student data desk:
            </p>
            <div style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem', backgroundColor: 'var(--bg-subtle)', padding: '0.5rem 0.85rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--uc-blue)' }}>
              <Mail size={14} /> uc.tradelink@gmail.com
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MEETUP REGULATIONS */}
      {activeTab === 'meetup-rules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="clean-card" style={{ padding: '1.5rem', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#B45309', fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase' }}>
              <AlertTriangle size={16} /> Mandatory Safety Rule
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#92400E', marginTop: '0.25rem' }}>
              Campus-Only Daytime Meetup Policy
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#78350F', lineHeight: 1.6, marginTop: '0.35rem' }}>
              All transactions arranged through TradeLink must take place inside official, guarded University of Cebu security checkpoints between <strong>7:00 AM and 6:00 PM</strong>. Never agree to meet in unmonitored off-campus alleys, private boarding houses, or secluded locations.
            </p>
          </div>

          <div className="clean-card" style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--uc-blue)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <MapPin size={18} /> Official Guarded Meetup Checkpoints (All 8 Campuses)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
              {[
                { name: 'UC Main Campus', loc: 'Main Sanciangko Gate Security Desk & Student Lounge' },
                { name: 'UC Banilad Campus', loc: 'Cuenco Avenue Main Gate Guard Booth & Canteen Lobby' },
                { name: 'UC Lapu-Lapu Mandaue (LM)', loc: 'AC Cortes Entrance Lobby Guard Station' },
                { name: 'UC METC (Mambaling)', loc: 'Alumnos Muster Deck Security Station' },
                { name: 'UC PRI (Private High)', loc: 'High School Gate 1 Guard Post' },
                { name: 'UC Pardo-Talisay', loc: 'Bulacao Main Gate Security Station' },
                { name: 'UC South Campus', loc: 'Sanciangko South Entrance Guard Post' },
                { name: 'UC Medical Center (UCMC)', loc: 'Hospital Main Entrance Lobby Security Desk' }
              ].map((c) => (
                <div key={c.name} style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>{c.name}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{c.loc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="clean-card" style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-green)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle2 size={18} /> 5-Step In-Person Inspection Protocol
            </h4>
            <ol style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              <li><strong>Verify in Daylight:</strong> Meet at the scheduled campus guard desk while security guards are on active duty.</li>
              <li><strong>Physical Inspection:</strong> Carefully inspect textbook pages, uniform sizing, or electronic equipment functionality.</li>
              <li><strong>Confirm Payment:</strong> Exchange physical cash or verified student e-wallet (GCash) payment in front of the counter.</li>
              <li><strong>Finalize Order:</strong> The seller marks the order as complete in TradeLink once both peers confirm the exchange.</li>
              <li><strong>Submit Product Review:</strong> Leave an authentic product rating and review to guide future student peers.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

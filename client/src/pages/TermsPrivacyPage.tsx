import React from 'react';
import { ShieldCheck, BookOpen, Scale, AlertTriangle, ChevronLeft } from 'lucide-react';

interface TermsPrivacyPageProps {
  onNavigate: (view: string, param?: any) => void;
}

export const TermsPrivacyPage: React.FC<TermsPrivacyPageProps> = ({ onNavigate }) => {
  return (
    <div className="container" style={{ maxWidth: '840px', padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--uc-blue)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>
          <Scale size={15} /> University of Cebu Honor Code
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
          TradeLink Community Guidelines & Terms
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Standards of honesty, respect, and physical safety for all verified University of Cebu students.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="clean-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--uc-blue)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <BookOpen size={18} /> 1. Academic Honesty & Prohibited Items
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            TradeLink is dedicated to making quality education accessible and affordable. The sale of leaked examination questionnaires, answer keys, proxy test-taking services, or counterfeit school supplies is strictly prohibited and results in immediate permanent suspension and referral to the University Student Affairs Office.
          </p>
        </div>

        <div className="clean-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--uc-blue)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldCheck size={18} /> 2. Handshake Verification Integrity
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Students must only exchange the 4-digit Handshake Code or scan the Handshake QR Code after physically inspecting the item and confirming payment. Falsifying trade completions to inflate trust scores is prohibited.
          </p>
        </div>

        <div className="clean-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--uc-blue)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertTriangle size={18} /> 3. Campus Safety First Policy
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            All trades must take place exclusively within guarded campus security points inside UC Main, UC Banilad, UC LM, UC METC, UC PRI, UC Pardo-Talisay, UC South Campus, or UC Medical Center during daytime security hours. Never agree to meet off-campus or in unmonitored locations.
          </p>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  ShieldCheck,
  Phone,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  MapPin,
  Clock,
  HelpCircle
} from 'lucide-react';
import { CAMPUS_MEETUP_SPOTS, SAFE_MEETUP_CHECKLIST } from '../data/campusLocations';

interface HelpSafetyPageProps {
  onNavigate: (view: string, param?: any) => void;
}

export const HelpSafetyPage: React.FC<HelpSafetyPageProps> = ({ onNavigate }) => {
  return (
    <div className="container" style={{ maxWidth: '920px', padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#002B7F', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>
          <ShieldCheck size={16} /> Campus Trust & Safety Manual
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#002B7F', marginTop: '0.25rem' }}>
          How TradeLink Keeps UC Students Safe
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.55 }}>
          TradeLink is built exclusively for verified University of Cebu students to buy, sell, and swap items within guarded campus grounds without risks of online marketplace scams.
        </p>
      </div>

      {/* 4-Step Safety Pillar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #CBD5E1', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#EBF1FC', color: '#002B7F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={20} />
          </div>
          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A' }}>1. Student ID Verification</h4>
          <p style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.45 }}>
            All active sellers must submit their UC Student ID or Study Load (COR) for administrative review.
          </p>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #CBD5E1', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#FFF2CC', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={20} />
          </div>
          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A' }}>2. Guarded Landmarks</h4>
          <p style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.45 }}>
            Meetups occur strictly at designated security hubs inside UC Main, Banilad, LM, and METC.
          </p>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #CBD5E1', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <KeyRound size={20} />
          </div>
          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A' }}>3. 4-Digit Handshake</h4>
          <p style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.45 }}>
            Verify physical item inspection on the spot using encrypted 4-digit codes to earn reputation points.
          </p>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #CBD5E1', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={20} />
          </div>
          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A' }}>4. Campus Moderation</h4>
          <p style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.45 }}>
            Reported listings and suspicious accounts are immediately suspended by our admin desk.
          </p>
        </div>
      </div>

      {/* Campus Security Contacts */}
      <div style={{ backgroundColor: '#002B7F', color: '#FFFFFF', borderRadius: '16px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Phone size={20} color="#FFC72C" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
            Official University of Cebu Security Desks
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '0.85rem', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FFC72C' }}>UC Main Campus</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, marginTop: '2px' }}>(032) 255-7100</div>
            <div style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>Sanciangko Gate Security Desk</div>
          </div>

          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '0.85rem', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FFC72C' }}>UC Banilad Campus</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, marginTop: '2px' }}>(032) 231-8623</div>
            <div style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>Gov. Cuenco Gate Guard Station</div>
          </div>

          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '0.85rem', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FFC72C' }}>UC LM Campus</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, marginTop: '2px' }}>(032) 345-6540</div>
            <div style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>A.C. Cortes Main Gate Guard</div>
          </div>

          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '0.85rem', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FFC72C' }}>UC METC Campus</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, marginTop: '2px' }}>(032) 261-3781</div>
            <div style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>Mambaling Muster Station Desk</div>
          </div>
        </div>
      </div>

      {/* Safety Checklist */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #CBD5E1', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <CheckCircle2 size={18} color="#059669" /> Safe Trade Checklist for Students
        </h3>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem', color: '#334155' }}>
          {SAFE_MEETUP_CHECKLIST.map((tip, idx) => (
            <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem' }}>
              <CheckCircle2 size={14} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

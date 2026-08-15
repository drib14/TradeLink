import React from 'react';
import { SmartPriceWidget } from '../components/marketplace/SmartPriceWidget';
import { ChevronLeft } from 'lucide-react';

interface PricingAdvisorPageProps {
  onNavigate: (view: string, param?: any) => void;
}

export const PricingAdvisorPage: React.FC<PricingAdvisorPageProps> = ({ onNavigate }) => {
  return (
    <div className="container" style={{ maxWidth: '780px', padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <button
          onClick={() => onNavigate('marketplace')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            color: '#71717A',
            fontSize: '0.82rem',
            fontWeight: 600,
            marginBottom: '0.5rem'
          }}
        >
          <ChevronLeft size={16} /> Back to Market
        </button>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#18181B' }}>
          Second-Hand Price Advisor
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#71717A', marginTop: '0.15rem' }}>
          Evaluate fair campus prices based on wear-and-tear grades, original retail price, and UC student demand.
        </p>
      </div>

      {/* Calculator */}
      <SmartPriceWidget
        initialSrp={1500}
        initialCondition="Like New"
        initialCategory="Calculators & Electronics"
      />

      {/* Guidelines Grid */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E4E4E7',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#18181B' }}>
          Condition Guidelines
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          <div style={{ backgroundColor: '#FAFAFA', borderRadius: '8px', padding: '0.85rem', border: '1px solid #F4F4F5' }}>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#18181B' }}>
              Brand New (10 - 20% Off)
            </div>
            <p style={{ fontSize: '0.75rem', color: '#71717A', marginTop: '0.25rem', lineHeight: 1.4 }}>
              Never used, original packaging or tags intact. High demand for pristine medical scrubs and calculators.
            </p>
          </div>

          <div style={{ backgroundColor: '#FAFAFA', borderRadius: '8px', padding: '0.85rem', border: '1px solid #F4F4F5' }}>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#18181B' }}>
              Like New (30 - 45% Off)
            </div>
            <p style={{ fontSize: '0.75rem', color: '#71717A', marginTop: '0.25rem', lineHeight: 1.4 }}>
              Used for 1 semester with crisp buttons, clean pages, or minimal pencil markings.
            </p>
          </div>

          <div style={{ backgroundColor: '#FAFAFA', borderRadius: '8px', padding: '0.85rem', border: '1px solid #F4F4F5' }}>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#18181B' }}>
              Gently Used (45 - 60% Off)
            </div>
            <p style={{ fontSize: '0.75rem', color: '#71717A', marginTop: '0.25rem', lineHeight: 1.4 }}>
              Standard wear, highlighted textbook passages, or washed duty uniforms in clean condition.
            </p>
          </div>

          <div style={{ backgroundColor: '#FAFAFA', borderRadius: '8px', padding: '0.85rem', border: '1px solid #F4F4F5' }}>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#18181B' }}>
              Academic Usable (60 - 75% Off)
            </div>
            <p style={{ fontSize: '0.75rem', color: '#71717A', marginTop: '0.25rem', lineHeight: 1.4 }}>
              Budget-friendly for students who need functional tools, review notes, and reading materials.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

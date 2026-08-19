import React from 'react';
import { SmartPriceWidget } from '../components/marketplace/SmartPriceWidget';
import { ChevronLeft, Calculator, TrendingUp, CheckCircle2 } from 'lucide-react';

interface PricingAdvisorPageProps {
  onNavigate: (view: string, param?: any) => void;
}

export const PricingAdvisorPage: React.FC<PricingAdvisorPageProps> = ({ onNavigate }) => {
  return (
    <div className="container page-enter" style={{ maxWidth: '820px', padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div>
        <button
          onClick={() => onNavigate('marketplace')}
          className="btn-ghost"
          style={{
            padding: '0.35rem 0.65rem',
            fontSize: '0.82rem',
            marginBottom: '0.5rem',
            cursor: 'pointer'
          }}
        >
          <ChevronLeft size={16} /> Back to Market
        </button>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--uc-blue, #002B7F)', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <Calculator size={14} /> Student Valuation Guide
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary, #002B7F)', marginTop: '0.25rem', fontFamily: 'var(--font-display)' }}>
          Second-Hand Fair Price Estimator
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted, #64748B)', marginTop: '0.2rem', lineHeight: 1.5 }}>
          Evaluate accurate, fair campus prices based on physical condition grades, original retail price, and University of Cebu student demand.
        </p>
      </div>

      {/* Calculator Widget */}
      <SmartPriceWidget
        initialSrp={1500}
        initialCondition="Like New"
        initialCategory="Calculators & Electronics"
      />

      {/* Guidelines Grid */}
      <div
        className="clean-card"
        style={{
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.15rem'
        }}
      >
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--uc-blue)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <TrendingUp size={16} color="var(--uc-blue)" /> Condition & Value Depreciation Standards
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: '10px', padding: '1rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--uc-blue)' }}>
              Brand New (10% - 20% Off)
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: 1.5 }}>
              Never used, tags intact, sealed box or fresh scrubs. High student demand for pristine tools and unopened kits.
            </p>
          </div>

          <div style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: '10px', padding: '1rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--uc-blue)' }}>
              Like New (30% - 45% Off)
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: 1.5 }}>
              Used for 1 semester with crisp buttons, clean pages, or minimal pencil markings.
            </p>
          </div>

          <div style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: '10px', padding: '1rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--uc-blue)' }}>
              Gently Used (45% - 60% Off)
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: 1.5 }}>
              Standard wear, highlighted textbook passages, or washed duty uniforms in clean, presentable condition.
            </p>
          </div>

          <div style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: '10px', padding: '1rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--uc-blue)' }}>
              Academic Usable (60% - 75% Off)
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: 1.5 }}>
              Maximum budget savings for students who need functional reference modules, reviewers, and study gear.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

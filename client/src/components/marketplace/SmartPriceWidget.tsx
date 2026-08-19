import React, { useState } from 'react';
import { ConditionGrade, ItemCategory } from '../../types';
import { useSmartPrice } from '../../hooks/useSmartPrice';
import { Check, Calculator } from 'lucide-react';

interface SmartPriceWidgetProps {
  initialSrp?: number;
  initialCondition?: ConditionGrade;
  initialCategory?: ItemCategory;
  initialCurrentPrice?: number;
  isCompact?: boolean;
  onApplyPrice?: (price: number) => void;
}

export const SmartPriceWidget: React.FC<SmartPriceWidgetProps> = ({
  initialSrp = 1200,
  initialCondition = 'Like New',
  initialCategory = 'Calculators & Electronics',
  initialCurrentPrice,
  isCompact = false,
  onApplyPrice
}) => {
  const [srp, setSrp] = useState<number>(initialSrp);
  const [condition, setCondition] = useState<ConditionGrade>(initialCondition);
  const [category] = useState<ItemCategory>(initialCategory);
  const [currentPrice] = useState<number | undefined>(initialCurrentPrice);

  const priceResult = useSmartPrice(srp, condition, category, currentPrice);

  const conditionOptions: ConditionGrade[] = [
    'Brand New',
    'Like New',
    'Gently Used',
    'Fair / Academic Usable'
  ];

  return (
    <div
      className="clean-card"
      style={{
        padding: isCompact ? '1.15rem' : '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}
    >
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--uc-blue)', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <Calculator size={14} /> Fair Pricing Engine
        </div>
        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
          Smart Campus Price Estimator
        </h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
          Recommended second-hand resale range based on wear & student demand
        </p>
      </div>

      {/* Input Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isCompact ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.85rem'
        }}
      >
        {/* SRP Input */}
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            Original Mall Price (SRP)
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)' }}>
              ₱
            </span>
            <input
              type="number"
              value={srp || ''}
              onChange={(e) => setSrp(Number(e.target.value))}
              placeholder="1250"
              className="clean-input"
              style={{
                paddingLeft: '1.85rem',
                fontSize: '0.86rem',
                fontWeight: 700
              }}
            />
          </div>
        </div>

        {/* Condition Grade */}
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            Condition Grade
          </label>
          <select
            value={condition}
            onChange={(e: any) => setCondition(e.target.value)}
            className="clean-input"
            style={{
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {conditionOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Output Range Box */}
      <div
        style={{
          backgroundColor: 'var(--bg-subtle, #F8FAFC)',
          borderRadius: '10px',
          border: '1.5px solid var(--border-subtle, #BCD1F7)',
          padding: '1.15rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--uc-blue)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Fair Campus Price Range
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--uc-blue)', fontFamily: 'var(--font-display)', marginTop: '0.15rem' }}>
              ₱{priceResult.recommendedMin.toLocaleString()} – ₱{priceResult.recommendedMax.toLocaleString()}
            </div>
          </div>

          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              backgroundColor: priceResult.dealRating === 'Super Bargain' || priceResult.dealRating === 'Fair Campus Price' ? 'var(--accent-green-subtle, #ECFDF5)' : 'var(--uc-gold-light, #FFFBEB)',
              color: priceResult.dealRating === 'Super Bargain' || priceResult.dealRating === 'Fair Campus Price' ? 'var(--accent-green, #047857)' : '#B45309',
              border: priceResult.dealRating === 'Super Bargain' || priceResult.dealRating === 'Fair Campus Price' ? '1px solid var(--border-subtle)' : '1px solid var(--border-subtle)'
            }}
          >
            {priceResult.dealRating}
          </span>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {priceResult.reasoning}
        </p>

        {onApplyPrice && (
          <button
            onClick={() => onApplyPrice(priceResult.recommendedAverage)}
            className="btn-primary"
            style={{
              marginTop: '0.35rem',
              alignSelf: 'flex-start',
              padding: '0.45rem 0.95rem',
              fontSize: '0.8rem'
            }}
          >
            <Check size={14} /> Apply Recommended ₱{priceResult.recommendedAverage}
          </button>
        )}
      </div>
    </div>
  );
};

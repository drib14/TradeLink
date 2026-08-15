import React, { useState } from 'react';
import { ConditionGrade, ItemCategory } from '../../types';
import { useSmartPrice } from '../../hooks/useSmartPrice';
import { Check } from 'lucide-react';

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
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E4E4E7',
        padding: isCompact ? '1rem' : '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}
    >
      <div>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#18181B' }}>
          Smart Price Advisor
        </h4>
        <p style={{ fontSize: '0.78rem', color: '#71717A' }}>
          Recommended second-hand resale range based on wear & student demand
        </p>
      </div>

      {/* Input Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isCompact ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem'
        }}
      >
        {/* SRP Input */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#52525B', marginBottom: '0.25rem' }}>
            Original Mall Price (SRP)
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: '#71717A' }}>
              ₱
            </span>
            <input
              type="number"
              value={srp || ''}
              onChange={(e) => setSrp(Number(e.target.value))}
              placeholder="1250"
              style={{
                width: '100%',
                padding: '0.45rem 0.65rem 0.45rem 1.75rem',
                borderRadius: '6px',
                border: '1px solid #E4E4E7',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#18181B',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Condition Grade */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#52525B', marginBottom: '0.25rem' }}>
            Condition Grade
          </label>
          <select
            value={condition}
            onChange={(e: any) => setCondition(e.target.value)}
            style={{
              width: '100%',
              padding: '0.45rem 0.65rem',
              borderRadius: '6px',
              border: '1px solid #E4E4E7',
              fontSize: '0.82rem',
              fontWeight: 500,
              color: '#18181B',
              backgroundColor: '#FFFFFF',
              outline: 'none'
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
          backgroundColor: '#FAFAFA',
          borderRadius: '8px',
          border: '1px solid #F4F4F5',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#71717A', textTransform: 'uppercase' }}>
              Fair Campus Price
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#18181B', fontFamily: 'var(--font-display)', marginTop: '0.15rem' }}>
              ₱{priceResult.recommendedMin.toLocaleString()} – ₱{priceResult.recommendedMax.toLocaleString()}
            </div>
          </div>

          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              backgroundColor: priceResult.dealRating === 'Super Bargain' || priceResult.dealRating === 'Fair Campus Price' ? '#ECFDF5' : '#FFFBEB',
              color: priceResult.dealRating === 'Super Bargain' || priceResult.dealRating === 'Fair Campus Price' ? '#047857' : '#B45309'
            }}
          >
            {priceResult.dealRating}
          </span>
        </div>

        <p style={{ fontSize: '0.78rem', color: '#52525B', lineHeight: 1.45 }}>
          {priceResult.reasoning}
        </p>

        {onApplyPrice && (
          <button
            onClick={() => onApplyPrice(priceResult.recommendedAverage)}
            style={{
              marginTop: '0.25rem',
              alignSelf: 'flex-start',
              backgroundColor: '#0B1E3B',
              color: '#FFFFFF',
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <Check size={13} /> Apply ₱{priceResult.recommendedAverage}
          </button>
        )}
      </div>
    </div>
  );
};

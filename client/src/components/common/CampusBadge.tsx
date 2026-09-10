import React from 'react';
import { Campus } from '../../types';
import { Building2, Anchor, Cpu, HeartPulse, GraduationCap } from 'lucide-react';
import { CAMPUS_DETAILS } from '../../data/campusLocations';

interface CampusBadgeProps {
  campus: Campus;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const CampusBadge: React.FC<CampusBadgeProps> = ({
  campus,
  size = 'sm',
  showIcon = true
}) => {
  const campusInfo = CAMPUS_DETAILS[campus] || {
    shortName: campus,
    badgeClass: 'uc-main',
    color: '#002B7F'
  };

  const getCampusIcon = () => {
    const iconSize = size === 'sm' ? 12 : 14;
    switch (campus) {
      case 'UC METC':
        return <Anchor size={iconSize} style={{ flexShrink: 0 }} />;
      case 'UC LM':
        return <Cpu size={iconSize} style={{ flexShrink: 0 }} />;
      case 'UC Banilad':
      case 'UC Medical Center':
        return <HeartPulse size={iconSize} style={{ flexShrink: 0 }} />;
      case 'UC PRI':
        return <GraduationCap size={iconSize} style={{ flexShrink: 0 }} />;
      case 'UC South Campus':
      case 'UC Pardo-Talisay':
      case 'UC Main':
      default:
        return <Building2 size={iconSize} style={{ flexShrink: 0 }} />;
    }
  };

  const getBadgeStyle = (): React.CSSProperties => {
    switch (campus) {
      case 'UC Banilad':
        return { backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' };
      case 'UC LM':
        return { backgroundColor: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' };
      case 'UC METC':
        return { backgroundColor: '#F5F3FF', color: '#6D28D9', border: '1px solid #DDD6FE' };
      case 'UC Medical Center':
        return { backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' };
      case 'UC PRI':
        return { backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' };
      case 'UC Pardo-Talisay':
        return { backgroundColor: '#FFF7ED', color: '#C2410C', border: '1px solid #FFEDD5' };
      case 'UC South Campus':
        return { backgroundColor: '#F0FDFA', color: '#0F766E', border: '1px solid #CCFBF1' };
      case 'UC Main':
      default:
        return { backgroundColor: '#EBF1FC', color: '#002B7F', border: '1px solid #BCD1F7' };
    }
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        fontSize: size === 'sm' ? '0.72rem' : '0.8rem',
        fontWeight: 700,
        padding: size === 'sm' ? '0.2rem 0.55rem' : '0.3rem 0.75rem',
        borderRadius: '9999px',
        lineHeight: 1.2,
        ...getBadgeStyle()
      }}
    >
      {showIcon && getCampusIcon()}
      <span>{campusInfo.shortName}</span>
    </span>
  );
};

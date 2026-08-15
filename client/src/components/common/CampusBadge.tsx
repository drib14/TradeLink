import React from 'react';
import { Campus } from '../../types';
import { MapPin, Building2, Anchor, Cpu, HeartPulse, GraduationCap } from 'lucide-react';
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
    color: '#1D4ED8'
  };

  const getCampusIcon = () => {
    switch (campus) {
      case 'UC METC':
        return <Anchor size={size === 'sm' ? 11 : 13} />;
      case 'UC LM':
        return <Cpu size={size === 'sm' ? 11 : 13} />;
      case 'UC Banilad':
      case 'UC Medical Center':
        return <HeartPulse size={size === 'sm' ? 11 : 13} />;
      case 'UC PRI':
        return <GraduationCap size={size === 'sm' ? 11 : 13} />;
      case 'UC South Campus':
      case 'UC Pardo-Talisay':
      case 'UC Main':
      default:
        return <Building2 size={size === 'sm' ? 11 : 13} />;
    }
  };

  return (
    <span
      className={`campus-pill ${campusInfo.badgeClass}`}
      style={{
        fontSize: size === 'sm' ? '0.7rem' : '0.8rem',
        padding: size === 'sm' ? '0.2rem 0.55rem' : '0.3rem 0.75rem'
      }}
    >
      {showIcon && getCampusIcon()}
      <span>{campusInfo.shortName}</span>
    </span>
  );
};

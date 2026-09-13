import React from 'react';

interface AdSensePlaceholderProps {
  slotType: 'header-banner' | 'in-content' | 'sidebar' | 'footer-banner';
  className?: string;
}

export const AdSensePlaceholder: React.FC<AdSensePlaceholderProps> = ({ slotType, className = '' }) => {
  void slotType;
  void className;
  return null;
};

import type React from 'react';

interface BusinessFormHeaderProps {
  title: string;
  subtitle?: string;
  formId: string;
  submitLabel: string;
  backLabel?: string;
  isSubmitting?: boolean;
  onBack: () => void;
  submitIcon?: React.ReactNode;
}

export type { BusinessFormHeaderProps };


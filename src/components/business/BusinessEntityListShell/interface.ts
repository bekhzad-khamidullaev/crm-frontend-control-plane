import type React from 'react';

interface BusinessEntityListShellProps {
  title: string;
  subtitle?: string;
  extra?: React.ReactNode;
  toolbar?: React.ReactNode;
  error?: React.ReactNode;
  retryLabel?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}

export type { BusinessEntityListShellProps };


interface BusinessScreenStateProps {
  variant: 'loading' | 'empty' | 'error' | 'forbidden' | 'notFound';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export type { BusinessScreenStateProps };


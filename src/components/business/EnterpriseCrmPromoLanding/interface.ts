export interface EnterpriseCrmPromoLeadValues {
  name: string;
  workEmail: string;
  company: string;
  role?: string;
  teamSize: string;
  notes?: string;
  consent: boolean;
}

export interface EnterpriseCrmPromoLandingProps {
  onRequestDemo?: (values: EnterpriseCrmPromoLeadValues) => Promise<void> | void;
}


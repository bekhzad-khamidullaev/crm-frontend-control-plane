/**
 * Company Zod validation schema
 * Type-safe form validation for companies
 */

import { z } from 'zod';

export const companySchema = z.object({
  name: z.string().optional(), // Used in frontend form, mapped to full_name
  full_name: z.string().min(1, 'Название компании обязательно'), // API field
  // We'll enforce at least one is present in form logic or refining schema

  email: z.string().email('Неверный формат email').optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url('Неверный формат URL').optional().or(z.literal('')),
  country: z.number().optional(),
  city: z.number().optional(),
  address: z.string().optional(),
  industry: z.number().optional(),
  type: z.number().optional(),
  owner: z.number().optional(),
  department: z.number().optional(),
  lead_source: z.number().optional(),
  description: z.string().optional(),
  legal_stir: z.string().optional(),
  legal_mfo: z.string().optional(),
  legal_account: z.string().optional(),
  legal_bank_name: z.string().optional(),
  legal_signer_name: z.string().optional(),
  legal_signer_position: z.string().optional(),
  legal_signing_basis: z.string().optional(),
});

export type CompanyFormData = z.infer<typeof companySchema>;

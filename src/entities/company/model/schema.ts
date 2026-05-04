/**
 * Company Zod validation schema
 * Type-safe form validation for companies
 */

import { z } from 'zod';

export const companySchema = z.object({
  full_name: z.string().min(1, 'Название компании обязательно'),
  alternative_names: z.string().optional(),
  active: z.boolean().optional(),
  email: z.string().email('Неверный формат email').optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url('Неверный формат URL').optional().or(z.literal('')),
  country: z.number().nullable().optional(),
  city: z.number().nullable().optional(),
  city_name: z.string().optional(),
  address: z.string().optional(),
  region: z.string().optional(),
  district: z.string().optional(),
  industry: z.array(z.number()).optional(),
  type: z.number().nullable().optional(),
  owner: z.number().nullable().optional(),
  department: z.number().nullable().optional(),
  lead_source: z.number().nullable().optional(),
  description: z.string().optional(),
  registration_number: z.string().optional(),
  legal_stir: z.string().optional(),
  legal_mfo: z.string().optional(),
  legal_account: z.string().optional(),
  legal_bank_name: z.string().optional(),
  legal_signer_name: z.string().optional(),
  legal_signer_position: z.string().optional(),
  legal_signing_basis: z.string().optional(),
  disqualified: z.boolean().optional(),
  massmail: z.boolean().optional(),
  tags: z.array(z.number()).optional(),
  token: z.string().optional(),
  was_in_touch: z.any().nullable().optional(),
});

export type CompanyFormData = z.infer<typeof companySchema>;

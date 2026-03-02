import { z } from 'zod';

export const leadSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  middle_name: z.string().optional(),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  phone: z.string().optional(),
  title: z.string().optional(), // Position
  sex: z.enum(['M', 'F', 'O']).nullable().optional(),
  birth_date: z.any().nullable().optional(), // Date object or string

  // Secondary Contact
  secondary_email: z.string().email('Некорректный email').optional().nullable().or(z.literal('')),
  other_phone: z.string().optional(),
  mobile: z.string().optional(),

  // Company
  company: z.number().nullable().optional(),
  company_name: z.string().optional(),
  company_phone: z.string().optional(),
  company_email: z.string().email('Некорректный email').optional().nullable().or(z.literal('')),
  website: z.string().url('Некорректный URL').optional().nullable().or(z.literal('')),
  company_address: z.string().optional(),
  type: z.number().nullable().optional(), // Client type
  industry: z.array(z.number()).optional(),

  // Location
  country: z.number().nullable().optional(),
  city: z.number().nullable().optional(),
  city_name: z.string().optional(),
  address: z.string().optional(),
  region: z.string().optional(),
  district: z.string().optional(),

  // Management
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional(),
  lead_source: z.number().nullable().optional(),
  tags: z.array(z.number()).optional(),
  owner: z.number().nullable().optional(),
  department: z.number().nullable().optional(),
  contact: z.number().nullable().optional(),
  token: z.string().optional(),

  // Flags & Meta
  massmail: z.boolean().optional(),
  disqualified: z.boolean().optional(),
  was_in_touch: z.any().nullable().optional(),
  description: z.string().optional(),
}).refine((data) => data.first_name || data.company_name, {
  message: 'Имя или название компании обязательно',
  path: ['first_name'],
});

export type LeadFormData = z.infer<typeof leadSchema>;

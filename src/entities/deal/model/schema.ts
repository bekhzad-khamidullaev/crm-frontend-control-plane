import { z } from 'zod';

export const dealSchema = z.object({
  name: z.string().min(1, 'Введите название'),
  amount: z.union([z.string(), z.number()]).nullable().optional(),
  currency: z.number().nullable().optional(),
  stage: z.number().nullable().optional(),
  probability: z.number().min(0).max(100).nullable().optional(),

  closing_date: z.any().nullable().optional(), // Date or string
  closing_reason: z.number().nullable().optional(),

  next_step: z.string().min(1, 'Введите следующий шаг'),
  next_step_date: z.any().refine((val) => val !== null && val !== undefined, 'Выберите дату следующего шага'),

  description: z.string().optional(),

  // Relations
  company: z.number().nullable().optional(),
  contact: z.number().nullable().optional(),
  lead: z.number().nullable().optional(),
  request: z.number().nullable().optional(),
  partner_contact: z.number().nullable().optional(),

  // Meta
  tags: z.array(z.number()).optional(),

  // Location
  country: z.number().nullable().optional(),
  city: z.number().nullable().optional(),

  // Ownership
  owner: z.number().nullable().optional(),
  co_owner: z.number().nullable().optional(),
  department: z.number().nullable().optional(),

  // Boolean flags
  active: z.boolean().optional(),
  relevant: z.boolean().optional(),
  important: z.boolean().optional(),
  is_new: z.boolean().optional(),
  remind_me: z.boolean().optional(),
});

export type DealFormData = z.infer<typeof dealSchema>;

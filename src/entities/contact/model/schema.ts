import { z } from 'zod';

export const contactSchema = z.object({
  first_name: z.string().min(1, 'Имя обязательно'),
  last_name: z.string().optional(),
  middle_name: z.string().optional(),
  email: z.string().email('Некорректный email').min(1, 'Email обязателен'),
  phone: z.string().optional(),
  title: z.string().optional(), // Position
  company: z.number().nullable().optional(),

  // Address & Location
  country: z.number().nullable().optional(),
  city: z.number().nullable().optional(),
  address: z.string().optional(),

  // Meta
  lead_source: z.number().nullable().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),

  // Arrays
  tags: z.array(z.number()).optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;

import { z } from 'zod';

export const contactSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().min(1, 'Фамилия обязательна'),
  middle_name: z.string().optional(),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
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

  // Arrays
  tags: z.array(z.number()).optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;

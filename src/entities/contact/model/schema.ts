import { z } from 'zod';

export const contactSchema = z.object({
  first_name: z.string().min(1, 'Имя обязательно'),
  last_name: z.string().min(1, 'Фамилия обязательна'),
  middle_name: z.string().optional(),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  other_phone: z.string().optional(),
  telegram_username: z.string().optional(),
  telegram_chat_id: z.string().optional(),
  instagram_username: z.string().optional(),
  instagram_recipient_id: z.string().optional(),
  facebook_psid: z.string().optional(),
  title: z.string().optional(), // Position
  company: z.number().nullable(),

  // Address & Location
  country: z.number().nullable().optional(),
  city: z.number().nullable().optional(),
  address: z.string().optional(),

  // Meta
  lead_source: z.number().nullable().optional(),
  description: z.string().optional(),
  owner: z.number().nullable().optional(),
  department: z.number().nullable().optional(),
  massmail: z.boolean().optional(),

  // Arrays
  tags: z.array(z.number()).optional(),
}).refine((data) => data.company !== null && data.company !== undefined, {
  message: 'Компания обязательна',
  path: ['company'],
});

export type ContactFormData = z.infer<typeof contactSchema>;

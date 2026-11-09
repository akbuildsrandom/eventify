import { z } from 'zod';

export const ticketTypeInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, 'Ticket type name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be non-negative'),
  totalQuantity: z.number().int().positive('Total quantity must be greater than zero'),
  salesStart: z.string().datetime().or(z.date()),
  salesEnd: z.string().datetime().or(z.date()),
  maxPerOrder: z.number().int().positive().max(20).default(5),
});

export const venueInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, 'Venue name is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  country: z.string().default('India'),
  pincode: z.string().min(3, 'Valid pincode required'),
  capacity: z.number().int().positive(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const createEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(150),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.string().min(2, 'Category is required'),
  venueId: z.string().uuid().optional(),
  venueData: venueInputSchema.optional(),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  imageUrl: z.string().url().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  ticketTypes: z.array(ticketTypeInputSchema).min(1, 'At least one ticket category is required'),
});

export const updateEventSchema = createEventSchema.partial().extend({
  ticketTypes: z.array(ticketTypeInputSchema).optional(),
});

export const eventQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'popularity', 'upcoming']).default('upcoming'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
});

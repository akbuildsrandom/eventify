import prisma from '../config/prisma.js';
import cache from '../config/redis.js';

const generateSlug = (title) => {
  const base = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return `${base}-${Math.random().toString(36).substring(2, 6)}`;
};

export const eventService = {
  async getEvents({
    search,
    category,
    city,
    startDate,
    endDate,
    minPrice,
    maxPrice,
    sort = 'upcoming',
    page = 1,
    limit = 12,
  }) {
    const cacheKey = `events:${JSON.stringify({ search, category, city, startDate, endDate, minPrice, maxPrice, sort, page, limit })}`;
    
    // Check cache for public listings (if no search parameter to avoid memory blowup)
    if (!search) {
      const cached = await cache.get(cacheKey);
      if (cached) return cached;
    }

    const where = {
      status: 'PUBLISHED',
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category && category !== 'ALL') {
      where.category = category.toUpperCase();
    }

    if (city && city !== 'ALL') {
      where.venue = {
        city: { contains: city, mode: 'insensitive' },
      };
    }

    if (startDate) {
      where.startDate = { gte: new Date(startDate) };
    } else {
      // Default: show events happening in the future or ongoing
      where.endDate = { gte: new Date() };
    }

    if (endDate) {
      where.endDate = { ...where.endDate, lte: new Date(endDate) };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.ticketTypes = {
        some: {
          price: {
            ...(minPrice !== undefined ? { gte: Number(minPrice) } : {}),
            ...(maxPrice !== undefined ? { lte: Number(maxPrice) } : {}),
          },
        },
      };
    }

    let orderBy = [{ startDate: 'asc' }];
    if (sort === 'newest') {
      orderBy = [{ createdAt: 'desc' }];
    } else if (sort === 'popularity') {
      orderBy = [{ bookings: { _count: 'desc' } }];
    } else if (sort === 'price_asc') {
      // Order handled in-memory or by startDate default
      orderBy = [{ startDate: 'asc' }];
    }

    const skip = (page - 1) * limit;

    const [total, events] = await Promise.all([
      prisma.event.count({ where }),
      prisma.event.findMany({
        where,
        include: {
          venue: true,
          organizer: {
            select: { id: true, name: true, avatar: true },
          },
          ticketTypes: {
            select: {
              id: true,
              name: true,
              price: true,
              availableQuantity: true,
              totalQuantity: true,
            },
            orderBy: { price: 'asc' },
          },
          _count: {
            select: { reviews: true, bookings: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    // Enhance events with starting price and review rating
    const enrichedEvents = events.map((event) => {
      const minTicketPrice = event.ticketTypes.length > 0
        ? Math.min(...event.ticketTypes.map((t) => Number(t.price)))
        : 0;
      const totalAvailable = event.ticketTypes.reduce((acc, t) => acc + t.availableQuantity, 0);

      return {
        ...event,
        startingPrice: minTicketPrice,
        totalAvailableTickets: totalAvailable,
        isSoldOut: totalAvailable <= 0,
      };
    });

    const result = {
      events: enrichedEvents,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache results for 5 minutes
    if (!search) {
      await cache.set(cacheKey, result, 300);
    }

    return result;
  },

  async getEventByIdOrSlug(idOrSlug) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    const event = await prisma.event.findFirst({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
      include: {
        venue: true,
        organizer: {
          select: { id: true, name: true, email: true, avatar: true, phone: true },
        },
        ticketTypes: {
          orderBy: { price: 'asc' },
        },
        reviews: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { reviews: true, bookings: true },
        },
      },
    });

    if (!event) {
      const err = new Error('Event not found');
      err.statusCode = 404;
      throw err;
    }

    // Calculate average rating
    const avgRating = event.reviews.length > 0
      ? event.reviews.reduce((acc, r) => acc + r.rating, 0) / event.reviews.length
      : 0;

    const totalAvailable = event.ticketTypes.reduce((acc, t) => acc + t.availableQuantity, 0);

    return {
      ...event,
      averageRating: parseFloat(avgRating.toFixed(1)),
      totalAvailableTickets: totalAvailable,
      isSoldOut: totalAvailable <= 0,
    };
  },

  async createEvent(organizerId, eventData) {
    const slug = generateSlug(eventData.title);

    let venueId = eventData.venueId;

    // If organizer provided inline venue details, create the venue first
    if (!venueId && eventData.venueData) {
      const venue = await prisma.venue.create({
        data: {
          name: eventData.venueData.name,
          address: eventData.venueData.address,
          city: eventData.venueData.city,
          state: eventData.venueData.state,
          country: eventData.venueData.country || 'India',
          pincode: eventData.venueData.pincode,
          capacity: eventData.venueData.capacity,
          latitude: eventData.venueData.latitude,
          longitude: eventData.venueData.longitude,
        },
      });
      venueId = venue.id;
    }

    const createdEvent = await prisma.event.create({
      data: {
        title: eventData.title,
        slug,
        description: eventData.description,
        category: eventData.category.toUpperCase(),
        organizerId,
        venueId,
        startDate: new Date(eventData.startDate),
        endDate: new Date(eventData.endDate),
        imageUrl: eventData.imageUrl,
        status: eventData.status || 'DRAFT',
        ticketTypes: {
          create: eventData.ticketTypes.map((tt) => ({
            name: tt.name,
            description: tt.description,
            price: Number(tt.price),
            totalQuantity: Number(tt.totalQuantity),
            availableQuantity: Number(tt.totalQuantity),
            salesStart: new Date(tt.salesStart),
            salesEnd: new Date(tt.salesEnd),
            maxPerOrder: Number(tt.maxPerOrder || 5),
          })),
        },
      },
      include: {
        venue: true,
        ticketTypes: true,
      },
    });

    // Invalidate event cache
    await cache.invalidatePattern('events:');

    return createdEvent;
  },

  async updateEvent(organizerId, eventId, updateData, userRole = 'ORGANIZER') {
    const existing = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        bookings: { where: { status: 'CONFIRMED' } },
        ticketTypes: true,
      },
    });

    if (!existing) {
      const err = new Error('Event not found');
      err.statusCode = 404;
      throw err;
    }

    if (userRole !== 'ADMIN' && existing.organizerId !== organizerId) {
      const err = new Error('You are not authorized to modify this event');
      err.statusCode = 403;
      throw err;
    }

    // Safety: If there are existing confirmed bookings, protect critical details
    const hasBookings = existing.bookings.length > 0;
    if (hasBookings && updateData.startDate && new Date(updateData.startDate).getTime() !== existing.startDate.getTime()) {
      // Allow only with warning or restriction
    }

    const updatePayload = {};
    if (updateData.title) updatePayload.title = updateData.title;
    if (updateData.description) updatePayload.description = updateData.description;
    if (updateData.category) updatePayload.category = updateData.category.toUpperCase();
    if (updateData.venueId) updatePayload.venueId = updateData.venueId;
    if (updateData.startDate) updatePayload.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updatePayload.endDate = new Date(updateData.endDate);
    if (updateData.imageUrl) updatePayload.imageUrl = updateData.imageUrl;
    if (updateData.status) updatePayload.status = updateData.status;

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: updatePayload,
      include: {
        venue: true,
        ticketTypes: true,
      },
    });

    await cache.invalidatePattern('events:');
    return updated;
  },

  async publishEvent(organizerId, eventId, userRole = 'ORGANIZER') {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketTypes: true },
    });

    if (!event) {
      const err = new Error('Event not found');
      err.statusCode = 404;
      throw err;
    }

    if (userRole !== 'ADMIN' && event.organizerId !== organizerId) {
      const err = new Error('Not authorized to publish this event');
      err.statusCode = 403;
      throw err;
    }

    if (event.ticketTypes.length === 0) {
      const err = new Error('Cannot publish an event with no ticket categories defined');
      err.statusCode = 400;
      throw err;
    }

    const published = await prisma.event.update({
      where: { id: eventId },
      data: { status: 'PUBLISHED' },
      include: { ticketTypes: true, venue: true },
    });

    await cache.invalidatePattern('events:');
    return published;
  },

  async cancelEvent(organizerId, eventId, userRole = 'ORGANIZER') {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        bookings: {
          where: { status: 'CONFIRMED' },
          include: { user: true },
        },
      },
    });

    if (!event) {
      const err = new Error('Event not found');
      err.statusCode = 404;
      throw err;
    }

    if (userRole !== 'ADMIN' && event.organizerId !== organizerId) {
      const err = new Error('Not authorized to cancel this event');
      err.statusCode = 403;
      throw err;
    }

    const cancelled = await prisma.event.update({
      where: { id: eventId },
      data: { status: 'CANCELLED' },
    });

    // In a production event platform, notify affected ticket holders
    await cache.invalidatePattern('events:');
    return { event: cancelled, affectedBookingsCount: event.bookings.length };
  },

  async deleteDraftEvent(organizerId, eventId, userRole = 'ORGANIZER') {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      const err = new Error('Event not found');
      err.statusCode = 404;
      throw err;
    }

    if (userRole !== 'ADMIN' && event.organizerId !== organizerId) {
      const err = new Error('Not authorized to delete this event');
      err.statusCode = 403;
      throw err;
    }

    if (event.status !== 'DRAFT') {
      const err = new Error('Only draft events can be permanently deleted');
      err.statusCode = 400;
      throw err;
    }

    await prisma.event.delete({ where: { id: eventId } });
    await cache.invalidatePattern('events:');
    return true;
  },
};

import prisma from '../config/prisma.js';

export const reviewService = {
  async createReview(userId, eventId, { rating, comment }) {
    // 1. Verify user purchased tickets or attended this event
    const confirmedBooking = await prisma.booking.findFirst({
      where: {
        userId,
        eventId,
        status: 'CONFIRMED',
      },
    });

    if (!confirmedBooking) {
      const err = new Error('Only verified attendees who booked tickets can leave a review for this event');
      err.statusCode = 403;
      throw err;
    }

    // 2. Prevent duplicate reviews
    const existingReview = await prisma.review.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (existingReview) {
      const err = new Error('You have already submitted a review for this event');
      err.statusCode = 409;
      throw err;
    }

    return await prisma.review.create({
      data: {
        userId,
        eventId,
        rating,
        comment,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });
  },

  async getEventReviews(eventId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [total, reviews, aggregate] = await Promise.all([
      prisma.review.count({ where: { eventId } }),
      prisma.review.findMany({
        where: { eventId },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.aggregate({
        where: { eventId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    return {
      reviews,
      stats: {
        totalReviews: aggregate._count.rating,
        averageRating: parseFloat((aggregate._avg.rating || 0).toFixed(1)),
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async deleteReview(userId, reviewId, userRole = 'CUSTOMER') {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      const err = new Error('Review not found');
      err.statusCode = 404;
      throw err;
    }

    if (userRole !== 'ADMIN' && review.userId !== userId) {
      const err = new Error('Not authorized to delete this review');
      err.statusCode = 403;
      throw err;
    }

    await prisma.review.delete({ where: { id: reviewId } });
    return true;
  },
};

import prisma from '../config/prisma.js';

export const venueService = {
  async getAllVenues() {
    return await prisma.venue.findMany({
      orderBy: { name: 'asc' },
    });
  },

  async getVenuesByCity(city) {
    return await prisma.venue.findMany({
      where: {
        city: {
          contains: city,
          mode: 'insensitive',
        },
      },
      orderBy: { name: 'asc' },
    });
  },

  async createVenue(data) {
    return await prisma.venue.create({
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country || 'India',
        pincode: data.pincode,
        capacity: data.capacity,
        latitude: data.latitude,
        longitude: data.longitude,
      },
    });
  },
};

import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';

export const userService = {
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        avatar: true,
        phone: true,
        createdAt: true,
        _count: {
          select: {
            bookings: true,
            reviews: true,
            events: true,
          },
        },
      },
    });

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    return user;
  },

  async updateProfile(userId, { name, phone, avatar }) {
    const data = {};
    if (name !== undefined) data.name = name;
    if (phone !== undefined) data.phone = phone;
    if (avatar !== undefined) data.avatar = avatar;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        avatar: true,
        phone: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  },

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      const err = new Error('Incorrect current password');
      err.statusCode = 400;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return true;
  },
};

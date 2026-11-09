import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Eventify database seed...');

  // Clean existing records in correct relation order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bookingItem.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.ticketType.deleteMany();
  await prisma.event.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.emailVerificationToken.deleteMany();
  await prisma.paymentWebhookEvent.deleteMany();
  await prisma.user.deleteMany();

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash('Password123!', saltRounds);

  // 1. Create Users
  console.log('👤 Seeding users...');
  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@eventify.com',
      password: hashedPassword,
      role: 'ADMIN',
      isVerified: true,
      phone: '+91 98765 43210',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
  });

  const organizer1 = await prisma.user.create({
    data: {
      name: 'TechSpark India',
      email: 'organizer1@eventify.com',
      password: hashedPassword,
      role: 'ORGANIZER',
      isVerified: true,
      phone: '+91 98111 22334',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    },
  });

  const organizer2 = await prisma.user.create({
    data: {
      name: 'VibeNation Concerts',
      email: 'organizer2@eventify.com',
      password: hashedPassword,
      role: 'ORGANIZER',
      isVerified: true,
      phone: '+91 98222 33445',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80',
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      name: 'Aarav Sharma',
      email: 'customer1@eventify.com',
      password: hashedPassword,
      role: 'CUSTOMER',
      isVerified: true,
      phone: '+91 98333 44556',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      name: 'Ananya Patel',
      email: 'customer2@eventify.com',
      password: hashedPassword,
      role: 'CUSTOMER',
      isVerified: true,
      phone: '+91 98444 55667',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    },
  });

  // 2. Create Venues across India
  console.log('📍 Seeding venues...');
  const venueBangalore = await prisma.venue.create({
    data: {
      name: 'Gayatri Vihar, Palace Grounds',
      address: 'Near Mehkri Circle, Bellary Road, Armane Nagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      pincode: '560006',
      capacity: 5000,
      latitude: 13.0068,
      longitude: 77.5813,
    },
  });

  const venueMumbai = await prisma.venue.create({
    data: {
      name: 'Jio World Convention Centre',
      address: 'G Block, Bandra Kurla Complex, Bandra East',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400051',
      capacity: 8000,
      latitude: 19.0657,
      longitude: 72.8687,
    },
  });

  const venueDelhi = await prisma.venue.create({
    data: {
      name: 'Bharat Mandapam Convention Center',
      address: 'Pragati Maidan, Mathura Road',
      city: 'New Delhi',
      state: 'Delhi',
      country: 'India',
      pincode: '110001',
      capacity: 7000,
      latitude: 28.6186,
      longitude: 77.2435,
    },
  });

  const venueHyderabad = await prisma.venue.create({
    data: {
      name: 'HITEX International Convention Centre',
      address: 'Izzat Nagar, Madhapur, Hitec City',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      pincode: '500084',
      capacity: 4500,
      latitude: 17.4716,
      longitude: 78.3752,
    },
  });

  // 3. Create Events & Ticket Types
  console.log('🎉 Seeding events and ticket categories...');
  const now = new Date();
  
  // Event 1: TechSpark Hackathon
  const hackathonStart = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const hackathonEnd = new Date(hackathonStart.getTime() + 36 * 60 * 60 * 1000);

  const event1 = await prisma.event.create({
    data: {
      title: 'CodeStorm India 2026: 36-Hour National AI & Web3 Hackathon',
      slug: 'codestorm-india-2026',
      description: 'Join over 1,500 builders, innovators, and designers for India\'s most intense 36-hour hackathon. Build groundbreaking decentralized and generative AI solutions with ₹25,00,000 in bounties, mentorship from top Silicon Valley and Indian tech leaders, unlimited refreshments, and direct interview opportunities.',
      category: 'HACKATHON',
      organizerId: organizer1.id,
      venueId: venueBangalore.id,
      startDate: hackathonStart,
      endDate: hackathonEnd,
      imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
      status: 'PUBLISHED',
      ticketTypes: {
        create: [
          {
            name: 'Student Hacker Pass',
            description: 'Includes 36h venue access, meals, snacks, red bull, and event swag kit. Valid College ID required.',
            price: 299.00,
            totalQuantity: 500,
            availableQuantity: 480,
            salesStart: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
            salesEnd: hackathonStart,
            maxPerOrder: 4,
          },
          {
            name: 'Professional Innovator Pass',
            description: 'Full hackathon access for working professionals, startup founders, and mentors.',
            price: 799.00,
            totalQuantity: 200,
            availableQuantity: 195,
            salesStart: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
            salesEnd: hackathonStart,
            maxPerOrder: 2,
          },
        ],
      },
    },
    include: {
      ticketTypes: true,
    },
  });

  // Event 2: Arijit Singh Concert in Mumbai
  const concertStart = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const concertEnd = new Date(concertStart.getTime() + 4 * 60 * 60 * 1000);

  const event2 = await prisma.event.create({
    data: {
      title: 'Echoes of Soul: Arijit Singh Live in Concert Mumbai',
      slug: 'arijit-singh-live-mumbai-2026',
      description: 'Prepare to be captivated by India\'s most beloved voice. Experience an enchanting evening featuring a 40-piece live orchestra, state-of-the-art acoustic design, and timeless ballads that have defined modern Indian music.',
      category: 'CONCERT',
      organizerId: organizer2.id,
      venueId: venueMumbai.id,
      startDate: concertStart,
      endDate: concertEnd,
      imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
      status: 'PUBLISHED',
      ticketTypes: {
        create: [
          {
            name: 'Silver Grandstand',
            description: 'Reserved seating in upper stadium zone with clear line of sight and high-definition screens.',
            price: 1499.00,
            totalQuantity: 1000,
            availableQuantity: 850,
            salesStart: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
            salesEnd: concertStart,
            maxPerOrder: 6,
          },
          {
            name: 'Gold Arena Standing',
            description: 'Direct pitch arena access near front stage towers. Energetic concert atmosphere.',
            price: 3499.00,
            totalQuantity: 500,
            availableQuantity: 420,
            salesStart: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
            salesEnd: concertStart,
            maxPerOrder: 4,
          },
          {
            name: 'VIP Platinum Lounge',
            description: 'Elevated luxury lounge with complimentary gourmet snacks, dedicated lounge bar, and fast-track lane.',
            price: 7999.00,
            totalQuantity: 100,
            availableQuantity: 75,
            salesStart: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
            salesEnd: concertStart,
            maxPerOrder: 4,
          },
        ],
      },
    },
    include: {
      ticketTypes: true,
    },
  });

  // Event 3: DevCon Bharat (New Delhi)
  const devconStart = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);
  const devconEnd = new Date(devconStart.getTime() + 16 * 60 * 60 * 1000);

  const event3 = await prisma.event.create({
    data: {
      title: 'DevCon Bharat 2026: Cloud, AI & Next-Gen Systems',
      slug: 'devcon-bharat-2026',
      description: 'The premier annual software engineering and architecture summit in New Delhi. Over 40 technical keynotes, deep-dive workshops on distributed databases, WebAssembly, Kubernetes, and LLM orchestration.',
      category: 'CONFERENCE',
      organizerId: organizer1.id,
      venueId: venueDelhi.id,
      startDate: devconStart,
      endDate: devconEnd,
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
      status: 'PUBLISHED',
      ticketTypes: {
        create: [
          {
            name: 'Standard Conference Pass',
            description: 'Access to all keynote stages, expo arena, lunch buffet and conference swag kit.',
            price: 1999.00,
            totalQuantity: 600,
            availableQuantity: 550,
            salesStart: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
            salesEnd: devconStart,
            maxPerOrder: 5,
          },
          {
            name: 'All-Access Workshop + Pass',
            description: 'Includes hands-on architecture masterclasses and exclusive speaker dinner invite.',
            price: 4499.00,
            totalQuantity: 150,
            availableQuantity: 120,
            salesStart: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
            salesEnd: devconStart,
            maxPerOrder: 3,
          },
        ],
      },
    },
    include: {
      ticketTypes: true,
    },
  });

  // Event 4: Mood Indigo College Festival
  const festStart = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const festEnd = new Date(festStart.getTime() + 72 * 60 * 60 * 1000);

  const event4 = await prisma.event.create({
    data: {
      title: 'Mood Indigo 2026: Asia\'s Largest Cultural Festival',
      slug: 'mood-indigo-2026',
      description: '4 unforgettable days of high-energy battle of bands, theatrical plays, international EDM nights, street dancing, comedy showcases and artistic exhibitions.',
      category: 'COLLEGE_FEST',
      organizerId: organizer2.id,
      venueId: venueMumbai.id,
      startDate: festStart,
      endDate: festEnd,
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
      status: 'PUBLISHED',
      ticketTypes: {
        create: [
          {
            name: '4-Day Festival All-Access',
            description: 'Valid entry for all competitions, celebrity concerts, and daytime carnival zones.',
            price: 499.00,
            totalQuantity: 2000,
            availableQuantity: 1900,
            salesStart: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
            salesEnd: festStart,
            maxPerOrder: 5,
          },
        ],
      },
    },
    include: {
      ticketTypes: true,
    },
  });

  // Event 5: Microservices Masterclass (Hyderabad)
  const workshopStart = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);
  const workshopEnd = new Date(workshopStart.getTime() + 8 * 60 * 60 * 1000);

  const event5 = await prisma.event.create({
    data: {
      title: 'Hands-on Distributed Systems & Kubernetes Masterclass',
      slug: 'distributed-systems-k8s-masterclass-2026',
      description: 'Intensive 8-hour live workshop covering production-ready microservice communication, gRPC, event sourcing, circuit breakers, and zero-downtime deployments on Kubernetes.',
      category: 'WORKSHOP',
      organizerId: organizer1.id,
      venueId: venueHyderabad.id,
      startDate: workshopStart,
      endDate: workshopEnd,
      imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
      status: 'PUBLISHED',
      ticketTypes: {
        create: [
          {
            name: 'Workshop Seat',
            description: 'Includes lab cloud environments, curated architecture codebases, and certificate of completion.',
            price: 1299.00,
            totalQuantity: 80,
            availableQuantity: 65,
            salesStart: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
            salesEnd: workshopStart,
            maxPerOrder: 2,
          },
        ],
      },
    },
    include: {
      ticketTypes: true,
    },
  });

  // 4. Create Sample Confirmed Booking & Real Digital Tickets for Customer 1
  console.log('🎟️ Seeding confirmed bookings and verifiable tickets...');
  const studentTicketType = event1.ticketTypes[0];
  const bookingTotal = 299.00 * 2;

  const sampleBooking = await prisma.booking.create({
    data: {
      userId: customer1.id,
      eventId: event1.id,
      totalAmount: bookingTotal,
      status: 'CONFIRMED',
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
      idempotencyKey: 'seed_sample_booking_key_1',
      bookingItems: {
        create: [
          {
            ticketTypeId: studentTicketType.id,
            quantity: 2,
            unitPrice: 299.00,
            subtotal: bookingTotal,
          },
        ],
      },
      payments: {
        create: [
          {
            userId: customer1.id,
            amount: bookingTotal,
            provider: 'RAZORPAY',
            providerOrderId: 'order_seed_rzp_mock_12345',
            providerPaymentId: 'pay_seed_rzp_mock_98765',
            status: 'SUCCESS',
          },
        ],
      },
    },
  });

  // Generate QR code for ticket 1
  const ticketCode1 = `EVT-${event1.id.slice(0, 4).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const qrData1 = JSON.stringify({
    ticketCode: ticketCode1,
    eventId: event1.id,
    type: studentTicketType.name,
  });
  const qrBase64_1 = await QRCode.toDataURL(qrData1);

  await prisma.ticket.create({
    data: {
      bookingId: sampleBooking.id,
      ticketTypeId: studentTicketType.id,
      ticketCode: ticketCode1,
      qrCode: qrBase64_1,
      status: 'VALID',
    },
  });

  // Generate QR code for ticket 2
  const ticketCode2 = `EVT-${event1.id.slice(0, 4).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const qrData2 = JSON.stringify({
    ticketCode: ticketCode2,
    eventId: event1.id,
    type: studentTicketType.name,
  });
  const qrBase64_2 = await QRCode.toDataURL(qrData2);

  await prisma.ticket.create({
    data: {
      bookingId: sampleBooking.id,
      ticketTypeId: studentTicketType.id,
      ticketCode: ticketCode2,
      qrCode: qrBase64_2,
      status: 'VALID',
    },
  });

  // 5. Add initial reviews & notifications
  console.log('⭐ Seeding reviews and notifications...');
  await prisma.review.create({
    data: {
      eventId: event1.id,
      userId: customer1.id,
      rating: 5,
      comment: 'Attended CodeStorm last year and it completely changed my career! Can\'t wait for this edition.',
    },
  });

  await prisma.notification.create({
    data: {
      userId: customer1.id,
      title: 'Booking Confirmed: CodeStorm India 2026',
      message: 'Your tickets for CodeStorm India 2026 have been successfully issued. Download your digital passes anytime.',
      type: 'BOOKING',
      isRead: false,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: organizer1.id,
      action: 'EVENT_PUBLISHED',
      entityType: 'EVENT',
      entityId: event1.id,
      metadata: { title: event1.title, status: 'PUBLISHED' },
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('Credentials:');
  console.log('  Admin:     admin@eventify.com / Password123!');
  console.log('  Organizer: organizer1@eventify.com / Password123!');
  console.log('  Customer:  customer1@eventify.com / Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

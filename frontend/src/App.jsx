import React, { useEffect } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ToastContainer } from './components/common/ToastContainer';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { CustomerLayout } from './components/layout/CustomerLayout';
import { OrganizerLayout } from './components/layout/OrganizerLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { EventsExplorePage } from './pages/public/EventsExplorePage';
import { EventDetailsPage } from './pages/public/EventDetailsPage';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';

// Customer Pages
import { CustomerDashboardPage } from './pages/customer/CustomerDashboardPage';
import { CustomerBookingsPage } from './pages/customer/CustomerBookingsPage';
import { CustomerTicketsPage } from './pages/customer/CustomerTicketsPage';
import { TicketViewPage } from './pages/customer/TicketViewPage';
import { CustomerProfilePage } from './pages/customer/CustomerProfilePage';

// Organizer Pages
import { OrganizerDashboardPage } from './pages/organizer/OrganizerDashboardPage';
import { OrganizerEventsPage } from './pages/organizer/OrganizerEventsPage';
import { CreateEventPage } from './pages/organizer/CreateEventPage';
import { OrganizerAttendeesPage } from './pages/organizer/OrganizerAttendeesPage';
import { OrganizerCheckInPage } from './pages/organizer/OrganizerCheckInPage';
import { OrganizerAnalyticsPage } from './pages/organizer/OrganizerAnalyticsPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminEventsPage } from './pages/admin/AdminEventsPage';
import { AdminBookingsPage } from './pages/admin/AdminBookingsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';

// Public Layout Wrapper with standard Navbar & Footer
const PublicLayout = () => (
  <div className="min-h-screen flex flex-col bg-[#f8fafc]">
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <>
      <Routes>
        {/* Public Website Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<EventsExplorePage />} />
          <Route path="/events/:id" element={<EventDetailsPage />} />
          <Route path="/my-tickets/:ticketId" element={<TicketViewPage />} />

          {/* Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Route>

        {/* Customer Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER', 'ORGANIZER', 'ADMIN']}>
              <CustomerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CustomerDashboardPage />} />
          <Route path="bookings" element={<CustomerBookingsPage />} />
          <Route path="tickets" element={<CustomerTicketsPage />} />
          <Route path="profile" element={<CustomerProfilePage />} />
          <Route path="notifications" element={<CustomerDashboardPage />} />
        </Route>

        {/* Organizer Studio Routes */}
        <Route
          path="/organizer"
          element={
            <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
              <OrganizerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<OrganizerDashboardPage />} />
          <Route path="dashboard" element={<OrganizerDashboardPage />} />
          <Route path="events" element={<OrganizerEventsPage />} />
          <Route path="events/new" element={<CreateEventPage />} />
          <Route path="attendees" element={<OrganizerAttendeesPage />} />
          <Route path="check-in" element={<OrganizerCheckInPage />} />
          <Route path="analytics" element={<OrganizerAnalyticsPage />} />
        </Route>

        {/* Administrator Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="events" element={<AdminEventsPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
          <Route path="audit-logs" element={<AdminAuditLogsPage />} />
        </Route>
      </Routes>

      {/* Global Toast Notifications */}
      <ToastContainer />
    </>
  );
}

export default App;

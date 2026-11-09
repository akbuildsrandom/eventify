import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Info,
  Calendar,
  MapPin,
  Ticket,
  Image as ImageIcon,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { eventService } from '../../services/eventService';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { CATEGORIES, CITIES, formatCurrency } from '../../utils/formatters';
import { toast } from '../../store/toastStore';

export const CreateEventPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Load existing venues
  const { data: venuesData } = useQuery({
    queryKey: ['all-venues'],
    queryFn: () => eventService.getVenues(),
  });
  const venues = venuesData?.data?.venues || [];

  // Form State
  const [eventData, setEventData] = useState({
    title: '',
    category: 'CONFERENCE',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    startDate: '',
    endDate: '',
    venueId: '',
    isNewVenue: false,
    newVenue: {
      name: '',
      address: '',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      capacity: 1000,
    },
    ticketTypes: [
      {
        name: 'General Admission',
        description: 'Standard event entry pass with full access',
        price: 999,
        totalQuantity: 100,
        maxPerOrder: 5,
        salesStart: '',
        salesEnd: '',
      },
    ],
  });

  const handleAddTicketType = () => {
    setEventData((prev) => ({
      ...prev,
      ticketTypes: [
        ...prev.ticketTypes,
        {
          name: '',
          description: '',
          price: 499,
          totalQuantity: 50,
          maxPerOrder: 4,
          salesStart: prev.startDate,
          salesEnd: prev.endDate,
        },
      ],
    }));
  };

  const handleRemoveTicketType = (index) => {
    if (eventData.ticketTypes.length <= 1) {
      toast.error('Requirement', 'An event must have at least one ticket category');
      return;
    }
    setEventData((prev) => ({
      ...prev,
      ticketTypes: prev.ticketTypes.filter((_, i) => i !== index),
    }));
  };

  const handleTicketFieldChange = (index, field, value) => {
    setEventData((prev) => {
      const updated = [...prev.ticketTypes];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, ticketTypes: updated };
    });
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await eventService.uploadBanner(file);
      if (res.data?.url) {
        setEventData((prev) => ({ ...prev, imageUrl: res.data.url }));
        toast.success('Uploaded', 'Banner image uploaded successfully!');
      }
    } catch (err) {
      toast.error('Upload Error', err.message || 'Could not upload banner');
    } finally {
      setIsUploading(false);
    }
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!eventData.title.trim() || eventData.title.length < 3) {
        toast.error('Validation', 'Please enter a valid title (min 3 chars)');
        return false;
      }
      if (!eventData.description.trim() || eventData.description.length < 20) {
        toast.error('Validation', 'Please provide a detailed description (min 20 chars)');
        return false;
      }
    } else if (step === 2) {
      if (!eventData.startDate || !eventData.endDate) {
        toast.error('Validation', 'Please set valid event start and end dates');
        return false;
      }
      if (new Date(eventData.startDate) >= new Date(eventData.endDate)) {
        toast.error('Validation', 'End date must be after the start date');
        return false;
      }
      if (!eventData.venueId && !eventData.isNewVenue) {
        toast.error('Validation', 'Please select a venue or add a new one');
        return false;
      }
      if (eventData.isNewVenue && !eventData.newVenue.name.trim()) {
        toast.error('Validation', 'Please enter the venue name');
        return false;
      }
    } else if (step === 3) {
      for (const tt of eventData.ticketTypes) {
        if (!tt.name.trim()) {
          toast.error('Validation', 'All ticket categories must have a name');
          return false;
        }
        if (tt.totalQuantity <= 0) {
          toast.error('Validation', 'Total quantity must be greater than zero');
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const handleSave = async (status = 'DRAFT') => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: eventData.title,
        category: eventData.category,
        description: eventData.description,
        imageUrl: eventData.imageUrl,
        startDate: new Date(eventData.startDate).toISOString(),
        endDate: new Date(eventData.endDate).toISOString(),
        status,
        venueId: eventData.isNewVenue ? undefined : eventData.venueId,
        venueData: eventData.isNewVenue ? eventData.newVenue : undefined,
        ticketTypes: eventData.ticketTypes.map((tt) => ({
          name: tt.name,
          description: tt.description,
          price: Number(tt.price),
          totalQuantity: Number(tt.totalQuantity),
          maxPerOrder: Number(tt.maxPerOrder || 5),
          salesStart: tt.salesStart ? new Date(tt.salesStart).toISOString() : new Date().toISOString(),
          salesEnd: tt.salesEnd ? new Date(tt.salesEnd).toISOString() : new Date(eventData.startDate).toISOString(),
        })),
      };

      const res = await eventService.createEvent(payload);
      toast.success(
        status === 'PUBLISHED' ? 'Event Published!' : 'Draft Saved!',
        `"${eventData.title}" has been saved.`
      );
      navigate('/organizer/events');
    } catch (err) {
      toast.error('Creation Error', err.message || 'Could not save event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: 'Basic Info', icon: Info },
    { num: 2, label: 'Venue & Schedule', icon: Calendar },
    { num: 3, label: 'Ticket Categories', icon: Ticket },
    { num: 4, label: 'Media & Preview', icon: ImageIcon },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Create New Experience
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure your event details, ticket tiers, schedule and venue
        </p>
      </div>

      {/* Stepper Navigation */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4 p-2 bg-white rounded-2xl border border-slate-200/80 shadow-subtle">
        {steps.map((st) => {
          const Icon = st.icon;
          const isActive = currentStep === st.num;
          const isDone = currentStep > st.num;

          return (
            <button
              key={st.num}
              type="button"
              onClick={() => {
                if (st.num < currentStep || validateStep(currentStep)) {
                  setCurrentStep(st.num);
                }
              }}
              className={`flex items-center justify-center sm:justify-start gap-2.5 p-2.5 sm:px-4 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-subtle'
                  : isDone
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : isDone
                    ? 'bg-emerald-200/60 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {isDone ? '✓' : st.num}
              </div>
              <span className="hidden sm:inline">{st.label}</span>
            </button>
          );
        })}
      </div>

      {/* FORM STEPS CONTENT */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-subtle">
        {/* STEP 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900">Step 1: Event Details</h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Event Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Bangalore AI Hackathon 2026 / Sunburn Arena"
                value={eventData.title}
                onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Category *
              </label>
              <select
                value={eventData.category}
                onChange={(e) => setEventData({ ...eventData, category: e.target.value })}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none"
              >
                {CATEGORIES.filter((c) => c.id !== 'ALL').map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Full Description *
              </label>
              <textarea
                rows={6}
                placeholder="Describe what attendees can expect, schedule highlights, special guests, perks, refreshments, and entry rules..."
                value={eventData.description}
                onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                className="w-full p-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Venue and Schedule */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900">Step 2: Venue & Schedule</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={eventData.startDate}
                  onChange={(e) => setEventData({ ...eventData, startDate: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  End Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={eventData.endDate}
                  onChange={(e) => setEventData({ ...eventData, endDate: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none"
                />
              </div>
            </div>

            {/* Venue Toggle */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Venue Selection
                </label>
                <button
                  type="button"
                  onClick={() => setEventData({ ...eventData, isNewVenue: !eventData.isNewVenue })}
                  className="text-xs font-bold text-brand-600 hover:underline"
                >
                  {eventData.isNewVenue ? 'Choose Existing Venue' : '+ Add New Venue'}
                </button>
              </div>

              {!eventData.isNewVenue ? (
                <div>
                  <select
                    value={eventData.venueId}
                    onChange={(e) => setEventData({ ...eventData, venueId: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none"
                  >
                    <option value="">-- Select an Indian Venue --</option>
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.city}, {v.state}) – Capacity: {v.capacity}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Venue Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Palace Grounds, Gayatri Vihar"
                      value={eventData.newVenue.name}
                      onChange={(e) =>
                        setEventData({
                          ...eventData,
                          newVenue: { ...eventData.newVenue, name: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Address *
                    </label>
                    <input
                      type="text"
                      placeholder="Street, locality..."
                      value={eventData.newVenue.address}
                      onChange={(e) =>
                        setEventData({
                          ...eventData,
                          newVenue: { ...eventData.newVenue, address: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">City *</label>
                    <input
                      type="text"
                      placeholder="e.g. Bengaluru"
                      value={eventData.newVenue.city}
                      onChange={(e) =>
                        setEventData({
                          ...eventData,
                          newVenue: { ...eventData.newVenue, city: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={eventData.newVenue.pincode}
                      onChange={(e) =>
                        setEventData({
                          ...eventData,
                          newVenue: { ...eventData.newVenue, pincode: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Capacity</label>
                    <input
                      type="number"
                      value={eventData.newVenue.capacity}
                      onChange={(e) =>
                        setEventData({
                          ...eventData,
                          newVenue: { ...eventData.newVenue, capacity: parseInt(e.target.value || '0', 10) },
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Ticket Categories & Pricing */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Step 3: Ticket Tiers & Pricing</h3>
                <p className="text-xs text-slate-500">Configure prices in INR and ticket inventory limits</p>
              </div>
              <Button variant="outline" size="sm" icon={Plus} onClick={handleAddTicketType}>
                Add Tier
              </Button>
            </div>

            <div className="space-y-4">
              {eventData.ticketTypes.map((tier, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-4 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase text-brand-600">
                      Tier #{idx + 1}
                    </span>
                    {eventData.ticketTypes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTicketType(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Category Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. VIP Pass / Early Bird / Student Pass"
                        value={tier.name}
                        onChange={(e) => handleTicketFieldChange(idx, 'name', e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Price (INR ₹) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={tier.price}
                        onChange={(e) => handleTicketFieldChange(idx, 'price', e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Total Tickets Available *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={tier.totalQuantity}
                        onChange={(e) =>
                          handleTicketFieldChange(idx, 'totalQuantity', e.target.value)
                        }
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Max Allowed Per Booking
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={tier.maxPerOrder}
                        onChange={(e) => handleTicketFieldChange(idx, 'maxPerOrder', e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Perks & Inclusions Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Includes workshop kit, lunch buffet and fast-track lane entry"
                      value={tier.description}
                      onChange={(e) => handleTicketFieldChange(idx, 'description', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Media Upload & Preview */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900">Step 4: Media & Preview</h3>

            {/* Banner Upload Box */}
            <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-center">
              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleBannerUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-brand-600 hover:underline block">
                  {isUploading ? 'Uploading to Cloudinary...' : 'Click to upload banner image'}
                </span>
                <span className="text-xs text-slate-400 mt-1 block">
                  JPEG, PNG or WebP up to 5MB (1200x630 recommended)
                </span>
              </label>

              <div className="mt-4 pt-4 border-t border-slate-200 text-left">
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Or paste direct Image URL:
                </label>
                <input
                  type="url"
                  value={eventData.imageUrl}
                  onChange={(e) => setEventData({ ...eventData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none"
                />
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="border border-slate-200 rounded-3xl p-6 bg-slate-50">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-3">
                Live Card Preview
              </span>
              <div className="max-w-sm">
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-subtle">
                  <img
                    src={eventData.imageUrl}
                    alt="Preview"
                    className="w-full h-44 object-cover"
                  />
                  <div className="p-4 space-y-2">
                    <Badge variant="primary" size="xs">
                      {eventData.category}
                    </Badge>
                    <h4 className="font-bold text-sm text-slate-900">{eventData.title || 'Untitled Event'}</h4>
                    <p className="text-xs text-slate-500">
                      {eventData.startDate ? new Date(eventData.startDate).toDateString() : 'Date TBA'}
                    </p>
                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-900">
                        {formatCurrency(eventData.ticketTypes[0]?.price || 0)}
                      </span>
                      <span className="text-brand-600 font-bold">Book</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Action Buttons */}
        <div className="flex items-center justify-between pt-8 mt-8 border-t border-slate-100">
          <div>
            {currentStep > 1 && (
              <Button variant="outline" size="sm" icon={ArrowLeft} onClick={handlePrevious}>
                Previous Step
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              isLoading={isSubmitting}
              onClick={() => handleSave('DRAFT')}
            >
              Save as Draft
            </Button>

            {currentStep < 4 ? (
              <Button variant="primary" size="sm" onClick={handleNext}>
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                variant="gradient"
                size="sm"
                icon={CheckCircle2}
                isLoading={isSubmitting}
                onClick={() => handleSave('PUBLISHED')}
              >
                Publish Live Event
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

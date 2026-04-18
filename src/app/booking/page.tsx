'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useCleaner } from '@/hooks/useCleaners';
import { useCreateBooking, usePriceEstimate } from '@/hooks/useBookings';
import { useDraftBooking, useSaveDraftBooking } from '@/hooks/useClientEnhanced';
import { useQuery } from '@tanstack/react-query';
import { reliabilityService } from '@/services/reliability.service';
import { ReliabilityScoreCard } from '@/components/reliability/ReliabilityScoreCard';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SkeletonList } from '@/components/ui/Skeleton';
import { ErrorDisplay } from '@/components/error/ErrorDisplay';
import { DateTimePicker } from '@/components/features/booking/DateTimePicker';
import { ServiceSelection } from '@/components/features/booking/ServiceSelection';
import { BookingStepper, BookingStepContent } from '@/components/features/booking/BookingStepper';
import { AddressAutocompletePlaceholder } from '@/components/booking/AddressAutocompletePlaceholder';
import { formatCurrency } from '@/lib/utils';
import { holidayService, Holiday } from '@/services/holiday.service';
import { useToast } from '@/contexts/ToastContext';
import { Save } from 'lucide-react';
import { AnimatePresence } from 'motion/react';

function BookingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cleanerId = searchParams.get('cleaner');

  const { data: cleanerData, isLoading: loadingCleaner } = useCleaner(cleanerId || '');
  const { mutate: createBooking, isPending: isCreating } = useCreateBooking();
  const { mutate: estimatePrice, data: priceEstimate, isPending: estimating } = usePriceEstimate();
  const { data: draftData } = useDraftBooking();
  const { mutate: saveDraft, isPending: isSavingDraft } = useSaveDraftBooking();
  const { data: reliabilityData } = useQuery({
    queryKey: ['reliability', cleanerId],
    queryFn: () => reliabilityService.getCleanerReliability(cleanerId!),
    enabled: !!cleanerId,
  });
  const { showToast } = useToast();
  const cleaner = cleanerData?.cleaner;

  const [step, setStep] = useState(1);
  const stepDirection = useRef<1 | -1>(1);
  const [bookingData, setBookingData] = useState({
    service_type: 'standard' as 'standard' | 'deep' | 'move_in_out',
    duration_hours: 3,
    scheduled_date: '',
    scheduled_time: '',
    address: '',
    address_line_2: '',
    city: '',
    state: '',
    zip_code: '',
    special_instructions: '',
    add_ons: [] as string[],
  });
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [holidayLoading, setHolidayLoading] = useState(false);
  const [priceBreakdown, setPriceBreakdown] = useState<any>(null);

  // Load draft on mount
  useEffect(() => {
    if (draftData?.draft) {
      setBookingData({ ...bookingData, ...draftData.draft });
      showToast('Draft booking loaded', 'info');
    }
  }, [draftData]);

  // Auto-save draft when booking data changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (bookingData.address || bookingData.scheduled_date) {
        saveDraft(bookingData);
      }
    }, 2000); // Debounce 2 seconds

    return () => clearTimeout(timer);
  }, [bookingData]);

  // Auto-estimate price when service details change (real-time)
  useEffect(() => {
    if (cleanerId && bookingData.service_type && bookingData.duration_hours) {
      estimatePrice({
        cleaner_id: cleanerId,
        service_type: bookingData.service_type,
        duration_hours: bookingData.duration_hours,
        add_ons: bookingData.add_ons,
      });
    }
  }, [cleanerId, bookingData.service_type, bookingData.duration_hours, bookingData.add_ons]);

  // Calculate detailed price breakdown
  useEffect(() => {
    if (priceEstimate && cleaner) {
      const baseRate = cleaner.price_per_hour || 0;
      const baseCost = baseRate * bookingData.duration_hours;
      const addOnCost = bookingData.add_ons.length * 10; // $10 per add-on
      const holidayMultiplier = selectedHoliday ? 1.15 : 1.0;
      const subtotal = (baseCost + addOnCost) * holidayMultiplier;
      const platformFee = subtotal * 0.1; // 10% platform fee
      const total = subtotal + platformFee;

      setPriceBreakdown({
        baseRate,
        baseCost,
        addOnCost,
        holidayMultiplier,
        holidayRate: selectedHoliday ? subtotal - (baseCost + addOnCost) : 0,
        subtotal,
        platformFee,
        total,
      });
    }
  }, [priceEstimate, cleaner, bookingData, selectedHoliday]);

  useEffect(() => {
    const fetchHoliday = async () => {
      if (!bookingData.scheduled_date) {
        setSelectedHoliday(null);
        return;
      }

      setHolidayLoading(true);
      try {
        const response = await holidayService.getHolidayByDate(bookingData.scheduled_date);
        setSelectedHoliday(response.holiday ?? null);
      } catch {
        setSelectedHoliday(null);
      } finally {
        setHolidayLoading(false);
      }
    };

    fetchHoliday();
  }, [bookingData.scheduled_date]);

  const handleSubmit = () => {
    if (!cleanerId) return;

    const scheduledDateTime = `${bookingData.scheduled_date}T${bookingData.scheduled_time}:00Z`;
    const endDateTime = new Date(scheduledDateTime);
    endDateTime.setHours(endDateTime.getHours() + bookingData.duration_hours);

    createBooking({
      cleaner_id: cleanerId,
      service_type: bookingData.service_type,
      scheduled_start_at: scheduledDateTime,
      scheduled_end_at: endDateTime.toISOString(),
      address: bookingData.address,
      address_line_2: bookingData.address_line_2,
      city: bookingData.city,
      state: bookingData.state,
      zip_code: bookingData.zip_code,
      special_instructions: bookingData.special_instructions,
      add_ons: bookingData.add_ons,
    });
  };

  if (loadingCleaner) {
    return (
      <div className="min-h-screen flex flex-col bg-app">
        <Header />
        <main className="flex-1 py-8 px-4 md:px-6">
          <div className="max-w-5xl mx-auto">
            <SkeletonList items={6} />
          </div>
        </main>
      </div>
    );
  }

  if (!cleanerId || !cleanerData?.cleaner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">Invalid Booking</h2>
            <p className="text-gray-600 mb-4">Please select a cleaner first</p>
            <Button onClick={() => router.push('/search')}>Find Cleaners</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-app">
      <Header />
      <main className="flex-1 py-8 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <a href={cleanerId ? `/cleaner/${cleanerId}` : '/search'} className="text-sm font-medium text-gray-600 hover:text-gray-900 mb-2 inline-block">← {cleanerId ? 'Back to cleaner' : 'Find a cleaner'}</a>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Book a cleaner</h1>
            <p className="text-gray-600 mt-1">Choose service, date, address, and confirm. Payment is held until you approve.</p>
          </div>

          <BookingStepper
            currentStep={step}
            steps={[
              { label: 'Service' },
              { label: 'Date & Time' },
              { label: 'Address' },
              { label: 'Confirm' },
            ]}
          />

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="rounded-2xl border-gray-200 overflow-hidden">
                <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, var(--brand-blue), var(--brand-aqua))' }} aria-hidden />
                <CardHeader>
                  <CardTitle>
                    {step === 1 && 'Choose Your Service'}
                    {step === 2 && 'Select Date & Time'}
                    {step === 3 && 'Enter Your Address'}
                    {step === 4 && 'Review & Confirm'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait" initial={false}>
                    {/* Step 1: Service Selection */}
                    {step === 1 && (
                      <BookingStepContent key={1} step={1} direction={stepDirection.current}>
                        <ServiceSelection
                          value={bookingData}
                          onChange={(data) => setBookingData({ ...bookingData, ...data })}
                        />
                      </BookingStepContent>
                    )}

                    {/* Step 2: Date & Time */}
                    {step === 2 && (
                      <BookingStepContent key={2} step={2} direction={stepDirection.current}>
                        <DateTimePicker
                          cleanerId={cleanerId}
                          onSelect={(date, time) =>
                            setBookingData({
                              ...bookingData,
                              scheduled_date: date,
                              scheduled_time: time,
                            })
                          }
                        />
                        {step === 2 && !holidayLoading && selectedHoliday && (
                          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                            <div className="font-semibold">Federal Holiday</div>
                            <div>
                              Cleaner availability may be limited today. Some cleaners may charge higher holiday
                              rates. All pricing is shown upfront.
                            </div>
                            {selectedHoliday.support_limited && (
                              <div className="mt-2">
                                Holiday support hours may be limited. Disputes are reviewed the next business day.
                              </div>
                            )}
                            <div className="mt-2">
                              PureTask does not guarantee cleaner availability on federal holidays.
                            </div>
                          </div>
                        )}
                      </BookingStepContent>
                    )}

                    {/* Step 3: Address */}
                    {step === 3 && (
                      <BookingStepContent key={3} step={3} direction={stepDirection.current}>
                        <div className="space-y-4">
                          <AddressAutocompletePlaceholder
                            label="Street Address"
                            value={bookingData.address}
                            onChange={(address) =>
                              setBookingData({ ...bookingData, address })
                            }
                            placeholder="123 Main St"
                            required
                          />
                          <Input
                            label="Apt, Suite, etc. (Optional)"
                            type="text"
                            inputMode="text"
                            autoComplete="address-line2"
                            value={bookingData.address_line_2}
                            onChange={(e) =>
                              setBookingData({ ...bookingData, address_line_2: e.target.value })
                            }
                            placeholder="Apt 4B"
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              label="City"
                              type="text"
                              inputMode="text"
                              autoComplete="address-level2"
                              value={bookingData.city}
                              onChange={(e) =>
                                setBookingData({ ...bookingData, city: e.target.value })
                              }
                              required
                            />
                            <Input
                              label="State"
                              type="text"
                              inputMode="text"
                              autoComplete="address-level1"
                              value={bookingData.state}
                              onChange={(e) =>
                                setBookingData({ ...bookingData, state: e.target.value })
                              }
                              placeholder="NY"
                              required
                            />
                          </div>
                          <Input
                            label="ZIP Code"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="postal-code"
                            value={bookingData.zip_code}
                            onChange={(e) =>
                              setBookingData({ ...bookingData, zip_code: e.target.value })
                            }
                            placeholder="10001"
                            required
                          />
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Special Instructions (Optional)
                            </label>
                            <textarea
                              value={bookingData.special_instructions}
                              onChange={(e) =>
                                setBookingData({
                                  ...bookingData,
                                  special_instructions: e.target.value,
                                })
                              }
                              placeholder="Gate code, parking instructions, pet info, etc."
                              rows={4}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[44px] text-base"
                              autoComplete="off"
                            />
                          </div>
                        </div>
                      </BookingStepContent>
                    )}

                    {/* Step 4: Review */}
                    {step === 4 && (
                      <BookingStepContent key={4} step={4} direction={stepDirection.current}>
                        <div className="space-y-6">
                          {!holidayLoading && selectedHoliday && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                              <div className="font-semibold">Holiday booking notice</div>
                              <div>
                                You’re booking on a federal holiday. Availability may be limited and rates may
                                be higher. All pricing is shown upfront.
                              </div>
                              {selectedHoliday.support_limited && (
                                <div className="mt-2">
                                  Holiday support hours may be limited. Disputes are reviewed the next business
                                  day.
                                </div>
                              )}
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-3">Booking Summary</h3>
                            <div className="p-4 rounded-xl space-y-2 text-sm" style={{ backgroundColor: 'var(--brand-cloud)' }}>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Service:</span>
                                <span className="font-medium capitalize">
                                  {bookingData.service_type.replace('_', ' ')}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Duration:</span>
                                <span className="font-medium">
                                  {bookingData.duration_hours} hours
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Date & Time:</span>
                                <span className="font-medium">
                                  {bookingData.scheduled_date} at {bookingData.scheduled_time}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Address:</span>
                                <span className="font-medium text-right">
                                  {bookingData.address}
                                  {bookingData.address_line_2 && `, ${bookingData.address_line_2}`}
                                  <br />
                                  {bookingData.city}, {bookingData.state} {bookingData.zip_code}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </BookingStepContent>
                    )}

                  </AnimatePresence>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between mt-8">
                    <div className="flex gap-2">
                      {step > 1 && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            stepDirection.current = -1;
                            setStep(step - 1);
                          }}
                        >
                          Back
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        onClick={() => {
                          saveDraft(bookingData);
                          showToast('Draft saved', 'success');
                        }}
                        isLoading={isSavingDraft}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Save Draft
                      </Button>
                    </div>
                    {step < 4 ? (
                      <Button
                        variant="primary"
                        onClick={() => {
                          stepDirection.current = 1;
                          setStep(step + 1);
                        }}
                        className="ml-auto"
                      >
                        Next
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={handleSubmit}
                        isLoading={isCreating}
                        className="ml-auto"
                      >
                        {isCreating ? 'Creating Booking...' : 'Confirm & Book'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24 rounded-2xl border-gray-200 overflow-hidden">
                <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, var(--brand-blue), var(--brand-aqua))' }} aria-hidden />
                <CardHeader>
                  <CardTitle>Booking summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cleaner Info */}
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl">
                      {cleaner?.name?.[0] ?? '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{cleaner?.name ?? 'Cleaner'}</p>
                      <p className="text-sm text-gray-600">
                        ⭐ {cleaner?.rating ?? 0} ({cleaner?.reviews_count ?? 0} reviews)
                      </p>
                    </div>
                  </div>

                  {/* Reliability score */}
                  {reliabilityData?.reliability && (
                    <div className="pb-4 border-b">
                      <ReliabilityScoreCard score={reliabilityData.reliability} compact />
                    </div>
                  )}

                  {/* Enhanced Real-Time Price Breakdown */}
                  <div className="space-y-2">
                    {priceBreakdown ? (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Base Rate</span>
                          <span className="font-medium">
                            {formatCurrency(priceBreakdown.baseRate)}/hr
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Duration</span>
                          <span className="font-medium">{bookingData.duration_hours} hours</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Base Cost</span>
                          <span className="font-medium">
                            {formatCurrency(priceBreakdown.baseCost)}
                          </span>
                        </div>
                        {bookingData.add_ons.length > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Add-ons ({bookingData.add_ons.length})</span>
                            <span className="font-medium">
                              {formatCurrency(priceBreakdown.addOnCost)}
                            </span>
                          </div>
                        )}
                        {selectedHoliday && priceBreakdown.holidayRate > 0 && (
                          <div className="flex justify-between text-sm text-amber-600">
                            <span>Holiday Rate ({((priceBreakdown.holidayMultiplier - 1) * 100).toFixed(0)}%)</span>
                            <span className="font-medium">
                              +{formatCurrency(priceBreakdown.holidayRate)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm pt-2 border-t">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-medium">
                            {formatCurrency(priceBreakdown.subtotal)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Platform Fee (10%)</span>
                          <span>{formatCurrency(priceBreakdown.platformFee)}</span>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-900">Total</span>
                            <span className="text-xl font-bold text-blue-600">
                              {formatCurrency(priceBreakdown.total)}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Base Rate</span>
                          <span className="font-medium">
                            {formatCurrency(cleaner?.price_per_hour ?? 0)}/hr
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Duration</span>
                          <span className="font-medium">{bookingData.duration_hours} hours</span>
                        </div>
                        {priceEstimate && (
                          <div className="pt-2 border-t">
                            <div className="flex justify-between">
                              <span className="font-semibold text-gray-900">Total</span>
                              <span className="text-xl font-bold text-blue-600">
                                {formatCurrency(priceEstimate.price)}
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {estimating && (
                      <div className="text-xs text-gray-500 text-center">Calculating...</div>
                    )}
                  </div>

                  {/* Trust Badges */}
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>✓</span>
                      <span>Satisfaction Guaranteed</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>✓</span>
                      <span>Easy Cancellation</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>✓</span>
                      <span>Secure Payment</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function BookingPageFallback() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <SkeletonList items={6} />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<BookingPageFallback />}>
      <BookingPageContent />
    </Suspense>
  );
}

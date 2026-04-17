// src/test-helpers/mocks/handlers.ts
// MSW (Mock Service Worker) API handlers for testing

import { http, HttpResponse } from 'msw';

const BASE_URL = 'http://localhost:4000';

export const handlers = [
  // Auth endpoints
  http.post(`${BASE_URL}/auth/register`, () => {
    return HttpResponse.json(
      {
        token: 'mock-jwt-token',
        user: {
          id: '123',
          email: 'test@test.com',
          role: 'client',
          created_at: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  }),

  http.post(`${BASE_URL}/auth/login`, () => {
    return HttpResponse.json({
      token: 'mock-jwt-token',
      user: {
        id: '123',
        email: 'test@test.com',
        role: 'client',
        created_at: new Date().toISOString(),
      },
    });
  }),

  http.get(`${BASE_URL}/auth/me`, () => {
    return HttpResponse.json({
      user: {
        id: '123',
        email: 'test@test.com',
        role: 'client',
        created_at: new Date().toISOString(),
      },
    });
  }),

  // Cleaners endpoint
  http.get(`${BASE_URL}/cleaner`, () => {
    return HttpResponse.json({
      cleaners: [
        {
          id: '1',
          user_id: '1',
          name: 'Test Cleaner',
          avg_rating: 4.5,
          total_jobs_completed: 100,
          hourly_rate_credits: 50,
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
      },
    });
  }),

  // Jobs/Bookings endpoint
  http.get(`${BASE_URL}/jobs`, () => {
    return HttpResponse.json({
      jobs: [
        {
          id: '1',
          client_id: '123',
          cleaner_id: '1',
          status: 'confirmed',
          scheduled_date: new Date().toISOString(),
          total_credits: 100,
        },
      ],
    });
  }),

  // Messages endpoint
  http.get(`${BASE_URL}/messages`, () => {
    return HttpResponse.json({
      conversations: [],
    });
  }),

  // Credits balance (Trust API shape)
  http.get(`${BASE_URL}/api/credits/balance`, () => {
    return HttpResponse.json({
      balance: 500,
      currency: 'USD',
      lastUpdatedISO: new Date().toISOString(),
    });
  }),

  // Credits ledger (Trust API shape) — used for ledger lifecycle tests
  http.get(`${BASE_URL}/api/credits/ledger`, () => {
    return HttpResponse.json({
      entries: [
        {
          id: 'ledger-1',
          createdAtISO: new Date(Date.now() - 86400000).toISOString(),
          type: 'deposit',
          amount: 1000,
          currency: 'USD',
          description: 'Purchased credits',
          status: 'posted',
        },
        {
          id: 'ledger-2',
          createdAtISO: new Date().toISOString(),
          type: 'spend',
          amount: -500,
          currency: 'USD',
          description: 'Job booking (escrow)',
          status: 'posted',
          relatedBookingId: 'booking-1',
        },
      ],
    });
  }),
];

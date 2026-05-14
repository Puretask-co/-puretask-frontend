/**
 * Centralized TanStack Query key factory.
 *
 * Each namespace exposes:
 *   - `all`: the root key, used for namespace-wide invalidation
 *   - specific entries that compose off `all` so partial invalidations cascade
 *
 * Pattern from https://tkdodo.eu/blog/effective-react-query-keys.
 * Replacing ad-hoc string keys across hooks ensures invalidations cannot drift.
 */

export const qk = {
  // -- bookings (client-side) --
  bookings: {
    all: ['bookings'] as const,
    list: (status?: string) =>
      (status === undefined ? (['bookings'] as const) : (['bookings', status] as const)),
    detail: (id: string) => ['booking', id] as const,
  },

  // -- jobs --
  jobDetails: (id: string) => ['job-details', id] as const,
  jobs: {
    all: ['jobs'] as const,
  },

  // -- conversations & messages --
  conversations: {
    all: ['conversations'] as const,
    detail: (userId: string) => ['conversation', userId] as const,
  },
  messages: {
    all: ['messages'] as const,
    list: (conversationId: string) => ['messages', conversationId] as const,
  },

  // -- cleaner namespace --
  cleaner: {
    all: ['cleaner'] as const,
    earnings: () => ['cleaner', 'earnings'] as const,
    payouts: (params?: unknown) =>
      (params === undefined
        ? (['cleaner', 'payouts'] as const)
        : (['cleaner', 'payouts', params] as const)),
    availableJobs: () => ['cleaner', 'available-jobs'] as const,
    assignedJobs: () => ['cleaner', 'assigned-jobs'] as const,
    availability: () => ['cleaner', 'availability'] as const,
    schedule: (params?: unknown) =>
      (params === undefined
        ? (['cleaner', 'schedule'] as const)
        : (['cleaner', 'schedule', params] as const)),
    timeOff: () => ['cleaner', 'time-off'] as const,
    goals: () => ['cleaner', 'goals'] as const,
  },

  // -- client namespace --
  client: {
    all: ['client'] as const,
    dashboardInsights: () => ['client', 'dashboard', 'insights'] as const,
    recommendations: () => ['client', 'recommendations'] as const,
    draftBooking: () => ['client', 'draft-booking'] as const,
    jobLiveStatus: (jobId: string) =>
      ['client', 'jobs', jobId, 'live-status'] as const,
    favoritesRecommendations: () =>
      ['client', 'favorites', 'recommendations'] as const,
    favoritesInsights: () => ['client', 'favorites', 'insights'] as const,
    recurringBookingSuggestions: (id: string) =>
      ['client', 'recurring-bookings', id, 'suggestions'] as const,
    preferences: () => ['client', 'preferences'] as const,
    reviewsInsights: () => ['client', 'reviews', 'insights'] as const,
  },
  recurringBookings: ['recurring-bookings'] as const,

  // -- credits & billing --
  credits: {
    all: ['credits'] as const,
    balance: () => ['credits', 'balance'] as const,
    ledger: (filters?: unknown) =>
      (filters === undefined
        ? (['credits', 'ledger'] as const)
        : (['credits', 'ledger', filters] as const)),
  },
  billing: {
    invoices: () => ['billing', 'invoices'] as const,
    invoice: (id: string) => ['billing', 'invoice', id] as const,
  },

  // -- notifications --
  notifications: {
    all: ['notifications'] as const,
    list: () => ['notifications'] as const,
    unreadCount: () => ['notifications', 'unread-count'] as const,
  },

  // -- appointments (trust) --
  appointments: {
    live: (bookingId: string) => ['appointments', 'live', bookingId] as const,
  },

  // -- profile --
  profile: (userId?: string) =>
    (userId === undefined ? (['profile'] as const) : (['profile', userId] as const)),

  // -- cleaner onboarding --
  onboardingProgress: ['onboarding-progress'] as const,

  // -- admin --
  admin: {
    all: ['admin'] as const,
    stats: () => ['admin', 'stats'] as const,
    dailyStats: (days?: unknown) =>
      (days === undefined
        ? (['admin', 'daily-stats'] as const)
        : (['admin', 'daily-stats', days] as const)),
    revenue: (period?: unknown) =>
      (period === undefined
        ? (['admin', 'revenue'] as const)
        : (['admin', 'revenue', period] as const)),
    users: (params?: unknown) =>
      (params === undefined
        ? (['admin', 'users'] as const)
        : (['admin', 'users', params] as const)),
    user: (id: string) => ['admin', 'user', id] as const,
    bookings: (params?: unknown) =>
      (params === undefined
        ? (['admin', 'bookings'] as const)
        : (['admin', 'bookings', params] as const)),
    booking: (id: string) => ['admin', 'booking', id] as const,
    transactions: (params?: unknown) =>
      (params === undefined
        ? (['admin', 'transactions'] as const)
        : (['admin', 'transactions', params] as const)),
    financialReport: (startDate?: string, endDate?: string) =>
      ['admin', 'financial-report', startDate, endDate] as const,
    settings: () => ['admin', 'settings'] as const,
    verifications: {
      all: ['admin', 'verifications'] as const,
      pending: ['admin', 'verifications', 'pending'] as const,
    },
  },
} as const;

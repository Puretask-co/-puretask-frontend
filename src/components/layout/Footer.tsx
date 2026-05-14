'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const footerLinkClass =
  'text-gray-400 hover:text-white transition-colors duration-200 inline-block py-1 hover:translate-x-0.5';

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn('bg-gray-900 text-gray-300 mt-auto relative', className)}>
      <div
        className="h-1 w-full"
        style={{ background: 'linear-gradient(90deg, var(--brand-blue), var(--brand-aqua))' }}
        aria-hidden
      />
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Top: logo + tagline + primary actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-10 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, var(--brand-blue), var(--brand-aqua))' }}
            >
              <span className="text-white font-bold text-lg">PT</span>
            </div>
            <div>
              <h2 className="text-white font-bold text-xl">PureTask</h2>
              <p className="text-sm text-gray-400">Professional cleaning, protected payments.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/search" className={cn(footerLinkClass, 'font-medium')}>
              Find a cleaner
            </Link>
            <Link href="/auth/register" className={cn(footerLinkClass, 'font-medium')}>
              Become a cleaner
            </Link>
            <Link href="/help" className={cn(footerLinkClass, 'font-medium')}>
              Help
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pt-10">
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-1">
              <li><Link href="/" className={footerLinkClass}>Home</Link></li>
              <li><Link href="/help" className={footerLinkClass}>Help Center</Link></li>
              <li><Link href="/terms" className={footerLinkClass}>Terms of Service</Link></li>
              <li><Link href="/privacy" className={footerLinkClass}>Privacy Policy</Link></li>
              <li><Link href="/cookies" className={footerLinkClass}>Cookie Policy</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">For Clients</h3>
            <ul className="space-y-1">
              <li><Link href="/search" className={footerLinkClass}>Find a Cleaner</Link></li>
              <li><Link href="/booking" className={footerLinkClass}>Book Now</Link></li>
              <li><Link href="/client/dashboard" className={footerLinkClass}>Dashboard</Link></li>
              <li><Link href="/client/bookings" className={footerLinkClass}>My Bookings</Link></li>
              <li><Link href="/client/credits-trust" className={footerLinkClass}>Credits</Link></li>
              <li><Link href="/client/billing-trust" className={footerLinkClass}>Invoices</Link></li>
              <li><Link href="/client/settings" className={footerLinkClass}>Settings</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">For Cleaners</h3>
            <ul className="space-y-1">
              <li><Link href="/cleaner/onboarding" className={footerLinkClass}>Become a Cleaner</Link></li>
              <li><Link href="/cleaner/dashboard" className={footerLinkClass}>Dashboard</Link></li>
              <li><Link href="/cleaner/calendar" className={footerLinkClass}>Calendar</Link></li>
              <li><Link href="/cleaner/team" className={footerLinkClass}>Team</Link></li>
              <li><Link href="/cleaner/reviews" className={footerLinkClass}>My Reviews</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Account</h3>
            <ul className="space-y-1">
              <li><Link href="/auth/login" className={footerLinkClass}>Log in</Link></li>
              <li><Link href="/auth/register" className={footerLinkClass}>Sign up</Link></li>
              <li><Link href="/auth/forgot-password" className={footerLinkClass}>Forgot password</Link></li>
              <li><Link href="/messages" className={footerLinkClass}>Messages</Link></li>
              <li><Link href="/notifications" className={footerLinkClass}>Notifications</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">More</h3>
            <ul className="space-y-1">
              <li><Link href="/cleaner/ai-assistant" className={footerLinkClass}>AI Assistant</Link></li>
              <li><Link href="/cleaner/progress" className={footerLinkClass}>Progress</Link></li>
              <li><Link href="/referral" className={footerLinkClass}>Referral</Link></li>
            </ul>
          </div>
        </div>

        {/* Admin / Gamification – compact row */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span className="text-gray-500 uppercase tracking-wider">Also:</span>
            <Link href="/admin/dashboard" className={footerLinkClass}>Admin</Link>
            <Link href="/admin/gamification" className={footerLinkClass}>Gamification</Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-400">
            © {currentYear} PureTask. All rights reserved.
          </div>
          <div className="flex gap-6">
            <a href="#" className={footerLinkClass} aria-label="Facebook">Facebook</a>
            <a href="#" className={footerLinkClass} aria-label="Twitter">Twitter</a>
            <a href="#" className={footerLinkClass} aria-label="Instagram">Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

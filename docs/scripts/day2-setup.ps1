# ============================================
# PURETASK - DAY 2: LAYOUTS & NAVIGATION
# ============================================

Write-Host "🚀 Starting PureTask Frontend Day 2 Setup..." -ForegroundColor Cyan
Write-Host ""

# Navigate to frontend directory
$frontendPath = "C:\Users\onlyw\Documents\GitHub\puretask-frontend"
Set-Location $frontendPath
Write-Host "✅ In puretask-frontend directory" -ForegroundColor Green

# Create layout and navigation folders
Write-Host "📁 Creating folders..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "src\components\layout" | Out-Null
New-Item -ItemType Directory -Force -Path "src\components\navigation" | Out-Null
Write-Host "✅ Folders created" -ForegroundColor Green

# Install react-router-dom if not installed
Write-Host "📦 Installing react-router-dom..." -ForegroundColor Yellow
npm install --silent react-router-dom
Write-Host "✅ Package installed" -ForegroundColor Green

Write-Host ""
Write-Host "🎨 Creating components..." -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. HEADER COMPONENT
# ============================================
Write-Host "[1/8] Creating Header.tsx..." -ForegroundColor Yellow

$headerContent = @'
'use client';

import React, { useState } from 'react';
import { Bell, Search, Menu, X, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

interface HeaderProps {
  onMenuClick?: () => void;
  className?: string;
}

export function Header({ onMenuClick, className }: HeaderProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [notifications] = useState(3);

  return (
    <header className={cn('bg-white border-b border-gray-200 sticky top-0 z-50', className)}>
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side - Logo & Menu */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onMenuClick} className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PT</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">PureTask</h1>
          </div>
        </div>

        {/* Center - Search (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search bookings, cleaners, clients..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setShowSearch(!showSearch)}>
            <Search className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            {notifications > 0 && (
              <Badge variant="error" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {notifications}
              </Badge>
            )}
          </Button>

          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200">
            <Avatar size="sm" fallback="NA" />
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">Nathan Admin</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      {showSearch && (
        <div className="px-4 pb-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      )}
    </header>
  );
}
'@

Set-Content -Path "src\components\layout\Header.tsx" -Value $headerContent
Write-Host "✅ Header.tsx created" -ForegroundColor Green

# ============================================
# 2. SIDEBAR COMPONENT
# ============================================
Write-Host "[2/8] Creating Sidebar.tsx..." -ForegroundColor Yellow

$sidebarContent = @'
'use client';

import React from 'react';
import { Home, Calendar, Users, UserCheck, DollarSign, BarChart3, Settings, LogOut, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
  active?: boolean;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Dashboard', href: '/dashboard', active: true },
  { icon: Calendar, label: 'Bookings', href: '/bookings', badge: 5 },
  { icon: UserCheck, label: 'Cleaners', href: '/cleaners' },
  { icon: Users, label: 'Clients', href: '/clients' },
  { icon: DollarSign, label: 'Payments', href: '/payments' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export function Sidebar({ isOpen = true, onClose, className }: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Close button (Mobile) */}
          <div className="flex items-center justify-between p-4 lg:hidden">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  item.active
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </a>
            ))}
          </nav>

          {/* Bottom Section */}
          <div className="p-3 border-t border-gray-200">
            <Button variant="ghost" className="w-full justify-start text-gray-700">
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
'@

Set-Content -Path "src\components\layout\Sidebar.tsx" -Value $sidebarContent
Write-Host "✅ Sidebar.tsx created" -ForegroundColor Green

# ============================================
# 3. FOOTER COMPONENT
# ============================================
Write-Host "[3/8] Creating Footer.tsx..." -ForegroundColor Yellow

$footerContent = @'
import React from 'react';
import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn('bg-white border-t border-gray-200 mt-auto', className)}>
      <div className="px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <a href="/terms" className="hover:text-blue-600 transition-colors">Terms</a>
            <a href="/privacy" className="hover:text-blue-600 transition-colors">Privacy</a>
            <a href="/help" className="hover:text-blue-600 transition-colors">Help</a>
            <a href="/contact" className="hover:text-blue-600 transition-colors">Contact</a>
          </div>
          
          <div className="text-sm text-gray-500">
            © {currentYear} PureTask. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
'@

Set-Content -Path "src\components\layout\Footer.tsx" -Value $footerContent
Write-Host "✅ Footer.tsx created" -ForegroundColor Green

# ============================================
# 4. NAVLINK COMPONENT
# ============================================
Write-Host "[4/8] Creating NavLink.tsx..." -ForegroundColor Yellow

$navlinkContent = @'
import React from 'react';
import { cn } from '@/lib/utils';

interface NavLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  active?: boolean;
  children: React.ReactNode;
}

export function NavLink({ active, children, className, ...props }: NavLinkProps) {
  return (
    <a
      className={cn(
        'inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors',
        active
          ? 'bg-blue-50 text-blue-600'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
        className
      )}
      {...props}
    >
      {children}
    </a>
  );
}
'@

Set-Content -Path "src\components\navigation\NavLink.tsx" -Value $navlinkContent
Write-Host "✅ NavLink.tsx created" -ForegroundColor Green

# ============================================
# 5. BREADCRUMBS COMPONENT
# ============================================
Write-Host "[5/8] Creating Breadcrumbs.tsx..." -ForegroundColor Yellow

$breadcrumbsContent = @'
import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav className={cn('flex items-center space-x-2 text-sm', className)}>
      <a href="/dashboard" className="text-gray-500 hover:text-gray-700 transition-colors">
        <Home className="h-4 w-4" />
      </a>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          {item.href && index < items.length - 1 ? (
            <a
              href={item.href}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
'@

Set-Content -Path "src\components\navigation\Breadcrumbs.tsx" -Value $breadcrumbsContent
Write-Host "✅ Breadcrumbs.tsx created" -ForegroundColor Green

# ============================================
# 6. DASHBOARD LAYOUT COMPONENT
# ============================================
Write-Host "[6/8] Creating DashboardLayout.tsx..." -ForegroundColor Yellow

$dashboardLayoutContent = @'
'use client';

import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className={cn('flex-1 p-6', className)}>
          {children}
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
'@

Set-Content -Path "src\components\layout\DashboardLayout.tsx" -Value $dashboardLayoutContent
Write-Host "✅ DashboardLayout.tsx created" -ForegroundColor Green

# ============================================
# 7. STATS CARD COMPONENT
# ============================================
Write-Host "[7/8] Creating StatsCard.tsx..." -ForegroundColor Yellow

$statsCardContent = @'
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, className }: StatsCardProps) {
  return (
    <Card className={cn('hover:shadow-lg transition-shadow', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            {trend && (
              <p className={cn(
                'text-sm font-medium mt-2',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                <span className="text-gray-500 ml-1">vs last month</span>
              </p>
            )}
          </div>
          <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
'@

Set-Content -Path "src\components\features\StatsCard.tsx" -Value $statsCardContent
Write-Host "✅ StatsCard.tsx created" -ForegroundColor Green

# ============================================
# 8. DASHBOARD PAGE
# ============================================
Write-Host "[8/8] Creating Dashboard page..." -ForegroundColor Yellow

$dashboardPageContent = @'
'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { StatsCard } from '@/components/features/StatsCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Calendar, Users, DollarSign, TrendingUp, Plus } from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    { title: 'Total Bookings', value: '248', icon: Calendar, trend: { value: 12, isPositive: true } },
    { title: 'Active Cleaners', value: '45', icon: Users, trend: { value: 8, isPositive: true } },
    { title: 'Revenue', value: '$12,450', icon: DollarSign, trend: { value: 23, isPositive: true } },
    { title: 'Growth', value: '+18%', icon: TrendingUp, trend: { value: 5, isPositive: true } },
  ];

  const recentBookings = [
    { id: 1, client: 'Sarah Johnson', cleaner: 'Maria Garcia', date: 'Today, 2:00 PM', status: 'confirmed' },
    { id: 2, client: 'Mike Chen', cleaner: 'Lisa Brown', date: 'Today, 4:30 PM', status: 'in-progress' },
    { id: 3, client: 'Emma Wilson', cleaner: 'John Smith', date: 'Tomorrow, 10:00 AM', status: 'pending' },
    { id: 4, client: 'David Lee', cleaner: 'Ana Martinez', date: 'Tomorrow, 3:00 PM', status: 'confirmed' },
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      confirmed: 'success',
      'in-progress': 'info',
      pending: 'warning',
      completed: 'default',
    } as const;
    return <Badge variant={variants[status as keyof typeof variants] || 'default'}>{status}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <Breadcrumbs items={[{ label: 'Dashboard' }]} className="mt-2" />
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{booking.client}</p>
                    <p className="text-sm text-gray-500">Cleaner: {booking.cleaner}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-gray-600">{booking.date}</p>
                    {getStatusBadge(booking.status)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Button variant="outline">View All Bookings</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
'@

Set-Content -Path "src\app\dashboard\page.tsx" -Value $dashboardPageContent
Write-Host "✅ Dashboard page created" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 DAY 2 SETUP COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "✨ What you just created:" -ForegroundColor Cyan
Write-Host "  • Header with search, notifications, profile" -ForegroundColor White
Write-Host "  • Sidebar with navigation menu" -ForegroundColor White
Write-Host "  • Footer with links" -ForegroundColor White
Write-Host "  • NavLink component" -ForegroundColor White
Write-Host "  • Breadcrumbs component" -ForegroundColor White
Write-Host "  • DashboardLayout wrapper" -ForegroundColor White
Write-Host "  • StatsCard component" -ForegroundColor White
Write-Host "  • Complete Dashboard page" -ForegroundColor White
Write-Host ""
Write-Host "🌐 To see it:" -ForegroundColor Yellow
Write-Host "  1. Server should still be running on http://localhost:3000" -ForegroundColor White
Write-Host "  2. Navigate to: http://localhost:3000/dashboard" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Ready!" -ForegroundColor Green



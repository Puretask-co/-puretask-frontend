# ============================================
# PURETASK - DAY 3: ADVANCED UI COMPONENTS
# ============================================

Write-Host "🚀 Starting PureTask Frontend Day 3 Setup..." -ForegroundColor Cyan
Write-Host ""

# Navigate to frontend directory
$frontendPath = "C:\Users\onlyw\Documents\GitHub\puretask-frontend"
Set-Location $frontendPath
Write-Host "✅ In puretask-frontend directory" -ForegroundColor Green

Write-Host ""
Write-Host "🎨 Creating advanced components..." -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. DROPDOWN/SELECT COMPONENT
# ============================================
Write-Host "[1/8] Creating Dropdown.tsx..." -ForegroundColor Yellow

$dropdownContent = @'
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function Dropdown({ options, value, onChange, placeholder = 'Select...', label, className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
      >
        <span className={cn('text-sm', !selectedOption && 'text-gray-400')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', isOpen && 'transform rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange?.(option.value);
                setIsOpen(false);
              }}
              className={cn(
                'w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors',
                option.value === value && 'bg-blue-50 text-blue-600'
              )}
            >
              <span>{option.label}</span>
              {option.value === value && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
'@

Set-Content -Path "src\components\ui\Dropdown.tsx" -Value $dropdownContent
Write-Host "✅ Dropdown.tsx created" -ForegroundColor Green

# ============================================
# 2. TABS COMPONENT
# ============================================
Write-Host "[2/8] Creating Tabs.tsx..." -ForegroundColor Yellow

$tabsContent = @'
'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  label: string;
  value: string;
  content: React.ReactNode;
  badge?: number;
}

interface TabsProps {
  tabs: Tab[];
  defaultValue?: string;
  className?: string;
}

export function Tabs({ tabs, defaultValue, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue || tabs[0]?.value);

  const activeTabContent = tabs.find(tab => tab.value === activeTab)?.content;

  return (
    <div className={cn('w-full', className)}>
      {/* Tab Headers */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'py-4 px-1 border-b-2 font-medium text-sm transition-colors relative',
                activeTab === tab.value
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="ml-2 bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="py-4">
        {activeTabContent}
      </div>
    </div>
  );
}
'@

Set-Content -Path "src\components\ui\Tabs.tsx" -Value $tabsContent
Write-Host "✅ Tabs.tsx created" -ForegroundColor Green

# ============================================
# 3. TABLE COMPONENT
# ============================================
Write-Host "[3/8] Creating Table.tsx..." -ForegroundColor Yellow

$tableContent = @'
import React from 'react';
import { cn } from '@/lib/utils';

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

export function Table({ className, ...props }: TableProps) {
  return (
    <div className="w-full overflow-auto">
      <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  );
}

interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export function TableHeader({ className, ...props }: TableHeaderProps) {
  return <thead className={cn('[&_tr]:border-b bg-gray-50', className)} {...props} />;
}

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export function TableBody({ className, ...props }: TableBodyProps) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
}

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {}

export function TableRow({ className, ...props }: TableRowProps) {
  return (
    <tr
      className={cn('border-b transition-colors hover:bg-gray-50', className)}
      {...props}
    />
  );
}

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}

export function TableHead({ className, ...props }: TableHeadProps) {
  return (
    <th
      className={cn(
        'h-12 px-4 text-left align-middle font-medium text-gray-500 [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  );
}

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

export function TableCell({ className, ...props }: TableCellProps) {
  return (
    <td
      className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
      {...props}
    />
  );
}
'@

Set-Content -Path "src\components\ui\Table.tsx" -Value $tableContent
Write-Host "✅ Table.tsx created" -ForegroundColor Green

# ============================================
# 4. TOAST/NOTIFICATION COMPONENT
# ============================================
Write-Host "[4/8] Creating Toast.tsx..." -ForegroundColor Yellow

$toastContent = @'
'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  };

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  };

  const Icon = icons[toast.type];

  return (
    <div className={cn('flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-slide-in', styles[toast.type])}>
      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{toast.title}</p>
        {toast.description && <p className="text-sm mt-1 opacity-90">{toast.description}</p>}
      </div>
      <button onClick={onClose} className="flex-shrink-0 hover:opacity-70 transition-opacity">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
'@

Set-Content -Path "src\components\ui\Toast.tsx" -Value $toastContent
Write-Host "✅ Toast.tsx created" -ForegroundColor Green

# ============================================
# 5. PROGRESS COMPONENT
# ============================================
Write-Host "[5/8] Creating Progress.tsx..." -ForegroundColor Yellow

$progressContent = @'
import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  className?: string;
}

export function Progress({ value, max = 100, size = 'md', variant = 'default', showLabel = false, className }: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const variants = {
    default: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600',
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-gray-700">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', sizes[size])}>
        <div
          className={cn('h-full transition-all duration-300 ease-in-out', variants[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
'@

Set-Content -Path "src\components\ui\Progress.tsx" -Value $progressContent
Write-Host "✅ Progress.tsx created" -ForegroundColor Green

# ============================================
# 6. TOGGLE/SWITCH COMPONENT
# ============================================
Write-Host "[6/8] Creating Toggle.tsx..." -ForegroundColor Yellow

$toggleContent = @'
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Toggle({ checked = false, onChange, label, disabled = false, size = 'md', className }: ToggleProps) {
  const sizes = {
    sm: 'w-8 h-4',
    md: 'w-11 h-6',
    lg: 'w-14 h-7',
  };

  const thumbSizes = {
    sm: 'h-3 w-3',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const translateSizes = {
    sm: 'translate-x-4',
    md: 'translate-x-5',
    lg: 'translate-x-7',
  };

  return (
    <label className={cn('flex items-center gap-3 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange?.(!checked)}
        className={cn(
          'relative inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2',
          sizes[size],
          checked ? 'bg-blue-600' : 'bg-gray-300'
        )}
        disabled={disabled}
      >
        <span
          className={cn(
            'inline-block bg-white rounded-full shadow-sm transform transition-transform',
            thumbSizes[size],
            checked ? translateSizes[size] : 'translate-x-0.5'
          )}
        />
      </button>
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
    </label>
  );
}
'@

Set-Content -Path "src\components\ui\Toggle.tsx" -Value $toggleContent
Write-Host "✅ Toggle.tsx created" -ForegroundColor Green

# ============================================
# 7. TOOLTIP COMPONENT
# ============================================
Write-Host "[7/8] Creating Tooltip.tsx..." -ForegroundColor Yellow

$tooltipContent = @'
'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({ content, children, position = 'top', className }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap',
            positions[position],
            className
          )}
        >
          {content}
          <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45" 
            style={{
              [position === 'top' ? 'bottom' : position === 'bottom' ? 'top' : position === 'left' ? 'right' : 'left']: '-4px',
              [position === 'top' || position === 'bottom' ? 'left' : 'top']: '50%',
              transform: position === 'top' || position === 'bottom' ? 'translateX(-50%) rotate(45deg)' : 'translateY(-50%) rotate(45deg)'
            }}
          />
        </div>
      )}
    </div>
  );
}
'@

Set-Content -Path "src\components\ui\Tooltip.tsx" -Value $tooltipContent
Write-Host "✅ Tooltip.tsx created" -ForegroundColor Green

# ============================================
# 8. COMPONENTS SHOWCASE PAGE
# ============================================
Write-Host "[8/8] Creating Day 3 showcase page..." -ForegroundColor Yellow

$showcaseContent = @'
'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { Tabs } from '@/components/ui/Tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { Progress } from '@/components/ui/Progress';
import { Toggle } from '@/components/ui/Toggle';
import { Tooltip } from '@/components/ui/Tooltip';
import { Badge } from '@/components/ui/Badge';

function ComponentsShowcase() {
  const [selectedCity, setSelectedCity] = useState('');
  const [progress, setProgress] = useState(45);
  const [toggle1, setToggle1] = useState(false);
  const [toggle2, setToggle2] = useState(true);
  const { addToast } = useToast();

  const cityOptions = [
    { label: 'New York', value: 'ny' },
    { label: 'Los Angeles', value: 'la' },
    { label: 'Chicago', value: 'chi' },
    { label: 'Houston', value: 'hou' },
    { label: 'Phoenix', value: 'phx' },
  ];

  const tabs = [
    {
      label: 'Overview',
      value: 'overview',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">This is the overview tab. It contains general information.</p>
          <Button>Learn More</Button>
        </div>
      ),
    },
    {
      label: 'Settings',
      value: 'settings',
      badge: 3,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">Settings tab with configuration options.</p>
          <Toggle label="Enable notifications" checked={toggle1} onChange={setToggle1} />
          <Toggle label="Auto-save" checked={toggle2} onChange={setToggle2} />
        </div>
      ),
    },
    {
      label: 'Activity',
      value: 'activity',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">Recent activity and history.</p>
          <Badge variant="success">All systems operational</Badge>
        </div>
      ),
    },
  ];

  const tableData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'active' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'inactive' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Day 3 Components</h1>
          <Breadcrumbs items={[{ label: 'Components' }, { label: 'Day 3' }]} className="mt-2" />
        </div>

        {/* Dropdown */}
        <Card>
          <CardHeader>
            <CardTitle>Dropdown / Select</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dropdown
              label="Select a city"
              options={cityOptions}
              value={selectedCity}
              onChange={setSelectedCity}
              placeholder="Choose a city..."
            />
            {selectedCity && (
              <p className="text-sm text-gray-600">
                Selected: <strong>{cityOptions.find(c => c.value === selectedCity)?.label}</strong>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Tabs</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs tabs={tabs} />
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Data Table</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.role}</TableCell>
                    <TableCell>
                      <Badge variant={row.status === 'active' ? 'success' : 'default'}>
                        {row.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Toast Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Toast Notifications</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={() => addToast({ type: 'success', title: 'Success!', description: 'Operation completed successfully.' })}>
              Show Success
            </Button>
            <Button variant="secondary" onClick={() => addToast({ type: 'error', title: 'Error!', description: 'Something went wrong.' })}>
              Show Error
            </Button>
            <Button variant="outline" onClick={() => addToast({ type: 'info', title: 'Info', description: 'Here is some information.' })}>
              Show Info
            </Button>
            <Button variant="ghost" onClick={() => addToast({ type: 'warning', title: 'Warning!', description: 'Please be careful.' })}>
              Show Warning
            </Button>
          </CardContent>
        </Card>

        {/* Progress Bars */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Bars</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Progress value={progress} showLabel />
              <div className="flex gap-2 mt-4">
                <Button size="sm" onClick={() => setProgress(Math.max(0, progress - 10))}>-10%</Button>
                <Button size="sm" onClick={() => setProgress(Math.min(100, progress + 10))}>+10%</Button>
              </div>
            </div>
            <Progress value={75} variant="success" />
            <Progress value={50} variant="warning" />
            <Progress value={25} variant="error" />
          </CardContent>
        </Card>

        {/* Toggle Switches */}
        <Card>
          <CardHeader>
            <CardTitle>Toggle Switches</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Toggle label="Enable feature (Medium)" checked={toggle1} onChange={setToggle1} />
            <Toggle label="Small toggle" checked={toggle2} onChange={setToggle2} size="sm" />
            <Toggle label="Large toggle" checked={true} onChange={() => {}} size="lg" />
            <Toggle label="Disabled toggle" checked={false} onChange={() => {}} disabled />
          </CardContent>
        </Card>

        {/* Tooltips */}
        <Card>
          <CardHeader>
            <CardTitle>Tooltips</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Tooltip content="This is a top tooltip" position="top">
              <Button variant="outline">Hover (Top)</Button>
            </Tooltip>
            <Tooltip content="This is a bottom tooltip" position="bottom">
              <Button variant="outline">Hover (Bottom)</Button>
            </Tooltip>
            <Tooltip content="This is a left tooltip" position="left">
              <Button variant="outline">Hover (Left)</Button>
            </Tooltip>
            <Tooltip content="This is a right tooltip" position="right">
              <Button variant="outline">Hover (Right)</Button>
            </Tooltip>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function Day3Page() {
  return (
    <ToastProvider>
      <ComponentsShowcase />
    </ToastProvider>
  );
}
'@

Set-Content -Path "src\app\day3\page.tsx" -Value $showcaseContent
Write-Host "✅ Day 3 showcase page created" -ForegroundColor Green

# Add animation to globals.css
Write-Host ""
Write-Host "📝 Adding animations to globals.css..." -ForegroundColor Yellow
$animationCSS = @'

/* Toast animation */
@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}
'@

Add-Content -Path "src\app\globals.css" -Value $animationCSS
Write-Host "✅ Animations added" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 DAY 3 SETUP COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "✨ What you just created:" -ForegroundColor Cyan
Write-Host "  • Dropdown/Select with search" -ForegroundColor White
Write-Host "  • Tabs with badges" -ForegroundColor White
Write-Host "  • Data Table component" -ForegroundColor White
Write-Host "  • Toast notifications" -ForegroundColor White
Write-Host "  • Progress bars (4 variants)" -ForegroundColor White
Write-Host "  • Toggle switches (3 sizes)" -ForegroundColor White
Write-Host "  • Tooltips (4 positions)" -ForegroundColor White
Write-Host "  • Complete showcase page" -ForegroundColor White
Write-Host ""
Write-Host "🌐 To see it:" -ForegroundColor Yellow
Write-Host "  Navigate to: http://localhost:3000/day3" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Ready!" -ForegroundColor Green



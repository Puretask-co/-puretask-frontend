'use client';

import React from 'react';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { FieldError } from 'react-hook-form';

interface FormFieldProps {
  label: string;
  name: string;
  error?: FieldError | string;
  required?: boolean;
  hint?: string;
  children?: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  name,
  error,
  required,
  hint,
  children,
  className,
}: FormFieldProps) {
  const errorMessage = typeof error === 'string' ? error : error?.message;
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;

  const describedBy =
    [errorMessage ? errorId : null, hint && !errorMessage ? hintId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  const a11yProps = {
    'aria-invalid': errorMessage ? true : undefined,
    'aria-describedby': describedBy,
  };

  // If a custom child is supplied, clone it and merge in our a11y props
  // (preserving any aria-describedby the child already set).
  const fieldNode = children
    ? React.isValidElement(children)
      ? React.cloneElement(
          children as React.ReactElement<{
            id?: string;
            'aria-describedby'?: string;
            'aria-invalid'?: boolean;
          }>,
          {
            id: (children as React.ReactElement<{ id?: string }>).props.id ?? name,
            'aria-invalid': a11yProps['aria-invalid'],
            'aria-describedby':
              [
                (children as React.ReactElement<{ 'aria-describedby'?: string }>).props[
                  'aria-describedby'
                ],
                describedBy,
              ]
                .filter(Boolean)
                .join(' ') || undefined,
          }
        )
      : children
    : <Input id={name} name={name} {...a11yProps} />;

  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {fieldNode}
      {hint && !errorMessage && (
        <p id={hintId} className="text-xs text-gray-500">
          {hint}
        </p>
      )}
      {errorMessage && (
        <p id={errorId} className="text-xs text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

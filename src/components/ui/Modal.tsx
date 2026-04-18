'use client';

import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};
const panelVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, y: 4 },
};
const transition = {
  duration: 0.2,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Save current focus
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus first focusable element in modal
      const timer = setTimeout(() => {
        if (modalRef.current) {
          const focusable = modalRef.current.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) as HTMLElement;
          focusable?.focus();
        }
      }, 100);

      // Trap focus within modal
      const handleTab = (e: KeyboardEvent) => {
        if (!modalRef.current) return;
        
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement?.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement?.focus();
            }
          }
        }

        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleTab);
      document.body.style.overflow = 'hidden';

      return () => {
        clearTimeout(timer);
        document.removeEventListener('keydown', handleTab);
        document.body.style.overflow = '';
        // Restore focus
        previousFocusRef.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={transition}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={modalRef}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={transition}
            className={cn('relative bg-white rounded-xl shadow-2xl w-full mx-4', sizes[size])}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
          >
            {title && (
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 id="modal-title" className="text-xl font-semibold text-gray-900">{title}</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded-lg p-1 -m-1"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

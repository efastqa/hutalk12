import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

interface FloatingWhatsAppButtonProps {
  phone?: string;
  message?: string;
  label?: string;
  sublabel?: string;
  hidden?: boolean;
}

function normalizeWhatsAppNumber(raw?: string): string {
  const digits = String(raw || '94775260765').replace(/[^0-9]/g, '');
  if (!digits) return '94775260765';
  if (digits.startsWith('0')) return `94${digits.slice(1)}`;
  if (!digits.startsWith('94') && digits.length === 9) return `94${digits}`;
  return digits;
}

export const FloatingWhatsAppButton: React.FC<FloatingWhatsAppButtonProps> = ({
  phone = '94775260765',
  message = 'Hello HUTA.LK Team, I need assistance!',
  label = 'Chat on WhatsApp',
  sublabel,
  hidden = false,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  if (hidden) return null;

  const waNumber = normalizeWhatsAppNumber(phone);
  const waHref = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.75, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.75, y: 16 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-20 lg:bottom-6 left-4 sm:left-6 z-40 flex items-center gap-2.5 pointer-events-none"
    >
      <div
        className="relative flex items-center pointer-events-auto"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Concentric Animated WhatsApp Ripple Waves (compositor-only transform & opacity) */}
        {!prefersReducedMotion && (
          <>
            <motion.span
              aria-hidden="true"
              animate={{
                scale: [1, 1.48],
                opacity: [0.45, 0],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeOut',
              }}
              className="absolute inset-0 rounded-full bg-[#25D366] pointer-events-none"
            />
            <motion.span
              aria-hidden="true"
              animate={{
                scale: [1, 1.32],
                opacity: [0.35, 0],
              }}
              transition={{
                duration: 2.2,
                delay: 0.75,
                repeat: Infinity,
                ease: 'easeOut',
              }}
              className="absolute inset-0 rounded-full bg-[#25D366] pointer-events-none"
            />
          </>
        )}

        {/* Primary Animated WhatsApp Anchor Button */}
        <motion.a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={sublabel ? `${label} — ${sublabel}` : label}
          title={sublabel ? `${label} (${sublabel})` : label}
          whileHover={prefersReducedMotion ? undefined : { scale: 1.07, y: -2 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#25D366] via-[#1FA855] to-[#128C7E] text-white shadow-[0_10px_28px_rgba(31,168,85,0.42)] hover:shadow-[0_14px_34px_rgba(31,168,85,0.55)] border-2 border-white/90 dark:border-[#181920] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
        >
          <motion.svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-7 h-7 sm:w-7.5 sm:h-7.5 drop-shadow-xs"
            animate={
              prefersReducedMotion
                ? undefined
                : {
                    rotate: [0, -6, 6, -4, 4, 0],
                    scale: [1, 1.04, 1],
                  }
            }
            transition={{
              duration: 3.4,
              repeat: Infinity,
              repeatDelay: 2.4,
              ease: 'easeInOut',
            }}
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M16 3C8.82 3 3 8.71 3 15.76C3 18.29 3.75 20.66 5.05 22.65L3.35 28.74L9.66 27.08C11.58 28.14 13.73 28.72 16 28.72C23.18 28.72 29 23.01 29 15.96C29 8.71 23.18 3 16 3ZM16 26.32C13.97 26.32 12.06 25.73 10.42 24.71L10.02 24.47L6.28 25.45L7.28 21.84L7.02 21.43C5.89 19.71 5.39 17.78 5.39 15.76C5.39 10.02 10.16 5.4 16 5.4C21.84 5.4 26.61 10.02 26.61 15.76C26.61 21.5 21.84 26.32 16 26.32Z"
              fill="currentColor"
            />
            <path
              d="M21.97 18.92C21.64 18.75 20.03 17.96 19.73 17.85C19.43 17.74 19.21 17.68 18.99 18.01C18.77 18.34 18.14 19.08 17.95 19.3C17.76 19.52 17.57 19.55 17.24 19.38C16.91 19.21 15.86 18.87 14.62 17.76C13.65 16.9 13 15.83 12.81 15.5C12.62 15.17 12.79 14.99 12.95 14.83C13.1 14.68 13.28 14.45 13.45 14.26C13.62 14.07 13.67 13.93 13.78 13.71C13.89 13.49 13.84 13.3 13.75 13.13C13.67 12.97 13.01 11.35 12.74 10.69C12.47 10.05 12.2 10.14 12 10.13C11.81 10.12 11.59 10.12 11.37 10.12C11.15 10.12 10.79 10.2 10.49 10.53C10.19 10.86 9.34 11.65 9.34 13.27C9.34 14.89 10.52 16.46 10.68 16.68C10.85 16.9 13 20.22 16.31 21.65C17.1 21.99 17.71 22.19 18.19 22.34C18.98 22.59 19.7 22.56 20.27 22.47C20.9 22.38 22.22 21.68 22.49 20.91C22.77 20.14 22.77 19.48 22.68 19.34C22.6 19.2 22.38 19.11 22.05 18.95L21.97 18.92Z"
              fill="currentColor"
            />
          </motion.svg>
        </motion.a>

        {/* Clean Single-Line Hover Callout Label (Desktop / Hover only — zero permanent clutter) */}
        <AnimatePresence>
          {isHovered && (
            <motion.a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -8, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -8, scale: 0.96 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="hidden sm:flex flex-col ml-2.5 px-3.5 py-2 rounded-xl bg-white/95 dark:bg-[#151822]/95 backdrop-blur-md border border-gray-200 dark:border-white/15 shadow-lg max-w-[230px]"
            >
              <span className="text-xs font-extrabold text-gray-900 dark:text-white whitespace-nowrap truncate">
                {label}
              </span>
              {sublabel && (
                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap truncate">
                  {sublabel}
                </span>
              )}
            </motion.a>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

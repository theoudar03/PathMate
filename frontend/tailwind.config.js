/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── Primary — Institutional Blue ───────────────────────────
        primary:              '#1B4DA6',
        onPrimary:            '#FFFFFF',
        primaryContainer:     '#D8E2FF',
        onPrimaryContainer:   '#001A41',
        primaryHover:         '#163F8A',

        // ─── Secondary — Slate Blue ──────────────────────────────────
        secondary:            '#4A5568',
        onSecondary:          '#FFFFFF',
        secondaryContainer:   '#E2E8F0',
        onSecondaryContainer: '#1A202C',

        // ─── Tertiary — Amber ────────────────────────────────────────
        tertiary:             '#92620A',
        onTertiary:           '#FFFFFF',
        tertiaryContainer:    '#FDEFC3',
        onTertiaryContainer:  '#2C1A00',

        // ─── Error / Danger ──────────────────────────────────────────
        error:                '#C0392B',
        onError:              '#FFFFFF',
        errorContainer:       '#FDECEA',
        onErrorContainer:     '#5C0A00',

        // ─── Success — Emerald ────────────────────────────────────────
        success:              '#16A34A',
        onSuccess:            '#FFFFFF',
        successContainer:     '#DCFCE7',
        onSuccessContainer:   '#14532D',

        // ─── Warning — Amber ─────────────────────────────────────────
        warning:              '#D97706',
        onWarning:            '#FFFFFF',
        warningContainer:     '#FEF3C7',
        onWarningContainer:   '#78350F',

        // ─── Info — Sky Blue ─────────────────────────────────────────
        info:                 '#0284C7',
        onInfo:               '#FFFFFF',
        infoContainer:        '#E0F2FE',
        onInfoContainer:      '#0C4A6E',

        // ─── Surfaces ────────────────────────────────────────────────
        // Page background — enterprise neutral (not pure white)
        surface:              '#F5F7FA',
        surfaceVariant:       '#E2E8F0',
        onSurface:            '#0F172A',
        onSurfaceVariant:     '#475569',

        // Card / panel surfaces
        surfaceContainerLowest: '#FFFFFF',
        surfaceContainerLow:    '#F8FAFC',
        surfaceContainer:       '#F1F5F9',
        surfaceContainerHigh:   '#E8EDF5',
        surfaceContainerHighest:'#DDE3EE',

        // ─── Border / Outline ────────────────────────────────────────
        outline:              '#CBD5E1',
        outlineVariant:       '#E2E8F0',

        // ─── Accent (Amber highlight) ────────────────────────────────
        accent:               '#F59E0B',
      },

      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },

      // ─── Enterprise Shadow System ────────────────────────────────────
      boxShadow: {
        // Legacy MD3 (kept for backward compatibility)
        elevation1: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        elevation2: '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        elevation3: '0 8px 24px rgba(15,23,42,0.10), 0 2px 6px rgba(0,0,0,0.04)',

        // Enterprise card shadows (Linear / Notion style)
        card:       '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(15,23,42,0.06)',
        'card-hover': '0 2px 8px rgba(0,0,0,0.06), 0 12px 32px rgba(15,23,42,0.10)',
        dialog:     '0 8px 40px rgba(15,23,42,0.16), 0 2px 8px rgba(0,0,0,0.06)',

        // Nav
        nav:        '0 1px 0 #E2E8F0, 0 2px 8px rgba(15,23,42,0.05)',

        // Dropdown
        dropdown:   '0 4px 20px rgba(15,23,42,0.12), 0 1px 4px rgba(0,0,0,0.06)',

        // Glow accents (extremely subtle, enterprise)
        'glow-primary': '0 0 20px rgba(27,77,166,0.18)',
        'glow-success': '0 0 20px rgba(22,163,74,0.18)',
        'glow-warning': '0 0 20px rgba(217,119,6,0.18)',
        'glow-danger':  '0 0 20px rgba(192,57,43,0.18)',
        'glow-info':    '0 0 20px rgba(2,132,199,0.18)',
      },

      borderRadius: {
        card:    '20px',
        'card-lg': '24px',
        chip:    '50px',
        input:   '12px',
        dialog:  '24px',
      },

      // ─── Animations ─────────────────────────────────────────────────
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleUp: {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
      },
      animation: {
        'fade-in':   'fadeIn 0.3s ease-out both',
        'slide-up':  'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-down': 'slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-up':  'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        'shimmer':   'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
}

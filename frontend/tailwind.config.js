/** @type {import('tailwindcss').Config} */
const colorVariable = (name) => `rgb(var(--${name}-rgb) / <alpha-value>)`;

const makeShades = (name) => ({
  50: colorVariable(`${name}-50`),
  100: colorVariable(`${name}-100`),
  200: colorVariable(`${name}-200`),
  300: colorVariable(`${name}-300`),
  400: colorVariable(`${name}-400`),
  500: colorVariable(`${name}-500`),
  600: colorVariable(`${name}-600`),
  700: colorVariable(`${name}-700`),
  800: colorVariable(`${name}-800`),
  900: colorVariable(`${name}-900`),
});

const makeSlateShades = () => ({
  50: colorVariable(`slate-50`),
  100: colorVariable(`slate-100`),
  200: colorVariable(`slate-200`),
  300: colorVariable(`slate-300`),
  400: colorVariable(`slate-400`),
  500: colorVariable(`slate-500`),
  600: colorVariable(`slate-600`),
  700: colorVariable(`slate-700`),
  800: colorVariable(`slate-800`),
  900: colorVariable(`slate-900`),
});

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:              colorVariable('primary'),
        onPrimary:            colorVariable('on-primary'),
        primaryContainer:     colorVariable('primary-container'),
        onPrimaryContainer:   colorVariable('on-primary-container'),
        primaryHover:         colorVariable('primary-hover'),

        secondary:            colorVariable('secondary'),
        onSecondary:          colorVariable('on-secondary'),
        secondaryContainer:   colorVariable('secondary-container'),
        onSecondaryContainer: colorVariable('on-secondary-container'),

        tertiary:             colorVariable('tertiary'),
        onTertiary:           colorVariable('on-tertiary'),
        tertiaryContainer:    colorVariable('tertiary-container'),
        onTertiaryContainer:  colorVariable('on-tertiary-container'),

        error:                colorVariable('error'),
        onError:              colorVariable('on-error'),
        errorContainer:       colorVariable('error-container'),
        onErrorContainer:     colorVariable('on-error-container'),

        success:              colorVariable('success'),
        onSuccess:            colorVariable('on-success'),
        successContainer:     colorVariable('success-container'),
        onSuccessContainer:   colorVariable('on-success-container'),

        warning:              colorVariable('warning'),
        onWarning:            colorVariable('on-warning'),
        warningContainer:     colorVariable('warning-container'),
        onWarningContainer:   colorVariable('on-warning-container'),

        info:                 colorVariable('info'),
        onInfo:               colorVariable('on-info'),
        infoContainer:        colorVariable('info-container'),
        onInfoContainer:      colorVariable('on-info-container'),

        surface:              colorVariable('surface'),
        surfaceVariant:       colorVariable('surface-variant'),
        onSurface:            colorVariable('on-surface'),
        onSurfaceVariant:     colorVariable('on-surface-variant'),

        surfaceContainerLowest: colorVariable('surface-container-lowest'),
        surfaceContainerLow:    colorVariable('surface-container-low'),
        surfaceContainer:       colorVariable('surface-container'),
        surfaceContainerHigh:   colorVariable('surface-container-high'),
        surfaceContainerHighest:colorVariable('surface-container-highest'),

        outline:              colorVariable('outline'),
        outlineVariant:       colorVariable('outline-variant'),

        accent:               colorVariable('accent'),

        white: colorVariable('white'),

        slate: makeShades('slate'),
        gray: makeSlateShades(),
        neutral: makeSlateShades(),

        blue: {
          50: colorVariable('blue-50'),
          100: colorVariable('blue-100'),
          600: colorVariable('blue-600'),
          800: colorVariable('blue-800'),
          900: colorVariable('blue-900'),
        },
        indigo: {
          50: colorVariable('purple-50'),
          100: colorVariable('purple-100'),
          600: colorVariable('purple-600'),
          800: colorVariable('purple-800'),
          900: colorVariable('purple-800'),
        },
        emerald: {
          50: colorVariable('emerald-50'),
          100: colorVariable('emerald-100'),
          200: colorVariable('emerald-200'),
          800: colorVariable('emerald-800'),
        },
        amber: {
          50: colorVariable('amber-50'),
          100: colorVariable('amber-100'),
          800: colorVariable('amber-800'),
        },
        purple: {
          50: colorVariable('purple-50'),
          100: colorVariable('purple-100'),
          600: colorVariable('purple-600'),
          800: colorVariable('purple-800'),
        },
        rose: {
          50: colorVariable('rose-50'),
          100: colorVariable('rose-100'),
          800: colorVariable('rose-800'),
        },
        red: {
          50: colorVariable('rose-50'),
          100: colorVariable('rose-100'),
          800: colorVariable('rose-800'),
        },
        teal: {
          50: colorVariable('teal-50'),
          600: colorVariable('teal-600'),
        },
        cyan: {
          900: colorVariable('cyan-900'),
        },
        orange: {
          950: colorVariable('orange-950'),
        },
      },

      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },

      // ─── Enterprise Shadow System ────────────────────────────────────
      boxShadow: {
        // Legacy MD3 (kept for backward compatibility)
        elevation1: '0 1px 3px rgba(var(--shadow-color), 0.06), 0 1px 2px rgba(var(--shadow-color), 0.04)',
        elevation2: '0 4px 12px rgba(var(--shadow-color), 0.08), 0 2px 4px rgba(var(--shadow-color), 0.04)',
        elevation3: '0 8px 24px rgba(var(--shadow-color), 0.10), 0 2px 6px rgba(var(--shadow-color), 0.04)',

        // Enterprise card shadows (Linear / Notion style)
        card:       '0 1px 3px rgba(var(--shadow-color), 0.04), 0 4px 16px rgba(var(--shadow-color), 0.06)',
        'card-hover': '0 2px 8px rgba(var(--shadow-color), 0.06), 0 12px 32px rgba(var(--shadow-color), 0.10)',
        dialog:     '0 8px 40px rgba(var(--shadow-color), 0.16), 0 2px 8px rgba(var(--shadow-color), 0.06)',

        // Nav
        nav:        '0 1px 0 var(--outline-variant), 0 2px 8px rgba(var(--shadow-color), 0.05)',

        // Dropdown
        dropdown:   '0 4px 20px rgba(var(--shadow-color), 0.12), 0 1px 4px rgba(var(--shadow-color), 0.06)',

        // Glow accents (extremely subtle, enterprise)
        'glow-primary': '0 0 20px rgba(var(--primary-rgb), 0.18)',
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

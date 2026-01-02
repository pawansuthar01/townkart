// Theme Configuration
export const THEME_CONFIG = {
  // Color Palette
  colors: {
    // Primary Colors
    primary: {
      50: "#FFF7ED",
      100: "#FFEDD5",
      200: "#FED7AA",
      300: "#FDBA74",
      400: "#FB923C",
      500: "#FF6B35", // Main primary color
      600: "#EA580C",
      700: "#C2410C",
      800: "#9A3412",
      900: "#7C2D12",
      950: "#431407",
    },

    // Secondary Colors
    secondary: {
      50: "#FFFBEB",
      100: "#FEF3C7",
      200: "#FDE68A",
      300: "#FCD34D",
      400: "#FBBF24",
      500: "#F7931E", // Main secondary color
      600: "#D97706",
      700: "#B45309",
      800: "#92400E",
      900: "#78350F",
      950: "#451A03",
    },

    // Accent Colors
    accent: {
      50: "#F0FDF4",
      100: "#DCFCE7",
      200: "#BBF7D0",
      300: "#86EFAC",
      400: "#4ADE80",
      500: "#4CAF50", // Main accent color
      600: "#16A34A",
      700: "#15803D",
      800: "#166534",
      900: "#14532D",
      950: "#052E16",
    },

    // Neutral Colors
    gray: {
      50: "#F9FAFB",
      100: "#F3F4F6",
      200: "#E5E7EB",
      300: "#D1D5DB",
      400: "#9CA3AF",
      500: "#6B7280",
      600: "#4B5563",
      700: "#374151",
      800: "#1F2937",
      900: "#111827",
      950: "#030712",
    },

    // Status Colors
    success: {
      50: "#F0FDF4",
      100: "#DCFCE7",
      200: "#BBF7D0",
      300: "#86EFAC",
      400: "#4ADE80",
      500: "#22C55E",
      600: "#16A34A",
      700: "#15803D",
      800: "#166534",
      900: "#14532D",
      950: "#052E16",
    },

    error: {
      50: "#FEF2F2",
      100: "#FEE2E2",
      200: "#FECACA",
      300: "#FCA5A5",
      400: "#F87171",
      500: "#EF4444",
      600: "#DC2626",
      700: "#B91C1C",
      800: "#991B1B",
      900: "#7F1D1D",
      950: "#450A0A",
    },

    warning: {
      50: "#FFFBEB",
      100: "#FEF3C7",
      200: "#FDE68A",
      300: "#FCD34D",
      400: "#FBBF24",
      500: "#F59E0B",
      600: "#D97706",
      700: "#B45309",
      800: "#92400E",
      900: "#78350F",
      950: "#451A03",
    },

    info: {
      50: "#EFF6FF",
      100: "#DBEAFE",
      200: "#BFDBFE",
      300: "#93C5FD",
      400: "#60A5FA",
      500: "#3B82F6",
      600: "#2563EB",
      700: "#1D4ED8",
      800: "#1E40AF",
      900: "#1E3A8A",
      950: "#172554",
    },
  },

  // Typography
  typography: {
    fontFamily: {
      primary: ["Inter", "sans-serif"],
      secondary: ["Poppins", "sans-serif"],
      mono: ["JetBrains Mono", "monospace"],
      serif: ["Playfair Display", "serif"],
    },

    fontSize: {
      xs: ["0.75rem", { lineHeight: "1rem" }],
      sm: ["0.875rem", { lineHeight: "1.25rem" }],
      base: ["1rem", { lineHeight: "1.5rem" }],
      lg: ["1.125rem", { lineHeight: "1.75rem" }],
      xl: ["1.25rem", { lineHeight: "1.75rem" }],
      "2xl": ["1.5rem", { lineHeight: "2rem" }],
      "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
      "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
      "5xl": ["3rem", { lineHeight: "1" }],
      "6xl": ["3.75rem", { lineHeight: "1" }],
      "7xl": ["4.5rem", { lineHeight: "1" }],
      "8xl": ["6rem", { lineHeight: "1" }],
      "9xl": ["8rem", { lineHeight: "1" }],
    },

    fontWeight: {
      thin: "100",
      extralight: "200",
      light: "300",
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      extrabold: "800",
      black: "900",
    },

    letterSpacing: {
      tighter: "-0.05em",
      tight: "-0.025em",
      normal: "0em",
      wide: "0.025em",
      wider: "0.05em",
      widest: "0.1em",
    },
  },

  // Spacing
  spacing: {
    0: "0px",
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    7: "1.75rem",
    8: "2rem",
    9: "2.25rem",
    10: "2.5rem",
    12: "3rem",
    14: "3.5rem",
    16: "4rem",
    18: "4.5rem",
    20: "5rem",
    24: "6rem",
    28: "7rem",
    32: "8rem",
    36: "9rem",
    40: "10rem",
    44: "11rem",
    48: "12rem",
    52: "13rem",
    56: "14rem",
    60: "15rem",
    64: "16rem",
    72: "18rem",
    80: "20rem",
    96: "24rem",
  },

  // Border Radius
  borderRadius: {
    none: "0px",
    sm: "0.125rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    "3xl": "1.5rem",
    full: "9999px",
  },

  // Shadows
  boxShadow: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
    none: "none",
  },

  // Breakpoints
  screens: {
    xs: "475px",
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },

  // Animations
  animation: {
    none: "none",
    spin: "spin 1s linear infinite",
    ping: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
    pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
    bounce: "bounce 1s infinite",
    fadeIn: "fadeIn 0.5s ease-in-out",
    slideIn: "slideIn 0.3s ease-out",
    scaleIn: "scaleIn 0.2s ease-out",
  },

  // Transitions
  transition: {
    colors:
      "color, background-color, border-color, text-decoration-color, fill, stroke 150ms ease-in-out",
    opacity: "opacity 150ms ease-in-out",
    transform: "transform 150ms ease-in-out",
    shadow: "box-shadow 150ms ease-in-out",
    all: "all 150ms ease-in-out",
  },

  // Z-Index Scale
  zIndex: {
    auto: "auto",
    0: "0",
    10: "10",
    20: "20",
    30: "30",
    40: "40",
    50: "50",
    60: "60",
    70: "70",
    80: "80",
    90: "90",
    100: "100",
  },

  // Component Specific Styles
  components: {
    button: {
      primary: {
        backgroundColor: "#FF6B35",
        color: "#FFFFFF",
        borderRadius: "0.5rem",
        padding: "0.5rem 1rem",
        fontWeight: "600",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          backgroundColor: "#EA580C",
          transform: "translateY(-1px)",
          boxShadow: "0 4px 12px rgba(255, 107, 53, 0.3)",
        },
      },
      secondary: {
        backgroundColor: "#F7931E",
        color: "#FFFFFF",
        borderRadius: "0.5rem",
        padding: "0.5rem 1rem",
        fontWeight: "600",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          backgroundColor: "#D97706",
          transform: "translateY(-1px)",
          boxShadow: "0 4px 12px rgba(247, 147, 30, 0.3)",
        },
      },
    },

    card: {
      default: {
        backgroundColor: "#FFFFFF",
        borderRadius: "0.75rem",
        boxShadow:
          "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        border: "1px solid #E5E7EB",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          transform: "translateY(-2px)",
        },
      },
    },

    input: {
      default: {
        backgroundColor: "#FFFFFF",
        border: "1px solid #D1D5DB",
        borderRadius: "0.5rem",
        padding: "0.5rem 0.75rem",
        fontSize: "1rem",
        transition: "all 0.2s ease-in-out",
        "&:focus": {
          borderColor: "#FF6B35",
          boxShadow: "0 0 0 3px rgba(255, 107, 53, 0.1)",
          outline: "none",
        },
      },
    },
  },
};

// CSS Custom Properties (for runtime theme switching)
export const CSS_VARIABLES = {
  // Colors
  "--color-primary": THEME_CONFIG.colors.primary[500],
  "--color-secondary": THEME_CONFIG.colors.secondary[500],
  "--color-accent": THEME_CONFIG.colors.accent[500],
  "--color-success": THEME_CONFIG.colors.success[500],
  "--color-error": THEME_CONFIG.colors.error[500],
  "--color-warning": THEME_CONFIG.colors.warning[500],
  "--color-info": THEME_CONFIG.colors.info[500],

  // Typography
  "--font-primary": THEME_CONFIG.typography.fontFamily.primary.join(", "),
  "--font-secondary": THEME_CONFIG.typography.fontFamily.secondary.join(", "),

  // Spacing
  "--spacing-xs": THEME_CONFIG.spacing[1],
  "--spacing-sm": THEME_CONFIG.spacing[2],
  "--spacing-md": THEME_CONFIG.spacing[4],
  "--spacing-lg": THEME_CONFIG.spacing[6],
  "--spacing-xl": THEME_CONFIG.spacing[8],

  // Border Radius
  "--radius-sm": THEME_CONFIG.borderRadius.sm,
  "--radius-md": THEME_CONFIG.borderRadius.md,
  "--radius-lg": THEME_CONFIG.borderRadius.lg,
  "--radius-xl": THEME_CONFIG.borderRadius.xl,

  // Shadows
  "--shadow-sm": THEME_CONFIG.boxShadow.sm,
  "--shadow-md": THEME_CONFIG.boxShadow.md,
  "--shadow-lg": THEME_CONFIG.boxShadow.lg,
  "--shadow-xl": THEME_CONFIG.boxShadow.xl,
};

// Utility Functions
export const getColor = (
  color: keyof typeof THEME_CONFIG.colors,
  shade = 500
) => {
  const colorObj = THEME_CONFIG.colors[color];
  return colorObj[shade as keyof typeof colorObj] || colorObj[500];
};

export const getSpacing = (size: keyof typeof THEME_CONFIG.spacing) => {
  return THEME_CONFIG.spacing[size];
};

export const getFontSize = (
  size: keyof typeof THEME_CONFIG.typography.fontSize
) => {
  return THEME_CONFIG.typography.fontSize[size];
};

export const getShadow = (size: keyof typeof THEME_CONFIG.boxShadow) => {
  return THEME_CONFIG.boxShadow[size];
};

import * as tokens from "@esnet/esnet-tokens";

module.exports = {
  content: [
    "../../styles.html",
    "../../mockups/*.html",
    "../corridor-esnet/index.html",
    "../corridor-esnet/src/**/*.{js,ts,jsx,tsx}",
    "../../src/**/*.{js,ts,jsx,tsx}",
    "../../src/**/*.{jpg,png,svg,jpeg,gif,ico}"
  ],
  theme: {
    fontFamily: {
      sans: ["Noto Sans", "Open Sans", "sans-serif"],
      mono: ["Martian Mono", "monospace"]
    },
    extend: {
      screens: { "3xl": {"min": "1791px"} },
      colors: {
        "tn-layer": {
          1: tokens.ESNET_COLOR_CORE_WHITE_600, "//": "esnetwhite-400",
          2: tokens.ESNET_COLOR_CORE_WHITE_400, "//": "esnetwhite-200",
          3: tokens.ESNET_COLOR_CORE_WHITE_200, "//": "esnetwhite-50"
        },
        "color": {
          "text-alt-2": tokens.ESNET_COLOR_CORE_MAUVE_600,
          "text-link-focused": tokens.ESNET_COLOR_CORE_BERRY_300,
          "text": tokens.ESNET_COLOR_LIGHT_COPY, "//": "esnetblack-700",
          "text-alt": tokens.ESNET_COLOR_LIGHT_COPY_ALT, "//": "esnetblack-100",
          "text-link": tokens.ESNET_COLOR_CORE_TEAL_700, "//": "esnetblue-700",
          "text-link-active": tokens.ESNET_COLOR_CORE_TEAL_900, "//": "esnetblue-900",
          "text-link-hover": tokens.ESNET_COLOR_CORE_TEAL_500, "//": "esnetblue-900",
          "text-link-disabled": tokens.ESNET_COLOR_CORE_BLACK_100, "//": "esnetblack-100",
          "text-link-reverse": tokens.ESNET_COLOR_CORE_WHITE_100,
          "text-link-reverse-active": tokens.ESNET_COLOR_CORE_TEAL_100,
          "text-link-reverse-hover": tokens.ESNET_COLOR_CORE_WHITE_300,
          "text-link-reverse-disabled": tokens.ESNET_COLOR_CORE_BLACK_100,
          "text-required": tokens.ESNET_COLOR_CORE_RED_600, "//": "somewhere in the reds",
          "text-error": tokens.ESNET_COLOR_CORE_RED_600,
          "bg-error": tokens.ESNET_COLOR_CORE_RED_100,
          "text-warning": tokens.ESNET_COLOR_LIGHT_WARNING,"//": "we may need to adjust this",
          "bg-warning": tokens.ESNET_COLOR_CORE_YELLOW_100,
          "text-success": tokens.ESNET_COLOR_LIGHT_SUCCESS,
          "bg-success": tokens.ESNET_COLOR_CORE_GREEN_100,
          "border": tokens.ESNET_COLOR_CORE_BLACK_700, "//": "esnetblack-700", "//": "this should be standard, make edits.",
          "border-alt": tokens.ESNET_COLOR_CORE_BLACK_300, "//": "esnetblack-300", "//": "used for many border instances",
          "outline": tokens.ESNET_COLOR_CORE_BLUE_200, "//": "esnetblue-200", "//": "focus outline",
          "icon": tokens.ESNET_COLOR_CORE_TEAL_700, "//": "esnetblue-700", "//": "needs to be changed, currently 800",
          "icon-hover": tokens.ESNET_COLOR_CORE_TEAL_900, "//": "esnetblue-900",
          "icon-active": tokens.ESNET_COLOR_CORE_TEAL_400, "//": "esnetblue-500",
          "layer": {
            1: tokens.ESNET_COLOR_LIGHT_BACKGROUND, "//": "esnetwhite-400",
            2: tokens.ESNET_COLOR_LIGHT_SURFACE_1, "//": "esnetwhite-200",
            3: tokens.ESNET_COLOR_LIGHT_SURFACE_2, "//": "esnetwhite-50",
            "division": tokens.ESNET_COLOR_CORE_WHITE_900, "//": "esnetwhite-600",
          },
          "surface": {
            "secondary": tokens.ESNET_COLOR_CORE_MAUVE_400,
            "primary": tokens.ESNET_COLOR_CORE_TEAL_800+"DD",
            "tertiary": tokens.ESNET_COLOR_CORE_WHITE_300, "//": "bg-esnetwhite-100",
            "input": tokens.ESNET_COLOR_CORE_WHITE_100, "//": "white",
          },
          "button": {
            DEFAULT: tokens.ESNET_COLOR_CORE_WHITE_100+"CC", "//": "white/80",
            "active": tokens.ESNET_COLOR_CORE_WHITE_700+"CC", "//": "bg-esnetwhite-300/80",
            "hover": tokens.ESNET_COLOR_CORE_WHITE_300+"CC", "//": "bg-esnetwhite-900/80",
            "primary": {
              DEFAULT: tokens.ESNET_COLOR_CORE_BLUE_300, "//": "esnetblue-300",
              "hover": tokens.ESNET_COLOR_CORE_BLUE_600, "//": "esnetblue-600",
              "active": tokens.ESNET_COLOR_CORE_BLUE_700, "//": "esnetblue-800", 
            },
            "secondary": {
              DEFAULT: tokens.ESNET_COLOR_CORE_TEAL_700,
              "active": tokens.ESNET_COLOR_CORE_TEAL_1000, 
              "hover": tokens.ESNET_COLOR_CORE_TEAL_900, 
              "focus": tokens.ESNET_COLOR_CORE_TEAL_1000
            },
            "warning": {
              DEFAULT: tokens.ESNET_COLOR_CORE_RED_600,
              "active": tokens.ESNET_COLOR_CORE_RED_1000,
              "hover": tokens.ESNET_COLOR_CORE_RED_800,
              "focus": tokens.ESNET_COLOR_CORE_RED_1000
            }
          },
        },
        esnetblue: {
          50: tokens.ESNET_COLOR_CORE_BLUE_100,
          100: tokens.ESNET_COLOR_CORE_BLUE_200,
          200: tokens.ESNET_COLOR_CORE_BLUE_300,
          300: tokens.ESNET_COLOR_CORE_BLUE_400,
          400: tokens.ESNET_COLOR_CORE_BLUE_500,
          500: tokens.ESNET_COLOR_CORE_BLUE_600,
          600: tokens.ESNET_COLOR_CORE_BLUE_700,
          700: tokens.ESNET_COLOR_CORE_BLUE_800,
          800: tokens.ESNET_COLOR_CORE_BLUE_900,
          900:tokens.ESNET_COLOR_CORE_BLUE_1000,
        },
        teal: {
          50: tokens.ESNET_COLOR_CORE_TEAL_100,
          100: tokens.ESNET_COLOR_CORE_TEAL_200,
          200: tokens.ESNET_COLOR_CORE_TEAL_300,
          300: tokens.ESNET_COLOR_CORE_TEAL_400,
          400: tokens.ESNET_COLOR_CORE_TEAL_500,
          500: tokens.ESNET_COLOR_CORE_TEAL_600,
          600: tokens.ESNET_COLOR_CORE_TEAL_700,
          700: tokens.ESNET_COLOR_CORE_TEAL_800,
          800: tokens.ESNET_COLOR_CORE_TEAL_900,
          900:tokens.ESNET_COLOR_CORE_TEAL_1000,
        },
        mauve: {
          50: tokens.ESNET_COLOR_CORE_MAUVE_100,
          100: tokens.ESNET_COLOR_CORE_MAUVE_200,
          200: tokens.ESNET_COLOR_CORE_MAUVE_300,
          300: tokens.ESNET_COLOR_CORE_MAUVE_400,
          400: tokens.ESNET_COLOR_CORE_MAUVE_500,
          500: tokens.ESNET_COLOR_CORE_MAUVE_600,
          600: tokens.ESNET_COLOR_CORE_MAUVE_700,
          700: tokens.ESNET_COLOR_CORE_MAUVE_800,
          800: tokens.ESNET_COLOR_CORE_MAUVE_900,
          900:tokens.ESNET_COLOR_CORE_MAUVE_1000,
        },
        esnetwhite: {
          50: tokens.ESNET_COLOR_CORE_WHITE_100,
          100: tokens.ESNET_COLOR_CORE_WHITE_200,
          200: tokens.ESNET_COLOR_CORE_WHITE_300,
          300: tokens.ESNET_COLOR_CORE_WHITE_400,
          400: tokens.ESNET_COLOR_CORE_WHITE_500,
          500: tokens.ESNET_COLOR_CORE_WHITE_600,
          600: tokens.ESNET_COLOR_CORE_WHITE_700,
          700: tokens.ESNET_COLOR_CORE_WHITE_800,
          800: tokens.ESNET_COLOR_CORE_WHITE_900,
          900: tokens.ESNET_COLOR_CORE_WHITE_1000,
        },
        esnetblack: {
          50: tokens.ESNET_COLOR_CORE_BLACK_100,
          100: tokens.ESNET_COLOR_CORE_BLACK_200,
          200: tokens.ESNET_COLOR_CORE_BLACK_300,
          300: tokens.ESNET_COLOR_CORE_BLACK_400,
          400: tokens.ESNET_COLOR_CORE_BLACK_500,
          500: tokens.ESNET_COLOR_CORE_BLACK_600,
          600: tokens.ESNET_COLOR_CORE_BLACK_700,
          700: tokens.ESNET_COLOR_CORE_BLACK_800,
          800: tokens.ESNET_COLOR_CORE_BLACK_900,
          900: tokens.ESNET_COLOR_CORE_BLACK_1000,
        },
        "radius": {
          "sm": "0.25rem", "//": "tailwinds rounded",
          "md": "0.375rem", "//": "tailwinds rounded-md",
          "lg": "0.75rem", "//": "tailwinds rounded-xl",
          "circle": "full?", "//": "unused",
        },
        "border": {
          "size": {
            "sm": "1px", "//": "tailwinds border",
            "md": "2px", "//": "tailwinds border-2",
            "lg": "4px", "//": "tailwinds border-4",
          }
        },
        "icon": {
          "size": {
            "sm": null, "//": "unused",
            "md": "2rem",
            "lg": "2.5rem",
          }
        },
        esnetmist: {
          50: "#D0EAF2",
          100: "#B2D0D9",
          200: "#9AB6BE",
          300: "#82A6B3",
          400: "#6E939E",
          500: "#60808A",
          600: "#506D75",
          700: "#3F5A61",
          800: "#32474D",
          900: "#212F33",
        },
        pink: {
          50: tokens.ESNET_COLOR_CORE_BERRY_100,
          100: tokens.ESNET_COLOR_CORE_BERRY_200,
          200: tokens.ESNET_COLOR_CORE_BERRY_300,
          300: tokens.ESNET_COLOR_CORE_BERRY_400,
          400: tokens.ESNET_COLOR_CORE_BERRY_500,
          500: tokens.ESNET_COLOR_CORE_BERRY_600,
          600: tokens.ESNET_COLOR_CORE_BERRY_700,
          700: tokens.ESNET_COLOR_CORE_BERRY_800,
          800: tokens.ESNET_COLOR_CORE_BERRY_900,
          900:tokens.ESNET_COLOR_CORE_BERRY_1000,
        },
      },
      backgroundImage: {
        'terranova-logo': "url('/public/terranova-logo.png')",
        'terranova-logo-25': "url('/public/terranova-logo-25.png')",
        'terranova-logo-50': "url('/public/terranova-logo-50.png')",
        'terranova-logo-grey': "url(/public/terranova-logo-greyscale.png)",
        'terranova-logo-name': "url(/public/terranova-logo-name.png)",
      },
      backgroundSize: {
        '75%':'auto 75%',
      },
      spacing: {
        '88': '35.2rem',
        '150': '60rem'
      },
      padding: {
        '50%': '50%'
      },
      height: {
        '1/4': '25%',
        '1/2': '50%',
        '3/4': '75%',
      },
      animation: {
        "fade": "fadeOut 1.5s ease-out",
      },
      keyframes: {
        fadeOut: {
          "0%": { opacity: 1.0 },
          "50%": { opacity: 1.0 },
          "100%": { opacity: 0 },
        },
      },
    },
  },
  plugins: [],
  safelist: [{
    pattern: /(bg|text|border)-(esnet|pink).*/,
  }]
};

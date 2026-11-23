// Colors reference --pkts-color-core-* CSS variables from @esnet/packets-ui-css.
// Tailwind emits var() references into generated utilities, so overriding a
// --pkts-color-core-* variable at runtime (e.g. via a mounted theme.css) recolors
// every utility that references it without a rebuild.

const p = (color, shade) => `var(--pkts-color-core-${color}-${shade})`;
const alpha = (color, shade, pct) =>
  `color-mix(in srgb, var(--pkts-color-core-${color}-${shade}) ${pct}%, transparent)`;

module.exports = {
  content: [
    "../../styles.html",
    "../../mockups/*.html",
    "../corridor-esnet/index.html",
    "../corridor-esnet/src/**/*.{js,ts,jsx,tsx}",
    "../../src/**/*.{js,ts,jsx,tsx}",
    "../../src/**/*.{jpg,png,svg,jpeg,gif,ico}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      sans: ["Noto Sans", "Open Sans", "sans-serif"],
      mono: ["Martian Mono", "monospace"]
    },
    extend: {
      screens: { "3xl": {"min": "1791px"} },
      colors: {
        // light and dark mode aren't actually implemented; primary/secondary visually swapped for light
        'light-primary':   p('black', 800),
        'light-secondary': p('black', 500),
        "tn-layer": {
          1: p('white', 600),
          2: p('white', 400),
          3: p('white', 200),
        },
        "color": {
          "text-alt-2":               p('mauve', 600),
          "text-link-focused":        p('berry', 300),
          "text":                     p('black', 700),
          "text-alt":                 p('black', 100),
          "text-link":                p('teal', 700),
          "text-link-active":         p('teal', 900),
          "text-link-hover":          p('teal', 500),
          "text-link-disabled":       p('black', 100),
          "text-link-reverse":        p('white', 100),
          "text-link-reverse-active": p('teal', 100),
          "text-link-reverse-hover":  p('white', 300),
          "text-link-reverse-disabled": p('black', 100),
          "text-required":            p('red', 600),
          "text-error":               p('red', 600),
          "bg-error":                 p('red', 100),
          "text-warning":             p('yellow', 500),
          "bg-warning":               p('yellow', 100),
          "text-success":             p('green', 600),
          "bg-success":               p('green', 100),
          "border":                   p('black', 700),
          "border-alt":               p('black', 300),
          "outline":                  p('blue', 200),
          "icon":                     p('teal', 700),
          "icon-hover":               p('teal', 900),
          "icon-active":              p('teal', 400),
          "layer": {
            1:          "#d2d3d7",         // no exact pkts-color-core-* match
            2:          p('white', 400),
            3:          p('white', 200),
            "division": p('white', 900),
          },
          "surface": {
            "secondary": p('mauve', 400),
            "primary":   alpha('teal', 800, 87),
            "tertiary":  p('white', 300),
            "input":     p('white', 100),
          },
          "button": {
            DEFAULT:  alpha('white', 100, 80),
            "active": alpha('white', 700, 80),
            "hover":  alpha('white', 300, 80),
            "primary": {
              DEFAULT: p('blue', 300),
              "hover": p('blue', 600),
              "active": p('blue', 700),
            },
            "secondary": {
              DEFAULT: p('teal', 700),
              "active": p('teal', 1000),
              "hover":  p('teal', 900),
              "focus":  p('teal', 1000),
            },
            "warning": {
              DEFAULT: p('red', 600),
              "active": p('red', 1000),
              "hover":  p('red', 800),
              "focus":  p('red', 1000),
            },
          },
        },
        esnetblue:  { 50:p('blue',100),  100:p('blue',200),  200:p('blue',300),  300:p('blue',400),  400:p('blue',500),  500:p('blue',600),  600:p('blue',700),  700:p('blue',800),  800:p('blue',900),  900:p('blue',1000)  },
        teal:       { 50:p('teal',100),  100:p('teal',200),  200:p('teal',300),  300:p('teal',400),  400:p('teal',500),  500:p('teal',600),  600:p('teal',700),  700:p('teal',800),  800:p('teal',900),  900:p('teal',1000)  },
        mauve:      { 50:p('mauve',100), 100:p('mauve',200), 200:p('mauve',300), 300:p('mauve',400), 400:p('mauve',500), 500:p('mauve',600), 600:p('mauve',700), 700:p('mauve',800), 800:p('mauve',900), 900:p('mauve',1000) },
        slate:      { 50:p('slate',100), 100:p('slate',200), 200:p('slate',300), 300:p('slate',400), 400:p('slate',500), 500:p('slate',600), 600:p('slate',700), 700:p('slate',800), 800:p('slate',900), 900:p('slate',1000) },
        esnetwhite: { 50:p('white',100), 100:p('white',200), 200:p('white',300), 300:p('white',400), 400:p('white',500), 500:p('white',600), 600:p('white',700), 700:p('white',800), 800:p('white',900), 900:p('white',1000) },
        esnetblack: { 50:p('black',100), 100:p('black',200), 200:p('black',300), 300:p('black',400), 400:p('black',500), 500:p('black',600), 600:p('black',700), 700:p('black',800), 800:p('black',900), 900:p('black',1000) },
        pink:       { 50:p('berry',100), 100:p('berry',200), 200:p('berry',300), 300:p('berry',400), 400:p('berry',500), 500:p('berry',600), 600:p('berry',700), 700:p('berry',800), 800:p('berry',900), 900:p('berry',1000) },
        "radius": {
          "sm": "0.25rem",
          "md": "0.375rem",
          "lg": "0.75rem",
        },
        "border": { "size": { "sm": "1px", "md": "2px", "lg": "4px" } },
        "icon":   { "size": { "sm": null, "md": "2rem", "lg": "2.5rem" } },
        esnetmist: {
          50: "#D0EAF2", 100: "#B2D0D9", 200: "#9AB6BE", 300: "#82A6B3",
          400: "#6E939E", 500: "#60808A", 600: "#506D75", 700: "#3F5A61",
          800: "#32474D", 900: "#212F33",
        },
      },
      backgroundImage: {
        'terranova-logo':      "url('/public/terranova-logo.png')",
        'terranova-logo-25':   "url('/public/terranova-logo-25.png')",
        'terranova-logo-50':   "url('/public/terranova-logo-50.png')",
        'terranova-logo-grey': "url(/public/terranova-logo-greyscale.png)",
        'terranova-logo-name': "url(/public/terranova-logo-name.png)",
      },
      backgroundSize: { '75%': 'auto 75%' },
      spacing:   { '88': '35.2rem', '150': '60rem' },
      padding:   { '50%': '50%' },
      height:    { '1/4': '25%', '1/2': '50%', '3/4': '75%' },
      animation: { "fade": "fadeOut 1.5s ease-out" },
      keyframes: {
        fadeOut: {
          "0%":   { opacity: 1.0 },
          "50%":  { opacity: 1.0 },
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

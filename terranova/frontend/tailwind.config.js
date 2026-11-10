// Color palette sourced from @esnet/packets-ui-css --pkts-color-core-* variables.
// esnet-tokens is no longer a separate dependency; the packets-ui-css package
// is the authoritative source of these values.
//
// TODO (tn-kck.4): replace hardcoded hex with var(--pkts-color-*) references so
// these colors are overridable at runtime via a mounted theme.css.

const pkts = {
  black:  { 100:"#6e6e70", 200:"#656566", 300:"#5e5e5e", 400:"#565657", 500:"#4d4d4f", 600:"#454547", 700:"#3d3d3d", 800:"#252526", 900:"#19191a", 1000:"#000000" },
  white:  { 100:"#ffffff", 200:"#f2f2f2", 300:"#e6e6e6", 400:"#e3e3e3", 500:"#d9d9d9", 600:"#cccccc", 700:"#c2c2c2", 800:"#b3b3b3", 900:"#a8a8a8", 1000:"#9e9e9e" },
  blue:   { 100:"#cff1ff", 200:"#9ce2ff", 300:"#64d2ff", 400:"#00b6f2", 500:"#00a0d6", 600:"#0088b5", 700:"#0075a2", 800:"#00608c", 900:"#004573", 1000:"#002d52" },
  teal:   { 100:"#beebe2", 200:"#90dbd7", 300:"#65c1cc", 400:"#4ba9b3", 500:"#398e99", 600:"#267a87", 700:"#216a75", 800:"#155966", 900:"#0a4854", 1000:"#00313c" },
  green:  { 100:"#c3ffaa", 200:"#8df272", 300:"#4ed953", 400:"#13c230", 500:"#11ad2b", 600:"#0e8a0e", 700:"#0b730b", 800:"#0a610a", 900:"#084d08", 1000:"#063806" },
  red:    { 100:"#ffbdc4", 200:"#ff8c93", 300:"#ff656f", 400:"#ff404e", 500:"#eb3321", 600:"#d61200", 700:"#a6111b", 800:"#8a0416", 900:"#6b0012", 1000:"#4d000d" },
  yellow: { 100:"#fffdd2", 200:"#fffb7d", 300:"#fff026", 400:"#f5de00", 500:"#e6c500", 600:"#cc9e16", 700:"#a97c2f", 800:"#856229", 900:"#664b22", 1000:"#42301b" },
  mauve:  { 100:"#f4d0cf", 200:"#e5adb4", 300:"#d18c97", 400:"#bf7584", 500:"#aa6875", 600:"#965c68", 700:"#804e58", 800:"#6e3f46", 900:"#57323d", 1000:"#42222e" },
  berry:  { 100:"#fed0ec", 200:"#ffa5cb", 300:"#ff7da9", 400:"#ff5b8d", 500:"#ff2377", 600:"#d60067", 700:"#b30056", 800:"#990054", 900:"#730047", 1000:"#4d0037" },
};

// Semantic light-mode aliases (from --pkts-color-light-* in packets-ui-css)
const light = {
  background: "#d2d3d7",
  copy:        pkts.black[700],
  copyAlt:     pkts.black[100],
  primary:     pkts.black[500],
  secondary:   pkts.black[800],
  success:     pkts.green[600],
  warning:     pkts.yellow[500],
  surface1:    pkts.white[400],
  surface2:    pkts.white[200],
};

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
        'light-primary':   light.secondary,
        'light-secondary': light.primary,
        "tn-layer": {
          1: pkts.white[600],
          2: pkts.white[400],
          3: pkts.white[200],
        },
        "color": {
          "text-alt-2":               pkts.mauve[600],
          "text-link-focused":        pkts.berry[300],
          "text":                     light.copy,
          "text-alt":                 light.copyAlt,
          "text-link":                pkts.teal[700],
          "text-link-active":         pkts.teal[900],
          "text-link-hover":          pkts.teal[500],
          "text-link-disabled":       pkts.black[100],
          "text-link-reverse":        pkts.white[100],
          "text-link-reverse-active": pkts.teal[100],
          "text-link-reverse-hover":  pkts.white[300],
          "text-link-reverse-disabled": pkts.black[100],
          "text-required":            pkts.red[600],
          "text-error":               pkts.red[600],
          "bg-error":                 pkts.red[100],
          "text-warning":             light.warning,
          "bg-warning":               pkts.yellow[100],
          "text-success":             light.success,
          "bg-success":               pkts.green[100],
          "border":                   pkts.black[700],
          "border-alt":               pkts.black[300],
          "outline":                  pkts.blue[200],
          "icon":                     pkts.teal[700],
          "icon-hover":               pkts.teal[900],
          "icon-active":              pkts.teal[400],
          "layer": {
            1:          light.background,
            2:          light.surface1,
            3:          light.surface2,
            "division": pkts.white[900],
          },
          "surface": {
            "secondary": pkts.mauve[400],
            "primary":   pkts.teal[800] + "DD",
            "tertiary":  pkts.white[300],
            "input":     pkts.white[100],
          },
          "button": {
            DEFAULT:  pkts.white[100] + "CC",
            "active": pkts.white[700] + "CC",
            "hover":  pkts.white[300] + "CC",
            "primary": {
              DEFAULT: pkts.blue[300],
              "hover": pkts.blue[600],
              "active": pkts.blue[700],
            },
            "secondary": {
              DEFAULT: pkts.teal[700],
              "active": pkts.teal[1000],
              "hover":  pkts.teal[900],
              "focus":  pkts.teal[1000],
            },
            "warning": {
              DEFAULT: pkts.red[600],
              "active": pkts.red[1000],
              "hover":  pkts.red[800],
              "focus":  pkts.red[1000],
            },
          },
        },
        esnetblue:  { 50:pkts.blue[100],  100:pkts.blue[200],  200:pkts.blue[300],  300:pkts.blue[400],  400:pkts.blue[500],  500:pkts.blue[600],  600:pkts.blue[700],  700:pkts.blue[800],  800:pkts.blue[900],  900:pkts.blue[1000]  },
        teal:       { 50:pkts.teal[100],  100:pkts.teal[200],  200:pkts.teal[300],  300:pkts.teal[400],  400:pkts.teal[500],  500:pkts.teal[600],  600:pkts.teal[700],  700:pkts.teal[800],  800:pkts.teal[900],  900:pkts.teal[1000]  },
        mauve:      { 50:pkts.mauve[100], 100:pkts.mauve[200], 200:pkts.mauve[300], 300:pkts.mauve[400], 400:pkts.mauve[500], 500:pkts.mauve[600], 600:pkts.mauve[700], 700:pkts.mauve[800], 800:pkts.mauve[900], 900:pkts.mauve[1000] },
        esnetwhite: { 50:pkts.white[100], 100:pkts.white[200], 200:pkts.white[300], 300:pkts.white[400], 400:pkts.white[500], 500:pkts.white[600], 600:pkts.white[700], 700:pkts.white[800], 800:pkts.white[900], 900:pkts.white[1000] },
        esnetblack: { 50:pkts.black[100], 100:pkts.black[200], 200:pkts.black[300], 300:pkts.black[400], 400:pkts.black[500], 500:pkts.black[600], 600:pkts.black[700], 700:pkts.black[800], 800:pkts.black[900], 900:pkts.black[1000] },
        pink:       { 50:pkts.berry[100], 100:pkts.berry[200], 200:pkts.berry[300], 300:pkts.berry[400], 400:pkts.berry[500], 500:pkts.berry[600], 600:pkts.berry[700], 700:pkts.berry[800], 800:pkts.berry[900], 900:pkts.berry[1000] },
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

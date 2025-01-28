/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html","./assets/**/*.{html,js},'./assets/css/custom.css','./index.html','./assets/css/**/*.css',CSS'./**/*.html'"],
  theme: {
    extend: {
      container: {
        center: true,
        padding: "1rem",
      },
      colors: {
        'Dark-blue': 'hsl(212, 24%, 26%)',
        'Grayish-blue': 'hsl(211, 10%, 45%)',
        'Light-gray': 'hsl(223, 19%, 93%)',
        'Very-light-gray': 'hsl(228, 33%, 97%)',
        'Moderate-blue': 'hsl(238, 40%, 52%)',
        'Soft-Red': 'hsl(358, 79%, 66%)',
        'Light-grayish-blue': 'hsl(239, 57%, 85%)',
        'Pale-red': 'hsl(357, 100%, 86%)',
        'primary': '#009D8C',
      },
      fontFamily: {
        'Rubik': ['Rubik', 'sans-serif'],
      },
      fontSize:{
        'p': '16px'
      }
    },
  },
  plugins: [],
}


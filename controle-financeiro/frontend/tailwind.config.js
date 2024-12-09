/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        azul: {
          50: '#ebf5ff', // Azul claro muito suave
          100: '#d0eaff', // Azul claro suave
          200: '#a1d4ff', // Azul claro
          300: '#6dbaff', // Azul médio claro
          400: '#399eff', // Azul vibrante
          500: '#007bff', // Azul padrão
          600: '#005ecb', // Azul escuro
          700: '#004499', // Azul mais escuro
          800: '#002a66', // Azul profundo
          900: '#001433', // Azul quase preto
        },
      },
    },
  },
  plugins: [],
}


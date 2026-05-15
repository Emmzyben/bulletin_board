/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
        'eco-technology': 'hsl(var(--eco-technology))',
        'eco-healthcare': 'hsl(var(--eco-healthcare))',
        'eco-corporate': 'hsl(var(--eco-corporate))',
        'eco-education': 'hsl(var(--eco-education))',
        'eco-government': 'hsl(var(--eco-government))',
        'eco-real-estate': 'hsl(var(--eco-real-estate))',
        'eco-hospitality': 'hsl(var(--eco-hospitality))',
        'eco-careers': 'hsl(var(--eco-careers))',
        'eco-entertainment': 'hsl(var(--eco-entertainment))',
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  safelist: [
    'bg-eco-technology', 'bg-eco-healthcare', 'bg-eco-corporate', 'bg-eco-education',
    'bg-eco-government', 'bg-eco-real-estate', 'bg-eco-hospitality', 'bg-eco-careers', 'bg-eco-entertainment',
    'text-eco-technology', 'text-eco-healthcare', 'text-eco-corporate', 'text-eco-education',
    'text-eco-government', 'text-eco-real-estate', 'text-eco-hospitality', 'text-eco-careers', 'text-eco-entertainment',
    'border-eco-technology', 'border-eco-healthcare', 'border-eco-corporate', 'border-eco-education',
    'border-eco-government', 'border-eco-real-estate', 'border-eco-hospitality', 'border-eco-careers', 'border-eco-entertainment',
    'bg-eco-technology/10', 'bg-eco-healthcare/10', 'bg-eco-corporate/10', 'bg-eco-education/10',
    'bg-eco-government/10', 'bg-eco-real-estate/10', 'bg-eco-hospitality/10', 'bg-eco-careers/10', 'bg-eco-entertainment/10',
    'bg-eco-technology/20', 'bg-eco-healthcare/20', 'bg-eco-corporate/20', 'bg-eco-education/20',
    'bg-eco-government/20', 'bg-eco-real-estate/20', 'bg-eco-hospitality/20', 'bg-eco-careers/20', 'bg-eco-entertainment/20',
  ],
  plugins: [require("tailwindcss-animate")],
}

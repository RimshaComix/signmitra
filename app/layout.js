import './globals.css';
import PWARegister from '../components/PWARegister';
import { ThemeProvider } from '../context/ThemeContext';

export const metadata = {
  title: 'SignMitra — Communication Companion',
  description: 'A privacy-focused, stateful accessibility platform for Indian Sign Language users.',
  manifest: '/manifest.json', // Foundation for our Phase 7 PWA support
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Ensures accurate scaling on mobile devices preventing accidental multi-taps */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=5.0"
        />
        <meta name="theme-color" content="#0f172a" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased selection:bg-blue-500 selection:text-white bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-150">
        <ThemeProvider>
          {/* ✅ Registers the Service Worker silently in the client background */}
          <PWARegister />

          {/* Universal Application Wrapper */}
          <div className="min-h-screen w-full flex flex-col justify-start">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

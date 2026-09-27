import './globals.css';
import PWARegister from '../components/PWARegister';
import { ThemeProvider } from '../context/ThemeContext';
import AppWrapper from '../components/AppWrapper';

export const metadata = {
  title: 'SignMitra — Communication Companion',
  description: 'A privacy-focused, stateful accessibility platform for Indian Sign Language users.',
  manifest: '/manifest.json', 
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=5.0"
        />
        <meta name="theme-color" content="#FDF1E2" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased transition-colors duration-150">
        <ThemeProvider>
          {/* Registers the Service Worker silently in the client background */}
          <PWARegister />
          
          {/* Global Theme Wrapper containing the Navbar */}
          <AppWrapper>
            {children}
          </AppWrapper>

        </ThemeProvider>
      </body>
    </html>
  );
}
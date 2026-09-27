import './globals.css';
import { ThemeProvider } from '../context/ThemeContext';
import AppWrapper from '../components/AppWrapper';

export const metadata = {
  title: 'SignMitra — Communication Companion',
  description: 'A privacy-focused, stateful accessibility platform for Indian Sign Language users.',
  manifest: '/manifest.json', 
  themeColor: '#655A7C',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SignMitra',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=5.0"
        />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="antialiased transition-colors duration-150">
        <ThemeProvider>
          
          <AppWrapper>
            {children}
          </AppWrapper>

        </ThemeProvider>

        {/* Inline Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('SignMitra ServiceWorker registered successfully');
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
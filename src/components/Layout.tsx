import { Outlet, Link } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useSettings } from '../contexts/SettingsContext';

export default function Layout() {
  const { adClient } = useSettings();

  useEffect(() => {
    if (adClient) {
      if (!document.getElementById('adsbygoogle-script')) {
        const script = document.createElement('script');
        script.id = 'adsbygoogle-script';
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`;
        script.async = true;
        script.crossOrigin = "anonymous";
        document.head.appendChild(script);
      }
    }
  }, [adClient]);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow pt-20 pb-12 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

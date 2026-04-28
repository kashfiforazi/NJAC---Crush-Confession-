import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useSettings } from '../contexts/SettingsContext';

export default function Layout() {
  const { adClient } = useSettings();
  const location = useLocation();

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
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

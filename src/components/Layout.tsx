import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useSettings } from '../contexts/SettingsContext';

export default function Layout() {
  const { adsterraPopunder, adsterraSocialBar } = useSettings();
  const location = useLocation();

  useEffect(() => {
    // Handle site-wide scripts like Popunder and Social Bar
    const injectScript = (id: string, code: string) => {
      if (!code || document.getElementById(id)) return;
      
      const container = document.createElement('div');
      container.id = id;
      container.style.display = 'none'; // Hide the technical container
      container.innerHTML = code;
      
      const fragments = Array.from(container.childNodes);
      fragments.forEach(node => {
        if (node.nodeName === 'SCRIPT') {
          const oldScript = node as HTMLScriptElement;
          const newScript = document.createElement('script');
          Array.from(oldScript.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
          });
          
          if (oldScript.innerHTML) {
            newScript.textContent = oldScript.innerHTML;
          }
          
          document.body.appendChild(newScript);
        } else {
          document.body.appendChild(node.cloneNode(true));
        }
      });
      
      document.body.appendChild(container);
    };

    if (adsterraPopunder) injectScript('adsterra-popunder', adsterraPopunder);
    if (adsterraSocialBar) injectScript('adsterra-socialbar', adsterraSocialBar);
  }, [adsterraPopunder, adsterraSocialBar]);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow pb-12 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

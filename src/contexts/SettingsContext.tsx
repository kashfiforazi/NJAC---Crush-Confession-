import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface SiteSettings {
  headerLogo?: string;
  footerLogo?: string;
  headerTitle?: string;
  footerTitle?: string;
  aboutUsText?: string;
  founderImage?: string;
  principalImage?: string;
  bannerImage?: string;
  adClient?: string;
  adSlotSidebar?: string;
  adSlotFooter?: string;
  fbPage1?: string;
  fbPage2?: string;
  fbGroup?: string;
  instagram?: string;
  messenger?: string;
}

const defaultSettings: SiteSettings = {
  headerTitle: 'NJAC Confession',
  footerTitle: 'NJAC Confession',
  headerLogo: '', // We can leave it blank initially so the heart icon shows, or put a placeholder if desired. Let's leave blank to show the Heart icon fallback.
  aboutUsText: 'Welcome to NJAC Confession...',
};

const SettingsContext = createContext<SiteSettings>(defaultSettings);

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

  useEffect(() => {
    async function loadSettings() {
      try {
        const snap = await getDoc(doc(db, 'settings', 'global'));
        if (snap.exists()) {
          setSettings({ ...defaultSettings, ...snap.data() as SiteSettings });
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadSettings();
  }, []);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

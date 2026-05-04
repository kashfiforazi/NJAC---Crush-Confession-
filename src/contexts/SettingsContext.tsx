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
  adsterraNativeBanner?: string;
  adsterraBanner728x90?: string;
  adsterraBanner300x250?: string;
  adsterraPopunder?: string;
  adsterraSocialBar?: string;
  fbPage1?: string;
  fbPage2?: string;
  fbGroup?: string;
  instagram?: string;
  messenger?: string;
}

const defaultSettings: SiteSettings = {
  headerTitle: 'NJAC - Crush & Confession',
  footerTitle: 'NJAC - Crush & Confession',
  headerLogo: 'https://i.ibb.co/Vckn3C6D/1000032660.png',
  footerLogo: 'https://i.ibb.co/Vckn3C6D/1000032660.png',
  aboutUsText: 'Welcome to NJAC - Crush & Confession...',
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

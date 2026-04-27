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

const SettingsContext = createContext<SiteSettings>({});

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>({});

  useEffect(() => {
    async function loadSettings() {
      try {
        const snap = await getDoc(doc(db, 'settings', 'global'));
        if (snap.exists()) {
          setSettings(snap.data() as SiteSettings);
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

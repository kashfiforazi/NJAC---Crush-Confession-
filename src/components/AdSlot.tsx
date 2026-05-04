import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

interface AdSlotProps {
  type: 'native' | '728x90' | '300x250';
  className?: string;
}

export default function AdSlot({ type, className = "" }: AdSlotProps) {
  const { isAdmin } = useAuth();
  const settings = useSettings();
  const adContainerRef = useRef<HTMLDivElement>(null);
  
  const adCode = type === 'native' ? settings.adsterraNativeBanner 
               : type === '728x90' ? settings.adsterraBanner728x90 
               : settings.adsterraBanner300x250;

  useEffect(() => {
    if (!adCode || !adContainerRef.current) return;

    // Use a unique ID for this instance to prevent content flashing or script conflicts
    const slotId = `ad-slot-${type}-${Math.random().toString(36).substr(2, 9)}`;
    adContainerRef.current.innerHTML = '';
    
    // Create a local container for this batch
    const container = document.createElement('div');
    container.id = slotId;
    container.innerHTML = adCode;
    
    const fragments = Array.from(container.childNodes);
    const scriptsToLoad: HTMLScriptElement[] = [];

    fragments.forEach(node => {
      if (node.nodeName === 'SCRIPT') {
        const oldScript = node as HTMLScriptElement;
        const newScript = document.createElement('script');
        
        // Copy all attributes (including src, type, etc.)
        Array.from(oldScript.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });
        
        if (oldScript.innerHTML) {
          newScript.textContent = oldScript.innerHTML;
        }
        
        scriptsToLoad.push(newScript);
      } else {
        adContainerRef.current?.appendChild(node.cloneNode(true));
      }
    });

    // Append scripts after elements to ensure IDs are available if script looks for them
    scriptsToLoad.forEach(script => {
      adContainerRef.current?.appendChild(script);
    });

  }, [adCode, type]);

  if (!adCode && !isAdmin) return null;

  return (
    <div className={`my-8 rounded-2xl overflow-hidden ${className}`}>
      {isAdmin && !adCode ? (
        <div className="p-8 border-2 border-dashed border-primary-500/50 bg-primary-500/5 flex flex-col items-center justify-center text-center">
          <div className="bg-primary-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 shadow-lg shadow-primary-500/20">
            Adsterra Slot: {type}
          </div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
            Configure this code in Admin Settings
          </p>
        </div>
      ) : (
        <div ref={adContainerRef} className="flex justify-center items-center min-h-[50px]">
          {!adCode && <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Space for Ad</span>}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-18 md:bottom-6 right-4 z-40 bg-charcoal-900 border-2 border-construction-500 rounded-2xl p-4 shadow-2xl max-w-sm animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-construction-500/20 text-construction-400 p-2 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black uppercase text-construction-400">Install PWA App</div>
            <div className="text-sm font-bold text-white">Construction Khata AI</div>
            <div className="text-[11px] text-charcoal-300">Works 100% offline on site</div>
          </div>
        </div>
        <button onClick={() => setIsVisible(false)} className="text-charcoal-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center space-x-2">
        <button
          onClick={handleInstall}
          className="flex-1 bg-construction-500 hover:bg-construction-400 text-charcoal-950 font-black py-2 rounded-xl text-xs transition shadow active:scale-95"
        >
          Install to Phone / Desktop
        </button>
      </div>
    </div>
  );
};

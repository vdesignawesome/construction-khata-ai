// Google AdSense Monetization Service for Construction Khata AI

export interface AdSenseConfig {
  client: string; // e.g. "ca-pub-1234567890123456"
  slotId?: string; // e.g. "9876543210"
  isEnabled: boolean;
}

const STORAGE_KEY_ADSENSE = 'construction_khata_adsense_config';

export function getSavedAdSenseConfig(): AdSenseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADSENSE);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  const metaEnv = (import.meta as any).env || {};
  return {
    client: metaEnv.VITE_ADSENSE_CLIENT_ID || 'ca-pub-6240364688256006',
    slotId: metaEnv.VITE_ADSENSE_SLOT_ID || '',
    isEnabled: true
  };
}

export function saveAdSenseConfig(cfg: AdSenseConfig) {
  try {
    localStorage.setItem(STORAGE_KEY_ADSENSE, JSON.stringify(cfg));
    if (cfg.client && cfg.isEnabled) {
      loadAdSenseScript(cfg.client);
    }
  } catch (e) {}
}

export function loadAdSenseScript(clientId: string) {
  if (!clientId || typeof document === 'undefined') return;
  const cleanId = clientId.trim();
  if (!cleanId.startsWith('ca-pub-') && !cleanId.startsWith('pub-')) return;

  const existing = document.querySelector(`script[src*="pagead2.googlesyndication.com"]`);
  if (existing) return;

  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${cleanId.startsWith('ca-pub-') ? cleanId : 'ca-' + cleanId}`;
  document.head.appendChild(script);
}

import React, { useEffect, useRef } from 'react';
import { Sparkles, Crown, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useSaasStore } from '../../store/useSaasStore';
import { getSavedAdSenseConfig, loadAdSenseScript } from '../../services/adsense';

interface GoogleAdBannerProps {
  format?: 'banner' | 'sidebar' | 'compact';
  slotId?: string;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

export const GoogleAdBanner: React.FC<GoogleAdBannerProps> = ({
  format = 'banner',
  slotId,
  className = ''
}) => {
  const { currentTenant, currentUser, setPaywallModalOpen } = useSaasStore();
  const adRef = useRef<HTMLModElement>(null);

  // Super Admin never sees ads
  if (currentUser?.isSuperAdmin) {
    return null;
  }

  // Pro & Enterprise subscribers get 100% Ad-Free Experience!
  const isPaidPlan =
    currentTenant?.plan === 'pro' ||
    currentTenant?.plan === 'pro_monthly' ||
    currentTenant?.plan === 'pro_yearly' ||
    currentTenant?.plan === 'enterprise';

  if (isPaidPlan) {
    return null;
  }

  const config = getSavedAdSenseConfig();
  if (!config.isEnabled) {
    return null;
  }

  const effectiveClient = config.client;
  const effectiveSlot = slotId || config.slotId;

  useEffect(() => {
    if (effectiveClient) {
      loadAdSenseScript(effectiveClient);
      try {
        if (typeof window !== 'undefined' && effectiveSlot) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (e) {
        console.warn('AdSense push error:', e);
      }
    }
  }, [effectiveClient, effectiveSlot]);

  // If live Google AdSense is fully configured with client & slot ID
  if (effectiveClient && effectiveSlot) {
    return (
      <div className={`overflow-hidden rounded-2xl bg-charcoal-900 border border-charcoal-800 p-2 text-center ${className}`}>
        <div className="text-[10px] text-charcoal-500 uppercase tracking-widest font-bold mb-1">
          Advertisement
        </div>
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block', minHeight: format === 'sidebar' ? '120px' : '90px' }}
          data-ad-client={effectiveClient}
          data-ad-slot={effectiveSlot}
          data-ad-format={format === 'sidebar' ? 'rectangle' : 'auto'}
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // Pre-approval / Fallback Sponsor Card (Monetizes free users by driving Pro upgrades!)
  if (format === 'sidebar') {
    return (
      <div className={`bg-gradient-to-br from-charcoal-900 via-charcoal-900 to-amber-950/40 border border-construction-500/30 rounded-2xl p-3.5 space-y-2 shadow-lg ${className}`}>
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase font-black bg-construction-500/20 text-construction-400 px-1.5 py-0.5 rounded border border-construction-500/30 tracking-wider">
            Sponsored • Free Plan
          </span>
          <Crown className="w-3.5 h-3.5 text-construction-400" />
        </div>
        <p className="text-[11px] font-bold text-white leading-snug">
          Go Ad-Free with Pro
        </p>
        <p className="text-[10px] text-charcoal-400 leading-tight">
          Unlock unlimited construction sites, priority support, and remove all sponsor cards.
        </p>
        <button
          type="button"
          onClick={() => setPaywallModalOpen(true)}
          className="w-full bg-construction-500 hover:bg-construction-400 text-charcoal-950 font-black py-1.5 rounded-xl text-[11px] flex items-center justify-center gap-1 transition active:scale-95 shadow"
        >
          <span>Upgrade (₹499)</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-charcoal-900 via-charcoal-950 to-charcoal-900 border border-charcoal-800 hover:border-construction-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md transition ${className}`}>
      <div className="flex items-center space-x-3.5">
        <div className="w-11 h-11 rounded-2xl bg-construction-500/15 border border-construction-500/30 text-construction-400 flex items-center justify-center shrink-0 shadow-inner">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-black bg-charcoal-800 text-charcoal-300 px-2 py-0.5 rounded border border-charcoal-700">
              Google Ads Partner Space
            </span>
            <span className="text-xs text-construction-400 font-bold">• 120-Day Free Plan Active</span>
          </div>
          <h4 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
            Upgrade to Pro for Unlimited Sites & 100% Ad-Free Experience
          </h4>
          <p className="text-xs text-charcoal-400 mt-0.5">
            Remove all advertisements, get unlimited projects, team collaboration, and priority WhatsApp support.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setPaywallModalOpen(true)}
          className="bg-construction-500 hover:bg-construction-400 text-charcoal-950 font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-construction-950"
        >
          <Crown className="w-4 h-4 fill-charcoal-950" />
          <span>Remove Ads • Upgrade</span>
        </button>
      </div>
    </div>
  );
};

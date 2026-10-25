import React, { useState } from 'react';
import { Lock, ShieldAlert } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const PinLockModal: React.FC = () => {
  const { isLocked, isUnlockedForSession, unlockApp, settings } = useAppStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isLocked || isUnlockedForSession || !settings?.isLockEnabled) {
    return null;
  }

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const success = unlockApp(pin);
    if (!success) {
      setError(true);
      setPin('');
    } else {
      setError(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950 backdrop-blur-xl">
      <div className="bg-charcoal-900 border-2 border-construction-500/50 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95">
        <div className="w-14 h-14 rounded-2xl bg-construction-500/10 border border-construction-500/40 text-construction-400 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-xl font-black text-white">Construction Khata AI</h2>
          <p className="text-xs text-charcoal-400 mt-1">Application is locked. Enter your 4-digit PIN.</p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <input
            type="password"
            maxLength={4}
            autoFocus
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(false);
            }}
            placeholder="****"
            className="w-full bg-charcoal-800 border-2 border-charcoal-700 rounded-xl p-3 text-2xl text-center text-white tracking-widest font-black focus:outline-none focus:border-construction-500"
          />

          {error && (
            <div className="text-xs text-red-400 font-bold flex items-center justify-center gap-1">
              <ShieldAlert className="w-4 h-4" />
              <span>Incorrect PIN. Please try again.</span>
            </div>
          )}

          <button
            type="submit"
            disabled={pin.length < 4}
            className="w-full bg-construction-500 hover:bg-construction-400 text-charcoal-950 font-black py-3 rounded-xl text-sm transition shadow disabled:opacity-50"
          >
            Unlock Application
          </button>
        </form>
      </div>
    </div>
  );
};

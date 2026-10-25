import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Mic,
  Boxes,
  MoreHorizontal,
  ShoppingBag,
  CreditCard,
  Receipt,
  HardHat,
  FileBarChart,
  Search,
  Database,
  Settings,
  X
} from 'lucide-react';
import { useAppStore, type NavigationTab } from '../../store/useAppStore';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, setAiModalOpen } = useAppStore();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const moreItems: Array<{ id: NavigationTab; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'purchases', label: 'Purchases (Bills)', icon: ShoppingBag },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'expenses', label: 'Site Expenses', icon: Receipt },
    { id: 'labour', label: 'Labour Work', icon: HardHat },
    { id: 'reports', label: 'Reports & Export', icon: FileBarChart },
    { id: 'search', label: 'Search Site', icon: Search },
    { id: 'backup', label: 'Backup & Restore', icon: Database },
    { id: 'settings', label: 'Settings & Tests', icon: Settings },
  ];

  return (
    <>
      {/* More items drawer for mobile */}
      {isMoreOpen && (
        <div
          onClick={() => setIsMoreOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
        />
      )}

      {isMoreOpen && (
        <div className="fixed bottom-16 inset-x-0 bg-charcoal-900 border-t border-charcoal-800 rounded-t-2xl z-50 p-4 shadow-2xl md:hidden animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-charcoal-800 mb-3">
            <span className="text-sm font-bold text-white">More Modules</span>
            <button
              onClick={() => setIsMoreOpen(false)}
              className="p-1 text-charcoal-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {moreItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMoreOpen(false);
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl transition ${
                    isActive
                      ? 'bg-construction-500/20 text-construction-400 font-bold'
                      : 'text-charcoal-300 hover:bg-charcoal-800'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-[11px] text-center leading-tight line-clamp-2">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Bottom Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-charcoal-950/95 backdrop-blur border-t border-charcoal-800 z-40 px-2 py-1 flex items-center justify-around shadow-lg">
        {/* Home */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center py-1.5 px-3 rounded-lg transition ${
            activeTab === 'dashboard' ? 'text-construction-400 font-bold' : 'text-charcoal-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        {/* Accounts */}
        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex flex-col items-center py-1.5 px-3 rounded-lg transition ${
            activeTab === 'accounts' ? 'text-construction-400 font-bold' : 'text-charcoal-400'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Accounts</span>
        </button>

        {/* Floating Center AI Button */}
        <button
          onClick={() => setAiModalOpen(true)}
          className="flex flex-col items-center -mt-5 group"
        >
          <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-construction-600 via-construction-500 to-amber-400 text-charcoal-950 flex items-center justify-center shadow-lg shadow-construction-500/30 border-2 border-charcoal-950 group-active:scale-95 transition">
            <Mic className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black text-construction-400 mt-1">AI Entry</span>
        </button>

        {/* Stock / Materials */}
        <button
          onClick={() => setActiveTab('materials')}
          className={`flex flex-col items-center py-1.5 px-3 rounded-lg transition ${
            activeTab === 'materials' ? 'text-construction-400 font-bold' : 'text-charcoal-400'
          }`}
        >
          <Boxes className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Stock</span>
        </button>

        {/* More */}
        <button
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className={`flex flex-col items-center py-1.5 px-3 rounded-lg transition ${
            isMoreOpen ? 'text-construction-400 font-bold' : 'text-charcoal-400'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">More</span>
        </button>
      </div>
    </>
  );
};

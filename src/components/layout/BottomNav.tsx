import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  Receipt,
  MoreHorizontal,
  Users,
  Boxes,
  HardHat,
  FileBarChart,
  Search,
  Database,
  Settings,
  Mic,
  X
} from 'lucide-react';
import { useAppStore, type NavigationTab } from '../../store/useAppStore';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, setAiModalOpen } = useAppStore();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const moreItems: Array<{ id?: NavigationTab; label: string; icon: React.FC<{ className?: string }>; action?: () => void }> = [
    { id: 'accounts', label: 'Accounts (Parties)', icon: Users },
    { id: 'materials', label: 'Stock & Inventory', icon: Boxes },
    { id: 'labour', label: 'Labour Work', icon: HardHat },
    { id: 'reports', label: 'Reports & Export', icon: FileBarChart },
    { id: 'search', label: 'Search Site', icon: Search },
    { id: 'backup', label: 'Backup & Restore', icon: Database },
    { id: 'settings', label: 'Settings', icon: Settings },
    { label: 'AI Voice Entry', icon: Mic, action: () => setAiModalOpen(true) }
  ];

  return (
    <>
      {/* More items drawer for mobile */}
      {isMoreOpen && (
        <div
          onClick={() => setIsMoreOpen(false)}
          className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-sm animate-in fade-in duration-150"
        />
      )}

      {isMoreOpen && (
        <div className="fixed bottom-16 inset-x-0 bg-charcoal-900 border-t border-charcoal-800 rounded-t-3xl z-50 p-4 shadow-2xl md:hidden animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-charcoal-800 mb-3 px-1">
            <span className="text-sm font-bold text-white">More Modules</span>
            <button
              onClick={() => setIsMoreOpen(false)}
              className="p-1.5 text-charcoal-400 hover:text-white rounded-lg hover:bg-charcoal-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2 pb-2">
            {moreItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = item.id ? activeTab === item.id : false;
              return (
                <button
                  key={item.id || idx}
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else if (item.id) {
                      setActiveTab(item.id);
                    }
                    setIsMoreOpen(false);
                  }}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl transition active:scale-95 ${
                    isActive
                      ? 'bg-construction-500/20 text-construction-400 font-bold border border-construction-500/30'
                      : 'text-charcoal-300 hover:bg-charcoal-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1 text-construction-400" />
                  <span className="text-[10px] text-center leading-tight line-clamp-2">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Bottom Bar: Exact Order -> Home, Purchase Bill, Payment, Site Expenses, More */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-charcoal-950/98 backdrop-blur border-t border-charcoal-800/80 z-40 px-1 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom">
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 flex flex-col items-center py-1 px-1 rounded-xl transition active:scale-95 ${
            activeTab === 'dashboard' ? 'text-construction-400 font-bold' : 'text-charcoal-400 hover:text-charcoal-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Home</span>
        </button>

        {/* 2. Purchase Bill */}
        <button
          type="button"
          onClick={() => setActiveTab('purchases')}
          className={`flex-1 flex flex-col items-center py-1 px-1 rounded-xl transition active:scale-95 ${
            activeTab === 'purchases' ? 'text-construction-400 font-bold' : 'text-charcoal-400 hover:text-charcoal-200'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Purchase Bill</span>
        </button>

        {/* 3. Payment */}
        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`flex-1 flex flex-col items-center py-1 px-1 rounded-xl transition active:scale-95 ${
            activeTab === 'payments' ? 'text-construction-400 font-bold' : 'text-charcoal-400 hover:text-charcoal-200'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Payment</span>
        </button>

        {/* 4. Site Expenses */}
        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`flex-1 flex flex-col items-center py-1 px-1 rounded-xl transition active:scale-95 ${
            activeTab === 'expenses' ? 'text-construction-400 font-bold' : 'text-charcoal-400 hover:text-charcoal-200'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Site Expenses</span>
        </button>

        {/* 5. More */}
        <button
          type="button"
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className={`flex-1 flex flex-col items-center py-1 px-1 rounded-xl transition active:scale-95 ${
            isMoreOpen ? 'text-construction-400 font-bold' : 'text-charcoal-400 hover:text-charcoal-200'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">More</span>
        </button>
      </div>
    </>
  );
};

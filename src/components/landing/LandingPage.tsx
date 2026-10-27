import React from 'react';
import {
  Building2,
  Sparkles,
  Camera,
  Boxes,
  Users,
  CreditCard,
  WifiOff,
  Mic,
  FileText,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Download,
  Layers,
  Star,
  ChevronRight,
  Receipt,
  AlertTriangle,
  Zap,
  XCircle,
  Check,
  FileX2,
  FileCheck2
} from 'lucide-react';
import { BRAND_CONFIG } from '../../config/branding';
import { useSaasStore } from '../../store/useSaasStore';

interface LandingPageProps {
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const { setAuthModalOpen, loginWithGoogle, isLoading } = useSaasStore();

  const handleGoogleLoginClick = async () => {
    try {
      await loginWithGoogle();
      onEnterApp();
    } catch (e) {
      setAuthModalOpen(true);
    }
  };

  const handleOpenAuth = () => {
    setAuthModalOpen(true);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const features = [
    {
      icon: Camera,
      title: 'AI Photo Bill & Invoice Scanner',
      tagline: 'Gemini 1.5 Flash Vision OCR',
      desc: 'Snap a quick photo of handwritten slips, challans, or printed GST bills. AI auto-extracts supplier name, date, line items, rates, and totals in 2 seconds.',
      highlight: 'Vision AI Powered'
    },
    {
      icon: Building2,
      title: 'Site-First Project Isolation',
      tagline: 'Strict Multi-Site Accounting',
      desc: 'Vikas Nagar, Sector 35, Model Town — each project maintains its own isolated accounts, inventory, and expenses. Zero data cross-contamination.',
      highlight: 'Project First'
    },
    {
      icon: Boxes,
      title: 'Material Inventory & Live Stock',
      tagline: 'Cement, Steel, Bricks, Sanitary',
      desc: 'Track purchases (In), daily usage (Out), and current warehouse balances in real time. Eliminate material theft and unexplained site wastage.',
      highlight: 'Real-Time Stock'
    },
    {
      icon: Users,
      title: 'Supplier & Labour Ledgers',
      tagline: 'Party Balances & Due Tracking',
      desc: 'Maintain transparent accounts for all material suppliers and labor contractors. Track delivery invoices, cash/UPI payments, and net outstanding dues.',
      highlight: 'Zero Accounting Hassle'
    },
    {
      icon: WifiOff,
      title: '100% Pure Offline Architecture',
      tagline: 'Runs Anywhere Without Internet',
      desc: 'Engineered with local-first IndexedDB storage. Works continuously inside basements and remote job sites with automatic cloud sync when reconnected.',
      highlight: 'Local-First'
    },
    {
      icon: Mic,
      title: 'Voice-to-Accounting Assistant',
      tagline: 'Hands-Free Entry in English & Hindi',
      desc: 'Speak transactions naturally: "Received 50 bags of cement for 18000 from Sharma Hardware". AI parses the record and files it in seconds.',
      highlight: 'Hands-Free'
    },
    {
      icon: FileText,
      title: '1-Click WhatsApp PDF Statements',
      tagline: 'Client & Supplier Reports',
      desc: 'Export beautifully formatted project cost summaries, material purchases, and party ledger statements. Ready to download or share via WhatsApp.',
      highlight: 'Instant Share'
    },
    {
      icon: Smartphone,
      title: 'Real-Time Mobile & Desktop Sync',
      tagline: 'Multi-Device Cloud Sync',
      desc: 'Site supervisors log entries from smartphones in the field; contractors and project owners view live updates from desktops in the office.',
      highlight: 'Multi-Device'
    }
  ];

  const targetAudience = [
    {
      title: 'Civil Contractors & Builders',
      role: 'General & Commercial Contractors',
      desc: 'Manage multiple concurrent construction sites, procurement logistics, and subcontractor teams with complete financial control.'
    },
    {
      title: 'Specialized Sub-Contractors',
      role: 'Plumbing, Electrical, Tile, Painting',
      desc: 'Trade specialists tracking material bills, progress invoicing, and outstanding receivables across active project contracts.'
    },
    {
      title: 'Site Supervisors & Engineers',
      role: 'Job-Site Project Managers',
      desc: 'Log incoming material deliveries on site instantly from mobile, monitor warehouse stock balances, and track daily labor.'
    },
    {
      title: 'Hardware & Material Suppliers',
      role: 'Building Material Vendors & Dealers',
      desc: 'Monitor supplies delivered across different client construction sites with transparent, real-time ledger accounting.'
    },
    {
      title: 'Individual Home Owners',
      role: 'Self-Builders & Property Owners',
      desc: 'Homeowners building their dream property who demand complete transparency over every rupee spent on cement, steel, and labor.'
    }
  ];

  return (
    <div className="min-h-screen bg-charcoal-950 text-slate-100 flex flex-col font-sans selection:bg-construction-500 selection:text-charcoal-950">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-charcoal-950/90 backdrop-blur-md border-b border-charcoal-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-charcoal-900 border border-construction-500/40 p-1.5 flex items-center justify-center shadow">
            <img src="/logo.svg" alt="Construction Khata AI" className="w-7 h-7" />
          </div>
          <div>
            <div className="text-sm font-black tracking-wide text-white flex items-center gap-1.5">
              CONSTRUCTION
              <span className="text-xs bg-construction-500 text-charcoal-950 px-1.5 py-0.5 rounded font-black">
                AI
              </span>
            </div>
            <div className="text-[10px] text-amber-400 font-bold tracking-wider">
              by {BRAND_CONFIG.parentBrand} Ecosystem
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center space-x-6 text-xs font-bold text-charcoal-300">
          <button onClick={() => scrollToSection('features')} className="hover:text-white transition">
            Features
          </button>
          <button onClick={() => scrollToSection('who-it-is-for')} className="hover:text-white transition">
            Who It's For
          </button>
          <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition">
            Launch Offer
          </button>
        </nav>

        {/* Auth CTA Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onEnterApp}
            className="hidden sm:inline-flex text-xs font-bold text-charcoal-400 hover:text-white px-3 py-2 rounded-xl transition"
          >
            Direct App / Demo
          </button>

          <button
            onClick={handleOpenAuth}
            className="bg-gradient-to-r from-construction-500 to-amber-500 hover:from-construction-400 hover:to-amber-400 text-charcoal-950 font-black px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm transition shadow-lg shadow-construction-500/10 active:scale-95 flex items-center gap-2"
          >
            <span>Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-8 max-w-6xl mx-auto w-full text-center">
        {/* Glow backdrop effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-construction-500/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-charcoal-900 border border-construction-500/30 text-xs font-bold text-construction-300 mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>India's Premier AI Construction Khata &amp; Material Inventory</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
          Construction Site Accounting,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-construction-400 via-amber-300 to-construction-500">
            Supercharged with Vision AI
          </span>
        </h1>

        <p className="mt-5 text-sm sm:text-base md:text-lg text-charcoal-300 max-w-2xl mx-auto leading-relaxed">
          Engineered specifically for civil contractors, builders, and site supervisors. Snap photo bills to auto-fill invoices, track real-time cement &amp; steel stock, and manage labor accounts — <strong>100% functional even without internet!</strong>
        </p>

        {/* Hero CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
          <button
            onClick={handleGoogleLoginClick}
            disabled={isLoading}
            className="w-full sm:w-auto bg-white hover:bg-slate-100 text-charcoal-950 font-black px-6 py-3.5 rounded-2xl text-sm transition shadow-xl flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-50"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Sign in with Google (Free)</span>
          </button>

          <button
            onClick={onEnterApp}
            className="w-full sm:w-auto bg-charcoal-900 hover:bg-charcoal-850 text-slate-200 border border-charcoal-700 font-bold px-6 py-3.5 rounded-2xl text-sm transition shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Explore Dashboard</span>
            <ArrowRight className="w-4 h-4 text-construction-400" />
          </button>
        </div>

        {/* Trust Badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-charcoal-400 font-semibold">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>1 Site Free for 4 Months</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-construction-400" />
            <span>100% Pure Offline-First Ready</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            <span>Gemini Vision AI Scanner</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
            <span>No Credit Card Required</span>
          </div>
        </div>

        {/* Dashboard Visual Preview Card */}
        <div className="mt-12 sm:mt-16 bg-charcoal-900/90 border border-charcoal-700/80 rounded-3xl p-4 sm:p-8 shadow-2xl text-left max-w-4xl mx-auto backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-charcoal-800 gap-3">
            <div>
              <div className="text-[10px] text-construction-400 font-black uppercase tracking-wider">
                Live Project Preview
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">Vikas Nagar • Residential Villa</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
                ● Live Active Site
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-charcoal-800 text-charcoal-300">
                100% Offline Synced
              </span>
            </div>
          </div>

          {/* Quick metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
            <div className="bg-charcoal-950/80 border border-charcoal-800 rounded-2xl p-3.5">
              <div className="text-[11px] text-charcoal-400 font-medium">Total Project Cost</div>
              <div className="text-base sm:text-xl font-black text-white mt-1">₹14,85,400</div>
              <div className="text-[10px] text-emerald-400 font-bold mt-1">Within Budget</div>
            </div>

            <div className="bg-charcoal-950/80 border border-charcoal-800 rounded-2xl p-3.5">
              <div className="text-[11px] text-charcoal-400 font-medium">Cement Stock</div>
              <div className="text-base sm:text-xl font-black text-amber-400 mt-1">140 Bags</div>
              <div className="text-[10px] text-charcoal-400 mt-1">350 Used on Site</div>
            </div>

            <div className="bg-charcoal-950/80 border border-charcoal-800 rounded-2xl p-3.5">
              <div className="text-[11px] text-charcoal-400 font-medium">Steel Stock</div>
              <div className="text-base sm:text-xl font-black text-blue-400 mt-1">2.4 Tons</div>
              <div className="text-[10px] text-charcoal-400 mt-1">Tata Tiscon TMT</div>
            </div>

            <div className="bg-charcoal-950/80 border border-charcoal-800 rounded-2xl p-3.5">
              <div className="text-[11px] text-charcoal-400 font-medium">Supplier Due</div>
              <div className="text-base sm:text-xl font-black text-red-400 mt-1">₹42,000</div>
              <div className="text-[10px] text-charcoal-400 mt-1">Sharma Hardware</div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Graphical Comparison: The Old Way vs The AI Way */}
      <section className="py-16 sm:py-20 bg-charcoal-900/60 border-y border-charcoal-800/80 px-4 sm:px-8 relative overflow-hidden">
        {/* Subtle background ambient glow */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-72 h-72 bg-red-500/5 blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-72 h-72 bg-emerald-500/5 blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-charcoal-800 border border-charcoal-700 text-xs font-bold text-amber-400 mb-3 shadow-sm">
              <Zap className="w-3.5 h-3.5" />
              <span>Visual Comparison • The Problem vs The Solution</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Say Goodbye to Lost Paper Receipts &amp; Messy Site Notebooks
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-charcoal-400 mt-2 max-w-2xl mx-auto">
              See the exact difference between traditional job-site paper chaos and instant AI automation.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            {/* LEFT GRAPHIC CARD: The Traditional Paper Pain */}
            <div className="bg-gradient-to-b from-charcoal-900 via-charcoal-900/90 to-red-950/20 border-2 border-red-900/40 hover:border-red-800/60 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden transition group">
              {/* Top Card Badge */}
              <div className="flex items-center justify-between pb-4 border-b border-red-900/30">
                <div className="flex items-center gap-2 text-red-400 font-black text-xs sm:text-sm uppercase tracking-wider">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>The Traditional Paper Chaos</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800/60">
                  High Risk of Loss
                </span>
              </div>

              {/* Graphic: Crumpled Physical Paper Receipt Mockup */}
              <div className="my-6 relative">
                <div className="relative mx-auto max-w-sm bg-amber-50/95 text-slate-800 rounded-2xl p-5 shadow-2xl border border-amber-200/80 -rotate-1 group-hover:rotate-0 transition-transform duration-300">
                  {/* Crumpled Receipt Header with jagged tear */}
                  <div className="border-b-2 border-dashed border-slate-300 pb-3 mb-3 flex items-start justify-between">
                    <div>
                      <div className="font-mono text-xs font-black tracking-wider text-slate-900 uppercase">
                        SHARMA HARDWARE &amp; SANITARY
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">Challan # ???? • Date: 14/??/2026</div>
                    </div>
                    {/* Disputed Red Stamp */}
                    <div className="border-2 border-red-600 text-red-600 font-black text-[10px] uppercase px-2 py-0.5 rounded -rotate-12 tracking-widest bg-red-100/80 shadow-sm">
                      LOST RECEIPT
                    </div>
                  </div>

                  {/* Scribbled blurred line items */}
                  <div className="font-mono text-xs space-y-2 text-slate-700">
                    <div className="flex justify-between items-center text-slate-400 line-through">
                      <span>Cement (UltraTech) 50 Bags</span>
                      <span>₹19,000</span>
                    </div>
                    <div className="flex justify-between items-center text-red-700 font-bold bg-red-100/70 p-1 rounded">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-600" />
                        <span>Disputed: Was it 40 or 50 bags?</span>
                      </span>
                      <span>???</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 text-[11px]">
                      <span>Binding Wire 10kg</span>
                      <span>₹850</span>
                    </div>
                  </div>

                  {/* Coffee stain / water damage visual graphic */}
                  <div className="absolute -bottom-3 -right-3 w-16 h-16 rounded-full bg-amber-700/10 border border-amber-600/20 pointer-events-none blur-xs" />

                  {/* Torn bottom warning bar */}
                  <div className="mt-4 pt-2.5 border-t border-slate-300 flex items-center justify-between text-[10px] text-red-600 font-bold">
                    <span>⚠️ Crumpled in Pocket</span>
                    <span>No Stock Record</span>
                  </div>
                </div>

                {/* Floating Warning Callouts */}
                <div className="absolute -top-3 -left-2 bg-charcoal-950/90 border border-red-800 text-red-300 text-[10px] font-bold px-2.5 py-1 rounded-xl shadow-lg flex items-center gap-1.5 backdrop-blur-sm">
                  <FileX2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Missing Paper Receipts</span>
                </div>

                <div className="absolute -bottom-3 -right-2 bg-charcoal-950/90 border border-red-800 text-red-300 text-[10px] font-bold px-2.5 py-1 rounded-xl shadow-lg flex items-center gap-1.5 backdrop-blur-sm">
                  <WifiOff className="w-3.5 h-3.5 text-red-400" />
                  <span>No Network = App Frozen</span>
                </div>
              </div>

              {/* Graphic Feature Pills (The Pain Points) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4 border-t border-red-900/30">
                <div className="bg-red-950/40 border border-red-900/40 rounded-xl p-2.5 text-center">
                  <div className="text-red-400 text-xs font-black">Lost Bills</div>
                  <div className="text-[10px] text-charcoal-400 mt-0.5">Torn or lost in work pocket</div>
                </div>
                <div className="bg-red-950/40 border border-red-900/40 rounded-xl p-2.5 text-center">
                  <div className="text-red-400 text-xs font-black">Stock Blindspot</div>
                  <div className="text-[10px] text-charcoal-400 mt-0.5">Unexplained theft &amp; wastage</div>
                </div>
                <div className="bg-red-950/40 border border-red-900/40 rounded-xl p-2.5 text-center">
                  <div className="text-red-400 text-xs font-black">Month-End Dispute</div>
                  <div className="text-[10px] text-charcoal-400 mt-0.5">Hours of stressful ledger fights</div>
                </div>
              </div>
            </div>

            {/* RIGHT GRAPHIC CARD: The Construction Khata AI Way */}
            <div className="bg-gradient-to-b from-charcoal-900 via-charcoal-900/90 to-emerald-950/20 border-2 border-emerald-500/50 hover:border-emerald-400 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden transition group ring-1 ring-emerald-500/20">
              {/* Top Card Badge */}
              <div className="flex items-center justify-between pb-4 border-b border-emerald-800/40">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-xs sm:text-sm uppercase tracking-wider">
                  <FileCheck2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>The Construction Khata AI Way</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/80 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Vision AI Verified</span>
                </span>
              </div>

              {/* Graphic: Smartphone Camera HUD Viewfinder with OCR bounding boxes */}
              <div className="my-6 relative">
                <div className="relative mx-auto max-w-sm bg-charcoal-950 border-2 border-charcoal-700 rounded-2xl p-4 shadow-2xl overflow-hidden group-hover:border-construction-500/60 transition-colors duration-300">
                  {/* Viewfinder corner brackets */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-construction-400" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-construction-400" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-construction-400" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-construction-400" />

                  {/* Animated Laser Scanning Line */}
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#f59e0b] animate-pulse pointer-events-none" />

                  {/* Inside HUD: OCR Target Detection Boxes */}
                  <div className="space-y-2.5 text-xs font-mono">
                    {/* Bounding Box 1: Supplier */}
                    <div className="border border-emerald-500/70 bg-emerald-950/60 p-2 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-[11px]">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Supplier: Sharma Hardware</span>
                      </div>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-sans font-bold">
                        Party Matched
                      </span>
                    </div>

                    {/* Bounding Box 2: Line Items */}
                    <div className="border border-cyan-500/70 bg-cyan-950/60 p-2 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-cyan-200 text-[11px]">
                        <Boxes className="w-3.5 h-3.5 text-cyan-400" />
                        <span>UltraTech Cement (50 Bags)</span>
                      </div>
                      <span className="text-[10px] font-bold text-cyan-300">₹19,000</span>
                    </div>

                    {/* Bounding Box 3: Total & Action Confirmation */}
                    <div className="border border-amber-500/70 bg-amber-950/50 p-2 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-300 font-bold text-[11px]">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Auto-Filed to: Vikas Nagar Site</span>
                      </div>
                      <span className="text-[9px] bg-amber-500 text-charcoal-950 px-2 py-0.5 rounded font-black font-sans uppercase">
                        2s Done
                      </span>
                    </div>
                  </div>

                  {/* Live Stock Notification Pill inside HUD */}
                  <div className="mt-3 pt-2.5 border-t border-charcoal-800 flex items-center justify-between text-[10px] text-emerald-400 font-bold font-sans">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Live Stock: +50 Bags Added</span>
                    </span>
                    <span className="text-charcoal-400">100% Offline Ready ⚡</span>
                  </div>
                </div>

                {/* Floating AI Callouts */}
                <div className="absolute -top-3 -left-2 bg-charcoal-950/95 border border-emerald-500 text-emerald-300 text-[10px] font-black px-2.5 py-1 rounded-xl shadow-lg flex items-center gap-1.5 backdrop-blur-sm">
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Gemini Vision OCR</span>
                </div>

                <div className="absolute -bottom-3 -right-2 bg-charcoal-950/95 border border-emerald-500 text-emerald-300 text-[10px] font-black px-2.5 py-1 rounded-xl shadow-lg flex items-center gap-1.5 backdrop-blur-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Zero Network Required</span>
                </div>
              </div>

              {/* Graphic Feature Pills (The Superpowers) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4 border-t border-emerald-800/40">
                <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-2.5 text-center">
                  <div className="text-emerald-400 text-xs font-black">2-Second OCR</div>
                  <div className="text-[10px] text-charcoal-400 mt-0.5">Snap photo, zero typing</div>
                </div>
                <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-2.5 text-center">
                  <div className="text-emerald-400 text-xs font-black">Live Stock Balance</div>
                  <div className="text-[10px] text-charcoal-400 mt-0.5">Every bag &amp; ton tracked</div>
                </div>
                <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-2.5 text-center">
                  <div className="text-emerald-400 text-xs font-black">1-Click Statements</div>
                  <div className="text-[10px] text-charcoal-400 mt-0.5">Instant WhatsApp PDF</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-xs font-black uppercase tracking-wider text-construction-400 mb-2">
            Powerful Capabilities
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            Everything Required to Manage a Construction Job Site
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-400 mt-2">
            No complex accounting jargon. Any contractor or site engineer can master it in 5 minutes.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div
                key={i}
                className="bg-charcoal-900/70 border border-charcoal-800 hover:border-construction-500/50 rounded-2xl p-5 transition flex flex-col justify-between group hover:bg-charcoal-850"
              >
                <div>
                  <div className="w-11 h-11 rounded-xl bg-charcoal-800 group-hover:bg-construction-500/20 text-construction-400 flex items-center justify-center mb-4 transition">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400/90 block mb-1">
                    {feat.highlight}
                  </span>
                  <h3 className="text-base font-extrabold text-white leading-snug mb-2">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-charcoal-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Who is this for Section */}
      <section id="who-it-is-for" className="py-16 bg-charcoal-900/40 border-y border-charcoal-800 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-12">
            <div className="text-xs font-black uppercase tracking-wider text-construction-400 mb-2">
              Target Audience
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Who Is Construction Khata AI Built For?
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-400 mt-2">
              Whether you oversee 1 custom villa or manage 20 commercial projects across the city.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {targetAudience.map((aud, i) => (
              <div key={i} className="bg-charcoal-950/70 border border-charcoal-800/80 rounded-2xl p-5 space-y-2">
                <div className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-construction-400" />
                  <span>{aud.title}</span>
                </div>
                <div className="text-[11px] font-bold text-amber-400/80">{aud.role}</div>
                <p className="text-xs text-charcoal-400 leading-relaxed">{aud.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / Launch Offer Section */}
      <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-8 max-w-4xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-4">
          <Star className="w-3.5 h-3.5 text-amber-400" />
          <span>Special Launch Offer</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-black text-white">
          1 Project Site Free for 4 Months
        </h2>
        <p className="mt-3 text-xs sm:text-sm text-charcoal-400 max-w-lg mx-auto">
          Start instantly without entering any credit card details. Includes all AI features, inventory tracking, and offline sync.
        </p>

        <div className="mt-10 grid md:grid-cols-2 gap-6 text-left max-w-2xl mx-auto">
          {/* Free 4M Plan */}
          <div className="bg-charcoal-900 border-2 border-construction-500 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl relative">
            <div className="absolute -top-3 right-6 bg-construction-500 text-charcoal-950 text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full">
              Launch Gift
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Starter Contractor</h3>
              <div className="text-3xl font-black text-white mt-2">
                ₹0 <span className="text-xs text-charcoal-400 font-normal">/ 120 Days (4 Months)</span>
              </div>
              <p className="text-xs text-charcoal-400 mt-1">Full features for 1 active construction project</p>
            </div>

            <ul className="space-y-2 text-xs text-charcoal-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>1 Active Construction Project Site</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>AI Photo Bill Scanner (Gemini Vision)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Cement, Steel &amp; Material Inventory</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% Pure Offline Access</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>WhatsApp PDF Reports &amp; Statements</span>
              </li>
            </ul>

            <button
              onClick={handleOpenAuth}
              className="w-full bg-construction-500 hover:bg-construction-400 text-charcoal-950 font-black py-3 rounded-xl text-xs sm:text-sm transition shadow-lg active:scale-95 text-center"
            >
              Start 4 Months Free
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-charcoal-950 border border-charcoal-800 rounded-3xl p-6 sm:p-8 space-y-5">
            <div>
              <h3 className="text-lg font-black text-white">Pro Contractor</h3>
              <div className="text-3xl font-black text-white mt-2">
                ₹499 <span className="text-xs text-charcoal-400 font-normal">/ month</span>
              </div>
              <p className="text-xs text-charcoal-400 mt-1">For growing contractors &amp; large builders</p>
            </div>

            <ul className="space-y-2 text-xs text-charcoal-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span><strong>Unlimited Sites</strong> (Active Projects)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Multi-Device Real-Time Cloud Sync</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Unlimited AI Bill Scanning</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Priority WhatsApp Support</span>
              </li>
            </ul>

            <button
              onClick={handleOpenAuth}
              className="w-full bg-charcoal-850 hover:bg-charcoal-800 text-white font-bold py-3 rounded-xl text-xs sm:text-sm transition border border-charcoal-700 active:scale-95 text-center"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
      </section>

      {/* OmniCraft Ecosystem Footer */}
      <footer className="mt-auto border-t border-charcoal-800 bg-charcoal-950 py-10 px-4 sm:px-8 text-center text-xs text-charcoal-400 space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-charcoal-900 border border-construction-500/40 p-1 flex items-center justify-center">
            <img src="/logo.svg" alt="Construction Khata AI" className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-white text-sm">Construction Khata AI</span>
          <span className="text-charcoal-600">•</span>
          <span className="text-amber-400 font-bold">{BRAND_CONFIG.parentBrand} Ecosystem</span>
        </div>

        <p className="max-w-md mx-auto text-charcoal-400 text-[11px]">
          Part of the OmniCraft Business Suite: Construction Khata AI • AI Sanitary Shop • OmniCraft 3D Portal.
        </p>

        <div className="pt-2 text-charcoal-400 text-[10px]">
          {BRAND_CONFIG.copyright}
        </div>
      </footer>
    </div>
  );
};

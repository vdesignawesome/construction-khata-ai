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
  Receipt
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
      title: 'AI फोटो बिल व पर्चा स्कैनर',
      tagline: 'Gemini 1.5 Flash Vision OCR',
      desc: 'कच्चे पर्चे या GST बिल की बस फोटो खींचो — सप्लायर, तारीख, आइटम, रेट और कुल अमाउंट AI अपने-आप भर देता है। 2 सेकंड में एंट्री!',
      highlight: 'AI Vision Powered'
    },
    {
      icon: Building2,
      title: 'साइट-वाइज़ प्रोजेक्ट मैनेजमेंट',
      tagline: 'Strict Site Isolation',
      desc: 'विकास नगर, सेक्टर 35, मॉडल टाउन — हर प्रोजेक्ट का अलग मटीरियल, अलग लेबर और अलग खर्च। कोई भी डेटा कभी मिक्स नहीं होगा।',
      highlight: 'Project First'
    },
    {
      icon: Boxes,
      title: 'मटीरियल इन्वेंट्री व लाइव स्टॉक',
      tagline: 'Cement, Steel, Bricks, Sanitary',
      desc: 'साइट पर कितना माल आया, कितना इस्तेमाल हुआ और आज गोदाम में कितना स्टॉक बाकी है। मटीरियल की चोरी और वेस्टेज बंद!',
      highlight: 'Real-Time Stock'
    },
    {
      icon: Users,
      title: 'सप्लायर और लेबर लेजर',
      tagline: 'Party Ledger & Due Tracking',
      desc: 'सप्लायर्स की डिलीवरी, दी गई पेमेंट (UPI/Cash/Cheque) और बाकी बकाया। लेबर हाजिरी और एडवांस का 100% पारदर्शी हिसाब।',
      highlight: 'No Accounting Hassle'
    },
    {
      icon: WifiOff,
      title: '100% प्योर ऑफलाइन आर्किटेक्चर',
      tagline: 'Works Anywhere Without Internet',
      desc: 'बेसमेंट, रिमोट विलेज या बिना नेटवर्क वाली साइट पर भी बेधड़क चलेगा। इंटरनेट आने पर ऑटोमैटिक बैकग्राउंड सिंक।',
      highlight: 'Local-First'
    },
    {
      icon: Mic,
      title: 'हिंदी व हिंग्लिश वॉइस AI एंट्री',
      tagline: 'Voice-to-Accounting',
      desc: 'बोलकर एंट्री दर्ज करें: "शर्मा हार्डवेयर से 50 बोरी सीमेंट 18000 की आई"। AI समझकर सही खाते में पोस्ट कर देता है।',
      highlight: 'Hands-Free'
    },
    {
      icon: FileText,
      title: '1-क्लिक WhatsApp PDF रिपोर्ट्स',
      tagline: 'Professional Statements',
      desc: 'प्रोजेक्ट कॉस्टिंग, मटीरियल परचेस और पार्टी लेजर की सुंदर PDF स्टेटमेंट्स। एक क्लिक में डाउनलोड करें या क्लाइंट को भेजें।',
      highlight: 'Instant Share'
    },
    {
      icon: Smartphone,
      title: 'मोबाइल और डेस्कटॉप लाइव सिंक',
      tagline: 'Multi-Device Cloud Sync',
      desc: 'सुपरवाइजर साइट से मोबाइल पर एंट्री करे, ठेकेदार और ओनर ऑफिस में डेस्कटॉप पर तुरंत लाइव प्रोग्रेस व खर्च देखें।',
      highlight: 'Multi-Device'
    }
  ];

  const targetAudience = [
    {
      title: 'सिविल ठेकेदार व बिल्डर्स',
      role: 'Civil Contractors & Builders',
      desc: 'एक साथ कई साइट्स, बड़े मटीरियल ऑर्डर और लेबर टीमों का सटीक फाइनेंशियल कंट्रोल।'
    },
    {
      title: 'सब-कॉन्ट्रैक्टर्स व मिस्त्री',
      role: 'Sub-Contractors (Plumbing, Tile, Electrical)',
      desc: 'ठेके पर काम करने वाले विशेषज्ञ — मटीरियल इनवॉइस और पेमेंट बकाये का पक्का हिसाब।'
    },
    {
      title: 'साइट सुपरवाइजर्स व इंजीनियर्स',
      role: 'Site Supervisors & Engineers',
      desc: 'रोजाना साइट पर आने वाले मटीरियल की रसीदें और स्टॉक का तुरंत मोबाइल से रिकॉर्ड।'
    },
    {
      title: 'हार्डवेयर व मटीरियल सप्लायर्स',
      role: 'Material Suppliers & Vendors',
      desc: 'अलग-अलग साइट्स पर माल की सप्लाई और पेमेंट रिकवरी का पारदर्शी लेजर।'
    },
    {
      title: 'मकान मालिक (Home Builders)',
      role: 'Individual Home Owners',
      desc: 'अपना घर बनवा रहे लोग, जिन्हें सीमेंट, सरिया और लेबर के हर रुपये का सटीक हिसाब चाहिए।'
    }
  ];

  return (
    <div className="min-h-screen bg-charcoal-950 text-slate-100 flex flex-col font-sans selection:bg-construction-500 selection:text-charcoal-950">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-charcoal-950/90 backdrop-blur-md border-b border-charcoal-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-charcoal-900 border border-construction-500/40 p-1.5 flex items-center justify-center shadow">
            <img src="/logo.svg" alt="Khata AI" className="w-7 h-7" />
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
            Features (सुविधाएँ)
          </button>
          <button onClick={() => scrollToSection('who-it-is-for')} className="hover:text-white transition">
            Who It's For (किसके लिए)
          </button>
          <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition">
            Offer (लॉन्च ऑफर)
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
            <span>Sign In / लॉगिन</span>
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
          <span>भारत का पहला AI-पावर्ड Construction Site Khata &amp; Inventory</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
          कंस्ट्रक्शन साइट का हिसाब,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-construction-400 via-amber-300 to-construction-500">
            अब AI से 10 गुना आसान
          </span>
        </h1>

        <p className="mt-5 text-sm sm:text-base md:text-lg text-charcoal-300 max-w-2xl mx-auto leading-relaxed">
          सिविल ठेकेदारों और बिल्डर्स के लिए तैयार किया गया संपूर्ण समाधान — मोबाइल से पर्चा फोटो खींचो, AI बिल खुद भरेगा। 
          सीमेंट, सरिया, लेबर हाजिरी और पार्टी लेजर का 100% सटीक हिसाब, <strong>बिना इंटरनेट भी एक्टिव!</strong>
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
            <span>Google से लॉगिन करें (फ्री)</span>
          </button>

          <button
            onClick={onEnterApp}
            className="w-full sm:w-auto bg-charcoal-900 hover:bg-charcoal-850 text-slate-200 border border-charcoal-700 font-bold px-6 py-3.5 rounded-2xl text-sm transition shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            <span>डैशबोर्ड खोलें</span>
            <ArrowRight className="w-4 h-4 text-construction-400" />
          </button>
        </div>

        {/* Trust Badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-charcoal-400 font-semibold">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>1 साइट 4 महीने बिल्कुल फ्री</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-construction-400" />
            <span>100% प्योर ऑफलाइन-रेडी</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            <span>Gemini Vision AI स्कैनर</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
            <span>कोई क्रेडिट कार्ड जरूरी नहीं</span>
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
              <div className="text-[11px] text-charcoal-400 font-medium">कुल प्रोजेक्ट खर्च</div>
              <div className="text-base sm:text-xl font-black text-white mt-1">₹14,85,400</div>
              <div className="text-[10px] text-emerald-400 font-bold mt-1">बजट नियंत्रण में</div>
            </div>

            <div className="bg-charcoal-950/80 border border-charcoal-800 rounded-2xl p-3.5">
              <div className="text-[11px] text-charcoal-400 font-medium">सीमेंट स्टॉक (Cement)</div>
              <div className="text-base sm:text-xl font-black text-amber-400 mt-1">140 बोरी</div>
              <div className="text-[10px] text-charcoal-400 mt-1">350 इस्तेमाल हुई</div>
            </div>

            <div className="bg-charcoal-950/80 border border-charcoal-800 rounded-2xl p-3.5">
              <div className="text-[11px] text-charcoal-400 font-medium">सरिया स्टॉक (Steel)</div>
              <div className="text-base sm:text-xl font-black text-blue-400 mt-1">2.4 टन</div>
              <div className="text-[10px] text-charcoal-400 mt-1">Tata Tiscon TMT</div>
            </div>

            <div className="bg-charcoal-950/80 border border-charcoal-800 rounded-2xl p-3.5">
              <div className="text-[11px] text-charcoal-400 font-medium">सप्लायर बकाया (Due)</div>
              <div className="text-base sm:text-xl font-black text-red-400 mt-1">₹42,000</div>
              <div className="text-[10px] text-charcoal-400 mt-1">शर्मा हार्डवेयर</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem vs Solution Section */}
      <section className="py-14 bg-charcoal-900/50 border-y border-charcoal-800/80 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              डायरी और रफ कॉपियों की सिरदर्दी को हमेशा के लिए अलविदा कहें
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-400 mt-2">
              Construction Khata AI आपके कंस्ट्रक्शन बिजनेस को आधुनिक और पारदर्शी बनाता है।
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-red-950/20 border border-red-900/40 rounded-3xl p-6 space-y-3">
              <div className="text-red-400 font-black text-sm uppercase tracking-wider flex items-center gap-2">
                <span>❌ पुराना तरीका (डायरी व रफ पर्चे)</span>
              </div>
              <ul className="space-y-2.5 text-xs sm:text-sm text-charcoal-300">
                <li>• हार्डवेयर दुकान के पर्चे जेब में मुड़ जाते हैं या खो जाते हैं।</li>
                <li>• साइट पर सीमेंट और सरिया कब आया और कहाँ लगा, कोई हिसाब नहीं।</li>
                <li>• महीने के अंत में सप्लायर के बकाये को लेकर तू-तू मैं-मैं।</li>
                <li>• लेबर हाजिरी और एडवांस का कोई पक्का रिकॉर्ड नहीं।</li>
                <li>• बेसमेंट या रिमोट साइट्स पर इंटरनेट न होने से काम रुकना।</li>
              </ul>
            </div>

            <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-3xl p-6 space-y-3">
              <div className="text-emerald-400 font-black text-sm uppercase tracking-wider flex items-center gap-2">
                <span>✅ नया तरीका (Construction Khata AI)</span>
              </div>
              <ul className="space-y-2.5 text-xs sm:text-sm text-charcoal-300">
                <li>• पर्चे की फोटो खींचो, AI 2 सेकंड में खुद एंट्री बना देता है।</li>
                <li>• मटीरियल इन, आउट और लाइव स्टॉक एक-एक बोरी तक ट्रैक।</li>
                <li>• सप्लायर का 1-क्लिक लेजर और WhatsApp PDF स्टेटमेंट।</li>
                <li>• लेबर वर्क और एडवांस का तुरंत हिसाब।</li>
                <li>• 100% प्योर ऑफलाइन मोड — बिना इंटरनेट भी सब कुछ चलेगा।</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-xs font-black uppercase tracking-wider text-construction-400 mb-2">
            Powerful Features
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            कंस्ट्रक्शन साइट संभालने के लिए आवश्यक हर एक फीचर
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-400 mt-2">
            बिना किसी जटिल अकाउंटिंग ज्ञान के, कोई भी ठेकेदार या सुपरवाइजर इसे 5 मिनट में सीख सकता है।
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
              यह किसके लिए सबसे उपयोगी है?
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-400 mt-2">
              चाहे आप एक साइट संभाल रहे हों या 20 साइट्स — यह सॉफ्टवेयर हर स्केल पर फिट बैठता है।
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
          1 साइट पूरे 4 महीने बिल्कुल फ्री
        </h2>
        <p className="mt-3 text-xs sm:text-sm text-charcoal-400 max-w-lg mx-auto">
          बिना किसी क्रेडिट कार्ड के आज ही शुरू करें। सभी AI फीचर्स, मटीरियल इन्वेंट्री और ऑफलाइन मोड शामिल हैं।
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
              <p className="text-xs text-charcoal-400 mt-1">1 एक्टिव साइट के लिए संपूर्ण फीचर्स</p>
            </div>

            <ul className="space-y-2 text-xs text-charcoal-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>1 एक्टिव कंस्ट्रक्शन साइट</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>AI फोटो बिल स्कैनर (Gemini Vision)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>सीमेंट, सरिया व मटीरियल इन्वेंट्री</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% प्योर ऑफलाइन एक्सेस</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>WhatsApp PDF रिपोर्ट्स व स्टेटमेंट्स</span>
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
              <p className="text-xs text-charcoal-400 mt-1">अनलिमिटेड साइट्स व बड़े बिल्डर्स के लिए</p>
            </div>

            <ul className="space-y-2 text-xs text-charcoal-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span><strong>अनलिमिटेड साइट्स</strong> (Unlimited Projects)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>मल्टी-डिवाइस ऑटो क्लाउड सिंक</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>अनलिमिटेड AI बिल स्कैनिंग</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Priority WhatsApp सपोर्ट</span>
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
            <img src="/logo.svg" alt="Khata AI" className="w-4 h-4" />
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

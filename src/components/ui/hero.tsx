import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Wallet, Globe, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/lib/LanguageContext';
import { AuthModal } from '@/components/AuthModal';
import { Spotlight } from '@/components/ui/spotlight';
import { LeverSwitch } from '@/components/ui/lever-switch';
import { renderCanvas } from '@/components/ui/canvas';
import { cn } from '@/lib/utils';
import { Suspense, lazy } from 'react';
import { Link } from '@tanstack/react-router';

const SplineScene = lazy(() => import('@/components/ui/splite').then(mod => ({ default: mod.SplineScene })));

// --- Custom SVG Components for Hand-Drawn Accents ---

const ArrowGreenLeft = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full text-[#CCFF00] stroke-current overflow-visible" fill="none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10,90 C 10,40 40,20 60,50 C 70,65 80,75 95,70" />
    <path d="M80,55 L95,70 L85,85" />
  </svg>
);

const ArrowGreenRight = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full text-[#CCFF00] stroke-current overflow-visible" fill="none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M90,10 C 80,60 60,80 40,60 C 20,40 40,20 60,30 C 80,40 70,70 50,80" />
    <path d="M65,75 L50,80 L55,65" />
  </svg>
);

const ArrowBlack1 = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full text-black stroke-current overflow-visible" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20,80 Q 40,20 80,40" />
    <path d="M60,20 L80,40 L50,60" />
  </svg>
);

const ArrowBlack2 = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full text-black stroke-current overflow-visible" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20,80 Q 40,20 80,40" />
    <path d="M60,20 L80,40 L50,60" />
  </svg>
);

const CircularBadge = () => (
  <div className="relative w-28 h-28 md:w-36 md:h-36 bg-[#CCFF00] rounded-full flex items-center justify-center shadow-xl rotate-12 hover:scale-105 transition-transform cursor-pointer border-[3px] border-black/5">
    <div className="absolute inset-1 animate-[spin_10s_linear_infinite]">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path id="circlePath" d="M 50, 50 m -36, 0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0" fill="none" />
        <text className="text-[11px] font-black tracking-[0.18em] uppercase" fill="black">
          <textPath href="#circlePath" startOffset="0%">
            INNOVATING THE FUTURE • REPOTECS • 
          </textPath>
        </text>
      </svg>
    </div>
    <div className="absolute inset-0 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-10 h-10 text-black stroke-current overflow-visible" fill="none" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20,80 Q 40,50 30,30 T 80,20" />
        <path d="M60,10 L80,20 L70,40" />
      </svg>
    </div>
  </div>
);

export const Component = () => {
  const { user, profile, signOut } = useAuth();
  const { language, setLanguage, isAr } = useLanguage();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const cleanup = renderCanvas();
    return () => cleanup && cleanup();
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative w-full">
      <canvas id="canvas" className="absolute inset-0 z-0 pointer-events-none opacity-50" />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-6 md:px-10 md:py-8 max-w-[1440px] mx-auto w-full">
        {/* Logo */}
        <div className="flex items-center gap-1">
          <div className="bg-white text-black font-black tracking-tight text-xs md:text-sm px-3 py-1.5 rounded-2xl rounded-bl-sm relative shadow-sm">
            ST
            <div className="absolute -bottom-1.5 left-0 w-3 h-3 bg-white" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}></div>
          </div>
          <div className="bg-[#CCFF00] text-black font-black text-xs md:text-sm px-3 py-1.5 rounded-full border-[1.5px] border-white shadow-sm">
            REPOTECS
          </div>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-4">
          <div className="flex items-center gap-3 px-4 py-1.5 rounded-full border border-white/30 bg-black/20">
            <span className={cn("text-[10px] font-bold transition-colors", !isAr ? "text-[#CCFF00]" : "text-white/50")}>EN</span>
            <LeverSwitch 
              checked={isAr}
              onChange={() => setLanguage(language === "en" ? "ar" : "en")}
            />
            <span className={cn("text-[10px] font-bold transition-colors", isAr ? "text-[#CCFF00]" : "text-white/50")}>AR</span>
          </div>
          {[
            { label: isAr ? 'معرض الأعمال' : 'Portfolio', id: 'arena-section' },
            { label: isAr ? 'خدماتنا' : 'Services', id: 'missions-section' },
          ].map((item) => (
            <button 
              key={item.id} 
              onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })}
              className="px-4 py-1.5 rounded-full border border-white/30 text-white text-xs font-semibold hover:bg-white/10 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Connect Button */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className={`flex items-center gap-3 ${isAr ? 'flex-row-reverse' : ''}`}>
              <Link to="/profile" className={`hidden sm:flex flex-col hover:opacity-70 transition-opacity ${isAr ? 'items-start' : 'items-end'}`}>
                <span className="text-white text-[10px] font-black uppercase tracking-widest leading-none">
                  {profile?.username || user.email?.split("@")[0]}
                </span>
                <span className="text-[#CCFF00] text-[8px] font-black uppercase tracking-[0.2em] mt-1">
                  {profile?.score || 0} XP
                </span>
              </Link>
              <button 
                onClick={() => signOut()}
                className="p-2 rounded-full border border-white/30 text-white hover:bg-red-500/20 hover:border-red-500/50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 px-6 py-2 rounded-full border border-white text-white text-xs md:text-sm font-semibold hover:bg-white hover:text-[#0038FF] transition-colors group"
            >
              <UserIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
              {isAr ? "دخول النظام" : "Initialize"}
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 relative z-10 pt-8 pb-32 md:pt-12 md:pb-48 px-4 flex flex-col items-center justify-center w-full max-w-[1440px] mx-auto">
        
        {/* Massive Typography & Elements Container */}
        <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center justify-center text-center z-10 mt-4 mb-16">
          
          {/* Text Stack */}
          <div className="w-full flex flex-col items-center relative z-10 space-y-2 md:space-y-4">
            
            {/* #LEARN */}
            <div className="w-full flex justify-start pl-[10%] md:pl-[25%] relative z-30">
              <h1 
                className="text-[clamp(4.5rem,12vw,160px)] font-black leading-[0.85] tracking-tighter text-[#CCFF00] m-0 p-0 uppercase"
                style={{ 
                  fontFamily: '"Arial Black", Impact, sans-serif',
                  textShadow: '1px 1px 0 #001A99, 2px 2px 0 #001A99, 3px 3px 0 #001A99, 4px 4px 0 #001A99, 5px 5px 0 #001A99, 6px 6px 0 #001A99, 7px 7px 0 #001A99, 8px 8px 0 #001A99, 9px 9px 0 #001A99, 10px 10px 0 #001A99, 11px 11px 0 #001A99, 12px 12px 0 #001A99, 13px 13px 0 #001A99, 14px 14px 0 #001A99'
                }}
              >
                {isAr ? '#تعلم' : '#LEARN'}
              </h1>
            </div>
            
            {/* REPOTECS */}
            <div className="w-full flex justify-center relative z-20">
              <h1 
                className="text-[clamp(5rem,15vw,220px)] font-black leading-[0.85] tracking-tighter text-white m-0 p-0 uppercase"
                style={{ 
                  fontFamily: '"Arial Black", Impact, sans-serif',
                  textShadow: '1px 1px 0 #001A99, 2px 2px 0 #001A99, 3px 3px 0 #001A99, 4px 4px 0 #001A99, 5px 5px 0 #001A99, 6px 6px 0 #001A99, 7px 7px 0 #001A99, 8px 8px 0 #001A99, 9px 9px 0 #001A99, 10px 10px 0 #001A99, 11px 11px 0 #001A99, 12px 12px 0 #001A99, 13px 13px 0 #001A99, 14px 14px 0 #001A99'
                }}
              >
                REPOTECS
              </h1>
            </div>
            
            {/* ROBOTICS */}
            <div className="w-full flex justify-start pl-[15%] md:pl-[30%] relative z-10">
              <h1 
                className="text-[clamp(4.5rem,12vw,160px)] font-black leading-[0.85] tracking-tighter text-white m-0 p-0 uppercase"
                style={{ 
                  fontFamily: '"Arial Black", Impact, sans-serif',
                  textShadow: '1px 1px 0 #001A99, 2px 2px 0 #001A99, 3px 3px 0 #001A99, 4px 4px 0 #001A99, 5px 5px 0 #001A99, 6px 6px 0 #001A99, 7px 7px 0 #001A99, 8px 8px 0 #001A99, 9px 9px 0 #001A99, 10px 10px 0 #001A99, 11px 11px 0 #001A99, 12px 12px 0 #001A99, 13px 13px 0 #001A99, 14px 14px 0 #001A99'
                }}
              >
                {isAr ? 'روبوتات' : 'ROBOTICS'}
              </h1>
            </div>

          </div>

          {/* Absolute Overlays (Cards, Arrows, Badge) */}
          <div className="absolute inset-0 w-full h-full pointer-events-none">
            
            {/* Original Compact Spline Robot */}
            <div className="absolute -bottom-[15%] -left-[10%] md:left-[5%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] z-30 pointer-events-auto">
              {isClient && (
                <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#CCFF00] border-t-transparent rounded-full animate-spin" /></div>}>
                  <SplineScene 
                    scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                    className="w-full h-full"
                  />
                </Suspense>
              )}
            </div>

            {/* Floating Glass Card 2 (Top Right) */}
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-[15%] right-[5%] md:right-[22%] z-30 pointer-events-auto"
            >
              <div className="w-40 md:w-52 aspect-[3/3.5] bg-white/20 backdrop-blur-md border border-white/40 rounded-[2rem] p-5 flex flex-col items-center justify-center rotate-[12deg] shadow-2xl hover:rotate-0 transition-transform duration-500">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-[#2C3E50] rounded-full flex items-center justify-center mb-4 shadow-inner border-[3px] border-white/50 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200" alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="text-center mt-2">
                  <p className="font-bold text-sm md:text-lg text-white">cto.repotecs</p>
                  <p className="text-[10px] md:text-xs text-white/80 mt-1">Core Architecture</p>
                </div>
              </div>
            </motion.div>

            {/* Decorative Arrow Left */}
            <div className="absolute bottom-[0%] left-[0%] md:left-[10%] w-24 h-24 md:w-32 md:h-32 z-20">
              <ArrowGreenLeft />
            </div>

            {/* Decorative Arrow Right */}
            <div className="absolute top-[5%] right-[0%] md:right-[10%] w-24 h-24 md:w-32 md:h-32 z-20">
              <ArrowGreenRight />
            </div>

            {/* Circular Badge */}
            <div className="absolute bottom-[-10%] right-[0%] md:right-[15%] z-40 pointer-events-auto">
              <CircularBadge />
            </div>

          </div>
        </div>
      </main>

      {/* Bottom Features Section */}
      <section className="bg-white text-black rounded-t-[2.5rem] md:rounded-t-[3.5rem] px-6 py-12 md:px-10 md:py-16 relative z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.2)] mt-auto w-full">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          
          {/* Card 1 */}
          <div className="bg-[#F8F9FA] rounded-[2rem] p-8 flex flex-col items-center text-center relative h-64 border border-gray-100">
            <h3 className="text-xl md:text-2xl uppercase leading-tight mb-2 font-black">
              {isAr ? 'دورات الروبوتات' : 'ROBOTICS COURSES'}
            </h3>
            <p className="text-[10px] md:text-xs text-black/60 font-bold mb-auto">
              {isAr ? 'للمهندسين الصغار (أعمار 7-13)' : 'For Junior Engineers (Ages 7-13)'}
            </p>
            
            {/* Pill Graphic */}
            <div className="relative w-full flex justify-center mt-6">
              <div className="flex items-center bg-[#0038FF] rounded-2xl p-2 pr-16 text-white shadow-lg relative z-10">
                <div className="w-8 h-8 bg-[#D2B48C] rounded-full mr-3 border border-white/30 overflow-hidden flex-shrink-0">
                  <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200&h=200" alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className={`text-left ${isAr ? 'text-right' : ''}`}>
                  <p className="text-[10px] font-bold leading-none">{isAr ? 'سجل الآن' : 'ENROLL NOW'}</p>
                  <p className="text-[8px] text-white/70 leading-none mt-1">2026 Season</p>
                </div>
              </div>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#CCFF00] text-black font-black text-[10px] px-3 py-2 rounded-xl z-20 shadow-md">
                {isAr ? 'خصم 20%' : '20% OFF'}
              </div>
            </div>

            {/* Arrow pointing to next card */}
            <div className="hidden md:block absolute -right-12 bottom-8 w-16 h-16 z-30">
              <ArrowBlack1 />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#F8F9FA] rounded-[2rem] p-8 flex flex-col items-center text-center relative h-64 border border-gray-100">
            <h3 className="text-xl md:text-2xl uppercase leading-tight mb-2 font-black">
              {isAr ? 'مسابقات عالمية' : 'GLOBAL CHALLENGE'}
            </h3>
            <p className="text-[10px] md:text-xs text-black/60 font-bold mb-auto">
              {isAr ? 'نافس فرقاً من جميع أنحاء العالم' : 'Compete with teams worldwide'}
            </p>
            
            {/* Pill Graphic */}
            <div className="relative w-full flex justify-center mt-6">
              <div className="flex items-center bg-[#0038FF] rounded-full p-1.5 text-white shadow-lg">
                <div className="bg-white/20 text-white font-bold text-sm px-4 py-2 rounded-full mr-2">
                  50+
                </div>
                <div className="font-bold text-xs px-4 uppercase">
                  {isAr ? 'دولة' : 'Countries'}
                </div>
              </div>
              
              {/* Small floating green pill */}
              <div className="absolute -bottom-6 right-1/3 bg-[#CCFF00] rounded-full p-2.5 shadow-lg transform rotate-12 z-20">
                 <ArrowUpRight className="w-4 h-4 text-black" strokeWidth={3} />
              </div>
            </div>

            {/* Arrow pointing to next card */}
            <div className="hidden md:block absolute -right-12 bottom-8 w-16 h-16 z-30">
              <ArrowBlack2 />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-[#F8F9FA] rounded-[2rem] p-8 flex flex-col items-center text-center relative h-64 border border-gray-100">
            <h3 className="text-xl md:text-2xl uppercase leading-tight mb-2 font-black">
              {isAr ? 'يوم الصناعة الحر' : 'FREE BUILD DAYS'}
            </h3>
            <p className="text-[10px] md:text-xs text-black/60 font-bold mb-auto">
              {isAr ? 'تعال واصنع روبوتك الخاص مجاناً' : 'Come and make your robot for free'}
            </p>
            
            {/* Pill Graphic */}
            <div className="flex flex-col items-center bg-[#CCFF00] rounded-[2rem] px-6 py-4 text-black shadow-lg mt-6 relative w-full max-w-[200px]">
              <p className="text-[9px] font-black uppercase tracking-wider mb-1">{isAr ? 'السبت القادم' : 'NEXT SATURDAY'}</p>
              <p className="text-xl font-black">{isAr ? 'دخول مجاني' : 'FREE ENTRY'}</p>
              
              {/* Speech bubble tail */}
              <div className="absolute -bottom-2 left-8 w-5 h-5 bg-[#CCFF00] transform rotate-45"></div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};

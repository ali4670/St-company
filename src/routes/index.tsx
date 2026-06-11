import { createFileRoute } from "@tanstack/react-router";
import TicTacToeGame from "../components/TicTacToeGame";
import { FriendSearch } from "../components/FriendSearch";
import { Leaderboard } from "../components/Leaderboard";
import { RainingXO, ScrambledText } from "../components/RainingXO";
import { ProfileEdit } from "../components/ProfileEdit";
import { AdvancedTodo } from "../components/todo/AdvancedTodo";
import { useLanguage } from "../lib/LanguageContext";
import { useAuth } from "../hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Gamepad2, X, Check } from "lucide-react";
import { supabase } from "../lib/supabase-code";
import { toast } from "sonner";
import { Component as NewHero } from "../components/ui/hero";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { isAr } = useLanguage();
  const { user } = useAuth();
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [activeOnlineGame, setActiveOnlineGame] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [incomingChallenge, setIncomingChallenge] = useState<{
    id: string;
    player_x: string;
    challengerName: string;
  } | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user_challenges_${user.id}`)
      .on(
        "postgres_changes" as any,
        {
          event: "INSERT",
          table: "games",
          filter: `player_o=eq.${user.id}`,
        },
        async (payload: any) => {
          const { data: challenger } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", payload.new.player_x)
            .single();

          setIncomingChallenge({
            id: payload.new.id,
            player_x: payload.new.player_x,
            challengerName: challenger?.username || "Unknown",
          });
        },
      )
      .on(
        "postgres_changes" as any,
        {
          event: "UPDATE",
          table: "games",
          filter: `player_x=eq.${user.id}`,
        },
        (payload: any) => {
          if (payload.new.status === "active") {
            setActiveOnlineGame(payload.new.id);
            toast.success(isAr ? "تم قبول التحدي!" : "Challenge accepted!");
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAr]);

  const acceptChallenge = async () => {
    if (!incomingChallenge) return;
    try {
      const { error } = await supabase
        .from("games")
        .update({ status: "active" })
        .eq("id", incomingChallenge.id);

      if (error) throw error;
      setActiveOnlineGame(incomingChallenge.id);
      setIncomingChallenge(null);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    }
  };

  if (!isClient) {
    return <div className="bg-[#0038FF] min-h-screen" />;
  }

  return (
    <main className="bg-[#0038FF] flex flex-col relative overflow-x-hidden text-white selection:bg-[#CCFF00] selection:text-black">
      {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0"></div>
      
      {/* Hero Section */}
      <div id="hero-section">
        <NewHero />
      </div>

      {/* Mission Section */}
      <section className="py-24 relative bg-black/20 overflow-hidden border-y border-white/5 flex flex-col items-center justify-center min-h-[40vh]">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="text-center px-6 relative z-10"
        >
          <motion.h2 
            className="text-4xl md:text-7xl font-black tracking-tighter italic mb-6"
            style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}
          >
            <ScrambledText 
              phrases={isAr ? ["نحن نصنع المستقبل", "نحن نبني الروبوتات", "نحن نصنع التغيير"] : ["WE BUILD THE FUTURE", "WE BUILD ROBOTS", "WE BUILD CHANGE"]} 
            />
          </motion.h2>
          <p className="text-white/50 text-xs md:text-sm font-black uppercase tracking-[0.3em]">
            {isAr ? "دورة الروبوتات للأعمار 7-13" : "Robotics Excellence for Ages 7-13"}
          </p>
        </motion.div>
        
        {/* Background Decorative Element */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <div className="w-[800px] h-[800px] bg-[#CCFF00] rounded-full blur-[150px] animate-pulse" />
        </div>
      </section>

      {/* Arena Section */}
      <section id="arena-section" className="py-32 px-6 bg-black relative overflow-hidden">
        {/* Raining X and O Background */}
        <div className="absolute inset-0 opacity-10">
          <RainingXO />
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-24">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-8xl font-black italic tracking-tighter mb-4"
            >
              {isAr ? "معرض الأعمال" : "PORTFOLIO"}
            </motion.h2>
            <p className="text-cyan-500 font-black uppercase tracking-[0.4em] text-xs">
              {isAr ? "مشاريع المهندسين المبدعين" : "Showcasing student brilliance"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Neural Link v1", image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=800", cat: "Robotics" },
              { title: "Cyber Frame", image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800", cat: "Engineering" },
              { title: "OS Delta", image: "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&q=80&w=800", cat: "AI Software" },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -10 }}
                className="group relative aspect-[4/5] rounded-[40px] overflow-hidden border border-white/10 bg-white/5"
              >
                <img src={item.image} className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity grayscale hover:grayscale-0 duration-700" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                <div className="absolute bottom-10 left-10">
                  <span className="text-[10px] font-black text-[#CCFF00] uppercase tracking-widest">{item.cat}</span>
                  <h3 className="text-2xl font-black italic uppercase text-white">{item.title}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="missions-section" className="py-32 px-6 bg-[#050505] relative overflow-hidden">
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
            <div>
              <h2 className="text-5xl md:text-8xl font-black italic tracking-tighter mb-8 uppercase leading-none">
                {isAr ? "خدماتنا" : "CORE SERVICES"}
              </h2>
              <div className="space-y-6">
                {[
                  { t: isAr ? "بناء الروبوتات" : "ROBOTICS CONSTRUCTION", d: isAr ? "تعلم هندسة الميكاترونيكس من الصفر" : "Master mechatronics from the ground up" },
                  { t: isAr ? "برمجة الأنظمة" : "SYSTEM CODING", d: isAr ? "إتقان لغات البرمجة المتقدمة" : "Advanced software architectural training" },
                  { t: isAr ? "الذكاء الاصطناعي" : "NEURAL AI", d: isAr ? "تطوير عقول روبوتية ذكية" : "Developing autonomous robotic intelligence" },
                ].map((s, i) => (
                  <div key={i} className="group p-8 rounded-[32px] border border-white/5 bg-white/[0.02] hover:bg-[#CCFF00]/10 hover:border-[#CCFF00]/30 transition-all">
                    <h3 className="text-xl font-black mb-2 group-hover:text-[#CCFF00]">{s.t}</h3>
                    <p className="text-white/40 font-medium">{s.d}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-[60px] bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-white/10 flex items-center justify-center p-12 overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1531746790731-6c087fec07a8?auto=format&fit=crop&q=80&w=800')] opacity-30 grayscale mix-blend-overlay" />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-full h-full border-[1px] border-dashed border-[#CCFF00]/30 rounded-full flex items-center justify-center"
                >
                  <div className="w-2/3 h-2/3 border-[1px] border-[#CCFF00]/50 rounded-full shadow-[0_0_100px_rgba(204,255,0,0.2)]" />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Missions Tracker Section */}
      <section className="py-32 px-6 bg-white/[0.03] backdrop-blur-sm border-t border-white/5">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">{isAr ? "متتبع المهمات" : "MISSION CONTROL"}</h2>
            <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.5em]">{isAr ? "تحكم في أهدافك اليومية" : "Command your daily objectives"}</p>
          </div>
          <AdvancedTodo />
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="bg-black py-24 px-6 border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/30 to-transparent" />
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="text-center md:text-left">
              <h3 className="text-3xl font-black italic tracking-tighter text-white mb-2">ST-COMPANY<span className="text-cyan-500">.</span></h3>
              <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em] mb-8">{isAr ? "نحن نبني المستقبل" : "ENGINEERING THE UNKNOWN"}</p>
              <div className="flex gap-4">
                {["IG", "TW", "LI", "FB"].map(s => (
                  <button key={s} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black hover:bg-[#CCFF00] hover:text-black transition-all">
                    {s}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[40px] text-center max-w-sm">
              <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-2 block">{isAr ? "المصمم الرئيسي" : "CHIEF DESIGNER"}</span>
              <h4 className="text-3xl font-black italic text-white tracking-tighter uppercase mb-4">ALI-AHMED</h4>
              <p className="text-white/40 text-xs font-medium italic">"Designing digital realms where imagination meets heavy engineering."</p>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-2">© 2026 ST-COMPANY CORP.</p>
              <p className="text-white/20 text-[8px] font-bold uppercase tracking-widest">ALL RIGHTS RESERVED // UNIT-ST-OS</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Challenge Modal */}
      <AnimatePresence>
        {incomingChallenge && (
          <div className="fixed bottom-8 left-8 right-8 md:left-auto md:right-8 md:w-[320px] z-[150]">
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="bg-black/80 border border-white/20 backdrop-blur-2xl rounded-[32px] p-6 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500 flex items-center justify-center animate-pulse shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                  <Gamepad2 className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h4 className="text-white font-bold">{isAr ? "تحدي جديد!" : "New Challenge!"}</h4>
                  <p className="text-white/40 text-xs">
                    {incomingChallenge.challengerName} {isAr ? "يدعوك للعب" : "invited you to play"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={acceptChallenge}
                  className="flex-1 py-3 bg-cyan-500 text-black font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
                >
                  <Check className="w-4 h-4" />
                  {isAr ? "قبول" : "Accept"}
                </button>
                <button
                  onClick={() => setIncomingChallenge(null)}
                  className="px-4 py-3 bg-white/5 border border-white/10 text-white rounded-2xl hover:bg-white/10 active:scale-95 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ProfileEdit isOpen={isProfileEditOpen} onClose={() => setIsProfileEditOpen(false)} />
    </main>
  );
}

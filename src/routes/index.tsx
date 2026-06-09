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
      <section id="arena-section" className="py-32 px-6 bg-black/40 backdrop-blur-sm relative overflow-hidden">
        {/* Raining X and O Background */}
        <div className="absolute inset-0 opacity-20">
          <RainingXO />
        </div>

        {/* Decorative Grid Light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            {/* Game Column */}
            <div className="lg:col-span-7 xl:col-span-8 order-2 lg:order-1">
              <TicTacToeGame
                onlineGameId={activeOnlineGame}
                onQuit={() => setActiveOnlineGame(null)}
              />
            </div>

            {/* Social/Stats Column */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-16 order-1 lg:order-2">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <FriendSearch />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <Leaderboard />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Missions Section */}
      <section id="missions-section" className="py-32 px-6 bg-white/[0.05] backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl">
          <AdvancedTodo />
        </div>
      </section>

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

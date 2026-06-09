import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/use-auth";
import { useLanguage } from "../lib/LanguageContext";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase-code";
import { MessageSquare, ArrowLeft, Send } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export const Route = createFileRoute("/levels/$levelId/classroom")({
  component: LevelClassroomPage,
});

function LevelClassroomPage() {
  const { levelId } = Route.useParams();
  const { isAr } = useLanguage();
  const { isApproved, isAdmin, isModerator, user } = useAuth();
  const navigate = useNavigate();

  const [levelTitle, setLevelTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasAccessToLevel, setHasAccessToLevel] = useState(false);

  const fetchLevelDetailsAndAccess = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch level details
      const { data: levelData, error: levelError } = await supabase
        .from("levels")
        .select("title")
        .eq("id", levelId)
        .single();

      if (levelError) throw levelError;
      setLevelTitle(levelData?.title || "Unknown Level");

      // Check access
      let accessGranted = false;
      if (isAdmin || isModerator) {
        accessGranted = true;
      } else if (isApproved) {
        const { data: accessData } = await supabase
          .from("level_access")
          .select("level_id")
          .eq("user_id", user.id)
          .eq("level_id", levelId)
          .maybeSingle();

        accessGranted = !!accessData;
      }

      setHasAccessToLevel(accessGranted);
      if (!accessGranted && !loading) {
        navigate({ to: "/levels" });
      }
    } catch (error) {
      console.error("Failed to fetch level details or access:", error);
      navigate({ to: "/levels" });
    } finally {
      setLoading(false);
    }
  }, [levelId, user, isApproved, isAdmin, isModerator, navigate, loading]);

  useEffect(() => {
    fetchLevelDetailsAndAccess();
  }, [fetchLevelDetailsAndAccess]);

  if (loading)
    return (
      <div className="min-h-screen bg-[#0038FF] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#CCFF00] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!hasAccessToLevel) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0038FF] text-white p-6 relative overflow-hidden flex flex-col">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0"></div>

      <div className="container mx-auto max-w-7xl relative z-10 pt-10 flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-12">
          <button
            onClick={() => navigate({ to: "/levels" })}
            className="group flex items-center gap-3 text-white/40 hover:text-white transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-cyan-500/50">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest">
              {isAr ? "العودة" : "RETURN"}
            </span>
          </button>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">
            {isAr ? `فصل: ${levelTitle}` : `CLASSROOM: ${levelTitle}`}
          </h1>
          <div className="w-20"></div>
        </div>

        <div className="flex-1">
          <LevelChat levelId={levelId} isAr={isAr} />
        </div>
      </div>
    </div>
  );
}

function LevelChat({ levelId, isAr }: { levelId: string; isAr: boolean }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const { profile } = useAuth();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from("level_chats")
      .select("*, profiles(username, avatar_url, role)")
      .eq("level_id", levelId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
  }, [levelId]);

  useEffect(() => {
    fetchMessages();
    const subscription = supabase
      .channel(`level:${levelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "level_chats",
          filter: `level_id=eq.${levelId}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [levelId, fetchMessages]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !profile) return;
    const { error } = await supabase.from("level_chats").insert([
      {
        level_id: levelId,
        sender_id: profile.id,
        content: newMessage,
      },
    ]);

    if (error) {
      toast.error(isAr ? "فشل إرسال الرسالة" : "Failed to send message");
    } else {
      setNewMessage("");
    }
  };

  return (
    <div className="h-full flex flex-col bg-black/40 rounded-[40px] border border-white/5 overflow-hidden backdrop-blur-xl">
      <header className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-4">
          <MessageSquare className="w-5 h-5 text-cyan-400" />
          <h3 className="font-black italic uppercase tracking-widest text-sm">
            {isAr ? "غرفة محادثة المستوى" : "LEVEL COMM-LINK"}
          </h3>
        </div>
      </header>
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-4 ${m.sender_id === profile?.id ? "flex-row-reverse" : ""}`}
          >
            <div className="w-12 h-12 rounded-2xl bg-white/5 overflow-hidden flex-shrink-0 border border-white/10">
              {m.profiles?.avatar_url ? (
                <img src={m.profiles.avatar_url} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20 font-black">
                  {m.profiles?.username?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className={`max-w-[70%] ${m.sender_id === profile?.id ? "text-right" : ""}`}>
              <div className="flex items-center gap-2 mb-2 flex-wrap justify-inherit">
                <span className="font-black text-xs uppercase tracking-tight text-white/80">
                  {m.profiles?.username}
                </span>
                <span
                  className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                    m.profiles?.role === "admin"
                      ? "bg-red-500/20 text-red-500 border border-red-500/30"
                      : m.profiles?.role === "moderator"
                        ? "bg-cyan-500/20 text-cyan-500 border border-cyan-500/30"
                        : "bg-white/5 text-white/40 border border-white/10"
                  }`}
                >
                  {m.profiles?.role}
                </span>
                <span className="text-[8px] text-white/20 font-bold uppercase">
                  {new Date(m.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p
                className={`text-sm leading-relaxed p-5 rounded-3xl ${
                  m.sender_id === profile?.id
                    ? "bg-cyan-500/10 text-cyan-50 border border-cyan-500/20 rounded-tr-none"
                    : "bg-white/5 text-white/70 border border-white/10 rounded-tl-none"
                }`}
              >
                {m.content}
              </p>
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-white/10 space-y-4">
            <MessageSquare className="w-16 h-16" />
            <p className="font-black uppercase tracking-[0.4em] text-xs">
              Awaiting Transmission...
            </p>
          </div>
        )}
      </div>
      <div className="p-8 bg-black/60 border-t border-white/5">
        <div className="relative max-w-4xl mx-auto group">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={isAr ? "أرسل تحديثات المهمة..." : "Transmit mission updates..."}
            className="w-full bg-white/5 border border-white/10 rounded-3xl py-6 pl-8 pr-20 font-bold focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.08] transition-all"
          />
          <button
            onClick={sendMessage}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-4 bg-cyan-500 text-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-cyan-500/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default LevelClassroomPage;
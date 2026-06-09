import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "../lib/supabase-code";
import { useLanguage } from "../lib/LanguageContext";
import { useAuth } from "../hooks/use-auth";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Play, CheckCircle2, Lock, MessageSquare, ShieldAlert, GraduationCap } from "lucide-react";
import { HeroButton } from "../funs/HeroButton";

export const Route = createFileRoute("/levels")({
  component: LevelsPage,
});

interface Level {
  id: string;
  title: string;
  level_order: number;
}

interface Lecture {
  id: string;
  level_id: string;
  title: string;
  slot_number: number;
}

function LevelsPage() {
  const { isAr } = useLanguage();
  const { user, isApproved, isAdmin, isModerator } = useAuth();
  const [levels, setLevels] = useState<Level[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [progress, setProgress] = useState<string[]>([]);
  const [access, setAccess] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [levelsRes, lecturesRes] = await Promise.all([
        supabase.from("levels").select("*").order("level_order", { ascending: true }),
        supabase.from("lectures").select("*").order("slot_number", { ascending: true }),
      ]);

      if (levelsRes.data) setLevels(levelsRes.data);
      if (lecturesRes.data) setLectures(lecturesRes.data);

      if (user) {
        const [progressRes, accessRes] = await Promise.all([
          supabase.from("student_progress").select("lecture_id").eq("student_id", user.id),
          supabase.from("level_access").select("level_id").eq("user_id", user.id),
        ]);

        if (progressRes.data) setProgress(progressRes.data.map((p) => p.lecture_id));
        if (accessRes.data) setAccess(accessRes.data.map((a) => a.level_id));
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  if (loading)
    return (
      <div className="min-h-screen bg-[#0038FF] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#CCFF00] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!isApproved && !isAdmin && !isModerator) {
    return (
      <div className="min-h-screen bg-[#0038FF] text-white p-6 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md space-y-8 p-12 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[48px] shadow-2xl"
        >
          <div className="w-24 h-24 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-12 h-12 text-yellow-500" />
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase">
            {isAr ? "في انتظار الاعتماد" : "NEURAL LOCK ACTIVE"}
          </h1>
          <p className="text-white/40 font-bold text-sm leading-relaxed uppercase tracking-widest">
            {isAr
              ? "لم يتم تفعيل حسابك بعد من قبل الإدارة. يرجى الانتظار للموافقة للوصول إلى المحتوى التعليمي."
              : "Your account authentication is pending manual verification by central command. Access to training modules is currently restricted."}
          </p>
          <div className="pt-4">
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="h-full w-1/3 bg-[#CCFF00]"
              />
            </div>
            <p className="text-[8px] font-black text-[#CCFF00] uppercase tracking-[0.4em] mt-4">
              Syncing with server...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0038FF] text-white p-6 pb-20 relative overflow-hidden">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0"></div>

      <div className="container mx-auto max-w-5xl relative z-10 pt-10">
        <header className="mb-20 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-8xl font-black italic tracking-tighter mb-4"
          >
            {isAr ? "مسار المهمات" : "MISSION TRACK"}
          </motion.h1>
          <div className="flex items-center justify-center gap-6">
            <div className="h-[1px] w-20 bg-gradient-to-r from-transparent to-[#CCFF00]" />
            <p className="text-[#CCFF00] font-black uppercase tracking-[0.5em] text-[10px] italic">
              {isAr ? "النظام جاهز للتشغيل" : "SYSTEM OPERATIONAL"}
            </p>
            <div className="h-[1px] w-20 bg-gradient-to-l from-transparent to-[#CCFF00]" />
          </div>
        </header>

        <div className="space-y-16">
          {levels.map((level, lIndex) => {
            const levelLectures = lectures
              .filter((l) => l.level_id === level.id)
              .sort((a, b) => a.slot_number - b.slot_number);
            const isExamLevel = level.level_order % 5 === 0;
            const hasAccess = access.includes(level.id) || isAdmin || isModerator;

            return (
              <motion.section
                key={level.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                  <div className="flex items-end gap-6">
                    <div className="text-8xl font-black italic text-white/5 leading-none select-none">
                      {String(level.level_order).padStart(2, "0")}
                    </div>
                    <div className="mb-2">
                      <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tight text-white">
                        {level.title}
                      </h2>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[#CCFF00] text-[10px] font-black uppercase tracking-[0.2em]">
                          {levelLectures.length} UNITS
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {levelLectures.map((lecture, lectureIndex) => {
                    const isCompleted = progress.includes(lecture.id);
                    const isPreviousLectureCompleted =
                      lectureIndex === 0 || progress.includes(levelLectures[lectureIndex - 1].id);
                    const isLockedBySequence =
                      !isPreviousLectureCompleted && !isAdmin && !isModerator;
                    const isLectureAccessible = hasAccess && !isLockedBySequence;

                    if (
                      !isLectureAccessible &&
                      !isAdmin &&
                      !isModerator &&
                      lectureIndex > 0 &&
                      !isPreviousLectureCompleted
                    ) {
                      return null;
                    }

                    return (
                      <div key={lecture.id} className="relative group/card">
                        {!isLectureAccessible ? (
                          <div className="h-full p-8 rounded-[40px] bg-white/[0.02] border border-white/5 cursor-not-allowed">
                            <div className="flex justify-between items-start mb-6">
                              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 text-white/10">
                                <Lock className="w-5 h-5" />
                              </div>
                              <span className="text-[10px] font-black text-white/5 uppercase tracking-widest">
                                UNIT {lecture.slot_number}
                              </span>
                            </div>
                            <h3 className="font-black text-sm uppercase tracking-wider text-white/10">
                              {lecture.title}
                            </h3>
                          </div>
                        ) : (
                          <Link key={lecture.id} to={`/lecture/${lecture.id}`} className="group">
                            <div
                              className={`h-full p-8 rounded-[40px] bg-black/40 border transition-all duration-500 hover:scale-[1.02] active:scale-95 ${isCompleted ? "border-green-500/50 bg-green-500/5 shadow-[0_0_30px_rgba(34,197,94,0.1)]" : "border-white/10 hover:border-[#CCFF00]/50 hover:bg-white/[0.08]"}`}
                            >
                              <div className="flex justify-between items-start mb-6">
                                <div
                                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${isCompleted ? "bg-green-500 text-black border-green-400" : "bg-white/5 border-white/10 text-white/40"}`}
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-6 h-6" />
                                  ) : (
                                    <Play className="w-6 h-6" />
                                  )}
                                </div>
                                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                                  MODULE {lecture.slot_number}
                                </span>
                              </div>
                              <h3 className="font-black text-sm uppercase tracking-wider mb-2 group-hover:text-[#CCFF00] transition-colors">
                                {lecture.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="h-[1px] flex-1 bg-white/10" />
                                <span className="text-[8px] font-black uppercase text-[#CCFF00]">
                                  Launch Neural Link
                                </span>
                              </div>
                            </div>
                          </Link>
                        )}
                      </div>
                    );
                  })}

                  {hasAccess && (
                    <div className="md:col-span-full mt-4">
                      <Link to={`/levels/${level.id}/classroom`} className="block w-full">
                        <HeroButton
                          variant="primary"
                          className="w-full bg-cyan-500 text-black border-cyan-400 px-12 h-16 rounded-2xl shadow-xl uppercase font-black tracking-widest italic flex items-center justify-center gap-3"
                        >
                          <MessageSquare className="w-5 h-5" />
                          {isAr ? "دخول غرفة المحادثة" : "ENTER CLASSROOM"}
                        </HeroButton>
                      </Link>
                    </div>
                  )}

                  {isExamLevel && hasAccess && (
                    <div className="md:col-span-2 lg:col-span-3 mt-4">
                      <div className="p-10 rounded-[48px] bg-yellow-500/10 border border-yellow-500/20 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-5 transition-transform group-hover:scale-110">
                          <GraduationCap className="w-40 h-40" />
                        </div>
                        <div className="relative z-10 flex items-center gap-6">
                          <div className="w-20 h-20 rounded-[32px] bg-yellow-500 flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.4)]">
                            <GraduationCap className="w-10 h-10 text-black" />
                          </div>
                          <div>
                            <h3 className="text-3xl font-black italic uppercase tracking-tighter">
                              {isAr ? "تقييم المستوى" : "SECTOR EVALUATION"}
                            </h3>
                            <p className="text-yellow-500/60 text-[10px] font-black uppercase tracking-[0.4em] mt-1 italic">
                              VERIFYING COMPETENCY
                            </p>
                          </div>
                        </div>
                        <Link to={`/exam/${level.id}`}>
                          <HeroButton
                            variant="primary"
                            className="bg-yellow-500 text-black border-yellow-400 px-12 h-16 relative z-10 rounded-2xl shadow-xl uppercase font-black tracking-widest italic"
                          >
                            INITIATE EXAM
                          </HeroButton>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {lIndex < levels.length - 1 && (
                  <div className="absolute left-12 -bottom-12 w-[2px] h-12 bg-gradient-to-b from-white/10 to-transparent" />
                )}
              </motion.section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

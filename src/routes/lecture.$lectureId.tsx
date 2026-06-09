import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase-code";
import { useLanguage } from "../lib/LanguageContext";
import { useAuth } from "../hooks/use-auth";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Video,
  FileText,
  ArrowLeft,
  ArrowRight,
  Zap,
  Lock,
} from "lucide-react";
import { HeroButton } from "../funs/HeroButton";
import { toast } from "sonner";

export const Route = createFileRoute("/lecture/$lectureId")({
  component: LecturePage,
});

interface ContentBlock {
  type: "text" | "code" | "image";
  content: string;
}

interface Lecture {
  id: string;
  title: string;
  description: string;
  video_url: string;
  level_id: string;
  slot_number: number;
  content_blocks?: ContentBlock[];
}

function LecturePage() {
  const { lectureId } = Route.useParams();
  const { isAr } = useLanguage();
  const { user, profile, isApproved, isAdmin, isModerator, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLockedBySequence, setIsLockedBySequence] = useState(false);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [nextLectureId, setNextLectureId] = useState<string | null>(null);

  // Video player restrictions
  const [maxTimeWatched, setMaxTimeWatched] = useState(0);
  const [isVideoFinished, setIsVideoFinished] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const contentScrollRef = useRef<HTMLDivElement>(null);

  const fetchLecture = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("lectures")
        .select("*")
        .eq("id", lectureId)
        .single();

      if (error) throw error;
      setLecture(data);

      if (user) {
        // فحص حالة الإتمام، الصلاحيات الخاصة، واستدعاء دالة التتابع عبر الـ RPC من قاعدة البيانات
        const [progressDataRes, levelAccessRes, canAccessRes] = await Promise.all([
          supabase
            .from("student_progress")
            .select("*")
            .eq("student_id", user.id)
            .eq("lecture_id", lectureId)
            .single(),
          supabase
            .from("level_access")
            .select("level_id")
            .eq("user_id", user.id)
            .eq("level_id", data.level_id),
          supabase.rpc("can_student_access_level", {
            u_id: user.id,
            target_level_id: data.level_id,
          }),
        ]);

        setIsCompleted(!!progressDataRes.data);

        // تصحيح ثغرة مصفوفة الحماية الفاضية والتأكد من فتح المستوى دراسياً
        const hasLevelAccess =
          (levelAccessRes.data && levelAccessRes.data.length > 0) ||
          canAccessRes.data === true ||
          isAdmin ||
          isModerator;

        if (!hasLevelAccess) {
          toast.error(isAr ? "المستوى مقفل! يجب إنهاء المستويات السابقة أولاً." : "Level locked. Complete previous levels first.");
          navigate({ to: "/levels" });
          return;
        }

        // Sequential access check within the SAME level (Slot by Slot)
        const { data: allLecturesInLevel, error: allLecturesError } = await supabase
          .from("lectures")
          .select("id, slot_number")
          .eq("level_id", data.level_id)
          .order("slot_number", { ascending: true });

        if (allLecturesError) throw allLecturesError;

        if (allLecturesInLevel) {
          const currentLectureIndex = allLecturesInLevel.findIndex((l) => l.id === lectureId);

          if (currentLectureIndex > 0 && !isAdmin && !isModerator) {
            const previousLecture = allLecturesInLevel[currentLectureIndex - 1];
            const { data: previousLectureProgress } = await supabase
              .from("student_progress")
              .select("lecture_id")
              .eq("student_id", user.id)
              .eq("lecture_id", previousLecture.id);

            if (!previousLectureProgress || previousLectureProgress.length === 0) {
              setIsLockedBySequence(true);
              toast.error(
                isAr
                  ? "أكمل المحاضرة السابقة في هذا المستوى أولاً"
                  : "Please complete the previous lecture first.",
              );
              navigate({ to: "/levels" });
              return;
            }
          }

          if (currentLectureIndex !== -1 && currentLectureIndex < allLecturesInLevel.length - 1) {
            setNextLectureId(allLecturesInLevel[currentLectureIndex + 1].id);
          } else {
            setNextLectureId(null);
          }
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || (isAr ? "فشل في تحميل المحاضرة" : "Failed to load lecture"));
      navigate({ to: "/levels" });
    } finally {
      setLoading(false);
    }
  }, [lectureId, user, isAdmin, isModerator, isAr, navigate]);

  // Check approval on load
  useEffect(() => {
    if (!loading && !isApproved && !isAdmin && !isModerator) {
      toast.error(isAr ? "تحتاج إلى موافقة المدير للوصول" : "Pending administrative approval");
      navigate({ to: "/levels" });
    }
  }, [isApproved, loading, isAdmin, isModerator, isAr, navigate]);

  // Fetch lecture data and check sequence
  useEffect(() => {
    fetchLecture();
    setMaxTimeWatched(0);
    setIsVideoFinished(false);
  }, [lectureId, user, fetchLecture]);

  // Scroll listener for content completion
  useEffect(() => {
    const handleScroll = () => {
      if (contentScrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = contentScrollRef.current;
        if (scrollHeight - scrollTop <= clientHeight + 20) {
          setHasScrolledToEnd(true);
        } else {
          setHasScrolledToEnd(false);
        }
      }
    };

    const currentRef = contentScrollRef.current;
    if (currentRef) {
      currentRef.addEventListener("scroll", handleScroll);
      handleScroll();

      if (currentRef.scrollHeight <= currentRef.clientHeight) {
        setHasScrolledToEnd(true);
      }
    }
    return () => {
      if (currentRef) {
        currentRef.removeEventListener("scroll", handleScroll);
      }
    };
  }, [lecture, loading]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement) {
      const checkVideoCompletion = () => {
        if (videoElement.duration > 0 && videoElement.currentTime >= videoElement.duration - 0.5) {
          setIsVideoFinished(true);
          videoElement.removeEventListener("timeupdate", checkVideoCompletion);
        }
      };

      videoElement.addEventListener("timeupdate", checkVideoCompletion);
      return () => videoElement.removeEventListener("timeupdate", checkVideoCompletion);
    }
  }, [videoRef, lectureId]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      if (videoRef.current.currentTime > maxTimeWatched) {
        setMaxTimeWatched(videoRef.current.currentTime);
      }
    }
  };

  const handleSeeking = () => {
    if (videoRef.current && videoRef.current.currentTime > maxTimeWatched) {
      videoRef.current.currentTime = maxTimeWatched;
      toast.info(
        isAr ? "لا يمكنك التخطي للأمام في الفيديو" : "You cannot skip forward in the video",
      );
    }
  };

  const handleVideoEnded = () => {
    setIsVideoFinished(true);
    toast.success(
      isAr
        ? "اكتمل الفيديو! يمكنك الآن إكمال المهمة"
        : "Video completed! You can now execute the mission",
    );
  };

  const handleComplete = async () => {
    if (
      !user ||
      isCompleted ||
      isSubmitting ||
      !hasScrolledToEnd ||
      (!isVideoFinished &&
        lecture?.video_url &&
        lecture.video_url.match(/\.(mp4|webm|ogg)$/i) &&
        !isAdmin &&
        !isModerator)
    ) {
      if (!hasScrolledToEnd) {
        toast.error(
          isAr
            ? "يرجى قراءة شرح المهمة بالكامل (قم بالتمرير للأسفل)"
            : "Please read the full mission briefing (scroll to bottom)",
        );
      } else if (
        !isVideoFinished &&
        lecture?.video_url &&
        lecture.video_url.match(/\.(mp4|webm|ogg)$/i) &&
        !isAdmin &&
        !isModerator
      ) {
        toast.error(isAr ? "الرجاء إنهاء الفيديو أولاً" : "Please finish the video first");
      }
      return;
    }
    
    setIsSubmitting(true);
    try {
      // تم التصحيح: استدعاء الدالة الآمنة عبر قاعدة البيانات
      const { error: rpcError } = await supabase.rpc("complete_lecture_secure", {
        p_lecture_id: lectureId,
      });

      if (rpcError) throw rpcError;

      // تحديث نقاط الطالب والـ XP محلياً بعد التحقق
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          xp: (profile?.xp || 0) + 50,
          score: (profile?.score || 0) + 10,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      setIsCompleted(true);
      refreshProfile();
      toast.success(isAr ? "تم إكمال المهمة! +50 XP" : "Mission accomplished! +50 XP");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || (isAr ? "حدث خطأ أثناء حفظ تقدمك" : "Error saving progress"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("youtube.com/watch?v=")) return url.replace("watch?v=", "embed/");
    if (url.includes("youtu.be/")) return url.replace("youtu.be/", "youtube.com/embed/");
    return url;
  };

  if (loading || !lecture) {
    return (
      <div className="min-h-screen bg-[#0038FF] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#CCFF00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isLockedBySequence) {
    return (
      <div className="min-h-screen bg-[#0038FF] text-white p-6 flex flex-col items-center justify-center text-center">
        <div className="max-w-md space-y-8 p-12 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[48px] shadow-2xl">
          <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase">
            {isAr ? "مهمة مقفلة" : "MISSION LOCKED"}
          </h1>
          <p className="text-white/40 font-bold text-sm leading-relaxed uppercase tracking-widest">
            {isAr
              ? "عليك إكمال المحاضرة السابقة أولاً لفك قفل هذه المهمة."
              : "You must complete the previous mission to unlock this one."}
          </p>
          <HeroButton
            onClick={() => navigate({ to: "/levels" })}
            variant="primary"
            className="mt-8 bg-[#CCFF00] text-black"
          >
            {isAr ? "العودة إلى مسار المهمات" : "Return to Mission Track"}
          </HeroButton>
        </div>
      </div>
    );
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
              {isAr ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            </div>
            <span className="text-xs font-black uppercase tracking-widest">
              {isAr ? "العودة" : "RETURN"}
            </span>
          </button>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-12 mb-12">
          <div
            ref={contentScrollRef}
            className="lg:col-span-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar pr-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="aspect-video w-full rounded-[40px] overflow-hidden bg-black/40 border border-white/10 shadow-2xl relative"
            >
              {lecture.video_url ? (
                lecture.video_url.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video
                    ref={videoRef}
                    src={lecture.video_url}
                    controls
                    className="w-full h-full object-cover"
                    onTimeUpdate={handleTimeUpdate}
                    onSeeking={handleSeeking}
                    onEnded={handleVideoEnded}
                    onContextMenu={(e) => e.preventDefault()}
                    controlsList="nodownload"
                  />
                ) : (
                  <iframe
                    src={getEmbedUrl(lecture.video_url)}
                    className="w-full h-full"
                    allowFullScreen={true}
                  />
                )
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-white/20">
                  <Video className="w-16 h-16" />
                  <p className="font-black uppercase tracking-widest text-[10px]">
                    No Neural Uplink
                  </p>
                </div>
              )}
            </motion.div>

            <div className="space-y-8">
              {lecture.content_blocks?.map((block, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-10 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-xl"
                >
                  {block.type === "text" && (
                    <p className="text-lg text-white/70 leading-relaxed whitespace-pre-wrap">
                      {block.content}
                    </p>
                  )}
                  {block.type === "code" && (
                    <div className="relative group">
                      <pre className="bg-black/60 p-8 rounded-3xl overflow-x-auto text-sm font-mono text-cyan-400 border border-white/5">
                        <code>{block.content}</code>
                      </pre>
                      <div className="absolute top-4 right-4 text-[8px] font-black text-white/10 uppercase tracking-widest">
                        ST-OS COMPILED
                      </div>
                    </div>
                  )}
                  {block.type === "image" && (
                    <img
                      src={block.content}
                      className="w-full rounded-3xl border border-white/10 shadow-2xl"
                      alt=""
                    />
                  )}
                </motion.div>
              ))}

              {(!lecture.content_blocks || lecture.content_blocks.length === 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-10 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-xl"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                      <FileText className="w-6 h-6 text-cyan-500" />
                    </div>
                    <h2 className="text-2xl font-black italic uppercase tracking-tight">
                      {isAr ? "شرح المهمة" : "MISSION BRIEFING"}
                    </h2>
                  </div>
                  <p className="text-lg text-white/70 leading-relaxed whitespace-pre-wrap">
                    {lecture.description}
                  </p>
                </motion.div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6 mt-12">
            <div className="p-8 rounded-[40px] bg-black/40 border border-white/10 backdrop-blur-3xl sticky top-24">
              <div className="mb-8">
                <span className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.4em]">
                  UNIT {lecture.slot_number}
                </span>
                <h1 className="text-3xl font-black italic uppercase tracking-tighter mt-2 leading-none">
                  {lecture.title}
                </h1>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-[#CCFF00]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                      Efficiency Bonus
                    </span>
                  </div>
                  <span className="text-sm font-black text-[#CCFF00]">+50 XP</span>
                </div>
              </div>

              {isCompleted ? (
                <div className="w-full py-6 rounded-2xl bg-green-500/10 border border-green-500/20 flex flex-col items-center justify-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500">
                    {isAr ? "تمت المهمة" : "SYNCHRONIZED"}
                  </span>
                  {nextLectureId && (
                    <Link to={`/lecture/${nextLectureId}`} className="mt-4">
                      <HeroButton
                        variant="primary"
                        className="bg-cyan-500 text-black border-cyan-400"
                      >
                        {isAr ? "الوحدة التالية" : "NEXT MODULE"}{" "}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </HeroButton>
                    </Link>
                  )}
                </div>
              ) : (
                <HeroButton
                  onClick={handleComplete}
                  loading={isSubmitting}
                  variant="primary"
                  className="w-full h-16 bg-[#CCFF00] text-black border-[#CCFF00]"
                  disabled={
                    !hasScrolledToEnd ||
                    isSubmitting ||
                    (lecture.video_url &&
                      lecture.video_url.match(/\.(mp4|webm|ogg)$/i) &&
                      !isVideoFinished &&
                      !isAdmin &&
                      !isModerator)
                  }
                >
                  {isAr ? "إكمال المهمة" : "EXECUTE MISSION"}
                </HeroButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LecturePage;
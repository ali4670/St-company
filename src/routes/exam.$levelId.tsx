import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase-code";
import { useLanguage } from "../lib/LanguageContext";
import { useAuth } from "../hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, ArrowLeft, ArrowRight, ShieldAlert, CheckCircle2, Trophy } from "lucide-react";
import { HeroButton } from "../funs/HeroButton";
import { toast } from "sonner";

export const Route = createFileRoute("/exam/$levelId")({
  component: ExamPage,
});

interface Question {
  id: string;
  text: string;
  options: string[];
  correct: number;
}

interface Exam {
  id: string;
  title: string;
  questions: Question[];
}

function ExamPage() {
  const { levelId } = Route.useParams();
  const { isAr } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetchExam();
  }, [levelId]);

  const fetchExam = async () => {
    try {
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .eq("level_id", levelId)
        .single();

      if (error || !data) {
        // Fallback for demo if no exam exists in DB
        setExam({
          id: "demo",
          title: isAr ? "تقييم الكفاءة التكنولوجية" : "TECH COMPETENCY EVALUATION",
          questions: [
            {
              id: "1",
              text: isAr ? "ما هو المكون المسؤول عن معالجة البيانات في الروبوت؟" : "Which component handles data processing in a robot?",
              options: isAr ? ["المحرك", "المعالج", "البطارية", "المستشعر"] : ["Actuator", "Processor", "Battery", "Sensor"],
              correct: 1
            },
            {
              id: "2",
              text: isAr ? "ما هي لغة البرمجة الأكثر استخداماً في تطوير الروبوتات؟" : "What is the most common language in robotics development?",
              options: ["Python", "HTML", "CSS", "SQL"],
              correct: 0
            }
          ]
        });
      } else {
        setExam({
          id: data.id,
          title: data.title,
          questions: data.questions as Question[]
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestion < (exam?.questions.length || 0) - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      finishExam();
    }
  };

  const finishExam = () => {
    let correctCount = 0;
    exam?.questions.forEach((q, i) => {
      if (answers[i] === q.correct) correctCount++;
    });
    
    const finalScore = Math.round((correctCount / (exam?.questions.length || 1)) * 100);
    setScore(finalScore);
    setIsFinished(true);
    
    if (finalScore >= 70) {
      toast.success(isAr ? "مبروك! لقد اجتزت الاختبار." : "Congratulations! You passed the evaluation.");
    } else {
      toast.error(isAr ? "لم تجتز الاختبار. حاول مرة أخرى." : "Evaluation failed. Please try again.");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0038FF] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#CCFF00] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!exam) return null;

  return (
    <div className="min-h-screen bg-[#0038FF] text-white p-6 relative overflow-hidden">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0"></div>

      <div className="container mx-auto max-w-4xl relative z-10 pt-10">
        <header className="mb-12 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <GraduationCap className="w-8 h-8 text-[#CCFF00]" />
            <h1 className="text-4xl font-black italic tracking-tighter uppercase">{exam.title}</h1>
          </div>
          <div className="h-[2px] w-32 bg-[#CCFF00]/30 mx-auto" />
        </header>

        <AnimatePresence mode="wait">
          {!isFinished ? (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[48px] p-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-10">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500">
                  QUESTION {currentQuestion + 1} OF {exam.questions.length}
                </span>
                <div className="h-1 flex-grow mx-8 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-cyan-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentQuestion + 1) / exam.questions.length) * 100}%` }}
                  />
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-10 leading-relaxed">
                {exam.questions[currentQuestion].text}
              </h2>

              <div className="grid gap-4">
                {exam.questions[currentQuestion].options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    className={`w-full p-6 rounded-3xl border text-left transition-all duration-300 font-bold flex items-center gap-4 ${
                      answers[currentQuestion] === idx 
                        ? "bg-cyan-500 border-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.3)]" 
                        : "bg-white/5 border-white/10 hover:border-white/30"
                    } ${isAr ? "flex-row-reverse text-right" : ""}`}
                  >
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs ${
                      answers[currentQuestion] === idx ? "border-black/20 bg-black/10" : "border-white/10 bg-white/5"
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    {option}
                  </button>
                ))}
              </div>

              <div className="flex justify-between mt-12 pt-8 border-t border-white/5">
                <HeroButton 
                  onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestion === 0}
                  variant="outline"
                  className="px-8"
                >
                  {isAr ? "السابق" : "PREVIOUS"}
                </HeroButton>
                <HeroButton 
                  onClick={nextQuestion}
                  disabled={answers[currentQuestion] === undefined}
                  variant="primary"
                  className="px-10 bg-[#CCFF00] text-black"
                >
                  {currentQuestion === exam.questions.length - 1 ? (isAr ? "إنهاء" : "FINISH") : (isAr ? "التالي" : "NEXT")}
                </HeroButton>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[48px] p-16 text-center shadow-2xl"
            >
              <div className={`w-32 h-32 rounded-[40px] mx-auto mb-10 flex items-center justify-center ${
                score >= 70 ? "bg-green-500 shadow-[0_0_50px_rgba(34,197,94,0.3)]" : "bg-red-500 shadow-[0_0_50px_rgba(239,68,68,0.3)]"
              }`}>
                {score >= 70 ? <Trophy className="w-16 h-16 text-white" /> : <ShieldAlert className="w-16 h-16 text-white" />}
              </div>

              <h2 className="text-5xl font-black italic tracking-tighter mb-4">
                {score}% {isAr ? "النتيجة" : "SCORE"}
              </h2>
              
              <p className="text-white/40 font-bold uppercase tracking-[0.4em] mb-12">
                {score >= 70 
                  ? (isAr ? "تم إكمال التقييم بنجاح" : "EVALUATION PROTOCOL PASSED") 
                  : (isAr ? "لم يتم استيفاء معايير النجاح" : "BENCHMARK NOT REACHED")}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <HeroButton 
                  onClick={() => navigate({ to: "/levels" })}
                  variant="primary"
                  className="px-10 bg-white text-black h-14"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {isAr ? "العودة للمسار" : "BACK TO PATH"}
                </HeroButton>
                {score < 70 && (
                  <HeroButton 
                    onClick={() => {
                      setIsFinished(false);
                      setCurrentQuestion(0);
                      setAnswers([]);
                    }}
                    variant="outline"
                    className="px-10 h-14"
                  >
                    {isAr ? "إعادة المحاولة" : "RETRY EVALUATION"}
                  </HeroButton>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

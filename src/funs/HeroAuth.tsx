import React, { useState } from "react";
import { supabase } from "../lib/supabase-code";
import { useLanguage } from "../lib/LanguageContext";
import { X, Mail, Lock, Loader2, ArrowRight, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { HeroButton } from "./HeroButton";

interface HeroAuthProps {
  onClose: () => void;
}

export const HeroAuth: React.FC<HeroAuthProps> = ({ onClose }) => {
  const { isAr } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        toast.success(isAr ? "تم إرسال رابط استعادة كلمة المرور" : "Reset link sent to your email");
        setIsForgot(false);
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(isAr ? "مرحباً بك مرة أخرى!" : "Welcome back!");
        onClose();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: email.split("@")[0],
            },
          },
        });
        if (error) throw error;
        toast.success(
          isAr ? "تم إنشاء الحساب! تحقق من بريدك" : "Account created! Check your email",
        );
        onClose();
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const t = {
    title: isForgot
      ? isAr ? "استعادة الحساب" : "RECOVER"
      : isAr ? (isLogin ? "تسجيل الدخول" : "انضم إلينا") : (isLogin ? "AUTH" : "ENLIST"),
    subtitle: isForgot
      ? isAr ? "أدخل بريدك الإلكتروني لاستلام الرابط" : "Verify identity via email"
      : isAr ? (isLogin ? "ادخل للعب مع أصدقائك" : "أنشئ حساباً لبدء المنافسة") : (isLogin ? "Mission authentication required" : "Create unique identification tag"),
    email: isAr ? "البريد الإلكتروني" : "Access ID",
    password: isAr ? "كلمة المرور" : "Encryption Key",
    button: isForgot
      ? isAr ? "إرسال الرابط" : "Dispatch"
      : isAr ? (isLogin ? "دخول آمن" : "إنشاء حساب") : (isLogin ? "Initialize" : "Register"),
    switch: isAr ? (isLogin ? "ليس لديك حساب؟ سجل الآن" : "لديك حساب بالفعل؟ ادخل") : (isLogin ? "Request new identification" : "Use existing credentials"),
    forgot: isAr ? "نسيت كلمة المرور؟" : "Lost Key?",
    back: isAr ? "العودة لتسجيل الدخول" : "Back to Auth",
  };

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-[#030303] py-20 px-4 md:px-0">
      {/* Background Hero Elements */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop"
          alt="Office background"
          className="w-full h-full object-cover opacity-10 grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030303] via-transparent to-[#030303]" />
      </div>

      {/* Floating Animated Shapes */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-[540px] bg-white/[0.02] border border-white/10 rounded-[64px] p-12 md:p-16 backdrop-blur-3xl shadow-[0_48px_120px_-24px_rgba(0,0,0,1)] z-10"
      >
        <button
          onClick={onClose}
          className="absolute top-12 right-12 text-white/10 hover:text-white transition-all p-3 hover:bg-white/5 rounded-2xl active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 rounded-3xl bg-cyan-500 flex items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.4)] mx-auto mb-10"
          >
            <Zap className="w-10 h-10 text-black fill-current" />
          </motion.div>
          <h2 className="text-6xl font-black text-white italic tracking-tighter uppercase mb-6 leading-none">
            {t.title}
          </h2>
          <p className="text-cyan-500/40 text-[11px] font-black uppercase tracking-[0.5em]">
            {t.subtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="space-y-4">
            <label className={`block text-[11px] font-black text-white/20 uppercase tracking-[0.4em] ml-1 ${isAr ? "text-right" : ""}`}>
              {t.email}
            </label>
            <div className="relative group/input">
              <Mail className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-white/10 group-focus-within/input:text-cyan-400 transition-colors ${isAr ? "right-8" : "left-8"}`} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full bg-black/40 border border-white/5 rounded-[32px] py-6 text-white font-bold placeholder:text-white/5 focus:outline-none focus:border-cyan-500/30 focus:bg-white/[0.04] transition-all ${isAr ? "pr-20 text-right" : "pl-20"}`}
                placeholder="IDENTIFIER@ST-CORP.COM"
              />
            </div>
          </div>

          {!isForgot && (
            <div className="space-y-4">
              <div className={`flex justify-between items-center px-2 ${isAr ? "flex-row-reverse" : ""}`}>
                <label className="block text-[11px] font-black text-white/20 uppercase tracking-[0.4em]">
                  {t.password}
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgot(true)}
                  className="text-[10px] font-black text-white/30 hover:text-purple-400 transition-colors uppercase tracking-[0.3em]"
                >
                  {t.forgot}
                </button>
              </div>
              <div className="relative group/input">
                <Lock className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-white/10 group-focus-within/input:text-purple-400 transition-colors ${isAr ? "right-8" : "left-8"}`} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-black/40 border border-white/5 rounded-[32px] py-6 text-white font-bold placeholder:text-white/5 focus:outline-none focus:border-purple-500/30 focus:bg-white/[0.04] transition-all ${isAr ? "pr-20 text-right" : "pl-20"}`}
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          <HeroButton
            type="submit"
            disabled={loading}
            size="xl"
            className="w-full"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                {t.button}
                <ArrowRight className={`w-5 h-5 transition-transform group-hover:translate-x-3 ${isAr ? "rotate-180" : ""}`} />
              </>
            )}
          </HeroButton>
        </form>

        <div className="mt-16 pt-10 border-t border-white/5 flex flex-col items-center">
          <HeroButton
            variant="ghost"
            size="sm"
            onClick={() => {
              if (isForgot) setIsForgot(false);
              else setIsLogin(!isLogin);
            }}
          >
            {isForgot ? t.back : t.switch}
          </HeroButton>
        </div>
      </motion.div>
    </div>
  );
};

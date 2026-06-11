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
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-[#020202] py-20 px-4 md:px-0">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#0038FF20,transparent_50%)]" />
        <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[20%] left-[10%] w-[500px] h-[500px] bg-[#CCFF00]/5 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative w-full max-w-[500px] bg-white/[0.03] border border-white/10 rounded-[48px] p-10 md:p-14 backdrop-blur-2xl shadow-2xl z-10 overflow-hidden"
      >
        {/* Glow effect on the card */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/50 to-transparent" />
        
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-white/20 hover:text-white transition-all p-2 hover:bg-white/5 rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-2xl bg-[#CCFF00] flex items-center justify-center shadow-[0_0_40px_rgba(204,255,0,0.3)] mx-auto mb-8"
          >
            <Lock className="w-8 h-8 text-black" />
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase mb-4 leading-none">
            {t.title}
          </h2>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">
            {t.subtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label className={`block text-[9px] font-black text-white/30 uppercase tracking-[0.3em] px-2 ${isAr ? "text-right" : ""}`}>
              {t.email}
            </label>
            <div className="relative group/input">
              <Mail className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/input:text-[#CCFF00] transition-colors ${isAr ? "right-6" : "left-6"}`} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full bg-black/40 border border-white/5 rounded-3xl py-5 text-white font-bold placeholder:text-white/5 focus:outline-none focus:border-[#CCFF00]/30 focus:bg-white/[0.04] transition-all text-sm ${isAr ? "pr-16 text-right" : "pl-16"}`}
                placeholder="EMAIL@ACCESS.COM"
              />
            </div>
          </div>

          {!isForgot && (
            <div className="space-y-3">
              <div className={`flex justify-between items-center px-2 ${isAr ? "flex-row-reverse" : ""}`}>
                <label className="block text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">
                  {t.password}
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgot(true)}
                  className="text-[8px] font-black text-white/20 hover:text-[#CCFF00] transition-colors uppercase tracking-widest"
                >
                  {t.forgot}
                </button>
              </div>
              <div className="relative group/input">
                <Lock className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/input:text-[#CCFF00] transition-colors ${isAr ? "right-6" : "left-6"}`} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-black/40 border border-white/5 rounded-3xl py-5 text-white font-bold placeholder:text-white/5 focus:outline-none focus:border-[#CCFF00]/30 focus:bg-white/[0.04] transition-all text-sm ${isAr ? "pr-16 text-right" : "pl-16"}`}
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          <div className="pt-4">
            <HeroButton
                type="submit"
                disabled={loading}
                className="w-full h-16 bg-[#CCFF00] text-black border-[#CCFF00] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_40px_-10px_rgba(204,255,0,0.2)]"
            >
                {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                <span className="flex items-center gap-3 font-black uppercase tracking-widest italic italic">
                    {t.button}
                    <ArrowRight className={`w-5 h-5 ${isAr ? "rotate-180" : ""}`} />
                </span>
                )}
            </HeroButton>
          </div>
        </form>

        <div className="mt-12 pt-8 border-t border-white/5 text-center">
          <button
            type="button"
            onClick={() => {
              if (isForgot) setIsForgot(false);
              else setIsLogin(!isLogin);
            }}
            className="text-[10px] font-black text-white/30 hover:text-white transition-all uppercase tracking-widest"
          >
            {isForgot ? t.back : t.switch}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

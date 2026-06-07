import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, useRouter, Link, Outlet, HeadContent, Scripts, createFileRoute, lazyRouteComponent, createRouter } from "@tanstack/react-router";
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, createContext, useContext, useRef } from "react";
import { X, Zap, Mail, Lock, Loader2, ArrowRight, User, Camera, Key, Save, Globe, Shield, LogOut } from "lucide-react";
import { toast, Toaster } from "sonner";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
const appCss = "/assets/styles-i9Y6N5NM.css";
function reportLovableError(error, context = {}) {
  if (typeof window === "undefined") return;
  window.__lovableEvents?.captureException?.(
    error,
    {
      source: "react_error_boundary",
      route: window.location.pathname,
      ...context
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error"
    }
  );
}
const LanguageContext = createContext(void 0);
const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("en");
  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);
  const isAr = language === "ar";
  return /* @__PURE__ */ jsx(LanguageContext.Provider, { value: { language, setLanguage, isAr }, children });
};
const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === void 0) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
const supabaseUrl = "https://hcfqtgydoonpyskxibyt.supabase.co";
const supabaseAnonKey = "sb_publishable_rV89m4GouX2LLFqRgzSNEQ_AywB-6Ne";
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const AuthContext = createContext(void 0);
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (error) {
        if (error.code === "PGRST116") {
          const { data: userData } = await supabase.auth.getUser();
          const newProfile = {
            id: userId,
            username: userData.user?.email?.split("@")[0] || "Player",
            score: 0,
            is_admin: userData.user?.email === "aliahmedsabry8@gmail.com"
          };
          const { data: createdProfile, error: createError } = await supabase.from("profiles").insert([newProfile]).select().single();
          if (!createError) setProfile(createdProfile);
        }
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: session2 } }) => {
      setSession(session2);
      setUser(session2?.user ?? null);
      if (session2?.user) {
        fetchProfile(session2.user.id).then(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session2) => {
      setSession(session2);
      setUser(session2?.user ?? null);
      if (session2?.user) {
        fetchProfile(session2.user.id).then(() => {
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };
  const signOut = async () => {
    await supabase.auth.signOut();
  };
  const isAdmin = profile?.is_admin || user?.email === "aliahmedsabry8@gmail.com";
  return /* @__PURE__ */ jsx(
    AuthContext.Provider,
    {
      value: { user, session, profile, loading, isAdmin, refreshProfile, signOut },
      children
    }
  );
};
const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === void 0) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
const HeroAuth = ({ onClose }) => {
  const { isAr } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
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
              username: email.split("@")[0]
            }
          }
        });
        if (error) throw error;
        toast.success(
          isAr ? "تم إنشاء الحساب! تحقق من بريدك" : "Account created! Check your email"
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
    title: isForgot ? isAr ? "استعادة الحساب" : "RECOVER" : isAr ? isLogin ? "تسجيل الدخول" : "انضم إلينا" : isLogin ? "AUTH" : "ENLIST",
    subtitle: isForgot ? isAr ? "أدخل بريدك الإلكتروني لاستلام الرابط" : "Verify identity via email" : isAr ? isLogin ? "ادخل للعب مع أصدقائك" : "أنشئ حساباً لبدء المنافسة" : isLogin ? "Mission authentication required" : "Create unique identification tag",
    email: isAr ? "البريد الإلكتروني" : "Access ID",
    password: isAr ? "كلمة المرور" : "Encryption Key",
    button: isForgot ? isAr ? "إرسال الرابط" : "Dispatch" : isAr ? isLogin ? "دخول آمن" : "إنشاء حساب" : isLogin ? "Initialize" : "Register",
    switch: isAr ? isLogin ? "ليس لديك حساب؟ سجل الآن" : "لديك حساب بالفعل؟ ادخل" : isLogin ? "Request new identification" : "Use existing credentials",
    forgot: isAr ? "نسيت كلمة المرور؟" : "Lost Key?",
    back: isAr ? "العودة لتسجيل الدخول" : "Back to Auth"
  };
  return /* @__PURE__ */ jsxs("div", { className: "relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-[#030303] py-20 px-4 md:px-0", children: [
    /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 z-0", children: [
      /* @__PURE__ */ jsx(
        "img",
        {
          src: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop",
          alt: "Office background",
          className: "w-full h-full object-cover opacity-10 grayscale"
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-[#030303] via-transparent to-[#030303]" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" }),
    /* @__PURE__ */ jsx("div", { className: "absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-1000" }),
    /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, scale: 0.95, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        className: "relative w-full max-w-[540px] bg-white/[0.02] border border-white/10 rounded-[64px] p-12 md:p-16 backdrop-blur-3xl shadow-[0_48px_120px_-24px_rgba(0,0,0,1)] z-10",
        children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: onClose,
              className: "absolute top-12 right-12 text-white/10 hover:text-white transition-all p-3 hover:bg-white/5 rounded-2xl active:scale-90",
              children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" })
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "text-center mb-16", children: [
            /* @__PURE__ */ jsx(
              motion.div,
              {
                initial: { scale: 0.8, opacity: 0 },
                animate: { scale: 1, opacity: 1 },
                className: "w-20 h-20 rounded-3xl bg-cyan-500 flex items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.4)] mx-auto mb-10",
                children: /* @__PURE__ */ jsx(Zap, { className: "w-10 h-10 text-black fill-current" })
              }
            ),
            /* @__PURE__ */ jsx("h2", { className: "text-6xl font-black text-white italic tracking-tighter uppercase mb-6 leading-none", children: t.title }),
            /* @__PURE__ */ jsx("p", { className: "text-cyan-500/40 text-[11px] font-black uppercase tracking-[0.5em]", children: t.subtitle })
          ] }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-10", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsx("label", { className: `block text-[11px] font-black text-white/20 uppercase tracking-[0.4em] ml-1 ${isAr ? "text-right" : ""}`, children: t.email }),
              /* @__PURE__ */ jsxs("div", { className: "relative group/input", children: [
                /* @__PURE__ */ jsx(Mail, { className: `absolute top-1/2 -translate-y-1/2 w-5 h-5 text-white/10 group-focus-within/input:text-cyan-400 transition-colors ${isAr ? "right-8" : "left-8"}` }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "email",
                    required: true,
                    value: email,
                    onChange: (e) => setEmail(e.target.value),
                    className: `w-full bg-black/40 border border-white/5 rounded-[32px] py-6 text-white font-bold placeholder:text-white/5 focus:outline-none focus:border-cyan-500/30 focus:bg-white/[0.04] transition-all ${isAr ? "pr-20 text-right" : "pl-20"}`,
                    placeholder: "IDENTIFIER@ST-CORP.COM"
                  }
                )
              ] })
            ] }),
            !isForgot && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { className: `flex justify-between items-center px-2 ${isAr ? "flex-row-reverse" : ""}`, children: [
                /* @__PURE__ */ jsx("label", { className: "block text-[11px] font-black text-white/20 uppercase tracking-[0.4em]", children: t.password }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setIsForgot(true),
                    className: "text-[10px] font-black text-white/30 hover:text-purple-400 transition-colors uppercase tracking-[0.3em]",
                    children: t.forgot
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "relative group/input", children: [
                /* @__PURE__ */ jsx(Lock, { className: `absolute top-1/2 -translate-y-1/2 w-5 h-5 text-white/10 group-focus-within/input:text-purple-400 transition-colors ${isAr ? "right-8" : "left-8"}` }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "password",
                    required: true,
                    value: password,
                    onChange: (e) => setPassword(e.target.value),
                    className: `w-full bg-black/40 border border-white/5 rounded-[32px] py-6 text-white font-bold placeholder:text-white/5 focus:outline-none focus:border-purple-500/30 focus:bg-white/[0.04] transition-all ${isAr ? "pr-20 text-right" : "pl-20"}`,
                    placeholder: "••••••••"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                disabled: loading,
                className: "group w-full py-6 bg-white text-black font-black text-[12px] uppercase tracking-[0.5em] rounded-[32px] hover:bg-cyan-50 transition-all disabled:opacity-50 flex items-center justify-center gap-6 shadow-2xl shadow-white/5 active:scale-95",
                children: loading ? /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  t.button,
                  /* @__PURE__ */ jsx(ArrowRight, { className: `w-5 h-5 transition-transform group-hover:translate-x-3 ${isAr ? "rotate-180" : ""}` })
                ] })
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-16 pt-10 border-t border-white/5 flex flex-col items-center", children: /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                if (isForgot) setIsForgot(false);
                else setIsLogin(!isLogin);
              },
              className: "text-[10px] font-black text-white/20 hover:text-white transition-colors uppercase tracking-[0.4em]",
              children: isForgot ? t.back : t.switch
            }
          ) })
        ]
      }
    )
  ] });
};
const AuthModal = ({ isOpen, onClose }) => {
  return /* @__PURE__ */ jsx(AnimatePresence, { children: isOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[200] overflow-y-auto", children: /* @__PURE__ */ jsx(HeroAuth, { onClose }) }) });
};
const ProfileEdit = ({
  isOpen,
  onClose,
  targetProfile,
  onUpdate
}) => {
  const { isAr } = useLanguage();
  const { user, profile: myProfile, isAdmin, refreshProfile } = useAuth();
  const fileInputRef = useRef(null);
  const currentProfile = targetProfile || myProfile;
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    if (isOpen && currentProfile) {
      setUsername(currentProfile.username || "");
      setAvatarUrl(currentProfile.avatar_url || "");
      setScore(currentProfile.score || 0);
      setNewPassword("");
    }
  }, [isOpen, currentProfile]);
  const handleFileUpload = async (event) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      if (!user) throw new Error("You must be logged in to upload");
      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file);
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl }
      } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUrl(publicUrl);
      toast.success(isAr ? "تم رفع الصورة بنجاح" : "Identity verified: Data uploaded");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setUploading(false);
    }
  };
  const handleUpdate = async (e) => {
    e.preventDefault();
    const targetId = targetProfile?.id || myProfile?.id || user?.id;
    if (!targetId) return;
    setLoading(true);
    try {
      const updates = {
        username,
        avatar_url: avatarUrl,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (isAdmin && targetProfile) {
        updates.score = score;
      }
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: targetId,
        ...updates
      });
      if (profileError) throw profileError;
      if (newPassword && !targetProfile) {
        const { error: authError } = await supabase.auth.updateUser({
          password: newPassword
        });
        if (authError) throw authError;
      }
      toast.success(isAr ? "تم الحفظ بنجاح" : "System updated successfully");
      await refreshProfile();
      if (onUpdate) onUpdate();
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message || "Error updating profile");
      }
    } finally {
      setLoading(false);
    }
  };
  const t = {
    title: isAdmin && targetProfile ? isAr ? "إدارة اللاعب" : "ADMIN PANEL" : isAr ? "ملفي الشخصي" : "PROFILE",
    username: isAr ? "اسم اللاعب" : "User Identifier",
    password: isAr ? "كلمة مرور جديدة" : "New Encryption Key",
    passHint: isAr ? "اتركها فارغة لعدم التغيير" : "Retain current key",
    score: isAr ? "نقاط الخبرة" : "Combat Experience",
    save: isAr ? "حفظ البيانات" : "Commit Changes"
  };
  return /* @__PURE__ */ jsx(AnimatePresence, { children: isOpen && /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl overflow-y-auto", children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay",
        style: { backgroundImage: `url('https://grainy-gradients.vercel.app/noise.svg')` }
      }
    ),
    /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, scale: 0.95, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: 20 },
        className: "relative w-full max-w-[520px] bg-white/[0.02] border border-white/10 rounded-[56px] p-12 backdrop-blur-3xl shadow-[0_48px_120px_-24px_rgba(0,0,0,1)] group",
        children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-10 left-10 w-6 h-6 border-t-2 border-l-2 border-cyan-500/40 rounded-tl-2xl" }),
          /* @__PURE__ */ jsx("div", { className: "absolute top-10 right-10 w-6 h-6 border-t-2 border-r-2 border-white/10 rounded-tr-2xl" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: onClose,
              className: "absolute top-12 right-12 text-white/10 hover:text-white transition-all p-3 hover:bg-white/5 rounded-2xl active:scale-90",
              children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" })
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center mb-12", children: [
            /* @__PURE__ */ jsxs(
              "div",
              {
                className: "relative group/avatar cursor-pointer",
                onClick: () => fileInputRef.current?.click(),
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "w-32 h-32 rounded-[40px] overflow-hidden bg-black/40 border-2 border-white/10 group-hover/avatar:border-cyan-500/50 transition-all duration-500 relative", children: [
                    avatarUrl ? /* @__PURE__ */ jsx(
                      "img",
                      {
                        src: avatarUrl,
                        alt: "Avatar",
                        className: "w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-700"
                      }
                    ) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center", children: /* @__PURE__ */ jsx(User, { className: "w-12 h-12 text-white/10" }) }),
                    uploading && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm", children: /* @__PURE__ */ jsx(Loader2, { className: "w-10 h-10 text-cyan-400 animate-spin" }) }),
                    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:10px_10px]" })
                  ] }),
                  /* @__PURE__ */ jsx(
                    motion.div,
                    {
                      whileHover: { scale: 1.1 },
                      className: "absolute -bottom-2 -right-2 bg-cyan-500 text-black p-3 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.4)]",
                      children: /* @__PURE__ */ jsx(Camera, { className: "w-5 h-5" })
                    }
                  )
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "file",
                ref: fileInputRef,
                onChange: handleFileUpload,
                className: "hidden",
                accept: "image/*"
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "mt-8 text-center", children: [
              /* @__PURE__ */ jsx("h2", { className: "text-4xl font-black text-white italic tracking-tighter uppercase leading-none", children: t.title }),
              /* @__PURE__ */ jsx("p", { className: "text-cyan-500/40 text-[10px] font-black uppercase tracking-[0.4em] mt-3", children: "Personnel File v4.2.1" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleUpdate, className: "space-y-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsx(
                "label",
                {
                  className: `block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1 ${isAr ? "text-right" : ""}`,
                  children: t.username
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "relative group/input", children: [
                /* @__PURE__ */ jsx(
                  User,
                  {
                    className: `absolute top-1/2 -translate-y-1/2 w-5 h-5 text-white/10 group-focus-within/input:text-cyan-400 transition-colors ${isAr ? "right-6" : "left-6"}`
                  }
                ),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    required: true,
                    value: username,
                    onChange: (e) => setUsername(e.target.value),
                    className: `w-full bg-black/40 border border-white/5 rounded-[24px] py-5 text-white font-bold placeholder:text-white/5 focus:outline-none focus:border-cyan-500/30 focus:bg-white/[0.04] transition-all ${isAr ? "pr-16 text-right" : "pl-16"}`
                  }
                )
              ] })
            ] }),
            !targetProfile && /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsx(
                "label",
                {
                  className: `block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1 ${isAr ? "text-right" : ""}`,
                  children: t.password
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "relative group/input", children: [
                /* @__PURE__ */ jsx(
                  Key,
                  {
                    className: `absolute top-1/2 -translate-y-1/2 w-5 h-5 text-white/10 group-focus-within/input:text-purple-400 transition-colors ${isAr ? "right-6" : "left-6"}`
                  }
                ),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "password",
                    value: newPassword,
                    onChange: (e) => setNewPassword(e.target.value),
                    placeholder: t.passHint,
                    className: `w-full bg-black/40 border border-white/5 rounded-[24px] py-5 text-white font-bold placeholder:text-white/5 focus:outline-none focus:border-purple-500/30 focus:bg-white/[0.04] transition-all ${isAr ? "pr-16 text-right" : "pl-16"}`
                  }
                )
              ] })
            ] }),
            isAdmin && targetProfile && /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxs(
                "label",
                {
                  className: `block text-[10px] font-black text-cyan-500/40 uppercase tracking-[0.3em] ml-1 ${isAr ? "text-right" : ""}`,
                  children: [
                    t.score,
                    " [OPERATOR ACCESS]"
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  value: score,
                  onChange: (e) => setScore(Number(e.target.value)),
                  className: `w-full bg-cyan-500/5 border border-cyan-500/20 rounded-[24px] py-5 px-8 text-cyan-500 font-black focus:outline-none focus:border-cyan-500/50 transition-all ${isAr ? "text-right" : ""}`
                }
              )
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "submit",
                disabled: loading || uploading,
                className: "group w-full py-5 bg-white text-black font-black text-[11px] uppercase tracking-[0.4em] rounded-[24px] hover:bg-cyan-50 transition-all disabled:opacity-50 flex items-center justify-center gap-4 shadow-2xl shadow-white/5 active:scale-95",
                children: [
                  loading ? /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin" }) : /* @__PURE__ */ jsx(Save, { className: "w-6 h-6" }),
                  t.save
                ]
              }
            )
          ] })
        ]
      }
    )
  ] }) });
};
function Header() {
  const { language, setLanguage, isAr } = useLanguage();
  const { user, profile, signOut, isAdmin } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("header", { className: "fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 py-4 backdrop-blur-xl bg-black/40 border-b border-white/5", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "text-2xl font-black text-white tracking-tighter italic", children: [
        "ST-COMPANY",
        /* @__PURE__ */ jsx("span", { className: "text-cyan-500", children: "." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setLanguage(language === "en" ? "ar" : "en"),
            className: "flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95",
            children: [
              /* @__PURE__ */ jsx(Globe, { className: "w-3.5 h-3.5 text-cyan-400" }),
              /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: language === "en" ? "العربية" : "English" })
            ]
          }
        ),
        user ? /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-4 ${isAr ? "flex-row-reverse" : ""}`, children: [
          /* @__PURE__ */ jsxs("div", { className: "hidden sm:flex flex-col items-end", children: [
            /* @__PURE__ */ jsx("span", { className: "text-white text-[10px] font-black uppercase tracking-widest leading-none", children: profile?.username || user.email?.split("@")[0] }),
            /* @__PURE__ */ jsxs("span", { className: "text-cyan-500 text-[8px] font-black uppercase tracking-[0.2em] mt-1", children: [
              profile?.score || 0,
              " XP // ST-UNIT"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            isAdmin && /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setIsProfileEditOpen(true),
                className: "p-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/20 transition-all active:scale-90",
                children: /* @__PURE__ */ jsx(Shield, { className: "w-4 h-4" })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setIsProfileEditOpen(true),
                className: "w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-90 overflow-hidden",
                children: profile?.avatar_url ? /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: profile.avatar_url,
                    alt: "Profile",
                    className: "w-full h-full object-cover"
                  }
                ) : /* @__PURE__ */ jsx(User, { className: "w-4 h-4" })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => signOut(),
                className: "w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-all active:scale-90",
                children: /* @__PURE__ */ jsx(LogOut, { className: "w-4 h-4" })
              }
            )
          ] })
        ] }) : /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setIsAuthModalOpen(true),
            className: "flex items-center gap-3 px-8 py-2.5 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-cyan-50 transition-all active:scale-95 shadow-lg shadow-white/5",
            children: [
              /* @__PURE__ */ jsx(User, { className: "w-3.5 h-3.5" }),
              isAr ? "دخول النظام" : "Initialize"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx(AuthModal, { isOpen: isAuthModalOpen, onClose: () => setIsAuthModalOpen(false) }),
    /* @__PURE__ */ jsx(ProfileEdit, { isOpen: isProfileEditOpen, onClose: () => setIsProfileEditOpen(false) })
  ] });
}
function NotFoundComponent() {
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-black px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-7xl font-bold text-white", children: "404" }),
    /* @__PURE__ */ jsx("h2", { className: "mt-4 text-xl font-semibold text-white", children: "Page not found" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-white/60", children: "The page you're looking for doesn't exist or has been moved." }),
    /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-full bg-white px-6 py-2 text-sm font-medium text-black transition-colors hover:bg-white/90",
        children: "Go home"
      }
    ) })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router2 = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-[#fafafa] px-4 font-sans", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md w-full text-center p-8", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold mb-2 text-[#111]", children: "This page didn't load" }),
    /* @__PURE__ */ jsx("p", { className: "text-[#4b5563] mb-6", children: "Something went wrong on our end. You can try refreshing or head back home." }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-center flex-wrap", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "px-4 py-2 rounded-md bg-[#111] text-white font-medium hover:bg-black transition-colors",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "/",
          className: "px-4 py-2 rounded-md bg-white text-[#111] border border-[#d1d5db] font-medium hover:bg-gray-50 transition-colors",
          children: "Go home"
        }
      )
    ] })
  ] }) });
}
const Route$2 = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ST-COMPANY | Award-Winning Digital Agency" },
      { name: "description", content: "Crafting digital experiences that matter." },
      { name: "author", content: "ST-COMPANY" },
      { property: "og:title", content: "ST-COMPANY | Digital Agency" },
      { property: "og:description", content: "Crafting digital experiences that matter." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@STCOMPANY" }
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss
      }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      /* @__PURE__ */ jsx(LanguageProvider, { children: /* @__PURE__ */ jsxs(AuthProvider, { children: [
        /* @__PURE__ */ jsx(Header, {}),
        children,
        /* @__PURE__ */ jsx(Toaster, { position: "bottom-right", theme: "dark", richColors: true })
      ] }) }),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$2.useRouteContext();
  return /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsx(Outlet, {}) });
}
const BASE_URL = "";
const Route$1 = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries = [{ path: "/", changefreq: "weekly", priority: "1.0" }];
        const urls = entries.map(
          (e) => [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`
          ].filter(Boolean).join("\n")
        );
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`
        ].join("\n");
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600"
          }
        });
      }
    }
  }
});
const $$splitComponentImporter = () => import("./index-BoZl7Z3D.js");
const Route = createFileRoute("/")({
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const SitemapDotxmlRoute = Route$1.update({
  id: "/sitemap.xml",
  path: "/sitemap.xml",
  getParentRoute: () => Route$2
});
const IndexRoute = Route.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$2
});
const rootRouteChildren = {
  IndexRoute,
  SitemapDotxmlRoute
};
const routeTree = Route$2._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  ProfileEdit as P,
  useAuth as a,
  router as r,
  supabase as s,
  useLanguage as u
};

import React, { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase-code";
import { useLanguage } from "../lib/LanguageContext";
import { X, User, Loader2, Save, Camera, Key, Zap, Clock, ShieldCheck, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "../hooks/use-auth";
import { HeroButton } from "../funs/HeroButton";

interface ProfileEditProps {
  isOpen: boolean;
  onClose: () => void;
  targetProfile?: {
    id: string;
    username: string;
    avatar_url: string;
    score: number;
    work_duration?: number;
    break_duration?: number;
  };
  onUpdate?: () => void;
}

export const ProfileEdit: React.FC<ProfileEditProps> = ({
  isOpen,
  onClose,
  targetProfile,
  onUpdate,
}) => {
  const { isAr } = useLanguage();
  const { user, profile: myProfile, isAdmin, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentProfile = targetProfile || myProfile;

  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [score, setScore] = useState(0);
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen && currentProfile) {
      setUsername(currentProfile.username || "");
      setAvatarUrl(currentProfile.avatar_url || "");
      setScore(currentProfile.score || 0);
      setWorkDuration(currentProfile.work_duration || 25);
      setBreakDuration(currentProfile.break_duration || 5);
      setNewPassword("");
    }
  }, [isOpen, currentProfile]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      if (!user) throw new Error("Authentication required");

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUrl(publicUrl);
      toast.success(isAr ? "تم تحديث الواجهة العصبية" : "Neural interface updated");
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = targetProfile?.id || myProfile?.id || user?.id;
    if (!targetId) {
      toast.error(isAr ? "فشل تحديد الهوية" : "Identity resolution failed");
      return;
    }

    setLoading(true);
    try {
      // 1. Prepare base profile data
      const baseUpdates: any = {
        id: targetId,
        username,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };
      
      // Only add these if they have values to avoid schema issues if columns are missing
      if (workDuration !== undefined) baseUpdates.work_duration = workDuration;
      if (breakDuration !== undefined) baseUpdates.break_duration = breakDuration;
      
      if (isAdmin && targetProfile) {
        baseUpdates.score = score;
      }

      console.log("Initiating neural sync:", baseUpdates);

      // 2. Perform Upsert
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(baseUpdates, { onConflict: 'id' });

      if (profileError) {
        // Specific check for missing columns
        if (profileError.message?.includes("column") && profileError.message?.includes("not found")) {
          throw new Error(isAr 
            ? "يجب تشغيل كود SQL المحدث في Supabase لإضافة الأعمدة الجديدة" 
            : "Database schema mismatch. Please run the updated SQL in Supabase Editor.");
        }
        throw profileError;
      }

      // 3. Update Password if requested
      if (newPassword && !targetProfile) {
        const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
        if (authError) throw authError;
      }

      // 4. Finalize
      toast.success(isAr ? "اكتمل مزامنة البيانات" : "Core synchronization complete");
      await refreshProfile();
      if (onUpdate) onUpdate();
      
      // Small delay to ensure state propagates before closing
      setTimeout(() => {
        onClose();
      }, 500);
      
    } catch (error: any) {
      console.error("Neural sync failure:", error);
      // Better error extraction
      const errorMessage = error?.message || error?.error_description || (typeof error === 'string' ? error : "Connection interrupted");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const t = {
    title: isAr ? "إعدادات النظام" : "SYSTEM CONFIG",
    username: isAr ? "معرف المستخدم" : "USER IDENTIFIER",
    password: isAr ? "مفتاح التشفير" : "ENCRYPTION KEY",
    work: isAr ? "بروتوكول التركيز" : "WORK PROTOCOL",
    break: isAr ? "بروتوكول الشحن" : "RECHARGE PROTOCOL",
    save: isAr ? "تثبيت الإعدادات" : "COMMIT CHANGES",
    stats: isAr ? "إحصائيات الوحدة" : "UNIT STATISTICS"
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 bg-[#0038FF]/20 backdrop-blur-3xl overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="relative w-full max-w-4xl bg-black/60 border border-white/10 rounded-[48px] p-8 md:p-12 shadow-[0_0_100px_rgba(0,56,255,0.3)] overflow-hidden"
          >
            {/* ST-OS Header UI */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#CCFF00]/10 overflow-hidden">
               <motion.div 
                 animate={{ x: ['-100%', '100%'] }} 
                 transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                 className="w-1/3 h-full bg-[#CCFF00]" 
               />
            </div>

            <button onClick={onClose} className="absolute top-8 right-8 p-3 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-[#CCFF00] hover:border-[#CCFF00]/50 transition-all">
              <X className="w-6 h-6" />
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left Column: Avatar & Stats */}
              <div className="lg:col-span-4 flex flex-col items-center gap-8">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-48 h-48 rounded-[48px] overflow-hidden border-4 border-white/5 group-hover:border-[#CCFF00]/50 transition-all duration-500 shadow-2xl relative">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/5">
                        <User className="w-16 h-16 text-white/10" />
                      </div>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-md">
                        <Loader2 className="w-10 h-10 text-[#CCFF00] animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-[#CCFF00] text-black p-4 rounded-[20px] shadow-xl">
                    <Camera className="w-6 h-6" />
                  </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />

                <div className="w-full p-6 rounded-[32px] bg-white/5 border border-white/10 flex flex-col gap-4">
                   <div className="flex items-center justify-between text-[10px] font-black text-white/40 uppercase tracking-widest">
                     <span>{t.stats}</span>
                     <Activity className="w-3 h-3 text-[#CCFF00]" />
                   </div>
                   <div className="space-y-1">
                     <p className="text-2xl font-black text-white italic tracking-tighter uppercase">{score} XP</p>
                     <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-[#CCFF00] shadow-[0_0_10px_#CCFF00]" style={{ width: '65%' }} />
                     </div>
                   </div>
                   <div className="flex items-center gap-2 text-[8px] font-bold text-[#CCFF00]/40 uppercase tracking-[0.3em]">
                     <ShieldCheck className="w-3 h-3" />
                     Verified Operator
                   </div>
                </div>
              </div>

              {/* Right Column: Settings */}
              <form onSubmit={handleUpdate} className="lg:col-span-8 space-y-10">
                <div className="space-y-2">
                  <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">{t.title}</h1>
                  <p className="text-[#CCFF00]/40 text-[10px] font-black uppercase tracking-[0.5em]">Kernel Revision 4.2.1-ST</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] block ml-1">{t.username}</label>
                    <div className="relative group">
                      <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/10 group-focus-within:text-[#CCFF00] transition-colors" />
                      <input 
                        type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-white font-bold focus:outline-none focus:border-[#CCFF00]/50 focus:bg-white/[0.08] transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] block ml-1">{t.password}</label>
                    <div className="relative group">
                      <Key className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/10 group-focus-within:text-purple-400 transition-colors" />
                      <input 
                        type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-white font-bold focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                    <Clock className="w-5 h-5 text-[#CCFF00]" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest italic">PROTOCOL CONFIGURATION</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 space-y-4">
                      <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] block">{t.work}</label>
                      <div className="flex items-center gap-6">
                        <input 
                          type="range" min="1" max="60" value={workDuration} onChange={(e) => setWorkDuration(Number(e.target.value))}
                          className="flex-grow accent-[#CCFF00]"
                        />
                        <span className="text-2xl font-black text-[#CCFF00] tabular-nums min-w-[3ch]">{workDuration}</span>
                      </div>
                    </div>
                    <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 space-y-4">
                      <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] block">{t.break}</label>
                      <div className="flex items-center gap-6">
                        <input 
                          type="range" min="1" max="30" value={breakDuration} onChange={(e) => setBreakDuration(Number(e.target.value))}
                          className="flex-grow accent-[#CCFF00]"
                        />
                        <span className="text-2xl font-black text-white/60 tabular-nums min-w-[3ch]">{breakDuration}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <HeroButton 
                  type="submit" disabled={loading || uploading} variant="primary" size="xl" 
                  className="w-full rounded-[24px] bg-[#CCFF00] text-black font-black uppercase text-xs tracking-[0.4em] py-6 shadow-[0_20px_40px_rgba(204,255,0,0.2)]"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                  {t.save}
                </HeroButton>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

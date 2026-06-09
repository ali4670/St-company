import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode, useState } from "react";
import { Globe, User as UserIcon, LogOut, Shield } from "lucide-react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { LanguageProvider, useLanguage } from "../lib/LanguageContext";
import { AuthProvider, useAuth } from "../hooks/use-auth";
import { AuthModal } from "../components/AuthModal";
import { ProfileEdit } from "../components/ProfileEdit";
import { HeroButton } from "../funs/HeroButton";
import NotFound1 from "../components/ui/8bit-not-found1";

function Header() {
  const { language, setLanguage, isAr } = useLanguage();
  const { user, profile, signOut, isAdmin, isModerator } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 py-4 backdrop-blur-xl bg-black/40 border-b border-white/5">
        <Link to="/" className="text-2xl font-black text-white tracking-tighter italic">
          ST-COMPANY<span className="text-cyan-500">.</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/levels">
            <HeroButton
              size="sm"
              variant="outline"
              className="px-4 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10"
            >
              <Globe className="w-3.5 h-3.5 mr-2" />
              <span className="text-[10px] font-black uppercase tracking-widest">{isAr ? "الدورات" : "COURSES"}</span>
            </HeroButton>
          </Link>

          <HeroButton
            onClick={() => setLanguage(language === "en" ? "ar" : "en")}
            size="sm"
            variant="outline"
            className="px-4"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{language === "en" ? "العربية" : "English"}</span>
          </HeroButton>

          {user ? (
            <div className={`flex items-center gap-4 ${isAr ? "flex-row-reverse" : ""}`}>
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-white text-[10px] font-black uppercase tracking-widest leading-none">
                  {profile?.username || user.email?.split("@")[0]}
                </span>
                <span className="text-cyan-500 text-[8px] font-black uppercase tracking-[0.2em] mt-1">
                  {profile?.score || 0} XP // ST-UNIT
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/moderator">
                  <HeroButton
                    size="sm"
                    variant="outline"
                    className="px-4 border-cyan-500/20 text-cyan-500 hover:bg-cyan-500/20"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    <span className="hidden md:inline">{isAr ? "لوحة المشرف" : "Moderator Panel"}</span>
                  </HeroButton>
                </Link>
                {isAdmin && (
                  <HeroButton
                    onClick={() => setIsProfileEditOpen(true)}
                    size="sm"
                    variant="outline"
                    className="p-2.5 rounded-xl border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/20"
                  >
                    <Shield className="w-4 h-4" />
                  </HeroButton>
                )}
                <HeroButton
                  onClick={() => setIsProfileEditOpen(true)}
                  size="sm"
                  variant="outline"
                  className="w-11 h-11 p-0 rounded-full overflow-hidden border-2 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-sm">
                      {(profile?.username || user.email?.split("@")[0] || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                </HeroButton>
                <HeroButton
                  onClick={() => signOut()}
                  size="sm"
                  variant="outline"
                  className="w-10 h-10 p-0 rounded-xl border-red-500/20 text-red-500 hover:bg-red-500/20"
                >
                  <LogOut className="w-4 h-4" />
                </HeroButton>
              </div>
            </div>
          ) : (
            <HeroButton
              onClick={() => setIsAuthModalOpen(true)}
              size="md"
              variant="primary"
            >
              <UserIcon className="w-3.5 h-3.5" />
              {isAr ? "دخول النظام" : "Initialize"}
            </HeroButton>
          )}
        </div>
      </header>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <ProfileEdit isOpen={isProfileEditOpen} onClose={() => setIsProfileEditOpen(false)} />
    </>
  );
}

function NotFoundComponent() {
  return <NotFound1 />;
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const { isAr } = useLanguage();
  
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0038FF] px-4 font-sans text-white relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0"></div>
      
      <div className="max-w-md w-full text-center p-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] relative z-10 shadow-2xl">
        <h1 className="text-3xl font-black mb-4 tracking-tighter uppercase italic">
          {isAr ? "حدث خطأ في النظام" : "SYSTEM ERROR"}
        </h1>
        <p className="text-white/70 mb-8 font-medium">
          {isAr ? "حدث خطأ ما من جانبنا. يمكنك تجربة التحديث أو العودة إلى الصفحة الرئيسية." : "Something went wrong on our end. You can try refreshing or head back home."}
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="px-8 py-3 rounded-full bg-[#CCFF00] text-black font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform"
          >
            {isAr ? "حاول مرة أخرى" : "Try again"}
          </button>
          <a
            href="/"
            className="px-8 py-3 rounded-full bg-white/10 border border-white/30 text-white font-black text-sm uppercase tracking-widest hover:bg-white/20 transition-all"
          >
            {isAr ? "الرئيسية" : "Go home"}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
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
      { name: "twitter:site", content: "@STCOMPANY" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <LanguageProvider>
          <AuthProvider>
            {children}
            <Toaster position="bottom-right" theme="dark" richColors />
          </AuthProvider>
        </LanguageProvider>
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-[#0038FF]">
        <Header />
        <main className="pt-24 min-h-screen">
          <Outlet />
        </main>
      </div>
    </QueryClientProvider>
  );
}

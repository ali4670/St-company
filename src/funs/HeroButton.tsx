import React from "react";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";

interface HeroButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
}

export const HeroButton: React.FC<HeroButtonProps> = ({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}) => {
  const variants = {
    primary: "bg-white text-black hover:bg-cyan-50 shadow-xl shadow-white/5",
    secondary: "bg-cyan-500 text-black hover:bg-cyan-400 shadow-xl shadow-cyan-500/20",
    outline: "bg-white/5 border border-white/10 text-white hover:bg-white/10 backdrop-blur-md",
    ghost: "bg-transparent text-white/40 hover:text-white hover:bg-white/5",
  };

  const sizes = {
    sm: "px-4 py-2 text-[9px] rounded-xl",
    md: "px-6 py-3 text-[10px] rounded-2xl",
    lg: "px-8 py-4 text-[11px] rounded-[24px]",
    xl: "px-10 py-5 text-[12px] rounded-[32px]",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      className={cn(
        "flex items-center justify-center gap-3 font-black uppercase tracking-[0.3em] transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
};

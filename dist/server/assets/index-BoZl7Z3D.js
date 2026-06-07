import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from "framer-motion";
import { u as useLanguage, a as useAuth, s as supabase, P as ProfileEdit } from "./router-B5GA7FlQ.js";
import { toast } from "sonner";
import { LogOut, Zap, LayoutDashboard, Tag, Clock, Plus, Circle, CheckCircle2, Trash2, Globe, Gamepad2, LayoutList, ChevronDown, Check, X } from "lucide-react";
import "@tanstack/react-query";
import "@tanstack/react-router";
import "@supabase/supabase-js";
const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];
function checkWinner(board) {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  if (board.every((cell) => cell !== null)) return "draw";
  return null;
}
function getWinningLine(board) {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return [a, b, c];
    }
  }
  return null;
}
function TicTacToeGame({ onlineGameId, onQuit }) {
  const { isAr } = useLanguage();
  const { user, profile, refreshProfile } = useAuth();
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [winner, setWinner] = useState(null);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [winningLine, setWinningLine] = useState(null);
  const [mySymbol, setMySymbol] = useState(null);
  const t = {
    subtitle: isAr ? onlineGameId ? "تحدي مباشر" : "لعبة كلاسيكية" : onlineGameId ? "Online Match" : "Classic Game",
    scoreX: isAr ? "إكس" : "Player X",
    scoreO: isAr ? "أو" : "Player O",
    turn: isAr ? "دور اللاعب" : "Player Turn",
    drawResult: isAr ? "تعادل!" : "Draw!",
    winnerResult: isAr ? "الفائز" : "Winner",
    newGame: isAr ? "لعبة جديدة" : "New Game",
    resetScores: isAr ? "تصفير النتائج" : "Reset Scores",
    quit: isAr ? "انسحاب" : "Quit Game",
    waiting: isAr ? "في انتظار دور الخصم..." : "Waiting for opponent...",
    yourTurn: isAr ? "دورك الآن!" : "Your turn!"
  };
  useEffect(() => {
    if (!onlineGameId) {
      setMySymbol(null);
      return;
    }
    const fetchGame = async () => {
      const { data, error } = await supabase.from("games").select("*").eq("id", onlineGameId).single();
      if (data) {
        setBoard(data.board);
        setCurrentPlayer(data.current_turn);
        setWinner(data.winner);
        setWinningLine(getWinningLine(data.board));
        setMySymbol(data.player_x === user?.id ? "X" : "O");
      }
    };
    fetchGame();
    const channel = supabase.channel(`game_sync_${onlineGameId}`).on(
      "postgres_changes",
      {
        event: "UPDATE",
        table: "games",
        filter: `id=eq.${onlineGameId}`
      },
      (payload) => {
        setBoard(payload.new.board);
        setCurrentPlayer(payload.new.current_turn);
        setWinner(payload.new.winner);
        setWinningLine(getWinningLine(payload.new.board));
      }
    ).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [onlineGameId, user]);
  const handleCellClick = useCallback(
    async (index) => {
      if (board[index] || winner) return;
      if (onlineGameId && currentPlayer !== mySymbol) {
        toast.error(t.waiting);
        return;
      }
      const newBoard = [...board];
      newBoard[index] = currentPlayer;
      const result = checkWinner(newBoard);
      const nextPlayer = currentPlayer === "X" ? "O" : "X";
      if (onlineGameId) {
        const { error } = await supabase.from("games").update({
          board: newBoard,
          current_turn: nextPlayer,
          winner: result,
          status: result ? "completed" : "active",
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }).eq("id", onlineGameId);
        if (error) {
          toast.error(error.message);
          return;
        }
      } else {
        setBoard(newBoard);
        if (result) {
          setWinner(result);
          setWinningLine(getWinningLine(newBoard));
          if (result === "X" || result === "O") {
            setScores((s) => ({ ...s, [result]: s[result] + 1 }));
          } else {
            setScores((s) => ({ ...s, draws: s.draws + 1 }));
          }
        } else {
          setCurrentPlayer(nextPlayer);
        }
      }
      if (result && result !== "draw" && user && profile) {
        const wasWinner = onlineGameId ? result === mySymbol : true;
        if (wasWinner) {
          await supabase.from("profiles").update({ score: (profile.score || 0) + 10 }).eq("id", user.id);
          refreshProfile();
        }
      }
    },
    [
      board,
      currentPlayer,
      winner,
      user,
      profile,
      refreshProfile,
      onlineGameId,
      mySymbol,
      t.waiting
    ]
  );
  const resetGame = useCallback(async () => {
    if (onlineGameId) {
      await supabase.from("games").update({
        board: Array(9).fill(null),
        current_turn: "X",
        winner: null,
        status: "active"
      }).eq("id", onlineGameId);
    } else {
      setBoard(Array(9).fill(null));
      setCurrentPlayer("X");
      setWinner(null);
      setWinningLine(null);
    }
  }, [onlineGameId]);
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-12 w-full max-w-lg mx-auto px-6 py-10 relative z-10 group/game", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute -top-4 -left-4 w-12 h-12 border-t-2 border-l-2 border-cyan-500/30 rounded-tl-3xl" }),
    /* @__PURE__ */ jsx("div", { className: "absolute -bottom-4 -right-4 w-12 h-12 border-b-2 border-r-2 border-purple-500/30 rounded-br-3xl" }),
    /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        className: "text-center space-y-2",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "h-[1px] w-12 bg-gradient-to-r from-transparent to-cyan-500/50" }),
            /* @__PURE__ */ jsxs("h1", { className: "text-5xl font-black tracking-tighter text-white italic", children: [
              "ARENA",
              /* @__PURE__ */ jsx("span", { className: "text-cyan-500", children: "." })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "h-[1px] w-12 bg-gradient-to-l from-transparent to-purple-500/50" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-cyan-500/40 uppercase tracking-[0.5em]", children: t.subtitle })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 w-full", children: [
      /* @__PURE__ */ jsx(ScoreCard, { label: t.scoreX, score: scores.X, color: "x", highlight: currentPlayer === "X" }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-1", children: [
        /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-white/10" }),
        /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-white/20" }),
        /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-white/10" })
      ] }),
      /* @__PURE__ */ jsx(ScoreCard, { label: t.scoreO, score: scores.O, color: "o", highlight: currentPlayer === "O" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "h-14 flex items-center justify-center w-full", children: [
      /* @__PURE__ */ jsx(AnimatePresence, { mode: "wait", children: !winner && /* @__PURE__ */ jsxs(
        motion.div,
        {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -10 },
          className: "flex flex-col items-center gap-3",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "px-8 py-3 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-2xl flex items-center gap-4", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black text-white/20 uppercase tracking-[0.2em]", children: t.turn }),
              /* @__PURE__ */ jsx(
                "span",
                {
                  className: `inline-flex items-center justify-center w-10 h-10 rounded-xl font-black text-xl shadow-inner ${currentPlayer === "X" ? "bg-cyan-500 text-black shadow-cyan-500/20" : "bg-purple-500 text-white shadow-purple-500/20"}`,
                  children: currentPlayer
                }
              )
            ] }),
            onlineGameId && /* @__PURE__ */ jsx(
              motion.span,
              {
                animate: { opacity: [0.4, 1, 0.4] },
                transition: { duration: 2, repeat: Infinity },
                className: `text-[9px] font-black uppercase tracking-[0.3em] ${currentPlayer === mySymbol ? "text-cyan-400" : "text-white/20"}`,
                children: currentPlayer === mySymbol ? t.yourTurn : t.waiting
              }
            )
          ]
        },
        currentPlayer
      ) }),
      /* @__PURE__ */ jsx(AnimatePresence, { children: winner && /* @__PURE__ */ jsx(
        motion.div,
        {
          initial: { opacity: 0, scale: 0.9, filter: "blur(10px)" },
          animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
          className: "text-center",
          children: /* @__PURE__ */ jsx(
            "div",
            {
              className: `inline-block px-12 py-4 rounded-2xl font-black text-xl border-2 backdrop-blur-3xl shadow-2xl ${winner === "draw" ? "bg-white/5 text-white/60 border-white/10" : winner === "X" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-cyan-500/10" : "bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-purple-500/10"}`,
              children: winner === "draw" ? t.drawResult : `${t.winnerResult}: ${winner === "X" ? t.scoreX : t.scoreO}!`
            }
          )
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        className: "relative group/board",
        children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-cyan-500/5 blur-[100px] rounded-full opacity-0 group-hover/board:opacity-100 transition-opacity duration-1000" }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-5 p-6 rounded-[56px] border border-white/10 bg-white/[0.02] backdrop-blur-3xl relative", children: board.map((cell, index) => /* @__PURE__ */ jsx(
            Cell,
            {
              value: cell,
              index,
              isWinning: winningLine?.includes(index) ?? false,
              isClickable: !cell && !winner && (!onlineGameId || currentPlayer === mySymbol),
              onClick: () => handleCellClick(index)
            },
            index
          )) })
        ]
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "flex gap-4 w-full", children: onlineGameId ? /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: onQuit,
        className: "flex-1 py-5 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 font-black text-[10px] uppercase tracking-[0.3em] transition-all hover:bg-red-500 hover:text-white active:scale-95 flex items-center justify-center gap-3",
        children: [
          /* @__PURE__ */ jsx(LogOut, { className: "w-4 h-4" }),
          t.quit
        ]
      }
    ) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: resetGame,
          className: "flex-1 py-5 rounded-3xl bg-white text-black font-black text-[10px] uppercase tracking-[0.3em] transition-all hover:bg-cyan-50 active:scale-95 shadow-2xl shadow-white/5",
          children: t.newGame
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setScores({ X: 0, O: 0, draws: 0 }),
          className: "flex-1 py-5 rounded-3xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.3em] transition-all hover:bg-white/10 active:scale-95",
          children: t.resetScores
        }
      )
    ] }) })
  ] });
}
function ScoreCard({
  label,
  score,
  color,
  highlight
}) {
  const colorClass = color === "x" ? "text-cyan-400" : color === "o" ? "text-purple-400" : "text-white/40";
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `flex-1 flex flex-col items-center gap-2 py-6 rounded-[32px] bg-white/[0.02] border transition-all duration-700 backdrop-blur-2xl ${highlight ? "border-white/20 bg-white/5 scale-105 shadow-2xl" : "border-white/5 opacity-30"}`,
      children: [
        /* @__PURE__ */ jsx("span", { className: `text-[9px] font-black uppercase tracking-[0.3em] ${colorClass}`, children: label }),
        /* @__PURE__ */ jsx(
          motion.span,
          {
            initial: { scale: 1.5, filter: "blur(10px)" },
            animate: { scale: 1, filter: "blur(0px)" },
            className: "text-4xl font-black text-white tracking-tighter italic",
            children: score
          },
          score
        )
      ]
    }
  );
}
function Cell({
  value,
  index,
  isWinning,
  isClickable,
  onClick
}) {
  return /* @__PURE__ */ jsxs(
    motion.button,
    {
      whileHover: isClickable ? { scale: 1.02, backgroundColor: "rgba(255,255,255,0.06)" } : {},
      whileTap: isClickable ? { scale: 0.94 } : {},
      onClick,
      className: `relative w-24 h-24 sm:w-32 sm:h-32 rounded-[32px] flex items-center justify-center text-6xl font-black transition-all border-2 ${isClickable ? "cursor-pointer bg-white/[0.03] border-white/5 hover:border-white/20" : "cursor-default bg-black/20 border-white/[0.02]"} ${isWinning ? "bg-white/10 border-white shadow-[0_0_50px_rgba(255,255,255,0.1)] z-10 scale-105" : ""}`,
      children: [
        /* @__PURE__ */ jsx(AnimatePresence, { mode: "wait", children: value && /* @__PURE__ */ jsx(
          motion.span,
          {
            initial: { opacity: 0, scale: 0.5, rotate: -15, filter: "blur(10px)" },
            animate: { opacity: 1, scale: 1, rotate: 0, filter: "blur(0px)" },
            transition: { type: "spring", stiffness: 300, damping: 20 },
            className: `italic ${value === "X" ? "text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]" : "text-purple-500 drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]"}`,
            children: value
          },
          `${index}-${value}`
        ) }),
        !value && isClickable && /* @__PURE__ */ jsx("div", { className: "absolute inset-2 border border-white/[0.02] rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity" })
      ]
    }
  );
}
const AdvancedTodo = () => {
  const { user } = useAuth();
  const { isAr } = useLanguage();
  const [todos, setTodos] = useState([]);
  const [task, setTask] = useState("");
  const [desc, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("Work");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  useEffect(() => {
    if (user) {
      fetchTodos();
    } else {
      setLoading(false);
    }
  }, [user]);
  const fetchTodos = async () => {
    const { data, error } = await supabase.from("todos").select("*").order("created_at", { ascending: false });
    if (!error) setTodos(data || []);
    setLoading(false);
  };
  const addTodo = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Login to save tasks");
    const newTodo = {
      user_id: user.id,
      task,
      description: desc,
      priority,
      category,
      is_completed: false
    };
    const { error } = await supabase.from("todos").insert([newTodo]);
    if (!error) {
      toast.success(isAr ? "تمت الإضافة" : "Mission Added");
      setTask("");
      setDescription("");
      setShowAdd(false);
      fetchTodos();
    }
  };
  const toggleTodo = async (id, current) => {
    const { error } = await supabase.from("todos").update({ is_completed: !current }).eq("id", id);
    if (!error) fetchTodos();
  };
  const deleteTodo = async (id) => {
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (!error) {
      toast.error(isAr ? "تم الحذف" : "Mission Deleted");
      fetchTodos();
    }
  };
  const getPriorityColor = (p) => {
    switch (p) {
      case "urgent":
        return "text-red-500 bg-red-500/10 border-red-500/20";
      case "high":
        return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case "medium":
        return "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
      default:
        return "text-emerald-400 bg-green-500/10 border-green-500/20";
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-[600px] w-full max-w-5xl mx-auto bg-black/40 border border-white/10 rounded-[48px] overflow-hidden shadow-2xl backdrop-blur-3xl flex flex-col md:flex-row relative group/os", children: [
    /* @__PURE__ */ jsxs("div", { className: "absolute top-4 left-4 flex gap-1.5 opacity-40 group-hover/os:opacity-100 transition-opacity", children: [
      /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-red-500/50" }),
      /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-orange-500/50" }),
      /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-emerald-500/50" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "w-full md:w-72 bg-white/[0.02] border-r border-white/5 p-8 flex flex-col gap-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mt-2", children: [
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-cyan-500 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.4)] rotate-3", children: /* @__PURE__ */ jsx(Zap, { className: "w-7 h-7 text-black fill-current" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black text-white tracking-tighter uppercase italic leading-none", children: "ST-OS" }),
          /* @__PURE__ */ jsx("p", { className: "text-[8px] text-cyan-500/40 font-bold uppercase tracking-[0.4em] mt-1", children: "Kernel v4.2.1" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("nav", { className: "flex flex-col gap-3", children: [
        { icon: LayoutDashboard, label: isAr ? "الرئيسية" : "Console", active: true },
        { icon: Tag, label: isAr ? "المشاريع" : "Segments" },
        { icon: Clock, label: isAr ? "المواعيد" : "Timelines" }
      ].map((item, i) => /* @__PURE__ */ jsxs(
        "button",
        {
          className: `flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-[0.2em] group active:scale-95 ${item.active ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20" : "text-white/30 hover:text-white hover:bg-white/5"}`,
          children: [
            /* @__PURE__ */ jsx(item.icon, { className: `w-4 h-4 transition-transform group-hover:scale-110` }),
            item.label
          ]
        },
        i
      )) }),
      /* @__PURE__ */ jsx("div", { className: "mt-auto pt-8 border-t border-white/5", children: /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-2xl bg-white/[0.03] border border-white/5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[8px] font-black text-white/20 uppercase tracking-widest", children: "Efficiency" }),
          /* @__PURE__ */ jsx("span", { className: "text-[8px] font-black text-cyan-500 uppercase", children: "84%" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "w-full h-1 bg-white/5 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-cyan-500 w-[84%]" }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-grow p-10 flex flex-col gap-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-4xl font-black text-white italic tracking-tighter uppercase leading-none", children: isAr ? "قائمة المهام" : "Daily Missions" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-3", children: [
            /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" }),
            /* @__PURE__ */ jsxs("p", { className: "text-cyan-500/40 text-[10px] font-bold uppercase tracking-[0.4em]", children: [
              todos.length,
              " Active Modules Loaded"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setShowAdd(!showAdd),
            className: "w-14 h-14 rounded-[20px] bg-white text-black flex items-center justify-center hover:scale-105 active:scale-90 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] group",
            children: /* @__PURE__ */ jsx(
              Plus,
              {
                className: `w-7 h-7 transition-transform duration-500 ${showAdd ? "rotate-45" : ""}`
              }
            )
          }
        )
      ] }),
      /* @__PURE__ */ jsx(AnimatePresence, { children: showAdd && /* @__PURE__ */ jsxs(
        motion.form,
        {
          initial: { height: 0, opacity: 0, scale: 0.95 },
          animate: { height: "auto", opacity: 1, scale: 1 },
          exit: { height: 0, opacity: 0, scale: 0.95 },
          transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] },
          onSubmit: addTodo,
          className: "bg-white/[0.03] border border-white/10 rounded-3xl p-8 space-y-6 overflow-hidden backdrop-blur-xl",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-white/20 uppercase tracking-widest ml-1", children: "Mission Objective" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  value: task,
                  onChange: (e) => setTask(e.target.value),
                  placeholder: isAr ? "ما هي المهمة؟" : "Enter Mission...",
                  className: "w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold placeholder:text-white/10 focus:outline-none focus:border-cyan-500/50 transition-colors",
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-white/20 uppercase tracking-widest ml-1", children: "Priority Level" }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: priority,
                    onChange: (e) => setPriority(e.target.value),
                    className: "w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-xs font-bold text-white outline-none focus:border-cyan-500/50 transition-colors appearance-none",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "low", children: "Low Priority" }),
                      /* @__PURE__ */ jsx("option", { value: "medium", children: "Medium" }),
                      /* @__PURE__ */ jsx("option", { value: "high", children: "High" }),
                      /* @__PURE__ */ jsx("option", { value: "urgent", children: "Urgent" })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-white/20 uppercase tracking-widest ml-1", children: "System Segment" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    value: category,
                    onChange: (e) => setCategory(e.target.value),
                    placeholder: "Category...",
                    className: "w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-xs font-bold text-white outline-none focus:border-cyan-500/50 transition-colors"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                className: "w-full bg-cyan-500 text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-cyan-500/10",
                children: "Initialize Mission"
              }
            )
          ]
        }
      ) }),
      /* @__PURE__ */ jsx("div", { className: "flex-grow space-y-4 overflow-y-auto pr-2 custom-scrollbar", children: loading ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-60", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Zap, { className: "w-12 h-12 text-cyan-500 animate-pulse" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-cyan-500 blur-2xl opacity-20 animate-pulse" })
      ] }) }) : todos.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-60 opacity-20", children: [
        /* @__PURE__ */ jsx("div", { className: "w-20 h-20 rounded-full border-2 border-dashed border-white flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(Circle, { className: "w-8 h-8" }) }),
        /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black uppercase tracking-widest", children: "No Missions Logged" })
      ] }) : todos.map((todo) => /* @__PURE__ */ jsxs(
        motion.div,
        {
          layout: true,
          initial: { opacity: 0, x: -20 },
          animate: { opacity: 1, x: 0 },
          className: `group flex items-center gap-6 p-6 rounded-[28px] border transition-all duration-500 ${todo.is_completed ? "bg-black/20 border-white/5 opacity-40" : "bg-white/[0.02] border-white/5 hover:border-cyan-500/30 hover:bg-white/[0.04] shadow-xl hover:shadow-cyan-500/5"}`,
          children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => toggleTodo(todo.id, todo.is_completed),
                className: `w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all duration-500 active:scale-90 ${todo.is_completed ? "bg-cyan-500 border-cyan-500 text-black" : "border-white/10 text-transparent hover:border-cyan-500"}`,
                children: /* @__PURE__ */ jsx(CheckCircle2, { className: "w-6 h-6" })
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex-grow", children: [
              /* @__PURE__ */ jsx(
                "h3",
                {
                  className: `font-black text-xs uppercase tracking-widest transition-all duration-500 ${todo.is_completed ? "line-through text-white/20" : "text-white"}`,
                  children: todo.task
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mt-2", children: [
                /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: `text-[7px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg border ${getPriorityColor(todo.priority)}`,
                    children: todo.priority
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-1 h-1 rounded-full bg-white/20" }),
                  /* @__PURE__ */ jsx("span", { className: "text-[7px] font-bold text-white/20 uppercase tracking-[0.2em]", children: todo.category })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => deleteTodo(todo.id),
                className: "w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-red-500 hover:text-white active:scale-90 shadow-lg shadow-red-500/10",
                children: /* @__PURE__ */ jsx(Trash2, { className: "w-5 h-5" })
              }
            )
          ]
        },
        todo.id
      )) })
    ] })
  ] });
};
function Index() {
  const {
    isAr
  } = useLanguage();
  const {
    user
  } = useAuth();
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [activeOnlineGame, setActiveOnlineGame] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [incomingChallenge, setIncomingChallenge] = useState(null);
  const containerRef = useRef(null);
  const {
    scrollYProgress
  } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 1e-3
  });
  useTransform(smoothProgress, [0, 0.15], [1, 0]);
  useTransform(smoothProgress, [0, 0.15], [1, 0.9]);
  useTransform(smoothProgress, [0.1, 0.3], [100, 0]);
  useTransform(smoothProgress, [0.4, 0.6], [100, 0]);
  useEffect(() => {
    setIsClient(true);
  }, []);
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`user_challenges_${user.id}`).on("postgres_changes", {
      event: "INSERT",
      table: "games",
      filter: `player_o=eq.${user.id}`
    }, async (payload) => {
      const {
        data: challenger
      } = await supabase.from("profiles").select("username").eq("id", payload.new.player_x).single();
      setIncomingChallenge({
        id: payload.new.id,
        player_x: payload.new.player_x,
        challengerName: challenger?.username || "Unknown"
      });
    }).on("postgres_changes", {
      event: "UPDATE",
      table: "games",
      filter: `player_x=eq.${user.id}`
    }, (payload) => {
      if (payload.new.status === "active") {
        setActiveOnlineGame(payload.new.id);
        toast.success(isAr ? "تم قبول التحدي!" : "Challenge accepted!");
      }
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAr]);
  const acceptChallenge = async () => {
    if (!incomingChallenge) return;
    try {
      const {
        error
      } = await supabase.from("games").update({
        status: "active"
      }).eq("id", incomingChallenge.id);
      if (error) throw error;
      setActiveOnlineGame(incomingChallenge.id);
      setIncomingChallenge(null);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    }
  };
  if (!isClient) return /* @__PURE__ */ jsx("div", { className: "bg-black min-h-screen" });
  return /* @__PURE__ */ jsxs("main", { ref: containerRef, className: "bg-black min-h-[300vh] flex flex-col relative overflow-x-hidden text-white", children: [
    /* @__PURE__ */ jsx("div", { className: "fixed top-24 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4", children: /* @__PURE__ */ jsx("div", { className: "px-6 py-2 rounded-full bg-black/40 border border-white/10 backdrop-blur-xl flex items-center gap-8 shadow-2xl", children: [{
      id: "hero",
      icon: Globe,
      label: isAr ? "الرئيسية" : "Earth"
    }, {
      id: "arena",
      icon: Gamepad2,
      label: isAr ? "الساحة" : "Arena"
    }, {
      id: "missions",
      icon: LayoutList,
      label: isAr ? "المهام" : "Missions"
    }].map((item) => /* @__PURE__ */ jsxs("button", { onClick: () => document.getElementById(`${item.id}-section`)?.scrollIntoView({
      behavior: "smooth"
    }), className: "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all group", children: [
      /* @__PURE__ */ jsx(item.icon, { className: "w-3 h-3 group-hover:text-cyan-400 transition-colors" }),
      /* @__PURE__ */ jsx("span", { className: "hidden md:inline", children: item.label })
    ] }, item.id)) }) }),
    /* @__PURE__ */ jsxs("section", { id: "hero-section", className: "relative h-screen flex flex-col items-center justify-center px-6", children: [
      /* @__PURE__ */ jsx("div", { className: "text-center space-y-8 relative z-20", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center", children: [
        /* @__PURE__ */ jsx(motion.div, { initial: {
          scale: 0.8,
          opacity: 0
        }, animate: {
          scale: 1,
          opacity: 1
        }, transition: {
          duration: 0.8
        }, className: "w-20 h-20 rounded-3xl bg-cyan-500 flex items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.5)] mb-8", children: /* @__PURE__ */ jsx(Zap, { className: "w-10 h-10 text-black fill-current" }) }),
        /* @__PURE__ */ jsxs("h1", { className: "text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-none", children: [
          "Mission",
          /* @__PURE__ */ jsx("br", {}),
          "Control",
          /* @__PURE__ */ jsx("span", { className: "text-cyan-500", children: "." })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm md:text-lg text-cyan-500 font-bold uppercase tracking-[0.4em] mt-6", children: isAr ? "نظام التشغيل التكتيكي v4.0" : "Tactical OS v4.0" })
      ] }) }),
      /* @__PURE__ */ jsxs(motion.div, { animate: {
        y: [0, 10, 0]
      }, transition: {
        duration: 2,
        repeat: Infinity
      }, className: "absolute bottom-12 flex flex-col items-center gap-2 text-white/20", children: [
        /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black uppercase tracking-widest", children: isAr ? "انزل لأسفل" : "Scroll to deploy" }),
        /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("section", { id: "arena-section", className: "py-32 px-6", children: /* @__PURE__ */ jsx("div", { className: "container mx-auto max-w-6xl", children: /* @__PURE__ */ jsx(TicTacToeGame, { onlineGameId: activeOnlineGame, onQuit: () => setActiveOnlineGame(null) }) }) }),
    /* @__PURE__ */ jsx("section", { id: "missions-section", className: "py-32 px-6 bg-white/[0.02]", children: /* @__PURE__ */ jsx("div", { className: "container mx-auto max-w-6xl", children: /* @__PURE__ */ jsx(AdvancedTodo, {}) }) }),
    /* @__PURE__ */ jsx(AnimatePresence, { children: incomingChallenge && /* @__PURE__ */ jsx("div", { className: "fixed bottom-8 left-8 right-8 md:left-auto md:right-8 md:w-[320px] z-[150]", children: /* @__PURE__ */ jsxs(motion.div, { initial: {
      opacity: 0,
      y: 100,
      scale: 0.9
    }, animate: {
      opacity: 1,
      y: 0,
      scale: 1
    }, exit: {
      opacity: 0,
      y: 20,
      scale: 0.9
    }, className: "bg-black/80 border border-white/20 backdrop-blur-2xl rounded-[32px] p-6 shadow-2xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-cyan-500 flex items-center justify-center animate-pulse shadow-[0_0_20px_rgba(6,182,212,0.4)]", children: /* @__PURE__ */ jsx(Gamepad2, { className: "w-6 h-6 text-black" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-white font-bold", children: isAr ? "تحدي جديد!" : "New Challenge!" }),
          /* @__PURE__ */ jsxs("p", { className: "text-white/40 text-xs", children: [
            incomingChallenge.challengerName,
            " ",
            isAr ? "يدعوك للعب" : "invited you to play"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs("button", { onClick: acceptChallenge, className: "flex-1 py-3 bg-cyan-500 text-black font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all", children: [
          /* @__PURE__ */ jsx(Check, { className: "w-4 h-4" }),
          isAr ? "قبول" : "Accept"
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => setIncomingChallenge(null), className: "px-4 py-3 bg-white/5 border border-white/10 text-white rounded-2xl hover:bg-white/10 active:scale-95 transition-all", children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }) })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx(ProfileEdit, { isOpen: isProfileEditOpen, onClose: () => setIsProfileEditOpen(false) })
  ] });
}
export {
  Index as component
};

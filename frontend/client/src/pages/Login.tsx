import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  BookOpen, Award, Camera, LayoutDashboard, Eye, Flame, Globe, Home,
  Activity, Zap, Lock, LogIn, Moon, Bell, BarChart2, Play, Target,
  TrendingUp, Shield, Trophy, Users, Volume2, Settings, X, User as UserIcon,
  Sliders, CheckCircle, EyeOff,
} from "lucide-react";
import { useAuthContext } from "../contexts/AuthContext";
import { ErrorBanner } from "../components/ErrorBanner";

// --- MOCKED DEPENDENCIES TO SUPPORT YOUR UI ---
const ACCENT = "#6366f1";
const SKY = "#38bdf8";
const GREEN = "#22c55e";

const useTheme = () => ({
  bg: '#0f172a',
  dark: true,
  text: '#f8fafc',
  muted: '#94a3b8',
  inputBg: '#1e293b',
  inputBdr: '#334155',
  border: '#334155',
  progressTrack: '#334155'
});

type Role = "student" | "mentor";

/* ── CursorGrid ── */
function CursorGrid({
  cellSize    = 70,
  color       = ACCENT,
  radius      = 140,
  falloff     = "smooth" as "smooth" | "linear",
  holdTime    = 400,
  fadeDuration= 800,
  lineWidth   = 1.2,
  maxOpacity  = 0.9,
  gridOpacity = 0,
  clickPulse  = true,
  pulseSpeed  = 600,
}: {
  cellSize?:     number;
  color?:        string;
  radius?:       number;
  falloff?:      "smooth" | "linear";
  holdTime?:     number;
  fadeDuration?: number;
  lineWidth?:    number;
  maxOpacity?:   number;
  gridOpacity?:  number;
  clickPulse?:   boolean;
  pulseSpeed?:   number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef({ mx: -9999, my: -9999, lastMove: -Infinity });
  const pulses    = useRef<{ x: number; y: number; t: number }[]>([]);
  const rafRef    = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cr = parseInt(color.slice(1, 3), 16);
    const cg = parseInt(color.slice(3, 5), 16);
    const cb = parseInt(color.slice(5, 7), 16);

    function resize() { canvas!.width = canvas!.offsetWidth; canvas!.height = canvas!.offsetHeight; }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function segOpacity(segX: number, segY: number, ts: number): number {
      const { mx, my, lastMove } = stateRef.current;
      const dist = Math.hypot(segX - mx, segY - my);
      const age  = ts - lastMove;

      let op = gridOpacity;
      if (dist < radius) {
        const t      = 1 - dist / radius;
        const shaped = falloff === "smooth" ? t * t : t;
        const fade   = age < holdTime ? 1 : Math.max(0, 1 - (age - holdTime) / fadeDuration);
        op = Math.max(op, shaped * maxOpacity * fade);
      }

      const IDLE_AFTER = 10000;
      if (age > IDLE_AFTER) {
        const idleFadeIn = Math.min(1, (age - IDLE_AFTER) / 2000);
        const idleSine   = 0.5 + 0.5 * Math.sin(ts / 1600);
        op = Math.max(op, 0.07 * idleSine * idleFadeIn);
      }

      for (const p of pulses.current) {
        const pAge    = ts - p.t;
        if (pAge > pulseSpeed) continue;
        const pDist   = Math.hypot(segX - p.x, segY - p.y);
        const pRadius = (pAge / pulseSpeed) * radius * 3;
        const ring    = Math.abs(pDist - pRadius);
        if (ring < 36) {
          const ringOp = (1 - ring / 36) * (1 - pAge / pulseSpeed) * 0.75;
          op = Math.max(op, ringOp);
        }
      }

      return Math.min(1, op);
    }

    function draw(ts: number) {
      const W = canvas!.offsetWidth;
      const H = canvas!.offsetHeight;
      ctx!.clearRect(0, 0, W, H);
      ctx!.lineWidth = lineWidth;

      const cols = Math.ceil(W / cellSize) + 1;
      const rows = Math.ceil(H / cellSize) + 1;

      for (let r = 0; r <= rows; r++) {
        const y = r * cellSize;
        for (let c = 0; c < cols; c++) {
          const x1 = c * cellSize, x2 = (c + 1) * cellSize;
          const op = segOpacity((x1 + x2) * 0.5, y, ts);
          if (op < 0.005) continue;
          ctx!.strokeStyle = `rgba(${cr},${cg},${cb},${op.toFixed(3)})`;
          ctx!.beginPath(); ctx!.moveTo(x1, y); ctx!.lineTo(x2, y); ctx!.stroke();
        }
      }
      for (let c = 0; c <= cols; c++) {
        const x = c * cellSize;
        for (let r = 0; r < rows; r++) {
          const y1 = r * cellSize, y2 = (r + 1) * cellSize;
          const op = segOpacity(x, (y1 + y2) * 0.5, ts);
          if (op < 0.005) continue;
          ctx!.strokeStyle = `rgba(${cr},${cg},${cb},${op.toFixed(3)})`;
          ctx!.beginPath(); ctx!.moveTo(x, y1); ctx!.lineTo(x, y2); ctx!.stroke();
        }
      }

      pulses.current = pulses.current.filter(p => ts - p.t < pulseSpeed * 1.6);
      rafRef.current = requestAnimationFrame(draw);
    }
    rafRef.current = requestAnimationFrame(draw);

    function onMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        stateRef.current.mx = -9999; stateRef.current.my = -9999; return;
      }
      stateRef.current.mx = x; stateRef.current.my = y;
      stateRef.current.lastMove = performance.now();
    }

    function onClick(e: MouseEvent) {
      if (!clickPulse) return;
      const rect = canvas!.getBoundingClientRect();
      const x = e.clientX - rect.left; const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      pulses.current.push({ x, y, t: performance.now() });
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("click", onClick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click", onClick);
    };
  }, [cellSize, color, radius, falloff, holdTime, fadeDuration, lineWidth, maxOpacity, gridOpacity, clickPulse, pulseSpeed]);

  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} />;
}

/* ── Sign loading ── */
const SIGN_ICONS: { letter: string; icon: React.ElementType }[] = [
  { letter: "A", icon: Award }, { letter: "B", icon: BookOpen }, { letter: "C", icon: Camera },
  { letter: "D", icon: LayoutDashboard }, { letter: "E", icon: Eye }, { letter: "F", icon: Flame },
  { letter: "G", icon: Globe }, { letter: "H", icon: Home }, { letter: "I", icon: Activity },
  { letter: "J", icon: Zap }, { letter: "K", icon: Lock }, { letter: "L", icon: LogIn },
  { letter: "M", icon: Moon }, { letter: "N", icon: Bell }, { letter: "O", icon: BarChart2 },
  { letter: "P", icon: Play }, { letter: "Q", icon: Target }, { letter: "R", icon: TrendingUp },
  { letter: "S", icon: Shield }, { letter: "T", icon: Trophy }, { letter: "U", icon: Users },
  { letter: "V", icon: Volume2 }, { letter: "W", icon: Settings }, { letter: "X", icon: X },
  { letter: "Y", icon: UserIcon }, { letter: "Z", icon: Sliders },
];

function SignLoadingScreen({ onComplete }: { onComplete: () => void }) {
  const T = useTheme();
  const [idx, setIdx] = useState(0);
  const done = idx >= SIGN_ICONS.length;

  useEffect(() => {
    if (done) { const t = setTimeout(onComplete, 500); return () => clearTimeout(t); }
    const t = setInterval(() => setIdx(i => i + 1), 50);
    return () => clearInterval(t);
  }, [done, onComplete]);

  const current  = SIGN_ICONS[Math.min(idx, SIGN_ICONS.length - 1)];
  const Icon     = current.icon;
  const progress = Math.min(100, (idx / SIGN_ICONS.length) * 100);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: T.bg, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "Inter,sans-serif", transition: "background .3s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 56 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg,#6366f1,#38bdf8)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(99,102,241,0.5)" }}>
          <BookOpen size={18} color="#fff" />
        </div>
        <span style={{ color: T.text, fontWeight: 800, fontSize: 18, letterSpacing: -0.4, transition: "color .3s" }}>SignPath LMS</span>
      </div>

      <div key={idx} style={{
        width: 200, height: 200, borderRadius: 32, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 14,
        background: done ? "rgba(34,197,94,0.12)" : T.dark ? "linear-gradient(145deg,#13132a,#1a1a40)" : "linear-gradient(145deg,#eeeeff,#e4e4ff)",
        border: `2px solid ${done ? GREEN : ACCENT}`,
        boxShadow: done ? "0 0 60px rgba(34,197,94,0.3)" : `0 0 60px rgba(99,102,241,${T.dark ? "0.3" : "0.18"})`,
        animation: "signPop .13s cubic-bezier(.34,1.56,.64,1) both",
        transition: "border-color .25s, box-shadow .25s, background .25s",
      }}>
        {done ? <CheckCircle size={64} style={{ color: GREEN }} /> : <Icon size={64} style={{ color: ACCENT }} />}
        <div style={{
          fontWeight: 900, fontSize: 48, letterSpacing: -2, lineHeight: 1,
          background: done ? `linear-gradient(135deg,${GREEN},#86efac)` : "linear-gradient(135deg,#6366f1,#38bdf8)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          {done ? "✓" : current.letter}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 5, marginTop: 36, maxWidth: 480, padding: "0 20px" }}>
        {SIGN_ICONS.map((s, i) => {
          const lit    = i < idx;
          const active = i === idx && !done;
          return (
            <div key={s.letter} style={{
              width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800, fontFamily: "DM Mono,monospace",
              background: lit ? `rgba(99,102,241,${T.dark ? "0.25" : "0.15"})` : active ? ACCENT : T.dark ? "rgba(255,255,255,0.04)" : "rgba(99,102,241,0.05)",
              border: `1px solid ${lit ? "rgba(99,102,241,0.4)" : active ? ACCENT : T.border}`,
              color: lit ? ACCENT : active ? "#fff" : T.muted,
              boxShadow: active ? "0 0 12px rgba(99,102,241,0.6)" : undefined,
              transition: "all .13s",
            }}>{s.letter}</div>
          );
        })}
      </div>

      <div style={{ width: 280, marginTop: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: T.muted, fontSize: 11, fontFamily: "DM Mono,monospace", letterSpacing: 1.5 }}>{done ? "READY" : "LOADING ISL SIGNS"}</span>
          <span style={{ color: ACCENT, fontSize: 11, fontFamily: "DM Mono,monospace" }}>{done ? "26 / 26" : `${idx} / 26`}</span>
        </div>
        <div style={{ height: 4, borderRadius: 99, background: T.progressTrack, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 99, background: done ? `linear-gradient(90deg,${GREEN},#86efac)` : "linear-gradient(90deg,#6366f1,#38bdf8)", width: `${progress}%`, transition: "width .13s linear, background .3s" }} />
        </div>
      </div>

      <p style={{ color: T.muted, fontSize: 12, marginTop: 20, letterSpacing: 0.3 }}>
        {done ? "All set! Taking you in…" : "Preparing your sign library…"}
      </p>

      <style>{`@keyframes signPop { 0%{opacity:0;transform:scale(.72)} 100%{opacity:1;transform:scale(1)} }`}</style>
    </div>
  );
}

/* ── LoginPage ── */
export default function Login() {
  const [, setLocation] = useLocation();
  const { login, error, clearError } = useAuthContext();
  const T = useTheme();

  const [role,        setRole]       = useState<Role>("student");
  const [email,       setEmail]      = useState("student@example.com");
  const [password,    setPassword]   = useState("password");
  
  const [showPw,      setShowPw]     = useState(false);
  const [showLoader,  setShowLoader] = useState(false);
  const [focused,     setFocused]    = useState<string | null>(null);

  // Auto-fill demo credentials based on the selected role tab
  useEffect(() => {
    setEmail(`${role}@example.com`);
  }, [role]);

  const handleLoginClick = () => {
    if (!email || !password) return;
    clearError();
    setShowLoader(true);
  };

  const executeApiLogin = async () => {
    try {
      await login(email, password);
      setLocation("/dashboard");
    } catch (err) {
      console.error(err);
      setShowLoader(false); 
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "13px 16px", borderRadius: 14,
    background: T.inputBg, border: `1.5px solid ${T.inputBdr}`,
    color: T.text, fontSize: 14, outline: "none",
    fontFamily: "Inter,sans-serif", boxSizing: "border-box", transition: "border-color .2s",
  };

  const glassBg   = T.dark ? "rgba(9,9,20,0.55)"   : "rgba(240,240,255,0.55)";
  const glassBdr  = T.dark ? "rgba(99,102,241,0.35)" : "rgba(99,102,241,0.3)";
  const glassGlow = T.dark
    ? "0 0 0 1px rgba(99,102,241,0.2), 0 8px 60px rgba(99,102,241,0.22), inset 0 1px 0 rgba(255,255,255,0.06)"
    : "0 0 0 1px rgba(99,102,241,0.18), 0 8px 60px rgba(99,102,241,0.14), inset 0 1px 0 rgba(255,255,255,0.7)";

  return (
    <div style={{
      minHeight: "100vh", position: "relative", overflow: "hidden",
      background: T.dark
        ? "linear-gradient(145deg,#06060f 0%,#0d0824 50%,#060d1a 100%)"
        : "linear-gradient(145deg,#eeeeff 0%,#e0deff 50%,#ddeeff 100%)",
      transition: "background .3s",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {/* The loader now triggers executeApiLogin when its animation finishes */}
      {showLoader && <SignLoadingScreen onComplete={executeApiLogin} />}

      {/* Full-page cursor grid */}
      <CursorGrid
        cellSize={70} color={ACCENT} radius={450} falloff="smooth"
        holdTime={400} fadeDuration={900} lineWidth={1.1}
        maxOpacity={T.dark ? 0.72 : 0.5} gridOpacity={0} clickPulse pulseSpeed={650}
      />

      {/* Ambient glow blobs */}
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle,rgba(99,102,241,${T.dark ? "0.18" : "0.14"}) 0%,transparent 70%)`, top: -160, left: -120, pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle,rgba(56,189,248,${T.dark ? "0.12" : "0.1"}) 0%,transparent 70%)`, bottom: -140, right: -80, pointerEvents: "none" }} />

      {/* Centred two-column layout */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center",
        gap: 48, padding: "48px 32px", width: "100%", maxWidth: 1100,
        minHeight: "100vh", boxSizing: "border-box",
      }}>

        {/* ── Brand column ── */}
        <div style={{ flex: "1 1 320px", maxWidth: 460 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg,#6366f1,#38bdf8)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 22px rgba(99,102,241,0.55)" }}>
              <BookOpen size={22} color="#fff" />
            </div>
            <div>
              <div style={{ color: T.text, fontWeight: 800, fontSize: 18, letterSpacing: -0.4 }}>SignPath LMS</div>
              <div style={{ color: T.muted, fontSize: 10, letterSpacing: 2, fontFamily: "DM Mono,monospace" }}>CV-POWERED · ISL</div>
            </div>
          </div>

          <div style={{ width: 80, height: 80, marginBottom: 24, borderRadius: 22, background: "rgba(99,102,241,0.15)", border: "2px solid rgba(99,102,241,0.32)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 32px rgba(99,102,241,0.3)" }}>
            <BookOpen size={36} color={ACCENT} />
          </div>

          <h1 style={{ color: T.text, fontWeight: 900, fontSize: "clamp(28px,4vw,50px)", lineHeight: 1.12, letterSpacing: -1.5, margin: "0 0 18px" }}>
            Learn Sign Language<br />
            <span style={{ background: "linear-gradient(90deg,#6366f1,#38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              with AI Vision
            </span>
          </h1>
          <p style={{ color: T.muted, fontSize: 16, lineHeight: 1.7, margin: 0, maxWidth: 380 }}>
            Real-time hand tracking · Instant feedback · Adaptive learning that meets you where you are.
          </p>

          {/* Feature pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 32 }}>
            {["Hand Tracking", "ISL Curriculum", "AI Feedback"].map(tag => (
              <span key={tag} style={{
                padding: "6px 14px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                background: T.dark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.09)",
                border: `1px solid rgba(99,102,241,${T.dark ? "0.25" : "0.2"})`,
                color: T.dark ? "#a5b4fc" : ACCENT,
              }}>{tag}</span>
            ))}
          </div>
        </div>

        {/* ── Form card ── */}
        <div style={{
          flex: "1 1 340px", maxWidth: 420,
          background: glassBg,
          border: `1px solid ${glassBdr}`,
          borderRadius: 28,
          boxShadow: glassGlow,
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          padding: "40px 36px",
          transition: "background .3s, border-color .3s, box-shadow .3s",
        }}>
          <h2 style={{ color: T.text, fontWeight: 800, fontSize: 24, letterSpacing: -0.5, margin: "0 0 6px" }}>Welcome back</h2>
          <p style={{ color: T.muted, fontSize: 14, margin: "0 0 28px" }}>Sign in to continue your journey</p>

          {/* ADDED: Backend Error Banner catches failed login attempts */}
          {error && (
            <div style={{ marginBottom: 20 }}>
              <ErrorBanner message={error} title="Login Failed" onDismiss={clearError} autoDismissMs={0} />
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <div style={{ color: T.muted, fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 10, fontFamily: "DM Mono,monospace" }}>I AM A</div>
            <div style={{ display: "flex", background: T.dark ? "rgba(255,255,255,0.06)" : "rgba(99,102,241,0.07)", border: `1px solid ${glassBdr}`, borderRadius: 14, padding: 4, transition: "background .3s,border-color .3s" }}>
              {(["student", "mentor"] as Role[]).map(r => (
                <button key={r} onClick={() => setRole(r)} style={{
                  flex: 1, padding: "11px 0", borderRadius: 10, border: "none",
                  background: role === r ? ACCENT : "transparent",
                  color: role === r ? "#fff" : T.muted,
                  fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all .25s",
                  boxShadow: role === r ? "0 0 20px rgba(99,102,241,0.45)" : undefined,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>{r === "student" ? "Student" : "Mentor"}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ color: T.muted, fontSize: 10, fontWeight: 700, letterSpacing: 1.8, display: "block", marginBottom: 8, fontFamily: "DM Mono,monospace" }}>EMAIL</label>
            <input 
              type="email" 
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ ...inputStyle, borderColor: focused === "email" ? ACCENT : T.inputBdr, boxShadow: focused === "email" ? "0 0 0 3px rgba(99,102,241,0.15)" : undefined }}
              onFocus={() => setFocused("email")} 
              onBlur={() => setFocused(null)} 
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <label style={{ color: T.muted, fontSize: 10, fontWeight: 700, letterSpacing: 1.8, fontFamily: "DM Mono,monospace" }}>PASSWORD</label>
              <button style={{ color: SKY, fontSize: 12, background: "none", border: "none", cursor: "pointer", padding: 0 }}>Forgot?</button>
            </div>
            <div style={{ position: "relative" }}>
              <input 
                type={showPw ? "text" : "password"} 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...inputStyle, paddingRight: 48, borderColor: focused === "pw" ? ACCENT : T.inputBdr, boxShadow: focused === "pw" ? "0 0 0 3px rgba(99,102,241,0.15)" : undefined }}
                onFocus={() => setFocused("pw")} 
                onBlur={() => setFocused(null)}
                onKeyDown={e => e.key === "Enter" && handleLoginClick()} 
              />
              <button onClick={() => setShowPw(v => !v)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.muted, cursor: "pointer", display: "flex" }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button onClick={handleLoginClick} style={{
            width: "100%", padding: "15px 0", borderRadius: 99, border: "none",
            background: "linear-gradient(135deg,#6366f1,#38bdf8)",
            color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            boxShadow: "0 0 36px rgba(99,102,241,0.55)", transition: "all .25s", letterSpacing: 0.3,
          }}>
            <LogIn size={16} /> Log In as {role === "student" ? "Student" : "Mentor"}
          </button>

          <p style={{ textAlign: "center", color: T.muted, fontSize: 13, marginTop: 20 }}>
            {"No account? "}<span style={{ color: SKY, fontWeight: 600, cursor: "pointer" }}>Sign up free →</span>
          </p>
        </div>
      </div>
    </div>
  );
}
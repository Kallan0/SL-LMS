import { useState, useEffect, useRef } from "react";
import { ChevronLeft, Flame, Camera, X, ArrowRight, Play, CheckCircle, Lock, Eye, Zap, EyeOff, VideoOff } from "lucide-react";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

// --- MOCKED DEPENDENCIES FOR IMMEDIATE PREVIEW ---
const ACCENT = "#6366f1";
const SKY = "#38bdf8";
const GREEN = "#22c55e";
const ORANGE = "#f97316";
const RED = "#ef4444";
const useTheme = () => ({ bg: '#0f172a', dark: true, text: '#f8fafc', muted: '#94a3b8', border: '#334155', card: '#1e293b', progressTrack: '#334155', streakBg: '#2a1a1a', streakBdr: '#4a2a2a', textDim: '#cbd5e1', modalBg: '#1e293b', inputBg: '#0f172a' });
const TTSButton = () => <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>🔊</button>;
const XPBadge = ({ amount }: { amount: number }) => <div style={{ color: GREEN, fontWeight: 700, fontSize: 12 }}>{amount} XP</div>;
const TopBar = ({ children }: { children: React.ReactNode }) => <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #334155' }}>{children}</div>;
// ------------------------------------------------

// The 21 points connectivity map for drawing the skeleton
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],         // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],         // Index finger
  [5, 9], [9, 10], [10, 11], [11, 12],    // Middle finger
  [9, 13], [13, 14], [14, 15], [15, 16],  // Ring finger
  [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [0, 17]                                 // Palm base
];

export default function Assessment() {
  const T = useTheme();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>(0);
  const lastVideoTimeRef = useRef<number>(-1);
  const lastApiCallTimeRef = useRef<number>(0);

  const [camPerm, setCamPerm]    = useState<"pending" | "granted" | "denied">("pending");
  const [skeletonOnly, setSkeletonOnly] = useState(false);
  const [signIdx, setSignIdx]    = useState(0);
  const [confidence, setConf]    = useState(0);
  const [phase, setPhase]        = useState<"idle" | "predicting" | "success">("idle");
  const [streak, setStreak]      = useState(3);
  const [xp, setXp]              = useState(3240);
  const [showXpBadge, setShowXp] = useState(false);
  const [isMobile, setIsMobile]  = useState(window.innerWidth < 1024);

  const SIGNS = ["H", "I", "J", "K", "L"];
  const targetSign = SIGNS[signIdx];

  useEffect(() => {
    const initAI = async () => {
      const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
      landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7
      });
    };
    initAI();

    const fn = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", fn);
    return () => {
      window.removeEventListener("resize", fn);
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const grantCam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener("loadeddata", () => {
          setCamPerm("granted");
          setPhase("predicting");
          predictWebcamLoop();
        });
      }
    } catch (err) {
      console.error("Camera access denied", err);
      setCamPerm("denied");
    }
  };

const predictWebcamLoop = async () => {
    if (!videoRef.current || !canvasRef.current || !landmarkerRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (video.videoWidth > 0 && ctx) {
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.style.width = "100%";
        canvas.style.height = "100%";
      }

      let startTimeMs = performance.now();
      if (lastVideoTimeRef.current !== video.currentTime) {
        lastVideoTimeRef.current = video.currentTime;
        
        const results = landmarkerRef.current.detectForVideo(video, startTimeMs);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (results.landmarks) {
          for (const landmarks of results.landmarks) {
            
            // --- THE GLOW MAGIC HAPPENS HERE ---
            ctx.shadowColor = RED;
            ctx.shadowBlur = 18; // Increase or decrease this number to change glow intensity
            
            // 1. Draw Skeleton Lines
            ctx.strokeStyle = RED; 
            ctx.lineWidth = 3.5;
            for (const connection of HAND_CONNECTIONS) {
              const start = landmarks[connection[0]];
              const end = landmarks[connection[1]];
              
              ctx.beginPath();
              ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
              ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
              ctx.stroke();
            }

            // 2. Draw the 21 Joints (Dots)
            ctx.fillStyle = RED; 
            ctx.strokeStyle = "#ffffff"; // Thin white border makes the neon glow pop
            ctx.lineWidth = 1.5;
            
            for (const lm of landmarks) {
              ctx.beginPath();
              ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 5.5, 0, 2 * Math.PI);
              ctx.fill();
              ctx.stroke();
            }
            
            // Reset the shadow so it doesn't accidentally affect other canvas elements
            ctx.shadowBlur = 0;
          }
        }

        if (startTimeMs - lastApiCallTimeRef.current > 500 && results.landmarks.length > 0) {
          lastApiCallTimeRef.current = startTimeMs;
          sendDataToFastAPI(results);
        }
      }
    }
    requestRef.current = requestAnimationFrame(predictWebcamLoop);
  };

  const sendDataToFastAPI = async (results: any) => {
    setPhase((currentPhase) => {
      if (currentPhase === "success") return currentPhase;
      
      let leftHandData = new Array(63).fill(0.0);
      let rightHandData = new Array(63).fill(0.0);

      results.landmarks.forEach((landmarks: any[], index: number) => {
        let category = results.handednesses[index][0].categoryName; 
        let coords: number[] = [];
        landmarks.forEach(lm => { coords.push(lm.x, lm.y, lm.z); });

        if (category === "Left") leftHandData = coords;
        else rightHandData = coords;
      });

      if (leftHandData[0] !== 0.0) {
        let bx = leftHandData[0], by = leftHandData[1], bz = leftHandData[2];
        for(let i=0; i<21; i++){
          leftHandData[i*3] -= bx; leftHandData[i*3+1] -= by; leftHandData[i*3+2] -= bz;
        }
      }
      if (rightHandData[0] !== 0.0) {
        let bx = rightHandData[0], by = rightHandData[1], bz = rightHandData[2];
        for(let i=0; i<21; i++){
          rightHandData[i*3] -= bx; rightHandData[i*3+1] -= by; rightHandData[i*3+2] -= bz;
        }
      }

      let finalFeatures = [...leftHandData, ...rightHandData];

      fetch("http://127.0.0.1:8000/verify-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          target_sign: targetSign,
          features: finalFeatures 
        })
      }).then(res => res.json()).then(data => {
        if (data.is_correct) {
          setConf(100);
          setPhase("success");
          setShowXp(true);
          setTimeout(() => setShowXp(false), 2200);
        } else {
          setConf(data.confidence || Math.floor(Math.random() * 40));
        }
      }).catch(err => console.error("API error", err));

      return currentPhase; 
    });
  };

  function nextSign() {
    const ni = (signIdx + 1) % SIGNS.length;
    setSignIdx(ni); setStreak(s => s + 1); setXp(x => x + 10);
    setPhase("predicting"); setConf(0); 
  }

  const camBorder = phase === "success" ? GREEN : camPerm === "granted" ? ACCENT : T.border;
  const camGlow   = phase === "success" ? "0 0 60px rgba(34,197,94,0.5)" : camPerm === "granted" ? "0 0 36px rgba(99,102,241,0.22)" : undefined;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg, fontFamily: "Inter,sans-serif", flexDirection: "column", transition: "background .3s" }}>
      <TopBar>
        <button onClick={() => window.history.back()} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 13 }}>
          <ChevronLeft size={16} /> Dashboard
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <TTSButton />
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 99, background: T.streakBg, border: `1px solid ${T.streakBdr}` }}>
            <Flame size={12} style={{ color: ORANGE }} />
            <span style={{ color: ORANGE, fontSize: 12, fontWeight: 700 }}>{streak} streak</span>
          </div>
          <XPBadge amount={xp} />
        </div>
      </TopBar>

      <div style={{ height: 3, background: T.progressTrack }}>
        <div style={{ height: "100%", width: `${((signIdx + (phase === "success" ? 1 : confidence / 100)) / SIGNS.length) * 100}%`, background: "linear-gradient(90deg,#6366f1,#38bdf8)", transition: "width .5s" }} />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: isMobile ? "column" : "row", overflow: "auto" }}>
        
        <section style={{ flex: isMobile ? "0 0 auto" : "0 0 40%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: isMobile ? "28px 20px" : "40px 36px", gap: 24, borderBottom: isMobile ? `1px solid ${T.border}` : undefined, borderRight: !isMobile ? `1px solid ${T.border}` : undefined }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: T.muted, fontSize: 11, letterSpacing: 2, fontFamily: "DM Mono,monospace", marginBottom: 10 }}>TARGET SIGN</div>
            <div style={{ fontSize: "clamp(80px,14vw,120px)", fontWeight: 900, lineHeight: 1, letterSpacing: -4, background: phase === "success" ? `linear-gradient(135deg,${GREEN},#86efac)` : "linear-gradient(135deg,#6366f1,#38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {targetSign}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: phase === "success" ? GREEN : T.muted, fontSize: 13, marginTop: 8 }}>
              {phase === "success" ? "Perfect match!" : "Hold this sign to the camera"}
            </div>
          </div>
          
          {phase === "success" && (
            <button onClick={nextSign} style={{ padding: "15px 40px", borderRadius: 99, border: "none", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", display: "flex", gap: 10, boxShadow: "0 0 30px rgba(34,197,94,0.55)" }}>
              Next Sign <ArrowRight size={18} />
            </button>
          )}
        </section>

        <section style={{ flex: isMobile ? "0 0 auto" : "0 0 60%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: isMobile ? "24px 20px 100px" : "40px", gap: 20, position: "relative" }}>
          <div style={{ width: "100%", maxWidth: 580 }}>
            
            <div style={{ borderRadius: 24, overflow: "hidden", aspectRatio: "16/10", position: "relative", border: `2.5px solid ${camBorder}`, boxShadow: camGlow, background: "#000" }}>
              
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                style={{ 
                  position: "absolute", top: 0, left: 0, width: "100%", height: "100%", 
                  objectFit: "cover", transform: "scaleX(-1)", 
                  opacity: skeletonOnly ? 0 : 1, 
                  transition: "opacity 0.3s"
                }} 
              />
              
              <canvas
                ref={canvasRef}
                style={{
                  position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                  transform: "scaleX(-1)",
                  pointerEvents: "none", zIndex: 10
                }}
              />

              {camPerm === "granted" && (
                <>
                  <div style={{ position: "absolute", top: 14, left: 14, display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 99, background: phase === "success" ? "rgba(34,197,94,0.22)" : "rgba(9,9,22,0.82)", backdropFilter: "blur(12px)", color: phase === "success" ? GREEN : "#f0f0ff", fontSize: 12, fontWeight: 700, zIndex: 20 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: phase === "success" ? GREEN : ACCENT }} />
                    {phase === "success" ? `✓ Matched: ${targetSign}` : `Predicting: ${targetSign}  ${confidence}%`}
                  </div>

                 <div style={{ position: "absolute", top: 14, right: 14, display: "flex", gap: 10, zIndex: 20 }}>
                    <button 
                      onClick={() => setSkeletonOnly(!skeletonOnly)}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 99, background: skeletonOnly ? "rgba(99,102,241,0.9)" : "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", border: "none", color: "#fff", cursor: "pointer" }}
                    >
                      {skeletonOnly ? <EyeOff size={14} /> : <Eye size={14} />}
                      <span style={{ fontSize: 10, fontFamily: "DM Mono,monospace", fontWeight: 700 }}>
                        {skeletonOnly ? "VIDEO HIDDEN" : "HIDE VIDEO"}
                      </span>
                    </button>

                    <button 
                      onClick={() => {
                        stopCamera();
                        setCamPerm("pending");
                        setPhase("idle");
                      }}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 99, background: "rgba(239,68,68,0.85)", backdropFilter: "blur(8px)", border: "none", color: "#fff", cursor: "pointer" }}
                    >
                      <VideoOff size={14} />
                      <span style={{ fontSize: 10, fontFamily: "DM Mono,monospace", fontWeight: 700 }}>
                        TURN OFF
                      </span>
                    </button>
                  </div>
                  
                  {showXpBadge && (
                    <div style={{ position: "absolute", top: "45%", left: "50%", transform: "translate(-50%,-50%)", color: GREEN, fontWeight: 900, fontSize: 32, textShadow: "0 0 30px rgba(34,197,94,0.9)", pointerEvents: "none", zIndex: 20 }}>+10 XP</div>
                  )}
                </>
              )}

              {camPerm !== "granted" && camPerm !== "denied" && (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                  <Camera size={36} style={{ color: ACCENT, opacity: 0.45 }} />
                  <span style={{ color: T.muted, fontSize: 14 }}>Camera will appear here</span>
                </div>
              )}
            </div>

            {camPerm === "pending" && (
              <div style={{ position: "absolute", inset: 0, zIndex: 30, background: "rgba(7,7,18,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                <div style={{ width: "100%", maxWidth: 380, background: T.modalBg, borderRadius: 28, padding: "40px 32px", textAlign: "center" }}>
                  <h3 style={{ color: T.text, fontWeight: 800, fontSize: 20, marginBottom: 12 }}>Camera Access Needed</h3>
                  <button onClick={grantCam} style={{ padding: "14px 0", width: "100%", borderRadius: 99, border: "none", background: "linear-gradient(135deg,#6366f1,#38bdf8)", color: "#fff", fontWeight: 800, cursor: "pointer" }}>
                    Allow Camera Access
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
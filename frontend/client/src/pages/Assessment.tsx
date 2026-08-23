import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, Flame, Camera, ArrowRight, Eye, EyeOff, VideoOff, Trophy, HelpCircle, Lightbulb, SkipForward, Clock, X } from "lucide-react";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

var ACCENT = "#6366f1";
var GREEN = "#22c55e";
var ORANGE = "#f97316";
var RED = "#ef4444";

var HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

var SIGNS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
var PIXEL_SIZE = 100;
var ASSESSMENT_LESSON_SIGN = "ASSESSMENT";
var STUCK_THRESHOLD_SECONDS = 5;

/** Hand position guide for each ISL letter */
var SIGN_GUIDES: Record<string, { title: string; steps: string[]; tips: string[]; description: string }> = {
  A: {
    title: "Letter A - Closed Fist",
    description: "Make a fist with your thumb resting beside your index finger.",
    steps: [
      "Close all four fingers into your palm",
      "Wrap your thumb alongside (not over) your index finger",
      "Keep your fist vertical, palm facing the camera",
      "Fingers should point straight up",
    ],
    tips: [
      "Make sure your thumb is NOT wrapped over your fingers",
      "Keep your fist tight but relaxed",
      "Position your hand in the center of the frame",
    ],
  },
  B: {
    title: "Letter B - Flat Palm",
    description: "Hold your hand flat with all four fingers pointing up and together.",
    steps: [
      "Extend all four fingers straight up, held together",
      "Tuck your thumb across your palm",
      "Palm faces the camera",
      "Fingers should be straight and close together",
    ],
    tips: [
      "Keep fingers tightly together with no gaps",
      "Thumb should be folded across the palm, not sticking out",
      "Hand should be flat like a wall",
    ],
  },
  C: {
    title: "Letter C - Curved Hand",
    description: "Curve your fingers and thumb to form the shape of the letter C.",
    steps: [
      "Curve all four fingers together in an arc",
      "Curve your thumb to mirror the fingers",
      "The gap between thumb and fingers should look like a C",
      "Palm faces slightly to the side",
    ],
    tips: [
      "Think of holding a large orange",
      "Both thumb and fingers should curve equally",
      "The gap should be clearly visible",
    ],
  },
  D: {
    title: "Letter D - Index Up",
    description: "Point your index finger up while closing the rest.",
    steps: [
      "Extend your index finger straight up",
      "Close your middle, ring, and pinky fingers into your palm",
      "Touch your thumb tip to the middle finger tip",
      "Index finger points straight up",
    ],
    tips: [
      "Only the index finger should be extended",
      "Thumb touches the tips of the closed fingers",
      "Keep the extended finger straight, not bent",
    ],
  },
  E: {
    title: "Letter E - All Curled",
    description: "Curl all fingers down tightly, like a claw gripping something.",
    steps: [
      "Curl all four fingertips down towards your palm",
      "Tuck your thumb against the side of your index finger",
      "All fingertips should point downward",
      "Hand looks like a closed claw",
    ],
    tips: [
      "Fingertips should almost touch the palm",
      "Keep all fingers curled at the same level",
      "This is similar to A but fingers are more curled",
    ],
  },
  F: {
    title: "Letter F - Three Up, Circle",
    description: "Form a circle with index and thumb, extend the other three fingers.",
    steps: [
      "Touch your index fingertip to your thumb tip (circle)",
      "Extend your middle, ring, and pinky fingers straight up",
      "Three fingers should be spread apart slightly",
      "Palm faces the camera",
    ],
    tips: [
      "The circle between index and thumb should be clearly visible",
      "Keep the three extended fingers straight",
      "Similar to the 'OK' gesture but with three fingers up",
    ],
  },
  G: {
    title: "Letter G - Point Forward",
    description: "Point your index finger and thumb sideways like a gun shape.",
    steps: [
      "Point your index finger forward (to the side)",
      "Extend your thumb upward",
      "Close the other three fingers into your palm",
      "Hand is turned sideways, pointing left",
    ],
    tips: [
      "Index finger points horizontally, not up",
      "Thumb points straight up at 90 degrees",
      "Keep the other fingers tightly closed",
    ],
  },
  H: {
    title: "Letter H - Two Sideways",
    description: "Extend index and middle fingers pointing sideways together.",
    steps: [
      "Extend your index and middle fingers sideways",
      "Keep these two fingers together (not spread)",
      "Close ring finger and pinky into your palm",
      "Thumb tucks across the palm",
    ],
    tips: [
      "Index and middle fingers point to the side, not up",
      "Fingers should be held together flat",
      "Similar to a sideways peace sign with fingers together",
    ],
  },
  I: {
    title: "Letter I - Pinky Up",
    description: "Extend only your pinky finger while closing all others.",
    steps: [
      "Extend your pinky finger straight up",
      "Close index, middle, and ring fingers into your fist",
      "Tuck your thumb over the closed fingers",
      "Only the pinky should be visible pointing up",
    ],
    tips: [
      "Make sure only the pinky is extended",
      "Keep the fist tight with other fingers",
      "This is like making the 'rock on' sign with just the pinky",
    ],
  },
  J: {
    title: "Letter J - Pinky Hook",
    description: "Start with pinky up (like I), then draw a J shape in the air.",
    steps: [
      "Start with the I handshape (pinky up)",
      "Hook your pinky slightly forward",
      "Draw a small J motion downward and curve",
      "The pinky traces the shape of the letter J",
    ],
    tips: [
      "This is a motion sign - move your pinky",
      "Start with pinky straight, then curve it",
      "The motion goes down and curves left",
    ],
  },
};

export default function Assessment() {
  var videoRef = useRef<HTMLVideoElement>(null);
  var canvasRef = useRef<HTMLCanvasElement>(null);
  var offscreenRef = useRef<HTMLCanvasElement | null>(null);
  var streamRef = useRef<MediaStream | null>(null);
  var landmarkerRef = useRef<HandLandmarker | null>(null);
  var requestRef = useRef<number>(0);
  var lastVideoTimeRef = useRef<number>(-1);
  var lastApiCallTimeRef = useRef<number>(0);
  var sendPixelsRef = useRef<() => void>(function () {});

  var [camPerm, setCamPerm] = useState<"pending" | "granted" | "denied">("pending");
  var [skeletonOnly, setSkeletonOnly] = useState(false);
  var [signIdx, setSignIdx] = useState(0);
  var [confidence, setConf] = useState(0);
  var [phase, setPhase] = useState<"idle" | "predicting" | "success" | "completed">("idle");
  var [streak, setStreak] = useState(0);
  var [xp, setXp] = useState(0);
  var [correctCount, setCorrectCount] = useState(0);
  var [showXpBadge, setShowXp] = useState(false);
  var [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  var [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("checking");

  // Guidance states
  var [stuckSeconds, setStuckSeconds] = useState(0);
  var [showGuide, setShowGuide] = useState(false);
  var [lastPrediction, setLastPrediction] = useState("");
  var [handDetected, setHandDetected] = useState(true);
  var [showExitConfirm, setShowExitConfirm] = useState(false);

  var targetSign = SIGNS[signIdx];
  var ML_URL = import.meta.env.VITE_ML_BASE_URL ?? "http://127.0.0.1:8001";
  var API_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:5000";
  var guide = SIGN_GUIDES[targetSign];

  // Check ML server health
  useEffect(function () {
    fetch(ML_URL + "/health")
      .then(function (r) { return r.json(); })
      .then(function (d) { setServerStatus(d.model_loaded ? "online" : "offline"); })
      .catch(function () { setServerStatus("offline"); });
  }, [ML_URL]);

  // Init MediaPipe
  useEffect(function () {
    var initAI = async function () {
      try {
        var vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.7,
          minTrackingConfidence: 0.7,
        });
      } catch (err) {
        console.error("MediaPipe init failed:", err);
      }
    };
    initAI();

    offscreenRef.current = document.createElement("canvas");
    offscreenRef.current.width = PIXEL_SIZE;
    offscreenRef.current.height = PIXEL_SIZE;

    var fn = function () { setIsMobile(window.innerWidth < 1024); };
    window.addEventListener("resize", fn);
    return function () {
      window.removeEventListener("resize", fn);
      stopCamera();
    };
  }, []);

  // Stuck timer: counts up every second while in predicting phase with low confidence
  useEffect(function () {
    if (phase !== "predicting" || confidence > 40) {
      setStuckSeconds(0);
      return;
    }
    var interval = setInterval(function () {
      setStuckSeconds(function (s) { return s + 1; });
    }, 1000);
    return function () { clearInterval(interval); };
  }, [phase, confidence, signIdx]);

  // Auto-show guide after stuck for threshold seconds
  useEffect(function () {
    if (stuckSeconds >= STUCK_THRESHOLD_SECONDS && !showGuide) {
      setShowGuide(true);
    }
  }, [stuckSeconds, showGuide]);

  // sendPixelsRef synced after sendPixelsToML is defined below
  useEffect(function () {
    setShowGuide(false);
    setStuckSeconds(0);
    setLastPrediction("");
  }, [signIdx]);

  var stopCamera = useCallback(function () {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(function (t) { t.stop(); });
      streamRef.current = null;
    }
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  var grantCam = async function () {
    try {
      var stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener("loadeddata", function () {
          setCamPerm("granted");
          setPhase("predicting");
          predictLoop();
        });
      }
    } catch (_e) {
      setCamPerm("denied");
    }
  };

  var extractPixels = function (): number[] {
    var video = videoRef.current;
    var offscreen = offscreenRef.current;
    if (!video || !offscreen) return [];
    var ctx = offscreen.getContext("2d");
    if (!ctx) return [];

    ctx.save();
    ctx.translate(PIXEL_SIZE, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, PIXEL_SIZE, PIXEL_SIZE);
    ctx.restore();

    var imageData = ctx.getImageData(0, 0, PIXEL_SIZE, PIXEL_SIZE);
    var pixels: number[] = [];
    for (var i = 0; i < imageData.data.length; i += 4) {
      var gray = imageData.data[i] * 0.299 + imageData.data[i + 1] * 0.587 + imageData.data[i + 2] * 0.114;
      pixels.push(gray);
    }
    return pixels;
  };

  var predictLoop = useCallback(function () {
    if (!videoRef.current || !canvasRef.current) return;
    var video = videoRef.current;
    var canvas = canvasRef.current;
    var ctx = canvas.getContext("2d");

    if (video.videoWidth > 0 && ctx) {
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.style.width = "100%";
        canvas.style.height = "100%";
      }

      var now = performance.now();
      if (lastVideoTimeRef.current !== video.currentTime) {
        lastVideoTimeRef.current = video.currentTime;
        var results = landmarkerRef.current ? landmarkerRef.current.detectForVideo(video, now) : null;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        var detected = results && results.landmarks && results.landmarks.length > 0;
        setHandDetected(!!detected);

        if (detected && results) {
          for (var h = 0; h < results.landmarks.length; h++) {
            var landmarks = results.landmarks[h];
            ctx.shadowColor = RED;
            ctx.shadowBlur = 18;
            ctx.strokeStyle = RED;
            ctx.lineWidth = 3.5;
            for (var c = 0; c < HAND_CONNECTIONS.length; c++) {
              var conn = HAND_CONNECTIONS[c];
              var s = landmarks[conn[0]];
              var e = landmarks[conn[1]];
              if (!s || !e) continue;
              ctx.beginPath();
              ctx.moveTo(s.x * canvas.width, s.y * canvas.height);
              ctx.lineTo(e.x * canvas.width, e.y * canvas.height);
              ctx.stroke();
            }
            ctx.fillStyle = RED;
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.5;
            for (var l = 0; l < landmarks.length; l++) {
              var lm = landmarks[l];
              ctx.beginPath();
              ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 5.5, 0, 2 * Math.PI);
              ctx.fill();
              ctx.stroke();
            }
            ctx.shadowBlur = 0;
          }
        }

        if (now - lastApiCallTimeRef.current > 600) {
          lastApiCallTimeRef.current = now;
          sendPixelsRef.current();
        }
      }
    }
    requestRef.current = requestAnimationFrame(predictLoop);
  }, []);

  var sendPixelsToML = useCallback(async function () {
    // Read current phase from a ref-like check — avoid calling inside setState
    if (phase === "success" || phase === "completed" || phase === "idle") return;

    var pixels = extractPixels();
    if (pixels.length === 0) return;

    var currentTarget = SIGNS[signIdx];

    try {
      var resp = await fetch(ML_URL + "/verify-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_sign: currentTarget, pixels: pixels }),
      });
      if (!resp.ok) {
        console.error("ML server returned", resp.status, await resp.text());
        return;
      }
      var data = await resp.json();
      if (data.is_correct) {
        setConf(100);
        setPhase("success");
        setCorrectCount(function (c) { return c + 1; });
        setXp(function (x) { return x + 10; });
        setShowXp(true);
        setTimeout(function () { setShowXp(false); }, 2200);
      } else {
        var c = data.confidence ? Math.round(data.confidence * 100) : 0;
        setConf(c);
        setLastPrediction(data.ai_prediction);
      }
    } catch (err) {
      console.error("ML API error:", err);
    }
  }, [phase, signIdx, ML_URL]);

  // Keep sendPixelsRef current so predictLoop always calls the latest version
  useEffect(function () {
    sendPixelsRef.current = sendPixelsToML;
  }, [sendPixelsToML]);

  var nextSign = function () {
    var nextIdx = signIdx + 1;
    if (nextIdx >= SIGNS.length) {
      submitToLeaderboard();
      setPhase("completed");
      return;
    }
    setSignIdx(nextIdx);
    setStreak(function (s) { return s + 1; });
    setPhase("predicting");
    setConf(0);
  };

  var skipSign = function () {
    nextSign();
  };

  var exitAssessment = function () {
    stopCamera();
    window.location.href = "/dashboard";
  };

  var submitToLeaderboard = async function () {
    var token = localStorage.getItem("sign_language_lms_token");
    if (!token) return;
    try {
      var lessonsRes = await fetch(API_URL + "/lessons");
      var lessonsList = await lessonsRes.json();
      var assessmentLesson = lessonsList.find(function (l: any) { return l.signLabel === ASSESSMENT_LESSON_SIGN; });
      if (!assessmentLesson) {
        console.error("Assessment lesson not found in DB");
        return;
      }
      var accuracy = (correctCount / SIGNS.length) * 100;
      await fetch(API_URL + "/progress/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          lessonId: assessmentLesson.id,
          accuracy: Math.round(accuracy),
        }),
      });
    } catch (err) {
      console.error("Failed to update leaderboard:", err);
    }
  };

  var restart = function () {
    setSignIdx(0);
    setCorrectCount(0);
    setXp(0);
    setStreak(0);
    setConf(0);
    setPhase("predicting");
    setShowGuide(false);
    setStuckSeconds(0);
  };

  var camBorder = phase === "success" ? GREEN : camPerm === "granted" ? ACCENT : "#334155";
  var camGlow = phase === "success" ? "0 0 60px rgba(34,197,94,0.5)" : camPerm === "granted" ? "0 0 36px rgba(99,102,241,0.22)" : undefined;
  var isStuck = stuckSeconds >= STUCK_THRESHOLD_SECONDS && phase === "predicting";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f172a", fontFamily: "Inter,sans-serif", flexDirection: "column" as const }}>
      {/* Top Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid #334155" }}>
        <button onClick={function () { setShowExitConfirm(true); }} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 13 }}>
          <ChevronLeft size={16} /> Exit Assessment
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {serverStatus === "offline" && (
            <span style={{ color: RED, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 99, background: "rgba(239,68,68,0.15)" }}>ML Server Offline</span>
          )}
          {serverStatus === "online" && (
            <span style={{ color: GREEN, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 99, background: "rgba(34,197,94,0.15)" }}>ML Server Ready</span>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 99, background: "#2a1a1a", border: "1px solid #4a2a2a" }}>
            <Flame size={12} style={{ color: ORANGE }} />
            <span style={{ color: ORANGE, fontSize: 12, fontWeight: 700 }}>{streak} streak</span>
          </div>
          <div style={{ color: GREEN, fontWeight: 700, fontSize: 12 }}>{xp} XP</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: "#334155" }}>
        <div style={{ height: "100%", width: ((signIdx + (phase === "success" ? 1 : 0)) / SIGNS.length * 100) + "%", background: "linear-gradient(90deg,#6366f1,#38bdf8)", transition: "width .5s" }} />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: isMobile ? ("column" as const) : ("row" as const), overflow: "auto" }}>
        {/* Left Panel: Target Sign + Guide */}
        <section style={{ flex: isMobile ? "0 0 auto" : "0 0 40%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: isMobile ? "28px 20px" : "40px 36px", gap: 20, borderBottom: isMobile ? "1px solid #334155" : undefined, borderRight: !isMobile ? "1px solid #334155" : undefined }}>
          {phase === "completed" ? (
            <div style={{ textAlign: "center" }}>
              <Trophy size={48} style={{ color: ORANGE, marginBottom: 16 }} />
              <div style={{ color: "#f8fafc", fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Assessment Complete!</div>
              <div style={{ color: "#94a3b8", fontSize: 16, marginBottom: 20 }}>
                Score: {correctCount}/{SIGNS.length} ({Math.round(correctCount / SIGNS.length * 100)}%)
              </div>
              <div style={{ color: GREEN, fontSize: 20, fontWeight: 800, marginBottom: 24 }}>+{xp} XP earned</div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button onClick={restart} style={{ padding: "14px 32px", borderRadius: 99, border: "none", background: "linear-gradient(135deg,#6366f1,#38bdf8)", color: "#fff", fontWeight: 800, cursor: "pointer" }}>Try Again</button>
                <button onClick={function () { window.location.href = "/leaderboard"; }} style={{ padding: "14px 32px", borderRadius: 99, border: "2px solid #334155", background: "transparent", color: "#f8fafc", fontWeight: 800, cursor: "pointer" }}>View Leaderboard</button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", width: "100%", maxWidth: 400 }}>
              <div style={{ color: "#94a3b8", fontSize: 11, letterSpacing: 2, fontFamily: "DM Mono,monospace", marginBottom: 10 }}>TARGET SIGN</div>
              <div style={{ fontSize: "clamp(80px,14vw,120px)", fontWeight: 900, lineHeight: 1, letterSpacing: -4, background: phase === "success" ? "linear-gradient(135deg,#22c55e,#86efac)" : "linear-gradient(135deg,#6366f1,#38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {targetSign}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: phase === "success" ? GREEN : "#94a3b8", fontSize: 13, marginTop: 8 }}>
                {phase === "success" ? "Perfect match!" : handDetected ? "Show this letter to the camera" : "No hand detected - show your hand"}
              </div>
              <div style={{ color: "#64748b", fontSize: 12, marginTop: 12 }}>{signIdx + 1} of {SIGNS.length}</div>

              {/* Last prediction display */}
              {phase === "predicting" && lastPrediction && !showGuide && (
                <div style={{ marginTop: 12, padding: "6px 14px", borderRadius: 99, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8" }}>
                  AI sees: <span style={{ color: "#f8fafc", fontWeight: 700 }}>{lastPrediction}</span>
                </div>
              )}

              {/* Stuck indicator */}
              {isStuck && !showGuide && (
                <div style={{ marginTop: 12, padding: "8px 16px", borderRadius: 12, background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", display: "flex", alignItems: "center", gap: 8 }}>
                  <Clock size={14} style={{ color: ORANGE }} />
                  <span style={{ color: ORANGE, fontSize: 12, fontWeight: 600 }}>Having trouble? ({stuckSeconds}s)</span>
                </div>
              )}

              {/* Help / Skip buttons */}
              {phase === "predicting" && (
                <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "center" }}>
                  <button
                    onClick={function () { setShowGuide(!showGuide); }}
                    style={{
                      padding: "8px 16px", borderRadius: 99, border: showGuide ? "1px solid " + ACCENT : "1px solid #334155",
                      background: showGuide ? "rgba(99,102,241,0.15)" : "transparent", color: showGuide ? ACCENT : "#94a3b8",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600,
                    }}
                  >
                    <Lightbulb size={14} />
                    {showGuide ? "Hide Guide" : "Need Help?"}
                  </button>
                  <button
                    onClick={skipSign}
                    style={{
                      padding: "8px 16px", borderRadius: 99, border: "1px solid #334155",
                      background: "transparent", color: "#64748b",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600,
                    }}
                  >
                    <SkipForward size={14} />
                    Skip
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Guide Panel */}
          {showGuide && guide && phase !== "completed" && (
            <div style={{
              width: "100%", maxWidth: 400, background: "#1e293b", borderRadius: 16, border: "1px solid #334155",
              overflow: "hidden", textAlign: "left",
            }}>
              {/* Guide header */}
              <div style={{ padding: "14px 18px", background: "rgba(99,102,241,0.08)", borderBottom: "1px solid #334155", display: "flex", alignItems: "center", gap: 8 }}>
                <HelpCircle size={18} style={{ color: ACCENT }} />
                <span style={{ color: "#f8fafc", fontWeight: 700, fontSize: 14 }}>{guide.title}</span>
              </div>

              <div style={{ padding: "16px 18px" }}>
                <p style={{ color: "#cbd5e1", fontSize: 13, marginBottom: 14, lineHeight: 1.5 }}>{guide.description}</p>

                {/* Steps */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ color: ACCENT, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>How to form this sign</div>
                  {guide.steps.map(function (step, i) {
                    return (
                      <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                        <div style={{
                          minWidth: 22, height: 22, borderRadius: 99, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: ACCENT, flexShrink: 0, marginTop: 1,
                        }}>{i + 1}</div>
                        <span style={{ color: "#e2e8f0", fontSize: 13, lineHeight: 1.5 }}>{step}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Tips */}
                <div>
                  <div style={{ color: ORANGE, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                    <Lightbulb size={12} /> Tips
                  </div>
                  {guide.tips.map(function (tip, i) {
                    return (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
                        <span style={{ color: ORANGE, fontSize: 10, marginTop: 4 }}>&#9679;</span>
                        <span style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.5 }}>{tip}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}              {/* Next button */}
          {phase === "success" && (
            <button onClick={nextSign} style={{ padding: "15px 40px", borderRadius: 99, border: "none", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", display: "flex", gap: 10, boxShadow: "0 0 30px rgba(34,197,94,0.55)" }}>
              {signIdx + 1 >= SIGNS.length ? "Finish" : "Next Sign"} <ArrowRight size={18} />
            </button>
          )}

          {/* Always-visible Skip button */}
          {phase === "predicting" && (
            <button
              onClick={skipSign}
              style={{
                padding: "10px 24px", borderRadius: 99, border: "2px solid #334155",
                background: "transparent", color: "#94a3b8",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700,
                transition: "all .2s",
              }}
              onMouseEnter={function (e) { e.currentTarget.style.borderColor = ORANGE; e.currentTarget.style.color = ORANGE; }}
              onMouseLeave={function (e) { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#94a3b8'; }}
            >
              <SkipForward size={16} />
              Skip "{targetSign}"
            </button>
          )}
        </section>

        {/* Right Panel: Camera */}
        <section style={{ flex: isMobile ? "0 0 auto" : "0 0 60%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: isMobile ? "24px 20px 100px" : "40px", gap: 20, position: "relative" }}>
          <div style={{ width: "100%", maxWidth: 580 }}>
            <div style={{ borderRadius: 24, overflow: "hidden", aspectRatio: "16/10", position: "relative", border: "2.5px solid " + camBorder, boxShadow: camGlow, background: "#000" }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", opacity: skeletonOnly ? 0 : 1, transition: "opacity 0.3s" }} />
              <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", transform: "scaleX(-1)", pointerEvents: "none", zIndex: 10 }} />

              {camPerm === "granted" && (
                <>
                  {/* Status badge */}
                  <div style={{ position: "absolute", top: 14, left: 14, display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 99, background: phase === "success" ? "rgba(34,197,94,0.22)" : "rgba(9,9,22,0.82)", backdropFilter: "blur(12px)", color: phase === "success" ? GREEN : "#f0f0ff", fontSize: 12, fontWeight: 700, zIndex: 20 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: phase === "success" ? GREEN : (isStuck ? ORANGE : ACCENT) }} />
                    {phase === "success" ? "Matched: " + targetSign : "Predicting: " + targetSign + " " + confidence + "%"}
                  </div>

                  {/* Hand detection warning */}
                  {phase === "predicting" && !handDetected && (
                    <div style={{ position: "absolute", top: 46, left: 14, display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 99, background: "rgba(249,115,22,0.2)", backdropFilter: "blur(12px)", color: ORANGE, fontSize: 11, fontWeight: 600, zIndex: 20 }}>
                      No hand detected - show your hand clearly
                    </div>
                  )}

                  {/* Stuck warning on camera */}
                  {isStuck && (
                    <div style={{ position: "absolute", bottom: 14, left: 14, right: 14, padding: "10px 16px", borderRadius: 16, background: "rgba(15,23,42,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(249,115,22,0.3)", zIndex: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <Lightbulb size={14} style={{ color: ORANGE }} />
                        <span style={{ color: ORANGE, fontSize: 12, fontWeight: 700 }}>Stuck? Here's a quick tip:</span>
                      </div>
                      <div style={{ color: "#cbd5e1", fontSize: 12, lineHeight: 1.5 }}>
                        {guide ? guide.tips[0] : "Try adjusting your hand position and lighting."}
                      </div>
                      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                        <button onClick={function () { setShowGuide(true); }} style={{ padding: "4px 12px", borderRadius: 99, border: "none", background: ACCENT, color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                          Show Full Guide
                        </button>
                        <button onClick={skipSign} style={{ padding: "4px 12px", borderRadius: 99, border: "1px solid #475569", background: "transparent", color: "#94a3b8", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                          Skip Letter
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Controls */}
                  <div style={{ position: "absolute", top: 14, right: 14, display: "flex", gap: 10, zIndex: 20 }}>
                    <button onClick={function () { setSkeletonOnly(!skeletonOnly); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 99, background: skeletonOnly ? "rgba(99,102,241,0.9)" : "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", border: "none", color: "#fff", cursor: "pointer" }}>
                      {skeletonOnly ? <EyeOff size={14} /> : <Eye size={14} />}
                      <span style={{ fontSize: 10, fontFamily: "DM Mono,monospace", fontWeight: 700 }}>{skeletonOnly ? "VIDEO HIDDEN" : "HIDE VIDEO"}</span>
                    </button>
                    <button onClick={function () { stopCamera(); setCamPerm("pending"); setPhase("idle"); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 99, background: "rgba(239,68,68,0.85)", backdropFilter: "blur(8px)", border: "none", color: "#fff", cursor: "pointer" }}>
                      <VideoOff size={14} />
                      <span style={{ fontSize: 10, fontFamily: "DM Mono,monospace", fontWeight: 700 }}>STOP</span>
                    </button>
                  </div>

                  {/* XP badge */}
                  {showXpBadge && (
                    <div style={{ position: "absolute", top: "45%", left: "50%", transform: "translate(-50%,-50%)", color: GREEN, fontWeight: 900, fontSize: 32, textShadow: "0 0 30px rgba(34,197,94,0.9)", pointerEvents: "none", zIndex: 20 }}>+10 XP</div>
                  )}
                </>
              )}

              {/* Camera placeholder */}
              {camPerm !== "granted" && camPerm !== "denied" && (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                  <Camera size={36} style={{ color: ACCENT, opacity: 0.45 }} />
                  <span style={{ color: "#94a3b8", fontSize: 14 }}>Camera will appear here</span>
                </div>
              )}
            </div>

            {/* Camera permission modal */}
            {camPerm === "pending" && (
              <div style={{ position: "absolute", inset: 0, zIndex: 30, background: "rgba(7,7,18,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                <div style={{ width: "100%", maxWidth: 380, background: "#1e293b", borderRadius: 28, padding: "40px 32px", textAlign: "center" }}>
                  <h3 style={{ color: "#f8fafc", fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Camera Access Needed</h3>
                  <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 16 }}>We use your camera to detect ISL hand signs in real time.</p>
                  <button onClick={grantCam} style={{ padding: "14px 0", width: "100%", borderRadius: 99, border: "none", background: "linear-gradient(135deg,#6366f1,#38bdf8)", color: "#fff", fontWeight: 800, cursor: "pointer" }}>Allow Camera Access</button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", padding: 20 }}>
          <div style={{ width: "100%", maxWidth: 400, background: "#1e293b", borderRadius: 20, border: "1px solid #334155", padding: "32px 28px", textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 99, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <X size={24} style={{ color: RED }} />
            </div>
            <h3 style={{ color: "#f8fafc", fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Exit Assessment?</h3>
            <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 8, lineHeight: 1.5 }}>
              You've completed {signIdx} of {SIGNS.length} signs.
            </p>
            <p style={{ color: "#64748b", fontSize: 13, marginBottom: 24 }}>
              Your progress will be submitted to the leaderboard before exiting.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={function () { setShowExitConfirm(false); }}
                style={{ padding: "12px 28px", borderRadius: 99, border: "2px solid #334155", background: "transparent", color: "#f8fafc", fontWeight: 700, cursor: "pointer", fontSize: 14 }}
              >
                Continue Assessment
              </button>
              <button
                onClick={function () {
                  submitToLeaderboard();
                  exitAssessment();
                }}
                style={{ padding: "12px 28px", borderRadius: 99, border: "none", background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14, boxShadow: "0 0 20px rgba(239,68,68,0.3)" }}
              >
                Exit & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

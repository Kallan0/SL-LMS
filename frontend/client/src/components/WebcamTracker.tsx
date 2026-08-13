/**
 * WebcamTracker.tsx
 *
 * Split-pane CV component:
 *   • Left pane  – mirrored <video> showing the raw webcam feed
 *   • Right pane – <canvas> overlay where the MediaPipe hand skeleton is drawn
 *
 * MediaPipe Tasks-Vision docs:
 *   https://developers.google.com/mediapipe/api/solutions/js/tasks-vision
 *
 * Install the peer dependency before use:
 *   pnpm add @mediapipe/tasks-vision
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  HandLandmarker,
  FilesetResolver,
  type HandLandmarkerResult,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Each hand has 21 landmarks, each with x / y / z → 63 floats per hand.
 * Two hands → 126 floats total. This matches the FastAPI LandmarkPayload schema.
 */
const LANDMARK_COUNT = 21;
const AXES           = 3;   // x, y, z
const MAX_HANDS      = 2;
const FLAT_ARRAY_LEN = LANDMARK_COUNT * AXES * MAX_HANDS; // 126

/** Finger connection pairs for skeleton drawing (MediaPipe standard topology). */
const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],           // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],           // Index
  [0, 9], [9, 10], [10, 11], [11, 12],      // Middle
  [0, 13], [13, 14], [14, 15], [15, 16],    // Ring
  [0, 17], [17, 18], [18, 19], [19, 20],    // Pinky
  [5, 9], [9, 13], [13, 17],                // Palm cross-links
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PredictionResult {
  predicted_label: string;
  confidence: number;
}

export interface WebcamTrackerProps {
  /** Called after each successful POST to FastAPI with the prediction result. */
  onPrediction?: (result: PredictionResult) => void;
  /** Mirror the webcam feed (default: true). */
  mirrored?: boolean;
  /** Desired capture width in pixels (default: 640). */
  captureWidth?: number;
  /** Desired capture height in pixels (default: 480). */
  captureHeight?: number;
  /** How often to send landmarks to FastAPI in ms (default: 200 → ~5 fps). */
  inferenceIntervalMs?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WebcamTracker({
  onPrediction,
  mirrored = true,
  captureWidth = 640,
  captureHeight = 480,
  inferenceIntervalMs = 200,
}: WebcamTrackerProps) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const landmarkerRef   = useRef<HandLandmarker | null>(null);
  const animFrameRef    = useRef<number>(0);
  const lastInferenceTs = useRef<number>(0);

  const [status, setStatus]   = useState<"initialising" | "ready" | "error">("initialising");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // ── 1. Initialise MediaPipe HandLandmarker ─────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function initMediaPipe() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          // CDN bundle – swap for a local copy in production to avoid network dependency
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: MAX_HANDS,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        if (cancelled) {
          landmarker.close();
          return;
        }

        landmarkerRef.current = landmarker;
        setStatus("ready");
      } catch (err) {
        if (!cancelled) {
          console.error("[WebcamTracker] MediaPipe init failed:", err);
          setErrorMsg(err instanceof Error ? err.message : String(err));
          setStatus("error");
        }
      }
    }

    initMediaPipe();
    return () => { cancelled = true; };
  }, []);

  // ── 2. Start webcam once MediaPipe is ready ────────────────────────────────

  useEffect(() => {
    if (status !== "ready") return;

    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: captureWidth, height: captureHeight, facingMode: "user" },
          audio: false,
        });

        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await video.play();

        // Sync canvas dimensions with actual video track
        const track    = stream.getVideoTracks()[0];
        const settings = track.getSettings();
        if (canvasRef.current) {
          canvasRef.current.width  = settings.width  ?? captureWidth;
          canvasRef.current.height = settings.height ?? captureHeight;
        }

        // Kick off the render loop
        animFrameRef.current = requestAnimationFrame(renderLoop);
      } catch (err) {
        console.error("[WebcamTracker] Camera access failed:", err);
        setErrorMsg("Camera access denied. Please allow camera permissions.");
        setStatus("error");
      }
    }

    startCamera();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      stream?.getTracks().forEach(t => t.stop());
    };
    // captureWidth / captureHeight intentionally omitted – only run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // ── 3. Per-frame render + landmark detection loop ─────────────────────────

  const renderLoop = useCallback((timestamp: number) => {
    animFrameRef.current = requestAnimationFrame(renderLoop);

    const video    = videoRef.current;
    const canvas   = canvasRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !canvas || !landmarker || video.readyState < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Run landmark detection
    const result: HandLandmarkerResult = landmarker.detectForVideo(video, timestamp);

    // Clear previous frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw skeleton for every detected hand
    result.landmarks.forEach(hand => {
      drawSkeleton(ctx, hand, canvas.width, canvas.height);
    });

    // Throttle FastAPI calls
    if (
      result.landmarks.length > 0 &&
      timestamp - lastInferenceTs.current >= inferenceIntervalMs
    ) {
      lastInferenceTs.current = timestamp;
      const flat = flattenLandmarks(result.landmarks);
      sendToFastAPI(flat).then(prediction => {
        if (prediction) onPrediction?.(prediction);
      });
    }
  }, [inferenceIntervalMs, onPrediction]);

  // ── 4. Helpers ────────────────────────────────────────────────────────────

  /**
   * Flatten up to 2 hands worth of MediaPipe NormalizedLandmarks into a
   * single Float32Array of exactly 126 values.
   *
   * • Coordinates are already normalised to [0, 1] by MediaPipe.
   * • If only 1 hand is detected, the second hand's 63 slots are zero-padded.
   */
  function flattenLandmarks(hands: NormalizedLandmark[][]): number[] {
    const flat = new Array<number>(FLAT_ARRAY_LEN).fill(0);

    for (let h = 0; h < Math.min(hands.length, MAX_HANDS); h++) {
      const hand   = hands[h];
      const offset = h * LANDMARK_COUNT * AXES;

      for (let lm = 0; lm < Math.min(hand.length, LANDMARK_COUNT); lm++) {
        const base = offset + lm * AXES;
        flat[base]     = hand[lm].x;
        flat[base + 1] = hand[lm].y;
        flat[base + 2] = hand[lm].z;
      }
    }

    return flat;
  }

  /**
   * Draw a coloured hand skeleton on the canvas overlay.
   * Joints are rendered as filled circles; connections as line segments.
   */
  function drawSkeleton(
    ctx: CanvasRenderingContext2D,
    landmarks: NormalizedLandmark[],
    w: number,
    h: number
  ) {
    // Draw connections
    ctx.strokeStyle = "rgba(99, 202, 183, 0.9)";
    ctx.lineWidth   = 2;

    for (const [a, b] of HAND_CONNECTIONS) {
      const lmA = landmarks[a];
      const lmB = landmarks[b];
      if (!lmA || !lmB) continue;

      ctx.beginPath();
      ctx.moveTo(lmA.x * w, lmA.y * h);
      ctx.lineTo(lmB.x * w, lmB.y * h);
      ctx.stroke();
    }

    // Draw landmark dots
    for (const lm of landmarks) {
      ctx.beginPath();
      ctx.arc(lm.x * w, lm.y * h, 4, 0, Math.PI * 2);
      ctx.fillStyle   = "rgba(255, 255, 255, 0.95)";
      ctx.strokeStyle = "rgba(99, 202, 183, 1)";
      ctx.lineWidth   = 1.5;
      ctx.fill();
      ctx.stroke();
    }
  }

  // ── 5. FastAPI integration ────────────────────────────────────────────────

  /**
   * sendToFastAPI
   *
   * Sends the 126-float landmark array to the FastAPI `/cv/predict` endpoint.
   * The JWT token is automatically attached by the api.ts interceptor, but
   * this function intentionally uses a direct fetch so the CV loop stays
   * decoupled from the higher-level API service layer.
   *
   * TODO once the backend is live:
   *   1. Remove the early-return stub.
   *   2. The `Authorization` header is added automatically via the api.ts
   *      interceptor if you route through `apiFetch`. If calling fetch()
   *      directly here, pull the token from localStorage manually:
   *
   *      const token = localStorage.getItem("sign_language_lms_token");
   *      headers: { Authorization: `Bearer ${token}` }
   */
  async function sendToFastAPI(landmarks: number[]): Promise<PredictionResult | null> {
    // ── STUB: remove this block when the backend is running ──
    console.debug("[WebcamTracker] sendToFastAPI (stub) – landmarks:", landmarks.length);
    return null;
    // ─────────────────────────────────────────────────────────

    /* eslint-disable no-unreachable */
    try {
      const token = localStorage.getItem(
        import.meta.env.VITE_JWT_STORAGE_KEY ?? "sign_language_lms_token"
      );

      const response = await fetch("http://127.0.0.1:8000/cv/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ landmarks }),
      });

      if (!response.ok) {
        console.error("[WebcamTracker] FastAPI error:", response.status);
        return null;
      }

      return (await response.json()) as PredictionResult;
    } catch (err) {
      console.error("[WebcamTracker] sendToFastAPI failed:", err);
      return null;
    }
    /* eslint-enable no-unreachable */
  }

  // ── 6. Render ─────────────────────────────────────────────────────────────

  if (status === "error") {
    return (
      <div className="flex items-center justify-center rounded-xl bg-destructive/10 border border-destructive/30 p-6 text-destructive text-sm">
        <span>⚠️ {errorMsg || "WebcamTracker failed to initialise."}</span>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-black">
      {/* Loading overlay */}
      {status === "initialising" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 text-white text-sm">
          Initialising hand tracking…
        </div>
      )}

      {/*
       * Webcam feed – mirrored via CSS transform so the user sees a
       * natural mirror image. The canvas overlay is NOT mirrored so that
       * landmark coordinates stay in the original (unflipped) MediaPipe space.
       */}
      <video
        ref={videoRef}
        className="block w-full"
        style={{ transform: mirrored ? "scaleX(-1)" : "none" }}
        muted
        playsInline
        aria-label="Webcam feed for sign language detection"
      />

      {/*
       * Canvas overlay – sits on top of the video in absolute position.
       * Landmark coordinates are drawn directly from MediaPipe output
       * (unmirrored) so the skeleton accurately tracks the hand geometry.
       */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      />

      {/* Status badge */}
      {status === "ready" && (
        <span className="absolute top-2 right-2 z-10 rounded-full bg-emerald-500/90 px-2 py-0.5 text-xs font-medium text-white">
          ● Live
        </span>
      )}
    </div>
  );
}

export default WebcamTracker;

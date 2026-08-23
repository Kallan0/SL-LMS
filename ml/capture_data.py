"""
capture_data.py
===============
Captures real hand landmarks from webcam using MediaPipe and saves them to CSV
for training/improving the ISL classifier.

Usage:
    python capture_data.py                  # interactive mode
    python capture_data.py --letter A       # capture letter A directly
    python capture_data.py --output my.csv  # custom output file

Controls:
    1. Select a letter (A-Z) to capture
    2. Show the ISL hand sign to the webcam
    3. Press SPACE to capture a frame
    4. Press ESC to exit or switch letters

Requirements:
    pip install opencv-python mediapipe numpy

Note: This script uses the 126-feature format (21 landmarks × 3 coords × 2 hands)
      matching the ML inference service schema.
"""

import os
import sys
import csv
import time
import argparse
import numpy as np

try:
    import cv2
except ImportError:
    print("Error: opencv-python is required. Install with: pip install opencv-python")
    sys.exit(1)

try:
    import mediapipe as mp
except ImportError:
    print("Error: mediapipe is required. Install with: pip install mediapipe")
    sys.exit(1)


# ── Constants ──────────────────────────────────────────────────────────────────

NUM_LANDMARKS = 21
COORDS_PER_LANDMARK = 3
NUM_HANDS = 2
FEATURES_PER_SAMPLE = NUM_LANDMARKS * COORDS_PER_LANDMARK * NUM_HANDS  # 126

LETTERS = list("ABCDEFGHIJKLMNOPQRSTUVWXYZ")

DEFAULT_OUTPUT = os.path.join(os.path.dirname(__file__), "data", "isl_captured.csv")


def flatten_landmarks(landmarks_list):
    """Flatten MediaPipe hand landmarks into a fixed-size array.
    
    Handles 0, 1, or 2 hands. If only one hand, the other hand's
    coordinates are zero-padded.
    """
    flat = np.zeros(FEATURES_PER_SAMPLE, dtype=np.float32)

    for h, hand_landmarks in enumerate(landmarks_list[:NUM_HANDS]):
        offset = h * NUM_LANDMARKS * COORDS_PER_LANDMARK
        for i, lm in enumerate(hand_landmarks.landmark):
            idx = offset + i * COORDS_PER_LANDMARK
            flat[idx] = lm.x
            flat[idx + 1] = lm.y
            flat[idx + 2] = lm.z

    return flat


def main():
    parser = argparse.ArgumentParser(description="Capture ISL hand landmarks from webcam")
    parser.add_argument("--letter", type=str, help="Letter to capture (A-Z)")
    parser.add_argument("--output", type=str, default=DEFAULT_OUTPUT, help="Output CSV path")
    parser.add_argument("--camera", type=int, default=0, help="Camera index")
    args = parser.parse_args()

    os.makedirs(os.path.dirname(args.output), exist_ok=True)

    # ── Initialize MediaPipe ───────────────────────────────────────────────────
    mp_hands = mp.solutions.hands
    mp_draw = mp.solutions.drawing_utils

    hands = mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=2,
        min_detection_confidence=0.6,
        min_tracking_confidence=0.5,
    )

    # ── Open camera ────────────────────────────────────────────────────────────
    cap = cv2.VideoCapture(args.camera)
    if not cap.isOpened():
        print(f"Error: Cannot open camera {args.camera}")
        sys.exit(1)

    print("=" * 60)
    print("ISL Hand Landmark Data Capture")
    print("=" * 60)
    print(f"Output: {args.output}")
    print(f"Features per sample: {FEATURES_PER_SAMPLE}")
    print()
    print("Controls:")
    print("  SPACE  — Capture current hand landmarks")
    print("  1-26   — Select letter (1=A, 2=B, ...)")
    print("  ESC    — Exit")
    print("=" * 60)

    # ── Count existing samples ─────────────────────────────────────────────────
    sample_counts = {l: 0 for l in LETTERS}
    if os.path.exists(args.output):
        with open(args.output, "r") as f:
            reader = csv.reader(f)
            next(reader, None)  # skip header
            for row in reader:
                if row and row[0] in sample_counts:
                    sample_counts[row[0]] += 1

    current_letter = args.letter.upper() if args.letter else None
    capturing = True

    try:
        while capturing:
            # ── Show letter selector if no letter chosen ────────────────────────
            if current_letter is None:
                frame = np.zeros((600, 800, 3), dtype=np.uint8)
                cv2.putText(frame, "SELECT LETTER TO CAPTURE", (150, 50),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

                for i, letter in enumerate(LETTERS):
                    row, col = divmod(i, 9)
                    x, y = 100 + col * 70, 120 + row * 80
                    color = (100, 200, 100) if sample_counts[letter] > 0 else (200, 200, 200)
                    cv2.putText(frame, f"{i+1}.{letter}", (x, y),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
                    if sample_counts[letter] > 0:
                        cv2.putText(frame, f"({sample_counts[letter]})", (x + 25, y + 25),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (150, 150, 150), 1)

                cv2.imshow("ISL Data Capture", frame)
                key = cv2.waitKey(0) & 0xFF

                if key == 27:  # ESC
                    break
                elif 49 <= key <= 57:  # 1-9
                    idx = key - 49
                    current_letter = LETTERS[idx]
                elif 97 <= key <= 110:  # a-n (maps to 1-14)
                    idx = key - 97 + 9
                    if idx < 26:
                        current_letter = LETTERS[idx]

                continue

            # ── Capture mode ───────────────────────────────────────────────────
            ret, frame = cap.read()
            if not ret:
                print("Error: Cannot read from camera")
                break

            # Mirror for natural interaction
            frame = cv2.flip(frame, 1)
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = hands.process(rgb)

            # Draw landmarks
            if results.multi_hand_landmarks:
                for hand_lm in results.multi_hand_landmarks:
                    mp_draw.draw_landmarks(frame, hand_lm, mp_hands.HAND_CONNECTIONS)

            # HUD overlay
            h, w, _ = frame.shape
            cv2.putText(frame, f"Letter: {current_letter}", (20, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 128), 2)
            cv2.putText(frame, f"Captures: {sample_counts[current_letter]}", (20, 80),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

            hands_detected = len(results.multi_hand_landmarks) if results.multi_hand_landmarks else 0
            status_color = (0, 255, 0) if hands_detected > 0 else (0, 0, 255)
            status_text = f"Hands: {hands_detected}/2"
            cv2.putText(frame, status_text, (w - 200, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, status_color, 2)

            # Instructions
            cv2.putText(frame, "SPACE=capture  ESC=back", (20, h - 20),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (150, 150, 150), 1)

            cv2.imshow("ISL Data Capture", frame)

            # ── Handle key input ───────────────────────────────────────────────
            key = cv2.waitKey(1) & 0xFF

            if key == 27:  # ESC — go back to letter selection
                current_letter = None
            elif key == 32:  # SPACE — capture
                if results.multi_hand_landmarks:
                    flat = flatten_landmarks(results.multi_hand_landmarks)
                    with open(args.output, "a", newline="") as f:
                        writer = csv.writer(f)
                        # Write header if file is new
                        if os.path.getsize(args.output) == 0:
                            header = ["label"] + [f"f{i}" for i in range(FEATURES_PER_SAMPLE)]
                            writer.writerow(header)
                        writer.writerow([current_letter] + flat.tolist())
                    sample_counts[current_letter] += 1
                    print(f"  Captured {current_letter} (total: {sample_counts[current_letter]})")
                else:
                    print("  No hands detected — try again")

    except KeyboardInterrupt:
        pass
    finally:
        cap.release()
        cv2.destroyAllWindows()
        hands.close()

    # ── Summary ────────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("CAPTURE COMPLETE")
    print("=" * 60)
    total = sum(sample_counts.values())
    print(f"Total samples captured: {total}")
    print(f"Output file: {args.output}")
    for letter in LETTERS:
        if sample_counts[letter] > 0:
            print(f"  {letter}: {sample_counts[letter]} samples")
    print("=" * 60)


if __name__ == "__main__":
    main()

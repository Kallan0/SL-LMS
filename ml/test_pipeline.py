"""
test_pipeline.py
================
End-to-end test of the ISL ML pipeline:
  1. Generate synthetic dataset
  2. Train model
  3. Load model and predict on samples
  4. Test API endpoints via HTTP
"""

import os
import sys
import csv
import json
import time
import subprocess
import signal
import numpy as np
import joblib

# ── Colours for terminal output ────────────────────────────────────────────────
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

passed = 0
failed = 0


def ok(msg):
    global passed
    passed += 1
    print(f"  {GREEN}PASS{RESET} {msg}")


def fail(msg, detail=""):
    global failed
    failed += 1
    print(f"  {RED}FAIL{RESET} {msg}")
    if detail:
        print(f"        {detail}")


def section(title):
    print(f"\n{BOLD}{CYAN}{'='*60}{RESET}")
    print(f"{BOLD}{CYAN}  {title}{RESET}")
    print(f"{BOLD}{CYAN}{'='*60}{RESET}")


# ══════════════════════════════════════════════════════════════════════════════
# TEST 1: Generate Dataset
# ══════════════════════════════════════════════════════════════════════════════

section("TEST 1: Generate Synthetic Dataset")

try:
    sys.path.insert(0, os.path.dirname(__file__))
    from generate_dataset import generate_dataset, LETTER_SHAPES, FEATURES_PER_SAMPLE

    # Check all 26 letters are defined
    expected_letters = set("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
    actual_letters = set(LETTER_SHAPES.keys())
    if expected_letters == actual_letters:
        ok(f"All 26 ISL letters defined in LETTER_SHAPES")
    else:
        missing = expected_letters - actual_letters
        fail(f"Missing letters in LETTER_SHAPES: {missing}")

    # Check each letter has 21 landmarks
    for letter, shape in LETTER_SHAPES.items():
        if len(shape) == 21:
            pass  # ok
        else:
            fail(f"Letter {letter} has {len(shape)} landmarks instead of 21")
            break
    else:
        ok(f"All 26 letters have exactly 21 landmarks")

    # Check features per sample is 126
    if FEATURES_PER_SAMPLE == 126:
        ok(f"Features per sample = {FEATURES_PER_SAMPLE} (correct)")
    else:
        fail(f"Features per sample = {FEATURES_PER_SAMPLE}, expected 126")

    # Generate dataset
    test_csv = os.path.join(os.path.dirname(__file__), "data", "test_dataset.csv")
    generate_dataset(test_csv, samples_per_letter=50)

    # Validate CSV
    with open(test_csv, "r") as f:
        reader = csv.reader(f)
        header = next(reader)
        rows = list(reader)

    if len(header) == 127:  # 1 label + 126 features
        ok(f"CSV has 127 columns (1 label + 126 features)")
    else:
        fail(f"CSV has {len(header)} columns, expected 127")

    if len(rows) == 1300:  # 26 letters × 50 samples
        ok(f"CSV has {len(rows)} rows (26 × 50 = 1300)")
    else:
        fail(f"CSV has {len(rows)} rows, expected 1300")

    # Check labels distribution
    labels = [row[0] for row in rows]
    from collections import Counter
    counts = Counter(labels)
    if all(c == 50 for c in counts.values()):
        ok(f"Balanced dataset: 50 samples per letter")
    else:
        fail(f"Unbalanced: {dict(counts)}")

    # Check feature values are in [0, 1]
    all_valid = True
    for row in rows[:100]:
        vals = [float(v) for v in row[1:]]
        if any(v < 0 or v > 1 for v in vals):
            all_valid = False
            break
    if all_valid:
        ok(f"Feature values are in [0, 1] range")
    else:
        fail(f"Feature values out of [0, 1] range")

    # Cleanup test CSV
    os.remove(test_csv)

except Exception as e:
    fail(f"Dataset generation failed: {e}")


# ══════════════════════════════════════════════════════════════════════════════
# TEST 2: Train Model
# ══════════════════════════════════════════════════════════════════════════════

section("TEST 2: Train Model")

try:
    from train_model import load_dataset, train

    csv_path = os.path.join(os.path.dirname(__file__), "data", "isl_landmarks.csv")
    if not os.path.exists(csv_path):
        generate_dataset(csv_path, samples_per_letter=300)

    X, y = load_dataset(csv_path)
    ok(f"Dataset loaded: {X.shape[0]} samples, {X.shape[1]} features")

    from sklearn.model_selection import train_test_split
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.preprocessing import LabelEncoder
    from sklearn.metrics import accuracy_score

    le = LabelEncoder()
    y_enc = le.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.2, random_state=42, stratify=y_enc
    )

    model = RandomForestClassifier(n_estimators=200, max_depth=30, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)

    train_acc = accuracy_score(y_train, model.predict(X_train))
    test_acc = accuracy_score(y_test, model.predict(X_test))

    ok(f"Model trained — Train: {train_acc:.2%}, Test: {test_acc:.2%}")

    if test_acc > 0.70:
        ok(f"Test accuracy above 70% threshold")
    else:
        fail(f"Test accuracy {test_acc:.2%} is below 70% threshold")

except Exception as e:
    fail(f"Training failed: {e}")


# ══════════════════════════════════════════════════════════════════════════════
# TEST 3: Model Save/Load (joblib + pickle)
# ══════════════════════════════════════════════════════════════════════════════

section("TEST 3: Model Save/Load")

import pickle

try:
    model_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(model_dir, exist_ok=True)

    # Save with joblib
    joblib_path = os.path.join(model_dir, "test_model.pkl")
    model_data = {
        "model": model,
        "label_encoder": le,
        "classes": le.classes_.tolist(),
        "n_features": X.shape[1],
    }
    joblib.dump(model_data, joblib_path)
    ok(f"Model saved with joblib ({os.path.getsize(joblib_path) / 1024:.1f} KB)")

    # Save with pickle
    pickle_path = os.path.join(model_dir, "test_model_pickle.pkl")
    with open(pickle_path, "wb") as f:
        pickle.dump(model_data, f, protocol=pickle.HIGHEST_PROTOCOL)
    ok(f"Model saved with pickle ({os.path.getsize(pickle_path) / 1024:.1f} KB)")

    # Load with joblib
    loaded_joblib = joblib.load(joblib_path)
    loaded_model_jl = loaded_joblib["model"]
    loaded_le_jl = loaded_joblib["label_encoder"]
    pred_jl = loaded_model_jl.predict(X_test[:5])
    labels_jl = loaded_le_jl.inverse_transform(pred_jl)
    ok(f"Joblib load + predict works — predicted: {list(labels_jl)}")

    # Load with pickle
    with open(pickle_path, "rb") as f:
        loaded_pickle = pickle.load(f)
    loaded_model_pk = loaded_pickle["model"]
    loaded_le_pk = loaded_pickle["label_encoder"]
    pred_pk = loaded_model_pk.predict(X_test[:5])
    labels_pk = loaded_le_pk.inverse_transform(pred_pk)
    ok(f"Pickle load + predict works — predicted: {list(labels_pk)}")

    # Both should produce same predictions
    if np.array_equal(pred_jl, pred_pk):
        ok(f"Joblib and pickle produce identical predictions")
    else:
        fail(f"Joblib and pickle predictions differ")

    # Cleanup test files
    os.remove(joblib_path)
    os.remove(pickle_path)

except Exception as e:
    fail(f"Save/load test failed: {e}")


# ══════════════════════════════════════════════════════════════════════════════
# TEST 4: Per-Letter Prediction
# ══════════════════════════════════════════════════════════════════════════════

section("TEST 4: Per-Letter Prediction Accuracy")

try:
    from generate_dataset import LETTER_SHAPES, _add_noise, _random_transform

    correct = 0
    total = 0
    letter_results = {}

    for letter in sorted(LETTER_SHAPES.keys()):
        shape = LETTER_SHAPES[letter]
        letter_correct = 0
        n_trials = 30

        for _ in range(n_trials):
            right_hand = _add_noise(shape)
            right_hand = _random_transform(right_hand)
            right_hand = np.clip(right_hand, 0.0, 1.0)
            left_hand = np.zeros(63, dtype=np.float32)
            sample = np.concatenate([right_hand, left_hand]).reshape(1, -1)

            pred = model.predict(sample)[0]
            true_idx = le.transform([letter])[0]
            if pred == true_idx:
                letter_correct += 1
            total += 1

        acc = letter_correct / n_trials
        letter_results[letter] = acc
        correct += letter_correct

    overall = correct / total
    ok(f"Overall prediction accuracy: {overall:.2%} ({correct}/{total})")

    # Report per-letter
    for letter in sorted(letter_results.keys()):
        acc = letter_results[letter]
        status = GREEN if acc >= 0.8 else (YELLOW if acc >= 0.5 else RED)
        print(f"    {status}{letter}: {acc:.0%}{RESET}")

except Exception as e:
    fail(f"Per-letter test failed: {e}")


# ══════════════════════════════════════════════════════════════════════════════
# TEST 5: FastAPI Endpoint Test
# ══════════════════════════════════════════════════════════════════════════════

section("TEST 5: FastAPI Endpoint Test")

try:
    import urllib.request
    import urllib.error

    ML_PORT = 8001
    ML_URL = f"http://127.0.0.1:{ML_PORT}"

    # Check if server is already running
    server_running = False
    try:
        req = urllib.request.urlopen(f"{ML_URL}/health", timeout=2)
        server_running = True
    except:
        pass

    if not server_running:
        # Start the server
        ml_dir = os.path.dirname(__file__)
        proc = subprocess.Popen(
            [sys.executable, "main.py"],
            cwd=ml_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        # Wait for server to start
        for _ in range(15):
            time.sleep(1)
            try:
                urllib.request.urlopen(f"{ML_URL}/health", timeout=2)
                server_running = True
                break
            except:
                continue

        if not server_running:
            fail(f"Could not start FastAPI server on port {ML_PORT}")
            proc.kill()
    else:
        proc = None
        ok(f"FastAPI server already running on port {ML_PORT}")

    if server_running:
        # Test health endpoint
        try:
            resp = urllib.request.urlopen(f"{ML_URL}/health", timeout=5)
            data = json.loads(resp.read())
            if data.get("status") == "ok":
                ok(f"GET /health → status: ok, model_loaded: {data.get('model_loaded')}")
            else:
                fail(f"GET /health unexpected response: {data}")
        except Exception as e:
            fail(f"GET /health failed: {e}")

        # Test /cv/predict
        try:
            test_landmarks = np.random.rand(126).tolist()
            payload = json.dumps({"landmarks": test_landmarks}).encode()
            req = urllib.request.Request(
                f"{ML_URL}/cv/predict",
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            resp = urllib.request.urlopen(req, timeout=10)
            data = json.loads(resp.read())
            if "predicted_label" in data and "confidence" in data:
                ok(f"POST /cv/predict → label: {data['predicted_label']}, confidence: {data['confidence']}")
            else:
                fail(f"POST /cv/predict unexpected response: {data}")
        except Exception as e:
            fail(f"POST /cv/predict failed: {e}")

        # Test /verify-sign
        try:
            test_landmarks = np.random.rand(126).tolist()
            payload = json.dumps({"target_sign": "A", "features": test_landmarks}).encode()
            req = urllib.request.Request(
                f"{ML_URL}/verify-sign",
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            resp = urllib.request.urlopen(req, timeout=10)
            data = json.loads(resp.read())
            expected_fields = ["target_sign", "ai_prediction", "confidence", "is_correct", "message", "xp_awarded"]
            if all(f in data for f in expected_fields):
                ok(f"POST /verify-sign → prediction: {data['ai_prediction']}, correct: {data['is_correct']}")
            else:
                fail(f"POST /verify-sign missing fields: {data}")
        except Exception as e:
            fail(f"POST /verify-sign failed: {e}")

        # Stop server if we started it
        if proc:
            proc.terminate()
            proc.wait(timeout=5)
            ok("Server stopped cleanly")

except Exception as e:
    fail(f"API test failed: {e}")


# ══════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ══════════════════════════════════════════════════════════════════════════════

print(f"\n{BOLD}{'='*60}{RESET}")
print(f"{BOLD}  TEST SUMMARY{RESET}")
print(f"{'='*60}")
print(f"  {GREEN}Passed: {passed}{RESET}")
print(f"  {RED}Failed: {failed}{RESET}")
print(f"  Total:  {passed + failed}")
print(f"{'='*60}")

if failed == 0:
    print(f"\n{GREEN}{BOLD}ALL TESTS PASSED{RESET}\n")
else:
    print(f"\n{RED}{BOLD}SOME TESTS FAILED{RESET}\n")

sys.exit(0 if failed == 0 else 1)

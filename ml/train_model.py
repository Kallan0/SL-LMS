"""
train_model.py
==============
Trains a Random Forest classifier on the ISL hand landmark dataset and saves
the model using both joblib and pickle for maximum compatibility.

Usage:
    python train_model.py                  # uses default dataset path
    python train_model.py --data path.csv  # custom dataset path

Outputs:
    models/sign_classifier.pkl   (joblib — used by main.py)
    models/sign_classifier_pickle.pkl (pickle — backup/alternate format)
"""

import os
import argparse
import pickle
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.preprocessing import LabelEncoder
from generate_dataset import generate_dataset


def load_dataset(csv_path: str):
    """Load the CSV dataset into X (features) and y (labels)."""
    import csv

    X, y = [], []
    with open(csv_path, "r") as f:
        reader = csv.reader(f)
        header = next(reader)  # skip header
        for row in reader:
            if len(row) < 2:
                continue
            label = row[0]
            features = [float(v) for v in row[1:]]
            X.append(features)
            y.append(label)

    return np.array(X, dtype=np.float32), np.array(y)


def train(csv_path: str = None, model_dir: str = None):
    """Full training pipeline."""
    if csv_path is None:
        csv_path = os.path.join(os.path.dirname(__file__), "data", "isl_landmarks.csv")
    if model_dir is None:
        model_dir = os.path.join(os.path.dirname(__file__), "models")

    os.makedirs(model_dir, exist_ok=True)

    # ── Generate dataset if it doesn't exist ──────────────────────────────────
    if not os.path.exists(csv_path):
        print("Dataset not found. Generating synthetic ISL dataset...")
        csv_path = generate_dataset(csv_path)

    # ── Load data ──────────────────────────────────────────────────────────────
    print(f"\nLoading dataset from {csv_path}...")
    X, y = load_dataset(csv_path)
    print(f"Loaded {len(X)} samples across {len(np.unique(y))} classes")
    print(f"Feature shape: {X.shape}")

    # ── Encode labels ──────────────────────────────────────────────────────────
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    class_names = le.classes_
    print(f"Classes: {', '.join(class_names)}")

    # ── Train/test split ───────────────────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    print(f"\nTrain: {len(X_train)} samples | Test: {len(X_test)} samples")

    # ── Train Random Forest ────────────────────────────────────────────────────
    print("\nTraining Random Forest classifier...")
    rf_model = RandomForestClassifier(
        n_estimators=200,
        max_depth=30,
        min_samples_split=5,
        min_samples_leaf=2,
        max_features="sqrt",
        random_state=42,
        n_jobs=-1,
        class_weight="balanced",
    )
    rf_model.fit(X_train, y_train)

    # ── Evaluate ───────────────────────────────────────────────────────────────
    train_acc = rf_model.score(X_train, y_train)
    test_acc = rf_model.score(X_test, y_test)
    print(f"\nRandom Forest Results:")
    print(f"  Train Accuracy: {train_acc:.4f}")
    print(f"  Test Accuracy:  {test_acc:.4f}")

    # Cross-validation
    print("\nRunning 5-fold cross-validation...")
    cv_scores = cross_val_score(rf_model, X, y_encoded, cv=5, n_jobs=-1)
    print(f"  CV Mean Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

    # Classification report
    y_pred = rf_model.predict(X_test)
    print(f"\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=class_names))

    # ── Feature importance ─────────────────────────────────────────────────────
    importances = rf_model.feature_importances_
    top_k = 10
    top_indices = np.argsort(importances)[::-1][:top_k]
    print(f"\nTop {top_k} most important features:")
    for i, idx in enumerate(top_indices):
        hand = "Right" if idx < 63 else "Left"
        lm_idx = (idx % 63) // 3
        coord = ["x", "y", "z"][idx % 3]
        print(f"  {i+1}. Feature {idx}: {hand} hand landmark {lm_idx} ({coord}) — importance: {importances[idx]:.4f}")

    # ── Save model with joblib ─────────────────────────────────────────────────
    joblib_path = os.path.join(model_dir, "sign_classifier.pkl")
    model_data = {
        "model": rf_model,
        "label_encoder": le,
        "classes": class_names.tolist(),
        "n_features": X.shape[1],
        "train_accuracy": float(train_acc),
        "test_accuracy": float(test_acc),
        "cv_mean_accuracy": float(cv_scores.mean()),
    }
    joblib.dump(model_data, joblib_path)
    print(f"\nModel saved (joblib): {joblib_path}")
    print(f"  File size: {os.path.getsize(joblib_path) / 1024:.1f} KB")

    # ── Save model with pickle (backup) ────────────────────────────────────────
    pickle_path = os.path.join(model_dir, "sign_classifier_pickle.pkl")
    with open(pickle_path, "wb") as f:
        pickle.dump(model_data, f, protocol=pickle.HIGHEST_PROTOCOL)
    print(f"Model saved (pickle): {pickle_path}")
    print(f"  File size: {os.path.getsize(pickle_path) / 1024:.1f} KB")

    # ── Summary ────────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("TRAINING COMPLETE")
    print("=" * 60)
    print(f"  Letters: {len(class_names)} ({', '.join(class_names)})")
    print(f"  Total samples: {len(X)}")
    print(f"  Features: {X.shape[1]}")
    print(f"  Test Accuracy: {test_acc:.2%}")
    print(f"  CV Accuracy: {cv_scores.mean():.2%}")
    print(f"  Joblib model: {joblib_path}")
    print(f"  Pickle model: {pickle_path}")
    print("=" * 60)

    return rf_model, le


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train ISL hand landmark classifier")
    parser.add_argument("--data", type=str, help="Path to CSV dataset")
    parser.add_argument("--model-dir", type=str, help="Directory to save models")
    args = parser.parse_args()

    train(csv_path=args.data, model_dir=args.model_dir)

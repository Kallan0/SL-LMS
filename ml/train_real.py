"""
train_real.py
=============
Trains a classifier on the real ISL CSV pixel dataset.
Uses PCA to reduce 10,000 features to ~150 principal components for speed.

Dataset: 100x100 grayscale images, 26 classes (A-Z)
  - train_ISL.csv: 10,114 samples
  - test_ISL.csv: 2,522 samples

Outputs:
  models/isl_classifier.pkl   (joblib — primary model)
  models/isl_classifier_pickle.pkl (pickle backup)
"""

import os
import csv
import pickle
import time
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score
from sklearn.metrics import classification_report
from sklearn.preprocessing import LabelEncoder
from sklearn.decomposition import PCA
from sklearn.pipeline import Pipeline
from sklearn.neural_network import MLPClassifier

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
TRAIN_CSV = os.path.join(DATA_DIR, "train_ISL.csv")
TEST_CSV = os.path.join(DATA_DIR, "test_ISL.csv")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")


def load_csv(path):
    X, y = [], []
    with open(path, "r") as f:
        reader = csv.reader(f)
        header = next(reader)
        for row in reader:
            if len(row) < 2:
                continue
            label = row[0].strip()
            features = [float(v) for v in row[1:]]
            X.append(features)
            y.append(label)
    return np.array(X, dtype=np.float32), np.array(y)


def train():
    os.makedirs(MODEL_DIR, exist_ok=True)
    t0 = time.time()

    # Load data
    print(f"Loading training data from {TRAIN_CSV}...")
    X_train, y_train = load_csv(TRAIN_CSV)
    print(f"  Train: {len(X_train)} samples, {X_train.shape[1]} features")

    print(f"Loading test data from {TEST_CSV}...")
    X_test, y_test = load_csv(TEST_CSV)
    print(f"  Test: {len(X_test)} samples, {X_test.shape[1]} features")

    # Normalize pixel values
    X_train = X_train / 255.0
    X_test = X_test / 255.0

    # Encode labels
    le = LabelEncoder()
    y_train_enc = le.fit_transform(y_train)
    y_test_enc = le.transform(y_test)
    class_names = le.classes_
    print(f"\nClasses ({len(class_names)}): {', '.join(class_names)}")

    # ── PCA + Random Forest Pipeline ────────────────────────────────────────
    print("\n--- Training PCA + Random Forest Pipeline ---")
    print("  Fitting PCA (10000 -> 150 components)...")
    pca = PCA(n_components=150, random_state=42, whiten=True)
    X_train_pca = pca.fit_transform(X_train)
    X_test_pca = pca.transform(X_test)
    explained = pca.explained_variance_ratio_.sum()
    print(f"  PCA explained variance: {explained:.3f}")
    print(f"  Reduced features: {X_train_pca.shape[1]}")

    print("  Training Random Forest (300 trees)...")
    rf = RandomForestClassifier(
        n_estimators=300,
        max_depth=None,
        min_samples_split=5,
        min_samples_leaf=2,
        max_features="sqrt",
        random_state=42,
        n_jobs=-1,
        class_weight="balanced",
    )
    rf.fit(X_train_pca, y_train_enc)

    rf_train_acc = rf.score(X_train_pca, y_train_enc)
    rf_test_acc = rf.score(X_test_pca, y_test_enc)
    print(f"  Train Accuracy: {rf_train_acc:.4f}")
    print(f"  Test Accuracy:  {rf_test_acc:.4f}")

    # ── MLP Neural Network ──────────────────────────────────────────────────
    print("\n--- Training MLP Neural Network (on PCA features) ---")
    mlp = MLPClassifier(
        hidden_layer_sizes=(256, 128, 64),
        activation="relu",
        solver="adam",
        max_iter=200,
        random_state=42,
        early_stopping=True,
        validation_fraction=0.1,
        batch_size=128,
        learning_rate="adaptive",
    )
    mlp.fit(X_train_pca, y_train_enc)

    mlp_train_acc = mlp.score(X_train_pca, y_train_enc)
    mlp_test_acc = mlp.score(X_test_pca, y_test_enc)
    print(f"  Train Accuracy: {mlp_train_acc:.4f}")
    print(f"  Test Accuracy:  {mlp_test_acc:.4f}")

    # Classification report for best
    if mlp_test_acc >= rf_test_acc:
        best_model, best_name, best_acc = mlp, "MLP+PCA", mlp_test_acc
        y_pred = mlp.predict(X_test_pca)
    else:
        best_model, best_name, best_acc = rf, "RF+PCA", rf_test_acc
        y_pred = rf.predict(X_test_pca)

    print(f"\nClassification Report ({best_name}):")
    print(classification_report(y_test_enc, y_pred, target_names=class_names))

    # ── Save model bundle (PCA + classifier) ────────────────────────────────
    model_data = {
        "model": best_model,
        "pca": pca,
        "label_encoder": le,
        "classes": class_names.tolist(),
        "n_features": int(X_train.shape[1]),
        "n_components": 150,
        "model_type": best_name,
        "test_accuracy": float(best_acc),
    }

    joblib_path = os.path.join(MODEL_DIR, "isl_classifier.pkl")
    joblib.dump(model_data, joblib_path)
    print(f"\nSaved (joblib): {joblib_path} ({os.path.getsize(joblib_path) / 1024:.0f} KB)")

    pickle_path = os.path.join(MODEL_DIR, "isl_classifier_pickle.pkl")
    with open(pickle_path, "wb") as f:
        pickle.dump(model_data, f, protocol=pickle.HIGHEST_PROTOCOL)
    print(f"Saved (pickle): {pickle_path} ({os.path.getsize(pickle_path) / 1024:.0f} KB)")

    # ── Sanity check ────────────────────────────────────────────────────────
    print("\n--- Sanity Check ---")
    loaded = joblib.load(joblib_path)
    model_l = loaded["model"]
    pca_l = loaded["pca"]
    le_l = loaded["label_encoder"]

    test_sample = X_test[0:1]
    test_pca = pca_l.transform(test_sample)
    pred = model_l.predict(test_pca)[0]
    proba = model_l.predict_proba(test_pca)[0]
    label = le_l.inverse_transform([pred])[0]
    conf = float(np.max(proba))
    print(f"  Sample 0: true={y_test[0]}, predicted={label}, confidence={conf:.3f}")

    elapsed = time.time() - t0
    print(f"\n{'=' * 60}")
    print(f"TRAINING COMPLETE ({elapsed:.1f}s)")
    print(f"  Model: {best_name}")
    print(f"  Test Accuracy: {best_acc:.2%}")
    print(f"  Features: {X_train.shape[1]} -> {150} (PCA)")
    print(f"  Classes: {len(class_names)}")
    print(f"  Joblib: {joblib_path}")
    print(f"{'=' * 60}")

    return best_model, le


if __name__ == "__main__":
    train()

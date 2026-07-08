import os
import io
import time
import logging
import numpy as np
import cv2
from PIL import Image
import tensorflow as tf
from flask import Flask, request, jsonify
from flask_cors import CORS

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
tf.get_logger().setLevel("ERROR")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
log = logging.getLogger("model-api")

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.environ.get("MODEL_PATH", "model.keras")
DR_LABELS = {0: "No DR", 1: "Mild", 2: "Moderate", 3: "Severe", 4: "Proliferative DR"}

model = None
model_load_seconds = None


def load_model():
    global model, model_load_seconds
    log.info("Loading model from: %s", MODEL_PATH)
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
    t0 = time.time()
    model = tf.keras.models.load_model(MODEL_PATH, compile=False)
    model_load_seconds = time.time() - t0
    log.info("Model loaded successfully in %.1fs. input_shape=%s", model_load_seconds, model.input_shape)


def preprocess(image_bytes):
    """Matches the preprocessing the model was trained/repaired against:
    resize -> LAB CLAHE -> Gaussian blur -> /255 -> ImageNet mean/std normalize.
    The model is a 3-branch ensemble (input_1/2/3) that all take the same image.
    """
    img = np.array(Image.open(io.BytesIO(image_bytes)).convert("RGB"))
    target_size = model.input_shape[0][1:3]
    img = cv2.resize(img, (target_size[1], target_size[0]))

    lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    lab[:, :, 0] = clahe.apply(lab[:, :, 0])
    img = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)

    img = cv2.GaussianBlur(img, (5, 5), 0)
    img = img.astype(np.float32) / 255.0
    img = (img - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
    img = np.expand_dims(img, axis=0)
    return [img, img, img]


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok" if model is not None else "model_not_loaded",
        "model_load_seconds": model_load_seconds,
    })


@app.route("/predict", methods=["POST"])
def predict():
    if model is None:
        return jsonify({"error": "Model is not loaded yet. Check /health."}), 503

    file = request.files.get("image") or request.files.get("file")
    if file is None:
        return jsonify({"error": "No image provided. Send multipart/form-data with field 'image'."}), 400

    try:
        inputs = preprocess(file.read())
        preds = model.predict(inputs, verbose=0)[0]
    except Exception as e:
        log.exception("Prediction failed")
        return jsonify({"error": f"Prediction failed: {e}"}), 500

    predicted_class = int(np.argmax(preds))
    return jsonify({
        "class": DR_LABELS.get(predicted_class, "Unknown"),
        "confidence": {str(i): float(p) for i, p in enumerate(preds)},
    })


load_model()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 7860)))

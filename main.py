# pip install fastapi uvicorn pydantic joblib pandas numpy scikit-learn
# pip install groq pdfplumber python-dotenv
# uvicorn main:app --host 0.0.0.0 --port 8000 --reload

import os
import logging
import re
from pathlib import Path
from typing import Any, Dict, List

import joblib
import numpy as np
import pandas as pd
import pdfplumber
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    # Validate hour as a 24-hour clock value.
    hour: int = Field(ge=0, le=23)
    # Temperature is expected in Celsius.
    temp: float
    # One-hour rain amount in millimeters.
    rain_1h: float
    # One-hour snow amount in millimeters.
    snow_1h: float
    # Cloud coverage percentage.
    clouds_all: int = Field(ge=0, le=100)
    # Main weather label, such as Clouds, Rain, or Clear.
    weather_condition: str
    # Calendar day of month.
    day: int = Field(ge=1, le=31)
    # Calendar month.
    month: int = Field(ge=1, le=12)
    # Day of week where Monday is 0 and Sunday is 6.
    day_of_week: int = Field(ge=0, le=6)


class PredictionResponse(BaseModel):
    predicted_volume: int
    traffic_level: str
    traffic_emoji: str
    confidence: str


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


# Create the FastAPI application instance.
app = FastAPI(title="SmartTraffic AI API", version="1.0.0")

# Enable CORS for all origins so Expo Go can call the API from a phone.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store model artifacts globally after startup so they are not reloaded per request.
rf_tuned = None
model_features: List[str] = []
encoding_map: Any = None
scaler = None
TRAFFIC_LAW_TEXT = ""
TRAFFIC_LAW_CHUNKS: List[str] = []
groq_client = None
CHAT_MODEL = "llama-3.1-8b-instant"
CHATBOT_FALLBACK_REPLY = "Sorry, I could not process your request. Please try again."

# Keep the published validation metric in one place for health and responses.
R2_SCORE = 0.9646

# Resolve artifacts from the same folder as this file, regardless of launch directory.
BASE_DIR = Path(__file__).resolve().parent
CHATBOT_ENV_PATH = BASE_DIR / "SmartTrafficAI" / "Chatbot" / ".env"
PDF_PATH = BASE_DIR / "SmartTrafficAI" / "Chatbot" / "Data" / "Bangladesh_Traffic_Law_Complete.pdf"
logger = logging.getLogger(__name__)


def build_text_chunks(text: str, max_chars: int = 1800) -> List[str]:
    """Split the PDF text into retrieval-sized chunks for chat prompts."""

    paragraphs = [part.strip() for part in re.split(r"\n\s*\n", text) if part.strip()]
    chunks: List[str] = []
    current_chunk = ""

    for paragraph in paragraphs:
        if not current_chunk:
            current_chunk = paragraph
        elif len(current_chunk) + len(paragraph) + 2 <= max_chars:
            current_chunk = f"{current_chunk}\n\n{paragraph}"
        else:
            chunks.append(current_chunk)
            current_chunk = paragraph

    if current_chunk:
        chunks.append(current_chunk)

    return chunks or [text]


def retrieve_law_context(question: str, top_k: int = 4) -> str:
    """Return the most relevant law text chunks for the user's question."""

    query_terms = {
        term
        for term in re.findall(r"[a-zA-Z0-9]+", question.lower())
        if len(term) > 2
    }

    if not query_terms:
        return "\n\n".join(TRAFFIC_LAW_CHUNKS[:top_k])

    scored_chunks = []
    for chunk in TRAFFIC_LAW_CHUNKS:
        chunk_terms = set(re.findall(r"[a-zA-Z0-9]+", chunk.lower()))
        score = len(query_terms & chunk_terms)
        if score > 0:
            scored_chunks.append((score, chunk))

    if not scored_chunks:
        return "\n\n".join(TRAFFIC_LAW_CHUNKS[:top_k])

    scored_chunks.sort(key=lambda item: item[0], reverse=True)
    return "\n\n---\n\n".join(chunk for _, chunk in scored_chunks[:top_k])


@app.on_event("startup")
def load_models() -> None:
    """Load all serialized model artifacts exactly once when the API starts."""

    global rf_tuned, model_features, encoding_map, scaler, TRAFFIC_LAW_TEXT, TRAFFIC_LAW_CHUNKS, groq_client

    # Load the trained Random Forest model.
    rf_tuned = joblib.load(BASE_DIR / "traffic_model.pkl")

    # Load the training feature column names.
    loaded_features = joblib.load(BASE_DIR / "model_features.pkl")

    # Load one-hot encoding metadata for compatibility with the training pipeline.
    encoding_map = joblib.load(BASE_DIR / "encoding_map.pkl")

    # Load the scaler artifact so all training artifacts are available at runtime.
    scaler = joblib.load(BASE_DIR / "scaler.pkl")

    # Normalize model_features to a plain list so DataFrame ordering is reliable.
    if hasattr(loaded_features, "tolist"):
        model_features = loaded_features.tolist()
    else:
        model_features = list(loaded_features)

    # Load chatbot environment and legal reference text once at startup.
    load_dotenv(CHATBOT_ENV_PATH)

    extracted_pages = []
    with pdfplumber.open(PDF_PATH) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                extracted_pages.append(page_text)

    TRAFFIC_LAW_TEXT = "\n\n".join(extracted_pages)
    TRAFFIC_LAW_CHUNKS = build_text_chunks(TRAFFIC_LAW_TEXT)
    groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


@app.get("/health")
def health() -> Dict[str, Any]:
    """Return API and model health details for the mobile app."""

    return {
        "status": "ok",
        "model": "Random Forest",
        "r2": R2_SCORE,
        "chatbot": "active",
        "chat_model": CHAT_MODEL,
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """Answer Bangladesh traffic law questions using the bundled PDF reference."""

    try:
        if groq_client is None or not TRAFFIC_LAW_TEXT:
            raise RuntimeError("Chatbot is not ready.")

        relevant_context = retrieve_law_context(request.message)
        system_prompt = (
            "You are a warm, natural Bangladesh traffic law expert assistant "
            "embedded in a Smart City Traffic app. Talk like a helpful real "
            "human, but stay accurate and concise. Answer ONLY questions related "
            "to Bangladesh traffic laws, fines, rules, penalties, licences, and "
            "road safety. If the question is not related to Bangladesh traffic "
            "laws, politely say exactly: 'I can only help with Bangladesh traffic "
            "law questions. Please ask me about traffic rules, fines, or road "
            "safety.' Always mention specific fine amounts and law sections when "
            "they are present in the legal reference. If the reference does not "
            "contain the exact amount or section, say that clearly. Keep answers "
            "under 150 words.\n\nLegal reference excerpts:\n\n"
            + relevant_context
        )

        completion = groq_client.chat.completions.create(
            model=CHAT_MODEL,
            max_tokens=300,
            temperature=0.3,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message},
            ],
        )

        response_text = completion.choices[0].message.content.strip()
        return ChatResponse(reply=response_text or CHATBOT_FALLBACK_REPLY)

    except Exception as exc:
        logger.exception("Chatbot request failed: %s", exc)
        return ChatResponse(reply=CHATBOT_FALLBACK_REPLY)


@app.post("/predict", response_model=PredictionResponse)
def predict(payload: PredictionRequest) -> PredictionResponse:
    """Predict traffic volume from weather and time inputs."""

    try:
        # Confirm startup completed before handling a prediction request.
        if rf_tuned is None or not model_features:
            raise RuntimeError("Model artifacts are not loaded.")

        # Start with every expected training feature set to zero.
        input_row = {feature: 0.0 for feature in model_features}

        # Set numeric values that came directly from the request body.
        numeric_values = {
            "hour": payload.hour,
            "temp": payload.temp,
            "rain_1h": payload.rain_1h,
            "snow_1h": payload.snow_1h,
            "clouds_all": payload.clouds_all,
            "day": payload.day,
            "month": payload.month,
            "day_of_week": payload.day_of_week,
        }

        # Copy only numeric fields that exist in the trained feature list.
        for column, value in numeric_values.items():
            if column in input_row:
                input_row[column] = float(value)

        # Activate the matching one-hot weather column when the model expects it.
        weather_condition = payload.weather_condition.strip()
        weather_column = f"weather_main_{weather_condition}"
        if weather_column in input_row:
            input_row[weather_column] = 1.0

        # Build a one-row DataFrame in the exact trained column order.
        input_df = pd.DataFrame([input_row], columns=model_features)

        # Ensure the row contains only finite numeric values before prediction.
        input_df = input_df.apply(pd.to_numeric, errors="coerce")
        input_df = input_df.replace([np.inf, -np.inf], np.nan).fillna(0.0)

        # Run the trained Random Forest model and coerce the result to an integer.
        predicted_volume = int(round(float(rf_tuned.predict(input_df)[0])))

        # Convert the predicted vehicle volume into a human-readable traffic level.
        if predicted_volume < 2000:
            traffic_level = "Low Traffic"
            traffic_emoji = "🟢"
        elif predicted_volume < 4000:
            traffic_level = "Medium Traffic"
            traffic_emoji = "🟡"
        else:
            traffic_level = "High Traffic"
            traffic_emoji = "🔴"

        # Return the prediction payload consumed by the React Native app.
        return PredictionResponse(
            predicted_volume=predicted_volume,
            traffic_level=traffic_level,
            traffic_emoji=traffic_emoji,
            confidence=f"{R2_SCORE * 100:.2f}%",
        )

    except Exception as exc:
        # Surface prediction failures as HTTP 500 details for easier debugging.
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

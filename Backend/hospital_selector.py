"""
hospital_selector.py — SmartEVP+ Intelligent Hospital Selection
================================================================
Finds nearby hospitals for a given patient location and uses Gemini
(primary) or Gemma via Ollama (fallback) to rank them by suitability
for the specific emergency case.

Used by app.py when a new dispatch case is created.
"""

import json
import logging
import math
import requests
import time
from typing import Optional

from config import Config

logger = logging.getLogger("SmartEVP.HospitalSelector")

# ── Bengaluru Hospital Database ───────────────────────────────────────────
# Real hospitals with actual coordinates and specialties
HOSPITALS_DB = [
    {
        "id": "H001",
        "name": "Jayadeva Institute of Cardiovascular Sciences",
        "short_name": "Jayadeva",
        "lat": 12.9318, "lng": 77.6177,
        "specialties": ["cardiology", "cardiac surgery", "cath lab", "heart failure", "interventional cardiology"],
        "type": "Government",
        "beds_icu": 40,
        "beds_general": 500,
        "trauma_center": False,
        "highlights": "Premier cardiac centre in South India. 24/7 cath lab.",
    },
    {
        "id": "H002",
        "name": "NIMHANS",
        "short_name": "NIMHANS",
        "lat": 12.9430, "lng": 77.5968,
        "specialties": ["neurology", "neurosurgery", "psychiatry", "neuro-rehabilitation"],
        "type": "Government",
        "beds_icu": 60,
        "beds_general": 900,
        "trauma_center": False,
        "highlights": "National centre for neurology and mental health.",
    },
    {
        "id": "H003",
        "name": "St. John's Medical College Hospital",
        "short_name": "St. John's",
        "lat": 12.9284, "lng": 77.6210,
        "specialties": ["general medicine", "trauma", "cardiology", "orthopedics", "pediatrics", "obstetrics"],
        "type": "Private",
        "beds_icu": 35,
        "beds_general": 1250,
        "trauma_center": True,
        "highlights": "Level-1 trauma centre. 24/7 emergency. All specialties.",
    },
    {
        "id": "H004",
        "name": "Manipal Hospital, Old Airport Road",
        "short_name": "Manipal OAR",
        "lat": 12.9599, "lng": 77.6491,
        "specialties": ["cardiology", "oncology", "orthopedics", "neurology", "transplant", "trauma"],
        "type": "Private",
        "beds_icu": 80,
        "beds_general": 600,
        "trauma_center": True,
        "highlights": "Comprehensive multi-specialty. Strong cardiac and transplant.",
    },
    {
        "id": "H005",
        "name": "Fortis Hospital, Bannerghatta Road",
        "short_name": "Fortis BG Road",
        "lat": 12.8800, "lng": 77.5960,
        "specialties": ["cardiology", "oncology", "nephrology", "urology", "bariatrics"],
        "type": "Private",
        "beds_icu": 45,
        "beds_general": 400,
        "trauma_center": False,
        "highlights": "Strong cardiac and oncology programs. 24/7 emergency.",
    },
    {
        "id": "H006",
        "name": "Victoria Government Hospital",
        "short_name": "Victoria Hospital",
        "lat": 12.9656, "lng": 77.5727,
        "specialties": ["general medicine", "trauma", "burns", "toxicology", "general surgery"],
        "type": "Government",
        "beds_icu": 100,
        "beds_general": 1400,
        "trauma_center": True,
        "highlights": "Largest trauma centre in Karnataka. High-capacity government hospital.",
    },
    {
        "id": "H007",
        "name": "Apollo Hospital, Bannerghatta Road",
        "short_name": "Apollo",
        "lat": 12.8942, "lng": 77.5982,
        "specialties": ["cardiology", "cardiac surgery", "neurology", "oncology", "transplant"],
        "type": "Private",
        "beds_icu": 55,
        "beds_general": 300,
        "trauma_center": False,
        "highlights": "International-grade cardiac and surgical care.",
    },
    {
        "id": "H008",
        "name": "M S Ramaiah Medical College Hospital",
        "short_name": "Ramaiah Hospital",
        "lat": 13.0188, "lng": 77.5528,
        "specialties": ["general medicine", "trauma", "cardiology", "pediatrics", "obstetrics"],
        "type": "Private",
        "beds_icu": 50,
        "beds_general": 800,
        "trauma_center": True,
        "highlights": "Teaching hospital with full emergency capability.",
    },
    {
        "id": "H009",
        "name": "Narayana Health City",
        "short_name": "Narayana Health",
        "lat": 12.8985, "lng": 77.6416,
        "specialties": ["cardiac surgery", "cath lab", "bone marrow transplant", "cardiology", "pediatric cardiac"],
        "type": "Private",
        "beds_icu": 120,
        "beds_general": 2000,
        "trauma_center": False,
        "highlights": "Largest cardiac surgery centre in Asia. Affordable cardiac care.",
    },
    {
        "id": "H010",
        "name": "Bowring & Lady Curzon Government Hospital",
        "short_name": "Bowring Hospital",
        "lat": 12.9780, "lng": 77.6068,
        "specialties": ["general medicine", "trauma", "obstetrics", "pediatrics", "general surgery"],
        "type": "Government",
        "beds_icu": 30,
        "beds_general": 600,
        "trauma_center": True,
        "highlights": "Central Bengaluru government hospital. Free emergency care.",
    },
]


# ── Distance Utility ──────────────────────────────────────────────────────
def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1-a))


def find_nearby_hospitals(patient_lat: float, patient_lng: float, max_km: float = 20.0) -> list:
    """Return hospitals within max_km, sorted by distance."""
    results = []
    for h in HOSPITALS_DB:
        dist = haversine_km(patient_lat, patient_lng, h["lat"], h["lng"])
        if dist <= max_km:
            results.append({**h, "distance_km": round(dist, 2)})
    return sorted(results, key=lambda x: x["distance_km"])


# ── AI Ranking ────────────────────────────────────────────────────────────
def _build_ranking_prompt(case_data: dict, hospitals: list) -> str:
    complaint = case_data.get("complaint", "Unknown emergency")
    severity  = case_data.get("severity", "CRITICAL")
    hospital_list = "\n".join([
        f"- {h['name']} ({h['short_name']}): {h['distance_km']}km away, "
        f"specialties: {', '.join(h['specialties'][:3])}, "
        f"ICU beds: {h['beds_icu']}, trauma: {h['trauma_center']}, type: {h['type']}"
        for h in hospitals[:6]  # limit to nearest 6
    ])

    return f"""You are an emergency medical dispatch AI. Given the following emergency case, rank the listed hospitals by suitability.

EMERGENCY CASE:
- Chief complaint: {complaint}
- Severity: {severity}

AVAILABLE HOSPITALS (sorted by distance from patient):
{hospital_list}

INSTRUCTIONS:
Rank ALL listed hospitals from most suitable (#1) to least suitable. For each hospital, provide:
1. A suitability score from 0–100
2. One-line reasoning (≤15 words)
3. Whether it is "RECOMMENDED" or "ALTERNATE"

Return ONLY valid JSON in this exact format:
{{
  "ranked_hospitals": [
    {{
      "id": "H001",
      "short_name": "Hospital Name",
      "score": 95,
      "reasoning": "Premier cardiac centre with 24/7 cath lab, ideal for suspected STEMI.",
      "tag": "RECOMMENDED"
    }}
  ],
  "ai_reasoning": "One-sentence overall reasoning for top choice."
}}"""


def _rank_with_gemini(prompt: str) -> Optional[dict]:
    """Call Gemini API to rank hospitals."""
    if not Config.GEMINI_API_KEY:
        return None

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{Config.GEMINI_MODEL}:generateContent"
        headers = {"Content-Type": "application/json"}
        params = {"key": Config.GEMINI_API_KEY}
        body = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 800,
                "responseMimeType": "application/json",
            },
        }

        resp = requests.post(url, headers=headers, params=params, json=body, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(text)

    except Exception as e:
        logger.warning(f"Gemini ranking failed: {e}")
        return None


def _rank_with_gemma(prompt: str) -> Optional[dict]:
    """Fallback: call local Ollama Gemma model."""
    ollama_url = Config.OLLAMA_BASE_URL
    if not ollama_url:
        return None

    try:
        resp = requests.post(
            f"{ollama_url}/api/generate",
            json={
                "model": Config.OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "format": "json",
                "options": {"temperature": 0.1, "num_predict": 600},
            },
            timeout=60,
        )
        resp.raise_for_status()
        raw = resp.json().get("response", "{}")
        return json.loads(raw)

    except Exception as e:
        logger.warning(f"Gemma ranking fallback failed: {e}")
        return None


def _rule_based_rank(hospitals: list, case_data: dict) -> dict:
    """
    Last-resort fallback: score hospitals using simple rules if AI unavailable.
    Prioritizes: specialty match → distance → ICU capacity.
    """
    complaint_lower = (case_data.get("complaint", "") + " " + case_data.get("severity", "")).lower()

    cardiac_keywords = ["cardiac", "heart", "chest", "stemi", "myocardial", "arrest"]
    neuro_keywords   = ["stroke", "neuro", "brain", "seizure", "unconscious"]
    trauma_keywords  = ["accident", "trauma", "fracture", "bleeding", "injury"]

    def score(h):
        s = max(0, 80 - h["distance_km"] * 3)  # distance penalty
        s += min(h["beds_icu"], 50)              # ICU capacity bonus

        # Specialty match
        specialties_str = " ".join(h["specialties"]).lower()
        if any(k in complaint_lower for k in cardiac_keywords) and \
           any(k in specialties_str for k in ["cardio", "cath", "cardiac"]):
            s += 40
        if any(k in complaint_lower for k in neuro_keywords) and \
           any(k in specialties_str for k in ["neuro", "brain"]):
            s += 40
        if any(k in complaint_lower for k in trauma_keywords) and h["trauma_center"]:
            s += 30
        return min(s, 100)

    scored = sorted(hospitals, key=score, reverse=True)
    ranked = []
    for i, h in enumerate(scored[:6]):
        ranked.append({
            "id": h["id"],
            "short_name": h["short_name"],
            "score": round(score(h)),
            "reasoning": f"Rule-based: specialty match + {h['distance_km']}km distance.",
            "tag": "RECOMMENDED" if i == 0 else "ALTERNATE",
        })

    return {
        "ranked_hospitals": ranked,
        "ai_reasoning": f"Rule-based ranking used (AI unavailable). {scored[0]['short_name']} selected for specialty match.",
    }


# ── Public API ────────────────────────────────────────────────────────────
def select_best_hospital(patient_lat: float, patient_lng: float, case_data: dict) -> dict:
    """
    Main entry point. Returns:
    {
      "recommended": { full hospital object + score + reasoning },
      "alternatives": [ list of other hospitals ],
      "all_ranked": [ full AI-ranked list ],
      "nearby_count": int,
      "ai_model_used": "gemini" | "gemma" | "rule-based",
      "ai_reasoning": str,
      "ts": int (epoch ms)
    }
    """
    try:
        nearby = find_nearby_hospitals(patient_lat, patient_lng, max_km=20)
        if not nearby:
            logger.warning("No hospitals found within 20km — using full database")
            nearby = sorted(HOSPITALS_DB, key=lambda h: haversine_km(patient_lat, patient_lng, h["lat"], h["lng"]))[:5]
            for h in nearby:
                h["distance_km"] = round(haversine_km(patient_lat, patient_lng, h["lat"], h["lng"]), 2)

        prompt = _build_ranking_prompt(case_data, nearby)

        # Try Gemini first, then Gemma, then rule-based
        ai_result = None
        model_used = "rule-based"

        ai_result = _rank_with_gemini(prompt)
        if ai_result:
            model_used = "gemini"
            logger.info(f"Hospital ranking by Gemini: top pick = {ai_result['ranked_hospitals'][0]['short_name']}")
        else:
            ai_result = _rank_with_gemma(prompt)
            if ai_result:
                model_used = "gemma"
                logger.info(f"Hospital ranking by Gemma: top pick = {ai_result['ranked_hospitals'][0]['short_name']}")
            else:
                ai_result = _rule_based_rank(nearby, case_data)
                model_used = "rule-based"
                logger.info(f"Hospital ranking by rules: top pick = {ai_result['ranked_hospitals'][0]['short_name']}")

        # Merge AI scores back with full hospital data
        ranked_ids = {r["id"]: r for r in ai_result.get("ranked_hospitals", [])}
        enriched = []
        for h in nearby:
            ai_info = ranked_ids.get(h["id"], {})
            enriched.append({
                **h,
                "score": ai_info.get("score", 50),
                "reasoning": ai_info.get("reasoning", ""),
                "tag": ai_info.get("tag", "ALTERNATE"),
            })
        enriched = sorted(enriched, key=lambda x: x.get("score", 0), reverse=True)

        recommended = enriched[0] if enriched else None
        alternatives = enriched[1:4]  # top 3 alternatives

        logger.info(
            f"Hospital selection complete | model={model_used} | "
            f"recommended={recommended['name'] if recommended else 'none'} | "
            f"nearby={len(nearby)}"
        )

        return {
            "recommended": recommended,
            "alternatives": alternatives,
            "all_ranked": enriched,
            "nearby_count": len(nearby),
            "ai_model_used": model_used,
            "ai_reasoning": ai_result.get("ai_reasoning", ""),
            "ts": int(time.time() * 1000),
        }

    except Exception as e:
        logger.error(f"Hospital selection error: {e}", exc_info=True)
        return {
            "recommended": None,
            "alternatives": [],
            "all_ranked": [],
            "nearby_count": 0,
            "ai_model_used": "error",
            "ai_reasoning": f"Error: {str(e)}",
            "ts": int(time.time() * 1000),
        }

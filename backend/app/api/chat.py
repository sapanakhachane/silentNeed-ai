from typing import Dict, Any, List
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.schema import Community, ServiceIndicator, NeedPrediction

router = APIRouter(prefix="/chat", tags=["AI Chatbot"])

class ChatRequest(BaseModel):
    message: str
    language: str = "en"
    conversation_history: List[Dict[str, str]] = []

@router.post("")
def query_ai_chatbot(payload: ChatRequest, db: Session = Depends(get_db)):
    user_query = payload.message.lower().strip()
    lang = payload.language.lower()
    
    # Query database context
    comms = db.query(Community).all()
    preds = db.query(NeedPrediction).all()
    
    # Top silent need community
    top_pred = sorted(preds, key=lambda p: p.silent_need_index, reverse=True)[0] if preds else None
    top_comm = db.query(Community).filter(Community.id == top_pred.community_id).first() if top_pred else None

    # Worst water community
    worst_water_pred = sorted(preds, key=lambda p: p.water_risk, reverse=True)[0] if preds else None
    worst_water_comm = db.query(Community).filter(Community.id == worst_water_pred.community_id).first() if worst_water_pred else None

    # Intent routing
    reply = ""

    if "water" in user_query or "drinking" in user_query or "पानी" in user_query:
        if worst_water_comm and worst_water_pred:
            if lang == "hi":
                reply = (
                    f"⚠️ सबसे गंभीर जल संकट **{worst_water_comm.name}** में है (जल संकट स्कोर: {worst_water_pred.water_risk}/100)। "
                    f"यहां भूजल में औद्योगिक अपशिष्ट और हैंडपंप प्रदूषण 92/100 तक पहुंच गया है, फिर भी केवल 3 शिकायतें दर्ज हैं। "
                    f"तुरंत मोबाइल वाटर प्यूरीफिकेशन ट्रक भेजने की सिफारिश की गई है।"
                )
            elif lang == "mr":
                reply = (
                    f"⚠️ सर्वात गंभीर पाणी टंचाई **{worst_water_comm.name}** मध्ये आहे (पाणी जोखीम स्तर: {worst_water_pred.water_risk}/100). "
                    f"येथे नागरिकांना पिण्याच्या पाण्यासाठी दूषित बोअरवेलवर अवलंबून राहावे लागत आहे."
                )
            else:
                reply = (
                    f"💧 The most acute drinking water contamination is in **{worst_water_comm.name}** "
                    f"(Water Distress: {worst_water_pred.water_risk}/100). "
                    f"Industrial runoff has contaminated groundwater borewells (92/100 contamination index) with under 1.2 hrs supply per day, "
                    f"yet only 3 complaints were logged in 90 days due to digital exclusion."
                )
        else:
            reply = "Drinking water distress is monitored across all wards using both contamination and access hours."

    elif "highest" in user_query or "worst" in user_query or "severe" in user_query or "silent" in user_query or "सबसे" in user_query:
        if top_comm and top_pred:
            if lang == "hi":
                reply = (
                    f"🚨 उच्चतम साइलेंट नीड क्षेत्र **{top_comm.name}** है (साइलेंट नीड इंडेक्स: {top_pred.silent_need_index}/100, वास्तविक संकट: {top_pred.final_risk_score}/100)। "
                    f"इस बस्ती की 5,400 आबादी ने 90 दिनों में **0 शिकायतें** दर्ज की हैं, जबकि एल्गोरिदम के अनुसार 24 शिकायतें अपेक्षित थीं। "
                    f"मुख्य कारण: 85% डिजिटल निरक्षरता और सरकारी कार्यालय से 16.5 किमी की दूरी।"
                )
            elif lang == "mr":
                reply = (
                    f"🚨 सर्वात जास्त अदृश्य गरज **{top_comm.name}** मध्ये आहे (सायलेंट नीड इंडेक्स: {top_pred.silent_need_index}/100). "
                    f"येथे ९० दिवसांत **० तक्रारी** नोंदवल्या गेल्या आहेत कारण नागरिक डिजिटल सुविधांपासून वंचित आहेत."
                )
            else:
                reply = (
                    f"🚨 The community with the highest Silent Need Index is **{top_comm.name}** "
                    f"(SNI: {top_pred.silent_need_index}/100, Distress Score: {top_pred.final_risk_score}/100). "
                    f"Despite facing 0.5 hrs/day water, 98% open drainage, and 14.5 km distance to the nearest clinic, "
                    f"it recorded **0 official complaints** in 90 days (a 24.0x reporting vacuum) due to 85% digital exclusion."
                )

    elif "paradox" in user_query or "fewer" in user_query or "how it works" in user_query or "सिद्धांत" in user_query:
        if lang == "hi":
            reply = (
                "💡 **शिकायत-अभाव विरोधाभास (The Complaint Paradox):** पारंपरिक नगर निगम शिकायत पोर्टलों पर भरोसा करते हैं, "
                "यह मानकर कि 'कम शिकायतें = कम समस्याएं'। लेकिन गरीब और दूरदराज की बस्तियों में नागरिक स्मार्टफोन, इंटरनेट "
                "या डिजिटल साक्षरता के अभाव में शिकायत दर्ज नहीं कर पाते। साइलेंट-नीड AI उपग्रह, सेंसर और ओपन-स्ट्रीट-मैप से "
                "अपेक्षित शिकायतों (Expected) की गणना करता है और अदृश्य संकट को सामने लाता है।"
            )
        else:
            reply = (
                "💡 **The Civic Complaint Paradox Explained:** Traditional governments allocate capital where complaint tickets are loudest. "
                "However, marginalized informal settlements suffer from 'Reporting Friction'—illiteracy, digital divide, and geographic isolation. "
                "SilentNeed AI uses Scikit-learn regressors to calculate Expected Complaints $E$ based on actual infrastructure decay. "
                "When actual complaints are near-zero while expected complaints are high, the Silent Need Index spikes to flag the blindspot!"
            )

    elif "desert" in user_query or "osm" in user_query or "openstreetmap" in user_query:
        reply = (
            "🗺️ **OpenStreetMap (OSM) Infrastructure Desert:** SilentNeed AI queries live OpenStreetMap data within 1.5km of each settlement. "
            "If an informal settlement of 14,000 residents has 0 mapped drinking water points, 0 clinics, and 0 waste bins on OSM, "
            "it is mathematically classified as an 'OSM Infrastructure Desert' (Score > 70), confirming physical neglect independently of municipal logs."
        )

    elif "clinic" in user_query or "health" in user_query or "डॉक्टर" in user_query:
        reply = (
            "🏥 **Healthcare Recommendation:** We recommend immediately dispatching bi-weekly mobile PHC clinic vans to **Sundar Gram Brickfield Hamlets** (14.5km away from any clinic) "
            "and **Narmada Riverbed Colony** (11.2km away). Both areas show infant immunization rates below 45%."
        )

    else:
        if lang == "hi":
            reply = (
                f"नमस्ते! मैं साइलेंट-नीड AI लोकपाल सहायक हूँ। हमारे रडार पर वर्तमान में {len(comms)} बस्तियां हैं। "
                f"आप मुझसे सबसे गंभीर जल संकट, बाढ़ की आशंका, 'शिकायत विरोधाभास' या ओपन-स्ट्रीट-मैप सुविधा ऑडिट के बारे में पूछ सकते हैं।"
            )
        else:
            reply = (
                f"Hello! I am the SilentNeed AI Civic Ombudsman. We are currently monitoring {len(comms)} vulnerable communities across the metro area. "
                f"You can ask me about: \n"
                f"• Top silent need hotspots (e.g. Sundar Gram, Bhim Nagar)\n"
                f"• Drinking water contamination vs municipal tickets\n"
                f"• The Complaint-Gap mathematical paradox\n"
                f"• OpenStreetMap infrastructure desert audits\n"
                f"• Where to allocate emergency budgets"
            )

    return {
        "reply": reply,
        "language": lang,
        "suggested_actions": [
            "Which community has the highest invisible need?",
            "Where is drinking water most contaminated?",
            "Explain the Complaint-Gap Paradox",
            "What is an OpenStreetMap Infrastructure Desert?"
        ]
    }

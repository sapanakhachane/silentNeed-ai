import hashlib
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.schema import User

router = APIRouter(prefix="/auth", tags=["Authentication & Role Management"])

# 3 Standard Pre-configured Demo Accounts
DEMO_ACCOUNTS = {
    "authority": {
        "id": 101,
        "email": "commissioner@silentneed.gov.in",
        "full_name": "Commissioner Aarav Sharma",
        "role": "authority",
        "organization": "Urban Local Body & Municipal Directorate",
        "ward_assigned": "City-Wide Jurisdiction (All Wards)",
        "avatar": "🏛️",
        "badge_color": "cyan",
        "permissions": [
            "full_georadar_access",
            "dispatch_interventions",
            "approve_budgets",
            "simulation_sandbox",
            "ml_anomaly_override",
            "export_intelligence_dossier"
        ]
    },
    "ngo": {
        "id": 102,
        "email": "priya.patel@groundtruth-impact.org",
        "full_name": "Priya Patel",
        "role": "ngo",
        "organization": "Grassroots Humanitarian Impact Relief",
        "ward_assigned": "Metro North & Outer Migrant Hamlets",
        "avatar": "🤝",
        "badge_color": "emerald",
        "permissions": [
            "submit_field_audits",
            "osm_desert_verification",
            "complaint_gap_analytics",
            "ground_truth_validation",
            "request_emergency_tankers"
        ]
    },
    "citizen": {
        "id": 103,
        "email": "sunita.devi@citizen.org",
        "full_name": "Sunita Devi",
        "role": "citizen",
        "organization": "Bhim Nagar Community Resident Council",
        "ward_assigned": "Ward 42-B (Rail-side Transit Cluster)",
        "avatar": "🏡",
        "badge_color": "amber",
        "permissions": [
            "view_local_ward_alerts",
            "submit_citizen_ground_truth",
            "ai_ombudsman_chat",
            "track_dispatched_interventions",
            "view_osm_water_points"
        ]
    },
    "researcher": {
        "id": 104,
        "email": "dr.kavita.rao@civicresearch.ac.in",
        "full_name": "Dr. Kavita Rao",
        "role": "researcher",
        "organization": "Center for Algorithmic Fairness & Civic Policy",
        "ward_assigned": "All Urban Academic Research Clusters",
        "avatar": "🔬",
        "badge_color": "purple",
        "permissions": [
            "raw_dataset_export",
            "inspect_model_weights",
            "outlier_analysis",
            "bias_auditing"
        ]
    }
}

class LoginRequest(BaseModel):
    email: str
    password: str

class DemoLoginRequest(BaseModel):
    role: str # "authority", "ngo", "citizen"

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "citizen"
    organization: Optional[str] = None
    ward_assigned: Optional[str] = None

def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

@router.get("/demo-accounts")
def get_demo_accounts():
    """Return available pre-configured demo roles for 1-click evaluation."""
    return list(DEMO_ACCOUNTS.values())

@router.post("/demo-login")
def demo_login(payload: DemoLoginRequest):
    """Log in directly as an Authority, NGO Field Auditor, or Citizen."""
    role_key = payload.role.lower().strip()
    if role_key not in DEMO_ACCOUNTS:
        raise HTTPException(status_code=400, detail=f"Invalid demo role: {payload.role}. Choose 'authority', 'ngo', or 'citizen'.")
    
    account = DEMO_ACCOUNTS[role_key]
    token = f"demo-token-{role_key}-{hash_pw(account['email'])[:12]}"
    return {
        "token": token,
        "user": account,
        "message": f"Successfully authenticated as {account['full_name']} ({account['role'].upper()})"
    }

@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    
    # Check demo accounts first
    for role_key, acc in DEMO_ACCOUNTS.items():
        if acc["email"].lower() == email:
            token = f"demo-token-{role_key}-{hash_pw(acc['email'])[:12]}"
            return {
                "token": token,
                "user": acc,
                "message": f"Welcome back, {acc['full_name']}!"
            }

    # Query database
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # For development/demo convenience: create account on the fly if not existing
        user = User(
            email=email,
            hashed_password=hash_pw(payload.password),
            full_name=email.split("@")[0].capitalize(),
            role="citizen",
            organization="General Community Member"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = f"jwt-mock-{user.id}-{hash_pw(user.email)[:12]}"
    user_dict = {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "organization": user.organization,
        "ward_assigned": user.ward_assigned,
        "avatar": "🏛️" if user.role == "authority" else ("🤝" if user.role == "ngo" else "🏡"),
        "badge_color": "cyan" if user.role == "authority" else ("emerald" if user.role == "ngo" else "amber"),
        "permissions": DEMO_ACCOUNTS.get(user.role, DEMO_ACCOUNTS["citizen"])["permissions"]
    }
    return {
        "token": token,
        "user": user_dict,
        "message": f"Welcome, {user.full_name}!"
    }

@router.post("/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")

    role = payload.role if payload.role in DEMO_ACCOUNTS else "citizen"
    new_user = User(
        email=email,
        hashed_password=hash_pw(payload.password),
        full_name=payload.full_name.strip(),
        role=role,
        organization=payload.organization,
        ward_assigned=payload.ward_assigned
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = f"jwt-mock-{new_user.id}-{hash_pw(new_user.email)[:12]}"
    user_dict = {
        "id": new_user.id,
        "email": new_user.email,
        "full_name": new_user.full_name,
        "role": new_user.role,
        "organization": new_user.organization,
        "ward_assigned": new_user.ward_assigned,
        "avatar": "🏛️" if new_user.role == "authority" else ("🤝" if new_user.role == "ngo" else "🏡"),
        "badge_color": "cyan" if new_user.role == "authority" else ("emerald" if new_user.role == "ngo" else "amber"),
        "permissions": DEMO_ACCOUNTS.get(new_user.role, DEMO_ACCOUNTS["citizen"])["permissions"]
    }
    return {
        "token": token,
        "user": user_dict,
        "message": f"Account successfully created for {new_user.full_name} ({new_user.role.upper()})."
    }

@router.get("/me")
def get_current_user_profile(authorization: Optional[str] = Header(None)):
    if not authorization:
        # Default to municipal authority for demo inspectability
        return DEMO_ACCOUNTS["authority"]
    
    token = authorization.replace("Bearer ", "").strip()
    if "authority" in token:
        return DEMO_ACCOUNTS["authority"]
    elif "ngo" in token:
        return DEMO_ACCOUNTS["ngo"]
    elif "citizen" in token:
        return DEMO_ACCOUNTS["citizen"]
    
    return DEMO_ACCOUNTS["authority"]

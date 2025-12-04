"""
Profile API endpoints
Handles patient profile management
"""
from fastapi import APIRouter, HTTPException
from models.schemas import PatientProfile

router = APIRouter(prefix="/api/profile", tags=["profile"])

# In-memory profile storage (upgrade to database in production)
profiles = {}


@router.get("/{user_id}", response_model=PatientProfile)
async def get_profile(user_id: str):
    """Get patient profile"""
    if user_id not in profiles:
        # Return default profile
        return PatientProfile(
            name="",
            doctor="",
            doctor_email="",
            patient_id="",
            ckd_stage=1,
            weight=60.0,
            allergies=""
        )
    return profiles[user_id]


@router.put("/{user_id}", response_model=PatientProfile)
async def update_profile(user_id: str, profile: PatientProfile):
    """Update patient profile"""
    profiles[user_id] = profile
    return profile

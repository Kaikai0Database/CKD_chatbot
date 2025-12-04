"""
Authentication API endpoints
Handles user login, logout, and admin authentication
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
import re
from models.schemas import (
    LoginRequest, AnonymousLoginRequest, AdminLoginRequest, DoctorLoginRequest, LoginResponse
)
from config import ADMIN_PASSWORD

router = APIRouter(prefix="/api/auth", tags=["auth"])


# In-memory user sessions (upgrade to database in production)
active_users = {}


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Patient login endpoint"""
    # Validate email format
    if not re.match(r"[^@]+@[^@]+\.[^@]+", request.patient_email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    # Create user session
    user_id = f"{request.name}_{request.patient_email}"
    active_users[user_id] = {
        "name": request.name,
        "doctor": request.doctor,
        "patient_email": request.patient_email,
        "is_anonymous": False,
        "is_admin": False
    }
    
    return LoginResponse(
        success=True,
        message="Login successful",
        user={
            "id": user_id,
            "name": request.name,
            "doctor": request.doctor,
            "patient_email": request.patient_email
        }
    )


@router.post("/login/anonymous", response_model=LoginResponse)
async def login_anonymous(request: AnonymousLoginRequest):
    """Anonymous login endpoint"""
    user_id = "anonymous_user"
    active_users[user_id] = {
        "name": "匿名",
        "doctor": "anonymous",
        "doctor_email": "anonymous@anonymous.com",
        "is_anonymous": True,
        "is_admin": False
    }
    
    return LoginResponse(
        success=True,
        message="Anonymous login successful",
        user={
            "id": user_id,
            "name": "匿名",
            "doctor": "anonymous",
            "doctor_email": "anonymous@anonymous.com"
        }
    )


@router.post("/logout")
async def logout(user_id: str):
    """Logout endpoint"""
    if user_id in active_users:
        del active_users[user_id]
        return {"success": True, "message": "Logged out successfully"}
    raise HTTPException(status_code=404, detail="User not found")


@router.post("/admin/login")
async def admin_login(request: AdminLoginRequest):
    """Admin login endpoint"""
    if request.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin password")
    
    user_id = "admin_user"
    active_users[user_id] = {
        "name": "Admin",
        "doctor": "N/A",
        "doctor_email": "admin@system.local",
        "is_anonymous": False,
        "is_admin": True
    }
    
    return LoginResponse(
        success=True,
        message="Admin login successful",
        user={
            "id": user_id,
            "name": "Admin",
            "doctor": "N/A",
            "doctor_email": "admin@system.local",
            "is_admin": True
        }
    )


@router.post("/doctor/login")
async def doctor_login(request: DoctorLoginRequest):
    """Doctor login endpoint"""
    user_id = f"doctor_{request.name}"
    active_users[user_id] = {
        "name": request.name,
        "doctor": request.name,
        "patient_email": "",
        "is_anonymous": False,
        "is_admin": False,
        "is_doctor": True
    }
    
    return LoginResponse(
        success=True,
        message="Doctor login successful",
        user={
            "id": user_id,
            "name": request.name,
            "doctor": request.name,
            "patient_email": "",
            "is_doctor": True
        }
    )


@router.get("/verify/{user_id}")
async def verify_user(user_id: str):
    """Verify if user is logged in"""
    if user_id in active_users:
        return {"valid": True, "user": active_users[user_id]}
    return {"valid": False}

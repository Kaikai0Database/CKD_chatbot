"""
Doctor Authentication API endpoints
Handles doctor registration, login with password, and password reset
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import uuid
import secrets
from models.doctor import DoctorModel
from utils.doctor_db import doctor_db
from utils.password import password_hasher
from models.schemas import LoginResponse

router = APIRouter(prefix="/api/doctor", tags=["doctor_auth"])

# Request/Response models
class DoctorRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class DoctorLoginRequest(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/register")
async def register_doctor(request: DoctorRegisterRequest):
    """Register a new doctor"""
    # Check if email already exists
    if doctor_db.email_exists(request.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate password strength (minimum 8 characters)
    if len(request.password) < 8:
        raise HTTPException(
            status_code=400, 
            detail="Password must be at least 8 characters long"
        )
    
    # Hash password
    password_hash = password_hasher.hash_password(request.password)
    
    # Create doctor
    doctor_id = f"doctor_{uuid.uuid4().hex[:12]}"
    doctor = DoctorModel(
        id=doctor_id,
        name=request.name,
        email=request.email,
        password_hash=password_hash,
        created_at=datetime.now().isoformat()
    )
    
    doctor_db.create_doctor(doctor)
    
    return {
        "success": True,
        "message": "Doctor registered successfully",
        "doctor": {
            "id": doctor.id,
            "name": doctor.name,
            "email": doctor.email
        }
    }


@router.post("/login", response_model=LoginResponse)
async def login_doctor(request: DoctorLoginRequest):
    """Doctor login with email and password"""
    # Get doctor by email
    doctor = doctor_db.get_doctor_by_email(request.email)
    if not doctor:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not password_hasher.verify_password(request.password, doctor.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Update last login time
    doctor_db.update_doctor(doctor.id, {
        "last_login": datetime.now().isoformat()
    })
    
    return LoginResponse(
        success=True,
        message="Login successful",
        user={
            "id": doctor.id,
            "name": doctor.name,
            "doctor": doctor.name,  # For compatibility with existing code
            "email": doctor.email,
            "is_doctor": True
        }
    )


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Request password reset"""
    # Check if doctor exists
    doctor = doctor_db.get_doctor_by_email(request.email)
    if not doctor:
        # Don't reveal if email exists or not for security
        return {
            "success": True,
            "message": "If the email exists, a reset link has been sent"
        }
    
    # Create reset token
    token = secrets.token_urlsafe(32)
    expires_at = (datetime.now() + timedelta(hours=1)).isoformat()
    doctor_db.create_reset_token(token, doctor.email, expires_at)
    
    # In production, send email here
    # For now, print to console for testing
    reset_link = f"http://localhost:5173/doctor/reset-password?token={token}"
    print(f"\n{'='*60}")
    print(f"PASSWORD RESET LINK FOR {doctor.email}:")
    print(f"{reset_link}")
    print(f"{'='*60}\n")
    
    return {
        "success": True,
        "message": "If the email exists, a reset link has been sent",
        "reset_link": reset_link  # Only for testing, remove in production
    }


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset password using token"""
    # Verify token
    token_data = doctor_db.get_reset_token(request.token)
    if not token_data:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    token, doctor_email, expires_at = token_data
    if datetime.now() >= datetime.fromisoformat(expires_at):
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    # Validate new password
    if len(request.new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters long"
        )
    
    # Get doctor
    doctor = doctor_db.get_doctor_by_email(doctor_email)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Hash new password
    new_password_hash = password_hasher.hash_password(request.new_password)
    
    # Update password
    doctor_db.update_doctor(doctor.id, {
        "password_hash": new_password_hash
    })
    
    # Delete token
    doctor_db.delete_reset_token(request.token)
    
    return {
        "success": True,
        "message": "Password reset successfully"
    }


@router.delete("/session/{session_id}")
async def delete_patient_session(session_id: str, doctor_id: str = Query(...)):
    """Delete a patient session (doctor only)"""
    from utils.session_manager import session_manager
    
    # Get session
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Verify doctor has permission (session belongs to their patient)
    # Get doctor info
    doctor = doctor_db.get_doctor_by_id(doctor_id)
    if not doctor:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    # Check if this session's patient belongs to this doctor
    # The session.doctor field should match the doctor's name
    if session.doctor != doctor.name:
        raise HTTPException(
            status_code=403, 
            detail="You can only delete sessions from your own patients"
        )
    
    # Delete session
    success = session_manager.delete_session(session_id, session.user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Failed to delete session")
    
    return {
        "success": True,
        "message": "Session deleted successfully"
    }

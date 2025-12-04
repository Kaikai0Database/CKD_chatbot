from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# Auth Models
class LoginRequest(BaseModel):
    name: str
    doctor: str
    patient_email: EmailStr  # 改名: doctor_email → patient_email


class AnonymousLoginRequest(BaseModel):
    pass


class AdminLoginRequest(BaseModel):
    password: str


class DoctorLoginRequest(BaseModel):
    name: str  # 醫師名稱


class LoginResponse(BaseModel):
    success: bool
    message: str
    user: Optional[dict] = None


# Profile Models
class PatientProfile(BaseModel):
    name: str
    doctor: str
    patient_email: str  # 改名: doctor_email → patient_email
    patient_id: Optional[str] = ""
    ckd_stage: int = 1
    weight: float = 60.0
    allergies: str = ""


# Chat Models
class ChatSession(BaseModel):
    id: str
    name: Optional[str] = None
    history: List[dict] = []
    created_at: datetime
    updated_at: datetime
    doctor: Optional[str] = None  # 新增: 記錄醫師名稱
    user_id: Optional[str] = None  # 新增: 記錄病患ID


class CreateSessionRequest(BaseModel):
    pass


class UpdateSessionRequest(BaseModel):
    name: str


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str | dict


class SendMessageRequest(BaseModel):
    session_id: str
    message: str


class SendMessageResponse(BaseModel):
    success: bool
    message: dict  # {"outline": str, "detail": str}
    processing_time: float


class VoiceInputRequest(BaseModel):
    audio_data: str  # base64 encoded audio


class VoiceInputResponse(BaseModel):
    success: bool
    text: Optional[str] = None
    error: Optional[str] = None


# Admin Models
class QuestionRecord(BaseModel):
    timestamp: str
    patient_name: str
    question: str


class QuestionRecordsResponse(BaseModel):
    records: List[QuestionRecord]

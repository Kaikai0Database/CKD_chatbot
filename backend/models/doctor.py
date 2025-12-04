"""
Doctor model and data management
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
import json
import os

class DoctorModel(BaseModel):
    """Doctor data model"""
    id: str
    name: str
    email: EmailStr
    password_hash: str
    created_at: str
    last_login: Optional[str] = None

class DoctorManager:
    """Manage doctor data in JSON file"""
    
    def __init__(self, data_file: str = "doctors.json"):
        self.data_file = data_file
        self._ensure_file_exists()
    
    def _ensure_file_exists(self):
        """Create doctors.json if it doesn't exist"""
        if not os.path.exists(self.data_file):
            with open(self.data_file, 'w', encoding='utf-8') as f:
                json.dump({"doctors": []}, f, ensure_ascii=False, indent=2)
    
    def _read_data(self) -> dict:
        """Read all doctor data from file"""
        with open(self.data_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def _write_data(self, data: dict):
        """Write doctor data to file"""
        with open(self.data_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    def get_all_doctors(self) -> List[DoctorModel]:
        """Get all doctors"""
        data = self._read_data()
        return [DoctorModel(**doc) for doc in data["doctors"]]
    
    def get_doctor_by_email(self, email: str) -> Optional[DoctorModel]:
        """Get doctor by email"""
        doctors = self.get_all_doctors()
        for doctor in doctors:
            if doctor.email == email:
                return doctor
        return None
    
    def get_doctor_by_id(self, doctor_id: str) -> Optional[DoctorModel]:
        """Get doctor by ID"""
        doctors = self.get_all_doctors()
        for doctor in doctors:
            if doctor.id == doctor_id:
                return doctor
        return None
    
    def create_doctor(self, doctor: DoctorModel) -> DoctorModel:
        """Create a new doctor"""
        data = self._read_data()
        data["doctors"].append(doctor.dict())
        self._write_data(data)
        return doctor
    
    def update_doctor(self, doctor_id: str, updates: dict) -> Optional[DoctorModel]:
        """Update doctor data"""
        data = self._read_data()
        for i, doc in enumerate(data["doctors"]):
            if doc["id"] == doctor_id:
                data["doctors"][i].update(updates)
                self._write_data(data)
                return DoctorModel(**data["doctors"][i])
        return None
    
    def email_exists(self, email: str) -> bool:
        """Check if email already exists"""
        return self.get_doctor_by_email(email) is not None


# Global instance
doctor_manager = DoctorManager()

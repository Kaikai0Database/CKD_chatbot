"""
SQLite Database Manager for Doctor Data
Handles doctor authentication data storage using SQLite
"""
import sqlite3
from typing import Optional, List
from datetime import datetime
from models.doctor import DoctorModel
import os

class DoctorDatabase:
    """Manage doctor data in SQLite database"""
    
    def __init__(self, db_file: str = "doctors.db"):
        self.db_file = db_file
        self._create_tables()
    
    def _get_connection(self):
        """Get database connection"""
        return sqlite3.connect(self.db_file)
    
    def _create_tables(self):
        """Create necessary tables"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        # Create doctors table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS doctors (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL,
                last_login TEXT
            )
        ''')
        
        # Create password reset tokens table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                token TEXT PRIMARY KEY,
                doctor_email TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                FOREIGN KEY (doctor_email) REFERENCES doctors(email)
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def get_all_doctors(self) -> List[DoctorModel]:
        """Get all doctors"""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM doctors')
        rows = cursor.fetchall()
        conn.close()
        
        return [DoctorModel(
            id=row[0],
            name=row[1],
            email=row[2],
            password_hash=row[3],
            created_at=row[4],
            last_login=row[5]
        ) for row in rows]
    
    def get_doctor_by_email(self, email: str) -> Optional[DoctorModel]:
        """Get doctor by email"""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM doctors WHERE email = ?', (email,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return DoctorModel(
                id=row[0],
                name=row[1],
                email=row[2],
                password_hash=row[3],
                created_at=row[4],
                last_login=row[5]
            )
        return None
    
    def get_doctor_by_id(self, doctor_id: str) -> Optional[DoctorModel]:
        """Get doctor by ID"""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM doctors WHERE id = ?', (doctor_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return DoctorModel(
                id=row[0],
                name=row[1],
                email=row[2],
                password_hash=row[3],
                created_at=row[4],
                last_login=row[5]
            )
        return None
    
    def create_doctor(self, doctor: DoctorModel) -> DoctorModel:
        """Create a new doctor"""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO doctors (id, name, email, password_hash, created_at, last_login)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (doctor.id, doctor.name, doctor.email, doctor.password_hash, 
              doctor.created_at, doctor.last_login))
        conn.commit()
        conn.close()
        return doctor
    
    def update_doctor(self, doctor_id: str, updates: dict) -> Optional[DoctorModel]:
        """Update doctor data"""
        if not updates:
            return self.get_doctor_by_id(doctor_id)
        
        # Build UPDATE query dynamically
        set_clause = ', '.join([f"{key} = ?" for key in updates.keys()])
        values = list(updates.values()) + [doctor_id]
        
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute(f'UPDATE doctors SET {set_clause} WHERE id = ?', values)
        conn.commit()
        conn.close()
        
        return self.get_doctor_by_id(doctor_id)
    
    def email_exists(self, email: str) -> bool:
        """Check if email already exists"""
        return self.get_doctor_by_email(email) is not None
    
    # Password reset token methods
    def create_reset_token(self, token: str, doctor_email: str, expires_at: str):
        """Create a password reset token"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        # Delete old tokens for this email
        cursor.execute('DELETE FROM password_reset_tokens WHERE doctor_email = ?', 
                      (doctor_email,))
        
        # Insert new token
        cursor.execute('''
            INSERT INTO password_reset_tokens (token, doctor_email, expires_at)
            VALUES (?, ?, ?)
        ''', (token, doctor_email, expires_at))
        
        conn.commit()
        conn.close()
    
    def get_reset_token(self, token: str) -> Optional[tuple]:
        """Get reset token data"""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT token, doctor_email, expires_at 
            FROM password_reset_tokens 
            WHERE token = ?
        ''', (token,))
        row = cursor.fetchone()
        conn.close()
        return row
    
    def delete_reset_token(self, token: str):
        """Delete a reset token"""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM password_reset_tokens WHERE token = ?', (token,))
        conn.commit()
        conn.close()
    
    def cleanup_expired_tokens(self):
        """Remove all expired tokens"""
        now = datetime.now().isoformat()
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM password_reset_tokens WHERE expires_at < ?', (now,))
        conn.commit()
        conn.close()


# Global instance
doctor_db = DoctorDatabase()

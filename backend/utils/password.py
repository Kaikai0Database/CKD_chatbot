"""
Password hashing and verification utilities
"""
import bcrypt
import secrets
from datetime import datetime, timedelta
from typing import Optional
import json
import os

class PasswordHasher:
    """Handle password hashing and verification using bcrypt"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt"""
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        """Verify a password against its hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


class PasswordResetManager:
    """Manage password reset tokens"""
    
    def __init__(self, token_file: str = "password_reset_tokens.json"):
        self.token_file = token_file
        self._ensure_file_exists()
    
    def _ensure_file_exists(self):
        """Create token file if it doesn't exist"""
        if not os.path.exists(self.token_file):
            with open(self.token_file, 'w', encoding='utf-8') as f:
                json.dump({"tokens": []}, f, ensure_ascii=False, indent=2)
    
    def _read_tokens(self) -> dict:
        """Read all tokens from file"""
        with open(self.token_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def _write_tokens(self, data: dict):
        """Write tokens to file"""
        with open(self.token_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    def create_reset_token(self, doctor_email: str) -> str:
        """Create a new reset token"""
        token = secrets.token_urlsafe(32)
        expires_at = (datetime.now() + timedelta(hours=1)).isoformat()
        
        data = self._read_tokens()
        # Remove old tokens for this email
        data["tokens"] = [t for t in data["tokens"] if t["doctor_email"] != doctor_email]
        # Add new token
        data["tokens"].append({
            "token": token,
            "doctor_email": doctor_email,
            "expires_at": expires_at
        })
        self._write_tokens(data)
        return token
    
    def verify_token(self, token: str) -> Optional[str]:
        """
        Verify a reset token and return the associated email if valid.
        Returns None if token is invalid or expired.
        """
        data = self._read_tokens()
        now = datetime.now()
        
        for token_data in data["tokens"]:
            if token_data["token"] == token:
                expires_at = datetime.fromisoformat(token_data["expires_at"])
                if now < expires_at:
                    return token_data["doctor_email"]
                else:
                    # Token expired, remove it
                    self.delete_token(token)
                    return None
        return None
    
    def delete_token(self, token: str):
        """Delete a token"""
        data = self._read_tokens()
        data["tokens"] = [t for t in data["tokens"] if t["token"] != token]
        self._write_tokens(data)
    
    def cleanup_expired_tokens(self):
        """Remove all expired tokens"""
        data = self._read_tokens()
        now = datetime.now()
        data["tokens"] = [
            t for t in data["tokens"] 
            if datetime.fromisoformat(t["expires_at"]) > now
        ]
        self._write_tokens(data)


# Global instances
password_hasher = PasswordHasher()
reset_manager = PasswordResetManager()

"""
Session management utilities
Handles in-memory session storage for chat conversations
"""
import uuid
from datetime import datetime
from typing import Dict, Optional, List
from backend.models.schemas import ChatSession


class SessionManager:
    """Manages chat sessions in memory"""
    
    def __init__(self):
        self.sessions: Dict[str, ChatSession] = {}
        self.user_sessions: Dict[str, List[str]] = {}  # user_id -> [session_ids]
    
    def create_session(self, user_id: str, doctor: str = None) -> ChatSession:
        """Create a new chat session"""
        session_id = str(uuid.uuid4())
        now = datetime.now()
        
        session = ChatSession(
            id=session_id,
            name=None,
            history=[],
            created_at=now,
            updated_at=now,
            doctor=doctor,      # 記錄醫師
            user_id=user_id     # 記錄病患
        )
        
        self.sessions[session_id] = session
        
        if user_id not in self.user_sessions:
            self.user_sessions[user_id] = []
        self.user_sessions[user_id].append(session_id)
        
        return session
    
    def get_session(self, session_id: str) -> Optional[ChatSession]:
        """Get a session by ID"""
        return self.sessions.get(session_id)
    
    def get_user_sessions(self, user_id: str) -> List[ChatSession]:
        """Get all sessions for a user"""
        session_ids = self.user_sessions.get(user_id, [])
        return [self.sessions[sid] for sid in session_ids if sid in self.sessions]
    
    def update_session_name(self, session_id: str, name: str) -> bool:
        """Update session name"""
        session = self.sessions.get(session_id)
        if session:
            session.name = name
            session.updated_at = datetime.now()
            return True
        return False
    
    def delete_session(self, session_id: str, user_id: str) -> bool:
        """Delete a session"""
        if session_id in self.sessions:
            del self.sessions[session_id]
            if user_id in self.user_sessions:
                self.user_sessions[user_id] = [
                    sid for sid in self.user_sessions[user_id] if sid != session_id
                ]
            return True
        return False
    
    def add_message(self, session_id: str, role: str, content: str | dict):
        """Add a message to session history"""
        session = self.sessions.get(session_id)
        if session:
            session.history.append({"role": role, "content": content})
            session.updated_at = datetime.now()
    
    def get_sessions_by_doctor(self, doctor: str) -> List[ChatSession]:
        """Get all sessions for a specific doctor (for future doctor admin features)"""
        return [
            session for session in self.sessions.values()
            if session.doctor == doctor
        ]


# Global session manager instance
session_manager = SessionManager()

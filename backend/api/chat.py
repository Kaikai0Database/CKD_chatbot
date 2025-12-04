"""
Chat API endpoints
Handles chat sessions and messaging
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List
from timeit import default_timer as timer
import sys
import os

# Add parent directory to path to import backend module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

import core_logic as backend_logic  # The original backend.py module (renamed to core_logic.py)
from models.schemas import (
    ChatSession, SendMessageRequest, SendMessageResponse,
    CreateSessionRequest, UpdateSessionRequest
)
from utils.session_manager import session_manager

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/sessions")
async def create_session(user_id: str = Query(...), doctor: str = Query(None)):
    """Create a new chat session"""
    session = session_manager.create_session(user_id, doctor)
    return {
        "success": True,
        "session": {
            "id": session.id,
            "name": session.name,
            "history": session.history,
            "created_at": session.created_at.isoformat(),
            "updated_at": session.updated_at.isoformat()
        }
    }


@router.get("/sessions")
async def get_sessions(user_id: str = Query(...), doctor: str = Query(None)) -> List[dict]:
    """Get all sessions for a user"""
    sessions = session_manager.get_user_sessions(user_id)
    return [
        {
            "id": s.id,
            "name": s.name,
            "history": s.history,
            "created_at": s.created_at.isoformat(),
            "updated_at": s.updated_at.isoformat()
        }
        for s in sessions
    ]


@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    """Get a specific session"""
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "id": session.id,
        "name": session.name,
        "history": session.history,
        "created_at": session.created_at.isoformat(),
        "updated_at": session.updated_at.isoformat()
    }


@router.put("/sessions/{session_id}")
async def update_session(session_id: str, request: UpdateSessionRequest):
    """Update session name"""
    success = session_manager.update_session_name(session_id, request.name)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"success": True, "message": "Session updated"}


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, user_id: str):
    """Delete a session"""
    success = session_manager.delete_session(session_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"success": True, "message": "Session deleted"}


@router.post("/chat/message", response_model=SendMessageResponse)
async def send_message(request: SendMessageRequest):
    """Send a message and get response"""
    session = session_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Add user message to history
    session_manager.add_message(request.session_id, "user", request.message)
    
    # Auto-rename session if it's the first message
    if session.name is None and len(session.history) == 1:
        try:
            rename = backend_logic.llm_chinese.invoke(
                f"請用一句話為以下對話命名，作為標題：\n使用者：{request.message}"
            ).content.strip().replace('"', '').replace("'", "")
            session_manager.update_session_name(request.session_id, rename)
        except Exception as e:
            print(f"Auto-rename failed: {e}")
    
    # Process the question using backend logic
    start = timer()
    try:
        # Use backend function
        result, b_databaseProblem = backend_logic.query_graph_two_stage(request.message)
        
        # Check result
        if b_databaseProblem:
            firstResult = "資料庫連結異常，請稍後再試。"
        elif not result:
            firstResult = "系統無法處理您的問題，請稍後再試。"
        elif 'result' not in result or not result['result']:
            firstResult = "目前找不到相關資訊，請嘗試用不同的方式再次提問。"
        else:
            firstResult = result['result']
        
        # Generate detailed response (collect from async generator)
        detail = ""
        async for chunk in backend_logic.conclusionAnswer(firstResult, request.message):
            detail += chunk
        
        # Generate outline (collect from async generator)
        outline = ""
        async for chunk in backend_logic.concise_outline(detail, request.message):
            outline += chunk
        
    except Exception as e:
        print(f"Error processing question: {e}")
        outline = "系統發生錯誤"
        detail = "系統發生錯誤，請稍後再試。"
    
    processing_time = timer() - start
    
    # Add assistant response to history
    response_content = {"outline": outline, "detail": detail}
    session_manager.add_message(request.session_id, "assistant", response_content)
    
    return SendMessageResponse(
        success=True,
        message=response_content,
        processing_time=processing_time
    )


@router.post("/chat/voice")
async def voice_input(audio_data: str):
    """
    Voice input endpoint (placeholder for Web Speech API)
    In React, we'll use browser's Web Speech API instead
    """
    return {
        "success": False,
        "error": "Voice input should be handled by browser's Web Speech API"
    }



@router.post("/chat/message/stream")
async def send_message_stream(request: SendMessageRequest):
    """Send a message and get streaming response using Server-Sent Events"""
    import json
    from fastapi.responses import StreamingResponse
    
    session = session_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Add user message to history
    session_manager.add_message(request.session_id, "user", request.message)
    
    # Auto-rename session if it's the first message (使用第一個問題)
    if session.name is None and len(session.history) == 1:
        # 直接使用第一個問題作為會話名稱，限制長度避免太長
        session_name = request.message[:30] + ('...' if len(request.message) > 30 else '')
        session_manager.update_session_name(request.session_id, session_name)
        print(f"會話已命名為: {session_name}")
    
    async def event_generator():
        """生成 SSE 事件"""
        outline_text = ""
        detail_text = ""
        
        try:
            async for event in backend_logic.query_graph_two_stage_stream(request.message):
                # 收集數據
                if event["type"] == "outline_chunk":
                    outline_text += event["content"]
                elif event["type"] == "detail_chunk":
                    detail_text += event["content"]
                elif event["type"] == "done":
                    outline_text = event["outline"]
                    detail_text = event["detail"]
                    
                    # 保存完整回答到歷史記錄
                    response_content = {
                        "outline": outline_text,
                        "detail": detail_text
                    }
                    session_manager.add_message(
                        request.session_id,
                        "assistant",
                        response_content
                    )
                
                # 格式化為 SSE 格式
                sse_data = f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
                yield sse_data
                
        except Exception as e:
            error_event = {"type": "error", "content": f"系統發生錯誤：{str(e)}"}
            yield f"data: {json.dumps(error_event, ensure_ascii=False)}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # 禁用 nginx 緩衝
        }
    )


@router.get("/doctor/patients")
async def get_doctor_patients(doctor: str = Query(...)):
    """Get patient list for a doctor"""
    sessions = session_manager.get_sessions_by_doctor(doctor)
    
    # 提取唯一病患
    patients = {}
    for session in sessions:
        user_id = session.user_id
        if user_id and user_id not in patients:
            # 從user_id提取病患名稱和email (格式: name_email)
            parts = user_id.split('_', 1)  # Split only on first underscore
            name = parts[0] if len(parts) > 0 else user_id
            email = parts[1] if len(parts) > 1 else ""
            
            patients[user_id] = {
                "user_id": user_id,
                "name": name,
                "email": email,  # 新增：病患email
                "session_count": 0,
                "last_activity": session.updated_at.isoformat()
            }
        
        if user_id:
            patients[user_id]["session_count"] += 1
            # 更新最後活動時間
            if session.updated_at.isoformat() > patients[user_id]["last_activity"]:
                patients[user_id]["last_activity"] = session.updated_at.isoformat()
    
    return list(patients.values())


@router.get("/doctor/sessions")
async def get_doctor_sessions(doctor: str = Query(...)):
    """Get all sessions for a specific doctor, grouped by patient"""
    sessions = session_manager.get_sessions_by_doctor(doctor)
    
    # 按病患分組
    patients = {}
    for session in sessions:
        user_id = session.user_id
        if user_id not in patients:
            patients[user_id] = []
        patients[user_id].append({
            "id": session.id,
            "name": session.name,
            "history": session.history,
            "created_at": session.created_at.isoformat(),
            "updated_at": session.updated_at.isoformat()
        })
    
    return {
        "doctor": doctor,
        "total_patients": len(patients),
        "patients": patients
    }

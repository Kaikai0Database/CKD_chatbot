"""
Admin API endpoints
Handles admin functionality like question logs
"""
from fastapi import APIRouter, HTTPException
import os
import json
from models.schemas import QuestionRecord, QuestionRecordsResponse

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/questions", response_model=QuestionRecordsResponse)
async def get_question_records():
    """Get all question records"""
    records = []
    
    if os.path.exists("questions_log.jsonl"):
        try:
            with open("questions_log.jsonl", "r", encoding="utf-8") as f:
                for line in f:
                    try:
                        record_dict = json.loads(line)
                        records.append(QuestionRecord(**record_dict))
                    except:
                        continue
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error reading logs: {str(e)}")
    
    return QuestionRecordsResponse(records=records)


@router.post("/questions/log")
async def log_question(patient_name: str, question: str):
    """Log a patient question"""
    from datetime import datetime
    
    question_record = {
        "timestamp": datetime.now().isoformat(),
        "patient_name": patient_name,
        "question": question
    }
    
    try:
        with open("questions_log.jsonl", "a", encoding="utf-8") as f:
            f.write(json.dumps(question_record, ensure_ascii=False) + "\n")
        return {"success": True, "message": "Question logged"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error logging question: {str(e)}")

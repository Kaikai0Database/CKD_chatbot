"""
FastAPI Main Application
Entry point for the CKD Chatbot backend API
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import auth, chat, profile, admin, doctor_auth

# Create FastAPI app
app = FastAPI(
    title="CKD Chatbot API",
    description="Backend API for CKD Kidney Health Q&A System",
    version="2.0.0"
)

# Configure CORS to allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev server
        "http://localhost:5173",  # Vite dev server
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(profile.router)
app.include_router(admin.router)
app.include_router(doctor_auth.router)


@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "CKD Chatbot API",
        "version": "2.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

# CKD 慢性腎臟病聊天機器人系統 - 技術文檔

## 📋 目錄

1. [專案概述](#專案概述)
2. [系統架構](#系統架構)
3. [目錄結構](#目錄結構)
4. [重要檔案說明](#重要檔案說明)
5. [環境設置](#環境設置)
6. [啟動服務](#啟動服務)
7. [開發指南](#開發指南)
8. [API 文檔](#api-文檔)
9. [資料庫結構](#資料庫結構)

---

## 專案概述

這是一個針對慢性腎臟病（CKD）患者的智能問答系統，結合了知識圖譜和大型語言模型，提供準確的醫療資訊。系統包含：

- **病患端**：對話式問答介面
- **醫師端**：病患對話觀察平台（含密碼認證）
- **後端**：FastAPI + Neo4j + LLM
- **前端**：React + TypeScript + Vite

---

## 系統架構

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   前端 UI   │ ◄────► │  FastAPI 後端  │ ◄────► │   Neo4j    │
│  (React)    │         │   (Python)    │         │  知識圖譜   │
└─────────────┘         └──────────────┘         └─────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  Ollama LLM  │
                        │  (本地部署)   │
                        └──────────────┘
```

### 資料流程
1. 使用者輸入問題 → 前端
2. 前端發送請求 → 後端 API
3. 後端分析問題 → 查詢 Neo4j 知識圖譜
4. 後端整合資訊 → LLM 生成回答
5. 回答串流傳回 → 前端顯示

---

## 目錄結構

```
CKD_chatbot_try/
├── backend/                      # 後端 FastAPI 應用
│   ├── api/                      # API 路由
│   │   ├── auth.py              # 病患認證 API
│   │   ├── doctor_auth.py       # 醫師認證 API (新增)
│   │   ├── chat.py              # 聊天 API
│   │   ├── profile.py           # 用戶資料 API
│   │   └── admin.py             # 管理員 API
│   ├── models/                   # 資料模型
│   │   ├── schemas.py           # Pydantic 模型
│   │   └── doctor.py            # 醫師資料模型 (新增)
│   ├── utils/                    # 工具函數
│   │   ├── session_manager.py  # Session 管理
│   │   ├── neo4j_client.py     # Neo4j 連接
│   │   ├── doctor_db.py        # 醫師資料庫管理 (新增)
│   │   └── password.py         # 密碼加密工具 (新增)
│   ├── scripts/                  # 腳本工具
│   │   └── create_neo4j_indexes.py
│   ├── main.py                   # FastAPI 主程式
│   └── doctors.db               # SQLite 資料庫 (自動生成)
│
├── frontend/                     # 前端 React 應用
│   ├── src/
│   │   ├── components/          # React 組件
│   │   │   ├── Chat/
│   │   │   │   ├── ChatMessage.tsx      # 訊息顯示組件
│   │   │   │   ├── ChatSidebar.tsx      # 側邊欄組件
│   │   │   │   └── ChatInput.tsx        # 輸入框組件
│   │   │   └── ...
│   │   ├── pages/               # 頁面組件
│   │   │   ├── RoleSelectionPage.tsx   # 角色選擇頁
│   │   │   ├── LoginPage.tsx            # 病患登入頁
│   │   │   ├── ChatPage.tsx             # 聊天頁面
│   │   │   ├── DoctorLoginPage.tsx      # 醫師登入頁 (新增)
│   │   │   ├── DoctorRegisterPage.tsx   # 醫師註冊頁 (新增)
│   │   │   ├── DoctorForgotPasswordPage.tsx  # 忘記密碼頁 (新增)
│   │   │   ├── DoctorResetPasswordPage.tsx   # 重置密碼頁 (新增)
│   │   │   └── DoctorDashboard.tsx      # 醫師觀察平台
│   │   ├── services/            # API 服務層
│   │   │   ├── authService.ts          # 認證服務
│   │   │   ├── chatService.ts          # 聊天服務
│   │   │   └── doctorService.ts        # 醫師服務
│   │   ├── store/               # 狀態管理 (Zustand)
│   │   │   ├── authStore.ts            # 認證狀態
│   │   │   └── chatStore.ts            # 聊天狀態
│   │   ├── App.tsx              # React 根組件
│   │   ├── main.tsx             # 入口文件
│   │   └── index.css            # 全局樣式
│   ├── package.json
│   └── vite.config.ts
│
├── core_logic.py                # 核心對話邏輯
├── CKD_Chatbot.py              # Streamlit 舊版界面 (已棄用)
├── requirements.txt            # Python 依賴
└── README.md                   # 本文檔
```

---

## 重要檔案說明

### 後端核心檔案

#### `backend/main.py`
**功能**：FastAPI 應用程式主入口
```python
# 主要內容：
- 創建 FastAPI app
- CORS 配置（允許前端跨域請求）
- 註冊所有 API 路由
- 啟動服務器
```

#### `backend/api/auth.py`
**功能**：病患身份認證 API
```python
# 端點：
POST /api/auth/login          # 病患登入
POST /api/auth/anonymous      # 匿名登入

# 主要功能：
- 生成 user_id (格式: name_email)
- 管理 active_users 字典
- 返回用戶資訊
```

#### `backend/api/doctor_auth.py` ⭐ 新增
**功能**：醫師認證系統 API
```python
# 端點：
POST /api/doctor/register              # 醫師註冊
POST /api/doctor/login                 # 醫師登入（email + 密碼）
POST /api/doctor/forgot-password       # 忘記密碼
POST /api/doctor/reset-password        # 重置密碼
DELETE /api/doctor/session/{session_id} # 刪除 session

# 安全特性：
- bcrypt 密碼加密
- Token 驗證（1小時有效期）
- 權限檢查
```

#### `backend/api/chat.py`
**功能**：聊天相關 API
```python
# 端點：
POST /api/chat                     # 發送訊息（串流回應）
GET /api/sessions                  # 獲取 sessions
POST /api/sessions                 # 創建新 session
DELETE /api/sessions/{session_id}  # 刪除 session
GET /api/doctor/patients           # 醫師獲取病患列表

# 核心功能：
- Session 管理
- 訊息歷史記錄
- 串流回應（SSE）
- 整合 core_logic.py
```

#### `backend/utils/doctor_db.py` ⭐ 新增
**功能**：SQLite 資料庫管理
```python
class DoctorDatabase:
    # 資料表：
    - doctors (醫師資料)
    - password_reset_tokens (重置 token)
    
    # 方法：
    - create_doctor()
    - get_doctor_by_email()
    - update_doctor()
    - create_reset_token()
    - verify_token()
```

#### `backend/utils/session_manager.py`
**功能**：Session 資料管理
```python
class SessionManager:
    # 功能：
    - 管理 sessions.json
    - 創建/讀取/更新/刪除 session
    - 訊息歷史記錄
    - 多用戶 session 隔離
```

#### `core_logic.py`
**功能**：對話生成核心邏輯
```python
# 主要函數：
query_graph_two_stage_stream(user_query, session_id, ...)
    ↓
1. 提取關鍵字（使用 LLM）
2. 查詢 Neo4j 知識圖譜
3. 整合知識生成回答
4. 串流返回

# 依賴：
- Ollama LLM (llama3.2:latest)
- Neo4j 資料庫
- LangChain
```

### 前端核心檔案

#### `frontend/src/App.tsx`
**功能**：React 應用根組件
```typescript
// 功能：
- 路由配置（React Router）
- 全局狀態初始化
- 頁面導航

// 路由：
/ - 角色選擇頁
/login - 病患登入
/chat - 聊天介面
/doctor/login - 醫師登入
/doctor/register - 醫師註冊
/doctor/forgot-password - 忘記密碼
/doctor/reset-password - 重置密碼
/doctor/dashboard - 醫師觀察平台
```

#### `frontend/src/pages/ChatPage.tsx`
**功能**：主要聊天介面
```typescript
// 核心功能：
- 訊息顯示與發送
- Session 切換
- 載入聊天歷史
- 串流訊息接收
- 側邊欄控制

// 狀態管理：
- 使用 Zustand (authStore, chatStore)
- 本地狀態 (useState)
```

#### `frontend/src/pages/DoctorDashboard.tsx` ⭐ 更新
**功能**：醫師觀察平台
```typescript
// 功能：
- 顯示病患列表
- 查看病患對話記錄
- 刪除 session（含確認對話框）
- Session 數量統計

// UI 組件：
- 病患側邊欄
- 對話內容區域
- 刪除確認 Modal
```

#### `frontend/src/services/`
**功能**：API 調用封裝
```typescript
// authService.ts - 病患認證服務
- login()
- loginAnonymous()

// chatService.ts - 聊天服務
- sendMessage()
- getSessions()
- createSession()
- deleteSession()

// doctorService.ts - 醫師服務
- getPatients()
- getPatientSessions()
```

#### `frontend/src/store/authStore.ts`
**功能**：認證狀態管理（Zustand）
```typescript
interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
  loginAnonymous: (user: User) => void
}

// 特色：
- 持久化（localStorage）
- 全局狀態共享
```

---

## 環境設置

### 系統需求

```
作業系統：Windows / Linux / macOS
Python：3.9+
Node.js：18+
Neo4j：4.x / 5.x
Ollama：最新版本
```

### 1. 安裝 Python 依賴

```bash
cd backend
pip install -r ../requirements.txt
```

**主要依賴：**
- `fastapi` - Web 框架
- `uvicorn` - ASGI 服務器
- `neo4j` - Neo4j Python 驅動
- `langchain` - LLM 框架
- `bcrypt` - 密碼加密
- `pydantic` - 資料驗證

### 2. 安裝前端依賴

```bash
cd frontend
npm install
```

**主要依賴：**
- `react` - UI 框架
- `react-router-dom` - 路由
- `zustand` - 狀態管理
- `framer-motion` - 動畫
- `lucide-react` - 圖示庫

### 3. 設置 Neo4j

**選項 A：使用 Neo4j Desktop**
1. 下載並安裝 [Neo4j Desktop](https://neo4j.com/download/)
2. 創建新資料庫
3. 啟動資料庫
4. 記錄連接資訊（通常是 `bolt://localhost:7687`）

**選項 B：使用 Docker**
```bash
docker run \
    --name neo4j \
    -p7474:7474 -p7687:7687 \
    -d \
    -e NEO4J_AUTH=neo4j/your_password \
    neo4j:latest
```

### 4. 設置 Ollama

```bash
# 安裝 Ollama
# Windows: 從官網下載安裝器
# Linux/Mac: curl -fsSL https://ollama.com/install.sh | sh

# 下載模型
ollama pull llama3.2:latest
ollama pull llama3.1:8b

# 啟動服務（通常自動啟動）
ollama serve
```

### 5. 配置環境變數

創建 `backend/.env`（可選）：
```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
OLLAMA_BASE_URL=http://localhost:11434
```

---

## 啟動服務

### 🚀 完整啟動流程

#### 1. 啟動 Neo4j
```bash
# 使用 Neo4j Desktop：點擊 Start
# 或使用 Docker：
docker start neo4j
```

#### 2. 啟動 Ollama
```bash
# Windows: 已自動啟動
# Linux/Mac:
ollama serve
```

#### 3. 啟動後端服務器

```bash
cd backend
python -m uvicorn main:app --reload --port 8000

# 或使用：
cd backend
uvicorn main:app --reload --port 8000
```

**訪問：**
- API：http://localhost:8000
- API 文檔：http://localhost:8000/docs
- Health Check：http://localhost:8000/health

**參數說明：**
- `--reload`：代碼更改時自動重啟（開發模式）
- `--port 8000`：指定端口
- `--host 0.0.0.0`：允許外部訪問（可選）

#### 4. 啟動前端開發服務器

```bash
cd frontend
npm run dev
```

**訪問：**
- 前端：http://localhost:5173

### 📝 快速啟動腳本

**Windows (PowerShell)：**
創建 `start.ps1`：
```powershell
# 啟動後端
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn main:app --reload --port 8000"

# 等待2秒
Start-Sleep -Seconds 2

# 啟動前端
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Services started!"
Write-Host "Backend: http://localhost:8000"
Write-Host "Frontend: http://localhost:5173"
```

**Linux/Mac (Bash)：**
創建 `start.sh`：
```bash
#!/bin/bash

# 啟動後端
cd backend
python -m uvicorn main:app --reload --port 8000 &

# 啟動前端
cd ../frontend
npm run dev &

echo "Services started!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
```

```bash
chmod +x start.sh
./start.sh
```

---

## 開發指南

### 修改後端 API

1. **新增 API 端點**
   - 在 `backend/api/` 創建或修改路由文件
   - 在 `backend/main.py` 註冊路由

2. **修改資料模型**
   - 編輯 `backend/models/schemas.py`
   - 使用 Pydantic 定義模型

3. **修改資料庫邏輯**
   - Session 管理：`backend/utils/session_manager.py`
   - 醫師資料：`backend/utils/doctor_db.py`

### 修改前端 UI

1. **新增頁面**
   - 在 `frontend/src/pages/` 創建 `.tsx` 文件
   - 在 `App.tsx` 添加路由

2. **修改樣式**
   - 全局樣式：`frontend/src/index.css`
   - 組件內樣式：使用 Tailwind CSS

3. **狀態管理**
   - 認證狀態：`frontend/src/store/authStore.ts`
   - 聊天狀態：`frontend/src/store/chatStore.ts`

### 修改對話邏輯

編輯 `core_logic.py`：
```python
def query_graph_two_stage_stream(...):
    # 1. 修改關鍵字提取 prompt
    # 2. 調整 Neo4j 查詢
    # 3. 修改回答生成 prompt
```

---

## API 文檔

### 病患認證

**POST `/api/auth/login`**
```json
// Request
{
  "name": "陳立凱",
  "doctor": "黃秋錦 Chiu-Ching Huang",
  "patient_email": "patient@example.com"
}

// Response
{
  "success": true,
  "user": {
    "id": "陳立凱_patient@example.com",
    "name": "陳立凱",
    "doctor": "黃秋錦 Chiu-Ching Huang",
    "email": "patient@example.com"
  }
}
```

### 醫師認證

**POST `/api/doctor/register`** ⭐ 新增
```json
// Request
{
  "name": "黃秋錦 Chiu-Ching Huang",
  "email": "doctor@hospital.com",
  "password": "SecurePassword123"
}

// Response
{
  "success": true,
  "doctor": {
    "id": "doctor_abc123",
    "name": "黃秋錦 Chiu-Ching Huang",
    "email": "doctor@hospital.com"
  }
}
```

**POST `/api/doctor/login`** ⭐ 新增
```json
// Request
{
  "email": "doctor@hospital.com",
  "password": "SecurePassword123"
}

// Response
{
  "success": true,
  "user": {
    "id": "doctor_abc123",
    "name": "黃秋錦 Chiu-Ching Huang",
    "doctor": "黃秋錦 Chiu-Ching Huang",
    "email": "doctor@hospital.com",
    "is_doctor": true
  }
}
```

### 聊天功能

**POST `/api/chat`** (Server-Sent Events)
```json
// Request
{
  "message": "什麼是慢性腎臟病？",
  "session_id": "session_uuid",
  "user_id": "user_123"
}

// Response (Stream)
data: {"type": "token", "content": "慢性"}
data: {"type": "token", "content": "腎臟"}
data: {"type": "token", "content": "病"}
...
data: {"type": "done"}
```

**GET `/api/sessions?user_id={user_id}&doctor={doctor}`**
```json
// Response
[
  {
    "id": "session_uuid",
    "name": "關於 CKD 的對話",
    "history": [...],
    "created_at": "2025-12-04T10:00:00",
    "updated_at": "2025-12-04T11:00:00"
  }
]
```

### Session 管理

**DELETE `/api/doctor/session/{session_id}?doctor_id={doctor_id}`** ⭐ 新增
```json
// Response
{
  "success": true,
  "message": "Session deleted successfully"
}
```

---

## 資料庫結構

### SQLite (doctors.db) ⭐ 新增

**doctors 表**
```sql
CREATE TABLE doctors (
    id TEXT PRIMARY KEY,          -- doctor_abc123
    name TEXT NOT NULL,           -- 黃秋錦 Chiu-Ching Huang
    email TEXT UNIQUE NOT NULL,   -- doctor@hospital.com
    password_hash TEXT NOT NULL,  -- bcrypt hash
    created_at TEXT NOT NULL,     -- 2025-12-04T10:00:00
    last_login TEXT               -- 2025-12-04T11:00:00
);
```

**password_reset_tokens 表**
```sql
CREATE TABLE password_reset_tokens (
    token TEXT PRIMARY KEY,             -- random_token_xyz
    doctor_email TEXT NOT NULL,         -- doctor@hospital.com
    expires_at TEXT NOT NULL,           -- 2025-12-04T12:00:00
    FOREIGN KEY (doctor_email) REFERENCES doctors(email)
);
```

### JSON (sessions.json)

```json
{
  "user_123": {
    "sessions": [
      {
        "id": "session_uuid",
        "name": "關於 CKD 的對話",
        "history": [
          {
            "role": "user",
            "content": "什麼是慢性腎臟病？"
          },
          {
            "role": "assistant",
            "content": {
              "outline": "簡要說明...",
              "detail": "詳細解釋..."
            }
          }
        ],
        "created_at": "2025-12-04T10:00:00",
        "updated_at": "2025-12-04T11:00:00"
      }
    ]
  }
}
```

### Neo4j 知識圖譜

**節點類型：**
- `Disease`：疾病
- `Symptom`：症狀
- `Treatment`：治療方式
- `Medication`：藥物
- `Diet`：飲食建議
- ...

**關係類型：**
- `HAS_SYMPTOM`
- `TREATED_BY`
- `CAUSES`
- `PREVENTS`
- ...

---

## 故障排除

### 常見問題

**Q: 後端啟動失敗 - ModuleNotFoundError**
```bash
# 重新安裝依賴
pip install -r requirements.txt
```

**Q: 前端啟動失敗 - npm error**
```bash
# 清除 cache 重新安裝
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Q: Neo4j 連接失敗**
```
1. 檢查 Neo4j 是否正在運行
2. 確認連接資訊正確
3. 檢查防火牆設置
```

**Q: Ollama 無法使用**
```bash
# 檢查 Ollama 服務
ollama list

# 重新拉取模型
ollama pull llama3.2:latest
```

**Q: CORS 錯誤**
```
確保 backend/main.py 的 CORS 設置包含前端 URL
allow_origins=["http://localhost:5173", ...]
```

---

## 聯絡資訊

- **專案負責人**：[您的名字]
- **Email**：[您的 Email]
- **GitHub**：[專案連結]

---

## 更新日誌

### v2.0.0 (2025-12-04)
- ✅ 新增醫師密碼認證系統
- ✅ 新增 Session 刪除功能
- ✅ 改用 SQLite 資料庫儲存醫師資料
- ✅ 完善前端 UI/UX

### v1.0.0
- ✅ 基本聊天功能
- ✅ Neo4j 知識圖譜整合
- ✅ 醫師觀察平台
- ✅ Session 管理

---

## 授權

[您的授權協議]

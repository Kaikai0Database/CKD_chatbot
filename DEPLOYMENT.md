# Linux 伺服器部署指南

## 📋 目錄
1. [前置準備](#前置準備)
2. [打包專案](#打包專案)
3. [伺服器環境設置](#伺服器環境設置)
4. [部署流程](#部署流程)
5. [配置服務](#配置服務)
6. [使用 Nginx 反向代理](#使用-nginx-反向代理)
7. [監控與維護](#監控與維護)

---

## 前置準備

### 已安裝項目
- ✅ CUDA
- ✅ Ollama

### 需要安裝的項目
- Python 3.9+
- Node.js 18+
- Neo4j
- Nginx（可選，用於反向代理）
- Git

---

## 打包專案

### 方法 1：使用 Git（推薦）

在您的開發機器上：

```bash
# 1. 確保專案已經初始化 Git（如果還沒有）
cd c:\python\coding\CKD_chatbot_try
git init

# 2. 添加 .gitignore
# 創建 .gitignore 文件（見下方）

# 3. 提交所有代碼
git add .
git commit -m "Initial commit"

# 4. 推送到 GitHub/GitLab（或使用內部 Git 伺服器）
git remote add origin <your-git-repository-url>
git push -u origin main
```

**創建 `.gitignore`：**
```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
*.egg-info/

# Node
node_modules/
dist/
build/
*.log

# 資料庫
*.db
*.sqlite
doctors.db
sessions.json
password_reset_tokens.json

# 環境變數
.env
.env.local

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Neo4j
neo4j/
```

### 方法 2：直接打包（不使用 Git）

```bash
# 在開發機器上
cd c:\python\coding
tar -czf CKD_chatbot_deploy.tar.gz CKD_chatbot_try/ --exclude='node_modules' --exclude='__pycache__' --exclude='venv' --exclude='*.db'

# 或使用 zip
# 先手動刪除 node_modules、__pycache__、venv 等大型目錄
# 然後壓縮
```

---

## 伺服器環境設置

### 1. 連接到伺服器

```bash
ssh user@your-server-ip
```

### 2. 更新系統

```bash
sudo apt update
sudo apt upgrade -y
```

### 3. 安裝 Python 和相關工具

```bash
# 安裝 Python 3.9+
sudo apt install python3 python3-pip python3-venv -y

# 確認版本
python3 --version
pip3 --version
```

### 4. 安裝 Node.js 18+

```bash
# 使用 NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 確認版本
node --version
npm --version
```

### 5. 安裝 Neo4j

#### 方法 A：使用 Docker（推薦）

```bash
# 安裝 Docker
sudo apt install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker

# 拉取並運行 Neo4j
sudo docker run \
    --name neo4j \
    --restart=always \
    -p 7474:7474 -p 7687:7687 \
    -d \
    -v $HOME/neo4j/data:/data \
    -v $HOME/neo4j/logs:/logs \
    -e NEO4J_AUTH=neo4j/your_strong_password \
    neo4j:latest

# 查看狀態
sudo docker ps
```

#### 方法 B：直接安裝

```bash
# 添加 Neo4j repository
wget -O - https://debian.neo4j.com/neotechnology.gpg.key | sudo apt-key add -
echo 'deb https://debian.neo4j.com stable latest' | sudo tee /etc/apt/sources.list.d/neo4j.list

# 安裝
sudo apt update
sudo apt install neo4j -y

# 啟動服務
sudo systemctl enable neo4j
sudo systemctl start neo4j

# 設置密碼
sudo neo4j-admin set-initial-password your_strong_password
```

### 6. 安裝 Git（如果使用方法 1）

```bash
sudo apt install git -y
```

### 7. 安裝 Nginx（可選，用於反向代理）

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## 部署流程

### 步驟 1：上傳專案到伺服器

#### 使用 Git：

```bash
# 在伺服器上
cd ~
git clone <your-git-repository-url> CKD_chatbot
cd CKD_chatbot
```

#### 使用 SCP（如果使用打包方式）：

```bash
# 在本地機器上
scp CKD_chatbot_deploy.tar.gz user@your-server-ip:~

# 在伺服器上
cd ~
tar -xzf CKD_chatbot_deploy.tar.gz
mv CKD_chatbot_try CKD_chatbot
cd CKD_chatbot
```

### 步驟 2：設置 Python 虛擬環境

```bash
# 在專案目錄中
cd ~/CKD_chatbot

# 創建虛擬環境
python3 -m venv venv

# 啟動虛擬環境
source venv/bin/activate

# 安裝 Python 依賴
pip install --upgrade pip
pip install -r requirements.txt

# 特別注意：如果有 GPU，安裝對應的 torch 版本
# pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### 步驟 3：安裝前端依賴並編譯

```bash
cd ~/CKD_chatbot/frontend

# 安裝依賴
npm install

# 編譯生產版本
npm run build

# build 後的檔案會在 frontend/dist/ 目錄中
```

### 步驟 4：配置 Ollama

```bash
# Ollama 應該已經安裝並運行

# 下載所需的模型
ollama pull llama3.2:latest
ollama pull llama3.1:8b

# 確認模型已下載
ollama list

# 確保 Ollama 服務正在運行
sudo systemctl status ollama
# 如果沒有運行：
# sudo systemctl start ollama
# sudo systemctl enable ollama
```

### 步驟 5：配置環境變數

```bash
# 在專案根目錄創建 .env 文件
cd ~/CKD_chatbot/backend
nano .env
```

**`.env` 內容：**
```env
# Neo4j Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_strong_password

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434

# Application Settings
ENVIRONMENT=production
DEBUG=False
```

### 步驟 6：初始化 Neo4j 索引（如果需要）

```bash
cd ~/CKD_chatbot/backend
source ../venv/bin/activate
python scripts/create_neo4j_indexes.py
```

---

## 配置服務

### 使用 Systemd 管理後端服務

#### 創建後端服務文件

```bash
sudo nano /etc/systemd/system/ckd-backend.service
```

**內容：**
```ini
[Unit]
Description=CKD Chatbot Backend API
After=network.target neo4j.service

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/CKD_chatbot/backend
Environment="PATH=/home/YOUR_USERNAME/CKD_chatbot/venv/bin"
ExecStart=/home/YOUR_USERNAME/CKD_chatbot/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**注意：** 將 `YOUR_USERNAME` 替換為您的實際用戶名

#### 啟動後端服務

```bash
# 重新載入 systemd
sudo systemctl daemon-reload

# 啟動服務
sudo systemctl start ckd-backend

# 設置開機自動啟動
sudo systemctl enable ckd-backend

# 查看狀態
sudo systemctl status ckd-backend

# 查看日誌
sudo journalctl -u ckd-backend -f
```

### 使用 Nginx 提供前端靜態文件

#### 配置 Nginx

```bash
sudo nano /etc/nginx/sites-available/ckd-chatbot
```

**內容：**
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 或使用伺服器 IP

    # 前端靜態文件
    location / {
        root /home/YOUR_USERNAME/CKD_chatbot/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # 添加快取頭
        add_header Cache-Control "public, max-age=3600";
    }

    # 後端 API 反向代理
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # SSE 支持（串流回應）
        proxy_buffering off;
        proxy_read_timeout 300s;
    }

    # 健康檢查
    location /health {
        proxy_pass http://localhost:8000/health;
    }
}
```

#### 啟用網站

```bash
# 創建符號連結
sudo ln -s /etc/nginx/sites-available/ckd-chatbot /etc/nginx/sites-enabled/

# 測試配置
sudo nginx -t

# 重新載入 Nginx
sudo systemctl reload nginx
```

---

## 使用 Nginx 反向代理

### 配置 HTTPS（可選但推薦）

使用 Let's Encrypt 免費 SSL 證書：

```bash
# 安裝 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 獲取證書
sudo certbot --nginx -d your-domain.com

# 自動續期（已自動配置）
sudo certbot renew --dry-run
```

Certbot 會自動修改 Nginx 配置以支持 HTTPS。

---

## 快速部署腳本

創建一個自動化部署腳本：

```bash
nano ~/CKD_chatbot/deploy.sh
```

**`deploy.sh` 內容：**
```bash
#!/bin/bash

echo "=== CKD Chatbot 部署腳本 ==="

# 顏色定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 項目目錄
PROJECT_DIR="$HOME/CKD_chatbot"

# 1. 更新代碼（如果使用 Git）
echo -e "${YELLOW}1. 更新代碼...${NC}"
cd $PROJECT_DIR
git pull origin main

# 2. 更新後端依賴
echo -e "${YELLOW}2. 更新後端依賴...${NC}"
cd $PROJECT_DIR
source venv/bin/activate
pip install -r requirements.txt

# 3. 編譯前端
echo -e "${YELLOW}3. 編譯前端...${NC}"
cd $PROJECT_DIR/frontend
npm install
npm run build

# 4. 重啟後端服務
echo -e "${YELLOW}4. 重啟後端服務...${NC}"
sudo systemctl restart ckd-backend

# 5. 重新載入 Nginx
echo -e "${YELLOW}5. 重新載入 Nginx...${NC}"
sudo systemctl reload nginx

# 6. 檢查服務狀態
echo -e "${YELLOW}6. 檢查服務狀態...${NC}"
echo -e "${GREEN}後端服務狀態：${NC}"
sudo systemctl status ckd-backend --no-pager | head -10

echo -e "${GREEN}Nginx 狀態：${NC}"
sudo systemctl status nginx --no-pager | head -5

echo -e "${GREEN}=== 部署完成！ ===${NC}"
echo -e "前端：http://your-server-ip"
echo -e "API：http://your-server-ip/api"
echo -e "健康檢查：http://your-server-ip/health"
```

**設置執行權限：**
```bash
chmod +x ~/CKD_chatbot/deploy.sh
```

**執行部署：**
```bash
~/CKD_chatbot/deploy.sh
```

---

## 監控與維護

### 查看日誌

```bash
# 後端日誌
sudo journalctl -u ckd-backend -f

# Nginx 訪問日誌
sudo tail -f /var/log/nginx/access.log

# Nginx 錯誤日誌
sudo tail -f /var/log/nginx/error.log

# Neo4j 日誌
sudo docker logs -f neo4j  # 如果使用 Docker
```

### 監控系統資源

```bash
# 安裝 htop
sudo apt install htop -y

# 運行
htop

# 或使用 nvidia-smi 監控 GPU
watch -n 1 nvidia-smi
```

### 備份資料庫

```bash
# 備份 SQLite
cp ~/CKD_chatbot/backend/doctors.db ~/backups/doctors_$(date +%Y%m%d).db

# 備份 Neo4j（如果使用 Docker）
sudo docker exec neo4j neo4j-admin dump --to=/tmp/neo4j-backup.dump
sudo docker cp neo4j:/tmp/neo4j-backup.dump ~/backups/neo4j_$(date +%Y%m%d).dump
```

### 定期備份腳本

```bash
# 創建備份腳本
nano ~/backup.sh
```

**`backup.sh` 內容：**
```bash
#!/bin/bash

BACKUP_DIR="$HOME/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 備份 SQLite
cp ~/CKD_chatbot/backend/doctors.db $BACKUP_DIR/doctors_$DATE.db

# 備份 Sessions
cp ~/CKD_chatbot/backend/sessions.json $BACKUP_DIR/sessions_$DATE.json

# 備份 Neo4j
sudo docker exec neo4j neo4j-admin dump --to=/tmp/neo4j-backup.dump
sudo docker cp neo4j:/tmp/neo4j-backup.dump $BACKUP_DIR/neo4j_$DATE.dump

# 刪除 7 天前的備份
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

**設置 Cron 定時任務：**
```bash
chmod +x ~/backup.sh
crontab -e

# 添加以下行（每天凌晨 2 點備份）
0 2 * * * /home/YOUR_USERNAME/backup.sh >> /home/YOUR_USERNAME/backup.log 2>&1
```

---

## 故障排除

### 後端無法啟動

```bash
# 檢查日誌
sudo journalctl -u ckd-backend -n 50

# 手動測試
cd ~/CKD_chatbot/backend
source ../venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Neo4j 連接失敗

```bash
# 檢查 Neo4j 狀態
sudo docker ps | grep neo4j

# 查看 Neo4j 日誌
sudo docker logs neo4j

# 重啟 Neo4j
sudo docker restart neo4j
```

### Ollama 無法使用

```bash
# 檢查 Ollama 狀態
systemctl status ollama

# 測試模型
ollama list
ollama run llama3.2:latest "Hello"
```

### Nginx 502 Bad Gateway

```bash
# 檢查後端是否運行
curl http://localhost:8000/health

# 檢查 Nginx 錯誤日誌
sudo tail -f /var/log/nginx/error.log
```

---

## 性能優化

### 1. 使用 Gunicorn（多進程）

修改 systemd 服務文件：
```ini
ExecStart=/home/YOUR_USERNAME/CKD_chatbot/venv/bin/gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### 2. 啟用 Gzip 壓縮

在 Nginx 配置中添加：
```nginx
gzip on;
gzip_vary on;
gzip_types text/plain text/css application/json application/javascript;
```

### 3. 配置前端快取

在 Nginx 配置中：
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## 安全建議

1. **防火牆設置**
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

2. **定期更新系統**
```bash
sudo apt update && sudo apt upgrade -y
```

3. **使用環境變數存儲敏感資訊**
   - 不要將密碼寫死在代碼中
   - 使用 `.env` 文件

4. **限制 API 訪問**
   - 考慮添加 API Rate Limiting
   - 使用 CORS 限制允許的來源

---

## 總結

完成以上步驟後，您的 CKD Chatbot 系統將在 Linux 伺服器上運行：

- ✅ 前端：http://your-server-ip
- ✅ API：http://your-server-ip/api
- ✅ 自動重啟（systemd）
- ✅ 日誌記錄
- ✅ 定期備份

如有任何問題，請查看日誌並參考故障排除章節。

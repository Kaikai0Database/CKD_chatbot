#!/bin/bash

# CKD Chatbot 快速部署腳本
# 用於 Linux 伺服器（已安裝 CUDA 和 Ollama）

set -e  # 遇到錯誤立即退出

# 顏色定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}  CKD Chatbot 自動部署腳本${NC}"
echo -e "${BLUE}==================================${NC}"
echo ""

# 檢查是否為 root 用戶
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}請不要使用 root 用戶運行此腳本${NC}"
    exit 1
fi

# 配置變數
PROJECT_DIR="$HOME/CKD_chatbot"
NEO4J_PASSWORD="changeme123"  # 請修改為強密碼

# 1. 安裝系統依賴
echo -e "${YELLOW}[1/10] 更新系統並安裝依賴...${NC}"
sudo apt update
sudo apt install -y python3 python3-pip python3-venv nodejs npm git docker.io nginx

# 2. 設置專案目錄
echo -e "${YELLOW}[2/10] 創建專案目錄...${NC}"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# 3. 克隆或解壓專案
echo -e "${YELLOW}[3/10] 獲取專案代碼...${NC}"
echo "請選擇部署方式："
echo "1) 從 Git 倉庫克隆"
echo "2) 從本地壓縮包解壓"
read -p "請選擇 (1 或 2): " deploy_method

if [ "$deploy_method" == "1" ]; then
    read -p "請輸入 Git 倉庫 URL: " git_url
    git clone $git_url $PROJECT_DIR
elif [ "$deploy_method" == "2" ]; then
    read -p "請輸入壓縮包路徑: " archive_path
    tar -xzf $archive_path -C $PROJECT_DIR --strip-components=1
else
    echo -e "${RED}無效的選擇${NC}"
    exit 1
fi

# 4. 設置 Python 環境
echo -e "${YELLOW}[4/10] 設置 Python 虛擬環境...${NC}"
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 5. 設置前端
echo -e "${YELLOW}[5/10] 安裝前端依賴並編譯...${NC}"
cd frontend
npm install
npm run build
cd ..

# 6. 啟動 Neo4j Docker 容器
echo -e "${YELLOW}[6/10] 啟動 Neo4j 資料庫...${NC}"
sudo systemctl start docker
sudo systemctl enable docker

sudo docker run \
    --name neo4j \
    --restart=always \
    -p 7474:7474 -p 7687:7687 \
    -d \
    -v $HOME/neo4j/data:/data \
    -v $HOME/neo4j/logs:/logs \
    -e NEO4J_AUTH=neo4j/$NEO4J_PASSWORD \
    neo4j:latest

echo -e "${GREEN}等待 Neo4j 啟動...${NC}"
sleep 15

# 7. 配置環境變數
echo -e "${YELLOW}[7/10] 配置環境變數...${NC}"
cat > backend/.env << EOF
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=$NEO4J_PASSWORD
OLLAMA_BASE_URL=http://localhost:11434
ENVIRONMENT=production
DEBUG=False
EOF

# 8. 下載 Ollama 模型
echo -e "${YELLOW}[8/10] 下載 Ollama 模型...${NC}"
ollama pull llama3.2:latest
ollama pull llama3.1:8b

# 9. 創建 systemd 服務
echo -e "${YELLOW}[9/10] 創建系統服務...${NC}"
sudo tee /etc/systemd/system/ckd-backend.service > /dev/null << EOF
[Unit]
Description=CKD Chatbot Backend API
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR/backend
Environment="PATH=$PROJECT_DIR/venv/bin"
ExecStart=$PROJECT_DIR/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 10. 配置 Nginx
echo -e "${YELLOW}[10/10] 配置 Nginx...${NC}"
sudo tee /etc/nginx/sites-available/ckd-chatbot > /dev/null << EOF
server {
    listen 80;
    server_name _;

    location / {
        root $PROJECT_DIR/frontend/dist;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_buffering off;
        proxy_read_timeout 300s;
    }

    location /health {
        proxy_pass http://localhost:8000/health;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/ckd-chatbot /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 啟動服務
echo -e "${GREEN}啟動所有服務...${NC}"
sudo systemctl daemon-reload
sudo systemctl enable ckd-backend
sudo systemctl start ckd-backend
sudo systemctl restart nginx

# 檢查狀態
echo ""
echo -e "${BLUE}==================================${NC}"
echo -e "${GREEN}部署完成！${NC}"
echo -e "${BLUE}==================================${NC}"
echo ""
echo -e "${GREEN}服務狀態：${NC}"
echo -e "後端服務: $(sudo systemctl is-active ckd-backend)"
echo -e "Neo4j: $(sudo docker inspect -f '{{.State.Running}}' neo4j)"
echo -e "Nginx: $(sudo systemctl is-active nginx)"
echo ""
echo -e "${GREEN}訪問地址：${NC}"
echo -e "前端: http://$(hostname -I | awk '{print $1}')"
echo -e "API: http://$(hostname -I | awk '{print $1}')/api"
echo -e "健康檢查: http://$(hostname -I | awk '{print $1}')/health"
echo ""
echo -e "${YELLOW}重要資訊：${NC}"
echo -e "Neo4j 密碼: $NEO4J_PASSWORD"
echo -e "Neo4j 控制台: http://$(hostname -I | awk '{print $1}'):7474"
echo ""
echo -e "${YELLOW}有用的命令：${NC}"
echo -e "查看後端日誌: sudo journalctl -u ckd-backend -f"
echo -e "重啟後端: sudo systemctl restart ckd-backend"
echo -e "查看 Neo4j 日誌: sudo docker logs -f neo4j"
echo ""

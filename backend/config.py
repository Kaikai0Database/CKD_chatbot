import os

# 資料庫
DB_URL = os.getenv("HOSPITAL_DB_URL")
# n8n Webhook
N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL")
# 管理員密碼
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "123456789")

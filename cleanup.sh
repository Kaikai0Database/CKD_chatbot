#!/bin/bash

# CKD Chatbot 專案清理腳本
# 刪除未使用和過時的檔案

set -e

echo "======================================"
echo "  CKD Chatbot 專案清理工具"
echo "======================================"
echo ""

# 確認是否要繼續
read -p "此操作將刪除未使用的檔案。是否繼續？(y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "已取消"
    exit 1
fi

# 創建備份
echo "[1/5] 創建備份..."
BACKUP_FILE="../CKD_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf "$BACKUP_FILE" . --exclude='node_modules' --exclude='venv' --exclude='__pycache__'
echo "✓ 備份已創建: $BACKUP_FILE"
echo ""

# 刪除舊版 Streamlit 界面
echo "[2/5] 刪除舊版界面..."
rm -f CKD_Chatbot.py login.py
rm -rf pages/
echo "✓ 已刪除舊版 Streamlit 界面"
echo ""

# 刪除測試和示範檔案
echo "[3/5] 刪除測試檔案..."
rm -f test.py
rm -rf demo/
echo "✓ 已刪除測試和示範檔案"
echo ""

# 刪除臨時和日誌檔案
echo "[4/5] 刪除臨時檔案..."
rm -f feedback_log.jsonl questions_log.jsonl
rm -f "~\$D衛教機器人流程.docx" 2>/dev/null || true
rm -f "h origin masterexit" git 2>/dev/null || true
rm -f config.py  # 根目錄的 config.py
echo "✓ 已刪除臨時和日誌檔案"
echo ""

# 清理 Python 快取和未使用的後端檔案
echo "[5/5] 清理快取和未使用檔案..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true
rm -f backend/doctors.json backend/password_reset_tokens.json
rm -f backend/utils/password.py
echo "✓ 已清理快取和未使用檔案"
echo ""

# 統計
echo "======================================"
echo "清理完成！"
echo "======================================"
echo ""
echo "已刪除的檔案類型："
echo "  ✓ 舊版 Streamlit 界面"
echo "  ✓ 測試和示範檔案"
echo "  ✓ 臨時和日誌檔案"
echo "  ✓ Python 快取檔案"
echo "  ✓ 重複的配置和資料庫檔案"
echo ""
echo "備份位置: $BACKUP_FILE"
echo ""
echo "建議手動檢查以下目錄："
echo "  - orig/"
echo "  - data/"
echo "  - img/"
echo "  - doc/"
echo ""
echo "如需還原，解壓備份檔案即可。"

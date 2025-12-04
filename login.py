import streamlit as st

# 頁面設定
st.set_page_config(
    page_title="CKD 腎臟衛教問答系統 — 登入",
    layout="centered",
    initial_sidebar_state="collapsed",
)

# 多語系字典
LABELS = {
    "zh-TW": {
        "title": "歡迎使用 CKD 腎臟衛教問答系統",
        "name": "姓名",
        "physician": "主治醫師",
        "email": "主治醫師 Email",
        "login_btn": "驗證並登入",
        "select_lang": "語言切換",
    },
    "en": {
        "title": "Welcome to CKD Education Q&A",
        "name": "Name",
        "physician": "Attending Physician",
        "email": "Physician Email",
        "login_btn": "Verify & Login",
        "select_lang": "Language",
    },
    "zh-CN": {
        "title": "欢迎使用 CKD 肾脏健康问答系统",
        "name": "姓名",
        "physician": "主治医师",
        "email": "主治医师 Email",
        "login_btn": "验证并登录",
        "select_lang": "语言切换",
    },
}

# 語言選擇
lang = st.selectbox(
    LABELS["zh-TW"]["select_lang"],
    options=["zh-TW", "en", "zh-CN"],
    format_func=lambda x: {"zh-TW":"繁體中文", "en":"English", "zh-CN":"简体中文"}[x],
)
L = LABELS[lang]

# 全域 CSS 注入：卡片 & 按鈕
st.markdown(
    """
    <style>
    .login-card {
        background: #f9f9f9;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        max-width: 400px;
        margin: auto;
    }
    .stButton > button {
        background-color: #0066cc;
        color: white;
        width: 100%;
        height: 2.5em;
        border-radius: 8px;
        border: none;
        cursor: pointer;
    }
    .stButton > button:hover {
        background-color: #005bb5;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# 登入卡片
st.markdown('<div class="login-card">', unsafe_allow_html=True)
st.markdown(f"### {L['title']}")
name = st.text_input(L["name"], key="name")
physician = st.text_input(L["physician"], key="physician")
email = st.text_input(L["email"], key="email", help="example@hospital.org")

if st.button(L["login_btn"]):
    # TODO: 呼叫後端驗證 API
    st.success("驗證成功！正在導向主畫面…")
    # st.experimental_rerun()

st.markdown('</div>', unsafe_allow_html=True)

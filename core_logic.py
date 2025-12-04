import os
from langchain_community.graphs import Neo4jGraph
from langchain.chains import GraphCypherQAChain
from langchain.prompts.prompt import PromptTemplate
from langchain_community.chat_models import ChatOllama
from config import DB_URL

# Neo4j configuration
neo4j_url = DB_URL if DB_URL else 'bolt://10.250.80.84:7688'
neo4j_user = 'neo4j'
neo4j_password = '12345678'
neo4j_database = 'kidneyhealthdatabase'

# Initialize LLMs
llm_english = ChatOllama(
    model="llama3.1:8b",
    temperature=0.1,
    num_predict=512,
    num_ctx=2048
)

llm_chinese = ChatOllama(
    model="kenneth85/llama-3-taiwan",
    temperature=0.1,
    num_predict=512,
    num_ctx=2048
)

# Prompts
cypher_generation_template_english = """Generate Neo4j Cypher query for kidney health questions.

Rules:
1. Compatible with Neo4j 5, use CONTAINS for fuzzy matching
2. Relationship: (Category)-[:包含]->(nodes), not reverse
3. Database has Chinese content, search Chinese terms
4. Use LIMIT 10 for all queries

Schema: {schema}

Examples:
Question: Diet for kidney disease?
Answer: ```MATCH (c:Category)-[:包含]->(d:Diet) WHERE c.name CONTAINS "飲食" OR d.description CONTAINS "腎臟" RETURN c, d LIMIT 10;```

Question: Tests for kidney function?
Answer: ```MATCH (c:Category)-[:包含]->(t:Test) WHERE c.name CONTAINS "檢查" OR t.name CONTAINS "檢查" RETURN c, t LIMIT 10;```

Question: {question}
"""

cypher_prompt_english = PromptTemplate(
    template=cypher_generation_template_english,
    input_variables=["schema", "question"]
)

question_translation_template = """
你是一位專業的翻譯專家，負責將中文問題轉換成英文問題，以便在英文資料庫中進行檢索。
請將以下中文問題翻譯成英文，保持問題的核心含義和醫學專業性：

中文問題：{chinese_question}

英文翻譯：
"""

question_translation_prompt = PromptTemplate(
    template=question_translation_template,
    input_variables=["chinese_question"]
)

CYPHER_QA_TEMPLATE_CHINESE = """你是一位腎臟健康衛教助理，根據提供的英文資訊，協助使用者以簡單、清楚的方式理解與腎臟健康有關的問題。
請以溫和、有條理的語氣進行回答，就像是在與人自然對話。
請不要提到「根據提供的資訊」這類語句，也避免重複問題本身。
請保持專業性，說話可以溫和易懂，但是也需保持專業性。
請務必使用繁體中文作答。
嚴禁自我介紹、嚴禁要求使用者提供更多資訊、嚴禁給出與 context 無關的泛泛建議。若 context 不足，請根據現有資訊盡量給出有幫助的建議，或簡要歸納 context 內容。若 context 完全無法回答，才簡短說明目前無法提供具體建議。

提供的英文資訊：
{context}

使用者問題：{question}
有幫助的回答：
"""

qa_prompt_chinese = PromptTemplate(
    input_variables=["context", "question"], template=CYPHER_QA_TEMPLATE_CHINESE
)

cypher_generation_template = """你是 Neo4j 專家，將中文問題轉換成 Cypher 查詢語法。

規則：
1. 相容 Neo4j 5，使用 CONTAINS 進行模糊比對
2. 關係方向：(Category)-[:包含]->(節點)，不可反向
3. 資料庫內容為中文，搜尋中文詞彙
4. 所有查詢使用 LIMIT 10

知識圖譜結構：
{schema}

範例：
問題：腎臟病患者飲食建議？
回答：```MATCH (c:Category)-[:包含]->(d:Diet) WHERE c.name CONTAINS "飲食" OR d.description CONTAINS "腎臟" RETURN c, d LIMIT 10;```

問題：腎功能檢查項目？
回答：```MATCH (c:Category)-[:包含]->(t:Test) WHERE c.name CONTAINS "檢查" OR t.name CONTAINS "檢查" RETURN c, t LIMIT 10;```

問題：如何預防腎臟病？
回答：```MATCH (c:Category)-[:包含]->(e:Education) WHERE c.name CONTAINS "預防" OR e.description CONTAINS "預防" RETURN c, e LIMIT 10;```

問題：{question}
"""

cypher_prompt = PromptTemplate(
    template=cypher_generation_template,
    input_variables=["schema", "question"]
)

CYPHER_QA_TEMPLATE = """你是一位腎臟健康衛教助理，根據提供的資訊，協助使用者以簡單、清楚的方式理解與腎臟健康有關的問題。
請以溫和、有條理的語氣進行回答，就像是在與人自然對話。
請不要提到「根據提供的資訊」這類語句，也避免重複問題本身。
請保持專業性，說話可以溫和易懂，但是也需保持專業性。
請務必使用繁體中文作答。

提供的資訊：
{context}

使用者問題：{question}
有幫助的回答：
"""

qa_prompt = PromptTemplate(
    input_variables=["context", "question"], template=CYPHER_QA_TEMPLATE
)

def connectNeo4j():
    try:
        graph = Neo4jGraph(url=neo4j_url,
                           username=neo4j_user,
                           password=neo4j_password,
                           database=neo4j_database)
    except:
        graph = None
    return graph

def translate_question_to_english(chinese_question):
    """將中文問題翻譯成英文"""
    formatted_prompt = question_translation_prompt.format(chinese_question=chinese_question)
    translation = llm_chinese.invoke(formatted_prompt)
    return translation.content.strip()

def query_graph_two_stage(user_input):
    """兩階段RAG查詢：中文檢索 + 中文回答"""
    b_databaseProblem = False
    graph = connectNeo4j()
    if graph is None:
        b_databaseProblem = True
        return {}, b_databaseProblem

    try:
        print(f"處理問題: {user_input}")

        # 檢查檢索結果是否有效
        def is_valid_result(result):
            """檢查結果是否有效（有內容且不是空回答）"""
            if 'result' not in result or not result['result']:
                print("結果為空或不存在")
                return False
            # 檢查是否有實際的資料庫內容
            if 'intermediate_steps' in result:
                context = result['intermediate_steps'][-1].get('context', [])
                if context:
                    print(f"找到 {len(context)} 個資料庫結果")
                    if len(context) > 1:
                        print("結果多樣化，查詢有效")
                        return True
                    else:
                        print("結果單一，可能需要更精確的查詢")
                        return True
                else:
                    print("沒有找到資料庫內容")
                    return False
            # 檢查結果是否只是通用回答而不是基於資料庫內容
            result_text = result['result'].lower()
            generic_phrases = ['consult with your', 'talk to your doctor', 'speak with your healthcare',
                               'work closely with your']
            if any(phrase in result_text for phrase in generic_phrases):
                print("結果為通用回答，沒有基於資料庫內容")
                return False
            return True

        def get_query_strategy(question):
            """根據問題內容決定查詢策略"""
            question_lower = question.lower()
            test_keywords = ['檢查', '檢驗', '測試', '化驗', '診斷', '篩檢', '監測']
            diet_keywords = ['吃', '飲食', '食物', '營養', '禁忌', '避免']
            drug_keywords = ['藥物', '藥', '治療', '用藥', '副作用']
            education_keywords = ['預防', '保健', '教育', '知識', '了解']

            if any(keyword in question_lower for keyword in test_keywords):
                return "test"
            elif any(keyword in question_lower for keyword in diet_keywords):
                return "diet"
            elif any(keyword in question_lower for keyword in drug_keywords):
                return "drug"
            elif any(keyword in question_lower for keyword in education_keywords):
                return "education"
            else:
                return "general"

        query_strategy = get_query_strategy(user_input)
        print(f"查詢策略: {query_strategy}")

        # 第一階段：使用英文模型進行查詢（快取鏈）
        print("使用英文模型進行查詢...")
        chain_english = GraphCypherQAChain.from_llm(
            llm=llm_english,
            graph=graph,
            verbose=True,
            return_intermediate_steps=True,
            allow_dangerous_requests=True,
            cypher_prompt=cypher_prompt_english,
            qa_prompt=qa_prompt_chinese
        )
        result = chain_english({"query": user_input})
        print(f"英文模型檢索結果: {bool(result)}")

        # 檢查結果是否有效
        if is_valid_result(result):
            print("英文模型檢索成功，返回結果")
            return result, b_databaseProblem

        # 如果英文模型結果無效，嘗試中文模型（快取鏈）
        print("英文模型檢索無效，嘗試中文模型檢索...")
        chain_chinese = GraphCypherQAChain.from_llm(
            llm=llm_chinese,
            graph=graph,
            verbose=True,
            return_intermediate_steps=True,
            allow_dangerous_requests=True,
            cypher_prompt=cypher_prompt,
            qa_prompt=qa_prompt_chinese
        )
        result = chain_chinese({"query": user_input})
        print(f"中文模型檢索結果: {bool(result)}")

        if is_valid_result(result):
            print("中文模型檢索成功，返回結果")
            return result, b_databaseProblem

        # 若仍無效，嘗試更廣泛的直接查詢
        print("嘗試更廣泛的搜尋...")
        try:
            if query_strategy == "test":
                direct_query = "MATCH (t:Test) RETURN t LIMIT 10"
            elif query_strategy == "diet":
                direct_query = "MATCH (d:Diet) RETURN d LIMIT 10"
            elif query_strategy == "drug":
                direct_query = "MATCH (d:Drug) RETURN d LIMIT 10"
            elif query_strategy == "education":
                direct_query = "MATCH (e:Education) RETURN e LIMIT 10"
            else:
                direct_query = "MATCH (c:Category) RETURN c LIMIT 10"
            print(f"執行直接查詢: {direct_query}")
            direct_result = graph.query(direct_query)
            if direct_result and len(direct_result) > 0:
                print(f"直接查詢成功，找到 {len(direct_result)} 個結果")
                context = [str(item) for item in direct_result]
                return {
                    "result": "根據您的問題，我找到了相關的資訊。請查看以下內容：\n\n" + "\n\n".join(context[:5]),
                    "intermediate_steps": [{"context": context, "cypher": direct_query}]
                }, b_databaseProblem
            else:
                print("直接查詢也無效")
                return {"result": "目前找不到相關資訊，請嘗試用不同的方式再次提問。"}, b_databaseProblem
        except Exception as direct_error:
            print(f"直接查詢失敗: {direct_error}")
            return {"result": "目前找不到相關資訊，請嘗試用不同的方式再次提問。"}, b_databaseProblem

    except Exception as e:
        print(f"兩階段查詢失敗: {e}")
        try:
            print("嘗試回退到原始查詢方法...")
            chain = GraphCypherQAChain.from_llm(
                llm=llm_chinese,
                graph=graph,
                verbose=True,
                return_intermediate_steps=True,
                allow_dangerous_requests=True,
                cypher_prompt=cypher_prompt,
                qa_prompt=qa_prompt_chinese
            )
            result = chain({"query": user_input})
            print(f"回退查詢成功: {bool(result)}")
            return result, b_databaseProblem
        except Exception as fallback_error:
            print(f"回退查詢也失敗: {fallback_error}")
            return {"result": "系統發生錯誤，請稍後再試。"}, b_databaseProblem

async def conclusionAnswer(firstResult, question):
    """串流版本的詳細回答生成"""
    answer_prompt = PromptTemplate(
        input_variables=["firstResult", "question"],
        template="""你是一位腎臟健康衛教醫生，請根據下方系統提供的腎臟衛教回應進行整合，僅能根據提供的資訊回答：
- 不可自我介紹（如「作為醫生...」等開場白）。
- 不可要求使用者提供更多資訊。
- 不可給出與 context 無關的泛泛建議。
- 若資訊不足，請根據現有資訊盡量給出有幫助的建議，或簡要歸納 context 內容。
- 若 context 完全無法回答，才簡短說明目前無法提供具體建議。
請保持專業性以及語句清楚明瞭，務必使用繁體中文作答。

            提供的資訊：
            {firstResult}

            使用者問題：{question}
            有幫助的回答：
            """)
    formatted_prompt = answer_prompt.format(firstResult=firstResult, question=question)
    
    # 使用串流方式生成回答
    for chunk in llm_chinese.stream(formatted_prompt):
        if hasattr(chunk, 'content') and chunk.content:
            yield chunk.content

async def concise_outline(firstResult, question):
    """串流版本的大綱生成"""
    outline_prompt = PromptTemplate(
        input_variables=["firstResult", "question"],
        template="""你是一位腎臟健康衛教醫生，請將系統提供的腎臟衛教回應，濃縮成簡短、易懂的大綱列點（3點以內），每點不超過15字，避免冗長解釋。請勿重複問題。請務必使用繁體中文作答。\n\n提供的資訊：\n{firstResult}\n\n使用者問題：{question}\n大綱列點：\n""")
    formatted_prompt = outline_prompt.format(firstResult=firstResult, question=question)
    
    # 使用串流方式生成大綱
    for chunk in llm_chinese.stream(formatted_prompt):
        if hasattr(chunk, 'content') and chunk.content:
            yield chunk.content

def is_kidney_related(question):
    """檢查問題是否與腎臟健康相關"""
    kidney_keywords = [
        '腎', '腎臟', 'CKD', 'ckd', '慢性腎臟病', '腎功能', '腎病',
        '尿', '透析', '洗腎', '腎衰竭', '尿毒', '腎炎',
        '飲食', '蛋白尿', '血尿', '肌酸酐', 'eGFR', 'egfr',
        '腎絲球', '腎小管', '腎元', '腎臟保健', '腎臟檢查',
        '腎臟藥物', '腎臟飲食', '腎臟營養', '腎衰竭預防',
        '洗腎', '血液透析', '腹膜透析', '腎臟移植'
    ]
    
    # 檢查是否包含相關關鍵字
    question_lower = question.lower()
    return any(keyword.lower() in question_lower for keyword in kidney_keywords)

async def query_graph_two_stage_stream(user_input):
    """串流版本的兩階段RAG查詢：逐步生成回答"""
    
    # 預先檢查問題相關性
    if not is_kidney_related(user_input):
        print(f"問題與腎臟健康不相關: {user_input}")
        
        off_topic_message = "不好意思，我是腎臟健康衛教機器人，專門回答腎臟相關問題。無法提供此問題的解答。"
        
        # 返回拒絕訊息
        yield {"type": "outline_chunk", "content": off_topic_message}
        yield {"type": "detail_chunk", "content": off_topic_message}
        yield {
            "type": "done",
            "outline": off_topic_message,
            "detail": off_topic_message
        }
        return
    
    b_databaseProblem = False
    graph = connectNeo4j()
    
    if graph is None:
        b_databaseProblem = True
        yield {"type": "error", "content": "資料庫連結異常，請稍後再試。"}
        return
    
    try:
        print(f"處理問題（串流）: {user_input}")
        
        # 階段 1: 查詢資料庫
        yield {"type": "status", "content": "正在查詢資料庫..."}
        
        # 使用現有邏輯查詢資料庫
        result, _ = query_graph_two_stage(user_input)
        
        # 檢查結果
        if b_databaseProblem:
            firstResult = "資料庫連結異常，請稍後再試。"
        elif not result:
            firstResult = "系統無法處理您的問題，請稍後再試。"
        elif 'result' not in result or not result['result']:
            firstResult = "目前找不到相關資訊，請嘗試用不同的方式再次提問。"
        else:
            firstResult = result['result']
        
        # 階段 2: 生成詳細回答（串流）
        yield {"type": "status", "content": "正在生成詳細回答..."}
        
        detail_prompt = f"""你是一位腎臟健康衛教醫生，請根據下方系統提供的腎臟衛教回應進行整合，僅能根據提供的資訊回答：
- 不可自我介紹（如「作為醫生...」等開場白）。
- 不可要求使用者提供更多資訊。
- 不可給出與 context 無關的泛泛建議。
- 若資訊不足，請根據現有資訊盡量給出有幫助的建議，或簡要歸納 context 內容。
- 若 context 完全無法回答，才簡短說明目前無法提供具體建議。
請保持專業性以及語句清楚明瞭，務必使用繁體中文作答。

提供的資訊：
{firstResult}

使用者問題：{user_input}
有幫助的回答："""
        
        detail_text = ""
        async for chunk in llm_chinese.astream(detail_prompt):
            if hasattr(chunk, 'content') and chunk.content:
                detail_text += chunk.content
                yield {"type": "detail_chunk", "content": chunk.content}
        
        # 階段 3: 生成大綱（串流）
        yield {"type": "status", "content": "正在生成摘要..."}
        
        outline_prompt = f"""你是一位腎臟健康衛教醫生，請將系統提供的腎臟衛教回應，濃縮成簡短、易懂的大綱列點（3點以內），每點不超過15字，避免冗長解釋。請勿重複問題。請務必使用繁體中文作答。

提供的資訊：
{detail_text}

使用者問題：{user_input}
大綱列點：
"""
        
        outline_text = ""
        async for chunk in llm_chinese.astream(outline_prompt):
            if hasattr(chunk, 'content') and chunk.content:
                outline_text += chunk.content

                yield {"type": "outline_chunk", "content": chunk.content}
        
        # 完成
        yield {
            "type": "done",
            "outline": outline_text,
            "detail": detail_text
        }
        
    except Exception as e:
        print(f"串流查詢失敗: {e}")
        yield {"type": "error", "content": f"系統發生錯誤：{str(e)}"}


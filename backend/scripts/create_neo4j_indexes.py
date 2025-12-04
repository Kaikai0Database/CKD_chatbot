"""
Neo4j 索引建立腳本
為常用查詢欄位建立索引以提升查詢效能
"""
from neo4j import GraphDatabase
import sys
import os

# 從 core_logic 導入資料庫設定
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    from core_logic import neo4j_url, neo4j_user, neo4j_password, neo4j_database
except ImportError:
    # 如果從 backend/scripts 執行，需要調整路徑
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
    from core_logic import neo4j_url, neo4j_user, neo4j_password, neo4j_database

class Neo4jIndexCreator:
    def __init__(self, uri, user, password, database):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))
        self.database = database
    
    def close(self):
        self.driver.close()
    
    def create_indexes(self):
        """建立所有必要的索引"""
        indexes = [
            # Category 索引
            ("CREATE INDEX category_name IF NOT EXISTS FOR (c:Category) ON (c.name)", "Category.name"),
            
            # Diet 索引
            ("CREATE INDEX diet_name IF NOT EXISTS FOR (d:Diet) ON (d.name)", "Diet.name"),
            ("CREATE INDEX diet_description IF NOT EXISTS FOR (d:Diet) ON (d.description)", "Diet.description"),
            ("CREATE INDEX diet_guideline IF NOT EXISTS FOR (d:Diet) ON (d.guideline)", "Diet.guideline"),
            
            # Drug 索引
            ("CREATE INDEX drug_name IF NOT EXISTS FOR (d:Drug) ON (d.name)", "Drug.name"),
            ("CREATE INDEX drug_impact IF NOT EXISTS FOR (d:Drug) ON (d.impact)", "Drug.impact"),
            
            # Test 索引
            ("CREATE INDEX test_name IF NOT EXISTS FOR (t:Test) ON (t.name)", "Test.name"),
            ("CREATE INDEX test_description IF NOT EXISTS FOR (t:Test) ON (t.description)", "Test.description"),
            
            # Education 索引
            ("CREATE INDEX education_name IF NOT EXISTS FOR (e:Education) ON (e.name)", "Education.name"),
            ("CREATE INDEX education_description IF NOT EXISTS FOR (e:Education) ON (e.description)", "Education.description"),
        ]
        
        with self.driver.session(database=self.database) as session:
            for query, name in indexes:
                try:
                    session.run(query)
                    print(f"[OK] 索引建立成功: {name}")
                except Exception as e:
                    print(f"[FAIL] 索引建立失敗: {name} - {e}")
    
    def create_fulltext_indexes(self):
        """建立全文索引（Neo4j 5.x）"""
        # 全文索引語法與一般索引不同
        fulltext_indexes = [
            (
                """CREATE FULLTEXT INDEX diet_fulltext IF NOT EXISTS
                   FOR (d:Diet) ON EACH [d.name, d.description, d.guideline]""",
                "Diet 全文索引"
            ),
            (
                """CREATE FULLTEXT INDEX test_fulltext IF NOT EXISTS
                   FOR (t:Test) ON EACH [t.name, t.description]""",
                "Test 全文索引"
            ),
        ]
        
        with self.driver.session(database=self.database) as session:
            for query, name in fulltext_indexes:
                try:
                    session.run(query)
                    print(f"[OK] 全文索引建立成功: {name}")
                except Exception as e:
                    print(f"[FAIL] 全文索引建立失敗: {name} - {e}")
    
    def list_indexes(self):
        """列出所有現有索引"""
        with self.driver.session(database=self.database) as session:
            try:
                result = session.run("SHOW INDEXES")
                print("\n現有索引:")
                for record in result:
                    print(f"  - {record['name']}: {record['labelsOrTypes']} ON {record['properties']}")
            except Exception as e:
                print(f"列出索引時發生錯誤: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("Neo4j 索引建立工具")
    print("=" * 60)
    print(f"資料庫位址: {neo4j_url}")
    print(f"資料庫名稱: {neo4j_database}")
    print()
    
    creator = Neo4jIndexCreator(neo4j_url, neo4j_user, neo4j_password, neo4j_database)
    
    try:
        print("階段 1: 建立一般索引")
        print("-" * 60)
        creator.create_indexes()
        print()
        
        print("階段 2: 建立全文索引")
        print("-" * 60)
        creator.create_fulltext_indexes()
        print()
        
        print("階段 3: 列出所有索引")
        print("-" * 60)
        creator.list_indexes()
        
    except Exception as e:
        print(f"\n錯誤: {e}")
    finally:
        creator.close()
    
    print()
    print("=" * 60)
    print("索引建立程序完成！")
    print("=" * 60)

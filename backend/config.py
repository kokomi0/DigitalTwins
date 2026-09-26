import os
from pathlib import Path
from dotenv import load_dotenv

# 自动优先加载当前backend目录或上层根目录的.env环境变量文件
backend_env = Path(__file__).resolve().parent / ".env"
root_env = Path(__file__).resolve().parent.parent / ".env"
if backend_env.exists():
    load_dotenv(backend_env)
elif root_env.exists():
    load_dotenv(root_env)
else:
    load_dotenv()

class Config:
    # 基础配置
    SECRET_KEY = os.getenv("SECRET_KEY", "Sanya-Lung-Twin-SecretKey-2026!@#$")
    DEBUG = os.getenv("FLASK_DEBUG", "True").lower() == "true"
    HOST = os.getenv("FLASK_RUN_HOST", "0.0.0.0")
    PORT = int(os.getenv("FLASK_RUN_PORT", "5000"))

    # 1. MySQL 8.0 关系型数据库配置
    MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))
    MYSQL_USER = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "TwinAdmin2026!")
    MYSQL_DB = os.getenv("MYSQL_DB", "lung_twin_db")
    SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}?charset=utf8mb4"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # 2. Neo4j 5.x 图数据库配置
    NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
    NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "TwinAdmin2026!")

    # 3. MongoDB 6.0 文档数据库配置
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/lung_twin_nosql")
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "lung_twin_nosql")

    # 4. Redis & Celery 任务解耦
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1")
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")

    # 5. 双超算集群专线与脱敏栅栏模拟配置
    HOSPITAL_CLUSTER = {
        "id": "HOSP-SANYA-CLUSTER-01",
        "name": "三亚市人民医院医学影像与病理超算私网",
        "ip": "10.200.1.50",
        "status": "SECURED_ONLINE",
        "encryption": "AES-256-GCM + 国密SM4",
        "privacy_level": "LEVEL_3_PROTECTED"
    }

    UNIVERSITY_CLUSTER = {
        "id": "SYU-HPC-SIMULATION-NODE",
        "name": "三亚学院高性能计算与数字孪生重点实验室超算",
        "ip": "10.100.8.20",
        "status": "ACTIVE_COMPUTING",
        "allocated_nodes": 64,
        "gpu_cluster": "NVIDIA H100 8-way x 4",
        "privacy_level": "ANONYMIZED_RESEARCH"
    }

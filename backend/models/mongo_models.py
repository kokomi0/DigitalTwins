import logging
from pymongo import MongoClient
from config import Config

logger = logging.getLogger(__name__)

_mongo_client = None

def get_mongo_db():
    global _mongo_client
    if _mongo_client is not None:
        if isinstance(_mongo_client, MockMongoDatabase):
            return _mongo_client
        return _mongo_client[Config.MONGO_DB_NAME]
    try:
        client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=1000)
        client.server_info() # 测试连接
        _mongo_client = client
        return _mongo_client[Config.MONGO_DB_NAME]
    except Exception as e:
        logger.warning(f"[MongoDB] 真实数据库连接失败或未启动，启用内存仿真代理: {e}")
        _mongo_client = MockMongoDatabase()
        return _mongo_client

class MockMongoDatabase:
    """当无实体MongoDB服务运行时的轻量内存降级代理"""
    def __init__(self):
        self.dicom_features = MockCollection([
            {
                "anon_code": "SYU-COPD-2026-088",
                "patient_anon_id": "ANON-088-SANYA",
                "source_scanner": "Siemens Somatom Force (Dual Source CT)",
                "slice_thickness_mm": 0.625,
                "kvp": 120,
                "lung_total_volume_ml": 4890.5,
                "emphysema_index": {
                    "laa_pct_minus_950hu": 23.4,
                    "upper_lobes_pct": 31.2,
                    "middle_lobe_pct": 12.8,
                    "lower_lobes_pct": 18.5,
                    "phenotype": "Centrilobular Emphysema (小叶中央型肺气肿为主)"
                },
                "airway_wall_metrics": {
                    "pi10_mm": 5.62,
                    "wall_area_percentage_rb3": 74.2
                },
                "lymph_nodes_detected": [
                    { "station": "7", "max_diameter_mm": 14.8, "min_diameter_mm": 11.2, "hu_mean": 42.5 },
                    { "station": "4R", "max_diameter_mm": 9.6, "min_diameter_mm": 7.1, "hu_mean": 38.0 },
                    { "station": "10R", "max_diameter_mm": 8.4, "min_diameter_mm": 6.2, "hu_mean": 35.0 }
                ]
            }
        ])

        self.ai_evaluations = MockCollection([
            {
                "anon_code": "SYU-COPD-2026-088",
                "evaluation_id": "AI-EVAL-20260925-001",
                "llm_engine": "BioMedLM-Clinical-Pulmo-V3 (三亚学院超算大模型算力)",
                "report_title": "慢性阻塞性肺疾病（COPD GOLD 3级）数字孪生流体力学综合评估报告",
                "diagnostic_summary": {
                    "disease_staging": "慢性阻塞性肺疾病急性加重高危组 (GOLD 3)",
                    "fev1_actual": "1.10 L (占预计值 41.5%)",
                    "fev1_fvc": "45.2% (不可逆呼气气流受限)",
                    "raw_resistance": "0.485 kPa·s/L (显著高于正常基线)"
                },
                "cfd_airway_analysis": {
                    "critical_obstruction_zone": "右肺上叶前段支气管 (RB3)",
                    "pathological_mechanism": "RB3管壁黏膜增厚达74.2%，伴局部高负压导致呼气相动态狭窄与湍流能量耗散",
                    "air_trapping_lobes": ["右肺上叶", "左肺上叶前段"]
                },
                "lymph_station_interpretation": {
                    "station_7": "隆突下淋巴结短径14.8mm，伴均匀低回声充血表现，符合重度COPD慢性气道炎症反应性增大，建议EBUS-TBNA穿刺复核排除隐匿淋巴源性病变。",
                    "station_4r": "右下气管旁淋巴结短径9.6mm，毗邻奇静脉弓，未见突破包膜征象。"
                },
                "clinical_recommendations": [
                    {
                        "type": "DRUG_THERAPY",
                        "title": "三联吸入药物治疗方案 (ICS/LABA/LAMA)",
                        "detail": "建议予以布地奈德福莫特罗联合噻托溴铵粉吸入剂，抗炎平喘。"
                    },
                    {
                        "type": "NON_INVASIVE_VENTILATION",
                        "title": "双水平正压通气 (BiPAP) 参数建议",
                        "detail": "建议设置EPAP 4-6 cmH2O以对抗内源性PEEPi，IPAP 12-14 cmH2O保证潮气量。"
                    },
                    {
                        "type": "PULMONARY_REHABILITATION",
                        "title": "个体化数字孪生呼吸康复推演训练",
                        "detail": "通过缩唇腹式呼吸控制吸呼比1:2.5，抑制呼气相细支气管陷闭。"
                    }
                ],
                "physician_signature_status": "PENDING_REVIEW"
            }
        ])

        self.simulation_frames = MockCollection([])

class MockCollection:
    def __init__(self, items):
        self.items = items

    def find_one(self, query):
        for item in self.items:
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                return item
        return self.items[0] if self.items else None

    def find(self, query=None):
        return self.items

    def insert_one(self, doc):
        self.items.append(doc)
        return doc

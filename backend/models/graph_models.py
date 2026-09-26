import logging
from neo4j import GraphDatabase
from config import Config

logger = logging.getLogger(__name__)

_neo4j_driver = None

def get_neo4j_driver():
    global _neo4j_driver
    if _neo4j_driver is not None:
        return _neo4j_driver
    try:
        driver = GraphDatabase.driver(
            Config.NEO4J_URI,
            auth=(Config.NEO4J_USER, Config.NEO4J_PASSWORD),
            connection_timeout=1.5
        )
        driver.verify_connectivity()
        _neo4j_driver = driver
        return _neo4j_driver
    except Exception as e:
        logger.warning(f"[Neo4j] 真实图数据库服务未连接，启用解剖图谱内存仿真驱动: {e}")
        _neo4j_driver = MockNeo4jDriver()
        return _neo4j_driver

class MockNeo4jDriver:
    """提供高保真支气管B1-B10树与1R-12L淋巴结拓扑的内存知识图谱代理"""
    def __init__(self):
        self.nodes = [
            # 气管主干
            {"id": "TRACHEA", "label": "Bronchus", "name_cn": "主气管 (隆突前)", "generation": 0, "diameter": 19.5, "length": 105, "coords": [0.0, 3.5, 0.0], "cartilage_rings": 18},
            {"id": "RMB", "label": "Bronchus", "name_cn": "右主支气管", "generation": 1, "diameter": 15.2, "length": 22, "coords": [1.2, 1.8, 0.2]},
            {"id": "LMB", "label": "Bronchus", "name_cn": "左主支气管", "generation": 1, "diameter": 13.0, "length": 48, "coords": [-1.4, 1.6, -0.1]},
            
            # 右肺分枝
            {"id": "RUB", "label": "Bronchus", "name_cn": "右上叶支气管", "generation": 2, "diameter": 10.5, "coords": [2.2, 2.5, 0.5]},
            {"id": "BI", "label": "Bronchus", "name_cn": "中间支气管", "generation": 2, "diameter": 11.2, "coords": [1.8, 0.5, 0.1]},
            {"id": "RB1", "label": "Bronchus", "name_cn": "右上叶尖段 (B1)", "generation": 3, "coords": [2.5, 3.6, 0.8], "lobe": "RUL"},
            {"id": "RB2", "label": "Bronchus", "name_cn": "右上叶后段 (B2)", "generation": 3, "coords": [2.9, 2.8, -0.8], "lobe": "RUL"},
            {"id": "RB3", "label": "Bronchus", "name_cn": "右上叶前段 (B3)", "generation": 3, "coords": [2.8, 2.2, 1.2], "lobe": "RUL", "stenosis_pct": 65, "is_lesion": True},
            {"id": "RMLB", "label": "Bronchus", "name_cn": "右中叶支气管", "generation": 3, "diameter": 7.2, "coords": [2.4, -0.3, 1.1]},
            {"id": "RLB", "label": "Bronchus", "name_cn": "右下叶支气管", "generation": 3, "diameter": 9.8, "coords": [2.0, -0.8, -0.2]},
            {"id": "RB4", "label": "Bronchus", "name_cn": "右中叶外侧段 (B4)", "generation": 4, "coords": [3.3, -0.5, 1.5], "lobe": "RML"},
            {"id": "RB5", "label": "Bronchus", "name_cn": "右中叶内侧段 (B5)", "generation": 4, "coords": [2.7, -0.8, 1.8], "lobe": "RML"},
            {"id": "RB6", "label": "Bronchus", "name_cn": "右下叶背段 (B6)", "generation": 4, "coords": [2.5, -0.9, -1.2], "lobe": "RLL"},
            {"id": "RB7", "label": "Bronchus", "name_cn": "右下叶内基底段 (B7)", "generation": 4, "coords": [1.8, -2.0, 0.4], "lobe": "RLL"},
            {"id": "RB8", "label": "Bronchus", "name_cn": "右下叶前基底段 (B8)", "generation": 4, "coords": [2.6, -2.4, 0.9], "lobe": "RLL"},
            {"id": "RB9", "label": "Bronchus", "name_cn": "右下叶外侧基底段 (B9)", "generation": 4, "coords": [3.4, -2.5, -0.3], "lobe": "RLL"},
            {"id": "RB10", "label": "Bronchus", "name_cn": "右下叶后基底段 (B10)", "generation": 4, "coords": [2.8, -2.8, -1.3], "lobe": "RLL"},

            # 左肺分枝
            {"id": "LUB", "label": "Bronchus", "name_cn": "左上叶支气管", "generation": 2, "coords": [-2.2, 2.2, 0.4]},
            {"id": "LLB", "label": "Bronchus", "name_cn": "左下叶支气管", "generation": 2, "coords": [-2.0, 0.4, -0.2]},
            {"id": "LB1_2", "label": "Bronchus", "name_cn": "左上叶尖后段 (B1+2)", "generation": 3, "coords": [-2.7, 3.5, -0.4], "lobe": "LUL"},
            {"id": "LB3", "label": "Bronchus", "name_cn": "左上叶前段 (B3)", "generation": 3, "coords": [-2.9, 2.3, 1.1], "lobe": "LUL"},
            {"id": "LINGULAR", "label": "Bronchus", "name_cn": "舌叶干支气管", "generation": 3, "coords": [-2.8, 1.1, 0.9]},
            {"id": "LB4", "label": "Bronchus", "name_cn": "舌叶上段 (B4)", "generation": 4, "coords": [-3.4, 0.6, 1.4], "lobe": "LUL"},
            {"id": "LB5", "label": "Bronchus", "name_cn": "舌叶下段 (B5)", "generation": 4, "coords": [-3.2, -0.1, 1.5], "lobe": "LUL"},
            {"id": "LB6", "label": "Bronchus", "name_cn": "左下叶背段 (B6)", "generation": 3, "coords": [-2.6, 0.2, -1.3], "lobe": "LLL"},
            {"id": "LB7_8", "label": "Bronchus", "name_cn": "左下叶前内基底段 (B7+8)", "generation": 3, "coords": [-2.5, -1.8, 0.8], "lobe": "LLL"},
            {"id": "LB9", "label": "Bronchus", "name_cn": "左下叶外侧基底段 (B9)", "generation": 3, "coords": [-3.3, -2.2, -0.2], "lobe": "LLL"},
            {"id": "LB10", "label": "Bronchus", "name_cn": "左下叶后基底段 (B10)", "generation": 3, "coords": [-2.7, -2.6, -1.2], "lobe": "LLL"},

            # 1R-12L 淋巴结分站 (超声支气管镜下特征及周围血管)
            {"id": "LN_1R", "label": "LymphNode", "station": "1R", "name_cn": "右上纵隔淋巴结", "coords": [1.1, 4.8, 0.3], "ebus": False, "vessel": "右头臂静脉"},
            {"id": "LN_2R", "label": "LymphNode", "station": "2R", "name_cn": "右上气管旁淋巴结", "coords": [1.3, 3.8, 0.4], "ebus": True, "vessel": "上腔静脉 (SVC)", "ebus_desc": "呈均质卵圆形，气管软骨环外侧壁"},
            {"id": "LN_2L", "label": "LymphNode", "station": "2L", "name_cn": "左上气管旁淋巴结", "coords": [-1.2, 3.7, 0.1], "ebus": True, "vessel": "左锁骨下动脉起始部", "ebus_desc": "左侧壁深面"},
            {"id": "LN_4R", "label": "LymphNode", "station": "4R", "name_cn": "右下气管旁淋巴结 (金标准)", "coords": [1.4, 2.5, 0.3], "ebus": True, "vessel": "奇静脉弓 (Azygos Arch)", "ebus_desc": "奇静脉弓下方，血流充沛，EBUS穿刺首选靶点"},
            {"id": "LN_4L", "label": "LymphNode", "station": "4L", "name_cn": "左下气管旁淋巴结", "coords": [-1.5, 2.4, 0.0], "ebus": True, "vessel": "左主肺动脉及主动脉弓下缘", "ebus_desc": "AP窗下界"},
            {"id": "LN_7", "label": "LymphNode", "station": "7", "name_cn": "隆突下淋巴结 (高危反应站)", "coords": [0.0, 1.2, -0.4], "ebus": True, "vessel": "右肺动脉后壁、食管前壁", "ebus_desc": "主隆突马鞍区，短径14.8mm反应性肿大，COPD炎症高发", "status": "SWOLLEN"},
            {"id": "LN_10R", "label": "LymphNode", "station": "10R", "name_cn": "右肺门淋巴结", "coords": [2.1, 1.4, 0.1], "ebus": True, "vessel": "右上肺静脉", "ebus_desc": "中间支气管外侧嵴"},
            {"id": "LN_10L", "label": "LymphNode", "station": "10L", "name_cn": "左肺门淋巴结", "coords": [-2.1, 1.3, -0.3], "ebus": True, "vessel": "左肺动脉主干", "ebus_desc": "左主支气管转折处"},
            {"id": "LN_11R", "label": "LymphNode", "station": "11R", "name_cn": "右叶间淋巴结", "coords": [2.5, 0.3, 0.6], "ebus": True, "vessel": "叶间肺动脉裂支", "ebus_desc": "右上叶与中间干夹角"},
            {"id": "LN_11L", "label": "LymphNode", "station": "11L", "name_cn": "左叶间淋巴结", "coords": [-2.6, 0.8, 0.2], "ebus": True, "vessel": "舌段动脉干", "ebus_desc": "左上叶与下叶切迹"},
            {"id": "LN_12R", "label": "LymphNode", "station": "12R", "name_cn": "右叶支气管淋巴结", "coords": [2.9, -0.6, 0.4], "ebus": False, "vessel": "右下叶基底干动脉"},
            {"id": "LN_12L", "label": "LymphNode", "station": "12L", "name_cn": "左叶支气管淋巴结", "coords": [-2.8, -0.9, 0.1], "ebus": False, "vessel": "左下叶基底干动脉"}
        ]

        self.edges = [
            {"source": "TRACHEA", "target": "RMB", "type": "BRANCHES_TO"},
            {"source": "TRACHEA", "target": "LMB", "type": "BRANCHES_TO"},
            {"source": "RMB", "target": "RUB", "type": "BRANCHES_TO"},
            {"source": "RMB", "target": "BI", "type": "BRANCHES_TO"},
            {"source": "RUB", "target": "RB1", "type": "BRANCHES_TO"},
            {"source": "RUB", "target": "RB2", "type": "BRANCHES_TO"},
            {"source": "RUB", "target": "RB3", "type": "BRANCHES_TO"},
            {"source": "BI", "target": "RMLB", "type": "BRANCHES_TO"},
            {"source": "BI", "target": "RLB", "type": "BRANCHES_TO"},
            {"source": "RMLB", "target": "RB4", "type": "BRANCHES_TO"},
            {"source": "RMLB", "target": "RB5", "type": "BRANCHES_TO"},
            {"source": "RLB", "target": "RB6", "type": "BRANCHES_TO"},
            {"source": "RLB", "target": "RB7", "type": "BRANCHES_TO"},
            {"source": "RLB", "target": "RB8", "type": "BRANCHES_TO"},
            {"source": "RLB", "target": "RB9", "type": "BRANCHES_TO"},
            {"source": "RLB", "target": "RB10", "type": "BRANCHES_TO"},
            {"source": "LMB", "target": "LUB", "type": "BRANCHES_TO"},
            {"source": "LMB", "target": "LLB", "type": "BRANCHES_TO"},
            {"source": "LUB", "target": "LB1_2", "type": "BRANCHES_TO"},
            {"source": "LUB", "target": "LB3", "type": "BRANCHES_TO"},
            {"source": "LUB", "target": "LINGULAR", "type": "BRANCHES_TO"},
            {"source": "LINGULAR", "target": "LB4", "type": "BRANCHES_TO"},
            {"source": "LINGULAR", "target": "LB5", "type": "BRANCHES_TO"},
            {"source": "LLB", "target": "LB6", "type": "BRANCHES_TO"},
            {"source": "LLB", "target": "LB7_8", "type": "BRANCHES_TO"},
            {"source": "LLB", "target": "LB9", "type": "BRANCHES_TO"},
            {"source": "LLB", "target": "LB10", "type": "BRANCHES_TO"},
            
            # 淋巴结邻接关系
            {"source": "LN_2R", "target": "TRACHEA", "type": "ADJACENT_TO"},
            {"source": "LN_2L", "target": "TRACHEA", "type": "ADJACENT_TO"},
            {"source": "LN_4R", "target": "RMB", "type": "ADJACENT_TO"},
            {"source": "LN_4L", "target": "LMB", "type": "ADJACENT_TO"},
            {"source": "LN_7", "target": "TRACHEA", "type": "ADJACENT_TO"},
            {"source": "LN_7", "target": "RMB", "type": "ADJACENT_TO"},
            {"source": "LN_10R", "target": "BI", "type": "ADJACENT_TO"},
            {"source": "LN_10L", "target": "LUB", "type": "ADJACENT_TO"},
            {"source": "LN_11R", "target": "RMLB", "type": "ADJACENT_TO"},
            {"source": "LN_11L", "target": "LINGULAR", "type": "ADJACENT_TO"}
        ]

    def session(self):
        return self

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

    def run(self, query, **kwargs):
        class MockResult:
            def __init__(self, data):
                self._data = data
            def data(self):
                return self._data
        return MockResult({"nodes": self.nodes, "edges": self.edges})

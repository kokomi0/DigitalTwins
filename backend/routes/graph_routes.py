from flask import Blueprint, request, jsonify
from services.knowledge_graph_service import knowledge_graph_service

graph_bp = Blueprint('graph', __name__, url_prefix='/api/graph')

@graph_bp.route('/anatomy', methods=['GET'])
def get_anatomy():
    """获取Neo4j气管解剖树(B1-B10)及1R-12L淋巴结完整拓扑数据"""
    graph_data = knowledge_graph_service.get_full_anatomy_graph()
    return jsonify({
        "code": 200,
        "data": graph_data
    })

@graph_bp.route('/ebus/<station>', methods=['GET'])
def get_ebus_detail(station):
    """获取超声支气管镜下淋巴结分站的影像特征及邻近大血管解剖关系"""
    detail = knowledge_graph_service.get_ebus_station_detail(station)
    return jsonify({
        "code": 200,
        "data": detail
    })

@graph_bp.route('/occlusion-path', methods=['GET'])
def get_occlusion_path():
    """基于Neo4j知识图谱推理气道狭窄/栓塞的解剖波及路径"""
    target = request.args.get("target", "RB3")
    path_data = knowledge_graph_service.get_lesion_propagation_path(target)
    return jsonify({
        "code": 200,
        "data": path_data
    })

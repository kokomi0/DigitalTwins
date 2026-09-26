from flask import Blueprint, request, jsonify
import time
from services.physiological_simulation import physiological_sim_service
from services.audit_service import audit_service

simulation_bp = Blueprint('simulation', __name__, url_prefix='/api/simulation')

@simulation_bp.route('/params', methods=['GET'])
def get_params():
    """获取当前数字孪生仿真参数"""
    return jsonify({
        "code": 200,
        "data": physiological_sim_service.get_current_parameters()
    })

@simulation_bp.route('/tune-params', methods=['POST'])
def tune_params():
    """工程师/医生调节狭窄度、阻力系数Raw、LOD等级等"""
    data = request.get_json() or {}
    updated = physiological_sim_service.update_parameters(data)

    audit_service.record_action(
        user_id=1,
        username="eng_zhang",
        role_code="twin_engineer",
        action="PARAM_TUNE",
        resource_target="SIMULATION_ENGINE",
        client_ip=request.remote_addr or "127.0.0.1",
        detail=data
    )

    return jsonify({
        "code": 200,
        "message": "数字孪生解算参数更新成功",
        "data": updated
    })

@simulation_bp.route('/waveforms', methods=['GET'])
def get_waveforms():
    """获取前端气道压波形、流速、容积历史时间序列帧 (ECharts)"""
    points = int(request.args.get("points", 30))
    waveforms = physiological_sim_service.generate_waveform_history(points=points)
    return jsonify({
        "code": 200,
        "data": waveforms
    })

@simulation_bp.route('/hpc-load', methods=['GET'])
def get_hpc_load():
    """双超算算力集群解算负载监控（孪生工程师专属视图）"""
    t = time.time()
    return jsonify({
        "code": 200,
        "data": {
            "hospital_cluster": {
                "name": "三亚市人民医院超算私网 (院内加密节点)",
                "cpu_utilization_pct": 38.4,
                "gpu_utilization_pct": 42.0,
                "ram_usage_gb": "64.2 / 256.0 GB",
                "encryption_stream_fps": 60,
                "temperatures_c": 51.5,
                "status": "HEALTHY"
            },
            "university_cluster": {
                "name": "三亚学院数字孪生高性能超算重点实验室",
                "cluster_nodes_active": 64,
                "cfd_aerodynamics_throughput_gflops": "9842.5",
                "gpu_h100_vram_gb": "312.4 / 640.0 GB",
                "active_simulation_tasks": 4,
                "mesh_polygon_count": 84200,
                "current_fps": 59.8,
                "temperatures_c": 58.2,
                "status": "FULL_SPEED"
            }
        }
    })

from flask import Blueprint, request, jsonify
from services.audit_service import audit_service
from services.desensitization_proxy import desensitization_proxy

audit_bp = Blueprint('audit', __name__, url_prefix='/api/audit')

@audit_bp.route('/logs', methods=['GET'])
def get_logs():
    """获取所有医疗合规防篡改审计日志"""
    logs = audit_service.get_all_logs()
    return jsonify({
        "code": 200,
        "data": logs
    })

@audit_bp.route('/verify-chain', methods=['POST'])
def verify_chain():
    """医患法务人员执行SHA-256区块链式防篡改验真"""
    verification = audit_service.verify_integrity()
    return jsonify({
        "code": 200,
        "message": "审计链完整性验证通过" if verification["chain_valid"] else "警报：检测到篡改破坏！",
        "data": verification
    })

@audit_bp.route('/pipeline-telemetry', methods=['GET'])
def get_pipeline_telemetry():
    """获取双超算互联管道及脱敏栅栏实时态势遥测指标"""
    telemetry = desensitization_proxy.get_pipeline_telemetry()
    return jsonify({
        "code": 200,
        "data": telemetry
    })

@audit_bp.route('/trigger-desensitize', methods=['POST'])
def trigger_desensitize():
    """模拟医院端提交原始DICOM并经由脱敏栅栏输出给三亚学院超算"""
    raw_sample = {
        "patient_uid": "HOSP-RAW-9081244199",
        "patient_name": "张*民 (脱敏前)",
        "id_card": "460200195803120018",
        "gender": "男",
        "age": 68,
        "gold_stage": "GOLD 3",
        "fev1_pred": 41.5,
        "fvc_liters": 2.65,
        "fev1_fvc_ratio": 45.2,
        "airway_resistance": 0.485
    }

    desensitized, hash_digest = desensitization_proxy.desensitize_patient_record(raw_sample)

    audit_service.record_action(
        user_id=2,
        username="dr_wang",
        role_code="pulmonologist",
        action="DESENSITIZE_EXPORT",
        resource_target=desensitized["anon_code"],
        client_ip=request.remote_addr or "127.0.0.1",
        detail={
            "original_id_stripped": True,
            "hash_fingerprint": hash_digest,
            "fence_status": "CLEARED"
        }
    )

    return jsonify({
        "code": 200,
        "message": "原始敏感数据已通过安全脱敏栅栏，已安全推送至三亚学院超算集群",
        "data": {
            "desensitized_record": desensitized,
            "hash_fingerprint": hash_digest
        }
    })

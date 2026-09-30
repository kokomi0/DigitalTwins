from flask import Blueprint, request, jsonify
from models.mongo_models import get_mongo_db
from services.audit_service import audit_service
from services.physiological_simulation import physiological_sim_service

clinical_bp = Blueprint('clinical', __name__, url_prefix='/api/clinical')

MOCK_PATIENTS = [
    {
        "id": 1,
        "patient_uid": "HOSP-ENC-9081244109",
        "anon_code": "SYU-COPD-2026-088",
        "patient_name": "张*民",
        "gender": "男",
        "age": 68,
        "inpatient_no": "#HN-2026-0928",
        "bed_no": "呼吸科 08床",
        "gold_stage": "GOLD 3级 C组 (重度)",
        "fev1_pred": 46.20,
        "fvc_liters": 2.65,
        "fev1_fvc_ratio": 46.20,
        "airway_resistance": 0.485,
        "smoking_pack_years": 40,
        "spo2_resting": 91,
        "aecopd_risk_prob": 83.5,
        "aecopd_risk_level": "HIGH",
        "primary_lesion_segment": "RB3 (右上叶前段重构狭窄)",
        "hospital_cluster_id": "HOSP-SANYA-CLUSTER-01",
        "university_task_id": "SYU-HPC-JOB-99214",
        "laa_pct": 32.4,
        "ct_scan_date": "2026-09-25 10:24",
        "ct_series_id": "CT-THORAX-HRCT-0082",
        "comorbidities": [
            "高血压2级 (很高危)",
            "慢性肺源性心脏病 (代偿期)",
            "慢性呼吸衰竭 I 型 (低氧血症)"
        ],
        "current_meds": [
            "布地奈德福莫特罗吸入粉雾剂 (ICS/LABA 160/4.5μg bid)",
            "噻托溴铵粉雾剂 (LAMA 18μg qd)",
            "乙酰半胱氨酸泡腾片 (0.6g bid)"
        ]
    },
    {
        "id": 2,
        "patient_uid": "HOSP-ENC-9081244110",
        "anon_code": "SYU-COPD-2026-089",
        "gender": "女",
        "age": 62,
        "gold_stage": "GOLD 2 (中度)",
        "fev1_pred": 63.20,
        "fvc_liters": 2.90,
        "fev1_fvc_ratio": 58.70,
        "airway_resistance": 0.320,
        "smoking_pack_years": 20,
        "primary_lesion_segment": "LB3 (左上叶前段)",
        "hospital_cluster_id": "HOSP-SANYA-CLUSTER-01",
        "university_task_id": "SYU-HPC-JOB-99215"
    }
]

@clinical_bp.route('/patients', methods=['GET'])
def get_patients():
    """获取脱敏病例列表"""
    return jsonify({
        "code": 200,
        "data": MOCK_PATIENTS
    })

@clinical_bp.route('/dicom-features', methods=['GET'])
def get_dicom_features():
    """获取CT体素密度云与肺气肿低衰减区(LAA%)特征"""
    anon_code = request.args.get("anon_code", "SYU-COPD-2026-088")
    mongo = get_mongo_db()
    features = mongo.dicom_features.find_one({"anon_code": anon_code})
    if not features:
        features = mongo.dicom_features.find_one({})

    # 移除MongoDB Object Id
    if features and "_id" in features:
        features = {k: v for k, v in features.items() if k != "_id"}

    return jsonify({
        "code": 200,
        "data": features
    })

@clinical_bp.route('/ai-evaluation', methods=['GET'])
def get_ai_evaluation():
    """获取三亚学院超算大模型出具的COPD病情解读与辅助诊疗报告"""
    anon_code = request.args.get("anon_code", "SYU-COPD-2026-088")
    mongo = get_mongo_db()
    eval_doc = mongo.ai_evaluations.find_one({"anon_code": anon_code})
    if not eval_doc:
        eval_doc = mongo.ai_evaluations.find_one({})

    if eval_doc and "_id" in eval_doc:
        eval_doc = {k: v for k, v in eval_doc.items() if k != "_id"}

    return jsonify({
        "code": 200,
        "data": eval_doc
    })

@clinical_bp.route('/annotate-lesion', methods=['POST'])
def annotate_lesion():
    """呼吸科医生在3D气管树上进行解剖段病变标注"""
    data = request.get_json() or {}
    segment = data.get("segment", "RB3")
    stenosis_ratio = float(data.get("stenosis_ratio", 0.65))
    notes = data.get("notes", "前段支气管黏膜充血水肿")
    
    # 动态联动仿真引擎
    physiological_sim_service.update_parameters({
        "stenosis_location": segment,
        "stenosis_ratio": stenosis_ratio
    })

    audit_service.record_action(
        user_id=2,
        username="dr_wang",
        role_code="pulmonologist",
        action="ANNOTATE_LESION",
        resource_target=f"SEGMENT:{segment}",
        client_ip=request.remote_addr or "127.0.0.1",
        detail={"segment": segment, "stenosis_ratio": stenosis_ratio, "notes": notes}
    )

    return jsonify({
        "code": 200,
        "message": f"解剖段 [{segment}] 狭窄标注成功，已实时联动数字孪生解算",
        "data": {
            "segment": segment,
            "stenosis_ratio": stenosis_ratio,
            "updated_raw": round(0.35 + 0.2 * stenosis_ratio, 3)
        }
    })

@clinical_bp.route('/rehab-simulate', methods=['POST'])
def simulate_rehab():
    """呼吸康复推演：模拟缩唇呼吸与BiPAP正压通气治疗后的气道流体力学改善"""
    data = request.get_json() or {}
    therapy_type = data.get("therapy_type", "BiPAP_VENTILATION") # BiPAP_VENTILATION 或 PURSED_LIP_BREATHING
    
    # 模拟推演后阻力与狭窄改善
    improved_raw = 0.312 # 下降至接近正常
    improved_stenosis = 0.35
    
    physiological_sim_service.update_parameters({
        "copd_resistance": improved_raw,
        "stenosis_ratio": improved_stenosis,
        "ie_ratio": 0.4 # 延长呼气相
    })

    audit_service.record_action(
        user_id=2,
        username="dr_wang",
        role_code="pulmonologist",
        action="REHAB_SIMULATION",
        resource_target="SYU-COPD-2026-088",
        client_ip=request.remote_addr or "127.0.0.1",
        detail={"therapy": therapy_type, "projected_fev1_gain": "+280ml"}
    )

    return jsonify({
        "code": 200,
        "message": "数字孪生肺康复推演完成",
        "data": {
            "therapy_applied": therapy_type,
            "baseline_raw": 0.485,
            "improved_raw": improved_raw,
            "airway_resistance_reduction": "35.7%",
            "fev1_projected_increase_ml": 280,
            "expiratory_collapse_risk": "从极高降至轻度",
            "stenosis_flutter_suppressed": True
        }
    })

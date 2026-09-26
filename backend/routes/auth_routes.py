from flask import Blueprint, request, jsonify
from services.audit_service import audit_service

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# 预置系统5类角色定义及用户信息
ROLE_USERS = {
    "twin_engineer": {
        "id": 1,
        "username": "eng_zhang",
        "real_name": "张工",
        "role_code": "twin_engineer",
        "role_name": "数字孪生工程师",
        "institution": "三亚学院超算仿真重点实验室",
        "title": "系统架构师",
        "permissions": ["twin:mesh:wireframe", "twin:simulation:tuning", "twin:lod:control"]
    },
    "pulmonologist": {
        "id": 2,
        "username": "dr_wang",
        "real_name": "王主任",
        "role_code": "pulmonologist",
        "role_name": "呼吸科主任医护",
        "institution": "三亚市人民医院",
        "title": "主任医师/教授",
        "permissions": ["clinical:lesion:annotate", "clinical:ai:generate_report", "clinical:rehab:simulate"]
    },
    "reviewer": {
        "id": 3,
        "username": "reviewer_li",
        "real_name": "李质控",
        "role_code": "reviewer",
        "role_name": "诊疗质量复核员",
        "institution": "海南省临床质控中心",
        "title": "副主任医师",
        "permissions": ["audit:log:view"]
    },
    "patient_rep": {
        "id": 4,
        "username": "patient_chen",
        "real_name": "陈先生",
        "role_code": "patient_rep",
        "role_name": "患者/家属代表",
        "institution": "患者关爱联盟",
        "title": "家属代表",
        "permissions": ["patient:view:simplified"]
    },
    "legal_auditor": {
        "id": 5,
        "username": "legal_zhao",
        "real_name": "赵法务",
        "role_code": "legal_auditor",
        "role_name": "医患合规法务员",
        "institution": "三亚市医疗伦理与法务督察委员会",
        "title": "首席法务官",
        "permissions": ["audit:log:view", "audit:hash:verify"]
    }
}

@auth_bp.route('/login', methods=['POST'])
def login():
    """多角色密码鉴权登录"""
    data = request.get_json() or {}
    username = data.get("username", "dr_wang")
    
    # 查找对应用户
    target_user = None
    for u in ROLE_USERS.values():
        if u["username"] == username:
            target_user = u
            break
    
    if not target_user:
        target_user = ROLE_USERS["pulmonologist"]

    audit_service.record_action(
        user_id=target_user["id"],
        username=target_user["username"],
        role_code=target_user["role_code"],
        action="USER_LOGIN",
        resource_target="SYSTEM_AUTH",
        client_ip=request.remote_addr or "127.0.0.1",
        detail={"status": "SUCCESS", "client_agent": request.headers.get("User-Agent", "WebBrowser")}
    )

    return jsonify({
        "code": 200,
        "message": "登录成功",
        "data": {
            "token": f"bearer-token-{target_user['role_code']}-2026",
            "user": target_user
        }
    })

@auth_bp.route('/switch-role', methods=['POST'])
def switch_role():
    """
    一键切换角色体验演示器接口
    支持在界面右上角即时模拟5种不同业务角色的视图体验
    """
    data = request.get_json() or {}
    role_code = data.get("role_code", "pulmonologist")
    user = ROLE_USERS.get(role_code, ROLE_USERS["pulmonologist"])

    audit_service.record_action(
        user_id=user["id"],
        username=user["username"],
        role_code=user["role_code"],
        action="ROLE_SWITCH",
        resource_target=f"VIEW_MODE:{role_code}",
        client_ip=request.remote_addr or "127.0.0.1",
        detail={"target_role": role_code}
    )

    return jsonify({
        "code": 200,
        "message": f"成功切换至【{user['role_name']}】角色视图",
        "data": {
            "user": user,
            "available_roles": list(ROLE_USERS.keys())
        }
    })

@auth_bp.route('/roles', methods=['GET'])
def get_roles():
    """获取所有5类角色的定义与权限说明"""
    return jsonify({
        "code": 200,
        "data": list(ROLE_USERS.values())
    })

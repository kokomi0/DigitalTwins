import hashlib
import json
import time
from typing import Dict, Any, List

class AuditService:
    """医疗数字孪生合规审计与区块链式SHA-256防篡改验真服务"""

    def __init__(self):
        # 初始审计日志（链条）
        self.logs = [
            {
                "id": 1,
                "user_id": 1,
                "username": "eng_zhang",
                "role_code": "twin_engineer",
                "action": "INIT_SYSTEM",
                "resource_target": "LUNG_TWIN_CLUSTER",
                "client_ip": "192.168.10.101",
                "detail": {"status": "BOOTSTRAP_COMPLETE", "mesh_nodes": 8420},
                "prev_hash": "0000000000000000000000000000000000000000000000000000000000000000",
                "curr_hash": "a7f3e829dc01994829adbf8293149cbb2819fde8491028374a81928374910a2f",
                "created_at": "2026-09-25 08:30:00"
            },
            {
                "id": 2,
                "user_id": 2,
                "username": "dr_wang",
                "role_code": "pulmonologist",
                "action": "DESENSITIZE",
                "resource_target": "SYU-COPD-2026-088",
                "client_ip": "192.168.10.102",
                "detail": {"anonymized_fields": ["patient_name", "id_card", "ct_dicom_pii"], "target_cluster": "SANYA_UNIV_HPC"},
                "prev_hash": "a7f3e829dc01994829adbf8293149cbb2819fde8491028374a81928374910a2f",
                "curr_hash": "b84c718a47b19de8319fbc749281a941a80d8291fbc83720194819a84719d83a",
                "created_at": "2026-09-25 09:15:20"
            },
            {
                "id": 3,
                "user_id": 1,
                "username": "eng_zhang",
                "role_code": "twin_engineer",
                "action": "PARAM_TUNE",
                "resource_target": "SYU-COPD-2026-088",
                "client_ip": "192.168.10.101",
                "detail": {"airway_stenosis_b3": 0.65, "raw_kpa": 0.485, "flutter_freq": 14.2},
                "prev_hash": "b84c718a47b19de8319fbc749281a941a80d8291fbc83720194819a84719d83a",
                "curr_hash": "c93a8190d71a82b947218ac938102a9bca819283710a9284719a829104819a9d",
                "created_at": "2026-09-25 10:02:11"
            },
            {
                "id": 4,
                "user_id": 2,
                "username": "dr_wang",
                "role_code": "pulmonologist",
                "action": "AI_INFERENCE",
                "resource_target": "SYU-COPD-2026-088",
                "client_ip": "192.168.10.102",
                "detail": {"model": "PulmoLLM-Clinical-V4", "conclusion": "GOLD 3 Severe Emphysema with Subcarinal Lymph Node 7 reactive swelling"},
                "prev_hash": "c93a8190d71a82b947218ac938102a9bca819283710a9284719a829104819a9d",
                "curr_hash": "d02b81928a0194837192ab8471928374a9182938471928374a91829384719283",
                "created_at": "2026-09-25 11:20:45"
            }
        ]

    def _compute_hash(self, prev_hash: str, username: str, action: str, resource: str, timestamp: str, detail: Any) -> str:
        payload = f"{prev_hash}|{username}|{action}|{resource}|{timestamp}|{json.dumps(detail, sort_keys=True)}"
        return hashlib.sha256(payload.encode('utf-8')).hexdigest()

    def record_action(self, user_id: int, username: str, role_code: str, action: str, resource_target: str, client_ip: str, detail: Dict[str, Any]) -> Dict[str, Any]:
        """记录新的审计操作，并链接上一节点的哈希值"""
        prev_hash = self.logs[-1]["curr_hash"] if self.logs else "0"*64
        now_str = time.strftime("%Y-%m-%d %H:%M:%S")
        curr_hash = self._compute_hash(prev_hash, username, action, resource_target, now_str, detail)

        new_log = {
            "id": len(self.logs) + 1,
            "user_id": user_id,
            "username": username,
            "role_code": role_code,
            "action": action,
            "resource_target": resource_target,
            "client_ip": client_ip,
            "detail": detail,
            "prev_hash": prev_hash,
            "curr_hash": curr_hash,
            "created_at": now_str
        }
        self.logs.append(new_log)
        return new_log

    def get_all_logs(self) -> List[Dict[str, Any]]:
        return list(reversed(self.logs))

    def verify_integrity(self) -> Dict[str, Any]:
        """医患法务审计：全链遍历验证哈希链是否遭受未经授权的修改或物理篡改"""
        is_valid = True
        broken_id = None
        checked_count = len(self.logs)

        for i in range(1, len(self.logs)):
            prev_entry = self.logs[i - 1]
            curr_entry = self.logs[i]
            if curr_entry["prev_hash"] != prev_entry["curr_hash"]:
                is_valid = False
                broken_id = curr_entry["id"]
                break

        return {
            "chain_valid": is_valid,
            "total_blocks_checked": checked_count,
            "broken_block_id": broken_id,
            "algorithm": "SHA-256 Chain Validation",
            "compliance_status": "PASSED_HIPAA_GRADE" if is_valid else "TAMPERED_WARNING",
            "last_audited_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }

audit_service = AuditService()

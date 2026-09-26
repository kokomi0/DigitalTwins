import math
import time
from typing import Dict, Any, List

class PhysiologicalSimulationService:
    """
    肺部数字孪生呼吸动力学与流体力学（CFD）仿真服务
    模拟潮气呼吸运动、气道阻力 (Raw) 影响、COPD 狭窄处高频颤振及压力场分布
    """

    def __init__(self):
        # 默认生理学基线与病理参数
        self.params = {
            "respiratory_rate": 15,          # 呼吸频率 (次/分)
            "ie_ratio": 0.5,                 # 吸呼比 (1:2)
            "copd_resistance": 0.485,        # 气道阻力 Raw (kPa·s/L, 正常 < 0.25)
            "stenosis_location": "RB3",      # 重点狭窄段: 右肺上叶前段
            "stenosis_ratio": 0.65,          # 狭窄管径缩减率 65%
            "airway_flutter_gain": 1.0,      # 气道颤振增益
            "peep_external": 5.0,            # 外部呼气末正压设定 (cmH2O)
            "lod_level": "HIGH"              # LOD级别: HIGH, MEDIUM, LOW
        }

    def update_parameters(self, new_params: Dict[str, Any]):
        """数字孪生工程师或呼吸科医生动态微调参数"""
        for k, v in new_params.items():
            if k in self.params:
                self.params[k] = v
        return self.params

    def get_current_parameters(self) -> Dict[str, Any]:
        return self.params

    def compute_frame(self, t_sec: float) -> Dict[str, Any]:
        """
        根据当前仿真时间 t_sec 计算生理状态帧
        采用呼吸流体力学正弦拟合方程计算压力-流速-容积曲线
        """
        rr = self.params["respiratory_rate"]
        period = 60.0 / rr # 单个呼吸周期时长 (约4.0秒)
        phase_time = t_sec % period
        insp_duration = period * (self.params["ie_ratio"] / (1.0 + self.params["ie_ratio"])) # 约1.33秒

        raw = self.params["copd_resistance"]
        stenosis = self.params["stenosis_ratio"]

        if phase_time < insp_duration:
            # 吸气相 (Inspiration)
            phase = "INSPIRATION"
            t_norm = phase_time / insp_duration
            # 吸气流速正弦波形
            flow = 0.9 * math.sin(t_norm * math.pi)
            # 气道压力上升 (克服弹力阻力与气道阻力)
            paw = 0.8 + 1.6 * (flow * raw) + 0.5 * math.sin(t_norm * math.pi)
            volume = 0.55 * (1.0 - math.cos(t_norm * math.pi)) / 2.0
            # 吸气时气道轻微被动扩张
            expansion = 1.0 + 0.08 * (volume / 0.55)
            flutter = 0.01 * math.sin(t_sec * 30.0)
        else:
            # 呼气相 (Expiration) - COPD患者呼气受限，流速峰值低且拖尾
            phase = "EXPIRATION"
            exp_duration = period - insp_duration
            t_norm = (phase_time - insp_duration) / exp_duration
            # 呼气流速为负值
            flow = -0.75 * math.sin(t_norm * math.pi) * math.exp(-t_norm * 0.8)
            paw = 0.8 - 0.4 * abs(flow * raw) + 0.3 * (1.0 - t_norm)
            volume = 0.55 * (1.0 + math.cos(t_norm * math.pi)) / 2.0
            expansion = 1.0 + 0.08 * (volume / 0.55)
            # 呼气相狭窄气道由于内源性正压失稳，产生特征性颤振 (Fluttering)
            flutter_freq = 18.0 + 12.0 * stenosis
            flutter = (0.05 + 0.08 * stenosis) * math.sin(t_sec * flutter_freq) * self.params["airway_flutter_gain"]

        # 针对各级支气管计算局域压降分布
        b3_pressure = paw * (1.0 - 0.45 * stenosis) # RB3严重压降

        return {
            "timestamp": round(t_sec, 2),
            "phase": phase,
            "metrics": {
                "airway_pressure_kpa": round(paw, 3),
                "airway_pressure_cmh2o": round(paw * 10.197, 2),
                "flow_rate_lps": round(flow, 3),
                "tidal_volume_liters": round(volume, 3),
                "expansion_ratio": round(expansion, 4),
                "flutter_displacement": round(flutter, 4),
                "stenosis_ratio": stenosis,
                "current_raw": raw
            },
            "pressure_field": [
                {"id": "TRACHEA", "pressure_kpa": round(paw, 3), "velocity_mps": 3.8},
                {"id": "RMB", "pressure_kpa": round(paw * 0.95, 3), "velocity_mps": 4.5},
                {"id": "LMB", "pressure_kpa": round(paw * 0.93, 3), "velocity_mps": 4.2},
                {"id": "RUB", "pressure_kpa": round(paw * 0.88, 3), "velocity_mps": 5.2},
                {"id": "RB3", "pressure_kpa": round(b3_pressure, 3), "velocity_mps": round(4.0 + 6.0 * stenosis, 2), "critical": True},
                {"id": "RMLB", "pressure_kpa": round(paw * 0.86, 3), "velocity_mps": 4.1},
                {"id": "RLB", "pressure_kpa": round(paw * 0.84, 3), "velocity_mps": 4.3},
                {"id": "LUB", "pressure_kpa": round(paw * 0.85, 3), "velocity_mps": 4.4},
                {"id": "LLB", "pressure_kpa": round(paw * 0.83, 3), "velocity_mps": 4.2}
            ]
        }

    def generate_waveform_history(self, points: int = 40) -> List[Dict[str, Any]]:
        """为前端ECharts提供初始的连续波形时间切片"""
        history = []
        step = 0.1
        start_t = time.time() - (points * step)
        for i in range(points):
            t = start_t + (i * step)
            history.append(self.compute_frame(t))
        return history

physiological_sim_service = PhysiologicalSimulationService()

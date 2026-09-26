import time
from celery import Celery
from config import Config

celery_app = Celery(
    'lung_twin_tasks',
    broker=Config.CELERY_BROKER_URL,
    backend=Config.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Shanghai',
    enable_utc=True
)

@celery_app.task(name="tasks.async_cfd_simulation")
def async_cfd_simulation(patient_anon_code: str, stenosis_ratio: float, iterations: int = 100):
    """
    模拟三亚学院超算集群执行高精度气道 Navier-Stokes CFD 流体方程解算任务
    """
    time.sleep(1.5) # 模拟超算分布式网格解算延时
    return {
        "task_status": "COMPLETED",
        "patient_code": patient_anon_code,
        "grid_cells_computed": 4200000,
        "convergence_residual": 1.4e-5,
        "stenosis_ratio": stenosis_ratio,
        "peak_wall_shear_stress_pa": round(12.4 * (1.0 + stenosis_ratio * 1.5), 2),
        "pressure_drop_kpa": round(0.42 * (1.0 + stenosis_ratio * 2.2), 3)
    }

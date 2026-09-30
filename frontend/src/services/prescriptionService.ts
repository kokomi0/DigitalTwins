// 医嘱与处方协同服务 (闭环流转: 医生端 What-if 生成处方 ➔ 患者端 APP 实时弹窗确认)

export interface Prescription {
  id: string;
  prescription_no: string;
  patient_id: string;
  patient_name: string;
  doctor_name: string;
  doctor_title: string;
  regimen_type: 'PLAN_A' | 'PLAN_B' | 'PLAN_C';
  regimen_name: string;
  drugs: Array<{
    name: string;
    dosage: string;
    freq: string;
    device: string;
    remaining_doses: number;
  }>;
  expected_fev1_gain: string;
  expected_aecopd_drop: string;
  cat_score_target: string;
  created_at: string;
  status: 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'EXECUTING';
  digital_signature: string;
}

const STORAGE_KEY = 'usy_copd_active_prescriptions';

export const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx-20260928-01',
    prescription_no: 'RX-SYH-20260928-8821',
    patient_id: 'HOSP-ENC-9081244109',
    patient_name: '张*民',
    doctor_name: '王建平',
    doctor_title: '主任医师 / 教授',
    regimen_type: 'PLAN_A',
    regimen_name: '方案 A: LABA+LAMA 双支气管扩张剂联合维持疗法',
    drugs: [
      {
        name: '噻托溴铵/福莫特罗吸入粉雾剂',
        dosage: '18μg / 12μg',
        freq: '每日1次，早晨吸入1吸',
        device: '准纳尔吸入器 (Diskus)',
        remaining_doses: 58
      },
      {
        name: '乙酰半胱氨酸泡腾片',
        dosage: '0.6g',
        freq: '每日2次，溶于温开水服用',
        device: '口服剂型',
        remaining_doses: 24
      }
    ],
    expected_fev1_gain: '+15.2%',
    expected_aecopd_drop: '-1.2 次/年',
    cat_score_target: '由 21 分降至 12 分 (改善 42.8%)',
    created_at: '2026-09-28 09:30:15',
    status: 'CONFIRMED',
    digital_signature: 'SHA256:7a9f8c4e2b1d3f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a'
  }
];

class PrescriptionService {
  private listeners: Array<(prescriptions: Prescription[]) => void> = [];

  constructor() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PRESCRIPTIONS));
    }
  }

  public getPrescriptions(): Prescription[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : INITIAL_PRESCRIPTIONS;
    } catch {
      return INITIAL_PRESCRIPTIONS;
    }
  }

  public getLatestPendingPrescription(): Prescription | null {
    const list = this.getPrescriptions();
    return list.find((p) => p.status === 'PENDING_CONFIRMATION') || null;
  }

  public createPrescription(newRx: Omit<Prescription, 'id' | 'created_at' | 'status' | 'digital_signature'>): Prescription {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const hashRandom = Math.random().toString(36).substring(2, 10).toUpperCase();

    const created: Prescription = {
      ...newRx,
      id: `rx-${Date.now()}`,
      created_at: timeStr,
      status: 'PENDING_CONFIRMATION',
      digital_signature: `CA-SIGN:SHA256:${hashRandom}8F4B92C78A1D3F${now.getTime()}`
    };

    const current = this.getPrescriptions();
    const updated = [created, ...current];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    this.notify(updated);
    return created;
  }

  public confirmPrescription(id: string): void {
    const list = this.getPrescriptions();
    const updated = list.map((p) => {
      if (p.id === id) {
        return { ...p, status: 'CONFIRMED' as const };
      }
      return p;
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    this.notify(updated);
  }

  public subscribe(listener: (prescriptions: Prescription[]) => void): () => void {
    this.listeners.push(listener);
    listener(this.getPrescriptions());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(list: Prescription[]): void {
    this.listeners.forEach((l) => l(list));
  }
}

export const prescriptionService = new PrescriptionService();

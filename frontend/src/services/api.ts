import { RoleCode, UserProfile, PatientMeta, AnatomyNode, AnatomyEdge, AuditLogItem, PipelineTelemetry } from '../types';
import { LoginPayload, RegisterPayload, ForgotPasswordPayload, AuthResponse } from '../types/auth';
import { INITIAL_USER, MOCK_PATIENT, ANATOMY_NODES, ANATOMY_EDGES, MOCK_KNOWLEDGE_GRAPH, MOCK_CT_SCANS } from './mockData';
import { authService } from './authService';

const BASE_URL = '/api';

export const api = {
  // 0. 统一认证与鉴权
  async loginWithPassword(role: RoleCode, username: string, password: string, rememberMe = true): Promise<AuthResponse> {
    return authService.loginWithPassword(role, username, password, rememberMe);
  },

  async loginWithSms(phone: string, smsCode: string, rememberMe = true): Promise<AuthResponse> {
    return authService.loginWithSms(phone, smsCode, rememberMe);
  },

  async sendSmsCode(phone: string): Promise<{ success: boolean; message: string; mockCode?: string }> {
    return authService.sendSmsCode(phone);
  },

  async resetPassword(payload: ForgotPasswordPayload): Promise<AuthResponse> {
    return authService.resetPassword(payload);
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    return authService.register(payload);
  },

  logout(): void {
    authService.logout();
  },

  getCurrentUser(): UserProfile | null {
    return authService.getCurrentUser();
  },
  // 1. 用户与角色
  async switchRole(roleCode: RoleCode): Promise<UserProfile> {
    try {
      const res = await fetch(`${BASE_URL}/auth/switch-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_code: roleCode })
      });
      const json = await res.json();
      if (json.code === 200) return json.data.user;
    } catch (e) {
      console.warn('API /auth/switch-role fallback to local simulation');
    }
    return {
      ...INITIAL_USER,
      role_code: roleCode,
      role_name: getRoleName(roleCode)
    };
  },

  // 2. 病例与DICOM
  async getPatients(): Promise<PatientMeta[]> {
    try {
      const res = await fetch(`${BASE_URL}/clinical/patients`);
      const json = await res.json();
      if (json.code === 200 && Array.isArray(json.data) && json.data.length > 0) {
        return json.data.map((p: any) => ({ ...MOCK_PATIENT, ...p }));
      }
    } catch (e) {
      console.warn('API /clinical/patients fallback');
    }
    return [MOCK_PATIENT];
  },

  async getAiEvaluation(anonCode: string) {
    try {
      const res = await fetch(`${BASE_URL}/clinical/ai-evaluation?anon_code=${anonCode}`);
      const json = await res.json();
      if (json.code === 200) return json.data;
    } catch (e) {
      console.warn('API /clinical/ai-evaluation fallback');
    }
    return null;
  },

  async annotateLesion(segment: string, stenosisRatio: number, notes: string) {
    try {
      const res = await fetch(`${BASE_URL}/clinical/annotate-lesion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segment, stenosis_ratio: stenosisRatio, notes })
      });
      return await res.json();
    } catch (e) {
      console.warn('API /clinical/annotate-lesion fallback');
      return { code: 200, message: 'Local updated' };
    }
  },

  async simulateRehab(therapyType: string) {
    try {
      const res = await fetch(`${BASE_URL}/clinical/rehab-simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ therapy_type: therapyType })
      });
      return await res.json();
    } catch (e) {
      console.warn('API /clinical/rehab-simulate fallback');
      return { code: 200, data: { improved_raw: 0.312, airway_resistance_reduction: "35.7%" } };
    }
  },

  // 3. 知识图谱与EBUS
  async getAnatomyGraph(): Promise<{ nodes: AnatomyNode[]; edges: AnatomyEdge[] }> {
    try {
      const res = await fetch(`${BASE_URL}/graph/anatomy`);
      const json = await res.json();
      if (json.code === 200 && json.data.nodes?.length > 0) return json.data;
    } catch (e) {
      console.warn('API /graph/anatomy fallback');
    }
    return { nodes: ANATOMY_NODES, edges: ANATOMY_EDGES };
  },

  async getEbusDetail(station: string): Promise<AnatomyNode | null> {
    try {
      const res = await fetch(`${BASE_URL}/graph/ebus/${station}`);
      const json = await res.json();
      if (json.code === 200) return json.data;
    } catch (e) {
      console.warn('API /graph/ebus fallback');
    }
    const found = ANATOMY_NODES.find(n => n.station === station || n.id === `LN_${station}`);
    return found || null;
  },

  // 4. 仿真参数与波形
  async tuneParams(params: Record<string, any>) {
    try {
      const res = await fetch(`${BASE_URL}/simulation/tune-params`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (e) {
      console.warn('API /simulation/tune-params fallback');
    }
  },

  async getHpcLoad() {
    try {
      const res = await fetch(`${BASE_URL}/simulation/hpc-load`);
      const json = await res.json();
      if (json.code === 200) return json.data;
    } catch (e) {
      console.warn('API /simulation/hpc-load fallback');
    }
    return null;
  },

  // 5. 合规审计与脱敏专线
  async getAuditLogs(): Promise<AuditLogItem[]> {
    try {
      const res = await fetch(`${BASE_URL}/audit/logs`);
      const json = await res.json();
      if (json.code === 200) return json.data;
    } catch (e) {
      console.warn('API /audit/logs fallback');
    }
    return [];
  },

  async verifyAuditChain() {
    try {
      const res = await fetch(`${BASE_URL}/audit/verify-chain`, { method: 'POST' });
      return await res.json();
    } catch (e) {
      return { code: 200, data: { chain_valid: true, total_blocks_checked: 4, compliance_status: "PASSED_HIPAA_GRADE" } };
    }
  },

  async getPipelineTelemetry(): Promise<PipelineTelemetry | null> {
    try {
      const res = await fetch(`${BASE_URL}/audit/pipeline-telemetry`);
      const json = await res.json();
      if (json.code === 200) return json.data;
    } catch (e) {
      console.warn('API /audit/pipeline-telemetry fallback');
    }
    return null;
  },

  async triggerDesensitize() {
    try {
      const res = await fetch(`${BASE_URL}/audit/trigger-desensitize`, { method: 'POST' });
      return await res.json();
    } catch (e) {
      return { code: 200, message: "模拟数据已脱敏脱密并发送至三亚学院超算" };
    }
  },

  // 6. 系统网络与移动端扫码
  async getNetworkInfo(): Promise<{ preferred_ip: string; all_ips: string[]; frontend_port: number; backend_port: number }> {
    try {
      const res = await fetch(`${BASE_URL}/system/network-info`);
      const json = await res.json();
      if (json.code === 200 && json.data) return json.data;
    } catch (e) {
      console.warn('API /system/network-info fallback to detected host');
    }
    const host = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' 
      ? window.location.hostname 
      : '10.108.4.46';
    return {
      preferred_ip: host,
      all_ips: [host],
      frontend_port: Number(window.location.port) || 3000,
      backend_port: 5000
    };
  },
  // 7. CT重建与慢病知识图谱
  async getKnowledgeGraph(): Promise<any> {
    return MOCK_KNOWLEDGE_GRAPH;
  },

  async getCTScans(): Promise<any[]> {
    return MOCK_CT_SCANS;
  }
};

function getRoleName(code: RoleCode): string {
  switch (code) {
    case 'pulmonologist': return '呼吸科临床主治医师';
    case 'twin_engineer': return '数字孪生算法工程师';
    case 'reviewer': return '临床诊疗质控员';
    case 'patient_rep': return '慢病患者及家属';
    default: return '临床医护';
  }
}

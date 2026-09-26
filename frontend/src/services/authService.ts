import { RoleCode, UserProfile } from '../types';
import { RoleConfig, LoginPayload, RegisterPayload, ForgotPasswordPayload, AuthResponse } from '../types/auth';

export const ROLES_CONFIG: Record<RoleCode, RoleConfig> = {
  pulmonologist: {
    code: 'pulmonologist',
    name: '呼吸科临床主治医师',
    category: 'clinical',
    institution: '三亚市人民医院 (呼吸与危重症医学科)',
    securityLevel: 'L3',
    securityDesc: '临床决策级 · CT导入/智能预警/方案决策',
    defaultLoginType: 'password',
    description: '核心主治主角，拥有CT序列导入、3D阅片、智能预警推演及慢病图谱方案决策权限',
    demoAccount: {
      username: 'dr_wang',
      password: 'Hosp_pass2026!',
      realName: '王建平',
      title: '主任医师 / 教授'
    }
  },
  twin_engineer: {
    code: 'twin_engineer',
    name: '数字孪生算法工程师',
    category: 'engineering',
    institution: '三亚学院 (超算与数字孪生重点实验室)',
    securityLevel: 'L4',
    securityDesc: '算法研发级 · 模型网格化/LOD/流体力学',
    defaultLoginType: 'password',
    description: '负责三维气道网格精细化、多尺度LOD调优及Navier-Stokes气流动力学仿真推演',
    demoAccount: {
      username: 'eng_zhang',
      password: 'Hpc_pass2026!',
      realName: '张宇翔',
      title: '资深仿真算法专家'
    }
  },
  reviewer: {
    code: 'reviewer',
    name: '临床诊疗质控员',
    category: 'quality',
    institution: '海南省胸部影像诊疗质控中心',
    securityLevel: 'L3',
    securityDesc: '质控复核级 · 双盲对比/指南依从性',
    defaultLoginType: 'password',
    description: '负责AI辅助诊断双盲复核、诊疗处方合规性与GOLD 2026临床指南依从性评价',
    demoAccount: {
      username: 'rev_li',
      password: 'Rev_pass2026!',
      realName: '李雪琴',
      title: '质控专家 / 副主任医师'
    }
  },
  patient_rep: {
    code: 'patient_rep',
    name: '慢病患者及家属',
    category: 'patient',
    institution: '三亚市人民医院 (呼吸门诊慢病关爱中心)',
    securityLevel: 'L1',
    securityDesc: '患者便民级 · 7x24h预警/康复打卡/通俗图谱',
    defaultLoginType: 'sms',
    description: '为COPD慢病患者提供7×24h智能预警、用药指南、呼吸训练打卡与通俗化健康知识图谱',
    demoAccount: {
      phone: '13808980001',
      smsCode: '888888',
      realName: '张*民 (患者及家属)',
      title: '慢病随访患者'
    }
  }
};

const STORAGE_KEY_USER = 'twin_auth_user';
const STORAGE_KEY_TOKEN = 'twin_auth_token';

// 模拟短信验证码缓存池
const smsCodeCache = new Map<string, { code: string; expiresAt: number }>();

export const authService = {
  /**
   * 发送模拟短信验证码
   */
  async sendSmsCode(phone: string): Promise<{ success: boolean; message: string; mockCode?: string }> {
    await new Promise(r => setTimeout(r, 600));

    // 简单手机号校验
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return { success: false, message: '请输入规范的11位中国大陆手机号码' };
    }

    const mockCode = phone === '13808980001' ? '888888' : Math.floor(100000 + Math.random() * 900000).toString();
    smsCodeCache.set(phone, {
      code: mockCode,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5分钟有效
    });

    // 控制台高亮输出仿真信息
    console.log(
      `%c[三亚数字孪生短信专线网关] %c已向手机号 +86 ${phone} 下发动态校验码: %c${mockCode} %c(5分钟内有效)`,
      'color: #06b6d4; font-weight: bold;',
      'color: #94a3b8;',
      'color: #38bdf8; font-weight: bold; background: #082f49; padding: 2px 6px; border-radius: 4px;',
      'color: #64748b;'
    );

    return {
      success: true,
      message: `验证码已发送至 +86 ${phone.slice(0, 3)}****${phone.slice(-4)}，请查收`,
      mockCode
    };
  },

  /**
   * 手机号 + 短信验证码登录 (患者/家属优先)
   */
  async loginWithSms(phone: string, smsCode: string, rememberMe = true): Promise<AuthResponse> {
    await new Promise(r => setTimeout(r, 700));

    if (!phone || !smsCode) {
      return { success: false, message: '请完整输入手机号码与短信验证码' };
    }

    // 针对演示账号放行，或者匹配缓存
    const cached = smsCodeCache.get(phone);
    const isValidCode = (phone === '13808980001' && (smsCode === '888888' || smsCode === '123456')) ||
      (cached && cached.code === smsCode && cached.expiresAt > Date.now()) ||
      smsCode === '888888';

    if (!isValidCode) {
      return { success: false, message: '验证码错误或已过期，请重新获取' };
    }

    const user: UserProfile = {
      id: 1,
      username: `user_${phone.slice(-4)}`,
      real_name: phone === '13808980001' ? '陈建国 (患者家属)' : '患者本人/家属',
      role_code: 'patient_rep',
      role_name: ROLES_CONFIG.patient_rep.name,
      institution: ROLES_CONFIG.patient_rep.institution,
      title: ROLES_CONFIG.patient_rep.demoAccount.title,
      permissions: ['patient:view_3d_twin', 'patient:health_diary', 'patient:rehab_guidance']
    };

    authService.saveAuthSession(user, rememberMe);
    return {
      success: true,
      message: '免密便民验证成功，欢迎进入肺部数字孪生互动中心',
      token: `twin_token_sms_${Date.now()}`,
      user
    };
  },

  /**
   * 工号/账号 + 密码登录 (主治医师、算法工程师、质控专家)
   */
  async loginWithPassword(
    role: RoleCode,
    username: string,
    password: string,
    rememberMe = true
  ): Promise<AuthResponse> {
    await new Promise(r => setTimeout(r, 800));

    if (!username || !password) {
      return { success: false, message: '请输入统一身份工号/账号及登录密码' };
    }

    const config = ROLES_CONFIG[role];
    if (!config) {
      return { success: false, message: '选定的角色配置不存在' };
    }

    // 匹配演示账号或标准测试凭证
    const isDemoMatch = 
      (config.demoAccount.username && username.trim().toLowerCase() === config.demoAccount.username.toLowerCase()) ||
      username === 'admin' ||
      username.startsWith('dr_') ||
      username.startsWith('eng_') ||
      username.startsWith('rev_') ||
      username.startsWith('law_') ||
      username.length >= 3;

    if (!isDemoMatch && password.length < 6) {
      return { success: false, message: '账号或安全密码输入有误，请核实后重试' };
    }

    const user: UserProfile = {
      id: role === 'pulmonologist' ? 2 : role === 'twin_engineer' ? 3 : 4,
      username: username,
      real_name: config.demoAccount.realName || `${config.name}专员`,
      role_code: role,
      role_name: config.name,
      institution: config.institution,
      title: config.demoAccount.title,
      permissions: [
        'twin:view_3d',
        'simulation:telemetry',
        role === 'pulmonologist' ? 'clinical:ct_import' : '',
        role === 'pulmonologist' ? 'clinical:lesion:annotate' : '',
        role === 'pulmonologist' ? 'clinical:knowledge_graph' : '',
        role === 'twin_engineer' ? 'engineering:tune_lod' : '',
        role === 'twin_engineer' ? 'engineering:mesh_refine' : '',
        role === 'reviewer' ? 'quality:double_blind' : '',
        role === 'reviewer' ? 'quality:guideline_review' : ''
      ].filter(Boolean)
    };

    authService.saveAuthSession(user, rememberMe);
    return {
      success: true,
      message: `专线鉴权通过：已认证为 [${config.institution}] ${user.real_name}`,
      token: `twin_token_pwd_${Date.now()}`,
      user
    };
  },

  /**
   * 找回密码
   */
  async resetPassword(payload: ForgotPasswordPayload): Promise<AuthResponse> {
    await new Promise(r => setTimeout(r, 800));

    if (payload.accountType === 'patient') {
      if (!payload.phone || !payload.smsCode || !payload.newPassword) {
        return { success: false, message: '请完整填写手机号、短信验证码及新设密码' };
      }
      return {
        success: true,
        message: '密码重置成功！请使用新密码或短信验证码重新登录'
      };
    } else {
      if (!payload.staffIdOrEmail) {
        return { success: false, message: '请输入院内工号或超算学术邮箱' };
      }
      return {
        success: true,
        message: '安全重置链接已发送至对应院内加密邮箱，请于15分钟内查收激活'
      };
    }
  },

  /**
   * 账号注册
   */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    await new Promise(r => setTimeout(r, 900));

    if (payload.accountType === 'patient') {
      if (!payload.phone || !payload.realName) {
        return { success: false, message: '请填写手机号和真实姓名' };
      }
      const user: UserProfile = {
        id: 999,
        username: `patient_${payload.phone.slice(-4)}`,
        real_name: payload.realName,
        role_code: 'patient_rep',
        role_name: ROLES_CONFIG.patient_rep.name,
        institution: ROLES_CONFIG.patient_rep.institution,
        title: '随访患者',
        permissions: ['patient:view_3d_twin', 'patient:health_diary']
      };
      authService.saveAuthSession(user, true);
      return {
        success: true,
        message: '患者/家属便民就诊账户即开即用！已自动为您登录系统',
        token: `twin_token_reg_${Date.now()}`,
        user
      };
    } else {
      if (!payload.realName || !payload.staffId) {
        return { success: false, message: '请填写姓名及院内工号/超算账号' };
      }
      return {
        success: true,
        message: '专业账户申请已提交至三亚市人民医院呼吸科/三亚学院重点实验室审核，1个工作日内将通过短信通知激活'
      };
    }
  },

  /**
   * 保存凭证至本地缓存
   */
  saveAuthSession(user: UserProfile, remember = true) {
    try {
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      storage.setItem(STORAGE_KEY_TOKEN, `twin_jwt_${user.role_code}_${Date.now()}`);
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  },

  /**
   * 读取当前已登录用户
   */
  getCurrentUser(): UserProfile | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USER) || sessionStorage.getItem(STORAGE_KEY_USER);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load session:', e);
    }
    return null;
  },

  /**
   * 退出登录
   */
  logout() {
    try {
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      sessionStorage.removeItem(STORAGE_KEY_USER);
      sessionStorage.removeItem(STORAGE_KEY_TOKEN);
    } catch (e) {
      console.error('Failed to clear session:', e);
    }
  }
};

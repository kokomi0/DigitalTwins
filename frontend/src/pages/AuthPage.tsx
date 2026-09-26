import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RoleCode, UserProfile } from '../types';
import { AuthMode, LoginType, RegisterPayload, ForgotPasswordPayload } from '../types/auth';
import { ROLES_CONFIG, authService } from '../services/authService';
import { AirwayBackgroundCanvas } from '../components/auth/AirwayBackgroundCanvas';
import { TechShowcase } from '../components/auth/TechShowcase';
import { RoleSelector } from '../components/auth/RoleSelector';
import { SmsCodeInput } from '../components/auth/SmsCodeInput';
import { SecuritySlider } from '../components/auth/SecuritySlider';
import { DemoAccountsBar } from '../components/auth/DemoAccountsBar';
import { 
  Activity, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  RotateCw, 
  HelpCircle, 
  PhoneCall, 
  Building2, 
  FileBadge, 
  Upload, 
  ChevronLeft,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface AuthPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  // 当前子模块：登录 | 注册 | 找回密码
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  // 当前选中的角色体系
  const [selectedRole, setSelectedRole] = useState<RoleCode>('pulmonologist');

  // 认证模式：手机验证码登录 (sms) 还是 密码登录 (password)
  const [loginType, setLoginType] = useState<LoginType>('password');

  // 登录表单字段
  const [username, setUsername] = useState<string>('dr_wang');
  const [password, setPassword] = useState<string>('Hosp_pass2026!');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [phone, setPhone] = useState<string>('13808980001');
  const [smsCode, setSmsCode] = useState<string>('888888');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [autoRenewToken, setAutoRenewToken] = useState<boolean>(true);

  // 安全防刷滑块状态
  const [isSliderVerified, setIsSliderVerified] = useState<boolean>(true);

  // 加载与消息提示
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 找回密码抽屉/展开指引
  const [showAdminContact, setShowAdminContact] = useState<boolean>(false);
  const [forgotPayload, setForgotPayload] = useState<ForgotPasswordPayload>({
    accountType: 'patient',
    phone: '',
    smsCode: '',
    newPassword: '',
    staffIdOrEmail: ''
  });

  // 注册模块通道：患者/家属 vs 专业人员
  const [registerType, setRegisterType] = useState<'patient' | 'professional'>('patient');
  const [registerPayload, setRegisterPayload] = useState<RegisterPayload>({
    accountType: 'patient',
    role: 'patient_rep',
    phone: '',
    smsCode: '',
    patientUid: 'SYU-COPD-2026-088',
    realName: '',
    username: '',
    password: '',
    institution: '三亚市人民医院',
    department: '呼吸与危重症医学科',
    staffId: '',
    credentialProof: ''
  });
  const [mockFileName, setMockFileName] = useState<string | null>(null);

  // 角色切换处理器：自动平滑过渡认证模式
  const handleRoleChange = (role: RoleCode) => {
    setSelectedRole(role);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (role === 'patient_rep') {
      setLoginType('sms');
      const demo = ROLES_CONFIG.patient_rep.demoAccount;
      if (demo.phone) setPhone(demo.phone);
      if (demo.smsCode) setSmsCode(demo.smsCode);
    } else {
      setLoginType('password');
      const demo = ROLES_CONFIG[role].demoAccount;
      if (demo.username) setUsername(demo.username);
      if (demo.password) setPassword(demo.password);
      // 预先给滑块一个需要核验的状态，方便演示时用户体验
      setIsSliderVerified(false);
    }
  };

  // 演示账号一键快速填入
  const handleFillDemo = (role: RoleCode) => {
    handleRoleChange(role);
    const config = ROLES_CONFIG[role];
    if (role === 'patient_rep') {
      setPhone(config.demoAccount.phone || '13808980001');
      setSmsCode(config.demoAccount.smsCode || '888888');
    } else {
      setUsername(config.demoAccount.username || '');
      setPassword(config.demoAccount.password || '');
      setIsSliderVerified(true);
    }
    setSuccessMessage(`已快速填充【${config.name}】演示凭证`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  // 执行登录提交
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // 校验模式
    if (loginType === 'sms') {
      if (!phone || !smsCode) {
        setErrorMessage('请完整输入就诊手机号与6位短信验证码');
        return;
      }
      try {
        setIsLoading(true);
        const res = await authService.loginWithSms(phone, smsCode, rememberMe);
        if (res.success && res.user) {
          setSuccessMessage(res.message);
          setTimeout(() => {
            onLoginSuccess(res.user!);
          }, 600);
        } else {
          setErrorMessage(res.message || '登录失败，请核对信息');
        }
      } catch (err: any) {
        setErrorMessage(err.message || '网络连接超时，请重试');
      } finally {
        setIsLoading(false);
      }
    } else {
      // 密码登录
      if (!username || !password) {
        setErrorMessage('请输入统一身份工号及安全密码');
        return;
      }
      if (!isSliderVerified) {
        setErrorMessage('请向右滑动完成专线安全防刷核验');
        return;
      }
      try {
        setIsLoading(true);
        const res = await authService.loginWithPassword(selectedRole, username, password, rememberMe);
        if (res.success && res.user) {
          setSuccessMessage(res.message);
          setTimeout(() => {
            onLoginSuccess(res.user!);
          }, 600);
        } else {
          setErrorMessage(res.message || '身份认证未通过');
        }
      } catch (err: any) {
        setErrorMessage(err.message || '身份鉴权异常，请联系超算管理员');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 执行找回密码
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      setIsLoading(true);
      const res = await authService.resetPassword({
        ...forgotPayload,
        accountType: selectedRole === 'patient_rep' ? 'patient' : 'professional'
      });
      if (res.success) {
        setSuccessMessage(res.message);
        setTimeout(() => {
          setAuthMode('login');
        }, 2200);
      } else {
        setErrorMessage(res.message);
      }
    } catch (e: any) {
      setErrorMessage(e.message || '重置请求失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 执行注册
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      setIsLoading(true);
      const res = await authService.register({
        ...registerPayload,
        accountType: registerType,
        role: registerType === 'patient' ? 'patient_rep' : selectedRole
      });
      if (res.success) {
        setSuccessMessage(res.message);
        if (registerType === 'patient' && res.user) {
          setTimeout(() => {
            onLoginSuccess(res.user!);
          }, 800);
        } else {
          setTimeout(() => {
            setAuthMode('login');
          }, 2500);
        }
      } else {
        setErrorMessage(res.message);
      }
    } catch (e: any) {
      setErrorMessage(e.message || '注册申请提交失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen relative flex items-center justify-center overflow-hidden bg-twin-bg text-slate-100 font-sans">
      {/* 呼吸气流与支气管仿生粒子动效背景 */}
      <AirwayBackgroundCanvas />

      {/* 手机端精简品牌顶栏 (仅在屏幕小于 1024px 时呈现) */}
      <div className="lg:hidden absolute top-0 inset-x-0 h-14 bg-slate-950/85 backdrop-blur-md border-b border-cyan-900/40 px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>肺部数字孪生平台</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                B1-B10
              </span>
            </h1>
            <p className="text-[9px] text-slate-400">三亚市人民医院 ✕ 三亚学院超算</p>
          </div>
        </div>
        <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60">
          <ShieldCheck className="w-3 h-3" />
          <span>专线已接通</span>
        </div>
      </div>

      {/* 核心双栏/自适应容器 */}
      <div className="relative z-10 w-full h-full max-w-[1560px] mx-auto flex flex-col lg:flex-row items-center justify-center lg:p-6 xl:p-10">
        
        {/* ================= 电脑端左侧科技展区 (60%) ================= */}
        <div className="hidden lg:flex w-7/12 xl:w-3/5 h-full max-h-[880px] flex-col justify-between pr-4 xl:pr-8">
          <TechShowcase />
        </div>

        {/* ================= 右侧操作面板 (40% / 手机端100%) ================= */}
        <div className="w-full lg:w-5/12 xl:w-2/5 h-full lg:h-auto max-h-screen lg:max-h-[92vh] flex flex-col justify-center px-3 sm:px-6 pt-16 lg:pt-0 pb-4 overflow-y-auto lg:overflow-visible">
          
          {/* 玻璃拟态认证主卡片 */}
          <div className="w-full max-w-lg mx-auto bg-slate-900/80 backdrop-blur-xl border border-cyan-800/40 rounded-2xl shadow-2xl shadow-cyan-950/60 p-4 sm:p-6 relative overflow-hidden">
            
            {/* 顶部微呼吸光效线 */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>

            {/* 顶栏：模块切换标头 (登录 ⇋ 注册 ⇋ 找回密码) */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-100 flex items-center gap-2">
                  <span>
                    {authMode === 'login'
                      ? '统一身份认证'
                      : authMode === 'register'
                      ? '账号申请注册'
                      : '重置与找回密码'}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
                    AUTH GATEWAY
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {authMode === 'login'
                    ? '已接入三亚超算中心生物力学安全访问矩阵'
                    : authMode === 'register'
                    ? '患者便民通道与医研人员审核备案通道'
                    : '根据角色类型自助重置或联系内网管理员'}
                </p>
              </div>

              {/* 快速返回或切换标签 */}
              {authMode !== 'login' ? (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 px-2.5 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/50 hover:border-cyan-400 transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>返回登录</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium px-2.5 py-1.5 rounded-lg bg-cyan-950/50 border border-cyan-800/40 hover:border-cyan-400 transition"
                >
                  注册账号
                </button>
              )}
            </div>

            {/* 一键填入演示账号浮条 (仅在登录态呈现) */}
            {authMode === 'login' && (
              <div className="mb-3.5">
                <DemoAccountsBar onFillDemo={handleFillDemo} activeRole={selectedRole} />
              </div>
            )}

            {/* 消息提示框 */}
            {errorMessage && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-950/70 border border-rose-800/60 text-rose-200 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="flex-1">{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800/60 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="flex-1">{successMessage}</span>
              </div>
            )}

            {/* 动态内容动画容器 */}
            <AnimatePresence mode="wait">
              {authMode === 'login' && (
                <motion.div
                  key="login-form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3.5"
                >
                  {/* 1. 五角色智能选择器 */}
                  <RoleSelector selectedRole={selectedRole} onSelectRole={handleRoleChange} />

                  <form onSubmit={handleLoginSubmit} className="space-y-3">
                    {/* 2. 自适应认证模式 */}
                    {loginType === 'sms' ? (
                      /* ========== 患者/家属：手机短信验证码模式 ========== */
                      <SmsCodeInput
                        phone={phone}
                        onPhoneChange={setPhone}
                        smsCode={smsCode}
                        onSmsCodeChange={setSmsCode}
                        onSendSuccessNotification={msg => {
                          setSuccessMessage(msg);
                          setTimeout(() => setSuccessMessage(null), 5000);
                        }}
                        onSwitchToPasswordLogin={() => setLoginType('password')}
                      />
                    ) : (
                      /* ========== 医护/工程师等专业角色：工号/账号 + 密码模式 ========== */
                      <div className="space-y-3">
                        {/* 专线认证提示徽标 */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 text-xs">
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>已接入医院内网加密专线与数字证书认证</span>
                          </div>
                          {selectedRole === 'patient_rep' && (
                            <button
                              type="button"
                              onClick={() => setLoginType('sms')}
                              className="text-[11px] text-emerald-400 hover:text-emerald-300 underline"
                            >
                              使用免密短信
                            </button>
                          )}
                        </div>

                        {/* 工号/账号输入框 */}
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                            <span>
                              {selectedRole === 'twin_engineer'
                                ? '三亚学院超算账号 / 学术ID'
                                : '医院统一工号 / 执业代码'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {ROLES_CONFIG[selectedRole].institution}
                            </span>
                          </label>
                          <div className="relative flex items-center">
                            <User className="w-4 h-4 text-slate-400 absolute left-3" />
                            <input
                              type="text"
                              value={username}
                              onChange={e => setUsername(e.target.value)}
                              placeholder="请输入工号 (如: dr_wang / eng_zhang)"
                              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-slate-100 placeholder:text-slate-500 text-sm font-mono tracking-wider transition outline-none h-11"
                            />
                          </div>
                        </div>

                        {/* 密码输入框 (带显隐切换) */}
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                            <span>安全密码</span>
                            <button
                              type="button"
                              onClick={() => {
                                setAuthMode('forgot_password');
                                setErrorMessage(null);
                              }}
                              className="text-[11px] text-cyan-400 hover:text-cyan-300 transition"
                            >
                              忘记密码？
                            </button>
                          </label>
                          <div className="relative flex items-center">
                            <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={e => setPassword(e.target.value)}
                              placeholder="请输入专线登录密码"
                              className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-slate-100 placeholder:text-slate-500 text-sm font-mono tracking-wider transition outline-none h-11"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 text-slate-400 hover:text-slate-200 transition"
                              title={showPassword ? '隐藏密码' : '显示密码'}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* 安全滑动核验 */}
                        <SecuritySlider
                          isVerified={isSliderVerified}
                          onVerifyChange={setIsSliderVerified}
                        />
                      </div>
                    )}

                    {/* 记住我与安全选项 */}
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={e => setRememberMe(e.target.checked)}
                          className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-slate-900"
                        />
                        <span>记住本次鉴权状态</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={autoRenewToken}
                          onChange={e => setAutoRenewToken(e.target.checked)}
                          className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-slate-900"
                        />
                        <span className="text-[11px] text-cyan-400/80">令牌自动续期 (SM2)</span>
                      </label>
                    </div>

                    {/* 提交登录大按钮 (≥44px 热区) */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-500 to-cyan-500 hover:from-cyan-500 hover:to-sky-400 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/25 border border-cyan-300/40 flex items-center justify-center gap-2 transition duration-150 active:scale-[0.98] disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RotateCw className="w-4 h-4 animate-spin text-slate-950" />
                          <span>正在执行多方鉴权校验...</span>
                        </>
                      ) : (
                        <>
                          <span>认证并进入数字孪生工作台</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ================= 找回密码模块 ================= */}
              {authMode === 'forgot_password' && (
                <motion.div
                  key="forgot-form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* 身份模式提示 */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                    <span className="font-semibold text-cyan-300">
                      {selectedRole === 'patient_rep'
                        ? '【患者/家属模式】手机验证码直接重置'
                        : '【专业人员模式】院内安全邮箱重置或内网工单'}
                    </span>
                    <p className="text-slate-400 mt-1">
                      {selectedRole === 'patient_rep'
                        ? '验证注册手机号码后可直接设定新的就诊密码。'
                        : '医护及超算科研人员账号受密码法保护，重置请求将加密发送至您预留的内网安全邮箱。'}
                    </p>
                  </div>

                  <form onSubmit={handleForgotSubmit} className="space-y-3">
                    {selectedRole === 'patient_rep' ? (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            注册就诊手机号
                          </label>
                          <input
                            type="tel"
                            maxLength={11}
                            value={forgotPayload.phone || ''}
                            onChange={e =>
                              setForgotPayload({ ...forgotPayload, phone: e.target.value })
                            }
                            placeholder="请输入绑定的11位手机号码"
                            className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-sm font-mono text-slate-100 outline-none focus:border-cyan-400 h-11"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            短信校验码
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            value={forgotPayload.smsCode || ''}
                            onChange={e =>
                              setForgotPayload({ ...forgotPayload, smsCode: e.target.value })
                            }
                            placeholder="输入6位验证码 (演示输入 888888)"
                            className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-sm font-mono text-slate-100 outline-none focus:border-cyan-400 h-11"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            新设登录密码
                          </label>
                          <input
                            type="password"
                            value={forgotPayload.newPassword || ''}
                            onChange={e =>
                              setForgotPayload({ ...forgotPayload, newPassword: e.target.value })
                            }
                            placeholder="设置8位以上新密码"
                            className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-sm font-mono text-slate-100 outline-none focus:border-cyan-400 h-11"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            院内工号 / 超算学术邮箱
                          </label>
                          <input
                            type="text"
                            value={forgotPayload.staffIdOrEmail || ''}
                            onChange={e =>
                              setForgotPayload({ ...forgotPayload, staffIdOrEmail: e.target.value })
                            }
                            placeholder="输入工号或学术邮箱 (如: dr_wang@sanya-hosp.cn)"
                            className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-sm font-mono text-slate-100 outline-none focus:border-cyan-400 h-11"
                          />
                        </div>

                        {/* 联系超算中心管理员快捷抽屉 */}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => setShowAdminContact(!showAdminContact)}
                            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>无法接收重置邮件？联系三亚超算中心管理员</span>
                          </button>

                          {showAdminContact && (
                            <div className="mt-2 p-3 rounded-xl bg-slate-950/90 border border-cyan-800/40 text-xs space-y-1.5 animate-in fade-in">
                              <div className="font-semibold text-slate-200">
                                三亚学院超算与数字孪生重点实验室 · 运维保障处
                              </div>
                              <div className="text-slate-400">
                                内网专线值班电话：<span className="text-cyan-300 font-mono">0898-8835-8888 (分机 804)</span>
                              </div>
                              <div className="text-slate-400">
                                医院信息科运维工单：<span className="text-cyan-300 font-mono">http://it-support.syhosp.local</span>
                              </div>
                              <div className="text-[10px] text-slate-500">
                                工作时间：工作日 08:00 - 18:00（紧急临床会诊支持 7x24 小时开通）
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-sm shadow-md transition active:scale-[0.98]"
                    >
                      {isLoading ? '正在提交申请...' : '确认并提交重置申请'}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ================= 账号注册模块 ================= */}
              {authMode === 'register' && (
                <motion.div
                  key="register-form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3.5"
                >
                  {/* 顶部双通道切换 */}
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-950/80 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setRegisterType('patient')}
                      className={`py-2 rounded-lg text-xs font-bold transition ${
                        registerType === 'patient'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      患者/家属快速开通
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegisterType('professional')}
                      className={`py-2 rounded-lg text-xs font-bold transition ${
                        registerType === 'professional'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      院内医疗/科研人员申请
                    </button>
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="space-y-3">
                    {registerType === 'patient' ? (
                      /* 患者通道 */
                      <>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            真实姓名 <span className="text-cyan-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={registerPayload.realName}
                            onChange={e =>
                              setRegisterPayload({ ...registerPayload, realName: e.target.value })
                            }
                            placeholder="填写就诊患者或家属真实姓名"
                            className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-sm text-slate-100 outline-none focus:border-cyan-400 h-10"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            手机号码 <span className="text-cyan-400">*</span>
                          </label>
                          <input
                            type="tel"
                            maxLength={11}
                            value={registerPayload.phone || ''}
                            onChange={e =>
                              setRegisterPayload({ ...registerPayload, phone: e.target.value })
                            }
                            placeholder="请输入11位手机号码"
                            className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-sm font-mono text-slate-100 outline-none focus:border-cyan-400 h-10"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                            <span>脱敏就诊卡号 / 病历号 (选填)</span>
                            <span className="text-[10px] text-cyan-400 font-mono">自动关联脱敏样本</span>
                          </label>
                          <input
                            type="text"
                            value={registerPayload.patientUid || ''}
                            onChange={e =>
                              setRegisterPayload({ ...registerPayload, patientUid: e.target.value })
                            }
                            placeholder="如: SYU-COPD-2026-088"
                            className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-sm font-mono text-slate-100 outline-none focus:border-cyan-400 h-10"
                          />
                        </div>
                      </>
                    ) : (
                      /* 院内专业人员申请通道 */
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1">
                              姓名 <span className="text-cyan-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={registerPayload.realName}
                              onChange={e =>
                                setRegisterPayload({ ...registerPayload, realName: e.target.value })
                              }
                              placeholder="真实姓名"
                              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-sm text-slate-100 outline-none focus:border-cyan-400 h-10"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1">
                              工号/学号 <span className="text-cyan-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={registerPayload.staffId || ''}
                              onChange={e =>
                                setRegisterPayload({ ...registerPayload, staffId: e.target.value })
                              }
                              placeholder="如: DOC-8091"
                              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-sm font-mono text-slate-100 outline-none focus:border-cyan-400 h-10"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            所属科室 / 超算实验室 <span className="text-cyan-400">*</span>
                          </label>
                          <select
                            value={registerPayload.department || '呼吸与危重症医学科'}
                            onChange={e =>
                              setRegisterPayload({ ...registerPayload, department: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-sm text-slate-100 outline-none focus:border-cyan-400 h-10"
                          >
                            <option value="呼吸与危重症医学科">三亚市人民医院 · 呼吸与危重症医学科</option>
                            <option value="放射影像科 / 胸部CT组">三亚市人民医院 · 放射影像科 / 胸部CT组</option>
                            <option value="超算仿真重点实验室">三亚学院 · 超算仿真重点实验室 (CFD/FEM组)</option>
                            <option value="胸部质控复核中心">海南省胸部影像诊疗质控专委</option>
                            <option value="临床质控与病案中心">三亚市人民医院 · 临床质控与病案中心</option>
                          </select>
                        </div>

                        {/* 工作凭据上传 (选填模拟) */}
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                            <span>工作凭据 / 执业胸牌 (选填)</span>
                            <span className="text-[10px] text-slate-500">支持 JPG/PNG/PDF</span>
                          </label>
                          <label className="w-full h-14 border border-dashed border-slate-700 hover:border-cyan-400 rounded-xl bg-slate-950/60 flex items-center justify-center gap-2 cursor-pointer transition">
                            <Upload className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs text-slate-400">
                              {mockFileName || '点击上传胸牌照片或资质证明'}
                            </span>
                            <input
                              type="file"
                              className="hidden"
                              onChange={e => {
                                if (e.target.files && e.target.files[0]) {
                                  setMockFileName(e.target.files[0].name);
                                }
                              }}
                            />
                          </label>
                        </div>

                        <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-[11px] text-cyan-300 flex items-start gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <span>
                            专业账号需提交至三亚市人民医院呼吸科/三亚学院重点实验室审核，1个工作日内将发送激活短信至登记手机。
                          </span>
                        </div>
                      </>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-500 hover:from-cyan-500 hover:to-sky-400 text-slate-950 font-bold text-sm shadow-md transition active:scale-[0.98]"
                    >
                      {isLoading
                        ? '正在提交备案...'
                        : registerType === 'patient'
                        ? '即刻开通并进入系统'
                        : '提交专业资质审核备案'}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 手机端底部版权标识 */}
          <div className="lg:hidden text-center text-[10px] text-slate-400 mt-4 font-mono">
            三亚市人民医院 ✕ 三亚学院超算 · 琼ICP备2026-N088
          </div>
        </div>
      </div>
    </div>
  );
};

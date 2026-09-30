import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Cpu,
  RefreshCw,
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Share2,
  Database,
  ArrowRight,
  Stethoscope,
  Activity,
  Wind,
  Brain,
  Building2,
  Workflow
} from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'FOUR_LAYERS' | 'THREE_CORES' | 'SIX_STEPS'>('FOUR_LAYERS');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/85 backdrop-blur-md select-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-5xl max-h-[92vh] bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden text-slate-100"
      >
        {/* 顶部标题栏 */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 via-sky-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-600/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  系统顶层架构与软件工程规范 · “四层三核”与六步闭环设计
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                  9.27-V2 规范
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                研发团队: USY 智慧医疗技术研究团队 ✕ 三亚市人民医院呼吸与危重症医学科联合工程落地
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 模式切换 Tab */}
        <div className="flex items-center px-6 pt-3 pb-1 border-b border-slate-800 bg-slate-950/40 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('FOUR_LAYERS')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'FOUR_LAYERS'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>“四层”系统软件架构</span>
          </button>

          <button
            onClick={() => setActiveTab('THREE_CORES')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'THREE_CORES'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-950/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>“三核驱动”数字孪生体</span>
          </button>

          <button
            onClick={() => setActiveTab('SIX_STEPS')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'SIX_STEPS'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>六步临床闭环流程</span>
          </button>
        </div>

        {/* 内容展示区域 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ================= Tab 1: 四层系统软件架构 ================= */}
          {activeTab === 'FOUR_LAYERS' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-2xl bg-cyan-950/50 border border-cyan-800/60 text-xs text-cyan-200">
                💡 <b>四层解耦软件工程设计</b>：实现院内原始隐私数据物理不出院、特征脱敏流转与云端高性能 AI 模型分布式解算。
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 层 1: 数据源层 */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                    <span className="w-5 h-5 rounded-lg bg-cyan-950 flex items-center justify-center border border-cyan-800">1</span>
                    数据源层 (Data Source)
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    对接医院 HIS/PACS/LIS 业务系统、胸部高分辨率薄层 CT (DICOM 0.625mm)、智能可穿戴传感器 (10Hz SpO2/心率/呼吸)。
                  </p>
                  <div className="space-y-1 text-[11px] text-slate-300">
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800">● 电子病历 EHR / 40包年史</div>
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800">● HRCT DICOM 吸呼双相体素</div>
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800">● 移动端每日用药与随访数据</div>
                  </div>
                </div>

                {/* 层 2: 传输与治理层 */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                    <span className="w-5 h-5 rounded-lg bg-sky-950 flex items-center justify-center border border-sky-800">2</span>
                    传输与治理层 (Governance)
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    专线隐私脱敏网关 (HIPAA/GDPR 标准)、HL7 FHIR 医疗本体标准化对齐、时序数据 10Hz 流式平滑降噪。
                  </p>
                  <div className="space-y-1 text-[11px] text-slate-300">
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800">● 敏感隐私特征脱敏代理</div>
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800">● HL7 FHIR 资源实体封装</div>
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800">● 区块链级 SHA-256 审计链</div>
                  </div>
                </div>

                {/* 层 3: 模型层 */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                    <span className="w-5 h-5 rounded-lg bg-purple-950 flex items-center justify-center border border-purple-800">3</span>
                    模型层 (Core Models)
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    三核驱动（几何核 + 机理核 + AI数据驱动核），实现呼吸动力学生物物理与深度学习多模态协同推理。
                  </p>
                  <div className="space-y-1 text-[11px] text-slate-300">
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800">● 3D 支气管树网格重构</div>
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800">● CFD 气流 Navier-Stokes 解算</div>
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800">● PPO强化学习调药决策</div>
                  </div>
                </div>

                {/* 层 4: 临床应用服务层 */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <span className="w-5 h-5 rounded-lg bg-emerald-950 flex items-center justify-center border border-emerald-800">4</span>
                    应用服务层 (Clinical Apps)
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    覆盖医生端 3D 可视化工作站、移动端慢病管理 APP、临床知识图谱服务、科研与全院管理驾驶舱。
                  </p>
                  <div className="space-y-1 text-[11px] text-slate-300">
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800">● 医生端 What-if 试错仪表盘</div>
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800">● 患者移动端用药打卡与SOS</div>
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800">● 科研队列筛选与数据导出</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= Tab 2: 三核驱动数字孪生体 ================= */}
          {activeTab === 'THREE_CORES' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 几何核 */}
                <div className="p-5 rounded-3xl bg-slate-950 border border-cyan-500/40 shadow-xl space-y-3">
                  <div className="flex items-center gap-2.5 text-cyan-400 font-black text-sm">
                    <Activity className="w-5 h-5" />
                    <span>几何核 (Geometric Core)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    基于患者薄层胸部 CT 影像，利用 3D 多尺度 UNet 进行支气管树与五叶半透明网格高精度三维重建（368,000 面片），精准解剖定位 B1-B10 各段支气管分支形态及 IASLC 1R-12L 淋巴结坐标。
                  </p>
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 text-xs text-slate-400">
                    <div>● 面片拓扑: LOD0 / LOD1 / LOD2 多尺度调度</div>
                    <div>● 重构精度: Dice 系数 0.942，管壁亚毫米级刻画</div>
                  </div>
                </div>

                {/* 机理核 */}
                <div className="p-5 rounded-3xl bg-slate-950 border border-purple-500/40 shadow-xl space-y-3">
                  <div className="flex items-center gap-2.5 text-purple-400 font-black text-sm">
                    <Wind className="w-5 h-5" />
                    <span>机理核 (Mechanistic Core)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    基于呼吸生物力学（气道阻力 Raw、顺应性 Crs、呼气塌陷指数）与流体力学（Navier-Stokes CFD 气流速度场方程），模拟潮气呼吸周期中受阻小气道的压降、湍流剪切力与流体颤振。
                  </p>
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 text-xs text-slate-400">
                    <div>● 流体方程: 3D Navier-Stokes 气流压降解算</div>
                    <div>● 生物力学: 肺泡弹性回缩与呼气小气道动态陷闭</div>
                  </div>
                </div>

                {/* AI 数据驱动核 */}
                <div className="p-5 rounded-3xl bg-slate-950 border border-emerald-500/40 shadow-xl space-y-3">
                  <div className="flex items-center gap-2.5 text-emerald-400 font-black text-sm">
                    <Brain className="w-5 h-5" />
                    <span>AI 数据驱动核 (AI-Driven Core)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    采用长短期记忆网络 (LSTM) 结合穿戴多模态时序进行 AECOPD 急性加重超前 48.6 小时早期预警，并结合 PPO 深度强化学习在 What-if 试错中推荐个性化维持方案。
                  </p>
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 text-xs text-slate-400">
                    <div>● LSTM 时序预警: 平均提前 48.6 小时捕获加重</div>
                    <div>● PPO 强化学习: 动态权衡 FEV1 获益与激素副作用</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= Tab 3: 六步临床闭环流程 ================= */}
          {activeTab === 'SIX_STEPS' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-200">
                🔄 <b>闭环医疗证据链</b>：打通从“患者入院检查”到“数字孪生推演”、“多方案对比决策”、“医嘱下发移动端执行”再到“随访数据回流迭代”的全生命周期闭环。
              </div>

              <div className="grid grid-cols-1 md:grid-cols-6 gap-2.5">
                {[
                  { step: '01 采集', title: '多模态数据采集', desc: '胸部薄层CT + 穿戴血氧心率 + 门诊EHR' },
                  { step: '02 接入', title: '专线治理接入', desc: '特征安全脱敏 + HL7 FHIR 语义标准化' },
                  { step: '03 治理', title: '数字孪生建模', desc: '3D 支气管树网格重构 + CFD 生物力学仿真' },
                  { step: '04 分析', title: 'What-if 推演对比', desc: '方案A vs 方案B 虚拟试错 + FEV1/CAT 预测' },
                  { step: '05 干预', title: '医嘱下发执行', desc: '一键推送至移动端 APP，患者定时用药打卡' },
                  { step: '06 迭代', title: '随访反馈迭代', desc: '居家血氧随访数据回流，模型持续校准自演进' }
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-400 font-mono block">
                        {item.step}
                      </span>
                      <h4 className="text-xs font-bold text-slate-100 mt-1">{item.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                    {idx < 5 && (
                      <div className="hidden md:flex justify-end text-slate-600">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 底部确认栏 */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">自主研发 AI 智慧医疗软件产品平台 · USY 智慧医疗技术研究团队</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md"
          >
            完成查看
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ArchitectureModal;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PatientMeta, SimulationFrame } from '../../types';
import { Patient3DLungViewer } from './components/Patient3DLungViewer';
import { prescriptionService, Prescription } from '../../services/prescriptionService';
import {
  Heart,
  Activity,
  Wind,
  BellRing,
  Pill,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  Send,
  MessageSquare,
  Clock,
  Calendar,
  CloudSun,
  ShieldCheck,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Check,
  User,
  Compass,
  MapPin,
  Flame,
  Award,
  TrendingUp,
  Volume2,
  X,
  FileText,
  HelpCircle,
  ListChecks,
  CloudRain,
  ExternalLink,
  Info
} from 'lucide-react';

interface PatientDesktopPortalProps {
  patient: PatientMeta;
  activeMenuId?: string;
  simulationFrame?: SimulationFrame;
  onOpenKnowledgeGraph?: (nodeId?: string) => void;
  onSelectMenu?: (menuId: string) => void;
}

export const PatientDesktopPortal: React.FC<PatientDesktopPortalProps> = ({
  patient,
  activeMenuId = 'my_3d_lung',
  simulationFrame,
  onOpenKnowledgeGraph,
  onSelectMenu
}) => {
  // 1. 订阅医生端下发的最新调药处方
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [pendingRx, setPendingRx] = useState<Prescription | null>(null);
  const [showRxModal, setShowRxModal] = useState<boolean>(false);

  useEffect(() => {
    const unsub = prescriptionService.subscribe((list) => {
      setPrescriptions(list);
      const pending = list.find((p) => p.status === 'PENDING_CONFIRMATION');
      if (pending) {
        setPendingRx(pending);
        setShowRxModal(true);
      }
    });
    return unsub;
  }, []);

  // 2. 用药打卡状态 (初始已打卡1次，待打卡1次)
  const [medTasks, setMedTasks] = useState([
    {
      id: 'med-symbicort',
      name: '布地奈德福莫特罗粉吸入剂 (信必可都保)',
      dosage: '160/4.5μg · 晨起 1 吸 + 晚间 1 吸',
      nextTime: '20:00 (距今约 2小时15分)',
      remainingDoses: 48,
      totalDoses: 60,
      completedToday: 1,
      targetToday: 2,
      lastCheckTime: '今日 08:15',
      completed: true
    },
    {
      id: 'med-spiriva',
      name: '噻托溴铵粉雾剂 (思力华 LAMA)',
      dosage: '18μg · 晨起 1 吸 (舒张支气管)',
      nextTime: '明日 08:00',
      remainingDoses: 22,
      totalDoses: 30,
      completedToday: 1,
      targetToday: 1,
      lastCheckTime: '今日 08:20',
      completed: true
    }
  ]);

  const handleToggleMed = (id: string) => {
    setMedTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextState = !t.completed;
          return {
            ...t,
            completed: nextState,
            completedToday: nextState ? t.targetToday : Math.max(0, t.completedToday - 1)
          };
        }
        return t;
      })
    );
  };

  // 3. 沉浸式呼吸康复训练节拍器状态 (吸气4s ➔ 屏气2s ➔ 慢呼气6s)
  const [isPacerModalOpen, setIsPacerModalOpen] = useState<boolean>(false);
  const [isPacerRunning, setIsPacerRunning] = useState<boolean>(false);
  const [pacerPhase, setPacerPhase] = useState<'INHALE' | 'HOLD' | 'EXHALE'>('INHALE');
  const [pacerSeconds, setPacerSeconds] = useState<number>(4);
  const [completedSets, setCompletedSets] = useState<number>(2); // 已经完成 2/3 组
  const [pacerCycleCount, setPacerCycleCount] = useState<number>(0);

  useEffect(() => {
    let timer: any;
    if (isPacerRunning) {
      timer = setInterval(() => {
        setPacerSeconds((prev) => {
          if (prev <= 1) {
            if (pacerPhase === 'INHALE') {
              setPacerPhase('HOLD');
              return 2;
            } else if (pacerPhase === 'HOLD') {
              setPacerPhase('EXHALE');
              return 6;
            } else {
              // 完成 1 次循环
              setPacerPhase('INHALE');
              setPacerCycleCount((c) => {
                const next = c + 1;
                if (next >= 5) {
                  // 5次循环算完成一组
                  setCompletedSets((s) => Math.min(3, s + 1));
                  setIsPacerRunning(false);
                  return 0;
                }
                return next;
              });
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPacerRunning, pacerPhase]);

  // 4. 在线医患沟通聊天状态
  const [isDoctorChatOpen, setIsDoctorChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'DOCTOR' | 'PATIENT'; text: string; time: string }>>([
    {
      sender: 'DOCTOR',
      text: '张老伯您好，我是三亚市人民医院呼吸科王建平主任。这两天海棠湾有轻微降雨降温，出门请佩戴口罩，吸入剂继续按时使用。',
      time: '今天 09:20'
    },
    {
      sender: 'PATIENT',
      text: '王主任好！我今天早上晨起吸了信必可，咳嗽感觉比前两天平稳多了，活动时没有憋闷感。',
      time: '今天 10:05'
    },
    {
      sender: 'DOCTOR',
      text: '很好！继续保持每天 10 分钟缩唇腹式呼吸，监测手环血氧维持在 95% 以上即可安心。',
      time: '今天 10:18'
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setChatMessages((prev) => [...prev, { sender: 'PATIENT', text: chatInput, time: timeStr }]);
    setChatInput('');
  };

  // 5. 紧急一键直连医生 (SOS) 状态
  const [isSosModalOpen, setIsSosModalOpen] = useState<boolean>(false);
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);
  const [sosSuccess, setSosSuccess] = useState<boolean>(false);

  const handleTriggerSos = () => {
    setIsSosModalOpen(true);
    setSosSuccess(false);
    setSosCountdown(5);
  };

  useEffect(() => {
    let t: any;
    if (sosCountdown !== null && sosCountdown > 0) {
      t = setInterval(() => {
        setSosCountdown((prev) => (prev ? prev - 1 : 0));
      }, 1000);
    } else if (sosCountdown === 0) {
      setSosSuccess(true);
      setSosCountdown(null);
    }
    return () => clearInterval(t);
  }, [sosCountdown]);

  // 6. 菜单专项扩展弹窗 (自查、氧疗、知识图谱等)
  const [activeSpecialView, setActiveSpecialView] = useState<string | null>(null);

  // 联动外部侧边栏 activeMenuId 自动触发响应
  useEffect(() => {
    if (activeMenuId === 'sos_teleclinic') {
      setIsSosModalOpen(true);
    } else if (activeMenuId === 'daily_rehab') {
      setIsPacerModalOpen(true);
    } else if (activeMenuId === 'symptom_self_check' || activeMenuId === 'oxygen_assistant' || activeMenuId === 'health_kg') {
      setActiveSpecialView(activeMenuId);
    } else {
      setActiveSpecialView(null);
    }
  }, [activeMenuId]);

  // 7 天血氧监测数据
  const sevenDaysTrend = [
    { day: '09-24 周四', val: 96, fev1: 1.84 },
    { day: '09-25 周五', val: 95, fev1: 1.82 },
    { day: '09-26 周六', val: 96, fev1: 1.83 },
    { day: '09-27 周日', val: 94, fev1: 1.80 },
    { day: '09-28 周一', val: 95, fev1: 1.81 },
    { day: '09-29 周二', val: 96, fev1: 1.82 },
    { day: '今日 周三', val: 96, fev1: 1.82 }
  ];

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 font-sans overflow-hidden select-none relative">
      {/* 电脑端宽屏顶部长条状态横幅 */}
      <div className="shrink-0 px-6 py-2.5 bg-slate-900/80 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/20 text-white font-bold text-lg">
            🫁
          </div>
          <div>
            <div className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
              <span>慢病健康伴侣 · 宽屏全景看板</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>7×24h 智能监护已连接</span>
              </span>
            </div>
            <div className="text-xs text-slate-400">
              患者：{patient.patient_name || '张老伯'} ({patient.gender} · {patient.age}岁 · COPD {patient.gold_stage || 'II级'}稳定期) · 主管医院：三亚市人民医院
            </div>
          </div>
        </div>

        {/* 顶部右侧：医嘱调药提示与快捷状态 */}
        <div className="flex items-center gap-3">
          {pendingRx && (
            <button
              onClick={() => setShowRxModal(true)}
              className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white px-3 py-1.5 rounded-xl font-bold shadow-lg shadow-rose-900/40 animate-pulse transition"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>新调药医嘱待确认</span>
            </button>
          )}

          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-teal-400" />
            <span>连续规律打卡 12 天</span>
            <span className="text-emerald-400 font-bold font-mono">+20 积分</span>
          </div>
        </div>
      </div>

      {/* 主工作区：大气宽屏左右双栏布局 (48% 左侧 3D 肺视界 + 52% 右侧管理区) */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0">
        {/* ========================================================================= */}
        {/* 左侧主力区 (占 5 列 / 约 42%~45%)：【我的 3D 数字肺与综合健康评估】 */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 flex flex-col gap-4 min-h-[600px] h-full">
          {/* 1. 大尺寸 3D 肺视界 (支持鼠标旋转、缩放、呼吸动效、气流粒子) */}
          <div className="flex-1 min-h-[380px] lg:min-h-[440px] relative">
            <Patient3DLungViewer
              score={84}
              onScoreClick={() => {}}
              className="h-full"
            />
          </div>

          {/* 2. 健康指数微仪表卡 (今日健康评分 84分 + 当地环境 + 7×24h 智能预警) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3.5 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>综合肺功能健康评估</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">三亚超算中心 AI 驱动</span>
            </div>

            {/* 发光微仪表与天气两栏并排 */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              {/* 左：环形发光仪表盘 84 / 100 分 */}
              <div className="sm:col-span-5 flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-teal-950/30 to-slate-900 border border-emerald-600/30">
                <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                  {/* SVG 发光环形进度条 (84%) */}
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-800"
                      strokeWidth="3.2"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-emerald-400"
                      strokeDasharray="84, 100"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-base font-black text-white font-mono leading-none">84</span>
                    <span className="text-[8px] text-emerald-300 font-bold">良好</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-white">肺健康指数</div>
                  <div className="text-[10px] text-emerald-300 font-semibold mt-0.5">较上周提升 +3 分</div>
                  <div className="text-[10px] text-slate-400">稳定期控制良好</div>
                </div>
              </div>

              {/* 右：当地环境与气候 */}
              <div className="sm:col-span-7 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-xl shrink-0">
                    ☀️
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">三亚市 · 海棠湾</div>
                    <div className="text-[11px] text-slate-400">气温 28℃ · 湿度 78% · AQI 22 优</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800 font-medium block">
                    适合室内缩唇呼吸
                  </span>
                </div>
              </div>
            </div>

            {/* 7×24h 智能预警提示条 */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900 border border-teal-500/40 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                <BellRing className="w-4 h-4 text-teal-300" />
              </div>
              <div className="flex-1 text-xs">
                <span className="font-bold text-teal-200">7×24h 智能动态预警：</span>
                <span className="text-slate-300 ml-1">
                  根据近 10Hz 时序呼吸气流与血氧推算，保持规范用药，未来 72 小时无急性加重风险！
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold px-2 py-1 rounded bg-emerald-950/80 border border-emerald-800 shrink-0">
                低风险安全
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 右侧管理区 (占 7 列 / 约 55%~58%)：【生命体征 + 康复闭环 + 医患问诊】 */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* 1. 实时生理体征监护卡片 (Vital Signs Grid & 7天趋势) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-100">实时生理体征监护</h3>
                  <p className="text-[10px] text-slate-400">已同步医疗智能手环实时数据</p>
                </div>
              </div>
              <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>实时更新: 1秒前</span>
              </span>
            </div>

            {/* 三大指标实时监测卡片网格 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 指标 1: 静息血氧 SpO2 */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 hover:border-emerald-500/40 transition relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">静息血氧 SpO2</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl font-black text-emerald-400 font-mono">96</span>
                  <span className="text-xs text-slate-400 font-semibold">%</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px]">
                  <span className="text-emerald-400 font-bold">正常达标</span>
                  <span className="text-slate-500">标准 ≥ 95%</span>
                </div>
              </div>

              {/* 指标 2: 心率 Pulse */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 hover:border-blue-500/40 transition relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">脉搏心率 Pulse</span>
                  <Heart className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                </div>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl font-black text-blue-400 font-mono">74</span>
                  <span className="text-xs text-slate-400 font-semibold">bpm</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px]">
                  <span className="text-blue-400 font-bold">节奏平稳</span>
                  <span className="text-slate-500">区间 60~100</span>
                </div>
              </div>

              {/* 指标 3: 呼吸频率 Resp */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 hover:border-teal-500/40 transition relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">呼吸频率 Resp</span>
                  <Wind className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                </div>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl font-black text-teal-400 font-mono">18</span>
                  <span className="text-xs text-slate-400 font-semibold">次/分</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px]">
                  <span className="text-teal-400 font-bold">平缓匀速</span>
                  <span className="text-slate-500">区间 12~20</span>
                </div>
              </div>
            </div>

            {/* 过去 7 天血氧与肺活量稳定度波动曲线 (平滑面积折线图) */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
                  <span>过去 7 天血氧 (SpO2) 与肺活量稳定度波动曲线</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-1 rounded-full bg-teal-400" />
                    <span>血氧 SpO2 (平均 95.4%)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-1 rounded-full bg-blue-400" />
                    <span>FEV1 (1.82L 稳定)</span>
                  </span>
                </div>
              </div>

              {/* 7 天趋势可视化 SVG 面积图 */}
              <div className="h-32 w-full pt-2">
                <div className="relative w-full h-full flex flex-col justify-between">
                  {/* 背景参考虚线 */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                    <div className="border-b border-dashed border-slate-500 w-full" />
                    <div className="border-b border-dashed border-slate-500 w-full" />
                    <div className="border-b border-dashed border-slate-500 w-full" />
                  </div>

                  {/* 柱状+面积走势柱 */}
                  <div className="flex-1 flex items-end justify-between gap-3 px-2 z-10">
                    {sevenDaysTrend.map((item, idx) => {
                      const heightPercent = ((item.val - 88) / 12) * 100;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                          {/* 悬浮提示气泡 */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-mono bg-slate-800 text-teal-300 px-1.5 py-0.5 rounded shadow-lg border border-teal-500/40 pointer-events-none whitespace-nowrap">
                            SpO2: {item.val}% | FEV1: {item.fev1}L
                          </div>
                          <div className="text-[10px] font-mono text-slate-300 font-bold">{item.val}%</div>
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-teal-600/30 to-teal-400 border-t-2 border-teal-300 transition-all duration-300 group-hover:to-cyan-300 group-hover:shadow-[0_0_12px_rgba(20,184,166,0.6)]"
                          />
                          <div className="text-[10px] text-slate-400 truncate max-w-[48px] text-center">
                            {item.day.split(' ')[1]}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. 今日个性化治疗与康复任务卡 (Today's Care Tasks) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-100">今日个性化治疗与康复任务</h3>
                  <p className="text-[10px] text-slate-400">遵医嘱用药与规律呼吸操，打卡累积健康积分</p>
                </div>
              </div>

              {/* 进度条与积分 */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-200">完成度 2/3</span>
                  <div className="w-24 h-2 bg-slate-800 rounded-full mt-1 overflow-hidden">
                    <div className="w-2/3 h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full" />
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-bold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  <span>+20 积分</span>
                </div>
              </div>
            </div>

            {/* 任务列表 */}
            <div className="space-y-3">
              {/* 任务 1: 用药打卡 (信必可都保) */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-purple-500/40 transition flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleMed('med-symbicort')}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition ${
                      medTasks[0].completed
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50'
                        : 'border border-slate-600 bg-slate-800 text-slate-400 hover:border-purple-400'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                  </button>

                  <div>
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <span>布地奈德福莫特罗粉吸入剂 (信必可都保)</span>
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                        今日应吸 2 次 · 已吸 1 次
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <Clock className="w-3 h-3 text-purple-400" />
                      <span>待用药倒计时: 晚间 20:00 (距今 2小时15分)</span>
                      <span className="text-slate-600">|</span>
                      <span>装置余量: 余 48 剂</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleMed('med-symbicort')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                    medTasks[0].completed
                      ? 'bg-purple-950 text-purple-300 border border-purple-800'
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'
                  }`}
                >
                  {medTasks[0].completed ? '已打卡 1 次' : '立即打卡'}
                </button>
              </div>

              {/* 任务 2: 呼吸康复训练 (缩唇呼吸 + 腹式呼吸法 10分钟) */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-teal-500/40 transition flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                    <Wind className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <span>呼吸康复训练：缩唇呼吸 + 腹式呼吸法 10分钟</span>
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-teal-950 text-teal-300 border border-teal-800">
                        已完成 {completedSets} / 3 组
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      经鼻吸气 4s ➔ 屏气 2s ➔ 缩唇慢呼 6s，防止小气道陷闭
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPacerModalOpen(true)}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-md shadow-teal-900/40 flex items-center gap-1.5 transition active:scale-95 shrink-0"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>▶ 开始今日训练</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. 在线医患沟通与随访直通车 (Tele-Clinic & Doctor SOS) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-100">在线医患沟通与随访直通车</h3>
                  <p className="text-[10px] text-slate-400">三亚市人民医院呼吸科随访绿色通道</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>王主任在线接诊中</span>
              </span>
            </div>

            {/* 主管医师名片与留言 */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                    👨‍⚕️
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <span>王建平 主任医师</span>
                      <span className="text-[10px] font-normal text-slate-400">教授 / 博士生导师</span>
                    </div>
                    <div className="text-[11px] text-cyan-400">三亚市人民医院 · 呼吸与危重症医学科慢病中心</div>
                  </div>
                </div>

                <div className="text-right text-[10px] text-slate-400">
                  <div>随访热线: 0898-8888-2120</div>
                  <div className="text-emerald-400 font-medium">平均回复耗时 &lt; 15分钟</div>
                </div>
              </div>

              {/* 医嘱最新留言 */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-start gap-2.5">
                <Volume2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed flex-1">
                  <span className="font-semibold text-cyan-300">王主任最新医嘱留言：</span>
                  “张老伯，这两天海棠湾有轻微降雨降温，出门请佩戴口罩，吸入剂继续按时使用。”
                  <span className="text-[10px] text-slate-500 ml-2">今天 09:20</span>
                </div>
              </div>
            </div>

            {/* 操作按钮区：【💬 发送咨询消息】与【🚨 紧急一键直连医生 (SOS)】 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsDoctorChatOpen(true)}
                className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700/90 text-cyan-300 hover:text-white font-bold text-xs border border-cyan-700/50 shadow-lg flex items-center justify-center gap-2 transition active:scale-95"
              >
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span>💬 发送咨询消息给王主任</span>
              </button>

              <button
                type="button"
                onClick={handleTriggerSos}
                className="py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs shadow-xl shadow-rose-900/40 flex items-center justify-center gap-2 transition active:scale-95"
              >
                <PhoneCall className="w-4 h-4 animate-bounce" />
                <span>🚨 紧急一键直连医生 (SOS)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 弹窗 1: 沉浸式呼吸康复训练节拍器引导 (缩唇呼吸 + 腹式呼吸 动态环) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isPacerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-slate-900 border border-teal-500/40 rounded-3xl p-6 shadow-2xl space-y-5 text-slate-100 relative"
            >
              {/* 关闭按钮 */}
              <button
                onClick={() => {
                  setIsPacerModalOpen(false);
                  setIsPacerRunning(false);
                }}
                className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-100">呼吸节拍引导器 · 缩唇腹式呼吸操</h3>
                  <p className="text-xs text-slate-400">吸气4s ➔ 屏气2s ➔ 缩唇呼气6s · 促进肺泡废气充分排出</p>
                </div>
              </div>

              {/* 动态呼吸环视窗 */}
              <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <motion.div
                  animate={{
                    scale:
                      pacerPhase === 'INHALE'
                        ? [1, 1.3]
                        : pacerPhase === 'HOLD'
                        ? 1.3
                        : [1.3, 1]
                  }}
                  transition={{
                    duration: pacerSeconds,
                    ease: 'easeInOut'
                  }}
                  className={`w-36 h-36 rounded-full border-4 flex flex-col items-center justify-center transition-colors shadow-2xl ${
                    pacerPhase === 'INHALE'
                      ? 'border-teal-400 bg-teal-950/60 shadow-teal-500/30'
                      : pacerPhase === 'HOLD'
                      ? 'border-amber-400 bg-amber-950/60 shadow-amber-500/30'
                      : 'border-blue-400 bg-blue-950/60 shadow-blue-500/30'
                  }`}
                >
                  <span className="text-3xl font-black font-mono text-white">
                    {isPacerRunning ? pacerSeconds : '▶'}
                  </span>
                  <span className="text-xs font-bold text-slate-300 mt-1">
                    {pacerPhase === 'INHALE'
                      ? '经鼻深吸气'
                      : pacerPhase === 'HOLD'
                      ? '屏气稳压'
                      : '缩唇慢呼气'}
                  </span>
                </motion.div>

                <p className="text-xs font-bold text-slate-200 mt-5 leading-relaxed max-w-sm">
                  {pacerPhase === 'INHALE'
                    ? '【第 1 步】闭上嘴唇，经鼻深吸气数到 4，腹部慢慢向外鼓起'
                    : pacerPhase === 'HOLD'
                    ? '【第 2 步】轻微屏住呼吸数到 2，让氧气与肺泡充分弥散交换'
                    : '【第 3 步】嘴唇缩成吹笛哨子状，缓慢均匀吐气数到 6，排空废气'}
                </p>

                {/* 节拍控制按钮 */}
                <div className="flex items-center gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsPacerRunning(!isPacerRunning)}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-extrabold text-xs shadow-lg shadow-teal-500/30 flex items-center gap-2 transition active:scale-95"
                  >
                    {isPacerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isPacerRunning ? '暂停练习' : `开始第 ${Math.min(3, completedSets + 1)} 组训练`}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPacerRunning(false);
                      setPacerPhase('INHALE');
                      setPacerSeconds(4);
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
                    title="重置"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 训练统计 */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-2">
                <span>今日训练目标：3 组 (共 10 分钟)</span>
                <span className="text-teal-300 font-bold">已打卡完成: {completedSets} / 3 组</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 弹窗 2: 在线医患即时沟通咨询抽屉 (Doctor Chat Modal) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isDoctorChatOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl flex flex-col text-slate-100 max-h-[85vh] relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center font-bold">
                    👨‍⚕️
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">王建平 主任医师 在线随访通道</h3>
                    <p className="text-[10px] text-slate-400">三亚市人民医院呼吸科慢病关爱门诊</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDoctorChatOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 消息流水 */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-[260px] max-h-[360px] px-1">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.sender === 'PATIENT' ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[9px] text-slate-500 mb-1 px-1">{msg.time}</span>
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === 'PATIENT'
                          ? 'bg-cyan-600 text-white rounded-tr-none shadow-md'
                          : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/60'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* 输入框 */}
              <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="向王主任咨询今日胸闷、用药或康复反应..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500 transition"
                />
                <button
                  type="button"
                  onClick={handleSendChat}
                  className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white transition active:scale-95 shadow-md shadow-cyan-900/40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 弹窗 3: 紧急一键直连医生 (SOS) 调度台 */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isSosModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 border border-rose-500/50 rounded-3xl p-6 shadow-2xl text-center space-y-4 text-slate-100 relative"
            >
              <button
                onClick={() => {
                  setIsSosModalOpen(false);
                  setSosCountdown(null);
                }}
                className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
                <PhoneCall className="w-8 h-8 animate-bounce" />
              </div>

              <div>
                <h3 className="text-base font-black text-rose-400">三亚市人民医院呼吸急救直通绿色通道</h3>
                <p className="text-xs text-slate-400 mt-1">
                  适用于突发严重喘憋、口唇发绀或血氧骤降低于 90%
                </p>
              </div>

              {sosCountdown !== null && (
                <div className="p-3 rounded-2xl bg-rose-600 text-white font-bold text-sm animate-pulse">
                  正在接通医院急救分中心... 自动直拨倒计时: {sosCountdown} 秒
                </div>
              )}

              {sosSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs space-y-1">
                  <div>✅ 急救求助已成功发送至三亚市人民医院急诊调度台！</div>
                  <div className="text-[10px] opacity-90">急诊值班医护将立即拨打您的预留联系电话。</div>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400">患者位置已定位:</span>
                  <span className="font-semibold text-slate-200">三亚市海棠区林旺大道88号</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">呼吸专线急救直通:</span>
                  <span className="font-bold text-rose-400 font-mono">0898-8888-2120</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">紧急家属联系人:</span>
                  <span className="font-semibold text-slate-200">陈女士 (女儿) 139****8821</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSosCountdown(3)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-sm shadow-xl shadow-rose-900/40 flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <PhoneCall className="w-4 h-4" />
                <span>立即直拨三亚市人民医院呼吸急救电话</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 弹窗 4: 调药医嘱一键弹窗确认 (闭环证据链) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showRxModal && pendingRx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">
                    👨‍⚕️
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">
                      {pendingRx.doctor_name} ({pendingRx.doctor_title})
                    </h3>
                    <p className="text-[10px] text-slate-400">下发了最新治疗方案调药处方</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono">
                  {pendingRx.prescription_no}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-cyan-300">{pendingRx.regimen_name}</div>
                <div className="space-y-1.5 pt-1">
                  {pendingRx.drugs.map((drug, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
                      <div className="font-bold text-slate-200 flex items-center justify-between">
                        <span>{drug.name}</span>
                        <span className="text-cyan-400 font-mono">余 {drug.remaining_doses} 剂</span>
                      </div>
                      <div className="text-slate-400 text-[10px] mt-0.5">用法: {drug.freq} · {drug.dosage}</div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">预期改善效果:</span>
                  <span className="font-bold text-emerald-400 font-mono">FEV1 {pendingRx.expected_fev1_gain}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  prescriptionService.confirmPrescription(pendingRx.id);
                  setShowRxModal(false);
                  setPendingRx(null);
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-teal-900/40 flex items-center justify-center gap-2 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>确认接收医嘱并同步至今日打卡</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 弹窗 5: 业务专项弹窗 (自查、氧疗、趣味知识图谱) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activeSpecialView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-100 relative"
            >
              <button
                onClick={() => setActiveSpecialView(null)}
                className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>

              {activeSpecialView === 'symptom_self_check' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold">
                    <ListChecks className="w-5 h-5" />
                    <h3 className="text-base">急性加重 (AECOPD) 早期自查 5 步问卷</h3>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                      <span>1. 今日咳嗽频次较往日是否明显增多？</span>
                      <span className="text-emerald-400 font-bold">无明显增加</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                      <span>2. 咳痰量是否增加或痰液颜色变黄变脓？</span>
                      <span className="text-emerald-400 font-bold">白色稀痰 (正常)</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                      <span>3. 平地步行或爬楼梯是否比昨天更容易气促？</span>
                      <span className="text-emerald-400 font-bold">无加重</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                      <span>4. 夜间是否有因憋气而憋醒需坐起呼吸？</span>
                      <span className="text-emerald-400 font-bold">无夜间憋醒</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                      <span>5. 体温是否超过 37.3℃ 或伴有寒战乏力？</span>
                      <span className="text-emerald-400 font-bold">36.6℃ 正常</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-bold text-center">
                    评估结果：今日病情稳定，无急性加重迹象，请继续规范遵医嘱吸药！
                  </div>
                </div>
              )}

              {activeSpecialView === 'oxygen_assistant' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-teal-400 font-bold">
                    <CloudRain className="w-5 h-5" />
                    <h3 className="text-base">家庭氧疗与呼吸机参数助手</h3>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                    <div className="flex justify-between pb-2 border-b border-slate-800">
                      <span className="text-slate-400">推荐氧疗流量:</span>
                      <span className="font-bold text-teal-400 font-mono text-sm">1.5 ~ 2.0 L/min (低流量)</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-slate-800">
                      <span className="text-slate-400">每日吸氧建议时长:</span>
                      <span className="font-bold text-slate-200">&gt; 15 小时 / 天 (夜间持续)</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-slate-800">
                      <span className="text-slate-400">目标血氧饱和度:</span>
                      <span className="font-bold text-emerald-400">93% ~ 96%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">湿化瓶蒸馏水清洁:</span>
                      <span className="font-bold text-cyan-400">剩余 3 天需更换</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    💡 慢病小贴士：COPD 患者不可擅自调高吸氧流量至 3L 以上，以免抑制呼吸中枢造成二氧化碳潴留。
                  </p>
                </div>
              )}

              {activeSpecialView === 'health_kg' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-purple-400 font-bold">
                    <HelpCircle className="w-5 h-5" />
                    <h3 className="text-base">COPD 趣味健康知识图谱百科</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="font-bold text-teal-300">🫁 为什么会气道狭窄？</div>
                      <div className="text-[11px] text-slate-400">慢性炎症导致气道壁增厚水肿，吸入剂可抑制炎症扩张管道。</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="font-bold text-purple-300">🚭 戒烟能带来什么改变？</div>
                      <div className="text-[11px] text-slate-400">戒烟后肺功能 FEV1 下降斜率可减缓 50% 以上。</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="font-bold text-blue-300">🍲 慢病营养饮食建议</div>
                      <div className="text-[11px] text-slate-400">高蛋白、低碳水，多吃富含抗氧化的新鲜果蔬，防腹胀。</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="font-bold text-emerald-300">🌬️ 缩唇呼吸的神奇机制</div>
                      <div className="text-[11px] text-slate-400">形成呼气末气道正压 (PEEP)，防止小气道过早闭陷。</div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PatientDesktopPortal;

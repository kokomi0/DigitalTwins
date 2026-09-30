import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PatientMeta } from '../../types';
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
  Smartphone
} from 'lucide-react';

interface MobileHealthAppProps {
  patient: PatientMeta;
  onOpenDoctorChat?: () => void;
  isInsideMockup?: boolean;
  activeMenuId?: string;
}

export const MobileHealthApp: React.FC<MobileHealthAppProps> = ({
  patient,
  onOpenDoctorChat,
  isInsideMockup = false,
  activeMenuId
}) => {
  // 当前移动端激活功能 Tab
  const [activeTab, setActiveTab] = useState<'LUNG_VIEW' | 'TASKS' | 'ALERT_7X24' | 'CHAT_DOCTOR' | 'SOS'>('LUNG_VIEW');

  // 与外部患者左侧侧边栏联动
  useEffect(() => {
    if (!activeMenuId) return;
    if (activeMenuId === 'my_3d_lung') setActiveTab('LUNG_VIEW');
    else if (activeMenuId === 'smart_warning_7x24' || activeMenuId === 'symptom_self_check' || activeMenuId === 'oxygen_assistant') setActiveTab('ALERT_7X24');
    else if (activeMenuId === 'medication_guide' || activeMenuId === 'daily_rehab') setActiveTab('TASKS');
    else if (activeMenuId === 'sos_teleclinic') setActiveTab('SOS');
  }, [activeMenuId]);

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

  // 2. 用药打卡状态
  const [medTasks, setMedTasks] = useState([
    {
      id: 'med-1',
      name: '噻托溴铵/福莫特罗吸入粉雾剂',
      time: '早晨 08:00',
      dosage: '1吸 (18μg/12μg)',
      device: '准纳尔吸入器',
      remaining: 58,
      total: 60,
      completed: true
    },
    {
      id: 'med-2',
      name: '乙酰半胱氨酸泡腾片',
      time: '晚间 20:00',
      dosage: '1片 (0.6g) 溶温水',
      device: '口服泡腾片',
      remaining: 24,
      total: 30,
      completed: false
    }
  ]);

  const handleToggleMed = (id: string) => {
    setMedTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextCompleted = !t.completed;
          return {
            ...t,
            completed: nextCompleted,
            remaining: nextCompleted ? Math.max(0, t.remaining - 1) : t.remaining
          };
        }
        return t;
      })
    );
  };

  // 3. 可视化环形呼吸康复节拍器 (吸气 4秒 ➔ 屏气 2秒 ➔ 慢呼气 6秒)
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
              // 完成一次呼吸循环
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

  // 4. 在线医患聊天留言
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'DOCTOR' | 'PATIENT'; text: string; time: string }>>([
    {
      sender: 'DOCTOR',
      text: '张叔叔您好，我是三亚市人民医院呼吸科王建平主任。查看您近期手环血氧数据有微幅波动，请务必规律吸入药物，勿吸烟。',
      time: '昨天 16:30'
    },
    {
      sender: 'PATIENT',
      text: '王主任好！我昨晚感觉痰量稍微有点多，但没有发烧，今天早上吸了药感觉好多了。',
      time: '今天 08:15'
    },
    {
      sender: 'DOCTOR',
      text: '收到。若痰色变黄或气促加重，随时在APP内呼叫我。',
      time: '今天 09:20'
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');

  const handleSendMsg = () => {
    if (!inputMsg.trim()) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setChatMessages((prev) => [
      ...prev,
      { sender: 'PATIENT', text: inputMsg, time: timeStr }
    ]);
    setInputMsg('');
  };

  // 确认接收医生处方
  const handleConfirmPrescription = () => {
    if (pendingRx) {
      prescriptionService.confirmPrescription(pendingRx.id);
      // 同步到今日用药任务
      setMedTasks([
        ...pendingRx.drugs.map((d, idx) => ({
          id: `rx-med-${idx}`,
          name: d.name,
          time: d.freq,
          dosage: d.dosage,
          device: d.device,
          remaining: d.remaining_doses,
          total: d.remaining_doses,
          completed: false
        }))
      ]);
      setShowRxModal(false);
      setPendingRx(null);
    }
  };

  // 5. 紧急 SOS 倒计时
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);
  const [sosSuccess, setSosSuccess] = useState<boolean>(false);

  const handleStartSOS = () => {
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

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 text-slate-800 font-sans select-none overflow-hidden relative">
      {/* 顶部移动端清新状态栏 */}
      <div className="px-5 pt-3 pb-2 bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 text-white shrink-0 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-sm">
            🫁
          </div>
          <div>
            <div className="text-xs font-black tracking-wide leading-tight">呼吸健康伴侣 · 患者端</div>
            <div className="text-[10px] text-blue-100 flex items-center gap-1">
              <span>三亚市人民医院呼吸科随访直通</span>
            </div>
          </div>
        </div>

        {/* 调药通知红点提示 */}
        {pendingRx && (
          <button
            onClick={() => setShowRxModal(true)}
            className="flex items-center gap-1 text-[10px] bg-rose-500 hover:bg-rose-600 text-white px-2 py-0.5 rounded-full font-bold shadow-md animate-bounce"
          >
            <span>新医嘱</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          </button>
        )}
      </div>

      {/* 调药医嘱一键弹窗确认 (闭环证据链核心) */}
      <AnimatePresence>
        {showRxModal && pendingRx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-blue-100 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                    👨‍⚕️
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      {pendingRx.doctor_name} ({pendingRx.doctor_title})
                    </h3>
                    <p className="text-[10px] text-slate-400">下发了最新治疗方案调药处方</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-mono">
                  {pendingRx.prescription_no}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-2 text-xs">
                <div className="font-bold text-blue-900">{pendingRx.regimen_name}</div>
                <div className="space-y-1.5 pt-1">
                  {pendingRx.drugs.map((drug, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-white border border-blue-100 text-[11px]">
                      <div className="font-bold text-slate-800 flex items-center justify-between">
                        <span>{drug.name}</span>
                        <span className="text-blue-600 font-mono font-normal">剩余{drug.remaining_doses}剂</span>
                      </div>
                      <div className="text-slate-500 text-[10px] mt-0.5">用法: {drug.freq} · {drug.dosage}</div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">预期改善效果:</span>
                  <span className="font-bold text-emerald-600 font-mono">FEV1 {pendingRx.expected_fev1_gain}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-mono truncate">
                CA数字签名: {pendingRx.digital_signature}
              </div>

              <button
                onClick={handleConfirmPrescription}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold text-xs shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>确认接收医嘱并同步至今日打卡</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 主视图区域 (依据底部 Tab 切换) */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 pb-20">
        {/* ================= 视图 1: 我的数字肺健康视界 ================= */}
        {activeTab === 'LUNG_VIEW' && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* 顶部天气与温湿度卡 */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center text-xl">
                  ☀️
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">三亚市 · 海棠湾</div>
                  <div className="text-[11px] text-slate-400">气温 28℃ · 相对湿度 78% · 优</div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 font-semibold border border-emerald-100">
                适合室内康复
              </span>
            </div>

            {/* 中央悬浮发光的“呼吸数字肺”与健康评分 */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-blue-500/10 via-sky-50 to-white border border-blue-100 shadow-md flex flex-col items-center justify-center text-center relative overflow-hidden">
              {/* 背景呼吸柔光光环 */}
              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.35, 0.65, 0.35]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="absolute w-48 h-48 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 blur-2xl -z-0"
              />

              {/* 拟物数字肺图标 / 动效 */}
              <div className="relative z-10 w-28 h-28 rounded-full bg-white shadow-xl border-4 border-cyan-100 flex flex-col items-center justify-center">
                <span className="text-4xl animate-pulse">🫁</span>
                <span className="text-[10px] font-bold text-cyan-600 mt-1">稳定期</span>
              </div>

              <div className="relative z-10 mt-3">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-black text-slate-800 font-mono">84</span>
                  <span className="text-xs font-semibold text-slate-500">/ 100分</span>
                </div>
                <p className="text-xs font-bold text-emerald-600 mt-0.5">今日肺功能健康评分：良好</p>
                <p className="text-[10px] text-slate-400 max-w-[220px] mt-1">
                  根据近期 10Hz 时序呼吸潮气量与血氧推算，保持规范用药！
                </p>
              </div>

              {/* 三大指标小卡片 */}
              <div className="relative z-10 grid grid-cols-3 gap-2 w-full mt-4">
                <div className="p-2.5 rounded-2xl bg-white/90 border border-blue-50 shadow-sm text-center">
                  <span className="text-[10px] text-slate-400 block">静息血氧</span>
                  <span className="text-sm font-extrabold text-blue-600 font-mono">96%</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-white/90 border border-blue-50 shadow-sm text-center">
                  <span className="text-[10px] text-slate-400 block">心率 Pulse</span>
                  <span className="text-sm font-extrabold text-emerald-600 font-mono">74 <span className="text-[9px] font-normal">bpm</span></span>
                </div>
                <div className="p-2.5 rounded-2xl bg-white/90 border border-blue-50 shadow-sm text-center">
                  <span className="text-[10px] text-slate-400 block">呼吸频率</span>
                  <span className="text-sm font-extrabold text-cyan-600 font-mono">18 <span className="text-[9px] font-normal">次/分</span></span>
                </div>
              </div>
            </div>

            {/* 快速打卡入口卡片 */}
            <div
              onClick={() => setActiveTab('TASKS')}
              className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-blue-200 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                  📋
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">今日个性化康复任务</div>
                  <div className="text-[10px] text-slate-400">已打卡用药 1 项 · 呼吸操已完成 2/3 组</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        )}

        {/* ================= 视图 2: 今日个性化治疗任务 (用药打卡 + 呼吸节拍器) ================= */}
        {activeTab === 'TASKS' && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* 任务 1: 定时用药打卡 */}
            <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">吸入剂用药打卡</h3>
                    <p className="text-[10px] text-slate-400">遵医嘱定时定量，保持气道通畅</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold">
                  {medTasks.filter((t) => t.completed).length} / {medTasks.length} 完成
                </span>
              </div>

              <div className="space-y-2">
                {medTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleToggleMed(t.id)}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                      t.completed
                        ? 'bg-emerald-50/50 border-emerald-200 text-slate-600'
                        : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition ${
                          t.completed ? 'bg-emerald-500 text-white' : 'border-2 border-slate-300 bg-white'
                        }`}
                      >
                        {t.completed && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${t.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {t.name}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {t.time} · {t.dosage} ({t.device})
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono text-cyan-600 font-bold block">
                        余 {t.remaining} 剂
                      </span>
                      <span className={`text-[9px] ${t.completed ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                        {t.completed ? '已打卡' : '待打卡'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 任务 2: 呼吸康复训练节拍器 (可视化环形动态节拍引导) */}
            <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                    <Wind className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">呼吸康复训练节拍器</h3>
                    <p className="text-[10px] text-slate-400">缩唇呼吸法：吸气4s ➔ 屏气2s ➔ 慢呼气6s</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 font-bold">
                  已完成 {completedSets} / 3 组
                </span>
              </div>

              {/* 动态环形节拍引导视窗 */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-cyan-500/10 to-blue-50/50 flex flex-col items-center justify-center text-center relative overflow-hidden">
                {/* 动态缩放环 */}
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
                  className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center transition-colors shadow-lg ${
                    pacerPhase === 'INHALE'
                      ? 'border-cyan-400 bg-cyan-50/80 shadow-cyan-200'
                      : pacerPhase === 'HOLD'
                      ? 'border-amber-400 bg-amber-50/80 shadow-amber-200'
                      : 'border-blue-400 bg-blue-50/80 shadow-blue-200'
                  }`}
                >
                  <span className="text-2xl font-black font-mono text-slate-800">
                    {isPacerRunning ? pacerSeconds : '▶'}
                  </span>
                  <span className="text-[11px] font-bold text-slate-600 mt-1">
                    {pacerPhase === 'INHALE'
                      ? '鼻深吸气'
                      : pacerPhase === 'HOLD'
                      ? '屏气稳压'
                      : '缩唇慢呼'}
                  </span>
                </motion.div>

                <p className="text-xs font-bold text-slate-700 mt-4">
                  {pacerPhase === 'INHALE'
                    ? '【第1步】经鼻缓慢深长吸气，腹部隆起 (4秒)'
                    : pacerPhase === 'HOLD'
                    ? '【第2步】屏住呼吸，让氧气在肺泡充分交换 (2秒)'
                    : '【第3步】缩唇呈吹笛状，缓慢均匀吐气 (6秒)'}
                </p>

                {/* 节拍器操作按钮 */}
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={() => setIsPacerRunning(!isPacerRunning)}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/30 flex items-center gap-1.5 transition active:scale-95"
                  >
                    {isPacerRunning ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>暂停练习</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>开始第 {Math.min(3, completedSets + 1)} 组训练</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setIsPacerRunning(false);
                      setPacerPhase('INHALE');
                      setPacerSeconds(4);
                    }}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-100"
                    title="重置节拍"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= 视图 3: 7×24h 智能预警与血氧监护 ================= */}
        {activeTab === 'ALERT_7X24' && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* 温和健康提醒卡 */}
            <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 shadow-sm space-y-2.5">
              <div className="flex items-center gap-2 text-amber-800">
                <BellRing className="w-5 h-5 text-amber-600 animate-bounce" />
                <h3 className="text-xs font-bold">7×24h 智能环境与体征预警</h3>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed font-medium">
                “今日三亚局部湿度偏高 (78%)，系统检测到您近 2 小时静息血氧出现微幅下降至 <b>93%</b>。请避免剧烈外出活动，注意防寒，并按时吸入维持药物！”
              </p>
              <div className="text-[10px] text-amber-700 flex items-center justify-between pt-1 border-t border-amber-200/60 font-mono">
                <span>预警级别: 黄色关注</span>
                <span>AI 时序模型 LSTM 计算</span>
              </div>
            </div>

            {/* 7天血氧与心率趋势图卡片 */}
            <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800">近 7 天血氧监测趋势</h3>
                <span className="text-[10px] text-slate-400">平均 94.6%</span>
              </div>

              {/* 简易柱状/折线趋势模拟 */}
              <div className="h-28 flex items-end justify-between gap-2 pt-4 px-2">
                {[
                  { day: '周一', val: 96, color: 'bg-emerald-400' },
                  { day: '周二', val: 95, color: 'bg-emerald-400' },
                  { day: '周三', val: 96, color: 'bg-emerald-400' },
                  { day: '周四', val: 94, color: 'bg-cyan-400' },
                  { day: '周五', val: 95, color: 'bg-emerald-400' },
                  { day: '周六', val: 93, color: 'bg-amber-400' },
                  { day: '今天', val: 93, color: 'bg-amber-400' }
                ].map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-mono text-slate-500 font-bold">{item.val}%</span>
                    <div
                      style={{ height: `${(item.val - 85) * 8}%` }}
                      className={`w-full max-w-[20px] rounded-t-lg ${item.color} shadow-sm transition-all`}
                    />
                    <span className="text-[10px] text-slate-400">{item.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 预警应急自救小贴士 */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-100 text-xs space-y-1.5 text-slate-600">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>家庭防加重自救指导</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                1. 保持坐位或半卧位，放松颈肩部肌肉；<br />
                2. 启动家庭低流量吸氧 (1.5 ~ 2.0 L/min)；<br />
                3. 进行 5~10 分钟缩唇深慢呼吸；若持续不缓解请点击底部【一键SOS】。
              </p>
            </div>
          </div>
        )}

        {/* ================= 视图 4: 在线医患沟通与随访 ================= */}
        {activeTab === 'CHAT_DOCTOR' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* 医生信息条 */}
            <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center font-bold text-sm shadow">
                  👨‍⚕️
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">王建平 主任医师</div>
                  <div className="text-[10px] text-slate-400">三亚市人民医院 · 呼吸与危重症医学科</div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold border border-emerald-100">
                在线随访中
              </span>
            </div>

            {/* 聊天消息流 */}
            <div className="p-3.5 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-3 min-h-[260px] max-h-[320px] overflow-y-auto">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'PATIENT' ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[9px] text-slate-400 mb-1 px-1">{msg.time}</span>
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'PATIENT'
                        ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-500/20'
                        : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/60'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* 发送输入框 */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMsg()}
                placeholder="向王主任咨询今日病情或用药反应..."
                className="flex-1 bg-transparent px-3 py-1.5 text-xs text-slate-800 outline-none"
              />
              <button
                onClick={handleSendMsg}
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ================= 视图 5: 一键紧急呼叫 (SOS) ================= */}
        {activeTab === 'SOS' && (
          <div className="space-y-4 animate-in fade-in duration-200 py-2">
            <div className="p-5 rounded-3xl bg-gradient-to-b from-rose-50 to-white border border-rose-200 shadow-lg text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                <PhoneCall className="w-8 h-8 animate-bounce" />
              </div>

              <div>
                <h3 className="text-base font-black text-rose-700">三亚市人民医院呼吸急救绿色通道</h3>
                <p className="text-xs text-slate-500 mt-1">
                  针对突发重度呼吸困难、口唇发绀或严重憋喘的紧急求助
                </p>
              </div>

              {/* 倒计时弹窗 */}
              {sosCountdown !== null && (
                <div className="p-3 rounded-2xl bg-rose-600 text-white font-bold text-sm animate-pulse">
                  正在接通呼吸科值班台... 自动呼叫倒计时: {sosCountdown} 秒
                </div>
              )}

              {sosSuccess && (
                <div className="p-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs space-y-1">
                  <div>✅ 急救信号已成功发送至三亚市人民医院急诊呼叫调度台！</div>
                  <div className="text-[10px] opacity-80">值班医护将立即拨打您预留的随访手机。</div>
                </div>
              )}

              {/* 一键呼叫大按钮 */}
              <button
                onClick={handleStartSOS}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-extrabold text-sm shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <PhoneCall className="w-5 h-5 text-white" />
                <span>一键呼叫三亚市人民医院急救直通电话</span>
              </button>

              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>已定位: 三亚市海棠区林旺大道88号 (已同步给急救科)</span>
              </div>
            </div>

            {/* 应急联系人卡片 */}
            <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-2 text-xs">
              <div className="font-bold text-slate-800">紧急联系通道</div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">主治科室直通:</span>
                <span className="font-bold text-blue-600 font-mono">0898-8888-2120</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">紧急家属联系人:</span>
                <span className="font-bold text-slate-700">陈女士 (女儿) 139****8821</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部现代商业医疗移动端五项 Tab 导航 */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 flex items-center justify-around z-20 shadow-lg">
        <button
          onClick={() => setActiveTab('LUNG_VIEW')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'LUNG_VIEW' ? 'text-blue-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="text-lg">🫁</span>
          <span className="text-[10px]">肺视界</span>
        </button>

        <button
          onClick={() => setActiveTab('TASKS')}
          className={`flex flex-col items-center gap-1 transition relative ${
            activeTab === 'TASKS' ? 'text-blue-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="text-lg">📋</span>
          <span className="text-[10px]">今日任务</span>
          <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-cyan-500" />
        </button>

        <button
          onClick={() => setActiveTab('ALERT_7X24')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'ALERT_7X24' ? 'text-amber-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="text-lg">🔔</span>
          <span className="text-[10px]">智能预警</span>
        </button>

        <button
          onClick={() => setActiveTab('CHAT_DOCTOR')}
          className={`flex flex-col items-center gap-1 transition relative ${
            activeTab === 'CHAT_DOCTOR' ? 'text-blue-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="text-lg">💬</span>
          <span className="text-[10px]">医患随访</span>
          {pendingRx && <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
        </button>

        <button
          onClick={() => setActiveTab('SOS')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'SOS' ? 'text-rose-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="text-lg">🚨</span>
          <span className="text-[10px] text-rose-600 font-bold">急救SOS</span>
        </button>
      </div>
    </div>
  );
};

export default MobileHealthApp;

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  Sliders, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  RotateCw, 
  Zap, 
  Play, 
  FileText, 
  Scan, 
  ArrowRight,
  Sparkles,
  Maximize2
} from 'lucide-react';
import { MOCK_CT_SCANS } from '../../services/mockData';
import { CTScanMeta } from '../../types';

interface CTImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReconstructComplete: (ctMeta: CTScanMeta) => void;
}

export const CTImportModal: React.FC<CTImportModalProps> = ({
  isOpen,
  onClose,
  onReconstructComplete
}) => {
  const [selectedCaseIdx, setSelectedCaseIdx] = useState<number>(0);
  const [activePlane, setActivePlane] = useState<'AXIAL' | 'CORONAL' | 'SAGITTAL'>('AXIAL');
  const [currentSlice, setCurrentSlice] = useState<number>(64);
  const [windowWidth, setWindowWidth] = useState<number>(1500); // 肺窗 WW
  const [windowLevel, setWindowLevel] = useState<number>(-600); // 肺窗 WL

  // 重建流程状态
  const [isReconstructing, setIsReconstructing] = useState<boolean>(false);
  const [reconstructionProgress, setReconstructionProgress] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentMeta = MOCK_CT_SCANS[selectedCaseIdx] || MOCK_CT_SCANS[0];

  // 重置状态当弹窗打开
  useEffect(() => {
    if (isOpen) {
      setIsReconstructing(false);
      setReconstructionProgress(0);
      setCurrentStep(0);
      setLogs([]);
      setIsCompleted(false);
    }
  }, [isOpen]);

  // 高拟真绘制 CT 切片影像 (模拟薄层 HRCT 肺气肿低衰减区与支气管断面)
  useEffect(() => {
    if (!isOpen || isReconstructing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // 清空画布
    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, w, h);

    // 窗宽窗位对比度换算
    const contrast = Math.max(0.5, Math.min(2.0, (1800 - windowWidth) / 600 + 1));
    const brightness = (windowLevel + 700) / 200;

    // 绘制外周胸壁与肋骨软组织轮廓
    ctx.save();
    ctx.translate(w / 2, h / 2);

    // 胸廓边缘
    ctx.strokeStyle = `rgba(160, 175, 200, ${0.4 * contrast})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.42, h * 0.38, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 肋骨高密度点 (白色弧度)
    ctx.strokeStyle = `rgba(240, 245, 255, ${0.85 * contrast})`;
    ctx.lineWidth = 5;
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
      const rx = Math.cos(angle) * (w * 0.42);
      const ry = Math.sin(angle) * (h * 0.38);
      ctx.beginPath();
      ctx.arc(rx, ry, 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 胸椎骨 (后方高密度)
    ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * contrast})`;
    ctx.beginPath();
    ctx.arc(0, h * 0.34, 18, 0, Math.PI * 2);
    ctx.fill();

    // 纵隔及心脏阴影 (中央中等密度)
    ctx.fillStyle = `rgba(90, 105, 130, ${0.5 * contrast})`;
    ctx.beginPath();
    ctx.ellipse(-10, 10, w * 0.14, h * 0.18, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // 左右肺实质野 (低衰减肺气肿区 -950HU)
    const lungColor = `rgba(10, 18, 30, 0.95)`;
    // 右肺野
    ctx.fillStyle = lungColor;
    ctx.beginPath();
    ctx.ellipse(w * 0.22, 0, w * 0.17, h * 0.28, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(0, 229, 255, ${0.25 * contrast})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 左肺野
    ctx.beginPath();
    ctx.ellipse(-w * 0.24, -10, w * 0.15, h * 0.26, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 绘制肺纹理微支气管血管束 (细枝脉络)
    ctx.strokeStyle = `rgba(180, 210, 240, ${0.45 * contrast})`;
    ctx.lineWidth = 1.2;
    // 右肺纹理
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.moveTo(w * 0.1, 0);
      ctx.quadraticCurveTo(
        w * (0.18 + i * 0.02),
        (i - 3) * 20,
        w * (0.28 + (i % 3) * 0.03),
        (i - 3) * 35
      );
      ctx.stroke();
    }
    // 左肺纹理
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(-w * 0.1, -5);
      ctx.quadraticCurveTo(
        -w * (0.18 + i * 0.02),
        (i - 3) * 18,
        -w * (0.3 + (i % 2) * 0.04),
        (i - 3) * 30
      );
      ctx.stroke();
    }

    // 重点标定病灶：RB3 支气管狭窄重构截面 (高亮红环)
    const rb3X = w * 0.22;
    const rb3Y = -h * 0.08;
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(rb3X, rb3Y, 8, 0, Math.PI * 2);
    ctx.stroke();

    // 狭窄管壁环状浸润阴影
    ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
    ctx.beginPath();
    ctx.arc(rb3X, rb3Y, 6, 0, Math.PI * 2);
    ctx.fill();

    // 弥漫性肺气肿低衰减区 (LAA% -950HU 散在小黑斑)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    for (let i = 0; i < 24; i++) {
      const lx = w * 0.12 + Math.sin(i * 1.7) * 45;
      const ly = (i - 12) * 12 + Math.cos(i) * 10;
      ctx.beginPath();
      ctx.arc(lx, ly, 4 + (i % 4), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // 左下角与右上角临床 DICOM 刻度元数据信息
    ctx.fillStyle = '#00e5ff';
    ctx.font = '11px monospace';
    ctx.fillText(`PATIENT: HOSP-ENC-9081244109`, 15, 25);
    ctx.fillText(`SERIES: ${currentMeta.series_id}`, 15, 42);
    ctx.fillText(`SLICE: ${currentSlice} / ${currentMeta.slice_count} (THK: 0.625mm)`, 15, 59);

    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`WW: ${windowWidth}  WL: ${windowLevel} (LUNG WINDOW)`, w - 190, 25);
    ctx.fillText(`LAA% (< -950HU): ${currentMeta.laa_pct}%`, w - 190, 42);
    ctx.fillText(`FPS: 60  KVP: 120kV  mA: 250`, w - 190, 59);

    // 准心十字瞄准线 (病灶定位)
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(w * 0.72, 0);
    ctx.lineTo(w * 0.72, h);
    ctx.moveTo(0, h * 0.42);
    ctx.lineTo(w, h * 0.42);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [isOpen, selectedCaseIdx, currentSlice, windowWidth, windowLevel, isReconstructing, currentMeta]);

  // 执行 AI 多阶段重建流水线
  const handleStartReconstruction = () => {
    setIsReconstructing(true);
    setReconstructionProgress(0);
    setCurrentStep(1);
    setIsCompleted(false);

    const stepLogs = [
      '[Step 1/4] 读取 DICOM 切片序列 128 层，正在进行双边滤波去噪与体素等间隔采样 (0.625mm)...',
      '[Step 1/4] CT 肺实质低衰减阈值分割完成 (LAA% -950HU: 32.4%)，噪声校准耗时 240ms。',
      '[Step 2/4] 加载 ResUNet-3D 气道多尺度拓扑语义分割网络权重模型 (v2.6)...',
      '[Step 2/4] 成功提取主气管隆突至第4代亚段气道中心线，标定出 B1-B10 共 24 个解剖段分支。',
      '[Step 2/4] 智能检测到病变特征：右上叶前段 (RB3) 呈重构狭窄改变，管径截面积狭窄率 65%。',
      '[Step 3/4] 正在构建肺泡实质与左二右三五叶解剖多边形网格 (LOD-1 ~ LOD-4)...',
      '[Step 3/4] 导入有限元 Navier-Stokes CFD 流体方程初始压差场边界条件 (4.2 kPa·s/L)。',
      '[Step 4/4] 知识图谱临床参数校准通过，生成高保真三维肺部数字孪生交互模型！'
    ];

    let p = 0;
    const interval = setInterval(() => {
      p += 4;
      setReconstructionProgress(Math.min(p, 100));

      if (p === 12) {
        setLogs(prev => [...prev, stepLogs[0], stepLogs[1]]);
      } else if (p === 36) {
        setCurrentStep(2);
        setLogs(prev => [...prev, stepLogs[2], stepLogs[3]]);
      } else if (p === 60) {
        setLogs(prev => [...prev, stepLogs[4]]);
      } else if (p === 76) {
        setCurrentStep(3);
        setLogs(prev => [...prev, stepLogs[5], stepLogs[6]]);
      } else if (p === 92) {
        setCurrentStep(4);
        setLogs(prev => [...prev, stepLogs[7]]);
      } else if (p >= 100) {
        clearInterval(interval);
        setIsCompleted(true);
        setTimeout(() => {
          onReconstructComplete(currentMeta);
          onClose();
        }, 1800);
      }
    }, 120);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-5xl bg-slate-900 border border-cyan-800/60 rounded-2xl shadow-2xl shadow-cyan-950/80 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* 顶部标题栏 */}
        <div className="h-14 px-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/30">
              <Scan className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                <span>胸部薄层 CT 导入与 AI 数字孪生体全流程重建</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-normal">
                  DICOM ➔ 3D TWIN PIPELINE
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">
                三亚市人民医院 (放射影像组) ✕ 三亚学院超算中心 (ResUNet-3D 气道语义网络)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 弹窗主体内容 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* 左侧：CT 交互阅片视口 (7 列) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {/* 典型预设病例切换 */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">病例切片序列:</span>
              <div className="flex-1 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCaseIdx(0)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border text-left transition ${
                    selectedCaseIdx === 0
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold">典型病例 01 (当前患者)</div>
                  <div className="text-[10px] text-slate-500 font-mono">RB3气道狭窄重构 (128层)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCaseIdx(1)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border text-left transition ${
                    selectedCaseIdx === 1
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold">典型病例 02 (全小叶型)</div>
                  <div className="text-[10px] text-slate-500 font-mono">弥漫低衰减气腔 (144层)</div>
                </button>
              </div>
            </div>

            {/* 仿真 DICOM Canvas 视口 */}
            <div className="relative w-full aspect-[4/3] rounded-2xl bg-black border border-cyan-900/50 shadow-inner overflow-hidden flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={520}
                height={390}
                className="w-full h-full object-contain"
              />

              {/* 切片轴向指示 */}
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-slate-900/80 backdrop-blur rounded-lg p-1 border border-slate-800 text-[10px] font-mono">
                {(['AXIAL', 'CORONAL', 'SAGITTAL'] as const).map(plane => (
                  <button
                    key={plane}
                    onClick={() => setActivePlane(plane)}
                    className={`px-2 py-0.5 rounded transition ${
                      activePlane === plane
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {plane === 'AXIAL' ? '横断面' : plane === 'CORONAL' ? '冠状面' : '矢状面'}
                  </button>
                ))}
              </div>

              {/* 切片底部微调进度条 */}
              <div className="absolute bottom-3 inset-x-3 bg-slate-950/80 backdrop-blur border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-3">
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  层厚切片: {currentSlice}
                </span>
                <input
                  type="range"
                  min={1}
                  max={currentMeta.slice_count}
                  value={currentSlice}
                  onChange={e => setCurrentSlice(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <span className="text-[10px] text-cyan-400 font-mono shrink-0">
                  /{currentMeta.slice_count}
                </span>
              </div>
            </div>

            {/* 窗宽窗位调节滑块 */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>窗宽 (Window Width)</span>
                  <span className="font-mono text-cyan-300">{windowWidth} HU</span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={2000}
                  step={50}
                  value={windowWidth}
                  onChange={e => setWindowWidth(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>窗位 (Window Level)</span>
                  <span className="font-mono text-cyan-300">{windowLevel} HU</span>
                </div>
                <input
                  type="range"
                  min={-900}
                  max={200}
                  step={20}
                  value={windowLevel}
                  onChange={e => setWindowLevel(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* 右侧：AI 重建多阶段流水线与控制台 (5 列) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            
            {/* 阶段 1-4 进度卡片组 */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>AI 孪生体分割与重建管线</span>
                {isReconstructing && (
                  <span className="font-mono text-cyan-400 flex items-center gap-1">
                    <RotateCw className="w-3 h-3 animate-spin" />
                    <span>{reconstructionProgress}%</span>
                  </span>
                )}
              </h3>

              {/* 四个阶段指标卡 */}
              <div className="space-y-2">
                {[
                  { step: 1, title: 'Step 1: DICOM 切片解析与去噪校准', desc: '128层空间三维插值与各向同性体素去噪' },
                  { step: 2, title: 'Step 2: AI 气道树 B1-B10 多尺度拓扑提取', desc: 'ResUNet-3D 卷积提取第4代细支气管' },
                  { step: 3, title: 'Step 3: 肺实质肺气肿低衰减区 (LAA%) 3D 体素重建', desc: '空间体素渲染与 Navier-Stokes 初始流场' },
                  { step: 4, title: 'Step 4: 知识图谱临床参数校准与孪生体生成', desc: 'GOLD 指南多模态映射与 3D 交互绑定' }
                ].map((item) => {
                  const isDone = reconstructionProgress >= item.step * 25;
                  const isActive = currentStep === item.step;

                  return (
                    <div
                      key={item.step}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isDone
                          ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200'
                          : isActive
                          ? 'bg-slate-800/80 border-cyan-400 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold flex items-center gap-1.5">
                          {isDone ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : isActive ? (
                            <RotateCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                          ) : (
                            <span className="w-3.5 h-3.5 rounded-full border border-slate-700 flex items-center justify-center text-[9px]">
                              {item.step}
                            </span>
                          )}
                          <span>{item.title}</span>
                        </span>
                        <span className="text-[10px] font-mono">
                          {isDone ? '100%' : isActive ? `${Math.round(((reconstructionProgress % 25) / 25) * 100)}%` : '0%'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 pl-5">
                        {item.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI 执行日志终端小窗 */}
            <div className="rounded-xl bg-black border border-slate-800 p-3 h-36 overflow-y-auto font-mono text-[11px] space-y-1">
              <div className="text-slate-500 border-b border-slate-900 pb-1 flex items-center justify-between">
                <span>HPC_GPU_CLUSTER_LOGS</span>
                <span className="text-emerald-400 text-[10px]">● CUDA 12.4</span>
              </div>
              {logs.length === 0 ? (
                <div className="text-slate-600 italic py-2">
                  等待启动 AI 重建流水线...
                </div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="text-cyan-300 leading-snug">
                    {log}
                  </div>
                ))
              )}
            </div>

            {/* 重建完成提示 / 启动大按钮 */}
            <div>
              {isCompleted ? (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/50 animate-bounce">
                  <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="font-bold">
                    三维数字孪生重建已完成！
                    <div className="text-[10px] text-emerald-300 font-normal">
                      正在以高光粒子汇聚动画同步呈现至 3D 临床工作台...
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isReconstructing}
                  onClick={handleStartReconstruction}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-sm shadow-xl shadow-cyan-500/30 border border-cyan-400/40 flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-60"
                >
                  {isReconstructing ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin text-white" />
                      <span>正在执行 AI 气道分割与流场重建 ({reconstructionProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                      <span>启动 AI 肺气道分割与孪生重建</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  ShieldCheck, 
  Cpu, 
  Network, 
  Layers, 
  Binary, 
  Radio, 
  Share2, 
  ChevronRight,
  Database
} from 'lucide-react';

export const TechShowcase: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [pulsePing, setPulsePing] = useState<number>(4.2);

  // 轮播特性
  const FEATURES = [
    {
      id: 'anatomy',
      tag: '解剖学多尺度高精建模',
      title: 'B1-B10 气道拓扑 ✕ IASLC 1R-12L 淋巴分站',
      desc: '基于高分辨率薄层 CT 与真实 EBUS-TBNA 超声支气管镜影像，实现气管隆突至第4代亚段支气管的 1:1 三维体渲染与病变狭窄精准定位。',
      stats: [
        { label: '解剖几何保真度', val: '99.98%' },
        { label: '淋巴分站覆盖率', val: '100% (1R-12L)' },
        { label: '亚段标定精度', val: '0.24 mm' }
      ]
    },
    {
      id: 'cfd',
      tag: '超算流体与生物力学',
      title: 'Navier-Stokes 气道流速与动态阻力推演',
      desc: '三亚学院国家重点实验室超算算力集群协同驱动，对患者吸气相与呼气相的跨壁压差、气流剪切应力及塌陷颤振进行毫秒级有限元结算。',
      stats: [
        { label: '网格多边形面数', val: '128,450' },
        { label: 'CFD动态帧率', val: '60 FPS' },
        { label: '跨壁压差预测误差', val: '< 2.1%' }
      ]
    },
    {
      id: 'tunnel',
      tag: '医疗双盲与数据安全',
      title: '双超算加密隧道 ✕ 隐私数据不可逆脱敏',
      desc: '三亚市人民医院临床端专线对接三亚学院算力底座，所有病例 DICOM 与基因组数据在离开内网边界前均通过硬件级不可逆脱敏脱密。',
      stats: [
        { label: '加密通道协议', val: 'IPSec + TLS 1.3' },
        { label: '专线带宽吞吐', val: '10 Gbps' },
        { label: '数据泄露阻截数', val: '0 次' }
      ]
    },
    {
      id: 'compliance',
      tag: '合规留痕与防篡改存证',
      title: '全生命周期审计日志与 SHA-256 存证链',
      desc: '每一次阅片标注、仿真调优及推演处方均生成具有时间戳的防篡改数字签名指纹，由医院专家组与质控中心进行双盲监督。',
      stats: [
        { label: '合规标准级别', val: 'HIPAA & 司法级' },
        { label: '哈希链状态', val: 'VALIDATED' },
        { label: '日志留痕率', val: '100%' }
      ]
    }
  ];

  // 轮播切换定时器
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % FEATURES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [FEATURES.length]);

  // 微波动延迟数值
  useEffect(() => {
    const pTimer = setInterval(() => {
      setPulsePing(Number((4.0 + Math.random() * 0.5).toFixed(1)));
    }, 2000);
    return () => clearInterval(pTimer);
  }, []);

  const currentFeature = FEATURES[activeSlide];

  return (
    <div className="h-full w-full flex flex-col justify-between p-6 lg:p-8 relative select-none">
      {/* 顶部专联合认证标识与徽章 */}
      <div>
        {/* 医疗机构联合认证标题 */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 border border-cyan-400/40">
            <Activity className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold tracking-wider text-slate-100 uppercase">
                三亚市人民医院 (临床)
              </span>
              <span className="text-cyan-400 font-bold">✕</span>
              <span className="text-sm font-extrabold tracking-wider text-cyan-300 uppercase">
                三亚学院 (超算仿真重点实验室)
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
              <span>HOSPITAL-UNIVERSITY COLLABORATIVE PLATFORM</span>
              <span className="w-1 h-1 rounded-full bg-cyan-400"></span>
              <span className="text-cyan-400 font-semibold">琼卫健监 2026-N088</span>
            </div>
          </div>
        </div>

        {/* 专属认证徽标与平台系统大标题 */}
        <div className="mt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/50 shadow-sm shadow-cyan-950/60 mb-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="text-xs font-mono font-bold tracking-wide text-cyan-300">
              USY 智慧医疗技术研究团队 · 自主研发
            </span>
            <span className="text-[10px] text-cyan-400/70 border-l border-cyan-800 pl-2 font-mono">
              9.27-V2 规范
            </span>
          </div>

          <h2 className="text-2xl xl:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-cyan-100 to-cyan-400 tracking-tight leading-snug">
            基于人工智能技术的
            <br />
            慢性阻塞性肺病智慧治疗与管理服务系统
          </h2>
        </div>
      </div>

      {/* 中部：双超算专线加密传输态势图 (Visual Pipeline) */}
      <div className="my-5 p-4 rounded-2xl bg-slate-900/80 border border-cyan-900/40 backdrop-blur-md shadow-xl shadow-cyan-950/30">
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-2 text-cyan-300 font-semibold font-mono">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>双超算物理隔离加密通道态势 (REAL-TIME STATUS)</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>100% 专线贯通</span>
            </span>
            <span>|</span>
            <span className="text-cyan-400">延迟: {pulsePing} ms</span>
          </div>
        </div>

        {/* 节点拓扑链路 */}
        <div className="grid grid-cols-3 gap-2 items-center relative py-1">
          {/* 节点 1: 三亚市人民医院 (临床集群) */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-800/40 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-8 h-8 bg-cyan-500/10 rounded-bl-full pointer-events-none"></div>
            <div className="flex justify-center mb-1 text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-200">三亚市人民医院</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">DICOM / PACS 节点</div>
            <div className="mt-1.5 text-[9px] font-mono text-emerald-400 px-1 py-0.2 rounded bg-emerald-950/60 inline-block">
              HIPAA级脱敏
            </div>
          </div>

          {/* 中间传输光带 */}
          <div className="flex flex-col items-center justify-center px-1">
            <div className="w-full flex items-center justify-between text-[10px] font-mono text-cyan-300 mb-1">
              <span>IPSec</span>
              <span className="text-[9px] text-slate-400">10 Gbps 专线</span>
              <span>TLS 1.3</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 relative overflow-hidden">
              <div className="absolute inset-y-0 bg-gradient-to-r from-transparent via-cyan-400 to-transparent w-2/3 animate-[pulse_1.5s_infinite]"></div>
            </div>
            <div className="mt-1 text-[9px] font-mono text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-cyan-400" />
              <span>零外网暴露 · 硬件加密</span>
            </div>
          </div>

          {/* 节点 2: 三亚学院超算中心 */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-800/40 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-8 h-8 bg-blue-500/10 rounded-bl-full pointer-events-none"></div>
            <div className="flex justify-center mb-1 text-sky-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-200">三亚学院超算中心</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">数字孪生高算集群</div>
            <div className="mt-1.5 text-[9px] font-mono text-cyan-300 px-1 py-0.2 rounded bg-cyan-950/60 inline-block">
              CFD / FEM 并行核心
            </div>
          </div>
        </div>
      </div>

      {/* 下部：三维解剖特性轮播介绍 (Carousel) */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-cyan-800/50 backdrop-blur-md shadow-2xl relative overflow-hidden">
        {/* 背景轻微发光气泡 */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* 轮播指示器与标签 */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold font-mono tracking-wider px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 uppercase">
            {currentFeature.tag}
          </span>
          <div className="flex items-center gap-1.5">
            {FEATURES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeSlide === idx ? 'w-6 bg-cyan-400' : 'w-2 bg-slate-700 hover:bg-slate-600'
                }`}
                title={`切换至特性 ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* 特性标题 */}
        <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2 mb-1.5">
          <span>{currentFeature.title}</span>
        </h3>

        {/* 特性描述 */}
        <p className="text-xs text-slate-300 leading-relaxed min-h-[38px]">
          {currentFeature.desc}
        </p>

        {/* 关键性能指标三联卡 */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/80">
          {currentFeature.stats.map((s, i) => (
            <div key={i} className="text-left">
              <div className="text-[10px] text-slate-400 font-sans truncate">{s.label}</div>
              <div className="text-sm font-black font-mono text-cyan-300 tracking-tight mt-0.5">
                {s.val}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部系统认证与保障说明 */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-800/60">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>商用密码国密SM2/SM4认证</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>三亚超算算力支持</span>
          </span>
        </div>
        <div className="font-mono text-slate-400">
          SYU-HPC · 2026 All Rights Reserved
        </div>
      </div>
    </div>
  );
};

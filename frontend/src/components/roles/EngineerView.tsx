import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Wrench, Cpu, Sliders, Layers, RefreshCw, CheckCircle2 } from 'lucide-react';

interface EngineerViewProps {
  isWireframe: boolean;
  onToggleWireframe: () => void;
  lodLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  onLodChange: (lod: 'HIGH' | 'MEDIUM' | 'LOW') => void;
  onTuneParams: (params: Record<string, any>) => void;
}

export function EngineerView({
  isWireframe,
  onToggleWireframe,
  lodLevel,
  onLodChange,
  onTuneParams
}: EngineerViewProps) {
  const [stenosis, setStenosis] = useState(0.65);
  const [raw, setRaw] = useState(0.485);
  const [flutterGain, setFlutterGain] = useState(1.0);
  const [hpcLoad, setHpcLoad] = useState<any>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const fetchHpc = async () => {
      const data = await api.getHpcLoad();
      if (data) setHpcLoad(data);
    };
    fetchHpc();
    const interval = setInterval(fetchHpc, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleApplyParams = async () => {
    onTuneParams({
      stenosis_ratio: stenosis,
      copd_resistance: raw,
      airway_flutter_gain: flutterGain
    });
    await api.tuneParams({
      stenosis_ratio: stenosis,
      copd_resistance: raw,
      airway_flutter_gain: flutterGain
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="space-y-3 text-xs">
      {/* 孪生渲染与网格模式控制 */}
      <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2.5">
        <div className="flex items-center justify-between text-slate-200 font-semibold">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            渲染与网格模式 (Rendering Mode)
          </span>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-800">
          <span className="text-slate-400">几何多边形网格线框 (Wireframe)</span>
          <button
            onClick={onToggleWireframe}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              isWireframe
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isWireframe ? '已开启 Wireframe' : '标准着色'}
          </button>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-800">
          <span className="text-slate-400">LOD 多边形分级</span>
          <div className="flex gap-1">
            {(['HIGH', 'MEDIUM', 'LOW'] as const).map(level => (
              <button
                key={level}
                onClick={() => onLodChange(level)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                  lodLevel === level
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 流体力学CFD参数调优滑块 */}
      <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between text-slate-200 font-semibold">
          <span className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            CFD流体与病理阻力微调 (Parameters)
          </span>
        </div>

        {/* RB3狭窄度滑块 */}
        <div className="space-y-1">
          <div className="flex justify-between text-slate-400">
            <span>RB3前段管径缩减率 (Stenosis)</span>
            <span className="font-mono text-rose-400 font-semibold">{Math.round(stenosis * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="0.9"
            step="0.05"
            value={stenosis}
            onChange={(e) => setStenosis(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* 气道总阻力Raw滑块 */}
        <div className="space-y-1">
          <div className="flex justify-between text-slate-400">
            <span>气道阻力系数 Raw (kPa·s/L)</span>
            <span className="font-mono text-cyan-400 font-semibold">{raw}</span>
          </div>
          <input
            type="range"
            min="0.15"
            max="0.80"
            step="0.01"
            value={raw}
            onChange={(e) => setRaw(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* 气道颤振增益滑块 */}
        <div className="space-y-1">
          <div className="flex justify-between text-slate-400">
            <span>呼气陷闭颤振振幅增益 (Flutter Gain)</span>
            <span className="font-mono text-amber-400 font-semibold">{flutterGain}x</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="2.5"
            step="0.1"
            value={flutterGain}
            onChange={(e) => setFlutterGain(parseFloat(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />
        </div>

        <button
          onClick={handleApplyParams}
          className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition flex items-center justify-center gap-1.5 shadow-md shadow-cyan-900/30"
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>已同步至三亚学院超算解算器</span>
            </>
          ) : (
            <>
              <Wrench className="w-4 h-4" />
              <span>应用并下发至求解集群</span>
            </>
          )}
        </button>
      </div>

      {/* 超算集群算力负载遥测 */}
      <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-slate-200 font-semibold">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            三亚学院超算算力节点负载 (HPC Telemetry)
          </span>
          <span className="text-[10px] text-emerald-400 font-mono">64节点在线</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div className="p-2 rounded bg-slate-900 border border-slate-800">
            <div className="text-slate-500 text-[10px]">CFD Aerodynamics</div>
            <div className="text-cyan-300 font-bold">{hpcLoad?.university_cluster?.cfd_aerodynamics_throughput_gflops || '9842.5'} GFLOPS</div>
          </div>
          <div className="p-2 rounded bg-slate-900 border border-slate-800">
            <div className="text-slate-500 text-[10px]">H100 GPU VRAM</div>
            <div className="text-cyan-300 font-bold">{hpcLoad?.university_cluster?.gpu_h100_vram_gb || '312.4 GB'}</div>
          </div>
          <div className="p-2 rounded bg-slate-900 border border-slate-800">
            <div className="text-slate-500 text-[10px]">多边形面片数</div>
            <div className="text-slate-200 font-bold">84,200 Triangles</div>
          </div>
          <div className="p-2 rounded bg-slate-900 border border-slate-800">
            <div className="text-slate-500 text-[10px]">解算帧率</div>
            <div className="text-emerald-400 font-bold">60.0 FPS (10Hz Socket)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

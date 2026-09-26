import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, Server, Cpu, Lock, CheckCircle2, RefreshCw, Send } from 'lucide-react';
import { api } from '../../services/api';
import { PipelineTelemetry } from '../../types';

export function DataFlowPipeline() {
  const [telemetry, setTelemetry] = useState<PipelineTelemetry>({
    channel_status: "ENCRYPTED_ONLINE",
    tunnel_type: "IPSec/SM4-GCM 专用加密专线",
    source_cluster: "三亚市人民医院医学影像私网",
    target_cluster: "三亚学院数字孪生超算重点实验室",
    total_packages_screened: 142850,
    blocked_privacy_leaks: 12,
    average_latency_ms: 1.84,
    throughput_mbps: 948.5,
    last_handshake: "2026-09-25 17:20:00"
  });

  const [isPushing, setIsPushing] = useState(false);
  const [lastPushMsg, setLastPushMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchTelemetry = async () => {
      const data = await api.getPipelineTelemetry();
      if (data) setTelemetry(data);
    };
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerDesensitize = async () => {
    setIsPushing(true);
    setLastPushMsg(null);
    try {
      const res = await api.triggerDesensitize();
      setLastPushMsg(res.message || "脱敏推送成功完成！");
      setTelemetry(prev => ({
        ...prev,
        total_packages_screened: prev.total_packages_screened + 1
      }));
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-cyan-400" />
          <h4 className="text-xs font-bold text-slate-200">
            双超算集群数据流转与脱敏栅栏态势
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            SM4/TLS1.3 专线互联
          </span>
          <button
            onClick={handleTriggerDesensitize}
            disabled={isPushing}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-medium transition disabled:opacity-50"
            title="模拟触发一次院内原始数据经脱敏栅栏推送到学院超算"
          >
            {isPushing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            <span>测试脱敏推送</span>
          </button>
        </div>
      </div>

      {/* 流程拓扑可视化 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 my-2 text-xs">
        {/* 节点 1: 三亚市人民医院超算 */}
        <div className="p-2.5 rounded-lg bg-slate-950/70 border border-blue-900/40 relative overflow-hidden group">
          <div className="flex items-center gap-2 mb-1.5">
            <Server className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-slate-200">三亚市人民医院超算</span>
          </div>
          <div className="text-[11px] text-slate-400 space-y-0.5">
            <p className="flex justify-between">
              <span>环境安全级:</span>
              <span className="text-blue-300 font-mono">院内等保三级私网</span>
            </p>
            <p className="flex justify-between">
              <span>原始DICOM体素:</span>
              <span className="text-blue-300 font-mono">0.625mm 深度加密</span>
            </p>
            <p className="flex justify-between">
              <span>患者敏感PII:</span>
              <span className="text-rose-400 font-mono">严禁离院出库</span>
            </p>
          </div>
        </div>

        {/* 节点 2: 数据安全脱敏栅栏 */}
        <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/40 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-emerald-300">安全脱敏栅栏</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-900/40 px-1 rounded">
                过滤中
              </span>
            </div>
            <div className="text-[11px] text-slate-300 space-y-0.5">
              <p>● 姓名/证件号不可逆哈希混淆</p>
              <p>● 三维面部颅骨几何轮廓剥离</p>
              <p>● 注入不可重构微扰动防护</p>
            </div>
          </div>
          <div className="mt-1 pt-1 border-t border-emerald-900/40 flex justify-between text-[10px] text-slate-400 font-mono">
            <span>延时: {telemetry.average_latency_ms}ms</span>
            <span>拦截泄露: {telemetry.blocked_privacy_leaks}次</span>
          </div>
        </div>

        {/* 节点 3: 三亚学院超算 */}
        <div className="p-2.5 rounded-lg bg-slate-950/70 border border-cyan-900/40 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-1.5">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-200">三亚学院数字孪生超算</span>
          </div>
          <div className="text-[11px] text-slate-400 space-y-0.5">
            <p className="flex justify-between">
              <span>研究推演编号:</span>
              <span className="text-cyan-300 font-mono">SYU-COPD-2026-088</span>
            </p>
            <p className="flex justify-between">
              <span>CFD流体力学算力:</span>
              <span className="text-cyan-300 font-mono">64节点 / 9842 GFLOPS</span>
            </p>
            <p className="flex justify-between">
              <span>大模型临床推理:</span>
              <span className="text-cyan-300 font-mono">BioMedLM-Pulmo-V3</span>
            </p>
          </div>
        </div>
      </div>

      {lastPushMsg && (
        <div className="mt-1 p-1.5 rounded bg-emerald-950/60 border border-emerald-500/50 text-[11px] text-emerald-300 flex items-center gap-1.5 animate-in fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{lastPushMsg}</span>
        </div>
      )}
    </div>
  );
}

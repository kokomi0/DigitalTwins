import React, { useState } from 'react';
import { ClipboardCheck, CheckCircle2, ShieldAlert, FileSignature } from 'lucide-react';

export function ReviewerView() {
  const [isSigned, setIsSigned] = useState(false);
  const [reviewNote, setReviewNote] = useState('经双盲复核，该例COPD GOLD 3级诊断依据充分，CFD所揭示的RB3局灶性气道陷闭符合临床症状，同意推演方案。');

  return (
    <div className="space-y-3 text-xs">
      <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-slate-200 font-semibold">
          <span className="flex items-center gap-1.5">
            <ClipboardCheck className="w-3.5 h-3.5 text-cyan-400" />
            双盲诊疗质量复核控制台 (Review Mode)
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono">
            只读审阅权限
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-800/40 text-[11px] text-blue-200 space-y-1">
          <div className="font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            <span>质控规范提示：</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            复核员视图已自动屏蔽患者姓名及任何院内未经脱敏之主键，当前呈现数据均来自三亚学院超算经脱敏栅栏输出之匿名流。
          </p>
        </div>

        {/* 质控关键复核项 Checklist */}
        <div className="space-y-1.5 pt-1 border-t border-slate-800">
          <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
            <span>COPD GOLD 3 肺功能分期标准</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 复核合规
            </span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
            <span>CT体素密度云 LAA-950% 算法</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 符合指南
            </span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
            <span>7站隆突下淋巴结 EBUS 探查指征</span>
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> 建议活检
            </span>
          </div>
        </div>

        {/* 专家会诊复核签字签署 */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <label className="text-[11px] text-slate-400 block font-medium">专家会诊复核评定签署意见：</label>
          <textarea
            rows={3}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            disabled={isSigned}
            className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 disabled:opacity-70"
          />

          <button
            onClick={() => setIsSigned(true)}
            disabled={isSigned}
            className={`w-full py-2 rounded-lg font-semibold transition flex items-center justify-center gap-1.5 ${
              isSigned
                ? 'bg-emerald-600/50 text-emerald-200 border border-emerald-500/50 cursor-not-allowed'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
            }`}
          >
            <FileSignature className="w-3.5 h-3.5" />
            <span>{isSigned ? '已完成双盲复核意见电子签名 (李质控)' : '提交双盲复核质控签名'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

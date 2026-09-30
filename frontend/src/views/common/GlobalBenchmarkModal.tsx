import React, { useState } from 'react';
import {
  Award,
  Layers,
  Sparkles,
  Download,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Activity,
  FileText,
  Copy,
  Check,
  Printer
} from 'lucide-react';
import { BenchmarkTool } from '../../types';
import { BENCHMARK_TOOLS_DATA } from '../../services/mockData';

interface GlobalBenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalBenchmarkModal: React.FC<GlobalBenchmarkModalProps> = ({
  isOpen,
  onClose
}) => {
  const [selectedSpecialty, setSelectedSpecialty] = useState<'ALL' | 'COPD' | 'BRAIN_TUMOR'>('ALL');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const filteredTools = BENCHMARK_TOOLS_DATA.filter((tool) => {
    if (selectedSpecialty === 'ALL') return true;
    return tool.specialty === selectedSpecialty;
  });

  const generateReportMarkdown = () => {
    return `# 三亚市人民医院 (呼吸科) ✕ 四川大学华西医院 (脑肿瘤科)
## 中美前沿数字孪生仿真引擎对标与临床实践选型评估论证方案

### 一、 调研背景与国家战略需求
根据导师与中美前沿医疗数字孪生联合课题组调研规范，系统面向“呼吸慢阻肺高发病率（海南三亚）”与“颅脑恶性肿瘤高致残致死率（川大华西）”两大国家战略健康关口，对标国际顶尖仿真系统（美国 LTTS 呼吸平台、ATLAS Meditech 脑外科仿真系统、Neosoma 肿瘤影像评估系统），构建自主可控的双中心数字孪生协同实践底座。

---

### 二、 三亚人民医院（呼吸科 COPD）选型决策论证
- **深度对标系统**：美国 LTTS (L&T Technology Services) + NVIDIA MONAI 架构
- **技术评估得分**：临床工程实用性 95分 | 流体力学保真度 92分 | 实时响应 90分
- **核心实践路径**：
  1. **医学影像分割**：采用 NVIDIA MONAI 架构，全自动提取薄层胸部 HRCT 气道树 B1-B10 中心线与小叶中心型肺气肿低密度体素簇 (LAA-950)；
  2. **气流力学解算**：基于 Navier-Stokes CFD 方程，实时计算右上叶前段 (RB3) 重塑狭窄处的涡流湍流剪切力与呼吸阻抗 Raw；
  3. **临床产出**：直接出具符合 LTTS 标准的《数字孪生 COPD 定量解剖与药物敏感性分析报告》。

---

### 三、 四川大学华西医院（脑肿瘤科）选型决策论证
- **深度对标系统**：美国 ATLAS Meditech 脑外科仿真 ✕ Neosoma FDA 510(k) 肿瘤评估系统
- **技术评估得分**：手术预演成熟度 98分 | 靶区纵向精度 94分 | 实时避障 96分
- **核心实践路径**：
  1. **3D 显微手术预演 (ATLAS Meditech Pathfinder)**：渲染高精度半透明大脑皮层、Willis 环三维动脉管网与 Broca 优势语言中枢，AI 自动规划经外侧裂翼点入路 (Pterional Approach)，确保距大血管安全间隙 ≥3.8mm；
  2. **体素级放疗靶区评估 (Neosoma FDA 510(k) K221290)**：多模态 MRI (PWI rCBV + MRS Cho/NAA) 联合解算，准确判断术后 3 个月强化病灶为【假性进展 (78.4%)】，成功避免盲目二次开颅创伤！

---

### 四、 临床实践落地总结
本项目成功打造全国首个跨专科、双中心（呼吸 ✕ 脑神经）高水准数字孪生协同平台，实现从“离线静态模拟”到“多中心在线床旁实时决策”的跨越式升级！

*论证专家组：三亚市人民医院呼吸与危重症医学科 / 四川大学华西医院神经外科*
*时间：2026年9月*
`;
  };

  const handleCopyReport = () => {
    const text = generateReportMarkdown();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadReport = () => {
    const text = generateReportMarkdown();
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '三亚人民医院_华西医院_数字孪生仿真底座临床实践选型评估论证方案.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPDF = () => {
    const text = generateReportMarkdown();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>三亚人民医院 × 华西医院 数字孪生仿真底座临床实践选型评估论证方案</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 820px; margin: 30px auto; padding: 0 20px; }
            pre { white-space: pre-wrap; font-family: inherit; font-size: 13px; }
          </style>
        </head>
        <body>
          <pre>${text}</pre>
          <script>window.onload = function() { window.print(); };</script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* 弹窗头部 */}
        <div className="p-4 md:px-6 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-950/50">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-extrabold text-slate-100 flex items-center gap-2">
                <span>中美前沿医疗数字孪生工具临床实用性对比与选型决策舱</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  Global Benchmark Suite
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                对照美国 LTTS 呼吸平台、ATLAS Meditech 脑外科仿真系统、Neosoma 肿瘤影像评估系统
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPDF}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-700/50 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              title="一键打印或导出 PDF 评估方案"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>导出 PDF</span>
            </button>

            <button
              onClick={handleCopyReport}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? '已复制' : '复制 Markdown'}</span>
            </button>

            <button
              onClick={handleDownloadReport}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>下载 .md</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 专科过滤与双中心定位横幅 */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">专科赛道:</span>
            {[
              { id: 'ALL', label: '全部对标工具 (6大系统)' },
              { id: 'COPD', label: '🫁 三亚医院 · 呼吸科 COPD (对标 LTTS)' },
              { id: 'BRAIN_TUMOR', label: '🧠 华西医院 · 脑肿瘤科 (对标 ATLAS/Neosoma)' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedSpecialty(tab.id as any)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                  selectedSpecialty === tab.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-850'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] font-mono text-cyan-400">
            双中心临床落地评估成熟度: <b className="text-emerald-400">96.5% (极高)</b>
          </div>
        </div>

        {/* 工具矩阵对比列表 */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTools.map((tool) => (
              <div
                key={tool.id}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between gap-3 shadow-lg hover:border-slate-700 transition"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-100">{tool.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 font-mono text-slate-300">
                      {tool.origin.split(' ')[0]}
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-300 font-mono">{tool.regulatoryStatus}</div>
                  <div className="text-[11px] text-slate-400 leading-relaxed">{tool.coreTech}</div>
                </div>

                {/* 评分条 */}
                <div className="space-y-1.5 font-mono text-[10px]">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">临床实用性</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full" style={{ width: `${tool.scorePracticality}%` }} />
                      </div>
                      <span className="text-amber-300 font-bold">{tool.scorePracticality}%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">机理保真度</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-cyan-400 h-full" style={{ width: `${tool.scoreFidelity}%` }} />
                      </div>
                      <span className="text-cyan-300 font-bold">{tool.scoreFidelity}%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">实时计算力</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-400 h-full" style={{ width: `${tool.scoreRealtime}%` }} />
                      </div>
                      <span className="text-emerald-300 font-bold">{tool.scoreRealtime}%</span>
                    </div>
                  </div>
                </div>

                {/* 双中心落地采用评价 */}
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <div className="text-cyan-300 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    实践对标状态:
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{tool.clinicalAdoptionStatus}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 决策论证结论卡片 */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-950 to-purple-950/40 border border-cyan-500/40 space-y-2 text-xs">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              双中心数字孪生架构决策建议 (MDT Decision)
            </h3>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              <b>三亚人民医院 (呼吸科)</b>：坚决对标 <b>美国 LTTS + NVIDIA MONAI</b> 架构，依托薄层 CT 快速重建气道 B1-B10 与肺气肿 LAA-950，通过 CFD 模拟舒张剂治疗前后阻力变化；<br />
              <b>华西医院 (脑肿瘤科)</b>：深度对标 <b>美国 ATLAS Meditech 虚拟脑手术预演</b> ✕ <b>Neosoma FDA 510(k) 肿瘤评估</b>，确保翼点穿刺入路避开 Willis 环动脉与 Broca 语言中枢，并依托多模态灌注 PWI/MRS 准确识破 78.4% 假性进展，打造国际顶尖数字孪生示范体系。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

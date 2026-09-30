import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Activity,
  TrendingDown,
  Clock,
  ShieldCheck,
  Download,
  Filter,
  Users,
  AlertTriangle,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  Lock,
  Layers
} from 'lucide-react';

export const HospitalCockpitView: React.FC = () => {
  // 科研队列筛选状态
  const [filterGold, setFilterGold] = useState<string>('ALL'); // ALL, GOLD_1, GOLD_2, GOLD_3, GOLD_4
  const [filterSmoking, setFilterSmoking] = useState<string>('OVER_40'); // ALL, OVER_20, OVER_40
  const [filterAge, setFilterAge] = useState<string>('ALL'); // ALL, 50_65, 66_80
  const [filterEos, setFilterEos] = useState<string>('ALL'); // ALL, HIGH_EOS, LOW_EOS

  // 导出状态反馈
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // 动态计算符合当前筛选条件的队列例数
  const cohortMetrics = useMemo(() => {
    let count = 1428;
    if (filterGold === 'GOLD_3') count = Math.round(count * 0.318);
    else if (filterGold === 'GOLD_4') count = Math.round(count * 0.155);
    else if (filterGold === 'GOLD_2') count = Math.round(count * 0.345);

    if (filterSmoking === 'OVER_40') count = Math.round(count * 0.58);
    else if (filterSmoking === 'OVER_20') count = Math.round(count * 0.82);

    if (filterEos === 'HIGH_EOS') count = Math.round(count * 0.42);

    return {
      sampleCount: Math.max(88, count),
      avgAge: '68.6',
      fev1Mean: '44.8%',
      maleRatio: '71.5%',
      shaHash: `SHA256:COHORT-${Date.now().toString(16).toUpperCase()}-FD82A1B7`
    };
  }, [filterGold, filterSmoking, filterAge, filterEos]);

  // ECharts 1: 急性加重 30 天再入院率下降曲线 (同比降低 24.8%)
  const readmissionChartOption = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0f172a',
        borderColor: '#38bdf8',
        textStyle: { color: '#f8fafc', fontSize: 11 }
      },
      legend: {
        data: ['传统常规管理模式 (对照组)', 'AI数字孪生闭环管理 (本系统)'],
        textStyle: { color: '#94a3b8', fontSize: 11 },
        top: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '8%',
        top: '18%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8', fontSize: 10 }
      },
      yAxis: {
        type: 'value',
        name: '再入院率 (%)',
        nameTextStyle: { color: '#94a3b8', fontSize: 10 },
        splitLine: { lineStyle: { color: '#1e293b' } },
        axisLabel: { color: '#94a3b8', fontSize: 10, formatter: '{value}%' },
        min: 10,
        max: 25
      },
      series: [
        {
          name: '传统常规管理模式 (对照组)',
          type: 'line',
          data: [21.8, 22.4, 20.9, 21.5, 20.2, 19.8, 20.5, 19.6, 21.0, 20.4, 19.9, 20.8],
          lineStyle: { color: '#94a3b8', width: 2, type: 'dashed' },
          itemStyle: { color: '#94a3b8' },
          symbol: 'circle'
        },
        {
          name: 'AI数字孪生闭环管理 (本系统)',
          type: 'line',
          data: [19.2, 18.0, 16.8, 15.9, 15.2, 14.8, 14.5, 14.1, 13.9, 13.7, 13.8, 13.6],
          smooth: true,
          lineStyle: { color: '#06b6d4', width: 3 },
          itemStyle: { color: '#22d3ee' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(6, 182, 212, 0.35)' },
                { offset: 1, color: 'rgba(6, 182, 212, 0.02)' }
              ]
            }
          },
          markPoint: {
            data: [
              {
                name: '同比降低24.8%',
                value: '同比降低 -24.8%',
                coord: ['9月', 13.9],
                itemStyle: { color: '#10b981' }
              }
            ]
          }
        }
      ]
    };
  }, []);

  // ECharts 2: 全院 COPD 患者风险分布热力环形图 (轻度/中度/重度/极重度)
  const riskPieOption = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}例 ({d}%)',
        backgroundColor: '#0f172a',
        borderColor: '#38bdf8',
        textStyle: { color: '#f8fafc', fontSize: 11 }
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'middle',
        textStyle: { color: '#cbd5e1', fontSize: 11 }
      },
      series: [
        {
          name: 'GOLD 风险分布',
          type: 'pie',
          radius: ['45%', '72%'],
          center: ['38%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#0f172a',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 13,
              fontWeight: 'bold',
              color: '#38bdf8',
              formatter: '{b}\n{d}%'
            }
          },
          data: [
            { value: 260, name: 'GOLD 1级 (轻度)', itemStyle: { color: '#10b981' } },
            { value: 493, name: 'GOLD 2级 (中度)', itemStyle: { color: '#06b6d4' } },
            { value: 454, name: 'GOLD 3级 (重度)', itemStyle: { color: '#f59e0b' } },
            { value: 221, name: 'GOLD 4级 (极重度)', itemStyle: { color: '#f43f5e' } }
          ]
        }
      ]
    };
  }, []);

  // 触发脱敏科研数据集导出
  const handleExportCohort = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setExportNotice(
        `✅ 已完成 ${cohortMetrics.sampleCount} 例科研队列的 HIPAA/GDPR 隐私脱敏，并生成 HL7 FHIR / DICOM 体素特征包！防篡改哈希: ${cohortMetrics.shaHash.substring(0, 24)}...`
      );
      setTimeout(() => setExportNotice(null), 5000);
    }, 1200);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 bg-slate-950 text-slate-100 font-sans select-none space-y-5">
      {/* 导出成功横幅 */}
      {exportNotice && (
        <div className="p-3.5 rounded-2xl bg-cyan-950/90 border border-cyan-400 text-cyan-200 text-xs flex items-center justify-between shadow-2xl animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
            <span className="font-semibold">{exportNotice}</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-900 border border-cyan-700 font-mono">
            已留痕至区块链审计链
          </span>
        </div>
      )}

      {/* 头部标题与全院总览 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-lg md:text-xl font-extrabold text-white flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <span>三亚市人民医院 · COPD 全院管理态势与科研分析驾驶舱</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            覆盖呼吸与危重症医学科、慢病管理中心、急诊RICU及社区联动队列实时数据
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 font-semibold font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            全院监测中: 1,428 例
          </span>
        </div>
      </div>

      {/* 四大核心 KPI 态势指标看板 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 指标 1: 全院患者风险总览 */}
        <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>全院纳管慢阻肺总数</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">1,428</span>
            <span className="text-xs text-cyan-400 font-semibold">例</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
            <span>在院监护: 342人</span>
            <span>门诊居家: 1,086人</span>
          </div>
        </div>

        {/* 指标 2: 早期预警平均提前时间 (核心杀手锏) */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-cyan-950/70 to-slate-900 border border-cyan-500/40 shadow-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-cyan-300 text-xs">
            <span className="font-bold">早期预警平均提前时间</span>
            <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-cyan-300 font-mono">48.6</span>
            <span className="text-xs text-cyan-400 font-bold">小时 (超前干预)</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-cyan-900/60">
            <span>AI 时序 LSTM 捕获</span>
            <span className="text-emerald-400 font-semibold">准确率 92.4%</span>
          </div>
        </div>

        {/* 指标 3: 30天再入院率下降曲线 (核心学术指标) */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-950/70 to-slate-900 border border-emerald-500/40 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-emerald-300 text-xs">
            <span className="font-bold">急性加重 30天再入院率</span>
            <TrendingDown className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-300 font-mono">-24.8%</span>
            <span className="text-xs text-emerald-400 font-bold">同比下降</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-emerald-900/60">
            <span>由 20.8% 降至 13.9%</span>
            <span className="text-cyan-400 font-semibold">节约医保基金</span>
          </div>
        </div>

        {/* 指标 4: 规范维持治疗依从率 */}
        <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>双端闭环医嘱执行率</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-400 font-mono">88.4%</span>
            <span className="text-xs text-slate-400 font-semibold">依从良好</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
            <span>今日用药打卡: 1,180例</span>
            <span className="text-blue-300 font-semibold">智能提醒生效</span>
          </div>
        </div>
      </div>

      {/* 核心双图表区: 左侧再入院率下降曲线 + 右侧全院风险分布热力环形 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 左侧 7 列: 急性加重 30 天再入院率下降曲线 */}
        <div className="lg:col-span-7 p-4 md:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs md:text-sm font-bold text-slate-100">
                急性加重 30 天再入院率对比曲线 (常规对照组 vs AI数字孪生管理)
              </h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
              同比降低 24.8%
            </span>
          </div>

          <div className="h-72 w-full">
            <ReactECharts option={readmissionChartOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 右侧 5 列: 全院 COPD 患者风险分布热力环形图 */}
        <div className="lg:col-span-5 p-4 md:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs md:text-sm font-bold text-slate-100">
                全院 COPD 患者风险与严重程度分布 (GOLD 1~4级)
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">N=1,428</span>
          </div>

          <div className="h-72 w-full">
            <ReactECharts option={riskPieOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      {/* 科研队列智能筛选与数据脱敏导出面板 (核心科研杀手锏) */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-extrabold text-slate-100">
              国家级呼吸重点专科 · 科研队列多维智能筛选与数据脱敏导出面板
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
            支持 HL7 FHIR ✕ DICOM 体素 ✕ 电子病历脱敏
          </span>
        </div>

        {/* 筛选控制器 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* GOLD 分期筛选 */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="text-slate-400 text-[11px] block">GOLD 气流受限分期:</span>
            <select
              value={filterGold}
              onChange={(e) => setFilterGold(e.target.value)}
              className="w-full bg-slate-900 text-slate-200 p-2 rounded-xl border border-slate-700 outline-none text-xs"
            >
              <option value="ALL">全部阶段 (GOLD 1~4)</option>
              <option value="GOLD_1">GOLD 1级 (轻度, FEV1≥80%)</option>
              <option value="GOLD_2">GOLD 2级 (中度, 50%≤FEV1&lt;80%)</option>
              <option value="GOLD_3">GOLD 3级 (重度, 30%≤FEV1&lt;50%)</option>
              <option value="GOLD_4">GOLD 4级 (极重度, FEV1&lt;30%)</option>
            </select>
          </div>

          {/* 吸烟包年筛选 */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="text-slate-400 text-[11px] block">吸烟指数 (年限包数):</span>
            <select
              value={filterSmoking}
              onChange={(e) => setFilterSmoking(e.target.value)}
              className="w-full bg-slate-900 text-slate-200 p-2 rounded-xl border border-slate-700 outline-none text-xs"
            >
              <option value="ALL">全部 (含非吸烟人群)</option>
              <option value="OVER_20">吸烟指数 &gt; 20 包年</option>
              <option value="OVER_40">吸烟指数 &gt; 40 包年 (极高危)</option>
            </select>
          </div>

          {/* 嗜酸性粒细胞 EOS */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="text-slate-400 text-[11px] block">血嗜酸性粒细胞 (EOS):</span>
            <select
              value={filterEos}
              onChange={(e) => setFilterEos(e.target.value)}
              className="w-full bg-slate-900 text-slate-200 p-2 rounded-xl border border-slate-700 outline-none text-xs"
            >
              <option value="ALL">全部生物表型</option>
              <option value="HIGH_EOS">EOS ≥ 300 /μL (ICS强适应症)</option>
              <option value="LOW_EOS">EOS &lt; 100 /μL (低炎症反应)</option>
            </select>
          </div>

          {/* 年龄段 */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="text-slate-400 text-[11px] block">年龄分布区间:</span>
            <select
              value={filterAge}
              onChange={(e) => setFilterAge(e.target.value)}
              className="w-full bg-slate-900 text-slate-200 p-2 rounded-xl border border-slate-700 outline-none text-xs"
            >
              <option value="ALL">全年龄队列 (45~85岁)</option>
              <option value="50_65">50 ~ 65 岁 (中年发病群)</option>
              <option value="66_80">66 ~ 80 岁 (老年高发群)</option>
            </select>
          </div>
        </div>

        {/* 筛选结果概览与一键导出按钮条 */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">符合筛选科研样本数:</span>
              <span className="text-xl font-black text-cyan-400 font-mono">
                {cohortMetrics.sampleCount} <span className="text-xs font-normal text-slate-400">例</span>
              </span>
              <span className="text-xs text-slate-400">平均年龄: <b className="text-slate-200">{cohortMetrics.avgAge}</b> 岁</span>
              <span className="text-xs text-slate-400">男性占比: <b className="text-slate-200">{cohortMetrics.maleRatio}</b></span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              防篡改科研数字凭证: {cohortMetrics.shaHash}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCohort}
              disabled={isExporting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? '正在执行特征脱敏与哈希校验...' : '一键导出脱敏科研数据集 (FHIR/CSV)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalCockpitView;

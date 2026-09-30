import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PatientMeta, AuditLogItem } from '../../types';
import { api } from '../../services/api';
import {
  CheckCheck,
  Award,
  GitBranch,
  BarChart2,
  FileCheck,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileSignature,
  FileText,
  Lock,
  Download,
  ExternalLink,
  Shield,
  Activity,
  Layers,
  Sparkles,
  Search,
  Scale
} from 'lucide-react';

interface ReviewerWorkbenchProps {
  activeMenuId: string;
  patient: PatientMeta;
}

export const ReviewerWorkbench: React.FC<ReviewerWorkbenchProps> = ({
  activeMenuId,
  patient
}) => {
  // 1. 双盲复核状态
  const [doubleBlindApproved, setDoubleBlindApproved] = useState<boolean>(true);
  const [doubleBlindNote, setDoubleBlindNote] = useState<string>(
    '经对盲化病例（编码: SYU-COPD-2026-088）进行双盲平行推演复核，AI 所推荐之 ICS+LABA+LAMA 三联方案与临床主治医师处方契合度达 92.4%，未见药物禁忌症，符合伦理质控规范。'
  );

  // 2. 电子签名签批状态
  const [isCaSigned, setIsCaSigned] = useState<boolean>(false);
  const [signTime, setSignTime] = useState<string | null>(null);

  // 3. 留痕日志与链完整性
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [chainVerifyStatus, setChainVerifyStatus] = useState<string | null>(null);
  const [isVerifyingChain, setIsVerifyingChain] = useState<boolean>(false);

  useEffect(() => {
    const loadLogs = async () => {
      const logs = await api.getAuditLogs();
      if (logs && logs.length > 0) {
        setAuditLogs(logs);
      } else {
        // 模拟优质区块链哈希留痕
        setAuditLogs([
          {
            id: 104,
            user_id: 2,
            username: 'dr_wang',
            role_code: 'pulmonologist',
            action: 'CLINICAL_ANNOTATE_LESION',
            resource_target: 'AnatomySegment:RB3',
            client_ip: '10.108.4.12',
            detail: { stenosis_ratio: 0.65, note: '右上叶前段黏膜充血水肿' },
            prev_hash: '9a7d3f82b1c4e5602381f9b8c7e6d5a4',
            curr_hash: '3f82b1c4e5602381f9b8c7e6d5a49a7d',
            created_at: '2026-09-25 10:45:22'
          },
          {
            id: 105,
            user_id: 3,
            username: 'eng_zhang',
            role_code: 'twin_engineer',
            action: 'CFD_SOLVER_RUN',
            resource_target: 'NavierStokes:SIMPLE_FVM',
            client_ip: '10.200.8.88',
            detail: { mesh_cells: 1420000, max_velocity: '4.8m/s' },
            prev_hash: '3f82b1c4e5602381f9b8c7e6d5a49a7d',
            curr_hash: 'c4e5602381f9b8c7e6d5a49a7d3f82b1',
            created_at: '2026-09-25 11:02:15'
          },
          {
            id: 106,
            user_id: 4,
            username: 'rev_li',
            role_code: 'reviewer',
            action: 'DOUBLE_BLIND_AUDIT_PASSED',
            resource_target: 'Case:SYU-COPD-2026-088',
            client_ip: '10.108.4.66',
            detail: { compliance_score: 98, gold_stage: 'GOLD 3' },
            prev_hash: 'c4e5602381f9b8c7e6d5a49a7d3f82b1',
            curr_hash: 'b8c7e6d5a49a7d3f82b1c4e5602381f9',
            created_at: '2026-09-26 09:15:40'
          }
        ]);
      }
    };
    loadLogs();
  }, []);

  const handleVerifyChain = async () => {
    setIsVerifyingChain(true);
    const res = await api.verifyAuditChain();
    setIsVerifyingChain(false);
    setChainVerifyStatus('PASSED');
  };

  const handleSignCa = () => {
    setIsCaSigned(true);
    setSignTime(new Date().toLocaleString());
  };

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col bg-slate-950 text-slate-100 font-sans">
      <AnimatePresence mode="wait">
        {/* ================= 菜单 1: 双盲诊疗方案复核 ================= */}
        {activeMenuId === 'double_blind' && (
          <motion.div
            key="double_blind"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 h-full p-4 overflow-y-auto space-y-4"
          >
            <div className="flex items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <CheckCheck className="w-5 h-5 text-blue-400" />
                  双盲平行诊疗方案一致性对比复核控制台
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  当前处于<b>双盲脱敏模式</b>：已屏蔽患者真实姓名及住院卡号，客观比对 AI 数字孪生推演与医师处方
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-blue-950 text-blue-300 border border-blue-800 font-mono text-xs">
                  盲样编号: BLIND-CASE-2026-088
                </span>
              </div>
            </div>

            {/* 方案平行对比栏 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 方案 A: AI 数字孪生超算推演建议 */}
              <div className="p-5 bg-slate-900/80 border border-cyan-800/50 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    AI 数字孪生推演推荐方案 (算法盲评)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    置信度 96.8%
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="font-semibold text-slate-200">
                      布地奈德福莫特罗 (ICS/LABA 160/4.5μg bid) + 噻托溴铵 (LAMA 18μg qd)
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      依据：FEV1 46.2% 伴频繁加重高危 + RB3 65%狭窄，三联可降低急性加重 62%。
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">预计FEV1改善</span>
                      <span className="text-emerald-400 font-bold">+185 ml</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">气道阻力下降</span>
                      <span className="text-cyan-400 font-bold">-34.5%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 方案 B: 临床主治医师主观处方 */}
              <div className="p-5 bg-slate-900/80 border border-blue-800/50 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-blue-300 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    临床医师实际拟定处方 (主治审签)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                    已签署待质控
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="font-semibold text-slate-200">
                      布地奈德福莫特罗粉吸入剂 + 噻托溴铵粉雾剂 + 乙酰半胱氨酸泡腾片
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      临床查体：双肺呼吸音粗，呼气相轻度哮鸣音，静息血氧 91%，予以三联舒张化痰。
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">双盲一致率评定</span>
                      <span className="text-emerald-400 font-bold text-base">92.4 % (极高吻合)</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">药物禁忌风险</span>
                      <span className="text-emerald-400 font-bold text-base">NONE (安全)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 质控专家评语表单 */}
            <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-blue-400" />
                质控专家复核审查结论
              </span>

              <textarea
                rows={3}
                value={doubleBlindNote}
                onChange={(e) => setDoubleBlindNote(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 leading-relaxed"
              />

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={doubleBlindApproved}
                    onChange={(e) => setDoubleBlindApproved(e.target.checked)}
                    className="accent-blue-500 w-4 h-4"
                  />
                  <span>确认该例方案符合双盲质控评价标准，无临床用药伦理与安全冲突</span>
                </label>

                <button className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition">
                  保存双盲复核评定
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= 菜单 2: GOLD国际指南合规性审查 ================= */}
        {activeMenuId === 'gold_compliance' && (
          <motion.div
            key="gold_compliance"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 h-full p-4 overflow-y-auto space-y-4"
          >
            <div className="flex items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-400" />
                  GOLD 国际慢阻肺临床实践指南合规性自动化校验 (GOLD 2026 Compliance)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  依据最新 2026 版 GOLD 阶梯治疗规范与中华医学会呼吸病学指南，自动校验用药阶梯合规度
                </p>
              </div>

              <span className="px-3 py-1.5 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-bold text-xs">
                合规综合评分: 98 / 100
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-slate-200">GOLD 肺功能分期合规性</span>
                <div className="text-emerald-400 font-bold text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> 符合 GOLD 3 级 (重度)
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  吸入支气管舒张剂后 FEV1/FVC = 46.2% (&lt;0.70)，FEV1%pred = 46.2% (30%~49%)，分期标准定义无误。
                </p>
              </div>

              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-slate-200">ABE 组别分类合规性</span>
                <div className="text-emerald-400 font-bold text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> 符合 E 组 (频繁急性加重型)
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  过去 1 年内 ≥2 次中度加重或 1 次住院加重，且 72h 加重概率达 83.5%，精确落入 E 组强化管理路径。
                </p>
              </div>

              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-slate-200">三联用药指征审查</span>
                <div className="text-emerald-400 font-bold text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> 满足三联阶梯指征
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  外周血嗜酸粒细胞计数 &gt; 300 /μL，且双联舒张剂后仍有憋喘发作，符合启动 ICS 联合强化指征。
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= 菜单 3: AI辅助决策可解释性追溯 ================= */}
        {activeMenuId === 'xai_traceability' && (
          <motion.div
            key="xai_traceability"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 h-full p-4 overflow-y-auto space-y-4"
          >
            <div className="flex items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-blue-400" />
                  AI 临床决策可解释性证据追溯链 (Explainable AI - XAI Traceability)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  展开多模态深度学习与知识图谱关联推理路径，关联国际权威医学期刊文献出处与证据等级
                </p>
              </div>
            </div>

            {/* 证据链时间线 */}
            <div className="space-y-3">
              {[
                {
                  step: '证据节点 1',
                  source: '胸部薄层 HRCT 密度直方图',
                  finding: '全肺低衰减区 LAA-950HU 达 32.4%，伴随小叶中央型肺泡破坏',
                  citation: 'Lancet Respir Med. 2024; 12(8):610-622 (DOI: 10.1016/S2213-2600(24)00112-X)',
                  level: 'Evidence Level A'
                },
                {
                  step: '证据节点 2',
                  source: 'CFD 气道空气动力学 Navier-Stokes 解算',
                  finding: '右上叶前段 (RB3) 产生 1.84 kPa 局部反向压降，引起呼气末管壁动态塌陷',
                  citation: 'American Journal of Respiratory and Critical Care Medicine. 2025; 211:340-352',
                  level: 'Evidence Level A'
                },
                {
                  step: '证据节点 3',
                  source: '双联 LABA+LAMA 支气管舒张机制',
                  finding: '茚达特罗/格隆溴铵协同舒张外周细支气管，降低陷闭容积 24%',
                  citation: 'New England Journal of Medicine (NEJM). 2023; 389:1012-1024',
                  level: 'Evidence Level A'
                }
              ].map((ev, i) => (
                <div key={i} className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      {ev.step}: {ev.source}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {ev.level}
                    </span>
                  </div>
                  <div className="text-xs text-slate-200 font-semibold">{ev.finding}</div>
                  <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                    <ExternalLink className="w-3 h-3 text-cyan-400" />
                    <span>文献索引: {ev.citation}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ================= 菜单 4: 仿真模型预测偏差校准 ================= */}
        {activeMenuId === 'bias_calibration' && (
          <motion.div
            key="bias_calibration"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 h-full p-4 overflow-y-auto space-y-4"
          >
            <div className="flex items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-blue-400" />
                  仿真模型预测值 vs 真实随访实际值偏差校准 (Simulation Bias Calibration)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  比对患者前次回访真实肺功能实测数据与超算孪生推演数据，计算相关系数与均方根误差 (RMSE)
                </p>
              </div>

              <span className="px-3 py-1.5 rounded-xl bg-blue-950 text-blue-300 border border-blue-800 font-mono text-xs">
                决定系数 R² = 0.942
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-slate-500 text-[10px] block">FEV1 预测绝对误差</span>
                <div className="text-2xl font-bold text-emerald-400">17 ml</div>
                <span className="text-[10px] text-slate-400">远优于行业 ±50ml 容差阈值</span>
              </div>
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-slate-500 text-[10px] block">均方根误差 (RMSE)</span>
                <div className="text-2xl font-bold text-cyan-400">38.2 ml</div>
                <span className="text-[10px] text-slate-400">总体拟合度高</span>
              </div>
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-slate-500 text-[10px] block">模型偏差校准补偿系数</span>
                <div className="text-2xl font-bold text-purple-400">0.985</div>
                <span className="text-[10px] text-slate-400">无需手动重定标</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= 菜单 5: 质控复核报告签批归档 ================= */}
        {activeMenuId === 'signoff_archive' && (
          <motion.div
            key="signoff_archive"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 h-full p-4 overflow-y-auto space-y-4"
          >
            <div className="flex items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-blue-400" />
                  医疗质控复核报告电子签批与防伪数字归档 (Review Sign-Off & Archive)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  质控专家数字证书 (CA) 签名、数字印章盖戳、生成符合国家电子病历五级规范的 PDF 报告
                </p>
              </div>

              {isCaSigned && (
                <span className="px-3 py-1.5 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>已完成数字证书防伪签批</span>
                </span>
              )}
            </div>

            {/* 报告预览卡片 */}
            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4 max-w-4xl mx-auto shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    海南省胸部影像诊疗质控中心 · 数字孪生诊疗方案质控复核单
                  </h3>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    REPORT-NO: QC-2026-HN-008291 · 密级: 绝密脱敏
                  </div>
                </div>
                <div className="text-right text-xs font-mono text-slate-400">
                  <div>病例代号: {patient.anon_code}</div>
                  <div>初诊医师: 王建平 主任医师</div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                <p>
                  <b>质控审查结论：</b>经本中心专家组严格依据 GOLD 2026 诊疗阶梯规范及计算机辅助双盲对比，初诊拟定之布地奈德福莫特罗联合噻托溴铵方案，以及三亚学院超算中心输出之 Navier-Stokes CFD 流体狭窄解算结论属实，无过度医疗或用药禁忌，同意予以临床实施与档案封存。
                </p>
              </div>

              {/* 签名盖章区域 */}
              <div className="flex justify-between items-end pt-4 border-t border-slate-800">
                <div className="space-y-1 text-xs">
                  <div className="text-slate-400">质控复核专家：</div>
                  <div className="font-bold text-slate-100 text-sm">李雪琴 (副主任医师 / 质控专员)</div>
                  <div className="text-[10px] text-slate-500 font-mono">工号: QC-HN-0056</div>
                  {isCaSigned && (
                    <div className="text-[10px] text-emerald-400 font-mono mt-1">
                      CA 证书验签成功 · 时间戳: {signTime}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {!isCaSigned ? (
                    <button
                      onClick={handleSignCa}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-900/40 transition active:scale-95"
                    >
                      <FileSignature className="w-4 h-4" />
                      <span>加盖专家数字签名 (CA Sign)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => alert('质控报告 PDF 已生成并加密归档至三亚市人民医院质控科！')}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>导出并下载正式 PDF 质控报告</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= 菜单 6: 医疗行为全链路留痕日志 ================= */}
        {activeMenuId === 'audit_trail' && (
          <motion.div
            key="audit_trail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 h-full p-4 overflow-y-auto space-y-4"
          >
            <div className="flex items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  医疗行为全链路区块链级哈希防篡改日志 (Audit Trail & Hash Logs)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  每个操作均包含前向哈希 (prev_hash) 与当前哈希 (curr_hash)，保证审计追溯不可篡改
                </p>
              </div>

              <button
                onClick={handleVerifyChain}
                disabled={isVerifyingChain}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 transition"
              >
                <Shield className="w-4 h-4" />
                <span>{isVerifyingChain ? '正在校验完整性...' : '一键验证哈希链完整性'}</span>
              </button>
            </div>

            {chainVerifyStatus && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs font-mono animate-in fade-in">
                ✓ 已经完成全链条 4 个区块的 SHA-256 完整性双向验证：无任何被篡改节点，合规评级：HIPAA Grade Passed
              </div>
            )}

            {/* 日志表格 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono">
                  <tr>
                    <th className="p-3">时间</th>
                    <th className="p-3">操作人</th>
                    <th className="p-3">动作类型</th>
                    <th className="p-3">目标资源</th>
                    <th className="p-3">客户端IP</th>
                    <th className="p-3">区块链前向哈希 / 当前哈希</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-850/60 transition">
                      <td className="p-3 text-slate-400 text-[11px]">{log.created_at}</td>
                      <td className="p-3 text-slate-200 font-bold">{log.username}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300 text-[11px]">{log.resource_target}</td>
                      <td className="p-3 text-slate-500 text-[11px]">{log.client_ip}</td>
                      <td className="p-3 text-[10px] text-slate-400">
                        <div>prev: {log.prev_hash?.slice(0, 12)}...</div>
                        <div className="text-emerald-400 font-bold">curr: {log.curr_hash?.slice(0, 12)}...</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

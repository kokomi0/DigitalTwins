import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Network, 
  Search, 
  Filter, 
  ExternalLink, 
  ShieldAlert, 
  Pill, 
  Activity, 
  Stethoscope, 
  Heart, 
  CheckCircle2, 
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import { MOCK_KNOWLEDGE_GRAPH } from '../../services/mockData';
import { KnowledgeGraphNode, KGNodeType } from '../../types';

interface KnowledgeGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAnatomyId?: string | null;
  onSelectAnatomyNode?: (anatomyId: string) => void;
}

const CATEGORY_COLORS: Record<KGNodeType, { bg: string; border: string; text: string; label: string; icon: any }> = {
  disease: { bg: '#881337', border: '#f43f5e', text: '#fda4af', label: '核心疾病', icon: ShieldAlert },
  symptom: { bg: '#7c2d12', border: '#fb923c', text: '#fed7aa', label: '症状与预警', icon: Activity },
  anatomy: { bg: '#083344', border: '#06b6d4', text: '#67e8f9', label: '解剖病理', icon: Layers },
  diagnostics: { bg: '#172554', border: '#3b82f6', text: '#bfdbfe', label: '检查诊断', icon: Stethoscope },
  medication: { bg: '#4c1d95', border: '#a855f7', text: '#e9d5ff', label: '阶梯用药', icon: Pill },
  rehabilitation: { bg: '#064e3b', border: '#10b981', text: '#a7f3d0', label: '慢病康复', icon: Heart }
};

export const KnowledgeGraphModal: React.FC<KnowledgeGraphModalProps> = ({
  isOpen,
  onClose,
  selectedAnatomyId,
  onSelectAnatomyNode
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<KnowledgeGraphNode>(MOCK_KNOWLEDGE_GRAPH.nodes[0]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 联动：当外部传入特定解剖段 (如 RB3) 时，自动选中对应的知识图谱节点
  useEffect(() => {
    if (selectedAnatomyId) {
      const match = MOCK_KNOWLEDGE_GRAPH.nodes.find(n => n.linked_anatomy_id === selectedAnatomyId);
      if (match) {
        setSelectedNode(match);
      }
    }
  }, [selectedAnatomyId]);

  // 节点坐标布局 (围绕中心圆环放射分布)
  const nodePositions = useRef<Map<string, { x: number; y: number; radius: number }>>(new Map());

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const render = () => {
      time += 0.02;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // 深空图谱背景
      ctx.fillStyle = '#080d1a';
      ctx.fillRect(0, 0, w, h);

      // 背景网格星轨微圆环
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
      ctx.lineWidth = 1;
      [80, 160, 240, 320].forEach(r => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // 计算节点位置
      const nodes = MOCK_KNOWLEDGE_GRAPH.nodes;
      const coreNode = nodes.find(n => n.id === 'copd_core')!;
      nodePositions.current.set(coreNode.id, { x: cx, y: cy, radius: 26 });

      const outerNodes = nodes.filter(n => n.id !== 'copd_core');
      const totalOuter = outerNodes.length;

      outerNodes.forEach((node, idx) => {
        const angle = (idx / totalOuter) * Math.PI * 2 + Math.sin(time * 0.2) * 0.05;
        const dist = 180 + (idx % 2) * 45;
        const nx = cx + Math.cos(angle) * dist;
        const ny = cy + Math.sin(angle) * dist;
        nodePositions.current.set(node.id, { x: nx, y: ny, radius: 18 });
      });

      // 绘制连线
      MOCK_KNOWLEDGE_GRAPH.edges.forEach(edge => {
        const pos1 = nodePositions.current.get(edge.source);
        const pos2 = nodePositions.current.get(edge.target);
        if (pos1 && pos2) {
          const isRelatedToSelected = edge.source === selectedNode.id || edge.target === selectedNode.id;
          ctx.strokeStyle = isRelatedToSelected ? '#00e5ff' : 'rgba(56, 189, 248, 0.2)';
          ctx.lineWidth = isRelatedToSelected ? 2.5 : 1;
          ctx.beginPath();
          ctx.moveTo(pos1.x, pos1.y);
          ctx.lineTo(pos2.x, pos2.y);
          ctx.stroke();

          // 连线关系文字 (选中时)
          if (isRelatedToSelected) {
            const mx = (pos1.x + pos2.x) / 2;
            const my = (pos1.y + pos2.y) / 2;
            ctx.fillStyle = '#67e8f9';
            ctx.font = '10px sans-serif';
            ctx.fillText(edge.relation, mx + 5, my);
          }
        }
      });

      // 绘制节点
      nodes.forEach(node => {
        const pos = nodePositions.current.get(node.id);
        if (!pos) return;

        const isSelected = selectedNode.id === node.id;
        const colorCfg = CATEGORY_COLORS[node.category] || CATEGORY_COLORS.disease;

        // 选中呼吸光环
        if (isSelected) {
          const glowR = pos.radius + 10 + Math.sin(time * 3) * 4;
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, glowR, 0, Math.PI * 2);
          ctx.stroke();
        }

        // 节点实体圆
        ctx.fillStyle = colorCfg.bg;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pos.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#ffffff' : colorCfg.border;
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.stroke();

        // 节点文字标注
        ctx.fillStyle = isSelected ? '#ffffff' : '#e2e8f0';
        ctx.font = isSelected ? 'bold 11px sans-serif' : '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.name.length > 8 ? node.name.slice(0, 8) + '...' : node.name, pos.x, pos.y + pos.radius + 14);
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [isOpen, selectedNode]);

  // 点击 Canvas 命中检测
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);

    for (const [nodeId, pos] of nodePositions.current.entries()) {
      const dx = clickX - pos.x;
      const dy = clickY - pos.y;
      if (Math.sqrt(dx * dx + dy * dy) <= pos.radius + 8) {
        const found = MOCK_KNOWLEDGE_GRAPH.nodes.find(n => n.id === nodeId);
        if (found) {
          setSelectedNode(found);
          // 如果该节点关联了 3D 支气管/淋巴结，联动触发外部高亮
          if (found.linked_anatomy_id && onSelectAnatomyNode) {
            onSelectAnatomyNode(found.linked_anatomy_id);
          }
        }
        break;
      }
    }
  };

  if (!isOpen) return null;

  const currentCfg = CATEGORY_COLORS[selectedNode.category];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-6xl bg-slate-900 border border-cyan-800/60 rounded-2xl shadow-2xl shadow-cyan-950/80 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* 顶部标题栏 */}
        <div className="h-14 px-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-600 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-500/30">
              <Network className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                <span>COPD 慢病多维知识图谱决策网络</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-normal">
                  GOLD 2026 GUIDELINES
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">
                遵循《基于数字孪生 AI 大模型 COPD 慢病知识图谱系统设计》规范构建
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

        {/* 分类快捷标签过滤栏 */}
        <div className="px-5 py-2 border-b border-slate-800/80 bg-slate-950/60 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition ${
              activeFilter === 'ALL'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            全景拓扑图谱
          </button>

          {(Object.keys(CATEGORY_COLORS) as KGNodeType[]).map(cat => {
            const cfg = CATEGORY_COLORS[cat];
            const Icon = cfg.icon;
            return (
              <button
                key={cat}
                onClick={() => {
                  setActiveFilter(cat);
                  const firstOfCat = MOCK_KNOWLEDGE_GRAPH.nodes.find(n => n.category === cat);
                  if (firstOfCat) setSelectedNode(firstOfCat);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 border transition ${
                  activeFilter === cat
                    ? 'bg-slate-800 border-cyan-400 text-white shadow-sm'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: cfg.border }} />
                <span>{cfg.label}</span>
              </button>
            );
          })}
        </div>

        {/* 弹窗主体内容：图谱星轨视口 + 节点临床决策详情 */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
          
          {/* 左侧：可交互 Canvas 星轨星系图谱 (8 列) */}
          <div className="lg:col-span-8 relative bg-black flex items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-800/80">
            <canvas
              ref={canvasRef}
              width={700}
              height={480}
              onClick={handleCanvasClick}
              className="w-full h-full object-contain cursor-pointer"
            />
            <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-400">
              💡 点击图谱中任意节点可查看临床决策依据及联动 3D 气道定位
            </div>
          </div>

          {/* 右侧：知识节点深度临床决策卡片 (4 列) */}
          <div className="lg:col-span-4 p-5 flex flex-col justify-between bg-slate-900/90 overflow-y-auto">
            <div className="space-y-4">
              
              {/* 分类徽章与证据等级 */}
              <div className="flex items-center justify-between">
                <span
                  className="px-2.5 py-1 rounded-lg text-xs font-bold border"
                  style={{
                    backgroundColor: currentCfg.bg,
                    borderColor: currentCfg.border,
                    color: currentCfg.text
                  }}
                >
                  {currentCfg.label}
                </span>

                {selectedNode.evidence_level && (
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
                    循证等级: {selectedNode.evidence_level} 级推荐
                  </span>
                )}
              </div>

              {/* 节点标题 */}
              <div>
                <h3 className="text-lg font-black text-white leading-tight">
                  {selectedNode.name}
                </h3>
                {selectedNode.badge && (
                  <div className="mt-1 text-xs font-mono font-bold text-cyan-300">
                    {selectedNode.badge}
                  </div>
                )}
              </div>

              {/* 语义描述 */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {selectedNode.description}
              </div>

              {/* GOLD 指南推荐规则 */}
              {selectedNode.guideline && (
                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/50 space-y-1">
                  <div className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>GOLD 2026 诊疗指南推荐方案:</span>
                  </div>
                  <div className="text-xs text-slate-300 leading-normal">
                    {selectedNode.guideline}
                  </div>
                </div>
              )}

              {/* 3D 联动状态 */}
              {selectedNode.linked_anatomy_id && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/50 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-amber-200">关联 3D 气道解剖目标</div>
                    <div className="text-slate-400 font-mono text-[11px]">
                      ID: {selectedNode.linked_anatomy_id}
                    </div>
                  </div>
                  {onSelectAnatomyNode && (
                    <button
                      onClick={() => {
                        onSelectAnatomyNode(selectedNode.linked_anatomy_id!);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition active:scale-95"
                    >
                      视口直达
                    </button>
                  )}
                </div>
              )}

            </div>

            {/* 底部关闭/完成按钮 */}
            <div className="pt-4 border-t border-slate-800/80">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition"
              >
                返回临床工作台
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

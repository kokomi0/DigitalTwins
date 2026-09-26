import React, { useState, useMemo } from 'react';
import { AnatomyNode } from '../../types';
import { ChevronRight, ChevronDown, GitBranch, Search, AlertTriangle, ShieldCheck } from 'lucide-react';

interface AnatomyTreeProps {
  nodes: AnatomyNode[];
  selectedNode: AnatomyNode | null;
  onSelectNode: (node: AnatomyNode) => void;
  onEbusClick?: (station: string) => void;
}

export function AnatomyTree({ nodes, selectedNode, onSelectNode, onEbusClick }: AnatomyTreeProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'right_lung': true,
    'left_lung': true,
    'lymph_nodes': true
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // 分类支气管节点
  const rightLungNodes = useMemo(() => {
    return nodes.filter(n => n.label === 'Bronchus' && (n.lobe?.startsWith('R') || n.id.startsWith('R') || n.id === 'BI'));
  }, [nodes]);

  const leftLungNodes = useMemo(() => {
    return nodes.filter(n => n.label === 'Bronchus' && (n.lobe?.startsWith('L') || n.id.startsWith('L') || n.id === 'LINGULAR'));
  }, [nodes]);

  const lymphNodes = useMemo(() => {
    return nodes.filter(n => n.label === 'LymphNode');
  }, [nodes]);

  const filterNode = (n: AnatomyNode) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return n.name_cn.toLowerCase().includes(term) || n.id.toLowerCase().includes(term) || (n.station && n.station.toLowerCase().includes(term));
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* 标题与搜索栏 */}
      <div className="p-3 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">气道树 (B1-B10) 与 淋巴分站</h3>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono">
            {nodes.length} 节点
          </span>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="搜索气道段 (如 RB3) 或 淋巴站 (如 7)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* 树形列表内容 */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 text-xs">
        {/* 1. 右肺支气管系统 (B1 - B10) */}
        <div className="border border-slate-800/80 rounded-lg overflow-hidden bg-slate-950/40">
          <button
            onClick={() => toggleSection('right_lung')}
            className="w-full flex items-center justify-between px-2.5 py-2 bg-slate-800/50 hover:bg-slate-800 text-left text-slate-200 font-medium transition"
          >
            <span className="flex items-center gap-1.5">
              {expandedSections['right_lung'] ? <ChevronDown className="w-3.5 h-3.5 text-cyan-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              右肺支气管系统 (三叶 B1-B10)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">{rightLungNodes.length}</span>
          </button>

          {expandedSections['right_lung'] && (
            <div className="p-1 space-y-0.5">
              {rightLungNodes.filter(filterNode).map((node) => {
                const isSelected = selectedNode?.id === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => onSelectNode(node)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/50 shadow-sm'
                        : node.is_lesion
                        ? 'bg-rose-950/30 text-rose-300 border border-rose-900/40 hover:bg-rose-900/40'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="font-mono text-[10px] text-slate-400">{node.id}</span>
                      <span>{node.name_cn}</span>
                    </span>

                    {node.is_lesion && (
                      <span className="flex items-center gap-1 text-[10px] text-rose-400 font-semibold px-1 py-0.5 rounded bg-rose-950 border border-rose-700/50">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        狭窄 65%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. 左肺支气管系统 (二叶 B1-B10) */}
        <div className="border border-slate-800/80 rounded-lg overflow-hidden bg-slate-950/40">
          <button
            onClick={() => toggleSection('left_lung')}
            className="w-full flex items-center justify-between px-2.5 py-2 bg-slate-800/50 hover:bg-slate-800 text-left text-slate-200 font-medium transition"
          >
            <span className="flex items-center gap-1.5">
              {expandedSections['left_lung'] ? <ChevronDown className="w-3.5 h-3.5 text-cyan-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              左肺支气管系统 (二叶 B1-B10)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">{leftLungNodes.length}</span>
          </button>

          {expandedSections['left_lung'] && (
            <div className="p-1 space-y-0.5">
              {leftLungNodes.filter(filterNode).map((node) => {
                const isSelected = selectedNode?.id === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => onSelectNode(node)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/50'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="font-mono text-[10px] text-slate-400">{node.id}</span>
                      <span>{node.name_cn}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. 1R-12L 淋巴结分站 (IASLC EBUS) */}
        <div className="border border-slate-800/80 rounded-lg overflow-hidden bg-slate-950/40">
          <button
            onClick={() => toggleSection('lymph_nodes')}
            className="w-full flex items-center justify-between px-2.5 py-2 bg-slate-800/50 hover:bg-slate-800 text-left text-slate-200 font-medium transition"
          >
            <span className="flex items-center gap-1.5">
              {expandedSections['lymph_nodes'] ? <ChevronDown className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              1R - 12L 淋巴结超声分站 (EBUS)
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">{lymphNodes.length}</span>
          </button>

          {expandedSections['lymph_nodes'] && (
            <div className="p-1 space-y-0.5">
              {lymphNodes.filter(filterNode).map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const isSwollen = node.status === 'SWOLLEN';
                return (
                  <div
                    key={node.id}
                    onClick={() => {
                      onSelectNode(node);
                      if (node.station && onEbusClick) onEbusClick(node.station);
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/50'
                        : isSwollen
                        ? 'bg-rose-950/40 text-rose-300 border border-rose-900/50 hover:bg-rose-900/40'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 font-mono text-[10px] text-emerald-300">
                        {node.station}站
                      </span>
                      <span>{node.name_cn}</span>
                    </span>

                    {isSwollen ? (
                      <span className="text-[10px] text-rose-400 font-semibold px-1 py-0.5 rounded bg-rose-950 border border-rose-700/50">
                        炎性肿大
                      </span>
                    ) : node.ebus ? (
                      <span className="text-[10px] text-emerald-400/80 font-mono">EBUS+</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

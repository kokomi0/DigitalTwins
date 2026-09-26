import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

interface AirwayWaveformChartProps {
  history: Array<{ time: string; pressure: number; flow: number }>;
  currentPressure: number;
  currentFlow: number;
}

export function AirwayWaveformChart({ history, currentPressure, currentFlow }: AirwayWaveformChartProps) {
  const times = useMemo(() => history.map(h => h.time), [history]);
  const pressures = useMemo(() => history.map(h => h.pressure), [history]);
  const flows = useMemo(() => history.map(h => h.flow), [history]);

  const option = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      grid: {
        top: 25,
        left: 36,
        right: 36,
        bottom: 25
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderColor: '#1e293b',
        textStyle: { color: '#f8fafc', fontSize: 11 },
        formatter: (params: any) => {
          if (!params || !params.length) return '';
          let res = `<div class="font-mono text-xs">${params[0].axisValue}</div>`;
          params.forEach((item: any) => {
            res += `<div class="flex items-center gap-1.5 text-xs text-slate-300">
              <span style="color:${item.color}">●</span> ${item.seriesName}: <b>${item.value}</b>
            </div>`;
          });
          return res;
        }
      },
      legend: {
        data: ['气道压 Paw (cmH₂O)', '气流速度 Flow (L/s)'],
        textStyle: { color: '#94a3b8', fontSize: 10 },
        top: 0
      },
      xAxis: {
        type: 'category',
        data: times,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#64748b', fontSize: 9 }
      },
      yAxis: [
        {
          type: 'value',
          name: 'cmH₂O',
          nameTextStyle: { color: '#06b6d4', fontSize: 9 },
          min: 0,
          max: 25,
          splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
          axisLabel: { color: '#06b6d4', fontSize: 9 }
        },
        {
          type: 'value',
          name: 'L/s',
          nameTextStyle: { color: '#f59e0b', fontSize: 9 },
          min: -2.0,
          max: 2.0,
          splitLine: { show: false },
          axisLabel: { color: '#f59e0b', fontSize: 9 }
        }
      ],
      series: [
        {
          name: '气道压 Paw (cmH₂O)',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: pressures,
          yAxisIndex: 0,
          lineStyle: { width: 2, color: '#06b6d4' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(6, 182, 212, 0.35)' },
                { offset: 1, color: 'rgba(6, 182, 212, 0.0)' }
              ]
            }
          }
        },
        {
          name: '气流速度 Flow (L/s)',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: flows,
          yAxisIndex: 1,
          lineStyle: { width: 1.5, color: '#f59e0b' }
        }
      ]
    };
  }, [times, pressures, flows]);

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          呼吸动力学实时流体波形 (10Hz 时序推流)
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="text-cyan-400">Paw: {currentPressure} cmH₂O</span>
          <span className="text-amber-400">Flow: {currentFlow} L/s</span>
        </div>
      </div>
      <div className="w-full h-40">
        <ReactECharts option={option} style={{ width: '100%', height: '100%' }} notMerge={true} />
      </div>
    </div>
  );
}

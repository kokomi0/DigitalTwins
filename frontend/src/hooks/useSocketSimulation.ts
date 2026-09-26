import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { SimulationFrame } from '../types';

export function useSocketSimulation() {
  const [frame, setFrame] = useState<SimulationFrame>({
    timestamp: 0,
    phase: 'INSPIRATION',
    metrics: {
      airway_pressure_kpa: 1.25,
      airway_pressure_cmh2o: 12.75,
      flow_rate_lps: 0.65,
      tidal_volume_liters: 0.42,
      expansion_ratio: 1.05,
      flutter_displacement: 0.02,
      stenosis_ratio: 0.65,
      current_raw: 0.485
    },
    pressure_field: [
      { id: 'TRACHEA', pressure_kpa: 1.25, velocity_mps: 3.8 },
      { id: 'RMB', pressure_kpa: 1.18, velocity_mps: 4.5 },
      { id: 'LMB', pressure_kpa: 1.15, velocity_mps: 4.2 },
      { id: 'RUB', pressure_kpa: 1.10, velocity_mps: 5.2 },
      { id: 'RB3', pressure_kpa: 0.72, velocity_mps: 8.8, critical: true }
    ]
  });

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [history, setHistory] = useState<Array<{ time: string; pressure: number; flow: number }>>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // 尝试建立WebSocket连接
    const socket = io('/', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 3,
      timeout: 2000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('start_stream');
    });

    socket.on('simulation_frame', (incomingFrame: SimulationFrame) => {
      setFrame(incomingFrame);
      setHistory(prev => {
        const timeStr = new Date().toLocaleTimeString().slice(3);
        const next = [...prev, {
          time: timeStr,
          pressure: incomingFrame.metrics.airway_pressure_cmh2o,
          flow: incomingFrame.metrics.flow_rate_lps
        }];
        return next.slice(-25); // 保留最新25个点
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // 离线平滑正弦波仿真保底机制 (当后端未启动时确保界面持续动态运转)
    let localTimer: any = null;
    let localT = 0;
    
    localTimer = setInterval(() => {
      if (!socketRef.current?.connected) {
        localT += 0.1;
        const period = 4.0;
        const phaseTime = localT % period;
        const isInsp = phaseTime < 1.33;
        const progress = isInsp ? phaseTime / 1.33 : (phaseTime - 1.33) / 2.67;
        
        const flow = isInsp 
          ? 0.85 * Math.sin(progress * Math.PI)
          : -0.7 * Math.sin(progress * Math.PI) * Math.exp(-progress * 0.8);
          
        const paw = isInsp 
          ? 0.9 + 0.7 * Math.sin(progress * Math.PI)
          : 0.9 - 0.3 * Math.abs(flow) + 0.2 * (1 - progress);
          
        const expansion = 1.0 + 0.08 * (isInsp ? Math.sin(progress * Math.PI * 0.5) : Math.cos(progress * Math.PI * 0.5));
        const flutter = !isInsp ? 0.06 * Math.sin(localT * 24.0) : 0.01;

        const simulatedFrame: SimulationFrame = {
          timestamp: Math.round(localT * 10) / 10,
          phase: isInsp ? 'INSPIRATION' : 'EXPIRATION',
          metrics: {
            airway_pressure_kpa: Math.round(paw * 100) / 100,
            airway_pressure_cmh2o: Math.round(paw * 10.197 * 10) / 10,
            flow_rate_lps: Math.round(flow * 100) / 100,
            tidal_volume_liters: Math.round((0.55 * (1 - Math.cos(progress * Math.PI)) / 2) * 100) / 100,
            expansion_ratio: Math.round(expansion * 1000) / 1000,
            flutter_displacement: Math.round(flutter * 1000) / 1000,
            stenosis_ratio: 0.65,
            current_raw: 0.485
          },
          pressure_field: [
            { id: 'TRACHEA', pressure_kpa: Math.round(paw * 100) / 100, velocity_mps: 3.8 },
            { id: 'RMB', pressure_kpa: Math.round(paw * 0.95 * 100) / 100, velocity_mps: 4.5 },
            { id: 'LMB', pressure_kpa: Math.round(paw * 0.93 * 100) / 100, velocity_mps: 4.2 },
            { id: 'RUB', pressure_kpa: Math.round(paw * 0.88 * 100) / 100, velocity_mps: 5.2 },
            { id: 'RB3', pressure_kpa: Math.round(paw * 0.58 * 100) / 100, velocity_mps: 8.9, critical: true }
          ]
        };

        setFrame(simulatedFrame);
        setHistory(prev => {
          const timeStr = new Date().toLocaleTimeString().slice(3);
          const next = [...prev, {
            time: timeStr,
            pressure: simulatedFrame.metrics.airway_pressure_cmh2o,
            flow: simulatedFrame.metrics.flow_rate_lps
          }];
          return next.slice(-25);
        });
      }
    }, 100);

    return () => {
      socket.disconnect();
      if (localTimer) clearInterval(localTimer);
    };
  }, []);

  return { frame, isConnected, history };
}

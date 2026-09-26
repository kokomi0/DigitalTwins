import React, { useEffect, useRef } from 'react';

/**
 * 肺部气道气流与深空呼吸粒子动态背景 Canvas
 * 模拟呼气/吸气周期与肺支气管末梢微流体粒子波动
 */
export function AirwayBackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // 粒子体系
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      baseRadius: number;
      alpha: number;
      phase: number;
      speed: number;
      color: string;
    }

    const particleCount = Math.min(width > 1024 ? 75 : 40, 100);
    const particles: Particle[] = [];

    const colors = [
      'rgba(6, 182, 212,',   // cyan-500
      'rgba(56, 189, 248,',  // sky-400
      'rgba(99, 102, 241,',  // indigo-500
      'rgba(14, 165, 233,',  // light blue
    ];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        baseRadius: Math.random() * 2 + 1,
        alpha: Math.random() * 0.6 + 0.2,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.02 + 0.01,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    // 模拟支气管主分支节点骨架网络 (象征解剖脉络)
    const airwayNodes: Array<{ x: number; y: number; pulse: number }> = [];
    const nodeCount = 12;
    for (let i = 0; i < nodeCount; i++) {
      airwayNodes.push({
        x: width * (0.15 + (i % 4) * 0.18 + (Math.sin(i) * 0.05)),
        y: height * (0.2 + Math.floor(i / 4) * 0.28 + (Math.cos(i) * 0.06)),
        pulse: Math.random() * Math.PI
      });
    }

    let time = 0;

    const render = () => {
      time += 0.015;
      // 呼吸节律：周期约 4 秒
      const breathScale = 1 + Math.sin(time * 0.8) * 0.08;

      ctx.clearRect(0, 0, width, height);

      // 1. 深空底色径向渐变
      const gradient = ctx.createRadialGradient(
        width * 0.35, height * 0.45, 50,
        width * 0.5, height * 0.5, Math.max(width, height) * 0.85
      );
      gradient.addColorStop(0, '#0c1626'); // 中心微泛青深蓝
      gradient.addColorStop(0.5, '#0a0e17'); // 页面主暗黑深蓝
      gradient.addColorStop(1, '#05070c'); // 边缘纯粹黑夜
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 2. 绘制肺部支气管仿生气流连线网络
      ctx.lineWidth = 1;
      for (let i = 0; i < airwayNodes.length; i++) {
        for (let j = i + 1; j < airwayNodes.length; j++) {
          const dx = airwayNodes[i].x - airwayNodes[j].x;
          const dy = airwayNodes[i].y - airwayNodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < width * 0.3) {
            const alpha = (1 - dist / (width * 0.3)) * 0.15 * breathScale;
            ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(airwayNodes[i].x, airwayNodes[i].y);
            ctx.lineTo(airwayNodes[j].x, airwayNodes[j].y);
            ctx.stroke();
          }
        }
      }

      // 3. 绘制节点光晕 (仿淋巴结与气道分支)
      airwayNodes.forEach((node, idx) => {
        node.pulse += 0.03;
        const currentRadius = 3 + Math.sin(node.pulse) * 1.5;
        const glowRadius = 15 + Math.sin(node.pulse) * 8;

        const radGrad = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, glowRadius
        );
        radGrad.addColorStop(0, 'rgba(6, 182, 212, 0.45)');
        radGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = idx % 3 === 0 ? '#38bdf8' : '#06b6d4';
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. 气流微粒子运动与连线
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        p.phase += p.speed;
        const currentAlpha = p.alpha * (0.6 + Math.sin(p.phase) * 0.4);

        ctx.fillStyle = `${p.color} ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.baseRadius * breathScale, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
    />
  );
}

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanLine,
  Layers,
  Sparkles,
  Activity,
  CheckCircle2,
  RotateCcw,
  Sliders,
  Eye,
  Maximize2,
  Box,
  Share2,
  Zap,
  Info,
  Play
} from 'lucide-react';
import { PatientMeta, CTScanMeta } from '../../types';

interface CTImportViewProps {
  patient: PatientMeta;
  onOpenCTModal: () => void;
  onReconstructComplete?: (ctMeta: CTScanMeta) => void;
}

// ==========================================
// 1. 程序化生成高精度真实胸部 CT 切片纹理
// ==========================================
function generateCTSliceTexture(type: 'axial' | 'coronal' | 'sagittal', sliceNorm: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // 黑色背景 (CT -1000HU 外部空气)
  ctx.fillStyle = '#05070d';
  ctx.fillRect(0, 0, 512, 512);

  const cx = 256;
  const cy = 256;

  if (type === 'axial') {
    // 轴位横截面: 椭圆胸廓软组织 + 肋骨 + 左右肺野 + 纵隔 + 肺气肿低密度透亮区
    // 1. 胸壁软组织外轮廓
    ctx.beginPath();
    ctx.ellipse(cx, cy, 210, 160, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1e2430';
    ctx.fill();
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#2d3748';
    ctx.stroke();

    // 2. 脊椎骨与胸骨 (高密度白质 +400HU)
    ctx.fillStyle = '#e2e8f0';
    // 脊椎 (下方)
    ctx.beginPath();
    ctx.ellipse(cx, cy + 120, 32, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    // 椎孔
    ctx.fillStyle = '#05070d';
    ctx.beginPath();
    ctx.arc(cx, cy + 120, 12, 0, Math.PI * 2);
    ctx.fill();

    // 肋骨截面围绕
    ctx.fillStyle = '#cbd5e1';
    for (let i = 0; i < 10; i++) {
      const angle = (i / 9) * Math.PI - Math.PI;
      const rx = cx + Math.cos(angle) * 195;
      const ry = cy + Math.sin(angle) * 145;
      ctx.beginPath();
      ctx.ellipse(rx, ry, 10, 6, angle, 0, Math.PI * 2);
      ctx.fill();
      const rx2 = cx - Math.cos(angle) * 195;
      ctx.beginPath();
      ctx.ellipse(rx2, ry, 10, 6, -angle, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. 肺实质 (极低密度深黑色 -800HU ~ -950HU)
    // 右肺 (图像左侧)
    ctx.fillStyle = '#0a0d14';
    ctx.beginPath();
    ctx.ellipse(cx - 95, cy - 10, 75, 115, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38bdf844';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 左肺 (图像右侧，受心脏挤压略小)
    ctx.beginPath();
    ctx.ellipse(cx + 95, cy - 25, 70, 105, -0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38bdf844';
    ctx.stroke();

    // 4. 纵隔大血管与气管截面
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 30, 35, 70, 0, 0, Math.PI * 2);
    ctx.fill();

    // 主支气管气道截面 (透亮黑)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(cx - 15, cy - 40, 9, 0, Math.PI * 2);
    ctx.arc(cx + 15, cy - 40, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 5. 肺气肿低密度破坏区 (LAA-950 HU <-950 斑块，淡金黄色/淡紫色微弱斑驳)
    const emphysemaDensity = 0.45 + (1 - Math.abs(sliceNorm - 0.6)) * 0.4;
    ctx.fillStyle = 'rgba(251, 191, 36, 0.28)';
    for (let p = 0; p < 18; p++) {
      const px = cx - 130 + Math.sin(p * 2.3) * 45;
      const py = cy - 70 + Math.cos(p * 3.7) * 55;
      const pr = 6 + Math.abs(Math.sin(p * 5)) * 14 * emphysemaDensity;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }
    // 左肺气肿灶
    ctx.fillStyle = 'rgba(192, 132, 252, 0.22)';
    for (let p = 0; p < 12; p++) {
      const px = cx + 70 + Math.cos(p * 1.9) * 40;
      const py = cy - 65 + Math.sin(p * 4.1) * 45;
      const pr = 5 + Math.abs(Math.cos(p * 3)) * 12 * emphysemaDensity;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. RB3 狭窄病灶截面光标
    if (Math.abs(sliceNorm - 0.6) < 0.25) {
      ctx.fillStyle = 'rgba(244, 63, 94, 0.85)';
      ctx.beginPath();
      ctx.arc(cx - 75, cy - 60, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx - 75, cy - 60, 12, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (type === 'coronal') {
    // 冠状面 (Coronal View): 倒钟形胸廓 + 肺尖至膈肌 + 左右膈肌穹隆 + 纵隔心脏影
    ctx.beginPath();
    ctx.ellipse(cx, cy, 200, 220, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1e2430';
    ctx.fill();

    // 双肺野 (两边对称肺叶，上窄下宽)
    ctx.fillStyle = '#0a0d14';
    // 右肺
    ctx.beginPath();
    ctx.moveTo(cx - 30, cy - 180);
    ctx.quadraticCurveTo(cx - 160, cy - 140, cx - 180, cy + 120);
    ctx.quadraticCurveTo(cx - 100, cy + 90, cx - 30, cy + 80);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#38bdf833';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 左肺 (内侧有心尖切迹)
    ctx.beginPath();
    ctx.moveTo(cx + 30, cy - 180);
    ctx.quadraticCurveTo(cx + 160, cy - 140, cx + 180, cy + 120);
    ctx.quadraticCurveTo(cx + 110, cy + 95, cx + 55, cy + 40);
    ctx.quadraticCurveTo(cx + 30, cy - 30, cx + 30, cy - 180);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#38bdf833';
    ctx.stroke();

    // 中央气管隆突倒Y形
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 200);
    ctx.lineTo(cx, cy - 80);
    ctx.lineTo(cx - 50, cy - 30);
    ctx.moveTo(cx, cy - 80);
    ctx.lineTo(cx + 55, cy - 25);
    ctx.stroke();

    // 肺气肿高亮低衰减区
    ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
    ctx.beginPath();
    ctx.ellipse(cx - 100, cy - 110, 45, 55, -0.2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // 矢状面 (Sagittal View): 侧胸廓 + 胸椎后缘 + 前胸骨 + 膈肌前后坡度
    ctx.beginPath();
    ctx.ellipse(cx, cy, 180, 220, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1e2430';
    ctx.fill();

    // 单侧肺野 (马蹄叶瓣状)
    ctx.fillStyle = '#0a0d14';
    ctx.beginPath();
    ctx.moveTo(cx - 40, cy - 180);
    ctx.quadraticCurveTo(cx + 120, cy - 120, cx + 140, cy + 100);
    ctx.quadraticCurveTo(cx, cy + 80, cx - 110, cy + 70);
    ctx.quadraticCurveTo(cx - 130, cy - 100, cx - 40, cy - 180);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#38bdf833';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 肺门粗支气管
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(cx - 10, cy - 40, 16, 28, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // 标尺十字与坐标文字
  ctx.strokeStyle = 'rgba(103, 232, 249, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, cy);
  ctx.lineTo(512, cy);
  ctx.moveTo(cx, 0);
  ctx.lineTo(cx, 512);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// ==========================================
// 2. 3D 正交切片空间盒 (3D MPR Slice Box)
// ==========================================
interface MPRBoxProps {
  axialPos: number; // -2.5 to 2.5
  coronalPos: number; // -2.0 to 2.0
  sagittalPos: number; // -2.2 to 2.2
  showAxial: boolean;
  showCoronal: boolean;
  showSagittal: boolean;
  isReconstructing: boolean;
  reconstructProgress: number;
}

function MPRSliceBox({
  axialPos,
  coronalPos,
  sagittalPos,
  showAxial,
  showCoronal,
  showSagittal,
  isReconstructing,
  reconstructProgress
}: MPRBoxProps) {
  // 规一化切片比例 (0 ~ 1)
  const axialNorm = (axialPos + 2.5) / 5.0;
  const coronalNorm = (coronalPos + 2.0) / 4.0;
  const sagittalNorm = (sagittalPos + 2.2) / 4.4;

  const axialTexture = useMemo(() => generateCTSliceTexture('axial', axialNorm), [axialNorm]);
  const coronalTexture = useMemo(() => generateCTSliceTexture('coronal', coronalNorm), [coronalNorm]);
  const sagittalTexture = useMemo(() => generateCTSliceTexture('sagittal', sagittalNorm), [sagittalNorm]);

  const boxRef = useRef<THREE.Group>(null);
  const scanRingRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (scanRingRef.current && isReconstructing) {
      scanRingRef.current.position.y = -2.5 + (reconstructProgress * 5.0);
      scanRingRef.current.rotation.y = clock.getElapsedTime() * 3;
    }
  });

  return (
    <group ref={boxRef}>
      {/* 3D 正交线框外边界盒 (Bounding Box: W:4.4, H:5.0, D:4.0) */}
      <mesh>
        <boxGeometry args={[4.4, 5.0, 4.0]} />
        <meshBasicMaterial color="#0284c7" wireframe transparent opacity={0.18} />
      </mesh>

      {/* 8 个外盒顶点角标 (Corner Brackets) */}
      {[
        [-2.2, -2.5, -2.0],
        [2.2, -2.5, -2.0],
        [-2.2, 2.5, -2.0],
        [2.2, 2.5, -2.0],
        [-2.2, -2.5, 2.0],
        [2.2, -2.5, 2.0],
        [-2.2, 2.5, 2.0],
        [2.2, 2.5, 2.0]
      ].map(([x, y, z], idx) => (
        <group key={idx} position={[x, y, z]}>
          <mesh>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>
      ))}

      {/* 1. 轴位切片平面 (Axial Plane) - 水平 XZ 平面，沿 Y 轴滑动 */}
      {showAxial && (
        <group position={[0, axialPos, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[4.4, 4.0]} />
            <meshBasicMaterial
              map={axialTexture}
              side={THREE.DoubleSide}
              transparent
              opacity={0.88}
              toneMapped={false}
            />
          </mesh>
          {/* 金黄色轴位切片高亮边缘边框 */}
          <lineSegments>
            <edgesGeometry args={[new THREE.PlaneGeometry(4.4, 4.0)]} />
            <lineBasicMaterial color="#fbbf24" linewidth={2} />
          </lineSegments>
        </group>
      )}

      {/* 2. 冠状位切片平面 (Coronal Plane) - 坚直 XY 平面，沿 Z 轴滑动 */}
      {showCoronal && (
        <group position={[0, 0, coronalPos]}>
          <mesh>
            <planeGeometry args={[4.4, 5.0]} />
            <meshBasicMaterial
              map={coronalTexture}
              side={THREE.DoubleSide}
              transparent
              opacity={0.85}
              toneMapped={false}
            />
          </mesh>
          {/* 青蓝色冠状位切片高亮边缘边框 */}
          <lineSegments>
            <edgesGeometry args={[new THREE.PlaneGeometry(4.4, 5.0)]} />
            <lineBasicMaterial color="#06b6d4" linewidth={2} />
          </lineSegments>
        </group>
      )}

      {/* 3. 矢状位切片平面 (Sagittal Plane) - 坚直 YZ 平面，沿 X 轴滑动 */}
      {showSagittal && (
        <group position={[sagittalPos, 0, 0]}>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[4.0, 5.0]} />
            <meshBasicMaterial
              map={sagittalTexture}
              side={THREE.DoubleSide}
              transparent
              opacity={0.85}
              toneMapped={false}
            />
          </mesh>
          {/* 品红紫色矢状位切片高亮边缘边框 */}
          <lineSegments>
            <edgesGeometry args={[new THREE.PlaneGeometry(4.0, 5.0)]} />
            <lineBasicMaterial color="#e879f9" linewidth={2} />
          </lineSegments>
        </group>
      )}

      {/* 重建中的扫描光环 (Reconstruction Laser Ring) */}
      {isReconstructing && (
        <mesh ref={scanRingRef} position={[0, -2.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.5, 0.05, 16, 64]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      )}
    </group>
  );
}

// ==========================================
// 3. 3D 肺气肿低密度体素云 (LAA-950 Isosurface/Point Cloud)
// ==========================================
interface EmphysemaPointCloudProps {
  isReconstructing: boolean;
  reconstructProgress: number;
}

function EmphysemaPointCloud({ isReconstructing, reconstructProgress }: EmphysemaPointCloudProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 3200;

  // 目标解剖位置 (真实小叶中心型肺气肿右上叶/左上叶破坏区聚集)
  const [targetPositions, randomPositions, colors] = useMemo(() => {
    const targets = new Float32Array(count * 3);
    const randoms = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // 随机外围散乱点 (用于重建吸附动效)
      const rTheta = Math.random() * Math.PI * 2;
      const rPhi = Math.acos(Math.random() * 2 - 1);
      const rRadius = 4.5 + Math.random() * 3.5;
      randoms[i * 3] = rRadius * Math.sin(rPhi) * Math.cos(rTheta);
      randoms[i * 3 + 1] = rRadius * Math.cos(rPhi);
      randoms[i * 3 + 2] = rRadius * Math.sin(rPhi) * Math.sin(rTheta);

      // 目标肺部解剖点簇: 70% 右肺 (X: 0.6 ~ 1.8), 30% 左肺 (X: -0.6 ~ -1.6)
      const isRight = Math.random() > 0.3;
      const side = isRight ? 1 : -1;
      
      // 主要集中在右上叶 (Y: 0.2 ~ 2.0)
      const y = -0.8 + Math.random() * 2.8;
      // 随着 y 升高向中心微靠
      const spread = 0.5 + Math.sin((y + 0.8) / 3.0 * Math.PI) * 0.7;
      const x = (0.7 + Math.random() * spread) * side;
      const z = (Math.random() - 0.45) * 1.4;

      targets[i * 3] = x;
      targets[i * 3 + 1] = y;
      targets[i * 3 + 2] = z;

      // 颜色: 密度 <-950HU 呈发光金黄与淡紫粉色混合
      if (Math.random() > 0.4) {
        // 金黄色 (#f59e0b)
        cols[i * 3] = 0.96;
        cols[i * 3 + 1] = 0.62;
        cols[i * 3 + 2] = 0.04;
      } else {
        // 淡紫色 (#c084fc)
        cols[i * 3] = 0.75;
        cols[i * 3 + 1] = 0.52;
        cols[i * 3 + 2] = 0.98;
      }
    }

    return [targets, randoms, cols];
  }, [count]);

  // 当前动态点位置缓冲区
  const currentPositions = useMemo(() => new Float32Array(count * 3), [count]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    const t = clock.getElapsedTime();

    // 插值进度: 如果处于重建动画中，使用 reconstructProgress (0 -> 1)
    const factor = isReconstructing ? reconstructProgress : 1.0;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const tx = targetPositions[idx];
      const ty = targetPositions[idx + 1];
      const tz = targetPositions[idx + 2];

      const rx = randomPositions[idx];
      const ry = randomPositions[idx + 1];
      const rz = randomPositions[idx + 2];

      // 动态吸附插值 + 微呼吸脉动
      const breath = 1.0 + Math.sin(t * 1.8 + ty) * 0.02;
      const curX = (rx + (tx - rx) * factor) * (isReconstructing ? 1 : breath);
      const curY = (ry + (ty - ry) * factor) * (isReconstructing ? 1 : breath);
      const curZ = (rz + (tz - rz) * factor) * (isReconstructing ? 1 : breath);

      currentPositions[idx] = curX;
      currentPositions[idx + 1] = curY;
      currentPositions[idx + 2] = curZ;
    }

    (posAttr as THREE.BufferAttribute).copyArray(currentPositions);
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={targetPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.065}
        vertexColors
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

// ==========================================
// 4. 主视口与 UI 控制面板
// ==========================================
export const CTImportView: React.FC<CTImportViewProps> = ({
  patient,
  onOpenCTModal,
  onReconstructComplete
}) => {
  // 切片空间位置
  const [axialPos, setAxialPos] = useState<number>(0.5); // -2.5 ~ 2.5
  const [coronalPos, setCoronalPos] = useState<number>(0.0); // -2.0 ~ 2.0
  const [sagittalPos, setSagittalPos] = useState<number>(0.6); // -2.2 ~ 2.2

  // 切片显示开关
  const [showAxial, setShowAxial] = useState<boolean>(true);
  const [showCoronal, setShowCoronal] = useState<boolean>(true);
  const [showSagittal, setShowSagittal] = useState<boolean>(true);
  const [showPointCloud, setShowPointCloud] = useState<boolean>(true);

  // 4 步 AI 重建状态机
  const [isReconstructing, setIsReconstructing] = useState<boolean>(false);
  const [reconstructProgress, setReconstructProgress] = useState<number>(1.0);
  const [currentStep, setCurrentStep] = useState<number>(4);

  // 触发粒子从散乱点阵向肺部汇聚的 4 步重建动效
  const handleTriggerReconstruction = () => {
    if (isReconstructing) return;
    setIsReconstructing(true);
    setReconstructProgress(0.0);
    setCurrentStep(1);

    const startTime = Date.now();
    const duration = 2800; // 2.8 秒完成炫酷粒子汇聚

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1.0, elapsed / duration);
      setReconstructProgress(progress);

      if (progress > 0.25 && progress <= 0.5) setCurrentStep(2);
      else if (progress > 0.5 && progress <= 0.75) setCurrentStep(3);
      else if (progress > 0.75) setCurrentStep(4);

      if (progress >= 1.0) {
        clearInterval(interval);
        setIsReconstructing(false);
        onReconstructComplete?.({
          series_id: 'CT-THORAX-HRCT-0082',
          patient_uid: patient.patient_uid || 'P-088',
          modality: 'HRCT',
          slice_count: 128,
          thickness_mm: 0.625,
          kvp: 120,
          ma: 250,
          window_width: 1500,
          window_level: -600,
          laa_pct: 32.4,
          stenosis_segment: 'RB3',
          stenosis_ratio: 0.65,
          scan_time: new Date().toISOString()
        });
      }
    }, 30);
  };

  return (
    <div className="flex-1 h-full p-4 overflow-y-auto space-y-4 flex flex-col bg-slate-950 text-slate-100">
      {/* 顶栏控制 */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-cyan-400" />
            3D 正交切片盒与肺气肿三维低衰减体素云 (3D MPR & LAA-950)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            支持 3D 轴位、冠状位、矢状位实时正交滑移，小叶中心型肺气肿 (LAA-950) 空间体素云密度解算
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleTriggerReconstruction}
            disabled={isReconstructing}
            className={`px-4 py-2 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-lg transition ${
              isReconstructing
                ? 'bg-cyan-900/50 text-cyan-300 border border-cyan-700/60 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-950/50'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${isReconstructing ? 'animate-spin' : ''}`} />
            <span>{isReconstructing ? '3D 网格汇聚重建中...' : '启动 4 步几何重建动效'}</span>
          </button>

          <button
            onClick={onOpenCTModal}
            className="px-3.5 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>DICOM 序列管理</span>
          </button>
        </div>
      </div>

      {/* 主 3D 视口与右侧医学参数列 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-[560px]">
        {/* 左侧 3D 正交切片空间盒视口 */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col gap-3 relative overflow-hidden shadow-2xl">
          {/* 3D 视口顶栏角标 */}
          <div className="flex items-center justify-between text-xs px-2 text-slate-300 z-10">
            <div className="flex items-center gap-2 font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-bold text-slate-200">3D MPR ORTHOGONAL VIEWER</span>
              <span className="text-[10px] text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                120 kVp / 250 mA · 0.625mm 层厚
              </span>
            </div>

            {/* 切片可见性开关 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAxial(!showAxial)}
                className={`px-2 py-1 rounded text-[11px] font-mono font-semibold transition ${
                  showAxial ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' : 'bg-slate-950 text-slate-500 border border-slate-800'
                }`}
              >
                ● 轴位 Axial
              </button>
              <button
                onClick={() => setShowCoronal(!showCoronal)}
                className={`px-2 py-1 rounded text-[11px] font-mono font-semibold transition ${
                  showCoronal ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'bg-slate-950 text-slate-500 border border-slate-800'
                }`}
              >
                ● 冠状 Coronal
              </button>
              <button
                onClick={() => setShowSagittal(!showSagittal)}
                className={`px-2 py-1 rounded text-[11px] font-mono font-semibold transition ${
                  showSagittal ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50' : 'bg-slate-950 text-slate-500 border border-slate-800'
                }`}
              >
                ● 矢状 Sagittal
              </button>
              <button
                onClick={() => setShowPointCloud(!showPointCloud)}
                className={`px-2 py-1 rounded text-[11px] font-mono font-semibold transition ${
                  showPointCloud ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' : 'bg-slate-950 text-slate-500 border border-slate-800'
                }`}
              >
                ● LAA 点云
              </button>
            </div>
          </div>

          {/* Three.js Canvas 3D 渲染器 */}
          <div className="flex-1 w-full rounded-xl bg-slate-950/95 border border-slate-800 relative overflow-hidden min-h-[380px]">
            <Canvas
              camera={{ position: [5.2, 4.0, 5.8], fov: 45 }}
              gl={{ antialias: true, alpha: true }}
            >
              <ambientLight intensity={1.2} />
              <pointLight position={[10, 10, 10]} intensity={1.5} />
              <pointLight position={[-10, -10, -10]} intensity={0.5} />

              <MPRSliceBox
                axialPos={axialPos}
                coronalPos={coronalPos}
                sagittalPos={sagittalPos}
                showAxial={showAxial}
                showCoronal={showCoronal}
                showSagittal={showSagittal}
                isReconstructing={isReconstructing}
                reconstructProgress={reconstructProgress}
              />

              {showPointCloud && (
                <EmphysemaPointCloud
                  isReconstructing={isReconstructing}
                  reconstructProgress={reconstructProgress}
                />
              )}

              <OrbitControls
                enableDamping
                dampingFactor={0.06}
                rotateSpeed={0.8}
                zoomSpeed={1.0}
                panSpeed={0.8}
                minDistance={3.5}
                maxDistance={14.0}
              />
            </Canvas>

            {/* 3D 视口内悬浮 HUD 信息 */}
            <div className="absolute top-3 left-3 pointer-events-none text-[10px] font-mono text-cyan-300/80 bg-slate-950/70 p-2 rounded-lg border border-cyan-900/40 space-y-0.5">
              <div>VOXEL: 0.68 × 0.68 × 0.625 mm³</div>
              <div>MATRIX: 512 × 512 × 128</div>
              <div>LAA-950 HU: -1024 ~ -950</div>
              <div>WINDOW: W:1500 / L:-600 (LUNG)</div>
            </div>

            {/* 鼠标旋转交互提示 */}
            <div className="absolute bottom-3 right-3 pointer-events-none text-[10px] text-slate-400 bg-slate-950/80 px-2 py-1 rounded border border-slate-800">
              左键旋转 · 滚轮缩放 · 右键平移
            </div>
          </div>

          {/* 切片动态滑动控制栏 (3D 空间切面交互联动) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-950/90 border border-slate-800">
            {/* 轴位 Axial 滑块 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  轴位 (Z高度):
                </span>
                <span className="text-slate-300">{((axialPos + 2.5) * 25.6).toFixed(0)} / 128 层</span>
              </div>
              <input
                type="range"
                min="-2.4"
                max="2.4"
                step="0.05"
                value={axialPos}
                onChange={(e) => setAxialPos(parseFloat(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* 冠状位 Coronal 滑块 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-cyan-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  冠状位 (前后):
                </span>
                <span className="text-slate-300">{((coronalPos + 2.0) * 32).toFixed(0)} / 128 层</span>
              </div>
              <input
                type="range"
                min="-1.9"
                max="1.9"
                step="0.05"
                value={coronalPos}
                onChange={(e) => setCoronalPos(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* 矢状位 Sagittal 滑块 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-purple-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  矢状位 (左右):
                </span>
                <span className="text-slate-300">{((sagittalPos + 2.2) * 29).toFixed(0)} / 128 层</span>
              </div>
              <input
                type="range"
                min="-2.1"
                max="2.1"
                step="0.05"
                value={sagittalPos}
                onChange={(e) => setSagittalPos(parseFloat(e.target.value))}
                className="w-full accent-purple-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* 右侧：4 步 AI 分割状态与 CT 定量肺气肿报告 */}
        <div className="space-y-4 flex flex-col">
          {/* NVIDIA MONAI 4 步多尺度分割管线 */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
            <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                NVIDIA MONAI 影像自动化分割引擎
              </span>
              <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                MONAI + DenseVNet
              </span>
            </div>

            <div className="space-y-2">
              {[
                { step: 1, title: '1. 气道树中心线抽取', desc: 'B1-B10细支气管管腔拓扑' },
                { step: 2, title: '2. 肺叶解剖裂间隙分割', desc: '右三叶左二叶裂隙识别' },
                { step: 3, title: '3. 肺气肿密度聚类 (LAA)', desc: '密度 <-950HU 体素点云化' },
                { step: 4, title: '4. 3D 多边形网格重建', desc: '输出 368k 顶点高阶实体模型' }
              ].map((s) => (
                <div
                  key={s.step}
                  className={`p-2.5 rounded-xl border transition ${
                    currentStep >= s.step
                      ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className={`w-3.5 h-3.5 ${currentStep >= s.step ? 'text-cyan-400' : 'text-slate-600'}`} />
                      {s.title}
                    </span>
                    <span className="text-[10px] font-mono">
                      {currentStep >= s.step ? '100%' : 'WAIT'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 pl-5">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* LAA-950 定量病灶容积比 */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3 flex-1">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-amber-400" />
              小叶中心型肺气肿 (LAA-950) 定量测算
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">总肺容积低衰减比率:</span>
                <span className="text-amber-300 font-bold font-mono text-base">32.4%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-purple-500 h-full w-[32.4%]" />
              </div>
              <div className="text-[11px] text-slate-400 leading-relaxed">
                ● 右上叶 (RUL) 受累最重达 <b>41.2%</b>，呈弥漫性小叶中心破坏。
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 font-mono">
                <span className="text-slate-400">平均肺衰减密度 (MLD)</span>
                <span className="text-slate-200">-892 HU</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 font-mono">
                <span className="text-slate-400">15%百分位密度 (Perc15)</span>
                <span className="text-rose-400 font-bold">-964 HU (重度)</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 font-mono">
                <span className="text-slate-400">气道壁厚度 Pi10</span>
                <span className="text-amber-300">1.82 mm</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-slate-300 space-y-1">
              <div className="font-semibold text-cyan-300 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                临床阅片辅助指导
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                右上叶前段 (RB3) 重塑狭窄与周围低密度斑块密集重合，建议切换至 <b>支气管镜腔内探查</b> 进行管腔内镜检查。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

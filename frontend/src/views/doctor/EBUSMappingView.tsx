import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  Network,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ScanLine,
  Target,
  Share2,
  Zap,
  Info,
  Layers,
  Sparkles,
  Tag
} from 'lucide-react';
import { PatientMeta } from '../../types';

interface EBUSMappingViewProps {
  patient: PatientMeta;
  onEbusClick?: (station: string) => void;
  onOpenKnowledgeGraph?: (nodeId?: string) => void;
  isModalOpen?: boolean;
}

// 淋巴结数据结构与真实空间解剖三维坐标
interface LymphNodeData {
  station: string;
  name: string;
  pos: [number, number, number];
  sizeMm: number;
  status: 'NORMAL' | 'TARGET' | 'SWOLLEN';
  vessel: string;
  ebus: boolean;
  desc: string;
  probePos: [number, number, number];
  probeAngle: number;
}

const LYMPH_NODES: LymphNodeData[] = [
  {
    station: '1R',
    name: '1R 站 (右上纵隔)',
    pos: [0.8, 3.8, 0.4],
    sizeMm: 5.2,
    status: 'NORMAL',
    vessel: '右头臂静脉深面',
    ebus: false,
    desc: '锁骨上窝下方，常规 EBUS 盲区',
    probePos: [0.4, 3.8, 0.1],
    probeAngle: 0.2
  },
  {
    station: '2R',
    name: '2R 站 (右上气管旁)',
    pos: [0.7, 2.9, 0.3],
    sizeMm: 6.8,
    status: 'NORMAL',
    vessel: '上腔静脉 (SVC) 后壁',
    ebus: true,
    desc: '气管右侧缘，头臂干动脉分叉下',
    probePos: [0.38, 2.9, 0.05],
    probeAngle: 0.3
  },
  {
    station: '2L',
    name: '2L 站 (左上气管旁)',
    pos: [-0.75, 2.8, -0.2],
    sizeMm: 5.4,
    status: 'NORMAL',
    vessel: '左锁骨下动脉起始段',
    ebus: true,
    desc: '气管左侧缘，靠近胸腺及左侧颈总动脉',
    probePos: [-0.38, 2.8, -0.05],
    probeAngle: -0.3
  },
  {
    station: '4R',
    name: '4R 站 (右下气管旁)',
    pos: [0.85, 1.8, 0.35],
    sizeMm: 9.2,
    status: 'TARGET',
    vessel: '奇静脉弓 (Azygos) 下缘',
    ebus: true,
    desc: '右肺上叶主要引流站，穿刺首选靶点站',
    probePos: [0.42, 1.8, 0.1],
    probeAngle: 0.45
  },
  {
    station: '4L',
    name: '4L 站 (左下气管旁)',
    pos: [-0.95, 1.7, 0.15],
    sizeMm: 7.1,
    status: 'NORMAL',
    vessel: '主动脉弓下缘、动脉导管韧带',
    ebus: true,
    desc: '左肺动脉主干上方，需避开主动脉弓',
    probePos: [-0.42, 1.7, 0.05],
    probeAngle: -0.45
  },
  {
    station: '7',
    name: '7 站 (隆突下高危累及)',
    pos: [0.0, 0.8, -0.3],
    sizeMm: 14.8,
    status: 'SWOLLEN',
    vessel: '右肺动脉后壁、食管前壁',
    ebus: true,
    desc: '双侧主支气管隆突马鞍区，短径超标，提示慢性炎症水肿',
    probePos: [0.0, 1.25, 0.0],
    probeAngle: 0.0
  },
  {
    station: '10R',
    name: '10R 站 (右肺门)',
    pos: [1.6, 0.9, 0.4],
    sizeMm: 8.0,
    status: 'NORMAL',
    vessel: '右上肺静脉外上方',
    ebus: true,
    desc: '右主支气管移行至右叶间处',
    probePos: [1.2, 0.9, 0.2],
    probeAngle: 0.6
  },
  {
    station: '10L',
    name: '10L 站 (左肺门)',
    pos: [-1.7, 0.8, -0.1],
    sizeMm: 7.6,
    status: 'NORMAL',
    vessel: '左肺动脉主干转折外侧',
    ebus: true,
    desc: '左主支气管外侧，纵隔胸膜反折处',
    probePos: [-1.3, 0.8, -0.05],
    probeAngle: -0.6
  },
  {
    station: '11R',
    name: '11R 站 (右叶间)',
    pos: [2.1, 0.1, 0.5],
    sizeMm: 6.2,
    status: 'NORMAL',
    vessel: '右肺叶间动脉裂支',
    ebus: true,
    desc: '右上叶与中间支气管夹角',
    probePos: [1.7, 0.1, 0.3],
    probeAngle: 0.7
  },
  {
    station: '11L',
    name: '11L 站 (左叶间)',
    pos: [-2.2, 0.0, 0.2],
    sizeMm: 5.9,
    status: 'NORMAL',
    vessel: '舌段动脉干下方',
    ebus: true,
    desc: '左上叶与左下叶支气管分叉间隙',
    probePos: [-1.8, 0.0, 0.1],
    probeAngle: -0.7
  },
  {
    station: '12R',
    name: '12R 站 (右叶支气管)',
    pos: [2.4, -0.7, 0.2],
    sizeMm: 4.8,
    status: 'NORMAL',
    vessel: '右下叶基底干动脉旁',
    ebus: false,
    desc: '段支气管远端',
    probePos: [2.0, -0.7, 0.1],
    probeAngle: 0.8
  },
  {
    station: '12L',
    name: '12L 站 (左叶支气管)',
    pos: [-2.5, -0.8, -0.1],
    sizeMm: 4.6,
    status: 'NORMAL',
    vessel: '左下叶基底干动脉旁',
    ebus: false,
    desc: '段支气管远端',
    probePos: [-2.1, -0.8, -0.05],
    probeAngle: -0.8
  }
];

// ==========================================
// 1. 3D 大血管解剖管道 (主动脉弓、上腔静脉、肺动脉)
// ==========================================
function GreatVessels() {
  // 1. 主动脉弓 (Aorta Arch) - 粗壮鲜红弯管，从右前跨向左后
  const aortaCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.5, 0.8, 1.2),   // 升主动脉起始
      new THREE.Vector3(0.3, 2.3, 1.0),   // 升主动脉
      new THREE.Vector3(-0.2, 3.0, 0.6),  // 主动脉弓顶
      new THREE.Vector3(-0.8, 2.7, -0.2), // 跨过左主支气管上方
      new THREE.Vector3(-1.0, 1.2, -0.7), // 降主动脉
      new THREE.Vector3(-1.0, -1.5, -0.8) // 延续至胸降主动脉
    ]);
  }, []);

  // 2. 上腔静脉 (Superior Vena Cava, SVC) - 坚直深蓝粗管，走行于气管右侧
  const svcCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.1, 3.8, 0.5),   // 右头臂静脉汇合处
      new THREE.Vector3(1.0, 2.4, 0.6),   // 气管右前外侧
      new THREE.Vector3(0.9, 1.0, 0.7),   // 入右心房前
      new THREE.Vector3(0.8, 0.2, 0.9)
    ]);
  }, []);

  // 3. 肺动脉主干与左右肺动脉 (Pulmonary Artery, PA) - 暗紫色
  const paTrunkCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.1, 0.4, 1.3),   // 肺动脉瓣口
      new THREE.Vector3(0.0, 1.3, 0.8),   // 主干上升
      new THREE.Vector3(-0.1, 1.5, 0.2)   // 隆突下方分叉部
    ]);
  }, []);

  const paRightBranch = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.1, 1.5, 0.2),  // 分叉点
      new THREE.Vector3(0.6, 1.3, -0.1),  // 横跨隆突下方、升主动脉后方
      new THREE.Vector3(1.6, 0.8, 0.2)    // 入右肺门
    ]);
  }, []);

  const paLeftBranch = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.1, 1.5, 0.2),
      new THREE.Vector3(-0.8, 1.4, 0.0),  // 拱跨左主支气管前方
      new THREE.Vector3(-1.7, 0.7, -0.2)  // 入左肺门
    ]);
  }, []);

  // 4. 奇静脉弓 (Azygos Arch) - 弯曲跨过右主支气管注入 SVC
  const azygosCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.9, 1.0, -0.6),
      new THREE.Vector3(1.1, 1.8, -0.2),
      new THREE.Vector3(1.0, 2.0, 0.5)
    ]);
  }, []);

  return (
    <group>
      {/* 主动脉 (Aorta) */}
      <mesh>
        <tubeGeometry args={[aortaCurve, 64, 0.46, 24, false]} />
        <meshPhysicalMaterial
          color="#ef4444"
          emissive="#b91c1c"
          emissiveIntensity={0.25}
          roughness={0.28}
          metalness={0.1}
          clearcoat={0.6}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* 上腔静脉 (SVC) */}
      <mesh>
        <tubeGeometry args={[svcCurve, 32, 0.38, 20, false]} />
        <meshPhysicalMaterial
          color="#2563eb"
          emissive="#1d4ed8"
          emissiveIntensity={0.2}
          roughness={0.3}
          metalness={0.1}
          clearcoat={0.5}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* 肺动脉主干与左右支 (Pulmonary Artery) */}
      <mesh>
        <tubeGeometry args={[paTrunkCurve, 24, 0.42, 20, false]} />
        <meshPhysicalMaterial
          color="#7c3aed"
          emissive="#6d28d9"
          emissiveIntensity={0.25}
          roughness={0.3}
          clearcoat={0.5}
          transparent
          opacity={0.88}
        />
      </mesh>
      <mesh>
        <tubeGeometry args={[paRightBranch, 24, 0.32, 16, false]} />
        <meshPhysicalMaterial
          color="#7c3aed"
          emissive="#6d28d9"
          emissiveIntensity={0.2}
          roughness={0.3}
          clearcoat={0.5}
          transparent
          opacity={0.88}
        />
      </mesh>
      <mesh>
        <tubeGeometry args={[paLeftBranch, 24, 0.30, 16, false]} />
        <meshPhysicalMaterial
          color="#7c3aed"
          emissive="#6d28d9"
          emissiveIntensity={0.2}
          roughness={0.3}
          clearcoat={0.5}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* 奇静脉弓 (Azygos) */}
      <mesh>
        <tubeGeometry args={[azygosCurve, 16, 0.16, 12, false]} />
        <meshPhysicalMaterial
          color="#3b82f6"
          emissive="#1d4ed8"
          emissiveIntensity={0.2}
          roughness={0.35}
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  );
}

// ==========================================
// 2. 半透明解剖气管树
// ==========================================
function AirwayFramework() {
  const tracheaCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 4.3, 0),
      new THREE.Vector3(0, 2.5, 0),
      new THREE.Vector3(0, 1.25, 0) // 隆突 Carina
    ]);
  }, []);

  const rmbCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.25, 0),
      new THREE.Vector3(0.9, 0.7, 0.2),
      new THREE.Vector3(1.6, -0.3, 0.3)
    ]);
  }, []);

  const lmbCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.25, 0),
      new THREE.Vector3(-1.0, 0.6, -0.1),
      new THREE.Vector3(-1.8, -0.2, 0.1)
    ]);
  }, []);

  return (
    <group>
      {/* 气管 */}
      <mesh>
        <tubeGeometry args={[tracheaCurve, 32, 0.36, 24, false]} />
        <meshPhysicalMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={0.2}
          roughness={0.2}
          metalness={0.1}
          clearcoat={0.6}
          transmission={0.4}
          transparent
          opacity={0.55}
          wireframe={false}
        />
      </mesh>

      {/* 右主支气管 */}
      <mesh>
        <tubeGeometry args={[rmbCurve, 24, 0.28, 20, false]} />
        <meshPhysicalMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={0.2}
          roughness={0.2}
          transmission={0.4}
          transparent
          opacity={0.55}
        />
      </mesh>

      {/* 左主支气管 */}
      <mesh>
        <tubeGeometry args={[lmbCurve, 24, 0.26, 20, false]} />
        <meshPhysicalMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={0.2}
          roughness={0.2}
          transmission={0.4}
          transparent
          opacity={0.55}
        />
      </mesh>
    </group>
  );
}

// ==========================================
// 3. 3D 超声扇形探针与声束网格 (Ultrasound Frustum)
// ==========================================
interface UltrasoundFrustumProps {
  targetNode: LymphNodeData;
}

function UltrasoundFrustum({ targetNode }: UltrasoundFrustumProps) {
  const frustumGroup = useRef<THREE.Group>(null);
  const rippleRef = useRef<THREE.Mesh>(null);

  // 计算探头贴附气道管壁并指向淋巴结的四元数朝向
  const { probePos, targetPos, lookQuat } = useMemo(() => {
    const pPos = new THREE.Vector3(...targetNode.probePos);
    const tPos = new THREE.Vector3(...targetNode.pos);
    const dir = new THREE.Vector3().subVectors(tPos, pPos).normalize();

    const quat = new THREE.Quaternion();
    const forward = new THREE.Vector3(0, 0, 1);
    quat.setFromUnitVectors(forward, dir);

    return { probePos: pPos, targetPos: tPos, lookQuat: quat };
  }, [targetNode]);

  useFrame(({ clock }) => {
    if (rippleRef.current) {
      const t = clock.getElapsedTime();
      const wave = (t * 2.5) % 1.0;
      rippleRef.current.scale.set(0.2 + wave * 1.6, 0.2 + wave * 1.6, 0.2 + wave * 1.6);
      const mat = rippleRef.current.material as THREE.MeshBasicMaterial;
      if (mat) mat.opacity = 0.8 * (1.0 - wave);
    }
  });

  return (
    <group position={probePos} quaternion={lookQuat} ref={frustumGroup}>
      {/* 1. 电子超声微型探头本体 (小圆柱贴附于管壁) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.35, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* 2. 探头前端声学水囊压头 */}
      <mesh position={[0, 0, 0.18]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshPhysicalMaterial
          color="#06b6d4"
          transmission={0.8}
          transparent
          opacity={0.7}
          roughness={0.1}
        />
      </mesh>

      {/* 3. 3D 半透明绿色超声波扫描扇面 (Ultrasound Frustum Cone/Sector) */}
      <group position={[0, 0, 0.2]}>
        {/* 扇面体积 */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[1.35, 1.8, 24, 1, true, -Math.PI / 4, Math.PI / 2]} />
          <meshBasicMaterial
            color="#10b981"
            transparent
            opacity={0.22}
            side={THREE.DoubleSide}
            wireframe={false}
          />
        </mesh>

        {/* 扇面网格射线 (Scanlines) */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[1.35, 1.8, 12, 4, true, -Math.PI / 4, Math.PI / 2]} />
          <meshBasicMaterial
            color="#34d399"
            transparent
            opacity={0.45}
            wireframe={true}
          />
        </mesh>

        {/* 超声脉冲波纹环 */}
        <mesh ref={rippleRef} position={[0, 0, 0.4]}>
          <ringGeometry args={[0.1, 0.16, 24]} />
          <meshBasicMaterial
            color="#6ee7b7"
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}

// ==========================================
// 4. 淋巴结发光球体簇
// ==========================================
interface LymphNodeSpheresProps {
  selectedStation: string;
  onSelect: (node: LymphNodeData) => void;
  labelMode?: 'SMART' | 'ALL' | 'NONE';
  isModalOpen?: boolean;
}

function LymphNodeSpheres({
  selectedStation,
  onSelect,
  labelMode = 'SMART',
  isModalOpen = false
}: LymphNodeSpheresProps) {
  const [hoveredStation, setHoveredStation] = useState<string | null>(null);

  return (
    <group>
      {LYMPH_NODES.map((ln) => {
        const isSelected = selectedStation === ln.station;
        const isHovered = hoveredStation === ln.station;
        const radius = (ln.sizeMm / 10.0) * 0.22; // 尺寸等比缩放

        // 颜色分级: SWOLLEN为亮红、TARGET为亮青黄、NORMAL为半透明浅灰绿
        let color = '#10b981';
        let emissive = '#059669';
        if (ln.status === 'SWOLLEN') {
          color = '#f43f5e';
          emissive = '#e11d48';
        } else if (ln.status === 'TARGET') {
          color = '#06b6d4';
          emissive = '#0891b2';
        }

        // 智能显示标签条件: 弹窗打开时绝对隐藏; SMART模式仅在鼠标悬停时即时提示，禁止常驻卡片阻挡解剖
        const shouldShowLabel = !isModalOpen && (
          labelMode === 'ALL' ||
          (labelMode === 'SMART' && isHovered)
        );

        return (
          <group key={ln.station} position={ln.pos}>
            {/* 淋巴结主实体球 */}
            <mesh
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredStation(ln.station);
              }}
              onPointerOut={() => setHoveredStation(null)}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(ln);
              }}
            >
              <sphereGeometry args={[radius, 24, 24]} />
              <meshPhysicalMaterial
                color={isSelected ? '#38bdf8' : isHovered ? '#34d399' : color}
                emissive={isSelected ? '#0284c7' : isHovered ? '#059669' : emissive}
                emissiveIntensity={isSelected ? 0.9 : isHovered ? 0.7 : 0.45}
                roughness={0.25}
                clearcoat={0.5}
                transparent
                opacity={0.92}
              />
            </mesh>

            {/* 选中或肿大时的脉冲发光外晕 */}
            {(isSelected || ln.status === 'SWOLLEN') && (
              <mesh scale={[1.4, 1.4, 1.4]}>
                <sphereGeometry args={[radius, 16, 16]} />
                <meshBasicMaterial
                  color={isSelected ? '#38bdf8' : '#fb7185'}
                  transparent
                  opacity={isSelected ? 0.45 : 0.3}
                  wireframe
                />
              </mesh>
            )}

            {/* 3D 悬浮站名角标 (受 zIndexRange 控制，弹窗开启时绝对隐蔽) */}
            {shouldShowLabel && (
              <Html distanceFactor={8} position={[0, radius + 0.15, 0]} center zIndexRange={[5, 0]}>
                <div
                  onClick={() => onSelect(ln)}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer whitespace-nowrap transition shadow-md select-none ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 border border-cyan-300 shadow-cyan-500/50 scale-110'
                      : ln.status === 'SWOLLEN'
                      ? 'bg-rose-950/90 text-rose-300 border border-rose-600'
                      : isHovered
                      ? 'bg-emerald-950/90 text-emerald-200 border border-emerald-400 scale-105'
                      : 'bg-slate-900/80 text-slate-300 border border-slate-700'
                  }`}
                >
                  {ln.station} ({ln.sizeMm}mm)
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

// ==========================================
// 5. 模拟黑白 B-Mode 多普勒超声血流波形 Canvas
// ==========================================
function DopplerUltrasoundCanvas({ selectedNode }: { selectedNode: LymphNodeData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const render = () => {
      frame++;
      const w = canvas.width;
      const h = canvas.height;

      // 1. 黑白超声噪点背景 (Speckle Noise)
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, w, h);

      // 2. 扇形超声扫描区域 (B-Mode Sector)
      const cx = w / 2;
      const cy = 20;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, h - 30, Math.PI / 4, (Math.PI * 3) / 4);
      ctx.closePath();
      ctx.clip();

      // 填入超声斑点纹理
      const imgData = ctx.createImageData(w, h);
      const data = imgData.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const dist = Math.hypot(x - cx, y - cy);
          if (dist > 30 && dist < h - 35) {
            const noise = Math.random() * 55;
            data[idx] = noise;     // R
            data[idx + 1] = noise; // G
            data[idx + 2] = noise; // B
            data[idx + 3] = 160;   // A
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);

      // 3. 淋巴结低回声区 (Hypoechoic Lymph Node Oval)
      ctx.beginPath();
      const nodeR = (selectedNode.sizeMm / 15) * 42;
      ctx.ellipse(cx, cy + 90, nodeR * 1.3, nodeR * 0.9, 0.1, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(8, 12, 22, 0.85)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.stroke();

      // 4. 多普勒彩色血流信号 (Color Doppler Flow - 血管截面红蓝色搏动)
      const pulse = 1.0 + Math.sin(frame * 0.08) * 0.25;
      // 动流信号 (红橙)
      ctx.fillStyle = 'rgba(239, 68, 68, 0.75)';
      ctx.beginPath();
      ctx.arc(cx - 35, cy + 85, 14 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // 静脉回流信号 (蓝青)
      ctx.fillStyle = 'rgba(59, 130, 246, 0.75)';
      ctx.beginPath();
      ctx.arc(cx + 35, cy + 95, 12 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // 5. 22G TBNA 穿刺针引导路径虚线
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.8)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 10);
      ctx.lineTo(cx + 10, cy + 115);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore();

      // 6. 拟真超声屏幕角标
      ctx.fillStyle = '#38bdf8';
      ctx.font = '10px monospace';
      ctx.fillText('FREQ: 7.5 MHz', 12, 22);
      ctx.fillText(`TARGET: ${selectedNode.station} (${selectedNode.sizeMm}mm)`, 12, 36);
      ctx.fillText('DOPPLER: ON (0.12 m/s)', 12, 50);

      ctx.fillStyle = '#e2e8f0';
      ctx.fillText('GAIN: 82 dB', w - 85, 22);
      ctx.fillText('DEPTH: 4.0 cm', w - 85, 36);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [selectedNode]);

  return (
    <canvas
      ref={canvasRef}
      width={360}
      height={220}
      className="w-full h-[220px] rounded-xl bg-black border border-slate-800"
    />
  );
}

// ==========================================
// 6. 主 EBUS-TBNA 解剖工作台
// ==========================================
export const EBUSMappingView: React.FC<EBUSMappingViewProps> = ({
  patient,
  onEbusClick,
  onOpenKnowledgeGraph,
  isModalOpen = false
}) => {
  const [selectedStation, setSelectedStation] = useState<string>('7'); // 默认选中 7 站隆突下
  const [labelMode, setLabelMode] = useState<'SMART' | 'ALL' | 'NONE'>('SMART');

  const currentNode = useMemo(() => {
    return LYMPH_NODES.find((n) => n.station === selectedStation) || LYMPH_NODES[5];
  }, [selectedStation]);

  const handleSelect = (node: LymphNodeData) => {
    setSelectedStation(node.station);
    onEbusClick?.(node.station);
  };

  return (
    <div className="flex-1 h-full p-4 overflow-y-auto space-y-4 flex flex-col bg-slate-950 text-slate-100">
      {/* 顶栏控制 */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" />
            IASLC 1R-12L 气道-大血管-纵隔淋巴结三维解剖拓扑与超声引导 (EBUS-TBNA)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            集成主动脉弓、上腔静脉、肺动脉三维毗邻解剖，实时投射 3D 绿色超声扇面与多普勒血流波形
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/80 text-rose-300 border border-rose-700">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            7 站短径 14.8mm (重度炎性增大)
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-800">
            当前探头靶区: {currentNode.station} 站
          </span>
        </div>
      </div>

      {/* 3D 视口与超声多普勒右侧列 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-[580px]">
        {/* 左侧 2 列: 3D 解剖空间拓扑视口 */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 relative shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between text-xs px-2 text-slate-300 z-10">
            <div className="flex items-center gap-3">
              <span className="font-bold text-cyan-300 font-mono flex items-center gap-1.5">
                <Target className="w-4 h-4 text-cyan-400" />
                3D AIRWAY-VESSEL-LYMPH TOPOLOGY
              </span>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> 主动脉 Ao
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> 上腔静脉 SVC
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500" /> 肺动脉 PA
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" /> 气管树
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLabelMode(prev => prev === 'SMART' ? 'ALL' : prev === 'ALL' ? 'NONE' : 'SMART')}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-medium border transition ${
                  labelMode === 'SMART'
                    ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                    : labelMode === 'ALL'
                    ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
                title="切换 3D 淋巴结标签显示模式 (智能精简 / 全部显示 / 仅图标)"
              >
                <Tag className="w-3 h-3" />
                <span>{labelMode === 'SMART' ? '标签: 智能精简' : labelMode === 'ALL' ? '标签: 全部显示' : '标签: 仅图标'}</span>
              </button>

              <span className="text-[11px] text-emerald-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                ULTRASOUND FRUSTUM ACTIVE
              </span>
            </div>
          </div>

          {/* Three.js 3D 拓扑渲染 Canvas */}
          <div className="flex-1 w-full rounded-xl bg-slate-950/95 border border-slate-800 relative overflow-hidden min-h-[380px] isolate z-0">
            <Canvas
              camera={{ position: [2.5, 3.2, 5.2], fov: 48 }}
              gl={{ antialias: true, alpha: true }}
            >
              <ambientLight intensity={1.0} />
              <directionalLight position={[6, 8, 5]} intensity={1.5} />
              <pointLight position={[-6, -4, -4]} intensity={0.6} />

              {/* 大血管三维管道 */}
              <GreatVessels />

              {/* 半透明气管树骨架 */}
              <AirwayFramework />

              {/* 3D 绿色超声扇形探针 */}
              <UltrasoundFrustum targetNode={currentNode} />

              {/* 1R~12L 淋巴结发光球体簇 */}
              <LymphNodeSpheres
                selectedStation={selectedStation}
                onSelect={handleSelect}
                labelMode={labelMode}
                isModalOpen={isModalOpen}
              />

              <OrbitControls
                enableDamping
                dampingFactor={0.06}
                rotateSpeed={0.8}
                zoomSpeed={1.0}
                panSpeed={0.8}
                minDistance={3.0}
                maxDistance={12.0}
              />
            </Canvas>

            {/* 3D 视口内操作指引 */}
            <div className="absolute bottom-3 right-3 pointer-events-none text-[10px] text-slate-400 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
              点击任意 3D 淋巴结球体可切换探针注视 · 左键旋转视口
            </div>
          </div>

          {/* 底部 12 站快速水平切换轴 */}
          <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 overflow-x-auto">
            {LYMPH_NODES.map((ln) => (
              <button
                key={ln.station}
                onClick={() => handleSelect(ln)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1 ${
                  selectedStation === ln.station
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                    : ln.status === 'SWOLLEN'
                    ? 'bg-rose-950/70 border border-rose-600 text-rose-300 hover:bg-rose-900'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-850'
                }`}
              >
                <span>{ln.station}</span>
                <span className="text-[10px] opacity-75">{ln.sizeMm}mm</span>
              </button>
            ))}
          </div>
        </div>

        {/* 右侧：实时多普勒超声成像与穿刺安全分析 */}
        <div className="space-y-4 flex flex-col">
          {/* 黑白多普勒超声实时波形窗口 */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
            <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-300">
                <Activity className="w-4 h-4 text-emerald-400" />
                EBUS 探头实时多普勒超声声像
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                7.5 MHz 凸阵
              </span>
            </div>

            {/* 动态 Canvas 模拟超声图 */}
            <DopplerUltrasoundCanvas selectedNode={currentNode} />

            <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
              <span>穿刺通道: 22G TBNA 针</span>
              <span className="text-emerald-400 font-bold">无血管误伤风险 (Safe Zone)</span>
            </div>
          </div>

          {/* 当前靶站解剖与穿刺评估参数卡 */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3 flex-1">
            <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-cyan-400" />
                {currentNode.name}
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  currentNode.status === 'SWOLLEN'
                    ? 'bg-rose-900 text-rose-200 border border-rose-700'
                    : currentNode.status === 'TARGET'
                    ? 'bg-cyan-900 text-cyan-200 border border-cyan-700'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {currentNode.sizeMm} mm · {currentNode.status}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono">
                <span className="text-slate-400 text-[10px] block">毗邻高危大血管</span>
                <span className="text-slate-200 font-semibold">{currentNode.vessel}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">解剖与超声特征研判</span>
                <p className="text-slate-300 mt-1 leading-relaxed text-[11px]">{currentNode.desc}</p>
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-[11px] text-slate-300 space-y-1">
                <div className="font-semibold text-cyan-300 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  EBUS 探查技术指引
                </div>
                <p className="text-slate-400 leading-relaxed">
                  {currentNode.ebus
                    ? '该站位于气道声窗覆盖范围，贴合管壁加压充水囊即可获得清晰高信噪比超声截面。'
                    : '常规 EBUS 扇形探头难以触及该站，如需取样需转入纵隔镜或经胸壁穿刺。'}
                </p>
              </div>
            </div>

            {onOpenKnowledgeGraph && (
              <button
                onClick={() => onOpenKnowledgeGraph(`lymph_${selectedStation}`)}
                className="w-full py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>查看该淋巴结引流转移图谱</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

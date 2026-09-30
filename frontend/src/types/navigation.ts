import { RoleCode } from './index';

export interface MenuItem {
  id: string;
  name: string;
  shortName: string;
  description: string;
  iconName: string;
  badge?: string;
  badgeColor?: string;
  category?: string;
}

export interface RoleNavigationConfig {
  role: RoleCode;
  roleName: string;
  roleSubtitle: string;
  theme: {
    accentColor: string;
    activeBg: string;
    activeText: string;
    borderActive: string;
    badgeBg: string;
    gradient: string;
  };
  menus: MenuItem[];
  defaultMenuId: string;
}

export const ROLE_NAVIGATION_CONFIGS: Record<RoleCode, RoleNavigationConfig> = {
  pulmonologist: {
    role: 'pulmonologist',
    roleName: '呼吸科临床主治医师',
    roleSubtitle: '三亚市人民医院 (呼吸与危重症医学科)',
    theme: {
      accentColor: '#06b6d4',
      activeBg: 'bg-cyan-950/70',
      activeText: 'text-cyan-300 font-semibold',
      borderActive: 'border-cyan-500',
      badgeBg: 'bg-cyan-950 text-cyan-300 border-cyan-800',
      gradient: 'from-cyan-600 to-blue-700'
    },
    defaultMenuId: '3d_twin_viewer',
    menus: [
      {
        id: '3d_twin_viewer',
        name: '3D肺部孪生阅片',
        shortName: '3D阅片',
        description: '高精半透明肺叶、呼吸运动力学、B1-B10各段高亮',
        iconName: 'View3D',
        badge: '核心',
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
      },
      {
        id: 'ct_reconstruction',
        name: 'CT影像导入与重建',
        shortName: 'CT重建',
        description: '胸部薄层CT切片预览与4步AI多尺度分割体重建',
        iconName: 'ScanLine',
        badge: 'DICOM',
        badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      },
      {
        id: 'bronchial_endoscopy',
        name: '支气管树B1-B10腔内探查',
        shortName: '支气管镜',
        description: '虚拟内窥镜镜下病变（狭窄/水肿/阻抗）联动定位',
        iconName: 'Activity',
        badge: '探查'
      },
      {
        id: 'ebus_tbna',
        name: 'IASLC 1R-12L 淋巴超声分站',
        shortName: 'EBUS分站',
        description: '解析气管与大血管毗邻关系、回声特征与穿刺靶点',
        iconName: 'Network',
        badge: '1R-12L'
      },
      {
        id: 'disease_trajectory',
        name: 'COPD全生命周期病情推演',
        shortName: '病情推演',
        description: '模拟不同吸入剂方案下6-24个月FEV1与阻力改善',
        iconName: 'TrendingUp',
        badge: 'AI预测'
      },
      {
        id: 'clinical_kg',
        name: '临床知识图谱辅助决策',
        shortName: 'CDSS图谱',
        description: '基于GOLD指南阶梯推理推荐LABA+LAMA方案',
        iconName: 'Share2',
        badge: 'CDSS'
      },
      {
        id: 'aecopd_alert',
        name: 'AECOPD急性加重早期预警',
        shortName: '急性预警',
        description: '72小时急性加重概率评估与动态血氧SpO2雷达',
        iconName: 'AlertTriangle',
        badge: '高危',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
      },
      {
        id: 'patient_ehr',
        name: '患者全景电子健康档案',
        shortName: 'EHR全景',
        description: '脱敏病历、40包年吸烟史、肺功能基线与体征',
        iconName: 'FileText'
      }
    ]
  },
  twin_engineer: {
    role: 'twin_engineer',
    roleName: '数字孪生算法工程师',
    roleSubtitle: '三亚学院 (超算与数字孪生重点实验室)',
    theme: {
      accentColor: '#10b981',
      activeBg: 'bg-emerald-950/70',
      activeText: 'text-emerald-300 font-semibold',
      borderActive: 'border-emerald-500',
      badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-800',
      gradient: 'from-emerald-600 to-teal-700'
    },
    defaultMenuId: 'mesh_topology',
    menus: [
      {
        id: 'mesh_topology',
        name: '模型网格拓扑与LOD调度',
        shortName: '网格LOD',
        description: '线框模式、面片数监控（LOD0/1/2动态多尺度调度）',
        iconName: 'Boxes',
        badge: '368k面',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      },
      {
        id: 'pybullet_biomechanics',
        name: 'PyBullet呼吸生物力学仿真',
        shortName: '力学仿真',
        description: '气道顺应性Crs、阻力Raw、杨氏模量仿真微调',
        iconName: 'Sliders',
        badge: 'PyBullet'
      },
      {
        id: 'cfd_airway',
        name: '气道流体动力学(CFD)解算',
        shortName: 'CFD流体',
        description: '3D气流速度场、雷诺数、湍流切应力与压降热力图',
        iconName: 'Wind',
        badge: 'NS方程'
      },
      {
        id: 'dual_hpc',
        name: '双超算集群算力监控',
        shortName: '双超算',
        description: '人民医院节点与三亚学院超算专线吞吐及GPU负载',
        iconName: 'Cpu',
        badge: '4.2ms',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      },
      {
        id: 'privacy_gateway',
        name: '脱敏数据管道与隐私屏障',
        shortName: '隐私屏障',
        description: '原始DICOM物理不出院、特征脱敏流与防泄露网关',
        iconName: 'ShieldAlert',
        badge: 'HIPAA'
      },
      {
        id: 'voxel_registration',
        name: 'CT体素配准与形变算法',
        shortName: '体素配准',
        description: '患者个体化非刚性解剖形变配准矩阵与DVF调优',
        iconName: 'Cpu',
        badge: 'B-Spline'
      },
      {
        id: 'frames_export',
        name: '时序仿真关键帧导出',
        shortName: '时序导出',
        description: '导出BSON/JSON/VTK吸气呼气切片供临床验证闭环',
        iconName: 'DownloadCloud',
        badge: 'BSON'
      },
      {
        id: 'webgl_profiler',
        name: '系统性能与WebGL Profiler',
        shortName: 'GPU探针',
        description: '60 FPS、DrawCall、显存占用与管线耗时分析',
        iconName: 'Gauge',
        badge: '60 FPS',
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
      }
    ]
  },
  reviewer: {
    role: 'reviewer',
    roleName: '临床诊疗质控员',
    roleSubtitle: '海南省胸部影像诊疗质控中心',
    theme: {
      accentColor: '#3b82f6',
      activeBg: 'bg-blue-950/70',
      activeText: 'text-blue-300 font-semibold',
      borderActive: 'border-blue-500',
      badgeBg: 'bg-blue-950 text-blue-300 border-blue-800',
      gradient: 'from-blue-600 to-indigo-700'
    },
    defaultMenuId: 'double_blind',
    menus: [
      {
        id: 'double_blind',
        name: '双盲诊疗方案复核',
        shortName: '双盲复核',
        description: '对比AI推演方案与医师主观处方的一致率（92.4%）',
        iconName: 'CheckCheck',
        badge: '双盲',
        badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      },
      {
        id: 'gold_compliance',
        name: 'GOLD国际指南合规性审查',
        shortName: '指南审查',
        description: '自动校验用药阶梯是否符合GOLD 2026最新规范',
        iconName: 'Award',
        badge: 'GOLD 2026'
      },
      {
        id: 'xai_traceability',
        name: 'AI辅助决策可解释性追溯',
        shortName: 'XAI追溯',
        description: '展开知识图谱推理路径、证据链与权威文献引用',
        iconName: 'GitBranch',
        badge: 'PubMed'
      },
      {
        id: 'bias_calibration',
        name: '仿真模型预测偏差校准',
        shortName: '偏差校准',
        description: '实际随访FEV1与仿真预测值偏差分析（RMSE 38ml）',
        iconName: 'BarChart2',
        badge: 'R²=0.94'
      },
      {
        id: 'signoff_archive',
        name: '质控复核报告签批归档',
        shortName: '签批归档',
        description: '专家CA数字签名、防篡改印章与正式PDF质控导出',
        iconName: 'FileCheck',
        badge: '数字签名'
      },
      {
        id: 'audit_trail',
        name: '医疗行为全链路留痕日志',
        shortName: '审计留痕',
        description: '区块链级哈希防篡改操作审计流水与校验',
        iconName: 'ShieldCheck',
        badge: 'SHA-256',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      }
    ]
  },
  patient_rep: {
    role: 'patient_rep',
    roleName: '慢病患者及家属',
    roleSubtitle: '三亚市人民医院 (呼吸门诊慢病关爱中心)',
    theme: {
      accentColor: '#14b8a6',
      activeBg: 'bg-teal-950/70',
      activeText: 'text-teal-200 font-bold',
      borderActive: 'border-teal-400',
      badgeBg: 'bg-teal-950 text-teal-300 border-teal-800',
      gradient: 'from-teal-600 to-emerald-600'
    },
    defaultMenuId: 'my_3d_lung',
    menus: [
      {
        id: 'my_3d_lung',
        name: '我的肺健康3D视界',
        shortName: '3D肺视界',
        description: '通俗易懂的3D呼吸动画，正常肺与当前受损肺对比',
        iconName: 'HeartHandshake',
        badge: '动画',
        badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30'
      },
      {
        id: 'smart_warning_7x24',
        name: '7×24h 智能预警与血氧监护',
        shortName: '智能预警',
        description: '三色健康预警卡与天气温湿度防寒保暖提示',
        iconName: 'BellRing',
        badge: '今日黄卡',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      },
      {
        id: 'medication_guide',
        name: '常用吸入剂与用药指南',
        shortName: '用药指南',
        description: '六步图文教导吸入装置规范用法、剩余药量提醒',
        iconName: 'Pill',
        badge: '2/2 剂次'
      },
      {
        id: 'daily_rehab',
        name: '每日肺康复训练与排痰打卡',
        shortName: '康复打卡',
        description: '缩唇呼吸、腹式呼吸动态节拍跟练与积分打卡',
        iconName: 'Sparkles',
        badge: '连续12天',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      },
      {
        id: 'health_kg',
        name: 'COPD趣味健康知识图谱',
        shortName: '趣味图谱',
        description: '气泡式探索“为什么咳嗽”、“戒烟好处”、“营养食疗”',
        iconName: 'HelpCircle',
        badge: '通俗百科'
      },
      {
        id: 'symptom_self_check',
        name: '急性加重(AECOPD)早期自查',
        shortName: '症状自查',
        description: '5道简易问答自测今日病情变化，防患于未然',
        iconName: 'ListChecks',
        badge: '5道题'
      },
      {
        id: 'oxygen_assistant',
        name: '家庭氧疗与呼吸机助手',
        shortName: '氧疗助手',
        description: '氧流量设定指导、面罩佩戴与湿化瓶清洁周期提醒',
        iconName: 'CloudRain',
        badge: '1.5 L/min'
      },
      {
        id: 'sos_teleclinic',
        name: '一键呼叫医生 / 紧急SOS',
        shortName: '紧急呼叫',
        description: '直通三亚市人民医院呼吸科王主任随访绿色通道',
        iconName: 'PhoneCall',
        badge: '急救SOS',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
      }
    ]
  }
};

import { AnatomyNode, AnatomyEdge, PatientMeta, UserProfile, CTScanMeta, KnowledgeGraphData } from '../types';

export const INITIAL_USER: UserProfile = {
  id: 2,
  username: "dr_wang",
  real_name: "王建平",
  role_code: "pulmonologist",
  role_name: "呼吸科临床主治医师",
  institution: "三亚市人民医院 (呼吸与危重症医学科)",
  title: "主任医师 / 教授 / 博士生导师",
  permissions: ["clinical:ct_import", "clinical:3d_reading", "clinical:ai_prediction", "clinical:knowledge_graph"]
};

export const MOCK_PATIENT: PatientMeta = {
  id: 1,
  patient_uid: "HOSP-ENC-9081244109",
  anon_code: "SYU-COPD-2026-088",
  patient_name: "张*民",
  gender: "男",
  age: 68,
  inpatient_no: "#HN-2026-0928",
  bed_no: "呼吸科 08床",
  smoking_pack_years: 40,
  gold_stage: "GOLD 3级 C组 (重度)",
  fev1_pred: 46.20,
  fvc_liters: 2.65,
  fev1_fvc_ratio: 46.20,
  airway_resistance: 0.485,
  spo2_resting: 91,
  aecopd_risk_prob: 83.5,
  aecopd_risk_level: 'HIGH',
  primary_lesion_segment: "RB3 (右上叶前段重构狭窄)",
  hospital_cluster_id: "HOSP-SANYA-CLUSTER-01",
  university_task_id: "SYU-HPC-JOB-99214",
  comorbidities: [
    "高血压2级 (很高危)",
    "慢性肺源性心脏病 (代偿期)",
    "慢性呼吸衰竭 I 型 (低氧血症)"
  ],
  laa_pct: 32.4, // 肺气肿容积比
  ct_scan_date: "2026-09-25 10:24",
  ct_series_id: "CT-THORAX-HRCT-0082",
  current_meds: [
    "布地奈德福莫特罗吸入粉雾剂 (ICS/LABA 160/4.5μg bid)",
    "噻托溴铵粉雾剂 (LAMA 18μg qd)",
    "乙酰半胱氨酸泡腾片 (0.6g bid)"
  ]
};

export const MOCK_CT_SCANS: CTScanMeta[] = [
  {
    series_id: "CT-THORAX-HRCT-0082",
    patient_uid: "HOSP-ENC-9081244109",
    modality: "HRCT",
    slice_count: 128,
    thickness_mm: 0.625,
    kvp: 120,
    ma: 250,
    window_width: 1500,
    window_level: -600,
    laa_pct: 32.4,
    stenosis_segment: "RB3",
    stenosis_ratio: 65,
    scan_time: "2026-09-25 10:24:18"
  },
  {
    series_id: "CT-THORAX-PRESET-B",
    patient_uid: "PRESET-CASE-02",
    modality: "HRCT",
    slice_count: 144,
    thickness_mm: 0.5,
    kvp: 120,
    ma: 280,
    window_width: 1400,
    window_level: -650,
    laa_pct: 41.8,
    stenosis_segment: "LB3",
    stenosis_ratio: 52,
    scan_time: "2026-09-20 14:10:05"
  }
];

export const MOCK_KNOWLEDGE_GRAPH: KnowledgeGraphData = {
  nodes: [
    {
      id: "copd_core",
      name: "慢性阻塞性肺疾病 (COPD)",
      category: "disease",
      level: 1,
      description: "持续存在的气流受限为特征的常见呼吸慢病，伴气道重塑与肺泡结构破坏。",
      badge: "核心疾病"
    },
    {
      id: "aecopd",
      name: "AECOPD 急性加重高危",
      category: "symptom",
      level: 2,
      description: "72小时内发生急性呼吸困难加重、脓性痰量增多概率高达 83.5%，需紧急临床干预。",
      evidence_level: "A",
      guideline: "GOLD 2026 指南: 呼吸困难加重伴脓痰为抗生素与全身激素指征",
      badge: "83.5% 高风险"
    },
    {
      id: "sym_dyspnea",
      name: "活动后喘憋发绀 (mMRC 3级)",
      category: "symptom",
      level: 3,
      description: "平地步行 100 米即需停下喘气，静息血氧 SpO2 降至 91%。"
    },
    {
      id: "anat_rb3",
      name: "右上叶前段 (RB3) 狭窄浸润",
      category: "anatomy",
      level: 2,
      description: "三维重建见管壁重构增厚，管腔截面积减少 65%，气流阻力显著增大。",
      linked_anatomy_id: "RB3",
      badge: "狭窄 65%"
    },
    {
      id: "anat_ln7",
      name: "隆突下 7 站淋巴结肿大",
      category: "anatomy",
      level: 2,
      description: "超声支气管镜 (EBUS) 探及短径 14.8mm，皮髓质分界不清，提示慢性炎性高反应。",
      linked_anatomy_id: "LN_7",
      badge: "短径 14.8mm"
    },
    {
      id: "diag_hrct",
      name: "薄层胸部 HRCT 容积扫描",
      category: "diagnostics",
      level: 2,
      description: "低衰减区 LAA% (-950HU) 达 32.4%，提示弥漫性小叶中心型肺气肿。"
    },
    {
      id: "diag_pft",
      name: "肺功能检查 (FEV1/FVC 46.2%)",
      category: "diagnostics",
      level: 2,
      description: "舒张后 FEV1/FVC < 70%，FEV1%pred 46.2%，确诊为 GOLD 3 级重度。"
    },
    {
      id: "med_dual_dilator",
      name: "双联长效支气管舒张剂 (LABA+LAMA)",
      category: "medication",
      level: 2,
      description: "茚达特罗格隆溴铵吸入剂，松弛气道平滑肌，降低气道内阻力 Raw。",
      evidence_level: "A",
      guideline: "GOLD 推荐: GOLD C/D 组一线基础用药，有效降低急性加重率 24%"
    },
    {
      id: "med_ics",
      name: "吸入糖皮质激素 (ICS)",
      category: "medication",
      level: 3,
      description: "布地奈德吸入悬液，针对外周血嗜酸性粒细胞 EOS > 300/μL 患者。",
      evidence_level: "A",
      guideline: "抑制气道中性粒细胞与嗜酸粒细胞浸润"
    },
    {
      id: "rehab_pursed_lip",
      name: "缩唇腹式呼吸康复训练",
      category: "rehabilitation",
      level: 2,
      description: "延长呼气相维持气道正压，防止小气道过早陷闭，每日 3 次每次 15 分钟。",
      evidence_level: "B",
      guideline: "中华医学会呼吸病学分会社区肺康复专家共识推荐"
    },
    {
      id: "rehab_oxygen",
      name: "长期家庭氧疗 (LTOT 1-2 L/min)",
      category: "rehabilitation",
      level: 2,
      description: "持续低流量吸氧 > 15小时/天，使静息 PaO2 ≥ 60mmHg 或 SpO2 ≥ 90%。",
      evidence_level: "A",
      guideline: "延缓肺心病进展与改善神经认知功能"
    }
  ],
  edges: [
    { source: "copd_core", target: "aecopd", relation: "诱发高危演变" },
    { source: "copd_core", target: "anat_rb3", relation: "解剖病理重构" },
    { source: "copd_core", target: "diag_hrct", relation: "影像学确诊" },
    { source: "copd_core", target: "diag_pft", relation: "肺功能分期" },
    { source: "copd_core", target: "med_dual_dilator", relation: "基石用药推荐" },
    { source: "copd_core", target: "rehab_pursed_lip", relation: "长期康复干预" },
    { source: "aecopd", target: "sym_dyspnea", relation: "直接临床表现" },
    { source: "aecopd", target: "med_ics", relation: "急性期强化抗炎" },
    { source: "aecopd", target: "rehab_oxygen", relation: "纠正低氧血症" },
    { source: "anat_rb3", target: "anat_ln7", relation: "淋巴引流引致" },
    { source: "anat_rb3", target: "med_dual_dilator", relation: "靶向舒张缓解" },
    { source: "diag_pft", target: "rehab_pursed_lip", relation: "运动耐力指导" }
  ]
};

export const ANATOMY_NODES: AnatomyNode[] = [
  // 气管主干与叶段
  { id: "TRACHEA", label: "Bronchus", name_cn: "主气管 (隆突前)", generation: 0, coords: [0.0, 3.2, 0.0] },
  { id: "RMB", label: "Bronchus", name_cn: "右主支气管", generation: 1, coords: [1.2, 1.8, 0.2] },
  { id: "LMB", label: "Bronchus", name_cn: "左主支气管", generation: 1, coords: [-1.4, 1.6, -0.1] },
  
  // 右肺叶及段 (B1-B10)
  { id: "RUB", label: "Bronchus", name_cn: "右上叶支气管", generation: 2, coords: [2.0, 2.4, 0.4], lobe: "RUL" },
  { id: "BI", label: "Bronchus", name_cn: "中间支气管", generation: 2, coords: [1.8, 0.5, 0.1] },
  { id: "RB1", label: "Bronchus", name_cn: "右上叶尖段 (RB1)", generation: 3, coords: [2.5, 3.4, 0.7], lobe: "RUL" },
  { id: "RB2", label: "Bronchus", name_cn: "右上叶后段 (RB2)", generation: 3, coords: [2.9, 2.7, -0.7], lobe: "RUL" },
  { id: "RB3", label: "Bronchus", name_cn: "右上叶前段 (RB3 - 狭窄重构)", generation: 3, coords: [2.8, 2.1, 1.1], lobe: "RUL", is_lesion: true, stenosis_pct: 65 },
  
  { id: "RMLB", label: "Bronchus", name_cn: "右中叶支气管", generation: 3, coords: [2.4, -0.2, 1.0], lobe: "RML" },
  { id: "RB4", label: "Bronchus", name_cn: "右中叶外侧段 (RB4)", generation: 4, coords: [3.3, -0.4, 1.4], lobe: "RML" },
  { id: "RB5", label: "Bronchus", name_cn: "右中叶内侧段 (RB5)", generation: 4, coords: [2.7, -0.7, 1.7], lobe: "RML" },
  
  { id: "RLB", label: "Bronchus", name_cn: "右下叶支气管", generation: 3, coords: [2.0, -0.7, -0.2], lobe: "RLL" },
  { id: "RB6", label: "Bronchus", name_cn: "右下叶背段 (RB6)", generation: 4, coords: [2.5, -0.8, -1.1], lobe: "RLL" },
  { id: "RB7", label: "Bronchus", name_cn: "右下叶内基底段 (RB7)", generation: 4, coords: [1.8, -1.9, 0.3], lobe: "RLL" },
  { id: "RB8", label: "Bronchus", name_cn: "右下叶前基底段 (RB8)", generation: 4, coords: [2.5, -2.3, 0.8], lobe: "RLL" },
  { id: "RB9", label: "Bronchus", name_cn: "右下叶外侧基底段 (RB9)", generation: 4, coords: [3.3, -2.4, -0.3], lobe: "RLL" },
  { id: "RB10", label: "Bronchus", name_cn: "右下叶后基底段 (RB10)", generation: 4, coords: [2.7, -2.7, -1.2], lobe: "RLL" },

  // 左肺叶及段 (B1-B10)
  { id: "LUB", label: "Bronchus", name_cn: "左上叶支气管", generation: 2, coords: [-2.1, 2.1, 0.3], lobe: "LUL" },
  { id: "LB1_2", label: "Bronchus", name_cn: "左上叶尖后段 (LB1+2)", generation: 3, coords: [-2.6, 3.3, -0.3], lobe: "LUL" },
  { id: "LB3", label: "Bronchus", name_cn: "左上叶前段 (LB3)", generation: 3, coords: [-2.8, 2.2, 1.0], lobe: "LUL" },
  { id: "LINGULAR", label: "Bronchus", name_cn: "舌叶干支气管", generation: 3, coords: [-2.7, 1.0, 0.8], lobe: "LUL" },
  { id: "LB4", label: "Bronchus", name_cn: "舌叶上段 (LB4)", generation: 4, coords: [-3.3, 0.5, 1.3], lobe: "LUL" },
  { id: "LB5", label: "Bronchus", name_cn: "舌叶下段 (LB5)", generation: 4, coords: [-3.1, -0.1, 1.4], lobe: "LUL" },

  { id: "LLB", label: "Bronchus", name_cn: "左下叶支气管", generation: 2, coords: [-1.9, 0.3, -0.2], lobe: "LLL" },
  { id: "LB6", label: "Bronchus", name_cn: "左下叶背段 (LB6)", generation: 3, coords: [-2.5, 0.1, -1.2], lobe: "LLL" },
  { id: "LB7_8", label: "Bronchus", name_cn: "左下叶前内基底段 (LB7+8)", generation: 3, coords: [-2.4, -1.7, 0.7], lobe: "LLL" },
  { id: "LB9", label: "Bronchus", name_cn: "左下叶外侧基底段 (LB9)", generation: 3, coords: [-3.2, -2.1, -0.2], lobe: "LLL" },
  { id: "LB10", label: "Bronchus", name_cn: "左下叶后基底段 (LB10)", generation: 3, coords: [-2.6, -2.5, -1.1], lobe: "LLL" },

  // 1R-12L IASLC 淋巴结分站 (超声EBUS特征)
  { id: "LN_1R", label: "LymphNode", station: "1R", name_cn: "1R 站 (右上纵隔)", coords: [1.0, 4.4, 0.2], ebus: false, vessel: "右头臂静脉" },
  { id: "LN_2R", label: "LymphNode", station: "2R", name_cn: "2R 站 (右上气管旁)", coords: [1.2, 3.5, 0.3], ebus: true, vessel: "上腔静脉 (SVC)", ebus_desc: "气管前壁右侧，呈规则椭圆形低回声" },
  { id: "LN_2L", label: "LymphNode", station: "2L", name_cn: "2L 站 (左上气管旁)", coords: [-1.1, 3.4, 0.1], ebus: true, vessel: "左锁骨下动脉起始段", ebus_desc: "气管左侧壁深面" },
  { id: "LN_4R", label: "LymphNode", station: "4R", name_cn: "4R 站 (右下气管旁 - 穿刺金标准)", coords: [1.3, 2.3, 0.2], ebus: true, vessel: "奇静脉弓 (Azygos Arch)", ebus_desc: "以奇静脉弓为下界标志，血流信号丰富，EBUS穿刺首选站" },
  { id: "LN_4L", label: "LymphNode", station: "4L", name_cn: "4L 站 (左下气管旁)", coords: [-1.4, 2.2, 0.0], ebus: true, vessel: "主动脉弓下缘、左主肺动脉", ebus_desc: "AP窗下方夹角" },
  { id: "LN_7", label: "LymphNode", station: "7", name_cn: "7 站 (隆突下 - 炎性高危水肿)", coords: [0.0, 1.1, -0.3], ebus: true, vessel: "右肺动脉后壁、食管前壁", ebus_desc: "双侧主支气管隆突马鞍区，短径14.8mm反应性增大，COPD高危累及", status: "SWOLLEN" },
  { id: "LN_10R", label: "LymphNode", station: "10R", name_cn: "10R 站 (右肺门)", coords: [2.0, 1.3, 0.1], ebus: true, vessel: "右上肺静脉", ebus_desc: "中间支气管嵴外侧壁" },
  { id: "LN_10L", label: "LymphNode", station: "10L", name_cn: "10L 站 (左肺门)", coords: [-2.0, 1.2, -0.2], ebus: true, vessel: "左肺动脉主干", ebus_desc: "左主支气管转折外侧" },
  { id: "LN_11R", label: "LymphNode", station: "11R", name_cn: "11R 站 (右叶间 11s/11i)", coords: [2.4, 0.2, 0.5], ebus: true, vessel: "肺叶间动脉裂支", ebus_desc: "中下叶分叉嵴部" },
  { id: "LN_11L", label: "LymphNode", station: "11L", name_cn: "11L 站 (左叶间)", coords: [-2.5, 0.7, 0.2], ebus: true, vessel: "舌段动脉干", ebus_desc: "上叶与下叶切迹" },
  { id: "LN_12R", label: "LymphNode", station: "12R", name_cn: "12R 站 (右叶支气管)", coords: [2.8, -0.5, 0.3], ebus: false, vessel: "右下叶基底干动脉" },
  { id: "LN_12L", label: "LymphNode", station: "12L", name_cn: "12L 站 (左叶支气管)", coords: [-2.7, -0.8, 0.1], ebus: false, vessel: "左下叶基底干动脉" }
];

export const ANATOMY_EDGES: AnatomyEdge[] = [
  { source: "TRACHEA", target: "RMB", type: "BRANCHES_TO" },
  { source: "TRACHEA", target: "LMB", type: "BRANCHES_TO" },
  { source: "RMB", target: "RUB", type: "BRANCHES_TO" },
  { source: "RMB", target: "BI", type: "BRANCHES_TO" },
  { source: "RUB", target: "RB1", type: "BRANCHES_TO" },
  { source: "RUB", target: "RB2", type: "BRANCHES_TO" },
  { source: "RUB", target: "RB3", type: "BRANCHES_TO" },
  { source: "BI", target: "RMLB", type: "BRANCHES_TO" },
  { source: "BI", target: "RLB", type: "BRANCHES_TO" },
  { source: "RMLB", target: "RB4", type: "BRANCHES_TO" },
  { source: "RMLB", target: "RB5", type: "BRANCHES_TO" },
  { source: "RLB", target: "RB6", type: "BRANCHES_TO" },
  { source: "RLB", target: "RB7", type: "BRANCHES_TO" },
  { source: "RLB", target: "RB8", type: "BRANCHES_TO" },
  { source: "RLB", target: "RB9", type: "BRANCHES_TO" },
  { source: "RLB", target: "RB10", type: "BRANCHES_TO" },
  
  { source: "LMB", target: "LUB", type: "BRANCHES_TO" },
  { source: "LMB", target: "LLB", type: "BRANCHES_TO" },
  { source: "LUB", target: "LB1_2", type: "BRANCHES_TO" },
  { source: "LUB", target: "LB3", type: "BRANCHES_TO" },
  { source: "LUB", target: "LINGULAR", type: "BRANCHES_TO" },
  { source: "LINGULAR", target: "LB4", type: "BRANCHES_TO" },
  { source: "LINGULAR", target: "LB5", type: "BRANCHES_TO" },
  { source: "LLB", target: "LB6", type: "BRANCHES_TO" },
  { source: "LLB", target: "LB7_8", type: "BRANCHES_TO" },
  { source: "LLB", target: "LB9", type: "BRANCHES_TO" },
  { source: "LLB", target: "LB10", type: "BRANCHES_TO" }
];

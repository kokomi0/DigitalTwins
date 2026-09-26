// ==============================================================================
// 人体数字孪生（肺部）系统 - MongoDB 6.0 仿真时序帧与脱敏数据初始化脚本
// 包含：4D动态形变时序帧、DICOM脱敏特征、大模型临床AI解读评估报告
// ==============================================================================

const dbName = 'lung_twin_nosql';
const conn = new Mongo();
const db = conn.getDB(dbName);

// 清理旧集合
db.simulation_frames.drop();
db.dicom_features.drop();
db.ai_evaluations.drop();

// ------------------------------------------------------------------------------
// 1. 集合: dicom_features (脱敏后的三维CT几何特征与体素密度云)
// ------------------------------------------------------------------------------
db.dicom_features.createIndex({ anon_code: 1 }, { unique: true });

db.dicom_features.insertMany([
  {
    anon_code: "SYU-COPD-2026-088",
    patient_anon_id: "ANON-088-SANYA",
    source_scanner: "Siemens Somatom Force (Dual Source CT)",
    slice_thickness_mm: 0.625,
    kvp: 120,
    reconstruction_kernel: "Br59 (High Resolution Lung)",
    voxel_spacing: [0.68, 0.68, 0.625],
    lung_total_volume_ml: 4890.5,
    emphysema_index: {
      laa_pct_minus_950hu: 23.4, // 低衰减区百分比（LAA-950%）
      upper_lobes_pct: 31.2,
      middle_lobe_pct: 12.8,
      lower_lobes_pct: 18.5,
      phenotype: "Centrilobular Emphysema (小叶中央型肺气肿为主)"
    },
    airway_wall_metrics: {
      pi10_mm: 5.62, // 标准假设小气道内周长10mm处壁厚平方根
      wall_area_percentage_rb1: 68.4,
      wall_area_percentage_rb3: 74.2, // RB3显著增厚
      bronchiectasis_score: 1.2
    },
    lymph_nodes_detected: [
      { station: "7", max_diameter_mm: 14.8, min_diameter_mm: 11.2, hu_mean: 42.5, calcification: false },
      { station: "4R", max_diameter_mm: 9.6, min_diameter_mm: 7.1, hu_mean: 38.0, calcification: false },
      { station: "10R", max_diameter_mm: 8.4, min_diameter_mm: 6.2, hu_mean: 35.0, calcification: false }
    ],
    desensitization_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    created_at: new Date("2026-09-25T08:45:00Z")
  }
]);

// ------------------------------------------------------------------------------
// 2. 集合: simulation_frames (时序仿真呼吸周期数据：包含流体力学压降、形变及气流速度)
// ------------------------------------------------------------------------------
db.simulation_frames.createIndex({ task_id: 1, frame_idx: 1 });

const simulationData = [];
const totalFrames = 20; // 模拟一个完整呼吸周期 (吸气相 0-10, 呼气相 11-19)
const taskId = "SYU-HPC-JOB-99214";

for (let i = 0; i < totalFrames; i++) {
  const phase = i < 10 ? "INSPIRATION" : "EXPIRATION";
  const progress = i / totalFrames;
  // 正弦曲线模拟潮气呼吸容积与气道压
  const normalizedTime = Math.sin(progress * 2 * Math.PI);
  const airwayPressureKPa = parseFloat((0.8 + 1.4 * Math.max(0, normalizedTime) - 0.4 * Math.min(0, normalizedTime)).toFixed(3));
  const tidalFlowLPerSec = parseFloat((1.2 * Math.cos(progress * 2 * Math.PI)).toFixed(3));
  const expansionFactor = parseFloat((1.0 + 0.12 * Math.sin(progress * 2 * Math.PI)).toFixed(4));

  simulationData.push({
    task_id: taskId,
    anon_code: "SYU-COPD-2026-088",
    frame_idx: i,
    timestamp_sec: parseFloat((i * 0.2).toFixed(2)),
    phase: phase,
    metrics: {
      trachea_pressure_kpa: airwayPressureKPa,
      airflow_rate_lps: tidalFlowLPerSec,
      expansion_ratio: expansionFactor,
      stenosis_flutter_amp: phase === "EXPIRATION" ? 0.08 : 0.02, // 呼气相陷闭导致气道颤振加剧
      copd_raw_resistance: 0.485
    },
    // 代表性支气管节点流体压强标量场分布 (Trachea -> RMB/LMB -> Lobes -> Segments)
    pressure_field_points: [
      { id: "TRACHEA", p_kpa: airwayPressureKPa, v_mps: 4.8 },
      { id: "RMB", p_kpa: airwayPressureKPa * 0.94, v_mps: 5.6 },
      { id: "LMB", p_kpa: airwayPressureKPa * 0.92, v_mps: 5.2 },
      { id: "RUB", p_kpa: airwayPressureKPa * 0.88, v_mps: 6.1 },
      { id: "RB3", p_kpa: airwayPressureKPa * 0.58, v_mps: 9.4, high_resistance_alert: true }, // RB3压降剧烈
      { id: "LUB", p_kpa: airwayPressureKPa * 0.86, v_mps: 5.8 },
      { id: "RLB", p_kpa: airwayPressureKPa * 0.85, v_mps: 5.5 },
      { id: "LLB", p_kpa: airwayPressureKPa * 0.84, v_mps: 5.4 }
    ]
  });
}

db.simulation_frames.insertMany(simulationData);

// ------------------------------------------------------------------------------
// 3. 集合: ai_evaluations (大模型生成的COPD深度病情解读与辅助诊疗报告JSON)
// ------------------------------------------------------------------------------
db.ai_evaluations.createIndex({ anon_code: 1 });

db.ai_evaluations.insertOne({
  anon_code: "SYU-COPD-2026-088",
  evaluation_id: "AI-EVAL-20260925-001",
  llm_engine: "BioMedLM-Clinical-Pulmo-V3",
  report_title: "慢性阻塞性肺疾病（COPD GOLD 3级）数字孪生流体力学综合评估报告",
  diagnostic_summary: {
    disease_staging: "慢性阻塞性肺疾病急性加重高危组 (GOLD 3, 极重度通气功能障碍前夕)",
    fev1_actual: "1.10 L (占预计值 41.5%)",
    fev1_fvc: "45.2% (呼气气流显著受限且不可逆)",
    raw_resistance: "0.485 kPa·s/L (约为正常上限值的 2.8 倍)"
  },
  cfd_airway_analysis: {
    critical_obstruction_zone: "右肺上叶前段支气管 (RB3)",
    pathological_mechanism: "RB3管壁黏膜增厚达74.2%，呼气相流速峰值达9.4m/s，局部负压形成呼气陷闭动态塌陷与涡流紊流耗散",
    air_trapping_lobes: ["右肺上叶", "左肺上叶前段"]
  },
  lymph_station_interpretation: {
    station_7: "隆突下淋巴结短径14.8mm，伴均匀低回声充血表现，符合重度COPD慢性气道炎症反应性增大，结合无明显坏死液化区，良性反应性淋巴结炎倾向高，建议EBUS-TBNA择期穿刺复核排除隐匿淋巴源性病变。",
    station_4r: "右下气管旁淋巴结短径9.6mm，毗邻奇静脉弓，未见突破包膜征象。"
  },
  clinical_recommendations: [
    {
      type: "DRUG_THERAPY",
      title: "三联吸入药物治疗方案 (ICS/LABA/LAMA)",
      detail: "建议予以布地奈德福莫特罗联合噻托溴铵粉吸入剂，减轻气道黏膜水肿，扩张外周细支气管。"
    },
    {
      type: "NON_INVASIVE_VENTILATION",
      title: "双水平正压通气 (BiPAP) 参数建议",
      detail: "针对呼气相塌陷，建议设置呼气末正压(EPAP) 4-6 cmH2O以对抗内源性PEEPi，吸气压(IPAP) 12-14 cmH2O提升潮气量。"
    },
    {
      type: "PULMONARY_REHABILITATION",
      title: "个体化数字孪生缩唇腹式呼吸康复训练",
      detail: "通过孪生界面模拟吸呼比 1:2.5，降低呼气流速抑制气道颤振与动态塌陷。"
    }
  ],
  physician_signature_status: "PENDING_REVIEW",
  reviewer_assigned: "reviewer_li",
  created_at: new Date("2026-09-25T11:20:45Z")
});

print("MongoDB 6.0 lung_twin_nosql 初始化成功完成！");

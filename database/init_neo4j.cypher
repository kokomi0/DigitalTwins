// ==============================================================================
// 人体数字孪生（肺部）系统 - Neo4j 5.x 临床解剖知识图谱
// 包含：气管树主干与B1-B10各段分叉、1R-12L超声支气管镜下淋巴结分站及邻近血管关系
// ==============================================================================

// 1. 清空旧数据与创建唯一索引
MATCH (n) DETACH DELETE n;

CREATE CONSTRAINT unique_bronchus_code IF NOT EXISTS
FOR (b:Bronchus) REQUIRE b.code IS UNIQUE;

CREATE CONSTRAINT unique_lymph_code IF NOT EXISTS
FOR (ln:LymphNode) REQUIRE ln.station_code IS UNIQUE;

CREATE CONSTRAINT unique_lobe_code IF NOT EXISTS
FOR (l:Lobe) REQUIRE l.lobe_id IS UNIQUE;

// ------------------------------------------------------------------------------
// 2. 创建肺叶节点 (Lobe: 左二右三)
// ------------------------------------------------------------------------------
CREATE (rul:Lobe {lobe_id: 'RUL', name_cn: '右肺上叶', name_en: 'Right Upper Lobe', volume_ml: 1250, segments: 'B1, B2, B3'})
CREATE (rml:Lobe {lobe_id: 'RML', name_cn: '右肺中叶', name_en: 'Right Middle Lobe', volume_ml: 850, segments: 'B4, B5'})
CREATE (rll:Lobe {lobe_id: 'RLL', name_cn: '右肺下叶', name_en: 'Right Lower Lobe', volume_ml: 1550, segments: 'B6, B7, B8, B9, B10'})
CREATE (lul:Lobe {lobe_id: 'LUL', name_cn: '左肺上叶', name_en: 'Left Upper Lobe', volume_ml: 1450, segments: 'B1+2, B3, B4, B5'})
CREATE (lll:Lobe {lobe_id: 'LLL', name_cn: '左肺下叶', name_en: 'Left Lower Lobe', volume_ml: 1400, segments: 'B6, B7+8, B9, B10'});

// ------------------------------------------------------------------------------
// 3. 创建气管树拓扑 (Trachea -> 主支气管 -> 叶支气管 -> 段支气管 B1-B10)
// ------------------------------------------------------------------------------
// 3.1 主气管与左右主支气管
CREATE (trachea:Bronchus {
    code: 'TRACHEA',
    name_cn: '主气管 (隆突前)',
    name_en: 'Trachea',
    generation: 0,
    diameter_mm: 19.5,
    length_mm: 105.0,
    cartilage_rings: 18,
    angle_deg: 0.0,
    coords: [0.0, 3.5, 0.0]
})

CREATE (rmb:Bronchus {
    code: 'RMB',
    name_cn: '右主支气管',
    name_en: 'Right Main Bronchus',
    generation: 1,
    diameter_mm: 15.2,
    length_mm: 22.0,
    angle_deg: 25.0,
    clinical_note: '管径粗、短且较陡直，异物或吸入性病变易落入',
    coords: [1.2, 1.8, 0.2]
})

CREATE (lmb:Bronchus {
    code: 'LMB',
    name_cn: '左主支气管',
    name_en: 'Left Main Bronchus',
    generation: 1,
    diameter_mm: 13.0,
    length_mm: 48.0,
    angle_deg: 45.0,
    clinical_note: '细长且走向较为水平，受主动脉弓跨越压迫',
    coords: [-1.4, 1.6, -0.1]
})

CREATE (trachea)-[:BRANCHES_TO {bifurcation_angle: 70.0, carina_status: '锐利形'}]->(rmb)
CREATE (trachea)-[:BRANCHES_TO {bifurcation_angle: 70.0, carina_status: '锐利形'}]->(lmb);

// 3.2 右肺支气管系统
CREATE (rub:Bronchus {code: 'RUB', name_cn: '右上叶支气管', name_en: 'Right Upper Lobe Bronchus', generation: 2, diameter_mm: 10.5, length_mm: 12.0, coords: [2.2, 2.5, 0.5]})
CREATE (bi:Bronchus {code: 'BI', name_cn: '中间支气管', name_en: 'Bronchus Intermedius', generation: 2, diameter_mm: 11.2, length_mm: 25.0, coords: [1.8, 0.5, 0.1]})
CREATE (rmb)-[:BRANCHES_TO]->(rub)
CREATE (rmb)-[:BRANCHES_TO]->(bi)
CREATE (rub)-[:BELONGS_TO]->(rul);

// 右上叶段支气管 B1-B3
CREATE (rb1:Bronchus {code: 'RB1', name_cn: '右上叶尖段支气管', name_en: 'Apical Segment (B1)', generation: 3, diameter_mm: 5.5, coords: [2.5, 3.6, 0.8]})
CREATE (rb2:Bronchus {code: 'RB2', name_cn: '右上叶后段支气管', name_en: 'Posterior Segment (B2)', generation: 3, diameter_mm: 5.2, coords: [2.9, 2.8, -0.8]})
CREATE (rb3:Bronchus {code: 'RB3', name_cn: '右上叶前段支气管', name_en: 'Anterior Segment (B3)', generation: 3, diameter_mm: 5.4, coords: [2.8, 2.2, 1.2], clinical_status: 'COPD黏液受阻狭窄'})
CREATE (rub)-[:BRANCHES_TO]->(rb1)
CREATE (rub)-[:BRANCHES_TO]->(rb2)
CREATE (rub)-[:BRANCHES_TO]->(rb3)
CREATE (rb1)-[:BELONGS_TO]->(rul)
CREATE (rb2)-[:BELONGS_TO]->(rul)
CREATE (rb3)-[:BELONGS_TO]->(rul);

// 右中叶及段支气管 B4-B5
CREATE (rmlb:Bronchus {code: 'RMLB', name_cn: '右中叶支气管', name_en: 'Right Middle Lobe Bronchus', generation: 3, diameter_mm: 7.2, length_mm: 14.0, coords: [2.4, -0.3, 1.1]})
CREATE (rlb:Bronchus {code: 'RLB', name_cn: '右下叶支气管', name_en: 'Right Lower Lobe Bronchus', generation: 3, diameter_mm: 9.8, length_mm: 11.0, coords: [2.0, -0.8, -0.2]})
CREATE (bi)-[:BRANCHES_TO]->(rmlb)
CREATE (bi)-[:BRANCHES_TO]->(rlb)
CREATE (rmlb)-[:BELONGS_TO]->(rml)
CREATE (rlb)-[:BELONGS_TO]->(rll);

CREATE (rb4:Bronchus {code: 'RB4', name_cn: '右中叶外侧段支气管', name_en: 'Lateral Segment (B4)', generation: 4, diameter_mm: 4.8, coords: [3.3, -0.5, 1.5]})
CREATE (rb5:Bronchus {code: 'RB5', name_cn: '右中叶内侧段支气管', name_en: 'Medial Segment (B5)', generation: 4, diameter_mm: 4.5, coords: [2.7, -0.8, 1.8]})
CREATE (rmlb)-[:BRANCHES_TO]->(rb4)
CREATE (rmlb)-[:BRANCHES_TO]->(rb5)
CREATE (rb4)-[:BELONGS_TO]->(rml)
CREATE (rb5)-[:BELONGS_TO]->(rml);

// 右下叶段支气管 B6-B10
CREATE (rb6:Bronchus {code: 'RB6', name_cn: '右下叶背段支气管', name_en: 'Superior Segment (B6)', generation: 4, diameter_mm: 5.6, coords: [2.5, -0.9, -1.2]})
CREATE (rb7:Bronchus {code: 'RB7', name_cn: '右下叶内基底段支气管', name_en: 'Medial Basal Segment (B7)', generation: 4, diameter_mm: 4.2, coords: [1.8, -2.0, 0.4]})
CREATE (rb8:Bronchus {code: 'RB8', name_cn: '右下叶前基底段支气管', name_en: 'Anterior Basal Segment (B8)', generation: 4, diameter_mm: 5.0, coords: [2.6, -2.4, 0.9]})
CREATE (rb9:Bronchus {code: 'RB9', name_cn: '右下叶外侧基底段支气管', name_en: 'Lateral Basal Segment (B9)', generation: 4, diameter_mm: 5.2, coords: [3.4, -2.5, -0.3]})
CREATE (rb10:Bronchus {code: 'RB10', name_cn: '右下叶后基底段支气管', name_en: 'Posterior Basal Segment (B10)', generation: 4, diameter_mm: 5.4, coords: [2.8, -2.8, -1.3]})
CREATE (rlb)-[:BRANCHES_TO]->(rb6)
CREATE (rlb)-[:BRANCHES_TO]->(rb7)
CREATE (rlb)-[:BRANCHES_TO]->(rb8)
CREATE (rlb)-[:BRANCHES_TO]->(rb9)
CREATE (rlb)-[:BRANCHES_TO]->(rb10)
CREATE (rb6)-[:BELONGS_TO]->(rll)
CREATE (rb7)-[:BELONGS_TO]->(rll)
CREATE (rb8)-[:BELONGS_TO]->(rll)
CREATE (rb9)-[:BELONGS_TO]->(rll)
CREATE (rb10)-[:BELONGS_TO]->(rll);

// 3.3 左肺支气管系统
CREATE (lub:Bronchus {code: 'LUB', name_cn: '左上叶支气管', name_en: 'Left Upper Lobe Bronchus', generation: 2, diameter_mm: 9.9, length_mm: 10.0, coords: [-2.2, 2.2, 0.4]})
CREATE (llb:Bronchus {code: 'LLB', name_cn: '左下叶支气管', name_en: 'Left Lower Lobe Bronchus', generation: 2, diameter_mm: 9.6, length_mm: 12.0, coords: [-2.0, 0.4, -0.2]})
CREATE (lmb)-[:BRANCHES_TO]->(lub)
CREATE (lmb)-[:BRANCHES_TO]->(llb)
CREATE (lub)-[:BELONGS_TO]->(lul)
CREATE (llb)-[:BELONGS_TO]->(lll);

// 左上叶段支气管 (B1+2, B3, 舌支B4, B5)
CREATE (lb1_2:Bronchus {code: 'LB1_2', name_cn: '左上叶尖后段支气管', name_en: 'Apicoposterior Segment (B1+2)', generation: 3, diameter_mm: 5.8, coords: [-2.7, 3.5, -0.4]})
CREATE (lb3:Bronchus {code: 'LB3', name_cn: '左上叶前段支气管', name_en: 'Anterior Segment (B3)', generation: 3, diameter_mm: 5.3, coords: [-2.9, 2.3, 1.1]})
CREATE (lingular:Bronchus {code: 'LINGULAR', name_cn: '舌叶支气管干', name_en: 'Lingular Division', generation: 3, diameter_mm: 6.5, coords: [-2.8, 1.1, 0.9]})
CREATE (lub)-[:BRANCHES_TO]->(lb1_2)
CREATE (lub)-[:BRANCHES_TO]->(lb3)
CREATE (lub)-[:BRANCHES_TO]->(lingular)
CREATE (lb1_2)-[:BELONGS_TO]->(lul)
CREATE (lb3)-[:BELONGS_TO]->(lul)
CREATE (lingular)-[:BELONGS_TO]->(lul);

CREATE (lb4:Bronchus {code: 'LB4', name_cn: '舌叶上段支气管', name_en: 'Superior Lingular Segment (B4)', generation: 4, diameter_mm: 4.6, coords: [-3.4, 0.6, 1.4]})
CREATE (lb5:Bronchus {code: 'LB5', name_cn: '舌叶下段支气管', name_en: 'Inferior Lingular Segment (B5)', generation: 4, diameter_mm: 4.4, coords: [-3.2, -0.1, 1.5]})
CREATE (lingular)-[:BRANCHES_TO]->(lb4)
CREATE (lingular)-[:BRANCHES_TO]->(lb5)
CREATE (lb4)-[:BELONGS_TO]->(lul)
CREATE (lb5)-[:BELONGS_TO]->(lul);

// 左下叶段支气管 (B6, B7+8, B9, B10)
CREATE (lb6:Bronchus {code: 'LB6', name_cn: '左下叶背段支气管', name_en: 'Superior Segment (B6)', generation: 3, diameter_mm: 5.5, coords: [-2.6, 0.2, -1.3]})
CREATE (lb7_8:Bronchus {code: 'LB7_8', name_cn: '左下叶前内基底段支气管', name_en: 'Anteromedial Basal Segment (B7+8)', generation: 3, diameter_mm: 5.3, coords: [-2.5, -1.8, 0.8]})
CREATE (lb9:Bronchus {code: 'LB9', name_cn: '左下叶外侧基底段支气管', name_en: 'Lateral Basal Segment (B9)', generation: 3, diameter_mm: 5.1, coords: [-3.3, -2.2, -0.2]})
CREATE (lb10:Bronchus {code: 'LB10', name_cn: '左下叶后基底段支气管', name_en: 'Posterior Basal Segment (B10)', generation: 3, diameter_mm: 5.2, coords: [-2.7, -2.6, -1.2]})
CREATE (llb)-[:BRANCHES_TO]->(lb6)
CREATE (llb)-[:BRANCHES_TO]->(lb7_8)
CREATE (llb)-[:BRANCHES_TO]->(lb9)
CREATE (llb)-[:BRANCHES_TO]->(lb10)
CREATE (lb6)-[:BELONGS_TO]->(lll)
CREATE (lb7_8)-[:BELONGS_TO]->(lll)
CREATE (lb9)-[:BELONGS_TO]->(lll)
CREATE (lb10)-[:BELONGS_TO]->(lll);

// ------------------------------------------------------------------------------
// 4. 创建 1R-12L 超声支气管镜下淋巴结分站 (IASLC Lymph Node Stations)
// 包含EBUS镜下超声影像特征与邻近大血管解剖解构
// ------------------------------------------------------------------------------
CREATE (ln1r:LymphNode {
    station_code: '1R',
    name_cn: '右上纵隔淋巴结',
    name_en: 'Highest Mediastinal (1R)',
    zone: '上纵隔区',
    coords: [1.1, 4.8, 0.3],
    ebus_accessible: false,
    ebus_pattern: '位于头臂静脉交汇处深部，普通EBUS难以直达探查',
    adjacent_vessel: '右头臂静脉、头臂干动脉'
})

CREATE (ln2r:LymphNode {
    station_code: '2R',
    name_cn: '右上气管旁淋巴结',
    name_en: 'Upper Paratracheal (2R)',
    zone: '上纵隔区',
    coords: [1.3, 3.8, 0.4],
    ebus_accessible: true,
    ebus_pattern: '位于气管右前外侧壁，气管软骨环外呈弱回声均匀椭圆形',
    adjacent_vessel: '上腔静脉(SVC)、无名动脉'
})

CREATE (ln2l:LymphNode {
    station_code: '2L',
    name_cn: '左上气管旁淋巴结',
    name_en: 'Upper Paratracheal (2L)',
    zone: '上纵隔区',
    coords: [-1.2, 3.7, 0.1],
    ebus_accessible: true,
    ebus_pattern: '气管左侧壁深面，需避开主动脉弓前上分支',
    adjacent_vessel: '左锁骨下动脉起始部、左颈总动脉'
})

CREATE (ln4r:LymphNode {
    station_code: '4R',
    name_cn: '右下气管旁淋巴结',
    name_en: 'Lower Paratracheal (4R)',
    zone: '下纵隔/气管旁',
    coords: [1.4, 2.5, 0.3],
    ebus_accessible: true,
    ebus_pattern: 'EBUS金标准探查位，以奇静脉弓(Azygos Arch)为解剖下界标记，血流信号丰富',
    adjacent_vessel: '奇静脉弓、升主动脉、上腔静脉'
})

CREATE (ln4l:LymphNode {
    station_code: '4L',
    name_cn: '左下气管旁淋巴结',
    name_en: 'Lower Paratracheal (4L)',
    zone: '下纵隔/气管旁',
    coords: [-1.5, 2.4, 0.0],
    ebus_accessible: true,
    ebus_pattern: '位于主动脉弓下缘与左主肺动脉之间（AP窗下界），穿刺需极高同轴定位技巧',
    adjacent_vessel: '主动脉弓下缘、左肺动脉主干'
})

CREATE (ln7:LymphNode {
    station_code: '7',
    name_cn: '隆突下淋巴结 (临床高危站)',
    name_en: 'Subcarinal (7)',
    zone: '隆突下中央区',
    coords: [0.0, 1.2, -0.4],
    ebus_accessible: true,
    ebus_pattern: '双侧主支气管分叉正下方呈马鞍形，病理性肿大常伴低回声团块与坏死无回声区',
    adjacent_vessel: '右肺动脉后壁、食管前壁、奇静脉',
    clinical_alert: 'COPD并发慢性炎性反应或肿瘤纵隔转移第一站'
})

CREATE (ln10r:LymphNode {
    station_code: '10R',
    name_cn: '右肺门淋巴结',
    name_en: 'Right Hilar (10R)',
    zone: '肺门区',
    coords: [2.1, 1.4, 0.1],
    ebus_accessible: true,
    ebus_pattern: '紧贴中间支气管与右主支气管交汇转折处，伴随肺门静脉分支',
    adjacent_vessel: '右肺上叶后段动脉、右上肺静脉'
})

CREATE (ln10l:LymphNode {
    station_code: '10L',
    name_cn: '左肺门淋巴结',
    name_en: 'Left Hilar (10L)',
    zone: '肺门区',
    coords: [-2.1, 1.3, -0.3],
    ebus_accessible: true,
    ebus_pattern: '左主支气管延伸至左上叶分叉处外侧壁',
    adjacent_vessel: '左肺动脉干转折部'
})

CREATE (ln11r:LymphNode {
    station_code: '11R',
    name_cn: '右叶间淋巴结 (11s/11i)',
    name_en: 'Right Interlobar (11R)',
    zone: '叶间区',
    coords: [2.5, 0.3, 0.6],
    ebus_accessible: true,
    ebus_pattern: '右上叶与中间支气管嵴部之间（11s），或中叶与下叶分叉嵴部（11i）',
    adjacent_vessel: '肺叶间肺动脉主裂分支'
})

CREATE (ln11l:LymphNode {
    station_code: '11L',
    name_cn: '左叶间淋巴结',
    name_en: 'Left Interlobar (11L)',
    zone: '叶间区',
    coords: [-2.6, 0.8, 0.2],
    ebus_accessible: true,
    ebus_pattern: '位于左上叶支气管与左下叶支气管分叉切迹处',
    adjacent_vessel: '舌段动脉分叉处'
})

CREATE (ln12r:LymphNode {
    station_code: '12R',
    name_cn: '右叶支气管淋巴结',
    name_en: 'Right Lobar (12R)',
    zone: '外周叶段区',
    coords: [2.9, -0.6, 0.4],
    ebus_accessible: false,
    ebus_pattern: '邻近右下叶基底段分叉口，通常需外周超声探头(Radial-EBUS)探查',
    adjacent_vessel: '右下叶基底干动脉'
})

CREATE (ln12l:LymphNode {
    station_code: '12L',
    name_cn: '左叶支气管淋巴结',
    name_en: 'Left Lobar (12L)',
    zone: '外周叶段区',
    coords: [-2.8, -0.9, 0.1],
    ebus_accessible: false,
    ebus_pattern: '靠近左下叶各基底支分枝处',
    adjacent_vessel: '左下叶基底动脉分支'
});

// ------------------------------------------------------------------------------
// 5. 建立淋巴结与气道解剖邻近关系 (ADJACENT_TO)
// ------------------------------------------------------------------------------
CREATE (ln2r)-[:ADJACENT_TO {distance_mm: 2.1, angle_view: '气管1-2点钟方向'}]->(trachea)
CREATE (ln2l)-[:ADJACENT_TO {distance_mm: 2.4, angle_view: '气管9-10点钟方向'}]->(trachea)
CREATE (ln4r)-[:ADJACENT_TO {distance_mm: 1.8, angle_view: '奇静脉交角深面'}]->(rmb)
CREATE (ln4l)-[:ADJACENT_TO {distance_mm: 2.9, angle_view: '左主支气管近端上缘'}]->(lmb)
CREATE (ln7)-[:ADJACENT_TO {distance_mm: 0.8, angle_view: '隆突顶点正下方夹角'}]->(trachea)
CREATE (ln7)-[:ADJACENT_TO {distance_mm: 1.2, angle_view: '内侧壁'}]->(rmb)
CREATE (ln7)-[:ADJACENT_TO {distance_mm: 1.4, angle_view: '内侧壁'}]->(lmb)
CREATE (ln10r)-[:ADJACENT_TO {distance_mm: 1.5, angle_view: '中间支气管外侧'}]->(bi)
CREATE (ln10l)-[:ADJACENT_TO {distance_mm: 1.7, angle_view: '左上叶分界外侧'}]->(lub)
CREATE (ln11r)-[:ADJACENT_TO {distance_mm: 1.1, angle_view: '中下叶分叉夹角'}]->(rmlb)
CREATE (ln11l)-[:ADJACENT_TO {distance_mm: 1.3, angle_view: '舌段分歧部'}]->(lingular);

// ------------------------------------------------------------------------------
// 6. 模拟病变区 (LesionZone) - COPD与气道受阻狭窄波及路径
// ------------------------------------------------------------------------------
CREATE (lesion1:LesionZone {
    lesion_id: 'LESION-COPD-B3-01',
    name_cn: '右肺前段(RB3)支气管壁局灶性慢性肥厚伴黏液嵌顿',
    stenosis_ratio: 0.65,
    severity: '重度气流受限',
    airway_resistance_delta: '+0.18 kPa·s/L',
    histology: '杯状细胞增生、基底膜增厚、平滑肌痉挛'
})

CREATE (lesion2:LesionZone {
    lesion_id: 'LESION-LN7-INFLAM',
    name_cn: '7站隆突下淋巴结反应性炎性增生',
    short_axis_mm: 14.8,
    ebus_suv_score: 4.2,
    doppler_flow: '周边血流充盈丰富，门部结构尚存'
})

CREATE (lesion1)-[:OCCLUDES {lumen_reduction_pct: 65.0}]->(rb3)
CREATE (lesion2)-[:INFILTRATES]->(ln7);

// 7. 查询范例（临床推理路径）
// MATCH p = (b:Bronchus {code: 'RB3'})<-[:OCCLUDES]-(lesion:LesionZone)
// RETURN p;

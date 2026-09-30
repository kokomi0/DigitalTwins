import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2,
  Sparkles,
  Network,
  BookOpen,
  Search,
  Pill,
  ShieldAlert,
  Wind,
  Heart,
  CheckCircle2,
  AlertTriangle,
  Play,
  Volume2,
  ChevronRight,
  ExternalLink,
  Layers,
  Award,
  Zap,
  Info,
  Clock,
  ThumbsUp,
  X
} from 'lucide-react';

// =========================================================================
// 知识图谱节点接口与数据
// =========================================================================
interface GraphNode {
  id: string;
  name: string;
  orbit: 'SYMPTOM' | 'TREATMENT' | 'RISK' | 'COMORBIDITY';
  categoryName: string;
  color: string;
  bgLight: string;
  border: string;
  angle: number; // 极坐标角度 (0 ~ 360)
  radius: number; // 极坐标半径
  definition: string;
  mechanism: string;
  drugsOrDetails: string[];
  usageGuidance: string;
  contraindications: string;
  evidenceLevel: 'Level A (强推荐)' | 'Level B (中度推荐)' | 'Level C (专家共识)';
  guidelineRef: string;
}

const GRAPH_NODES: GraphNode[] = [
  // 1. 常用规范治疗 (TREATMENT)
  {
    id: 'laba_lama',
    name: '支气管扩张剂 (LABA/LAMA)',
    orbit: 'TREATMENT',
    categoryName: '核心维持治疗',
    color: '#06b6d4',
    bgLight: 'bg-cyan-950/80',
    border: 'border-cyan-400',
    angle: 30,
    radius: 170,
    definition: '长效β2受体激动剂 (LABA) 与长效抗胆碱能药物 (LAMA) 联合制剂，为 GOLD 2026 优先推荐的一线基础治疗。',
    mechanism: '通过松弛支气管平滑肌并阻断迷走神经节后胆碱能受体，双重扩张大气道与外周小气道，显著减小呼气相气道阻力 (Raw)。',
    drugsOrDetails: [
      '噻托溴铵/福莫特罗吸入粉雾剂 (准纳尔/吸入胶囊)',
      '乌美溴铵/维兰特罗吸入粉雾剂 (易得达)',
      '茚达特罗/格隆溴铵吸入胶囊 (微畅)'
    ],
    usageGuidance: '每日定时吸入 1~2 次。吸药前缓慢深呼气，吸药时快速深长吸气，吸入后屏气 5~10 秒，再缓慢呼气。吸药后必须用清水漱口并吐出。',
    contraindications: '禁用于对阿托品类过敏者；伴闭角型青光眼、严重前列腺增生引起排尿困难者慎用。',
    evidenceLevel: 'Level A (强推荐)',
    guidelineRef: 'GOLD 2026 Report · Global Strategy for Prevention, Diagnosis and Management of COPD'
  },
  {
    id: 'ics_laba',
    name: '吸入糖皮质激素 (ICS+LABA)',
    orbit: 'TREATMENT',
    categoryName: '抗炎维持治疗',
    color: '#3b82f6',
    bgLight: 'bg-blue-950/80',
    border: 'border-blue-400',
    angle: 75,
    radius: 180,
    definition: '吸入性糖皮质激素 (如布地奈德/倍氯米松) 联合 LABA，适用于血嗜酸性粒细胞 EOS ≥300/μL 或频发急性加重表型。',
    mechanism: '抑制嗜酸性粒细胞与中性粒细胞趋化，减轻支气管黏膜充血水肿肉芽增生，改善小气道管壁厚度。',
    drugsOrDetails: [
      '布地奈德福莫特罗粉吸入剂 (都保 160/4.5μg)',
      '沙美特罗替卡松粉吸入剂 (准纳尔 50/250μg)'
    ],
    usageGuidance: '每日早晚各 1 次吸入。使用后需充分深部漱口以预防声音嘶哑及口腔白色念珠菌感染。',
    contraindications: '反复发生重症细菌性肺炎、未受控制的肺结核病灶者不宜长期强化使用。',
    evidenceLevel: 'Level A (强推荐)',
    guidelineRef: '中华医学会呼吸病学分会慢性阻塞性肺疾病诊治指南 (2021年修订版)'
  },
  {
    id: 'ltot_oxygen',
    name: '长期家庭氧疗 (LTOT)',
    orbit: 'TREATMENT',
    categoryName: '生理非药物治疗',
    color: '#10b981',
    bgLight: 'bg-emerald-950/80',
    border: 'border-emerald-400',
    angle: 120,
    radius: 165,
    definition: '对于合并重度静息低氧血症 (PaO2 ≤55mmHg 或 SpO2 ≤88%) 的慢性呼吸衰竭患者的长期家庭氧疗。',
    mechanism: '纠正慢性低氧血症，逆转缺氧性肺血管收缩，降低肺动脉高压，显著延缓肺心病发生并延长生存期。',
    drugsOrDetails: [
      '鼻导管低流量吸氧 (流量 1.5 ~ 2.0 L/min)',
      '家庭分子筛制氧机 (浓度 ≥90%)'
    ],
    usageGuidance: '每日吸氧累计时间应达到 ≥15 小时（包括睡眠期间持续低流量吸氧）。定期清洗湿化瓶以防细菌滋生。',
    contraindications: '严格禁止高浓度高流量吸氧，否则会抑制颈动脉窦化学感受器，引起二氧化碳潴留与肺性脑病。',
    evidenceLevel: 'Level A (强推荐)',
    guidelineRef: 'ATS Clinical Practice Guideline: Long-Term Oxygen Therapy for COPD'
  },
  {
    id: 'pulm_rehab',
    name: '肺康复呼吸操',
    orbit: 'TREATMENT',
    categoryName: '非药物康复',
    color: '#14b8a6',
    bgLight: 'bg-teal-950/80',
    border: 'border-teal-400',
    angle: 165,
    radius: 185,
    definition: '包括缩唇呼吸、腹式呼吸、呼吸肌耐力抗阻训练及四肢有氧耐力训练。',
    mechanism: '通过呼气末形成微正压防止小气道过早陷闭，增强膈肌下移幅度，提高通气储备及 6 分钟步行距离 (6MWD)。',
    drugsOrDetails: ['缩唇呼吸 (吸4秒呼6秒)', '膈肌腹式呼吸操', '阻抗呼吸训练器 (Threshold PEP)'],
    usageGuidance: '每日训练 2~3 组，每组 10~15 分钟，量力而行，避免过度疲劳。',
    contraindications: '急性加重剧烈气喘期、未控制的心律失常或重度心衰活动期应暂缓高强度训练。',
    evidenceLevel: 'Level A (强推荐)',
    guidelineRef: 'ERS/ATS Statement on Pulmonary Rehabilitation'
  },

  // 2. 常见临床症状 (SYMPTOM)
  {
    id: 'sym_cough',
    name: '慢性顽固性咳嗽',
    orbit: 'SYMPTOM',
    categoryName: '呼吸道典型症状',
    color: '#f59e0b',
    bgLight: 'bg-amber-950/80',
    border: 'border-amber-400',
    angle: 210,
    radius: 175,
    definition: '慢阻肺最早出现的症状之一，通常晨间明显，夜间阵咳，伴随季节变换加重。',
    mechanism: '气道黏膜上皮杯状细胞肥大增生、纤毛黏液清除系统受损、感觉神经敏感性增高所致。',
    drugsOrDetails: ['排痰祛痰剂 (乙酰半胱氨酸、氨溴索)', '雾化高渗盐水'],
    usageGuidance: '避免使用中枢强效镇咳药强行压制，应以祛痰、抗阻力舒张气道为主，保持分泌物排出。',
    contraindications: '青光眼、痰液极黏稠且无力咳出者禁用强阿片类镇咳药。',
    evidenceLevel: 'Level B (中度推荐)',
    guidelineRef: 'Chinese Expert Consensus on Diagnosis and Treatment of Cough'
  },
  {
    id: 'sym_dyspnea',
    name: '劳力性气短与气促',
    orbit: 'SYMPTOM',
    categoryName: '核心致残症状',
    color: '#ef4444',
    bgLight: 'bg-rose-950/80',
    border: 'border-rose-400',
    angle: 250,
    radius: 185,
    definition: '慢性阻塞性肺疾病标志性症状，由最初爬楼剧烈运动气促逐渐发展到平地快走、洗漱更衣时气喘。',
    mechanism: '肺泡弹性回缩力减低导致动态肺过度充气 (Dynamic Hyperinflation)，呼气末残气量 (FRC) 显著升高。',
    drugsOrDetails: ['吸入长效双支扩剂', '短效急救吸入剂 (沙丁胺醇 / 异丙托溴铵)', '便携氧气罐'],
    usageGuidance: '日常活动时搭配缩唇呼气节奏（吸一口气走一步，吐一口气走两步）。突发喘憋时使用 SABA 急救。',
    contraindications: '不可自行随意增加短效β2受体激动剂剂量，防心动过速。',
    evidenceLevel: 'Level A (强推荐)',
    guidelineRef: 'GOLD 2026 Guidelines'
  },

  // 3. 关键危险因素 (RISK)
  {
    id: 'risk_smoking',
    name: '烟草烟雾 (40包年)',
    orbit: 'RISK',
    categoryName: '首要危险因素',
    color: '#f97316',
    bgLight: 'bg-orange-950/80',
    border: 'border-orange-400',
    angle: 295,
    radius: 170,
    definition: '香烟烟雾中含有 4000 余种有害气体和化学毒物，吸烟者慢性支气管炎与肺气肿患病率高出数倍。',
    mechanism: '焦油与尼古丁破坏呼吸道纤毛运动，诱导巨噬细胞释放基质金属蛋白酶 (MMP-9/12)，溶解破坏肺泡间隔弹性纤维。',
    drugsOrDetails: ['戒烟药物 (伐尼克兰、盐酸安非他酮)', '尼古丁咀嚼胶代偿', '戒烟门诊心理干预'],
    usageGuidance: '戒烟是唯一能够延缓 FEV1 每年快速下降（由正常 25~30ml/年 减缓至基准）的根基性手段。',
    contraindications: '精神抑郁严重患者使用伐尼克兰需密切观察情绪变化。',
    evidenceLevel: 'Level A (强推荐)',
    guidelineRef: 'WHO Report on the Global Tobacco Epidemic'
  },
  {
    id: 'risk_infection',
    name: '反复呼吸道感染',
    orbit: 'RISK',
    categoryName: '加重诱因',
    color: '#ec4899',
    bgLight: 'bg-pink-950/80',
    border: 'border-pink-400',
    angle: 335,
    radius: 175,
    definition: '流感病毒、鼻病毒、肺炎链球菌及铜绿假单胞菌感染是触发 70% 以上 AECOPD 急性加重的直接原因。',
    mechanism: '感染导致气道黏膜水肿渗出暴增，气道阻力骤增，触发严重通气/血流比例失调 (V/Q mismatch)。',
    drugsOrDetails: ['肺炎球菌多糖疫苗 (PCV13 / PPSV23)', '年度流感裂解疫苗', '带状疱疹疫苗'],
    usageGuidance: '建议所有慢阻肺患者每年秋季接种流感疫苗，每5年接种肺炎疫苗。',
    contraindications: '急性发热感染期禁止接种疫苗。',
    evidenceLevel: 'Level A (强推荐)',
    guidelineRef: 'CDC Advisory Committee on Immunization Practices (ACIP)'
  }
];

// 每日微课堂宣教卡片
interface MicroLesson {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  readTime: string;
  coverEmoji: string;
  tags: string[];
  keyTakeaway: string;
  detailedSteps: Array<{ step: string; desc: string }>;
}

const MICRO_LESSONS: MicroLesson[] = [
  {
    id: 'lesson_inhaler_steps',
    title: '都保与准纳尔吸入装置规范操作六步法',
    subtitle: '70% 患者因吸入手法不当导致药物沉积在咽喉而非深入肺泡！',
    category: '吸入技巧',
    readTime: '3分钟阅读',
    coverEmoji: '💊',
    tags: ['都保', '准纳尔', '吸入技巧', '避坑指南'],
    keyTakeaway: '“一开、二旋、三呼、四吸、五屏、六漱口”，缺一不可！',
    detailedSteps: [
      { step: '1. 开盖立直', desc: '旋转旋开外盖，保持吸入装置竖直向上放置，避免粉末倾倒洒出。' },
      { step: '2. 旋转上药', desc: '准纳尔推至卡嗒声；都保先向一侧旋到底再旋回听见“咔哒”声，完成一次精准计量加载。' },
      { step: '3. 彻底呼气', desc: '将装置拿开，对准空处缓慢把肺内余气呼尽（切勿直接对着吸嘴呼气，防潮气结块）。' },
      { step: '4. 快速深吸', desc: '含紧吸嘴，紧密闭合双唇，以中等至快速的速度用力深长吸气，将微粉充分带入小气道。' },
      { step: '5. 屏气5-10秒', desc: '从口中移开吸入器，紧闭双唇屏气 5~10 秒，让细微药粉充分沉降附着在肺泡与支气管内壁。' },
      { step: '6. 清水漱口', desc: '用清水深部漱口 2~3 次并吐掉（不要咽下），清除滞留咽喉的残留药物，预防声音嘶哑与鹅口疮。' }
    ]
  },
  {
    id: 'lesson_aecopd_warning',
    title: '慢阻肺急性加重 (AECOPD) 早期自查与识别要点',
    subtitle: '平均提前 48 小时捕捉危象征兆，避免因呼吸衰竭紧急插管！',
    category: '急性预警',
    readTime: '4分钟阅读',
    coverEmoji: '⚠️',
    tags: ['急性加重', '早期自查', '救命常识'],
    keyTakeaway: '牢记“基线三连变”：气促突然加重、痰量明显增多、痰液变黄变稠！',
    detailedSteps: [
      { step: '1. 气促加重自检', desc: '平地走路或静坐时感到气不够用，平时吸入急救喷雾后缓解不明显。' },
      { step: '2. 观察痰液性状', desc: '痰液由原来的白黏稀痰转变为脓性黄绿色稠痰，且每日咯痰次数翻倍。' },
      { step: '3. 监测静息血氧', desc: '指夹血氧仪显示静息 SpO2 比平时稳定基线下降超过 3%（例如平时 94%，跌破 91%）。' },
      { step: '4. 伴随全身反应', desc: '出现低热、畏寒、嗜睡、神志淡漠或下肢凹陷性水肿加重。' },
      { step: '5. 应急响应程序', desc: '立即启动医生开具的应急备用口服抗生素及全身激素包，并在 APP 中一键发起专家问诊或呼叫 120。' }
    ]
  },
  {
    id: 'lesson_oxygen_guideline',
    title: '家庭氧疗流量与每日时长科学设定指南',
    subtitle: '氧气不是越多越好！高浓度吸氧可能抑制呼吸中枢导致昏迷！',
    category: '家庭氧疗',
    readTime: '3分钟阅读',
    coverEmoji: '💨',
    tags: ['家庭制氧机', '低流量', '科学吸氧'],
    keyTakeaway: '严格遵从“低流量 (1.5~2L/min)、长时长 (≥15小时/天)”原则！',
    detailedSteps: [
      { step: '1. 氧流量设定', desc: '慢阻肺患者呼吸中枢依赖低氧刺激驱动呼吸，因此必须将流量表严格锁定在 1.5 ~ 2.0 L/min。' },
      { step: '2. 每日吸氧时长', desc: '每天累计吸氧时间应达到 ≥15 小时（包括夜间睡眠连续吸氧），才能逆转缺氧性肺血管痉挛。' },
      { step: '3. 湿化瓶护理', desc: '湿化瓶必须注入冷开水或纯净水至刻度线，严禁用自来水，且每 2~3 天彻底清洗消毒一次。' },
      { step: '4. 鼻导管防压疮', desc: '鼻氧管每 1~2 周更换新管，避免耳廓和鼻翼长期摩擦引起压红溃烂。' },
      { step: '5. 禁烟防火警示', desc: '室内使用制氧机区域 5 米范围内绝对严禁吸烟、明火与易燃溶剂接触。' }
    ]
  },
  {
    id: 'lesson_pursed_lip_breathing',
    title: '缩唇呼吸与腹式呼吸居家操练口诀',
    subtitle: '呼吸科专家倾力推荐的简易非药物肺康复物理疗法。',
    category: '呼吸康复操',
    readTime: '2分钟跟练',
    coverEmoji: '🫁',
    tags: ['缩唇呼吸', '腹式呼吸', '肺功能锻炼'],
    keyTakeaway: '“吸二呼四，鼻吸口呼，缩唇吹笛，腹部起伏”！',
    detailedSteps: [
      { step: '1. 姿势准备', desc: '端坐在舒适椅子上，双肩自然下垂放松，双手轻轻放在腹部肚脐位置。' },
      { step: '2. 经鼻缓慢吸气', desc: '闭上嘴唇，用鼻子深长缓慢吸气，心中默数 1、2，感受双手被隆起的腹部慢慢顶起。' },
      { step: '3. 缩唇成吹笛状', desc: '嘴唇半闭，缩成吹口哨或吹蜡烛的圆形，切勿大张口。' },
      { step: '4. 慢匀细长呼气', desc: '经嘴唇缝隙缓慢匀速呼气，心中默数 1、2、3、4（吸气与呼气时间比严格为 1:2 或 1:3）。' },
      { step: '5. 训练频次', desc: '每天操练 2~3 组，每组 10~15 分钟，走路或气促时随时融入日常步态节奏。' }
    ]
  }
];

export const KnowledgeRehabView: React.FC = () => {
  // 顶部大模块切换: 环形星轨知识图谱 vs 每日康复微课堂
  const [activeTab, setActiveTab] = useState<'GRAPH' | 'LESSONS'>('GRAPH');

  // 图谱搜索与选中节点
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<GraphNode>(GRAPH_NODES[0]);

  // 微课堂选中弹窗阅读
  const [readingLesson, setReadingLesson] = useState<MicroLesson | null>(null);

  // 过滤图谱节点
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return GRAPH_NODES;
    return GRAPH_NODES.filter(
      (n) =>
        n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.drugsOrDetails.some((d) => d.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery]);

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* 顶部二级导航条 */}
      <div className="h-14 px-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-600/30">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
              <span>慢阻肺 (COPD) 临床康复宣教 ✕ 多维知识图谱库</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                GOLD 2026 循证依据
              </span>
            </h2>
          </div>
        </div>

        {/* 切换 Tab */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-950 border border-slate-800">
          <button
            onClick={() => setActiveTab('GRAPH')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition ${
              activeTab === 'GRAPH'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>环形星轨关系知识图谱</span>
          </button>

          <button
            onClick={() => setActiveTab('LESSONS')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition ${
              activeTab === 'LESSONS'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-950/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>每日康复微课堂 (宣教卡片)</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          视图 1: 环形星轨关系知识图谱 (左侧可视化星轨 + 右侧循证卡片)
          ========================================================================= */}
      {activeTab === 'GRAPH' && (
        <div className="flex-1 h-full flex flex-col lg:flex-row overflow-hidden p-4 gap-4 animate-in fade-in duration-200">
          {/* 左侧星轨画布区域 */}
          <div className="flex-1 h-full rounded-3xl bg-slate-900/60 border border-slate-800 relative flex flex-col overflow-hidden shadow-2xl p-4">
            {/* 顶部搜索框 */}
            <div className="relative z-10 w-full max-w-sm mb-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-950/90 border border-slate-700/80 shadow-inner">
                <Search className="w-4 h-4 text-cyan-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索图谱节点 (如: 支气管扩张剂、吸烟、氧疗)..."
                  className="bg-transparent text-xs text-slate-100 placeholder-slate-500 outline-none w-full"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 轨道图例 */}
            <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-3 text-[11px] bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                常用规范治疗
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                典型症状
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                关键风险因素
              </span>
            </div>

            {/* 环形星轨 SVG 可视化区域 */}
            <div className="flex-1 w-full relative flex items-center justify-center overflow-hidden">
              <svg className="w-full h-full min-h-[460px]" viewBox="-320 -240 640 480">
                {/* 环形同心轨道圈 */}
                <circle cx="0" cy="0" r="100" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="0" cy="0" r="175" fill="none" stroke="#1e293b" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="235" fill="none" stroke="#0f172a" strokeWidth="1" strokeDasharray="6 6" />

                {/* 连线与向外流动微粒子效果 */}
                {GRAPH_NODES.map((node) => {
                  const rad = (node.angle * Math.PI) / 180;
                  const x = Math.cos(rad) * node.radius;
                  const y = Math.sin(rad) * node.radius;
                  const isSelected = selectedNode.id === node.id;
                  return (
                    <g key={`edge-${node.id}`}>
                      <line
                        x1="0"
                        y1="0"
                        x2={x}
                        y2={y}
                        stroke={isSelected ? node.color : '#334155'}
                        strokeWidth={isSelected ? '2' : '1'}
                        strokeDasharray={isSelected ? undefined : '2 3'}
                        opacity={isSelected ? 0.9 : 0.4}
                      />
                    </g>
                  );
                })}

                {/* 中心恒星节点: 慢阻肺 (COPD) */}
                <g className="cursor-pointer" onClick={() => setSelectedNode(GRAPH_NODES[0])}>
                  <circle cx="0" cy="0" r="48" fill="#0891b2" opacity="0.2" className="animate-pulse" />
                  <circle cx="0" cy="0" r="40" fill="#0e7490" stroke="#22d3ee" strokeWidth="2.5" />
                  <text
                    x="0"
                    y="-6"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="13"
                    fontWeight="800"
                    className="select-none"
                  >
                    慢阻肺 (COPD)
                  </text>
                  <text
                    x="0"
                    y="14"
                    textAnchor="middle"
                    fill="#67e8f9"
                    fontSize="9"
                    fontWeight="bold"
                    className="select-none"
                  >
                    核心疾病知识实体
                  </text>
                </g>

                {/* 环形分布卫星气泡节点 */}
                {filteredNodes.map((node) => {
                  const rad = (node.angle * Math.PI) / 180;
                  const x = Math.cos(rad) * node.radius;
                  const y = Math.sin(rad) * node.radius;
                  const isSelected = selectedNode.id === node.id;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${x}, ${y})`}
                      className="cursor-pointer transition-transform duration-300 hover:scale-110"
                      onClick={() => setSelectedNode(node)}
                    >
                      {/* 发光外环 */}
                      {isSelected && (
                        <circle
                          r="28"
                          fill="none"
                          stroke={node.color}
                          strokeWidth="2"
                          className="animate-ping"
                          opacity="0.6"
                        />
                      )}

                      <circle
                        r="24"
                        fill={isSelected ? node.color : '#0f172a'}
                        stroke={node.color}
                        strokeWidth={isSelected ? '3' : '1.5'}
                        className="shadow-lg"
                      />

                      {/* 节点图标/首字母缩写 */}
                      <text
                        x="0"
                        y="4"
                        textAnchor="middle"
                        fill={isSelected ? '#020617' : '#f8fafc'}
                        fontSize="10"
                        fontWeight="bold"
                        className="select-none pointer-events-none"
                      >
                        {node.name.length > 5 ? node.name.substring(0, 4) : node.name}
                      </text>

                      {/* 外部文字标签 */}
                      <text
                        x="0"
                        y={y > 0 ? 38 : -30}
                        textAnchor="middle"
                        fill={isSelected ? node.color : '#94a3b8'}
                        fontSize="11"
                        fontWeight={isSelected ? 'bold' : 'normal'}
                        className="select-none"
                      >
                        {node.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* 右侧循证医学用药详情卡片 */}
          <div className="w-full lg:w-96 h-full rounded-3xl bg-slate-900/90 border border-slate-800 p-5 overflow-y-auto space-y-4 shadow-2xl shrink-0">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                {selectedNode.categoryName}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-bold">
                {selectedNode.evidenceLevel}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-100">{selectedNode.name}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{selectedNode.definition}</p>
            </div>

            {/* 药理/生物机理 */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                临床机理与靶向作用
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{selectedNode.mechanism}</p>
            </div>

            {/* 代表药物或临床细分 */}
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-slate-200">临床常见推荐制剂与剂型:</div>
              <div className="space-y-1.5">
                {selectedNode.drugsOrDetails.map((drug, idx) => (
                  <div key={idx} className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>{drug}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 用药指导与吸入技巧 */}
            <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-900/60 space-y-1.5">
              <div className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                规范用法与吸入要点
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{selectedNode.usageGuidance}</p>
            </div>

            {/* 禁忌与高危警戒 */}
            <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-900/60 space-y-1.5">
              <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                不良反应与禁忌症说明
              </div>
              <p className="text-xs text-rose-200 leading-relaxed">{selectedNode.contraindications}</p>
            </div>

            {/* 权威指南出处 */}
            <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800 font-mono">
              出处: {selectedNode.guidelineRef}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          视图 2: 每日康复微课堂 (宣教卡片库 + 深度图文指导弹窗)
          ========================================================================= */}
      {activeTab === 'LESSONS' && (
        <div className="flex-1 h-full overflow-y-auto p-6 animate-in fade-in duration-200 space-y-6">
          <div className="max-w-4xl mx-auto space-y-2">
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              慢阻肺每日康复微课堂 · 专家精选宣教库
            </h3>
            <p className="text-xs text-slate-400">
              专为慢阻肺稳定期患者与照护家属设计的科学康复指导，降低 30 天再入院率与急诊频次。
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            {MICRO_LESSONS.map((lesson) => (
              <div
                key={lesson.id}
                onClick={() => setReadingLesson(lesson)}
                className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 shadow-xl cursor-pointer transition transform hover:-translate-y-1 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{lesson.coverEmoji}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold">
                      {lesson.category}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition">
                      {lesson.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {lesson.subtitle}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-cyan-200">
                    💡 核心口诀: {lesson.keyTakeaway}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-500 font-mono flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {lesson.readTime}
                  </span>
                  <span className="font-bold text-cyan-400 flex items-center gap-1 group-hover:translate-x-1 transition">
                    阅读图文详解
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 沉浸式图文宣教卡片详情弹窗 */}
      <AnimatePresence>
        {readingLesson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl max-h-[90vh] bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden text-slate-100"
            >
              {/* 弹窗顶栏 */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{readingLesson.coverEmoji}</span>
                  <div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {readingLesson.category}
                    </span>
                    <h3 className="text-sm md:text-base font-extrabold text-white mt-0.5">
                      {readingLesson.title}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setReadingLesson(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 弹窗内容 */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="p-3.5 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-xs text-cyan-200 leading-relaxed font-semibold">
                  📌 临床权威指引: {readingLesson.keyTakeaway}
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300">详细操作与执行步骤:</h4>
                  {readingLesson.detailedSteps.map((step, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="text-xs font-bold text-cyan-400">{step.step}</div>
                      <div className="text-xs text-slate-300 leading-relaxed">{step.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 弹窗底栏 */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">已学习打卡 · 三亚市人民医院呼吸科宣教质控认可</span>
                <button
                  onClick={() => setReadingLesson(null)}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md"
                >
                  已掌握完成
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KnowledgeRehabView;

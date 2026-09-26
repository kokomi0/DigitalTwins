# 人体数字孪生（肺部）交互系统
## Pulmonary Digital Twin Interactive System (Clinical & Supercomputing Edition)

---

### 一、 系统简介与核心架构

本系统是严格按照《人体数字孪生（肺部）系统架构设计》及呼吸科临床解剖规范（覆盖主支气管、叶段支气管 **B1-B10** 各段解剖、**IASLC 1R-12L** 超声支气管镜 EBUS 淋巴结分站定位）构建的高精度、自适应数字孪生平台。

系统针对电脑端临床工作站与移动端巡诊场景，实现【PC端 / 手机端响应式自适应】：
- **PC端（≥1024px）**：三栏专业临床工作台（左侧 B1-B10 解剖树与病例库、中间 3D 视口、实时气道压波形与双超算态势、右侧 COPD 指标与 AI 诊疗报告）。
- **手机端（<1024px）**：全屏触控 3D 视口 + 底部可拖拽抽屉面板（Bottom Sheet，基于 Framer Motion）+ 触控手势（单指旋转、双指缩放平移）+ 低功耗 LOD 自动降级。
- **双超算集群脱敏专线**：模拟**三亚市人民医院超算（院内加密私网）**与**三亚学院超算（脱敏仿真与大模型推理集群）**之间的安全栅栏与加密流转。

---

### 二、 完整项目工程目录树

```text
f:/数字孪生项目/
├── backend/                               # 后端服务 (Python 3.10 + Flask + SocketIO + Celery)
│   ├── app.py                             # 主应用入口、WebSocket 10Hz 时序推流与路由装载
│   ├── config.py                          # 混合数据库与双超算集群连接配置
│   ├── requirements.txt                   # Python 核心依赖清单
│   ├── Dockerfile                         # 后端 Docker 镜像构建文件
│   ├── models/                            # 异构数据库数据模型定义
│   │   ├── __init__.py
│   │   ├── mysql_models.py                # MySQL 8.0: 用户表、RBAC权限、防篡改审计日志、病例表
│   │   ├── mongo_models.py                # MongoDB 6.0: 仿真时序帧、DICOM体素、AI诊疗报告
│   │   └── graph_models.py                # Neo4j 5.x: B1-B10 气道拓扑与 1R-12L 淋巴结图谱
│   ├── routes/                            # RESTful API 蓝图控制器
│   │   ├── __init__.py
│   │   ├── auth_routes.py                 # 用户认证与五角色体验切换演示器接口
│   │   ├── clinical_routes.py             # 病例查询、DICOM特征、病变标注与康复推演
│   │   ├── simulation_routes.py           # CFD流体参数微调、时序波形与超算负载监控
│   │   ├── graph_routes.py                # 气道知识图谱、EBUS镜下细节与狭窄波及路径
│   │   └── audit_routes.py                # 医疗合规审计、哈希链验真与脱敏专线态势
│   ├── services/                          # 核心业务与生理仿真解算层
│   │   ├── __init__.py
│   │   ├── desensitization_proxy.py       # 院内敏感数据脱敏模拟器 (Data Desensitization Proxy)
│   │   ├── physiological_simulation.py    # 4D 呼吸动力学、COPD气道阻力(Raw)与颤振仿真
│   │   ├── knowledge_graph_service.py     # 临床解剖知识图谱查询与狭窄推理
│   │   └── audit_service.py               # 区块链式 SHA-256 哈希链记录与防篡改验真
│   └── tasks/
│       ├── __init__.py
│       └── celery_app.py                  # Celery 异步解算任务 (Navier-Stokes CFD仿真)
├── frontend/                              # 前端工程 (React 18 + Vite + TS + Three.js + Tailwind)
│   ├── package.json                       # 前端核心依赖配置
│   ├── vite.config.ts                     # Vite 打包与代理配置 (反向代理 /api 与 /socket.io)
│   ├── tsconfig.json                      # TypeScript 编译选项
│   ├── tsconfig.node.json
│   ├── tailwind.config.js                 # 医疗科技暗黑风格色彩与微发光样式配置
│   ├── postcss.config.js
│   ├── index.html                         # 单页应用 HTML 入口
│   ├── Dockerfile                         # 前端生产环境构建 Dockerfile
│   └── src/
│       ├── main.tsx                       # React 根挂载入口
│       ├── App.tsx                        # 电脑端三栏 / 手机端抽屉双模自适应主视图
│       ├── index.css                      # 全局暗黑拟态样式与平滑滚动条
│       ├── types/                         # TypeScript 接口与类型定义
│       │   └── index.ts
│       ├── hooks/                         # 响应式与时序推流自定义 Hooks
│       │   ├── useResponsive.ts           # 屏幕尺寸、横竖屏、触控能力与推荐LOD识别
│       │   └── useSocketSimulation.ts     # 10Hz WebSocket 生理时序接收与离线平滑正弦保底
│       ├── services/                      # API 与解剖基线数据
│       │   ├── api.ts                     # RESTful API 客户端调用
│       │   └── mockData.ts                # B1-B10 各段坐标基线与 1R-12L 淋巴结标准分站
│       └── components/
│           ├── 3d/
│           │   └── TwinViewer3D.tsx       # Three.js/R3F 支气管树、1R-12L荧光球、呼吸颤振视口
│           ├── clinical/
│           │   ├── AnatomyTree.tsx        # B1-B10 支气管树与 1R-12L 淋巴结分站交互树
│           │   ├── AirwayWaveformChart.tsx# ECharts 气道压 Paw 与流速实时时序双曲线波形
│           │   ├── EBUSModal.tsx          # 1R-12L 超声支气管镜下声像特征与大血管解剖弹窗
│           │   └── ClinicalPanel.tsx      # 多角色自适应临床控制面板路由器
│           ├── common/
│           │   ├── Header.tsx             # 顶部导航、脱敏标识、设备状态与角色切换器
│           │   ├── RoleSwitcher.tsx       # 5类角色一键体验切换下拉组件
│           │   ├── DataFlowPipeline.tsx   # 双超算集群数据流转与脱敏栅栏态势图
│           │   └── ResponsiveDrawer.tsx   # 手机端触摸可拖拽抽屉组件 (Framer Motion)
│           └── roles/                     # 5 类业务角色专属面板
│               ├── EngineerView.tsx       # 孪生工程师：线框网格、LOD控制、参数调优、超算负载
│               ├── PulmonologistView.tsx  # 呼吸科医护：临床面板、病变标注、康复推演、AI报告
│               ├── ReviewerView.tsx       # 诊疗复核员：只读模式、双盲质控标记、专家签名
│               ├── PatientView.tsx        # 患者代表：通俗化大白话3D解读、家庭缩唇呼吸口诀
│               └── LegalAuditView.tsx     # 医患法务：操作轨迹追溯、SHA-256防篡改哈希验真
├── database/                              # 数据库初始化架构脚本
│   ├── init_mysql.sql                     # MySQL 8.0: RBAC权限、防篡改审计日志表与初始病例
│   ├── init_neo4j.cypher                  # Neo4j 5.x: 气管树 B1-B10 拓扑与 1R-12L 淋巴分站图谱
│   └── init_mongo.js                      # MongoDB 6.0: 时序呼吸帧、DICOM体素特征与大模型报告
├── docker-compose.yml                     # 全套微服务 (6大容器) 一键编排
├── nginx.conf                             # Nginx 自适应路由重写、Gzip压缩与WebSocket代理
└── README.md                              # 项目技术架构与访问操作手册
```

---

### 三、 异构混合数据库设计规范

| 数据库引擎 | 核心职责 | 存储实体与集合 | 关键业务逻辑 |
| :--- | :--- | :--- | :--- |
| **MySQL 8.0** | 关系型主库 / RBAC / 审计 | `sys_user`, `sys_role`, `sys_permission`, `sys_role_permission`, `audit_log`, `patient_meta` | 细粒度操作控制、链式 SHA-256 防篡改审计记录，保证医疗合规。 |
| **Neo4j 5.x** | 临床解剖知识图谱 | 节点: `Bronchus`, `LymphNode`, `Lobe`, `LesionZone`<br/>关系: `BRANCHES_TO`, `ADJACENT_TO`, `OCCLUDES` | 支气管分叉拓扑（主气管→左右主支气管→B1-B10），1R-12L淋巴结与大血管毗邻关系，狭窄波及路径推理。 |
| **MongoDB 6.0** | 仿真时序帧与半结构化医疗文档 | `simulation_frames`, `dicom_features`, `ai_evaluations` | 存储 4D 呼吸周期形变压降时序、CT 体素密度云特征（LAA-950%）及 BioMedLM 大模型病情解读报告。 |
| **Redis 7.0** | 高速缓存与异步消息中间件 | Celery 任务队列、WebSocket 推流缓存 | 承载气道流体力学 Navier-Stokes CFD 方程解算任务调度。 |

---

### 四、 五类角色体验演示账号

系统在界面右上角提供**“一键切换角色体验”演示器**，支持在无需重复登出的情况下即时体验 5 类角色的业务功能。若使用传统登录，各角色预置账号密码如下：

> **统一演示密码**：`TwinAdmin2026!`

| 角色中文名称 | 账号标识符 (`username`) | 预置姓名与职称 | 核心权限与交互特性 |
| :--- | :--- | :--- | :--- |
| **数字孪生工程师** | `eng_zhang` | 张工 (超算仿真架构师) | 开启几何多边形网格线框 (Wireframe)、调节 COPD 气道狭窄与阻力系数、LOD 分级切换、监控超算 64 节点算力负载与 FPS。 |
| **呼吸科主任医护** | `dr_wang` | 王主任 (主任医师/教授) | 查阅患者 FEV1/FVC 生理基线、在 3D 气管树标注气道狭窄（如 RB3）、调用超算大模型 AI 诊疗建议、下达肺康复推演。 |
| **诊疗质量复核员** | `reviewer_li` | 李质控 (副主任医师) | 双盲复核只读模式（自动隐匿患者敏感隐私）、诊疗规范合规性勾选、签署会诊质控意见。 |
| **患者/家属代表** | `patient_chen` | 陈先生 (患者家属代表) | 科普化通俗视图、隐匿复杂工程指标，展示“吸管捏扁”形象化比喻及每日“缩唇腹式呼吸”口诀。 |
| **医患合规法务员** | `legal_zhao` | 赵法务 (首席法务官) | 敏感数据脱敏栅栏流控审查、医疗操作留痕时序流、一键执行 **全链 SHA-256 区块链防篡改验真**。 |

---

### 五、 系统访问地址清单

服务启动后，支持以下各端入口访问：

- **自适应访问入口（自动识别电脑端/手机端设备）**：  
  👉 `http://localhost:8080/`（Docker 部署模式）或 `http://localhost:3000/`（本地开发模式）
- **电脑端临床工作台直接入口（≥1024px 三栏布局）**：  
  👉 `http://localhost:8080/desktop` 或 `http://localhost:3000/`
- **手机端触控模式直接入口（全屏触控 + 底部抽屉手势）**：  
  👉 手机与电脑连入同一 Wi-Fi，访问 `http://<局域网IP>:3000/`，或在网页右上角点击【📱 手机扫码】直接扫码打开！
- **后端 RESTful API 基础地址**：  
  👉 `http://localhost:5000/api/`
- **后端 WebSocket 实时推流端点**：  
  👉 `ws://localhost:5000/socket.io/`
- **Neo4j 图数据库浏览器控制台**：  
  👉 `http://localhost:7474/`（用户: `neo4j`，密码: `TwinAdmin2026!`）

> 📖 **详细启动与手机扫码教程详见**：[STARTUP_GUIDE.md](file:///f:/%E6%95%B0%E5%AD%97%E5%AD%AA%E7%94%9F%E9%A1%B9%E7%9B%AE/STARTUP_GUIDE.md)

---

### 六、 部署与快速启动指南

#### 极速启动（Windows 双击即开，推荐）：
直接在根目录双击运行 [`start.bat`](file:///f:/%E6%95%B0%E5%AD%97%E5%AD%AA%E7%94%9F%E9%A1%B9%E7%9B%AE/start.bat)，系统将自动拉起前后端服务，并在主窗口自动检测局域网 IP、直接输出手机扫码的二维码！


#### 方式 1：Docker Compose 一键容器化部署（全栈生产模式）

确保宿主机已安装 Docker 及 Docker Compose，随后在项目根目录下执行：

```bash
# 1. 进入项目根目录
cd f:/数字孪生项目

# 2. 一键构建并启动 6 大微服务容器
docker-compose up -d --build

# 3. 检查各容器健康状态
docker-compose ps
```

容器启动完成后，MySQL、Neo4j、MongoDB 将自动执行 `database/` 下的初始化脚本，并在 `http://localhost:8080` 开放访问。

---

#### 方式 2：本地极速开发与调试运行（无 Docker 依赖）

本系统各层均内置**高可用降级代理（Mock Fallback）**，即便本地未安装 MySQL 或 Neo4j 实体服务，后端与前端亦可即时启动并顺畅运转！

##### 1. 启动后端 (Flask + SocketIO)

```bash
# 1. 打开终端进入后端目录
cd f:/数字孪生项目/backend

# 2. 安装 Python 核心依赖 (推荐 Python 3.10+)
pip install -r requirements.txt

# 3. 启动后端实时服务
python app.py
```
> 控制台将输出：
> `监听地址: http://0.0.0.0:5000`  
> `WebSocket: ws://0.0.0.0:5000/socket.io`

##### 2. 启动前端 (Vite + React)

```bash
# 1. 打开新终端进入前端目录
cd f:/数字孪生项目/frontend

# 2. 安装前端 npm 依赖
npm install

# 3. 启动 Vite 开发热更新服务器
npm run dev
```
> 控制台将输出本地开发地址：`http://localhost:3000/`。在浏览器打开即可开始体验！

---

### 七、 核心操作演示路径

1. **观察 3D 气管树与呼吸运动**：
   - 观察主气管（Trachea）、右肺三叶（B1-B10）、左肺二叶（B1-B10）及半透明肺叶轮廓随呼吸正弦曲线周期性扩张收缩；
   - 观察右肺上叶前段（**RB3**）红色病变区域在呼气相的剧烈气道颤振（Airway Fluttering）；
   - 查看底部 ECharts 实时绘制的 10Hz 连续气道压（$P_{aw}$）与气流速度波形。

2. **超声支气管镜（EBUS）探查体验**：
   - 点击视口内或解剖树中的 **7站（隆突下）** 或 **4R站（右下气管旁）** 荧光球；
   - 触发弹出超声支气管镜下声像学特征弹窗，查看其与奇静脉弓、肺动脉、上腔静脉的毗邻解剖与穿刺指引。

3. **一键切换 5 大角色**：
   - 点击右上角切换至 **数字孪生工程师**：开启 Wireframe 网格模式，拖动滑块调节狭窄率，观察 3D 模型变化与超算节点负载；
   - 切换至 **呼吸科医护**：查看 FEV1 指标与 BioMedLM 大模型报告，点击“解剖段标注”或“启动康复推演”；
   - 切换至 **患者代表**：查看科普化大白话说明与家庭缩唇呼吸口诀；
   - 切换至 **医患法务**：点击“全链哈希验真”，即时验证 SHA-256 区块链防篡改审计链。

4. **双超算流转与脱敏专线演练**：
   - 查看“双超算集群数据流转态势图”；
   - 点击“测试脱敏推送”按钮，模拟医院端原始 DICOM 经由安全脱敏栅栏清洗并实时传输至三亚学院超算中心。
#   D i g i t a l T w i n s  
 
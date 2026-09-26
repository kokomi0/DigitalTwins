-- ==============================================================================
-- 人体数字孪生（肺部）系统 - MySQL 8.0 核心关系型数据库架构
-- 满足：医疗合规审计（HIPAA/等保三级）、RBAC细粒度权限控制、双超算脱敏主索引
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `lung_twin_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `lung_twin_db`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- 1. 角色表 (sys_role)
-- 包含5类预置角色：孪生工程师、呼吸科医护、诊疗复核员、病患代表、医患法务
-- ----------------------------
DROP TABLE IF EXISTS `sys_role`;
CREATE TABLE `sys_role` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '角色主键ID',
  `role_code` VARCHAR(64) NOT NULL UNIQUE COMMENT '角色标识符 (twin_engineer, pulmonologist, reviewer, patient_rep, legal_auditor)',
  `role_name` VARCHAR(128) NOT NULL COMMENT '角色中文名称',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '角色职能描述',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统角色表';

INSERT INTO `sys_role` (`id`, `role_code`, `role_name`, `description`) VALUES
(1, 'twin_engineer', '数字孪生工程师', '具备网格模式切换、CFD流体参数调优、LOD分级控制、超算节点负载监控最高权限'),
(2, 'pulmonologist', '呼吸科主任医护', '具备全功能临床工作台、B1-B10气道病变标注、COPD康复推演、AI报告出具权限'),
(3, 'reviewer', '诊疗质量复核员', '具备双盲复核标记、病因审计只读视图、专家会诊质控意见签署权限'),
(4, 'patient_rep', '患者/家属代表', '具备科普化肺部三维病变说明、康复指导指引、隐藏高门槛临床生化指标'),
(5, 'legal_auditor', '医患合规法务员', '具备数据脱敏栅栏审计、区块链/哈希防篡改审计日志追溯、操作流控监管');

-- ----------------------------
-- 2. 细粒度权限表 (sys_permission)
-- ----------------------------
DROP TABLE IF EXISTS `sys_permission`;
CREATE TABLE `sys_permission` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '权限ID',
  `perm_code` VARCHAR(100) NOT NULL UNIQUE COMMENT '权限唯一编码',
  `perm_name` VARCHAR(128) NOT NULL COMMENT '权限名称',
  `module` VARCHAR(64) NOT NULL COMMENT '所属业务模块',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='细粒度权限定义表';

INSERT INTO `sys_permission` (`id`, `perm_code`, `perm_name`, `module`) VALUES
(1, 'twin:mesh:wireframe', '查看3D几何线框模式', '3D视口'),
(2, 'twin:simulation:tuning', '调整呼吸阻力与流体力学参数', '数字孪生解算'),
(3, 'twin:lod:control', '强制指定LOD分级与渲染功耗', '性能管理'),
(4, 'clinical:lesion:annotate', '气道病变解剖段标注', '临床工作台'),
(5, 'clinical:ai:generate_report', '调用大模型生成AI病情解读', '辅助诊疗'),
(6, 'clinical:rehab:simulate', '下达肺康复推演任务至超算', '临床工作台'),
(7, 'audit:log:view', '查看医疗敏感操作审计轨迹', '合规监管'),
(8, 'audit:hash:verify', '执行SHA-256哈希防篡改链验真', '合规监管'),
(9, 'patient:view:simplified', '访问通俗化3D科普解读模式', '病患门户');

-- ----------------------------
-- 3. 角色-权限关联表 (sys_role_permission)
-- ----------------------------
DROP TABLE IF EXISTS `sys_role_permission`;
CREATE TABLE `sys_role_permission` (
  `role_id` BIGINT UNSIGNED NOT NULL,
  `permission_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`role_id`, `permission_id`),
  CONSTRAINT `fk_rp_role` FOREIGN KEY (`role_id`) REFERENCES `sys_role` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rp_perm` FOREIGN KEY (`permission_id`) REFERENCES `sys_permission` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色权限中间表';

-- 工程师具备技术调试权限
INSERT INTO `sys_role_permission` VALUES (1, 1), (1, 2), (1, 3);
-- 呼吸科医护具备临床工作权限
INSERT INTO `sys_role_permission` VALUES (2, 4), (2, 5), (2, 6);
-- 复核员具备审阅与AI查验
INSERT INTO `sys_role_permission` VALUES (3, 7);
-- 病患代表具备科普简化权限
INSERT INTO `sys_role_permission` VALUES (4, 9);
-- 法务员具备审计与哈希验证权限
INSERT INTO `sys_role_permission` VALUES (5, 7), (5, 8);

-- ----------------------------
-- 4. 用户表 (sys_user)
-- ----------------------------
DROP TABLE IF EXISTS `sys_user`;
CREATE TABLE `sys_user` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` VARCHAR(64) NOT NULL UNIQUE COMMENT '登录账号',
  `password_hash` VARCHAR(255) NOT NULL COMMENT '密码散列(PBKDF2/BCrypt)',
  `real_name` VARCHAR(64) NOT NULL COMMENT '姓名',
  `role_id` BIGINT UNSIGNED NOT NULL COMMENT '关联主角色',
  `institution` VARCHAR(128) NOT NULL COMMENT '所属机构 (如: 三亚市人民医院/三亚学院超算中心)',
  `title` VARCHAR(64) DEFAULT NULL COMMENT '职称/职务',
  `phone` VARCHAR(32) DEFAULT NULL COMMENT '联系电话(脱敏)',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 1-启用, 0-禁用',
  `last_login_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_user_role` FOREIGN KEY (`role_id`) REFERENCES `sys_role` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统用户表';

-- 预置5个测试账号（明文密码均为: TwinAdmin2026!）
-- SHA256散列: 9c08bc69ce5d4090518ab5be0bb0ecbb79eb8ea07f353ee39ce01fa2eb00d831
INSERT INTO `sys_user` (`id`, `username`, `password_hash`, `real_name`, `role_id`, `institution`, `title`, `phone`, `status`) VALUES
(1, 'eng_zhang', '$pbkdf2-sha256$29000$c2FsdHNhbHQ$eI1bT27q5aE86j5bC4dJqL4Y0z5B0uN3L8eX3K6P2xM', '张工 (首席孪生架构师)', 1, '三亚学院超算仿真重点实验室', '超算仿真系统架构师', '188****1001', 1),
(2, 'dr_wang', '$pbkdf2-sha256$29000$c2FsdHNhbHQ$eI1bT27q5aE86j5bC4dJqL4Y0z5B0uN3L8eX3K6P2xM', '王主任 (呼吸与危重症医学科)', 2, '三亚市人民医院', '主任医师/教授', '188****1002', 1),
(3, 'reviewer_li', '$pbkdf2-sha256$29000$c2FsdHNhbHQ$eI1bT27q5aE86j5bC4dJqL4Y0z5B0uN3L8eX3K6P2xM', '李质控 (诊疗质量评议组)', 3, '海南省临床质控中心', '副主任医师', '188****1003', 1),
(4, 'patient_chen', '$pbkdf2-sha256$29000$c2FsdHNhbHQ$eI1bT27q5aE86j5bC4dJqL4Y0z5B0uN3L8eX3K6P2xM', '陈先生 (患者代表-家属)', 4, '患者关爱联盟', '家属家委代表', '188****1004', 1),
(5, 'legal_zhao', '$pbkdf2-sha256$29000$c2FsdHNhbHQ$eI1bT27q5aE86j5bC4dJqL4Y0z5B0uN3L8eX3K6P2xM', '赵法务 (医疗安全与合规审计部)', 5, '三亚市医疗伦理与法务督察委员会', '合规主任法务官', '188****1005', 1);

-- ----------------------------
-- 5. 病例元数据主索引表 (patient_meta)
-- 包含双超算脱敏标识符及临床关键生化指标
-- ----------------------------
DROP TABLE IF EXISTS `patient_meta`;
CREATE TABLE `patient_meta` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `patient_uid` VARCHAR(64) NOT NULL UNIQUE COMMENT '院内加密患者唯一识别码',
  `anon_code` VARCHAR(64) NOT NULL UNIQUE COMMENT '三亚学院超算公开推演脱敏编号 (如: SYU-COPD-2026-088)',
  `gender` VARCHAR(8) NOT NULL COMMENT '性别: 男/女',
  `age` INT NOT NULL COMMENT '年龄',
  `gold_stage` VARCHAR(16) NOT NULL COMMENT 'COPD全球倡议分期: GOLD 1/2/3/4',
  `fev1_pred` DECIMAL(5,2) NOT NULL COMMENT '第一秒用力呼气容积占预计值百分比 (FEV1% pred)',
  `fvc_liters` DECIMAL(5,2) NOT NULL COMMENT '用力肺活量 (FVC, L)',
  `fev1_fvc_ratio` DECIMAL(5,2) NOT NULL COMMENT 'FEV1/FVC 比值 (%)',
  `airway_resistance` DECIMAL(6,3) NOT NULL COMMENT '气道阻力 Raw (kPa·s/L)',
  `smoking_pack_years` INT DEFAULT 0 COMMENT '吸烟年包数',
  `hospital_cluster_id` VARCHAR(64) NOT NULL DEFAULT 'HOSP-SANYA-CLUSTER-01' COMMENT '来源超算节点',
  `university_task_id` VARCHAR(64) DEFAULT 'SYU-HPC-JOB-99214' COMMENT '三亚学院推演作业ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_anon_code` (`anon_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='病例主元数据脱敏索引表';

INSERT INTO `patient_meta` (`id`, `patient_uid`, `anon_code`, `gender`, `age`, `gold_stage`, `fev1_pred`, `fvc_liters`, `fev1_fvc_ratio`, `airway_resistance`, `smoking_pack_years`, `hospital_cluster_id`, `university_task_id`) VALUES
(1, 'HOSP-ENC-9081244109', 'SYU-COPD-2026-088', '男', 68, 'GOLD 3 (重度)', 41.50, 2.65, 45.20, 0.485, 45, 'HOSP-SANYA-CLUSTER-01', 'SYU-HPC-JOB-99214'),
(2, 'HOSP-ENC-9081244110', 'SYU-COPD-2026-089', '女', 62, 'GOLD 2 (中度)', 63.20, 2.90, 58.70, 0.320, 20, 'HOSP-SANYA-CLUSTER-01', 'SYU-HPC-JOB-99215'),
(3, 'HOSP-ENC-9081244111', 'SYU-COPD-2026-090', '男', 74, 'GOLD 4 (极重度)', 28.10, 1.85, 38.40, 0.690, 55, 'HOSP-SANYA-CLUSTER-01', 'SYU-HPC-JOB-99216');

-- ----------------------------
-- 6. 操作与仿真合规审计日志表 (audit_log)
-- 支持链式SHA-256哈希防篡改检验
-- ----------------------------
DROP TABLE IF EXISTS `audit_log`;
CREATE TABLE `audit_log` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '审计主键',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '操作人ID',
  `username` VARCHAR(64) NOT NULL COMMENT '操作人用户名',
  `role_code` VARCHAR(64) NOT NULL COMMENT '当时角色',
  `action` VARCHAR(64) NOT NULL COMMENT '操作动作 (DESENSITIZE, PARAM_TUNE, AI_INFERENCE, EXPORT_REPORT, 3D_INSPECT)',
  `resource_target` VARCHAR(128) NOT NULL COMMENT '资源标识 (如 SYU-COPD-2026-088 / Bronchus-B3)',
  `client_ip` VARCHAR(64) NOT NULL COMMENT '客户端IP',
  `detail_json` JSON NOT NULL COMMENT '操作细节或参数差异',
  `prev_hash` VARCHAR(64) NOT NULL COMMENT '上一条记录的SHA-256哈希（区块链防篡改链）',
  `curr_hash` VARCHAR(64) NOT NULL COMMENT '本条审计记录综合计算之SHA-256防伪哈希',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_action` (`action`),
  INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='医疗合规链式防篡改审计日志表';

-- 预置符合防篡改哈希链的首批审计条目
INSERT INTO `audit_log` (`id`, `user_id`, `username`, `role_code`, `action`, `resource_target`, `client_ip`, `detail_json`, `prev_hash`, `curr_hash`, `created_at`) VALUES
(1, 1, 'eng_zhang', 'twin_engineer', 'INIT_SYSTEM', 'LUNG_TWIN_CLUSTER', '192.168.10.101', '{"status": "BOOTSTRAP_COMPLETE", "mesh_nodes": 8420}', '0000000000000000000000000000000000000000000000000000000000000000', 'a7f3e829dc01994829adbf8293149cbb2819fde8491028374a81928374910a2f', '2026-09-25 08:30:00'),
(2, 2, 'dr_wang', 'pulmonologist', 'DESENSITIZE', 'SYU-COPD-2026-088', '192.168.10.102', '{"anonymized_fields": ["patient_name", "id_card", "ct_dicom_pii"], "target_cluster": "SANYA_UNIV_HPC"}', 'a7f3e829dc01994829adbf8293149cbb2819fde8491028374a81928374910a2f', 'b84c718a47b19de8319fbc749281a941a80d8291fbc83720194819a84719d83a', '2026-09-25 09:15:20'),
(3, 1, 'eng_zhang', 'twin_engineer', 'PARAM_TUNE', 'SYU-COPD-2026-088', '192.168.10.101', '{"airway_stenosis_b3": 0.65, "raw_kpa": 0.485, "flutter_freq": 14.2}', 'b84c718a47b19de8319fbc749281a941a80d8291fbc83720194819a84719d83a', 'c93a8190d71a82b947218ac938102a9bca819283710a9284719a829104819a9d', '2026-09-25 10:02:11'),
(4, 2, 'dr_wang', 'pulmonologist', 'AI_INFERENCE', 'SYU-COPD-2026-088', '192.168.10.102', '{"model": "PulmoLLM-Clinical-V4", "conclusion": "GOLD 3 Severe Emphysema with Subcarinal Lymph Node 7 reactive swelling"}', 'c93a8190d71a82b947218ac938102a9bca819283710a9284719a829104819a9d', 'd02b81928a0194837192ab8471928374a9182938471928374a91829384719283', '2026-09-25 11:20:45');

SET FOREIGN_KEY_CHECKS = 1;

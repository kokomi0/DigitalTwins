from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
import json

db = SQLAlchemy()

# 角色-权限关联表
sys_role_permission = db.Table(
    'sys_role_permission',
    db.Column('role_id', db.BigInteger, db.ForeignKey('sys_role.id'), primary_key=True),
    db.Column('permission_id', db.BigInteger, db.ForeignKey('sys_permission.id'), primary_key=True)
)

class SysRole(db.Model):
    __tablename__ = 'sys_role'
    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    role_code = db.Column(db.String(64), unique=True, nullable=False)
    role_name = db.Column(db.String(128), nullable=False)
    description = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    permissions = db.relationship('SysPermission', secondary=sys_role_permission, backref=db.backref('roles', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.id,
            'role_code': self.role_code,
            'role_name': self.role_name,
            'description': self.description,
            'permissions': [p.perm_code for p in self.permissions]
        }

class SysPermission(db.Model):
    __tablename__ = 'sys_permission'
    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    perm_code = db.Column(db.String(100), unique=True, nullable=False)
    perm_name = db.Column(db.String(128), nullable=False)
    module = db.Column(db.String(64), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'perm_code': self.perm_code,
            'perm_name': self.perm_name,
            'module': self.module
        }

class SysUser(db.Model):
    __tablename__ = 'sys_user'
    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    real_name = db.Column(db.String(64), nullable=False)
    role_id = db.Column(db.BigInteger, db.ForeignKey('sys_role.id'), nullable=False)
    institution = db.Column(db.String(128), nullable=False)
    title = db.Column(db.String(64))
    phone = db.Column(db.String(32))
    status = db.Column(db.SmallInteger, default=1)
    last_login_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    role = db.relationship('SysRole', backref='users')

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'real_name': self.real_name,
            'role_code': self.role.role_code if self.role else None,
            'role_name': self.role.role_name if self.role else None,
            'institution': self.institution,
            'title': self.title,
            'phone': self.phone,
            'permissions': [p.perm_code for p in self.role.permissions] if self.role else []
        }

class PatientMeta(db.Model):
    __tablename__ = 'patient_meta'
    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    patient_uid = db.Column(db.String(64), unique=True, nullable=False)
    anon_code = db.Column(db.String(64), unique=True, nullable=False)
    gender = db.Column(db.String(8), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    gold_stage = db.Column(db.String(16), nullable=False)
    fev1_pred = db.Column(db.Numeric(5, 2), nullable=False)
    fvc_liters = db.Column(db.Numeric(5, 2), nullable=False)
    fev1_fvc_ratio = db.Column(db.Numeric(5, 2), nullable=False)
    airway_resistance = db.Column(db.Numeric(6, 3), nullable=False)
    smoking_pack_years = db.Column(db.Integer, default=0)
    hospital_cluster_id = db.Column(db.String(64), default='HOSP-SANYA-CLUSTER-01')
    university_task_id = db.Column(db.String(64), default='SYU-HPC-JOB-99214')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'patient_uid': self.patient_uid,
            'anon_code': self.anon_code,
            'gender': self.gender,
            'age': self.age,
            'gold_stage': self.gold_stage,
            'fev1_pred': float(self.fev1_pred),
            'fvc_liters': float(self.fvc_liters),
            'fev1_fvc_ratio': float(self.fev1_fvc_ratio),
            'airway_resistance': float(self.airway_resistance),
            'smoking_pack_years': self.smoking_pack_years,
            'hospital_cluster_id': self.hospital_cluster_id,
            'university_task_id': self.university_task_id,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None
        }

class AuditLog(db.Model):
    __tablename__ = 'audit_log'
    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    user_id = db.Column(db.BigInteger, nullable=False)
    username = db.Column(db.String(64), nullable=False)
    role_code = db.Column(db.String(64), nullable=False)
    action = db.Column(db.String(64), nullable=False)
    resource_target = db.Column(db.String(128), nullable=False)
    client_ip = db.Column(db.String(64), nullable=False)
    detail_json = db.Column(db.JSON, nullable=False)
    prev_hash = db.Column(db.String(64), nullable=False)
    curr_hash = db.Column(db.String(64), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.username,
            'role_code': self.role_code,
            'action': self.action,
            'resource_target': self.resource_target,
            'client_ip': self.client_ip,
            'detail': self.detail_json,
            'prev_hash': self.prev_hash,
            'curr_hash': self.curr_hash,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None
        }

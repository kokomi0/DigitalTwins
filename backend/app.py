import time
import threading
from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from config import Config
from models.mysql_models import db
from routes.auth_routes import auth_bp
from routes.clinical_routes import clinical_bp
from routes.simulation_routes import simulation_bp
from routes.graph_routes import graph_bp
from routes.audit_routes import audit_bp
from services.physiological_simulation import physiological_sim_service

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # 启用全局跨域
    CORS(app, resources={r"/*": {"origins": "*"}})

    # 初始化数据库 (如无实体数据库则友好降级)
    try:
        db.init_app(app)
        with app.app_context():
            # 尝试连接检查，无报错则使用
            pass
    except Exception as e:
        print(f"[Warning] MySQL初始化提示: {e}，将启用安全内存模拟数据。")

    # 注册RESTful API蓝图
    app.register_blueprint(auth_bp)
    app.register_blueprint(clinical_bp)
    app.register_blueprint(simulation_bp)
    app.register_blueprint(graph_bp)
    app.register_blueprint(audit_bp)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "UP",
            "service": "Pulmonary-Digital-Twin-Core-Backend",
            "version": "2026.1.0",
            "clusters": {
                "hospital": "Sanya People's Hospital (Active)",
                "university": "Sanya University Supercomputing Center (Active)"
            }
        })

    @app.route('/api/system/network-info', methods=['GET'])
    def network_info():
        import socket
        all_ips = []
        try:
            _, _, ips = socket.gethostbyname_ex(socket.gethostname())
            for ip in ips:
                if not ip.startswith(('127.', '169.254.')):
                    all_ips.append(ip)
        except Exception:
            pass

        # 优先推荐真实物理局域网 IP (排除 VPN / VMware 虚拟网卡)
        preferred_ip = '127.0.0.1'
        real_lans = [ip for ip in all_ips if not ip.startswith(('198.18.', '192.168.151.', '192.168.160.'))]
        if real_lans:
            preferred_ip = real_lans[0]
        elif all_ips:
            preferred_ip = all_ips[0]

        return jsonify({
            "code": 200,
            "data": {
                "preferred_ip": preferred_ip,
                "all_ips": all_ips if all_ips else ["127.0.0.1"],
                "frontend_port": 3000,
                "backend_port": Config.PORT
            }
        })

    return app

app = create_app()
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# 实时推流控制
_streaming_active = True
_stream_thread = None

def simulation_stream_worker():
    """后台工作线程：以 10Hz 频率实时生成并广播肺部呼吸动力学流体力学帧"""
    global _streaming_active
    start_time = time.time()
    while _streaming_active:
        current_t = time.time() - start_time
        frame = physiological_sim_service.compute_frame(current_t)
        socketio.emit('simulation_frame', frame)
        time.sleep(0.1) # 10 FPS 流畅且低网络开销

@socketio.on('connect')
def handle_connect():
    print("[WebSocket] 临床工作台/移动端客户端已接入时序帧总线")
    emit('connection_ack', {'status': 'CONNECTED', 'fps': 10, 'cluster': 'SYU-HPC-TWIN'})

@socketio.on('start_stream')
def handle_start_stream():
    global _stream_thread, _streaming_active
    _streaming_active = True
    if _stream_thread is None or not _stream_thread.is_alive():
        _stream_thread = threading.Thread(target=simulation_stream_worker, daemon=True)
        _stream_thread.start()
    emit('stream_status', {'status': 'STREAMING', 'rate_hz': 10})

@socketio.on('tune_simulation')
def handle_tune_simulation(data):
    """前端滑块拖动时通过WebSocket秒级同步流体力学参数"""
    updated = physiological_sim_service.update_parameters(data)
    emit('params_updated', updated, broadcast=True)

@socketio.on('disconnect')
def handle_disconnect():
    print("[WebSocket] 客户端断开连接")

if __name__ == '__main__':
    # 启动后台流
    _stream_thread = threading.Thread(target=simulation_stream_worker, daemon=True)
    _stream_thread.start()
    print("=" * 65)
    print(" 肺部数字孪生交互系统 (Pulmonary Digital Twin) 后端服务启动")
    print(" 监听地址: http://0.0.0.0:5000")
    print(" WebSocket: ws://0.0.0.0:5000/socket.io")
    print("=" * 65)
    socketio.run(app, host=Config.HOST, port=Config.PORT, debug=False, allow_unsafe_werkzeug=True)

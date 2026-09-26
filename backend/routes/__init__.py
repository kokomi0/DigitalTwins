from .auth_routes import auth_bp
from .clinical_routes import clinical_bp
from .simulation_routes import simulation_bp
from .graph_routes import graph_bp
from .audit_routes import audit_bp

__all__ = [
    'auth_bp',
    'clinical_bp',
    'simulation_bp',
    'graph_bp',
    'audit_bp'
]

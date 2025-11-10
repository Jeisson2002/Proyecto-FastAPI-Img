# app/utils/utils.py
from datetime import datetime

def get_timestamp():
    """Devuelve un timestamp legible."""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
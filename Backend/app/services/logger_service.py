import logging
from logging.handlers import RotatingFileHandler

LOG_FILE = "app.log"

# Configurar logger
logger = logging.getLogger("app_logger")
logger.setLevel(logging.INFO)

if not logger.handlers:
    handler = RotatingFileHandler(LOG_FILE, maxBytes=5_000_000, backupCount=3)
    formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)


def info(msg: str):
    logger.info(msg)


def error(msg: str):
    logger.error(msg)


def last_lines(n: int = 50):
    try:
        with open(LOG_FILE, "r", encoding="utf-8") as f:
            lines = f.readlines()
        return [l.strip() for l in lines[-n:]]
    except FileNotFoundError:
        return []

import logging
from terranova.settings import LOGLEVEL

logging.basicConfig(level=LOGLEVEL)

logger = logging.getLogger("Terranova")
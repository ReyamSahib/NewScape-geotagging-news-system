
import logging
import time

from system.backend.database.database import get_headline_articles
from system.backend.Services.image_service import cache_image_batch

logger = logging.getLogger(__name__)

BATCH_SIZE = 5
DELAY_BETWEEN_BATCHES = 60


def automatic_image_worker():
    """Automatically cache preview images for stored news."""

    logger.info("NewScape automatic image worker started.")

    while True:
        try:
            # Read existing news without modifying the database.
            news = get_headline_articles()

            # Already cached URLs are skipped by image_service.
            # Each cycle checks at most 5 uncached publisher pages.
            checked = cache_image_batch(news)

            if checked == 0:
                logger.info("No uncached news images to check.")

        except Exception:
            logger.exception("Image worker encountered an error.")

        # Pause before checking for missing or newly added news.
        time.sleep(DELAY_BETWEEN_BATCHES)

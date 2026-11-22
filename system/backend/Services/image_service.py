
import json
import threading
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

import ipaddress
import socket

# Store image URLs locally, not in the shared database.
CACHE_FILE = Path(__file__).resolve().parent / "image_cache.json"
CACHE_LOCK = threading.Lock()

REQUEST_TIMEOUT = 8
CACHE_EXPIRY_SECONDS = 7 * 24 * 60 * 60
MAX_ARTICLES_PER_BATCH = 5


def load_cache():
    if not CACHE_FILE.exists():
        return {}

    try:
        return json.loads(CACHE_FILE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def save_cache(cache):
    temporary = CACHE_FILE.with_suffix(".tmp")
    temporary.write_text(
        json.dumps(cache, indent=2),
        encoding="utf-8"
    )
    temporary.replace(CACHE_FILE)



def is_safe_public_url(url):
    """Allow only public HTTP/HTTPS websites."""
    try:
        parsed = urlparse(url)

        if parsed.scheme not in ("http", "https"):
            return False

        if not parsed.hostname:
            return False

        if parsed.username or parsed.password:
            return False

        if parsed.port not in (None, 80, 443):
            return False

        addresses = socket.getaddrinfo(
            parsed.hostname,
            parsed.port or (443 if parsed.scheme == "https" else 80)
        )

        return bool(addresses) and all(
            ipaddress.ip_address(address[4][0]).is_global
            for address in addresses
        )

    except (ValueError, OSError):
        return False


def get_publisher_image(article_url):
    """Find the original publisher's preview image safely."""
    if not article_url or not is_safe_public_url(article_url):
        return None

    current_url = article_url

    try:
        with requests.Session() as session:
            session.trust_env = False

            # Follow at most three redirects, checking each destination.
            for _ in range(4):
                if not is_safe_public_url(current_url):
                    return None

                response = session.get(
                    current_url,
                    headers={"User-Agent": "Mozilla/5.0"},
                    timeout=REQUEST_TIMEOUT,
                    allow_redirects=False,
                    stream=True
                )

                with response:
                    if response.status_code in (301, 302, 303, 307, 308):
                        destination = response.headers.get("Location")
                        if not destination:
                            return None

                        current_url = urljoin(current_url, destination)
                        continue

                    response.raise_for_status()

                    content_type = response.headers.get(
                        "Content-Type", ""
                    ).lower()

                    if "text/html" not in content_type:
                        return None

                    # Limit downloaded HTML to 1 MB.
                    chunks = []
                    size = 0

                    for chunk in response.iter_content(chunk_size=16384):
                        size += len(chunk)
                        if size > 1_000_000:
                            return None
                        chunks.append(chunk)

                    html = b"".join(chunks)

                    soup = BeautifulSoup(html, "html.parser")

                    for attributes in (
                        {"property": "og:image"},
                        {"name": "twitter:image"},
                    ):
                        tag = soup.find("meta", attrs=attributes)

                        if tag and tag.get("content"):
                            image_url = urljoin(
                                current_url,
                                tag["content"]
                            )

                            if is_safe_public_url(image_url):
                                return image_url

                    return None

    except requests.RequestException:
        return None

    return None


    parsed = urlparse(article_url)

    if parsed.scheme not in ("http", "https"):
        return None

    try:
        response = requests.get(
            article_url,
            headers={"User-Agent": "NewScape/1.0"},
            timeout=REQUEST_TIMEOUT
        )
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        for attributes in (
            {"property": "og:image"},
            {"name": "twitter:image"},
        ):
            tag = soup.find("meta", attrs=attributes)
            if tag and tag.get("content"):
                image_url = urljoin(article_url, tag["content"])
                if urlparse(image_url).scheme in ("http", "https"):
                    return image_url

    except requests.RequestException:
        pass

    return None


def get_cached_image(article_url):
    """Return a cached image; do not visit the publisher."""
    if not article_url:
        return None

    with CACHE_LOCK:
        entry = load_cache().get(article_url)

    if not entry:
        return None

    if time.time() - entry.get("checked_at", 0) > CACHE_EXPIRY_SECONDS:
        return None

    return entry.get("image_url")


def cache_image_batch(articles):
    """
    Retrieve images for a small batch of existing news.
    Run explicitly, never during a normal API request.
    """
    checked = 0

    for article in articles:
        if checked >= MAX_ARTICLES_PER_BATCH:
            break

        article_url = article.get("url")
        if not article_url:
            continue

        with CACHE_LOCK:
            cache = load_cache()
            entry = cache.get(article_url)

        if entry and time.time() - entry.get("checked_at", 0) < CACHE_EXPIRY_SECONDS:
            continue

        image_url = get_publisher_image(article_url)

        with CACHE_LOCK:
            cache = load_cache()
            cache[article_url] = {
                "image_url": image_url,
                "checked_at": time.time()
            }
            save_cache(cache)

        checked += 1
        print(
            f"{checked}.",
            "Image found" if image_url else "No image",
            "-", article.get("title", "")[:60]
        )

    return checked

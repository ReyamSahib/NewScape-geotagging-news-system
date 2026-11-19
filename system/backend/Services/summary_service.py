"""
Article summary service for the NewScape Senior Project.

This module handles:
1. Retrieving the text of the original article
2. AI-based article summarisation for the map popups

The summary uses the AdditionalAPIKEY Groq key and the
openai/gpt-oss-120b model.
"""

import html
import json
import os
import re
from pathlib import Path

import requests
from dotenv import load_dotenv
from groq import Groq



# API SETUP

# Locate the .env file stored in the root folder of the project.
PROJECT_ROOT = Path(__file__).resolve().parents[3]
ENV_PATH = PROJECT_ROOT / ".env"

load_dotenv(ENV_PATH)

summary_api_key = os.getenv("AdditionalAPIKEY")

# Separate Groq client for summaries
groq_summary_client = Groq(api_key=summary_api_key)

# Summaries already created while the backend is running,
# so the same article is not summarised twice.
summary_cache = {}



# ARTICLE TEXT RETRIEVAL

# NewsAPI and GNews only return a short description, so the
# original page is opened to read the full article paragraphs.

def get_article_text(url):

    if not url:
        return ""

    headers = {
        "User-Agent": "Mozilla/5.0"
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)
    except requests.RequestException:
        return ""

    if response.status_code != 200:
        return ""

    # Keep only the text inside <p> paragraphs.
    paragraphs = re.findall(
        r"<p[^>]*>(.*?)</p>",
        response.text,
        flags=re.IGNORECASE | re.DOTALL
    )

    article_text = " ".join(
        re.sub(r"<[^>]+>", " ", paragraph) for paragraph in paragraphs
    )

    article_text = html.unescape(article_text)
    article_text = re.sub(r"\s+", " ", article_text).strip()

    # Limit the text sent to Groq.
    return article_text[:6000]



# SUMMARY LENGTH LIMIT

# The popup has room for about 6 lines (50 to 55 words).
# If the AI writes more, the summary is cut at the end of the
# last full sentence that fits, or at the word limit.

def limit_words(text, max_words=55):

    words = (text or "").split()

    if len(words) <= max_words:
        return " ".join(words)

    shortened = " ".join(words[:max_words])
    last_stop = max(
        shortened.rfind(". "),
        shortened.rfind("! "),
        shortened.rfind("? ")
    )

    # Keep whole sentences when at least half the summary remains.
    if last_stop > len(shortened) // 2:
        return shortened[:last_stop + 1]

    return shortened.rstrip(",;:") + "…"



# GROQ ARTICLE SUMMARY

def summarize_article(title, content, url):

    cache_key = url or title

    if cache_key in summary_cache:
        return summary_cache[cache_key]

    article_text = get_article_text(url)

    # Use the stored description when the page could not be read.
    if len(article_text) < 300:
        article_text = content or ""
        text_source = "description"
    else:
        text_source = "full article"

    prompt = f"""
Summarise the following news article for a map popup.

RULES

- Write 2 or 3 short sentences, 45 to 55 words in total.
  Never write more than 55 words.
- Explain what happened, where it happened and why it matters.
- Use only information found in the article text.
- Do not add facts, opinions, or details that are not in the text.
- Ignore website menus, adverts, and cookie messages.
- If the text is very short, summarise only what is available.

Return JSON only in this format:

{{
  "summary": ""
}}


ARTICLE

Title:
{title}

Article:
{article_text}
"""

    try:
        response = groq_summary_client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {
                    "role": "system",
                    "content": """
You are a precise news summarisation system.
Write short, neutral, factual summaries of news articles.
"""
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"},
            temperature=0,
            reasoning_effort="low"
        )

        result = json.loads(response.choices[0].message.content)

    except Exception as error:
        print("Summary error:", error)
        return {"summary": "", "source": text_source}



    # FINAL RESULT

    summary_result = {
        "summary": limit_words(result.get("summary", ""), 55),
        "source": text_source
    }

    summary_cache[cache_key] = summary_result

    return summary_result



# LOCAL SETUP TEST

if __name__ == "__main__":
    print("Summary service loaded successfully.")
    print("Summary API key loaded:", bool(summary_api_key))
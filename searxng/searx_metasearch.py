# SPDX-License-Identifier: AGPL-3.0-or-later
"""
Searx Metasearch - Fixed version for metasearch support

This engine queries other SearXNG instances. The base_url should be set
in settings.yml for each instance.
"""

import logging
from json import loads
from searx.engines import categories as searx_categories

logger = logging.getLogger(__name__)

print("LOADING CUSTOM SEARX_METASEARCH.PY v2", flush=True)

# about
about = {
    "website": "https://github.com/searxng/searxng",
    "wikidata_id": "Q17639196",
    "official_api_documentation": "https://docs.searxng.org/dev/search_api.html",
    "use_official_api": True,
    "require_api_key": False,
    "results": "JSON",
}

categories = list(searx_categories.keys())

# Module-level base_url - SearXNG will replace this from settings.yml
base_url = ""


def request(query, params):
    # Use module-level base_url (set by SearXNG from settings.yml)
    url = base_url

    logger.debug(f"[searx_metasearch] request() called, base_url={url}, query={query}")

    if not url:
        logger.warning("[searx_metasearch] No base_url configured!")
        return None

    # Construct the search URL - append /search endpoint
    search_url = url.rstrip("/") + "/search"

    params["url"] = search_url
    params["method"] = "POST"

    # Prepare data for the POST request
    params["data"] = {
        "q": query,
        "pageno": params.get("pageno", 1),
        "language": params.get("language", "en"),
        "time_range": params.get("time_range", ""),
        "format": "json",
    }

    logger.debug(f"[searx_metasearch] Making request to {search_url}")

    return params


def response(resp):
    logger.debug(
        f"[searx_metasearch] response() called, status={resp.status_code}, "
        f"text_preview={resp.text[:200] if resp.text else 'empty'}"
    )

    try:
        response_json = loads(resp.text)
    except Exception as e:
        logger.error(
            f"[searx_metasearch] Failed to parse JSON: {e}, response={resp.text[:500]}"
        )
        return []

    results = []

    if "results" in response_json:
        results = response_json["results"]
        logger.debug(f"[searx_metasearch] Got {len(results)} results")
    else:
        logger.warning(
            f"[searx_metasearch] No 'results' key in response, keys={list(response_json.keys())}"
        )

    for i in ("answers", "infoboxes"):
        if i in response_json:
            results.extend(response_json[i])

    if "suggestions" in response_json:
        results.extend({"suggestion": s} for s in response_json["suggestions"])

    if "number_of_results" in response_json:
        results.append({"number_of_results": response_json["number_of_results"]})

    return results

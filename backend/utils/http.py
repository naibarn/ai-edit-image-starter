from typing import Any, Mapping, Optional
import requests
import logging

logger = logging.getLogger(__name__)

DEFAULT_TIMEOUT = 60

def post_json(url: str, json: Any, headers: Optional[Mapping[str,str]] = None, timeout: int = DEFAULT_TIMEOUT):
    try:
        response = requests.post(url, json=json, headers=headers, timeout=timeout)
        response.raise_for_status()
        return response
    except requests.RequestException as e:
        logger.error(f"POST request failed for {url}: {e}")
        raise

def get(url: str, headers: Optional[Mapping[str,str]] = None, timeout: int = DEFAULT_TIMEOUT):
    try:
        response = requests.get(url, headers=headers, timeout=timeout)
        response.raise_for_status()
        return response
    except requests.RequestException as e:
        logger.error(f"GET request failed for {url}: {e}")
        raise
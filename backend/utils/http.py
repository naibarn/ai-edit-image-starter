from typing import Any, Mapping, Optional
import requests
DEFAULT_TIMEOUT = 60
def post_json(url: str, json: Any, headers: Optional[Mapping[str,str]] = None, timeout: int = DEFAULT_TIMEOUT):
    return requests.post(url, json=json, headers=headers, timeout=timeout)
def get(url: str, headers: Optional[Mapping[str,str]] = None, timeout: int = DEFAULT_TIMEOUT):
    return requests.get(url, headers=headers, timeout=timeout)
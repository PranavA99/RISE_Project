import os

CACHE_FILE = "ingested_urls.txt"


def is_url_ingested(url):

    if not os.path.exists(CACHE_FILE):
        return False

    with open(CACHE_FILE, "r", encoding="utf-8") as file:
        urls = file.read().splitlines()

    return url in urls


def save_ingested_url(url):

    with open(CACHE_FILE, "a", encoding="utf-8") as file:
        file.write(url + "\n")
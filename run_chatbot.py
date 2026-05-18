import os

from app.services.ingestion import ingest_markdown
from app.services.chatbot import ask_chatbot

from app.cache import (
    is_url_ingested,
    save_ingested_url
)


url = input("Enter website URL: ")

# CHECK CACHE
if is_url_ingested(url):

    print("\nWebsite already ingested.")
    print("Skipping scraping + ingestion...\n")

else:

    print("\nStarting scraping...\n")

    os.system(
        f'cd scraping && scrapy crawl url_scraper -a urls="{url}"'
    )

    print("\nMarkdown generated successfully!")

    print("\nStarting ingestion...\n")

    result = ingest_markdown("KnowledgeBase.md")

    print(result)

    save_ingested_url(url)

    print("\nURL saved to cache.")


while True:

    query = input("\nAsk Question (type exit to quit): ")

    if query.lower() == "exit":
        break

    response = ask_chatbot(query)

    print("\nChatbot Response:\n")

    print(response["answer"])
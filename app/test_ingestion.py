import warnings
warnings.filterwarnings("ignore")

import traceback

from app.services.ingestion import ingest_markdown
from app.services.chatbot import ask_chatbot


def main():

    try:

        print("\nStarting ingestion...\n")

        result = ingest_markdown(
            "KnowledgeBase.md"
        )

        print(result)

        print("\nChatbot Ready!\n")

        while True:

            query = input("Enter your question (or type 'exit'): ")

            if query.lower() == "exit":
                print("\nExiting chatbot...")
                break

            response = ask_chatbot(query)

            print("\nChatbot Response:\n")
            print(response)
            print("\n" + "="*50 + "\n")

    except Exception:

        print("\nError occurred:\n")
        traceback.print_exc()


if __name__ == "__main__":
    main()
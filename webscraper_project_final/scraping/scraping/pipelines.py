from itemadapter import ItemAdapter
from markdownify import markdownify as md

class MarkdownConversionPipeline:

    def open_spider(self, spider):

        self.file = open(
            "../KnowledgeBase.md",
            "w",
            encoding="utf-8"
        )

    def process_item(self, item, spider):

        item = ItemAdapter(item)

        title = item.get("title", "Untitled")
        url = item.get("url", "")
        content = item.get("content", "")

        if not content:
            spider.logger.warning("Empty content found.")
            return item

        markdown_content = md(content)
        markdown = f"""
# {title}

URL: {url}

{markdown_content}

---

"""

        self.file.write(markdown)

        return item

    def close_spider(self, spider):

        if self.file:
            self.file.close()
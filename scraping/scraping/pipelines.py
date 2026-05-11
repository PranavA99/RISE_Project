# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://docs.scrapy.org/en/latest/topics/item-pipeline.html


# useful for handling different item types with a single interface
from itemadapter import ItemAdapter
import html2text

class MarkdownConversionPipeline:
    def open_spider(self, spider):
        self.html2text = html2text.HTML2Text()
        try:
            self.file = open("KnowledgeBase.md", "a", encoding="utf-8")
        except Exception as e:
            spider.logger.error(f"Error opening file: {e}")
            self.file = None
        self.html2text.ignore_links = False
        self.html2text.ignore_images = False

    def process_item(self, item, spider):
        if not self.file:
            spider.logger.error("File not available for writing.")
            return item
        
        item = ItemAdapter(item=item)
        if 'content' in item and isinstance(item['content'], str):
            markdown_text = self.html2text.handle(item['content'])
        elif 'content' in item and isinstance(item['content'], list):
            markdown_text = self.html2text.handle(' '.join(item['content']))
        else:
            return item  # Skip items without content
        self.file.write(f"# Title: {item.get('title', 'Untitled')}\n\n")
        self.file.write(markdown_text)
        self.file.write("\n\n---\n\n")
        return item

    def close_spider(self, spider):
        if self.file and not self.file.closed:
            self.file.close()
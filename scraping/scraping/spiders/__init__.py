# This package will contain the spiders of your Scrapy project
#
# Please refer to the documentation for information on how to create and manage
# your spiders.
import scrapy
from itemloaders import ItemLoader
from ..items import ScrapingItem
from scrapy.linkextractors import LinkExtractor
from urllib.parse import urlparse

class URLScraper(scrapy.Spider):
    name = "url_scraper"

    def __init__(self, urls=None, **kwargs):     #pass URL list from Streamlit
        super().__init__(**kwargs)
        self.start_urls = urls or []
        self.allowed_domains = [urlparse(url).netloc for url in self.start_urls]

    def start_requests(self):
        for url in self.start_urls:
            yield scrapy.Request(url=url, callback=self.parse)

    def parse(self, response: scrapy.http.Response):
        loader = ItemLoader(item=ScrapingItem(), response=response)
        loader.add_css('title', "title::text")
        loader.add_xpath('content', "//body//text()[not(parent::script) and not(parent::style)]")
        yield loader.load_item()

        le = LinkExtractor(allow_domains=self.allowed_domains)
        for link in le.extract_links(response):
            yield response.follow(link, callback=self.parse)
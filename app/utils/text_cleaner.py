# import re
# from bs4 import BeautifulSoup, Tag, Comment


# _REMOVE_TAGS = [
#     "script", "style", "noscript", "iframe",
#     "header", "footer", "nav", "aside",
#     "form", "button", "input", "select",
#     "svg", "img", "figure", "figcaption",
# ]

# def extract_text_from_html(html: str) -> str: 
#     if not html or not isinstance(html, str): 
#         return "" 
    
#     soup = BeautifulSoup(html, "html.parser")

#     # 1. Remove unwanted tags
#     for tag_name in _REMOVE_TAGS:
#         for tag in soup.find_all(tag_name): 
#             tag.decompose()

#     # 2. Remove comments
#     for comment in soup.find_all(string=lambda x: isinstance(x, Comment)): 
#         comment.extract()

#     # 3. Safe class-based removal
#     noise_classes = ["cookie", "popup", "modal", "ad", "sidebar", "breadcrumb", "banner"] 
    
#     for tag in soup.find_all(True): 
#         if not isinstance(tag, Tag): 
#             continue 
        
#         attrs = getattr(tag, "attrs", None) 
#         if not isinstance(attrs, dict): 
#             continue 
        
#         classes = attrs.get("class", []) 
        
#         if isinstance(classes, str): 
#             classes = [classes] 
        
#         class_text = " ".join(classes).lower() 
        
#         if any(nc in class_text for nc in noise_classes): 
#             tag.decompose()

#     # 4. Extract clean text
#     lines = [] 
#     for text in soup.stripped_strings: 
#         if not text: 
#             continue 
        
#         line = text.strip() 
#         if len(line) > 20: 
#             lines.append(line) 
        
#         text = "\n".join(lines)

#     # 5. Clean spacing
#     text = re.sub(r"\n{3,}", "\n\n", text) 
    
#     return text.strip()

# def extract_title_from_html(html: str) -> str: 
#     if not html or not isinstance(html, str): 
#         return "" 
    
#     soup = BeautifulSoup(html, "html.parser") 
    
#     if soup.title and soup.title.get_text(): 
#         return soup.title.get_text(strip=True) 
    
#     return ""






import re


def fix_spaced_text(text: str) -> str:
    """
    Fix broken character spacing:
    F a s t A P I → FastAPI
    """
    text = re.sub(r"(?<=[A-Za-z])\s(?=[A-Za-z])", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def remove_duplicate_lines(text: str) -> str:
    """
    Remove repeated lines (very useful for navigation text)
    """
    seen = set()
    output = []

    for line in text.split("\n"):
        line_clean = line.strip().lower()

        if not line_clean:
            continue

        if line_clean not in seen:
            seen.add(line_clean)
            output.append(line.strip())

    return "\n".join(output)


def clean_scraped_text(text: str) -> str:
    """
    FINAL CLEANER (NO HTML parsing here)
    """

    if not text or not isinstance(text, str):
        return ""

    # 1. Fix broken spacing (IMPORTANT)
    text = fix_spaced_text(text)

    # 2. Normalize whitespace
    text = re.sub(r"\s+", " ", text)

    # 3. Convert into readable lines (optional structure)
    text = text.replace(". ", ".\n")

    # 4. Remove duplicates
    text = remove_duplicate_lines(text)

    # 5. Final cleanup
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def extract_title_from_text(text: str) -> str:
    """
    Since no HTML, we assume title is first line or first 100 chars
    """
    if not text:
        return ""

    first_line = text.split("\n")[0].strip()

    return first_line[:100]
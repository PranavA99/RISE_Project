def load_markdown_file(file_path: str) -> str:

    with open(file_path, "r", encoding="utf-8") as file:
        content = file.read()

    return content
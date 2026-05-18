from langchain_huggingface import HuggingFaceEmbeddings


def load_embeddings():
    """
    Load HuggingFace embedding model safely.
    """

    try:
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        return embeddings

    except Exception as e:
        raise RuntimeError(f"Failed to load embeddings: {str(e)}")
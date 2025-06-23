import os
import pandas as pd
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain.schema import Document
from dotenv import load_dotenv

load_dotenv()

# Define paths
CSV_PATH = os.path.join(os.path.dirname(__file__), "data", "strategies.csv")
PERSIST_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "vectorstore", "strategies_chroma")
COLLECTION_NAME = "strategies"

# Load data from CSV
try:
    df = pd.read_csv(CSV_PATH, sep=';')
    print(f"Successfully loaded {len(df)} strategies from {CSV_PATH}")
except FileNotFoundError:
    print(f"Error: Could not find the CSV file at {CSV_PATH}")
    exit()

# Create LangChain Documents
documents = []
for _, row in df.iterrows():
    # A more descriptive content for better retrieval
    content = (
        f"Strategy '{row['Strategie naam']}' is designed to help with the following symptoms and goals: {row['Verhelpt klachten bij']}. "
        f"Here is an explanation of the strategy: {row['Uitleg']}. "
        f"This is why it works: {row['Waarom']}. "
        f"Here are some practical tips: {row['Praktische tips']}."
    )
    metadata = {
        "strategy_name": row['Strategie naam'],
        "explanation": row['Uitleg'],
        "why": row['Waarom'],
        "helps_with": row['Verhelpt klachten bij'],
        "sources": row['Bron(nen)'],
        "practical_tips": row['Praktische tips']
    }
    documents.append(Document(page_content=content, metadata=metadata))

print(f"Created {len(documents)} LangChain documents.")

# Initialize OpenAI embeddings
api_key = os.environ.get("OPENAI_API_KEY")
if not api_key:
    print("Error: OPENAI_API_KEY not found in environment variables.")
    exit()
embedding_model = OpenAIEmbeddings(api_key=api_key)

# Create and persist the vector store
print(f"Creating vector store at {PERSIST_DIR}...")
vectorstore = Chroma.from_documents(
    documents=documents,
    embedding=embedding_model,
    collection_name=COLLECTION_NAME,
    persist_directory=PERSIST_DIR,
)

print(f"✅ Vector store for strategies created successfully with {len(documents)} documents.") 

# Debug: Inspect stored documents
print("\n--- Inspecting stored strategy documents ---")
try:
    loaded_vs = Chroma(
        persist_directory=PERSIST_DIR,
        embedding_function=embedding_model,
        collection_name=COLLECTION_NAME
    )
    docs = loaded_vs.similarity_search(".", k=5)
    for i, doc in enumerate(docs):
        print(f"Document {i+1} page_content: {doc.page_content}")
        print(f"Document {i+1} metadata: {doc.metadata}\n")
except Exception as e:
    print(f"Error inspecting vectorstore: {e}") 
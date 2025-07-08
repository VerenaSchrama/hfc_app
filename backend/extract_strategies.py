# python extract_strategies.py
import os
import json
import pandas as pd
from openai import OpenAI
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Define paths
CHUNKS_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'processed', 'chunks_AlisaVita.json')
OUTPUT_CSV_PATH = os.path.join(os.path.dirname(__file__), 'data', 'strategies_from_book.csv')

def load_book_chunks(path):
    #Loads book chunks from a JSON file.
    logging.info(f"Loading book chunks from {path}...")
    try:
        with open(path, 'r') as f:
            data = json.load(f)
        logging.info(f"Successfully loaded {len(data)} chunks.")
        return data
    except FileNotFoundError:
        logging.error(f"File not found: {path}")
        return None
    except json.JSONDecodeError:
        logging.error(f"Error decoding JSON from {path}")
        return None

def extract_strategies_with_llm(text_chunk):
    #Uses an LLM to extract a single, well-defined strategy from a text chunk.
    system_prompt = """
You are an expert in nutrition and hormonal health, specializing in distilling actionable advice from text.
Your task is to identify ONE single, clear, actionable strategy from the provided text.
If you find a strategy, respond in a structured JSON format. If no clear strategy is found, respond with an empty JSON object {}.

The JSON object must have the following keys:
- "strategy_name": A short, catchy name for the strategy (e.g., "Seed Cycling for Hormone Balance").
- "explanation": What the user should do, explained simply (1-2 sentences).
- "why": The reason this strategy works (1-2 sentences).
- "helps_with": A comma-separated list of symptoms or goals it addresses (e.g., "Irregular cycles,PMS,Acne").
- "practical_tips": A semicolon-separated list of 2-3 concrete, practical tips.
- "sources": Should be "Alisa Vitti - In the FLO".

Only extract a strategy if it is a specific, actionable instruction. General information is not a strategy.
"""
    try:
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text_chunk}
            ],
            response_format={"type": "json_object"},
            temperature=0.2
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        logging.error(f"Error calling OpenAI API: {e}")
        return {}

def main():
    #Main function to run the strategy extraction process.
    chunks = load_book_chunks(CHUNKS_PATH)
    if not chunks:
        return

    all_strategies = []
    # Process all chunks. This might take a while.
    for i, chunk in enumerate(chunks):
        content = chunk.get('page_content', '')
        if len(content) < 150: # Skip very short chunks
            continue
            
        logging.info(f"Processing chunk {i+1}/{len(chunks)}...")
        strategy = extract_strategies_with_llm(content)
        
        # Validate that the extracted object is a valid strategy
        if strategy and all(k in strategy for k in ["strategy_name", "explanation", "why", "helps_with", "practical_tips"]):
            all_strategies.append(strategy)
            logging.info(f"Found strategy: {strategy['strategy_name']}")

    if not all_strategies:
        logging.warning("No strategies were extracted from the book chunks.")
        return

    # Convert to DataFrame and save to CSV
    df = pd.DataFrame(all_strategies)
    # Ensure no duplicates
    df.drop_duplicates(subset=['strategy_name'], inplace=True, keep='first')
    
    logging.info(f"Saving {len(df)} unique strategies to {OUTPUT_CSV_PATH}...")
    df.to_csv(OUTPUT_CSV_PATH, index=False, sep=';')
    logging.info("✅ Successfully created strategies CSV from the book.")


if __name__ == "__main__":
    main() 
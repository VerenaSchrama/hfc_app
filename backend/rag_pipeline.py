# python rag_pipeline.py
from langchain_community.chat_models import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate, ChatPromptTemplate
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
import os
from dotenv import load_dotenv
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

load_dotenv()

# Define paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VECTORSTORE_PATH = os.path.join(BASE_DIR, "..", "data", "vectorstore")
STRATEGY_VECTORSTORE_PATH = os.path.join(VECTORSTORE_PATH, "strategies_chroma")
MAIN_VECTORSTORE_PATH = os.path.join(VECTORSTORE_PATH, "chroma")

# Initialize LLM and Embeddings
llm = ChatOpenAI(model="gpt-4", temperature=0, api_key=os.getenv("OPENAI_API_KEY"))
embeddings = OpenAIEmbeddings(api_key=os.getenv("OPENAI_API_KEY"))

# Load vector stores
try:
    strategy_vectorstore = Chroma(
        persist_directory=STRATEGY_VECTORSTORE_PATH,
        embedding_function=embeddings,
        collection_name="strategies"
    )
    strategy_retriever = strategy_vectorstore.as_retriever(search_kwargs={"k": 3})

    main_vectorstore = Chroma(
        persist_directory=MAIN_VECTORSTORE_PATH,
        embedding_function=embeddings
    )
    main_retriever = main_vectorstore.as_retriever()

except Exception as e:
    print(f"Error loading vector stores: {e}")
    exit()


def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)


def build_question(user_input: dict) -> str:
    """Build a question from user input for the chatbot."""
    return (
        f"My symptoms are: {', '.join(user_input['symptoms'])}. "
        f"My goals are: {', '.join(user_input['goals'])}. "
        f"My dietary preferences are: {', '.join(user_input['preferences'])}. "
        f"I'm currently in the {user_input['cycle']} phase of my cycle. "
        "What should I eat?"
    )


def generate_advice(user_input: dict) -> dict:
    """
    Generate advice using the conversational chatbot with memory.
    This is the original function for the chat interface.
    """
    query = build_question(user_input)

    prompt_template = PromptTemplate(
        input_variables=["context", "question"],
        template="""
You are a cycle-aware nutrition assistant based on holistic and scientific insights.

Always answer user questions helpfully and always provide answers in a warm, empowering tone and information dense way.

If the user is asking about different cycle phases or it makes sense to structure your answer according to the 4 cycle phases, use the following structure:

**Menstrual Phase**
- Key needs:
- Recommended foods:

**Follicular Phase**
- Key needs:
- Recommended foods:

**Ovulatory Phase**
- Key needs:
- Recommended foods:

**Luteal Phase**
- Key needs:
- Recommended foods:

For the foods, refer to ingredients and nutrients rather than recipes or dishes.

If the source materials really don't mention anything related to the question, say:
"There are limited recommendations for your question based on science, but what science does advise is…"

Be concise, clear, and nurturing in your responses.
Keep a warm and empowering tone.

Answer based on the context below:

Context:
{context}

Question:
{question}
"""
    )

    memory = ConversationBufferMemory(
        memory_key="chat_history",
        return_messages=True,
        output_key="answer"
    )

    qa_chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=main_retriever,
        memory=memory,
        return_source_documents=True,
        combine_docs_chain_kwargs={"prompt": prompt_template},
        output_key="answer"
    )

    result = qa_chain({"question": query})

    return {
        "answer": result["answer"],
        "sources": [
            {
                "content": doc.page_content,
                "metadata": doc.metadata,
            }
            for doc in result.get("source_documents", [])
        ]
    }


# RAG Chain for Simple Advice (no conversation memory)
RAG_PROMPT_TEMPLATE = """
### CONTEXT
{context}

### QUESTION
{question}
"""
rag_prompt = ChatPromptTemplate.from_template(RAG_PROMPT_TEMPLATE)

rag_chain = (
    {"context": main_retriever | format_docs, "question": RunnablePassthrough()}
    | rag_prompt
    | llm
    | StrOutputParser()
)

def get_advice(question: str) -> str:
    """
    Get general nutritional advice from the RAG pipeline (no conversation memory).
    """
    return rag_chain.invoke(question)


def get_strategies(user_input: dict) -> list:
    """
    Get 3 personalized strategies based on user input.
    """
    symptoms = user_input.get('symptoms', [])
    goals = user_input.get('goals', [])
    
    query = f"Symptoms: {', '.join(symptoms)}. Goals: {', '.join(goals)}. Looking for strategies that help with these symptoms and goals."
    
    docs = strategy_retriever.invoke(query)
    
    # Return the full metadata for each recommended strategy
    strategies = [doc.metadata for doc in docs]
        
    return strategies


def get_recommendations(intake_data, df, top_k=3):
    # Correctly build the query string from the intake data dictionary
    user_data_dict = intake_data.dict()
    symptoms = ", ".join(user_data_dict.get('symptoms', []))
    goals = ", ".join(user_data_dict.get('goals', []))
    query_text = f"User is experiencing {symptoms} and has goals to {goals}."

    # Create embeddings for the user query
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    query_embedding = embeddings.embed_query(query_text)

    # Prepare the strategy embeddings from the DataFrame
    strategy_embeddings = np.array(df['embedding'].apply(eval).tolist())

    # Calculate cosine similarity
    similarities = cosine_similarity([query_embedding], strategy_embeddings)[0]

    # Get top_k recommendations
    top_indices = similarities.argsort()[-top_k:][::-1]
    recommendations = df.iloc[top_indices]

    return recommendations.to_dict(orient='records')


if __name__ == '__main__':
    print("--- Testing Strategy Retrieval ---")
    test_input = {
        "symptoms": ["Irregular cycles", "Acne", "Fatigue"],
        "goals": ["Regulate cycle", "Improve skin", "Boost energy"]
    }
    recommended_strategies = get_strategies(test_input)
    if recommended_strategies:
        for i, strategy in enumerate(recommended_strategies, 1):
            print(f"Strategy {i}: {strategy['strategy_name']}")
            print(f"  Description: {strategy['explanation']}")
    else:
        print("No strategies were recommended.")
    print("---------------------------------\n")

    # Test with a simple query that should definitely match
    print("--- Testing Simple Query ---")
    simple_docs = strategy_retriever.invoke("Acne")
    print(f"Simple query 'Acne' found {len(simple_docs)} documents")
    for i, doc in enumerate(simple_docs[:3]):
        print(f"Simple result {i+1}: {doc.metadata['strategy_name']}")
    print("-----------------------------\n")

    print("--- Testing Simple Advice ---")
    test_question = "What can I eat to improve my energy levels during my luteal phase?"
    advice = get_advice(test_question)
    print(f"Advice for '{test_question}':")
    print(advice)
    print("------------------------------\n")

    print("--- Testing Chatbot Advice ---")
    chatbot_input = {
        "symptoms": ["Irregular cycles", "Acne"],
        "goals": ["Regulate cycle", "Improve skin"],
        "preferences": ["Vegetarian", "No dairy"],
        "cycle": "luteal"
    }
    chatbot_result = generate_advice(chatbot_input)
    print(f"Chatbot advice:")
    print(chatbot_result["answer"])
    print("-----------------------------\n")


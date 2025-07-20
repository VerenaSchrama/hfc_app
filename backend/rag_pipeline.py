# python rag_pipeline.py
from langchain_openai import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate, ChatPromptTemplate
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain.schema.messages import HumanMessage, AIMessage
import os
from dotenv import load_dotenv
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

load_dotenv()

# Define paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VECTORSTORE_PATH = os.path.join(BASE_DIR, "data", "vectorstore")
STRATEGY_VECTORSTORE_PATH = os.path.join(VECTORSTORE_PATH, "strategies_chroma")
MAIN_VECTORSTORE_PATH = os.path.join(VECTORSTORE_PATH, "chroma")

# Initialize LLM and Embeddings
llm = ChatOpenAI(model="gpt-4", temperature=0, api_key=os.getenv("OPENAI_API_KEY"))
embeddings = OpenAIEmbeddings(api_key=os.getenv("OPENAI_API_KEY"))

# Load vector stores
strategy_vectorstore = None
strategy_retriever = None
main_vectorstore = None
main_retriever = None

try:
    print(f"[RAG] Loading strategy vectorstore from: {STRATEGY_VECTORSTORE_PATH}")
    strategy_vectorstore = Chroma(
        persist_directory=STRATEGY_VECTORSTORE_PATH,
        embedding_function=embeddings,
        collection_name="strategies"
    )
    strategy_retriever = strategy_vectorstore.as_retriever(search_kwargs={"k": 3})
    print("[RAG] Strategy vectorstore loaded successfully")

    print(f"[RAG] Loading main vectorstore from: {MAIN_VECTORSTORE_PATH}")
    main_vectorstore = Chroma(
        persist_directory=MAIN_VECTORSTORE_PATH,
        embedding_function=embeddings
    )
    main_retriever = main_vectorstore.as_retriever()
    print("[RAG] Main vectorstore loaded successfully")

except Exception as e:
    print(f"[RAG] Error loading vector stores: {e}")
    print(f"[RAG] Strategy path exists: {os.path.exists(STRATEGY_VECTORSTORE_PATH)}")
    print(f"[RAG] Main path exists: {os.path.exists(MAIN_VECTORSTORE_PATH)}")
    # Don't exit, let the app continue with None retrievers


def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)


def ensure_list(val):
    if isinstance(val, list):
        return val
    if val is None:
        return []
    return [val]


def build_question(user_input: dict) -> str:
    """Build a question from user input for the chatbot, using all intakeData fields and optional notes."""
    symptoms = ensure_list(user_input.get('symptoms'))
    symptoms_note = user_input.get('symptoms_note', '')
    goals = ensure_list(user_input.get('goals'))
    goals_note = user_input.get('goals_note', '')
    preferences = ensure_list(user_input.get('dietaryRestrictions')) or ensure_list(user_input.get('preferences'))
    dietary_note = user_input.get('dietaryRestrictions_note', '')
    cycle = user_input.get('cycle', '')
    reason = user_input.get('reason', '')
    whatWorks = user_input.get('whatWorks', '')
    extraThoughts = user_input.get('extraThoughts', '')

    question = (
        f"My symptoms are: {', '.join(symptoms)}. "
        + (f"Symptom notes: {symptoms_note}. " if symptoms_note else "")
        + f"My goals are: {', '.join(goals)}. "
        + (f"Goals notes: {goals_note}. " if goals_note else "")
        + f"My dietary restrictions are: {', '.join(preferences)}. "
        + (f"Dietary notes: {dietary_note}. " if dietary_note else "")
        + f"I'm currently in the {cycle} phase of my cycle. "
        + (f"My reason for using this app: {reason}. " if reason else "")
        + (f"What already works for me: {whatWorks}. " if whatWorks else "")
        + (f"Extra thoughts: {extraThoughts}. " if extraThoughts else "")
        + "What should I eat?"
    )

    print(f"[RAG] Chatbot advice question: {question}")
    return question


def generate_advice(user_input: dict) -> dict:
    """
    Generate advice using the conversational chatbot with memory.
    This is the original function for the chat interface.
    """
    # Check if vectorstore is loaded
    if main_retriever is None:
        print("[RAG] Vectorstore not loaded, returning fallback response")
        return {
            "answer": "I'm sorry, but I'm having trouble accessing my knowledge base right now. Please try again later or contact support if the problem persists.",
            "sources": []
        }
    
    # Always include user_profile in the system prompt
    user_profile = user_input.get('user_profile', '')
    query = user_input.get('question', '')
    chat_history = user_input.get('chat_history', [])

    try:
        # Convert chat history to LangChain message format
        messages = []
        for sender, text in chat_history:
            if sender == 'user':
                messages.append(HumanMessage(content=text))
            elif sender == 'bot':
                messages.append(AIMessage(content=text))

        prompt_template = PromptTemplate(
            input_variables=["context", "question", "user_profile"],
            template="""
You are a cycle-aware nutrition assistant based on holistic and scientific insights.

You have access to the following up-to-date user profile:
{user_profile}

Always answer user questions helpfully and always provide answers in a warm, empowering tone and information dense way.

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

        # Create memory with existing chat history
        memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True,
            output_key="answer"
        )
        
        # Load existing chat history into memory
        for message in messages:
            if isinstance(message, HumanMessage):
                memory.chat_memory.add_user_message(message.content)
            elif isinstance(message, AIMessage):
                memory.chat_memory.add_ai_message(message.content)

        qa_chain = ConversationalRetrievalChain.from_llm(
            llm=llm,
            retriever=main_retriever,
            memory=memory,
            return_source_documents=True,
            combine_docs_chain_kwargs={"prompt": prompt_template},
            output_key="answer"
        )

        result = qa_chain({"question": query, "user_profile": user_profile})

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
    except Exception as e:
        print(f"[RAG] Error in generate_advice: {e}")
        import traceback
        traceback.print_exc()
        return {
            "answer": "I'm sorry, but I encountered an error while processing your request. Please try again later.",
            "sources": []
        }


# RAG Chain for Simple Advice (no conversation memory)
RAG_PROMPT_TEMPLATE = """
### CONTEXT
{context}

### QUESTION
{question}
"""
rag_prompt = ChatPromptTemplate.from_template(RAG_PROMPT_TEMPLATE)

# Initialize rag_chain only if main_retriever exists
rag_chain = None
if main_retriever is not None:
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
    if rag_chain is None:
        return "I'm sorry, but I'm having trouble accessing my knowledge base right now. Please try again later."
    try:
        return rag_chain.invoke(question)
    except Exception as e:
        print(f"[RAG] Error in get_advice: {e}")
        return "I'm sorry, but I encountered an error while processing your request. Please try again later."


def get_strategies(user_input: dict) -> list:
    """
    Get 3 personalized strategies based on user input, using all intakeData fields and optional notes.
    """
    # Check if strategy retriever is available
    if strategy_retriever is None:
        print("[RAG] Strategy retriever not loaded, returning empty list")
        return []
    
    symptoms = ensure_list(user_input.get('symptoms'))
    symptoms_note = user_input.get('symptoms_note', '')
    goals = ensure_list(user_input.get('goals'))
    goals_note = user_input.get('goals_note', '')
    preferences = ensure_list(user_input.get('dietaryRestrictions')) or ensure_list(user_input.get('preferences'))
    dietary_note = user_input.get('dietaryRestrictions_note', '')
    cycle = user_input.get('cycle', '')
    reason = user_input.get('reason', '')
    whatWorks = user_input.get('whatWorks', '')
    extraThoughts = user_input.get('extraThoughts', '')

    query = (
        f"Symptoms: {', '.join(symptoms)}. "
        + (f"Symptom notes: {symptoms_note}. " if symptoms_note else "")
        + f"Goals: {', '.join(goals)}. "
        + (f"Goals notes: {goals_note}. " if goals_note else "")
        + f"Dietary restrictions: {', '.join(preferences)}. "
        + (f"Dietary notes: {dietary_note}. " if dietary_note else "")
        + f"Cycle phase: {cycle}. "
        + (f"Reason for using the app: {reason}. " if reason else "")
        + (f"What already works: {whatWorks}. " if whatWorks else "")
        + (f"Extra thoughts: {extraThoughts}. " if extraThoughts else "")
        + "Looking for strategies that match this profile."
    )

    print(f"[RAG] Strategy selection query: {query}")

    try:
        docs = strategy_retriever.invoke(query)
        strategies = [doc.metadata for doc in docs]
        return strategies
    except Exception as e:
        print(f"[RAG] Error in get_strategies: {e}")
        return []


def get_recommendations(intake_data, df, top_k=3):
    # Build the query string from the intake data dictionary
    user_data_dict = intake_data.dict()
    symptoms = ", ".join(user_data_dict.get('symptoms', []))
    goals = ", ".join(user_data_dict.get('goals', []))
    query_text = f"User is experiencing {symptoms} and has goals to {goals}."

    # Use the global embeddings instance instead of creating a new one
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


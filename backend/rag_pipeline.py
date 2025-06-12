from langchain.chat_models import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import OpenAIEmbeddings
import os
from dotenv import load_dotenv

load_dotenv()

def build_question(user_input: dict) -> str:
    return (
        f"My symptoms are: {', '.join(user_input['symptoms'])}. "
        f"My goals are: {', '.join(user_input['goals'])}. "
        f"My dietary preferences are: {', '.join(user_input['preferences'])}. "
        f"I'm currently in the {user_input['cycle']} phase of my cycle. "
        "What should I eat?"
    )

def generate_advice(user_input: dict) -> dict:
    query = build_question(user_input)

    embedding_model = OpenAIEmbeddings()
    vectorstore = Chroma(
        persist_directory="./data/vectorstore/chroma",
        embedding_function=embedding_model
    )

    retriever = vectorstore.as_retriever()
    prompt_template = PromptTemplate(
        input_variables=["context", "question"],
        template="""
You are a cycle-aware nutrition assistant based on holistic and scientific insights.
Answer with clarity, structure, and empathy. Be concise.

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
        llm=ChatOpenAI(model="gpt-4", temperature=0),
        retriever=retriever,
        memory=memory,
        return_source_documents=False,
        combine_docs_chain_kwargs={"prompt": prompt_template},
        output_key="answer"
    )

    result = qa_chain({"question": query})
    return { "answer": result["answer"] }

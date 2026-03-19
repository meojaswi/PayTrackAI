import os
from dotenv import load_dotenv
load_dotenv()
import chromadb
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal

from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

# ── Globals ──────────────────────────────────────────────────────────────────
vector_store: Chroma = None
llm: ChatGroq = None

# ── Dataset (18 documents — 3 per tone × 2 languages) ────────────────────────
DOCS = [
    # English / polite
    Document(page_content="This is a reminder that your payment is pending. Kindly clear it at the earliest.", metadata={"tone": "polite", "lang": "english"}),
    Document(page_content="We hope you are well. We wanted to gently remind you that your payment is still outstanding. We would appreciate your prompt attention.", metadata={"tone": "polite", "lang": "english"}),
    Document(page_content="Just a friendly reminder that your payment remains unpaid. Please settle it at your convenience.", metadata={"tone": "polite", "lang": "english"}),
    # English / formal
    Document(page_content="This is a follow-up regarding your pending payment. Kindly take necessary action at the earliest.", metadata={"tone": "formal", "lang": "english"}),
    Document(page_content="We wish to bring to your attention that an outstanding amount is due against your account. Please arrange for payment at the earliest convenience.", metadata={"tone": "formal", "lang": "english"}),
    Document(page_content="As per our records, a payment remains due. We request you to clear the dues at the earliest to avoid any inconvenience.", metadata={"tone": "formal", "lang": "english"}),
    # English / strict
    Document(page_content="Your payment is overdue. Please settle it immediately.", metadata={"tone": "strict", "lang": "english"}),
    Document(page_content="This is a final reminder. Your outstanding amount must be paid without further delay. Failure to pay may result in further action.", metadata={"tone": "strict", "lang": "english"}),
    Document(page_content="Your account shows an overdue balance. Immediate payment is required to avoid escalation.", metadata={"tone": "strict", "lang": "english"}),
    # Hindi / polite
    Document(page_content="कृपया बकाया राशि का भुगतान शीघ्र करें।", metadata={"tone": "polite", "lang": "hindi"}),
    Document(page_content="नमस्ते, हम आशा करते हैं कि आप स्वस्थ हैं। कृपया बकाया राशि का भुगतान सुविधानुसार कर दें।", metadata={"tone": "polite", "lang": "hindi"}),
    Document(page_content="आपसे विनम्र निवेदन है कि बकाया राशि का भुगतान शीघ्र कर दें।", metadata={"tone": "polite", "lang": "hindi"}),
    # Hindi / formal
    Document(page_content="यह एक अनुस्मारक है कि आपकी बकाया राशि अभी तक लंबित है। कृपया इसे जल्द निपटाएं।", metadata={"tone": "formal", "lang": "hindi"}),
    Document(page_content="आपके खाते में बकाया राशि है। कृपया इसे यथाशीघ्र जमा करें।", metadata={"tone": "formal", "lang": "hindi"}),
    Document(page_content="हमारे अभिलेखों के अनुसार आपका भुगतान अभी तक प्राप्त नहीं हुआ है। कृपया उचित कार्यवाही करें।", metadata={"tone": "formal", "lang": "hindi"}),
    # Hindi / strict
    Document(page_content="बकाया राशि का भुगतान अभी तक लंबित है। कृपया अति शीघ्र भुगतान करें।", metadata={"tone": "strict", "lang": "hindi"}),
    Document(page_content="यह अंतिम सूचना है। बकाया राशि का भुगतान तुरंत करें अन्यथा आगे की कार्यवाही की जाएगी।", metadata={"tone": "strict", "lang": "hindi"}),
    Document(page_content="आपका भुगतान अत्यंत विलंबित हो चुका है। कृपया इसे बिना किसी देरी के तुरंत निपटाएं।", metadata={"tone": "strict", "lang": "hindi"}),
]


# ── Lifespan: init on startup ─────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global vector_store, llm

    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        raise RuntimeError("GROQ_API_KEY environment variable not set")

    print("⏳ Loading embeddings model...")
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    print("⏳ Setting up vector store...")
    client = chromadb.PersistentClient(path="rag_db")

    # Wipe and reseed so re-runs don't duplicate documents
    try:
        client.delete_collection("messages")
    except Exception:
        pass

    vector_store = Chroma(
        client=client,
        embedding_function=embeddings,
        collection_name="messages"
    )
    splitter = RecursiveCharacterTextSplitter(chunk_size=200, chunk_overlap=30)
    splits = splitter.split_documents(DOCS)
    vector_store.add_documents(splits)
    print(f"✅ Vector store ready — {len(splits)} chunks indexed")

    print("⏳ Initialising LLM...")
    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.5, api_key=groq_key)
    print("✅ LLM ready")

    yield  # server is running

    print("👋 Shutting down PayTrackAI API")


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="PayTrackAI API",
    description="RAG-powered payment reminder generator",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten this in production
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schemas ───────────────────────────────────────────────────────────────────
class GenerateRequest(BaseModel):
    name: str = Field(..., example="Ojaswi")
    amount: int = Field(..., gt=0, example=15000)
    days: int = Field(..., ge=0, example=7)
    language: Literal["english", "hindi"] = Field(..., example="english")
    tone: Literal["polite", "formal", "strict"] = Field(..., example="polite")


class GenerateResponse(BaseModel):
    message: str
    language: str
    tone: str


# ── Helpers ───────────────────────────────────────────────────────────────────
def retrieve_examples(query: str, language: str, tone: str):
    """Retrieve similar examples filtered by language + tone, with language-only fallback."""
    results = vector_store.similarity_search(
        query,
        k=3,
        filter={"$and": [{"lang": {"$eq": language}}, {"tone": {"$eq": tone}}]}
    )
    if not results:
        results = vector_store.similarity_search(
            query, k=3, filter={"lang": {"$eq": language}}
        )
    return results


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest):
    try:
        query = f"{req.tone} payment reminder for ₹{req.amount} overdue {req.days} days"
        results = retrieve_examples(query, req.language, req.tone)
        context = "\n".join([r.page_content for r in results])

        prompt = f"""You are a professional business owner sending payment reminders.

Language: {req.language}
Tone: {req.tone}

Rules:
- Maintain a professional and respectful tone
- Do NOT use slang words
- Keep it concise and suitable for business/WhatsApp
- If Hindi, use pure Devanagari script
- Output ONLY the message — no explanations, no labels

Examples:
{context}

Now generate a message for:
Customer: {req.name}
Amount: ₹{req.amount}
Days overdue: {req.days}
"""
        response = llm.invoke(prompt)
        return GenerateResponse(
            message=response.content.strip(),
            language=req.language,
            tone=req.tone,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

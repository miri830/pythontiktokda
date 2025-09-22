from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timedelta, timezone
import jwt
from passlib.context import CryptContext
import random
import base64
from io import BytesIO
from PIL import Image
from fastapi.middleware.cors import CORSMiddleware
import uuid
from bson import ObjectId
from datetime import datetime, timezone



app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# CORS middleware will be configured below with env-aware origins

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "python_test_secret_key_2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120  # 2 hours for better UX


api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    bio: Optional[str] = ""
    profile_image: Optional[str] = None
    is_admin: bool = False
    total_tests: int = 0
    average_score: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    bio: Optional[str] = ""

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    id: str
    email: str
    full_name: str
    bio: str
    profile_image: Optional[str]
    total_tests: int
    average_score: float
    is_admin: bool

class Question(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str  # "python_syntax", "algorithms", "oop", "data_structures"
    question_text: str
    options: List[str]  # A, B, C, D options
    correct_answer: int  # Index of correct answer (0-3)
    explanation: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class QuestionCreate(BaseModel):
    category: str
    question_text: str
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    options: Optional[List[str]] = None
    correct_answer: int
    explanation: str



class TestSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    questions: List[str]  # List of question IDs
    answers: Dict[str, int] = {}  # question_id -> selected_option_index
    current_question: int = 0
    score: Optional[int] = None
    percentage: Optional[float] = None
    completed: bool = False
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

class TestResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: str
    score: int
    percentage: float
    total_questions: int
    correct_answers: int
    questions_with_answers: List[Dict]
    completed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdminStats(BaseModel):
    total_users: int
    total_questions: int
    total_tests: int
    recent_users: List[Dict]

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"email": email})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)

async def get_admin_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

def prepare_for_mongo(data):
    if isinstance(data, dict):
        # Remove _id field to avoid ObjectId serialization issues
        if '_id' in data:
            del data['_id']
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
    return data

def parse_from_mongo(item):
    """Normalize Mongo documents for JSON response.
    - Remove top-level _id
    - Convert any ObjectId to str (recursively)
    - Keep datetimes as-is; FastAPI can encode them
    """
    def convert(value):
        if isinstance(value, ObjectId):
            return str(value)
        if isinstance(value, list):
            return [convert(v) for v in value]
        if isinstance(value, dict):
            return {k: convert(v) for k, v in value.items() if k != '_id'}
        return value

    return convert(item)

# Sample questions data
sample_questions = [
    # python_syntax (10 questions)
    {
        "category": "python_syntax",
        "question_text": "Python-da dəyişən adı rəqəmlə başlaya bilərmi?",
        "options": ["Bəli, həmişə", "Xeyr, heç vaxt", "Bəli, əgər \" \" işarəsi ilə əhatə olunarsa", "Yalnız xüsusi hallarda"],
        "correct_answer": 1,
        "explanation": "Python-da dəyişən adları rəqəmlə başlaya bilməz. Dəyişən adları hərflə və ya _ işarəsi ilə başlamalıdır."
    },
    {
        "category": "python_syntax",
        "question_text": "Python-da indentasiya (girinti) nə üçün istifadə olunur?",
        "options": ["Kodun gözəl görünməsi üçün", "Kod bloklarını müəyyən etmək üçün", "Performansı artırmaq üçün", "Xəta tapmaq üçün"],
        "correct_answer": 1,
        "explanation": "Python-da indentasiya kod bloklarını müəyyən etmək üçün istifadə olunur. Bu Python-un syntax-ının əsas xüsusiyyətidir."
    },
    {
        "category": "python_syntax",
        "question_text": "Python-da şərh (comment) necə yazılır?",
        "options": ["// ilə", "/* */ ilə", "# ilə", "<!-- --> ilə"],
        "correct_answer": 2,
        "explanation": "Python-da tək sətirli şərhlər # işarəsi ilə yazılır."
    },
    {
        "category": "python_syntax",
        "question_text": "Python-da hansı keyword dəyişən yaratmaq üçün istifadə olunur?",
        "options": ["var", "let", "const", "Heç biri"],
        "correct_answer": 3,
        "explanation": "Python-da dəyişən yaratmaq üçün xüsusi keyword lazım deyil. Sadəcə ad = dəyər yazırıq."
    },
    {
        "category": "python_syntax",
        "question_text": "Python-da string və integer-i toplamaq mümkündürmü?",
        "options": ["Bəli, avtomatik çevrilir", "Xeyr, TypeError alırıq", "Bəli, amma xəbərdarlıq verir", "Yalnız xüsusi operator ilə"],
        "correct_answer": 1,
        "explanation": "Python-da string və integer birbaşa toplanmır, TypeError alırıq. Əvvəlcə type conversion etmək lazımdır."
    },
    {
        "category": "python_syntax",
        "question_text": "Python-da print() funksiyasının default separator-u nədir?",
        "options": ["Tab (\\t)", "Space ( )", "Comma (,)", "Newline (\\n)"],
        "correct_answer": 1,
        "explanation": "print() funksiyasının default separator-u space ( ) işarəsidir."
    },
    {
        "category": "python_syntax",
        "question_text": "Python-da range(5) nə qaytarır?",
        "options": ["[1, 2, 3, 4, 5]", "[0, 1, 2, 3, 4]", "[0, 1, 2, 3, 4, 5]", "5"],
        "correct_answer": 1,
        "explanation": "range(5) 0-dan 4-ə qədər (5 daxil olmayaraq) rəqəmləri qaytarır: 0, 1, 2, 3, 4"
    },
    {
        "category": "python_syntax",
        "question_text": "Python-da funksiya necə təyin edilir?",
        "options": ["function myFunc()", "def myFunc():", "func myFunc():", "define myFunc():"],
        "correct_answer": 1,
        "explanation": "Python-da funksiyalar 'def' keyword-ü ilə təyin edilir: def function_name():"
    },
    {
        "category": "python_syntax",
        "question_text": "Python case-sensitive dildir?",
        "options": ["Bəli", "Xeyr", "Yalnız string-lər üçün", "Yalnız dəyişənlər üçün"],
        "correct_answer": 0,
        "explanation": "Python case-sensitive dildir, yəni 'Variable' və 'variable' fərqli dəyişənlərdir."
    },
    {
        "category": "python_syntax",
        "question_text": "Python-da kod sətiri necə bitir?",
        "options": ["Semicolon (;) ilə", "Avtomatik (newline)", "Comma (,) ilə", "Period (.) ilə"],
        "correct_answer": 1,
        "explanation": "Python-da kod sətirləri avtomatik olaraq newline (yeni sətir) ilə bitir, semicolon məcburi deyil."
    },
    
    # algorithms (10 questions)
    {
        "category": "algorithms",
        "question_text": "Binary Search alqoritminin time complexity-si nədir?",
        "options": ["O(n)", "O(log n)", "O(n log n)", "O(n²)"],
        "correct_answer": 1,
        "explanation": "Binary Search alqoritminin time complexity-si O(log n)-dir, çünki hər addımda axtarış sahəsini yarıya bölür."
    },
    {
        "category": "algorithms",
        "question_text": "Bubble Sort alqoritminin worst case time complexity-si nədir?",
        "options": ["O(n)", "O(log n)", "O(n log n)", "O(n²)"],
        "correct_answer": 3,
        "explanation": "Bubble Sort-un worst case time complexity-si O(n²)-dir."
    },
    {
        "category": "algorithms",
        "question_text": "Recursive alqoritmin əsas şərti nədir?",
        "options": ["Loop olmalıdır", "Base case olmalıdır", "Array istifadə etməlidir", "Class-da olmalıdır"],
        "correct_answer": 1,
        "explanation": "Recursive alqoritmin mütləq base case (durma şərti) olmalıdır, əks halda sonsuz dövrə yaranar."
    },
    {
        "category": "algorithms",
        "question_text": "Quicksort alqoritminin average case time complexity-si nədir?",
        "options": ["O(n)", "O(log n)", "O(n log n)", "O(n²)"],
        "correct_answer": 2,
        "explanation": "Quicksort-un average case time complexity-si O(n log n)-dir."
    },
    {
        "category": "algorithms",
        "question_text": "Depth-First Search (DFS) hansı data structure istifadə edir?",
        "options": ["Queue", "Stack", "Array", "Hash Table"],
        "correct_answer": 1,
        "explanation": "DFS alqoritmi Stack data structure istifadə edir (rekursiya və ya açıq stack ilə)."
    },
    {
        "category": "algorithms",
        "question_text": "Breadth-First Search (BFS) hansı data structure istifadə edir?",
        "options": ["Queue", "Stack", "Array", "Hash Table"],
        "correct_answer": 0,
        "explanation": "BFS alqoritmi Queue data structure istifadə edir."
    },
    {
        "category": "algorithms",
        "question_text": "Linear Search alqoritminin time complexity-si nədir?",
        "options": ["O(1)", "O(log n)", "O(n)", "O(n²)"],
        "correct_answer": 2,
        "explanation": "Linear Search alqoritminin time complexity-si O(n)-dir, çünki worst case-də bütün elementləri yoxlayır."
    },
    {
        "category": "algorithms",
        "question_text": "Merge Sort alqoritminin space complexity-si nədir?",
        "options": ["O(1)", "O(log n)", "O(n)", "O(n²)"],
        "correct_answer": 2,
        "explanation": "Merge Sort alqoritminin space complexity-si O(n)-dir, çünki əlavə array-lər yaradır."
    },
    {
        "category": "algorithms",
        "question_text": "Dynamic Programming-in əsas prinsipi nədir?",
        "options": ["Böyük problemi kiçik hissələrə bölmək", "Optimal subproblem və overlapping", "Greedy choice", "Divide and conquer"],
        "correct_answer": 1,
        "explanation": "Dynamic Programming-in əsas prinsipi optimal substructure və overlapping subproblems-dir."
    },
    {
        "category": "algorithms",
        "question_text": "Fibonacci ardıcıllığının recursive həllində time complexity nədir?",
        "options": ["O(n)", "O(log n)", "O(2^n)", "O(n²)"],
        "correct_answer": 2,
        "explanation": "Fibonacci-nin sadə recursive həllinin time complexity-si O(2^n)-dir, çünki eyni hesablamalar təkrarlanır."
    },

    # oop (10 questions)
    {
        "category": "oop",
        "question_text": "Python-da class necə yaradılır?",
        "options": ["create class MyClass:", "class MyClass:", "new class MyClass:", "define MyClass:"],
        "correct_answer": 1,
        "explanation": "Python-da class 'class' keyword-ü ilə yaradılır: class MyClass:"
    },
    {
        "category": "oop",
        "question_text": "oop-də Encapsulation nə deməkdir?",
        "options": ["Data və methodları birləşdirmək", "Class-dan class yaratmaq", "Çoxlu form", "Data gizlətmək"],
        "correct_answer": 3,
        "explanation": "Encapsulation data-nı gizlətmək və ona nəzarətli giriş təmin etmək deməkdir."
    },
    {
        "category": "oop",
        "question_text": "Python-da __init__ methodu nə üçün istifadə olunur?",
        "options": ["Class-ı silmək", "Object yaradarkən ilkin dəyərləri təyin etmək", "Method çağırmaq", "Variable yaratmaq"],
        "correct_answer": 1,
        "explanation": "__init__ methodu constructor rolunu oynayır və object yaradılarkən çağırılır."
    },
    {
        "category": "oop",
        "question_text": "Inheritance nə deməkdir?",
        "options": ["Yeni class yaratmaq", "Mövcud class-dan xüsusiyyətləri miras almaq", "Object yaratmaq", "Method yaratmaq"],
        "correct_answer": 1,
        "explanation": "Inheritance bir class-ın başqa class-dan xüsusiyyətləri və methodları miras almasıdır."
    },
    {
        "category": "oop",
        "question_text": "Python-da private attribute necə yaradılır?",
        "options": ["private keyword ilə", "__ (double underscore) ilə", "* işarəsi ilə", "# işarəsi ilə"],
        "correct_answer": 1,
        "explanation": "Python-da attribute-un adının qarşısına __ (double underscore) qoyaraq onu private edirik."
    },
    {
        "category": "oop",
        "question_text": "Polymorphism nə deməkdir?",
        "options": ["Bir class-dan çox object yaratmaq", "Eyni adlı method-un müxtəlif formalarının olması", "Class-ları birləşdirmək", "Data gizlətmək"],
        "correct_answer": 1,
        "explanation": "Polymorphism eyni interface-in müxtəlif implementasiyalarının olması deməkdir."
    },
    {
        "category": "oop",
        "question_text": "Python-da super() funksiyası nə üçün istifadə olunur?",
        "options": ["Yeni class yaratmaq", "Parent class-ın method-una müraciət etmək", "Object silmək", "Variable yaratmaq"],
        "correct_answer": 1,
        "explanation": "super() funksiyası parent class-ın method-larına müraciət etmək üçün istifadə olunur."
    },
    {
        "category": "oop",
        "question_text": "Method overriding nə deməkdir?",
        "options": ["Yeni method yaratmaq", "Parent class-ın method-unu child class-da yenidən təyin etmək", "Method silmək", "Method çağırmaq"],
        "correct_answer": 1,
        "explanation": "Method overriding parent class-ın method-unu child class-da yenidən təyin etmək deməkdir."
    },
    {
        "category": "oop",
        "question_text": "Abstract class nə üçün istifadə olunur?",
        "options": ["Object yaratmaq üçün", "Template və ya base class kimi", "Data saxlamaq üçün", "Performance artırmaq üçün"],
        "correct_answer": 1,
        "explanation": "Abstract class template rolunu oynayır və birbaşa instantiate edilə bilməz."
    },
    {
        "category": "oop",
        "question_text": "Python-da self keyword-ü nə deməkdir?",
        "options": ["Class-ın özü", "Current object-ə reference", "Parent class", "Method adı"],
        "correct_answer": 1,
        "explanation": "self keyword-ü current object-ə (instance) reference-dir və method-larda istifadə olunur."
    },

    # data_structures (10 questions)
    {
        "category": "data_structures",
        "question_text": "Python-da list və tuple arasında əsas fərq nədir?",
        "options": ["List daha sürətlidir", "Tuple dəyişdirilə bilməz (immutable)", "List daha az yer tutur", "Tuple daha çox data saxlayır"],
        "correct_answer": 1,
        "explanation": "Tuple immutable-dir, yəni yaradıldıqdan sonra dəyişdirilə bilməz. List isə mutable-dir."
    },
    {
        "category": "data_structures",
        "question_text": "Stack data strukturunda LIFO nə deməkdir?",
        "options": ["Last In First Out", "Last In Final Out", "List In First Out", "Long In Fast Out"],
        "correct_answer": 0,
        "explanation": "LIFO - Last In First Out deməkdir. Stack-də son əlavə edilən element ilk çıxarılır."
    },
    {
        "category": "data_structures",
        "question_text": "Queue data strukturunda FIFO nə deməkdir?",
        "options": ["Fast In Fast Out", "First In Final Out", "First In First Out", "Full In First Out"],
        "correct_answer": 2,
        "explanation": "FIFO - First In First Out deməkdir. Queue-də ilk əlavə edilən element ilk çıxarılır."
    },
    {
        "category": "data_structures",
        "question_text": "Python dictionary-nin average case lookup time complexity-si nədir?",
        "options": ["O(1)", "O(log n)", "O(n)", "O(n²)"],
        "correct_answer": 0,
        "explanation": "Python dictionary hash table istifadə edir və average case-də O(1) lookup time-a malikdir."
    },
    {
        "category": "data_structures",
        "question_text": "Binary Tree-də hər node-un maksimum neçə uşağı ola bilər?",
        "options": ["1", "2", "3", "Məhdudiyyət yoxdur"],
        "correct_answer": 1,
        "explanation": "Binary Tree-də hər node-un maksimum 2 uşağı ola bilər: sol və sağ."
    },
    {
        "category": "data_structures",
        "question_text": "Python set data strukturunun əsas xüsusiyyəti nədir?",
        "options": ["Sıralı elementlər", "Təkrarlanan elementlər", "Unikal elementlər", "Sabit ölçü"],
        "correct_answer": 2,
        "explanation": "Set data strukturunda yalnız unikal (təkrarlanmayan) elementlər saxlanır."
    },
    {
        "category": "data_structures",
        "question_text": "Linked List-də random access mümkündürmü?",
        "options": ["Bəli, O(1) vaxtda", "Xeyr, sequential access lazımdır", "Yalnız sorted list-də", "Yalnız double linked list-də"],
        "correct_answer": 1,
        "explanation": "Linked List-də random access yoxdur, elementlərə sequential olaraq (başdan) müraciət etmək lazımdır."
    },
    {
        "category": "data_structures",
        "question_text": "Hash Table-da collision nə deməkdir?",
        "options": ["Data itməsi", "İki key-in eyni hash value-ya malik olması", "Memory overflow", "Performance artımı"],
        "correct_answer": 1,
        "explanation": "Collision iki fərqli key-in eyni hash value-ya malik olması halıdır."
    },
    {
        "category": "data_structures",
        "question_text": "Python-da deque (double-ended queue) hansı modulda yerləşir?",
        "options": ["queue", "collections", "data", "struct"],
        "correct_answer": 1,
        "explanation": "deque collections modulunda yerləşir: from collections import deque"
    },
    {
        "category": "data_structures",
        "question_text": "Heap data strukturunun əsas xüsusiyyəti nədir?",
        "options": ["LIFO düzümü", "FIFO düzümü", "Parent-child arasında müəyyən münasibət", "Alphabetic sıralama"],
        "correct_answer": 2,
        "explanation": "Heap-də parent node həmişə uşaqlarından böyük (max heap) və ya kiçik (min heap) olur."
    }
]
# Admin sual silmə endpoint-i
# Sualı silmək üçün admin endpoint-i
@api_router.delete("/admin/questions/{question_id}")
async def delete_question(question_id: str, admin: User = Depends(get_admin_user)):
    conditions = [{"id": question_id}]
    # try as ObjectId too
    try:
        conditions.append({"_id": ObjectId(question_id)})
    except Exception:
        pass

    result = await db.questions.delete_one({"$or": conditions})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sual tapılmadı")
    return {"message": "Sual uğurla silindi"}


# Authentication routes
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email artıq istifadə olunur")
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create user
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        bio=user_data.bio
    )
    
    user_dict = user.dict()
    user_dict["password"] = hashed_password
    user_dict = prepare_for_mongo(user_dict)
    
    await db.users.insert_one(user_dict)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserProfile(**user.dict())
    }

@api_router.post("/auth/login")
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Email və ya şifrə yanlışdır")
    
    access_token = create_access_token(data={"sub": user["email"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserProfile(**user)
    }

@api_router.get("/auth/me", response_model=UserProfile)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserProfile(**current_user.dict())

# Test routes
from bson import ObjectId

# Test routes
@api_router.post("/tests/start")
async def start_test(current_user: User = Depends(get_current_user)):
    print("Current user:", current_user)

    # Get random 8 questions: target 2 per category, then fill remainder from any category
    categories = ["python_syntax", "algorithms", "oop", "data_structures"]
    selected_questions = []

    # Try to take up to 2 from each category
    for category in categories:
        category_questions = await db.questions.find({"category": category}).to_list(None)
        if len(category_questions) >= 2:
            selected_questions.extend(random.sample(category_questions, 2))
        elif len(category_questions) > 0:
            # take what is available (0 or 1)
            selected_questions.extend(category_questions[:1])

    # If still less than 8, fill from any remaining questions
    if len(selected_questions) < 8:
        all_questions = await db.questions.find({}).to_list(None)
        # exclude already selected by _id
        selected_ids = {str(q.get("_id")) for q in selected_questions}
        remaining = [q for q in all_questions if str(q.get("_id")) not in selected_ids]
        needed = 8 - len(selected_questions)
        if len(remaining) >= needed:
            selected_questions.extend(random.sample(remaining, needed))
        else:
            # not enough globally
            raise HTTPException(status_code=400, detail="Kifayət qədər sual yoxdur (ən azı 8 sual tələb olunur)")
    
    # Create test session (save only question ids as string)
    test_session = TestSession(
        user_id=current_user.id,
        questions=[str(q["_id"]) for q in selected_questions]
    )

    session_dict = prepare_for_mongo(test_session.dict())
    await db.test_sessions.insert_one(session_dict)
    
    # Return first question (fix here!)
    first_question = selected_questions[0]  # artıq sənəddən gəlir, ayrıca query lazım deyil
    
    # Build options consistently
    fq_options = first_question.get("options")
    if not fq_options:
        fq_options = [
            first_question.get("option_a"),
            first_question.get("option_b"),
            first_question.get("option_c"),
            first_question.get("option_d"),
        ]
        fq_options = [opt for opt in fq_options if opt is not None]

    # Normalize correct answer to int index
    fq_correct = first_question.get("correct_answer")
    if isinstance(fq_correct, str):
        if fq_correct.isdigit():
            fq_correct = int(fq_correct)
        else:
            letter_map = {"A": 0, "B": 1, "C": 2, "D": 3}
            fq_correct = letter_map.get(fq_correct.upper(), None)

    question_data = {
        "id": str(first_question["_id"]),  # <<< düzəldildi
        "question_text": first_question["question_text"],
        "options": fq_options,
        "correct_answer": fq_correct,
        "explanation": first_question.get("explanation", ""),
        "category": first_question["category"]
    }

    return {
        "session_id": test_session.id,
        "total_questions": len(selected_questions),
        "current_question": 0,
        "question": question_data
    }

# ... əvvəlki kod eyni qalır ...
from pydantic import BaseModel

class AnswerData(BaseModel):
    question_id: str
    selected_option: int

@api_router.post("/tests/{session_id}/answer")
async def submit_answer(
    session_id: str,
    answer_data: AnswerData,   # dict əvəzinə Pydantic model
    current_user: User = Depends(get_current_user)
):
    print("Gələn data:", answer_data.dict())
    session = await db.test_sessions.find_one(
        {"id": session_id, "user_id": current_user.id}
    )
    if not session:
        raise HTTPException(status_code=404, detail="Test sessiyası tapılmadı")
    
    # Update answer (store as integer index 0-3)
    await db.test_sessions.update_one(
        {"id": session_id},
        {"$set": {f"answers.{answer_data.question_id}": int(answer_data.selected_option)}}
    )
    
    return {"status": "success"}



@api_router.get("/tests/{session_id}/question/{question_index}")
async def get_question(
    session_id: str,
    question_index: int,
    current_user: User = Depends(get_current_user)
):
    # DEBUG log
    print("===== DEBUG get_question =====")
    print("Gələn session_id:", session_id)
    print("Gələn question_index:", question_index)
    print("Current user id:", current_user.id)

    # session axtarışı (bizdə session `id` string-dir, ObjectId yox)
    session = await db.test_sessions.find_one({"id": session_id, "user_id": current_user.id})
    print("Tapılan session:", session)

    if not session:
        raise HTTPException(status_code=404, detail="Test sessiyası tapılmadı")
    
    if question_index < 0 or question_index >= len(session["questions"]):
        raise HTTPException(status_code=400, detail="Yanlış sual indexi")
    
    question_id = session["questions"][question_index]
    print("Tapılan question_id:", question_id)

    # Question üçün ObjectId yoxlaması
    try:
        qid = ObjectId(question_id)
    except Exception:
        qid = question_id

    # ✅ DÜZƏLİŞ BURADA → `_id` ilə axtar
    question = await db.questions.find_one({"_id": qid})
    print("Tapılan question:", question)

    if not question:
        raise HTTPException(status_code=404, detail="Sual tapılmadı")

    # Cavabı frontend üçün hazırlayaq
    q_options = question.get("options")
    if not q_options:
        q_options = [
            question.get("option_a"),
            question.get("option_b"),
            question.get("option_c"),
            question.get("option_d"),
        ]
        q_options = [opt for opt in q_options if opt is not None]

    q_correct = question.get("correct_answer")
    if isinstance(q_correct, str):
        if q_correct.isdigit():
            q_correct = int(q_correct)
        else:
            letter_map = {"A": 0, "B": 1, "C": 2, "D": 3}
            q_correct = letter_map.get(q_correct.upper(), None)

    question_data = {
        "id": str(question["_id"]),
        "question_text": question["question_text"],
        "options": q_options,
        "correct_answer": q_correct,
        "explanation": question.get("explanation", ""),
        "category": question["category"]
    }

    return {
        "session_id": session_id,
        "total_questions": len(session["questions"]),
        "current_question": question_index,
        "question": question_data,
        "user_answer": session["answers"].get(str(question_id))
    } 
from datetime import datetime

@api_router.post("/tests/{session_id}/complete")
async def complete_test(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    session = await db.test_sessions.find_one(
        {"id": session_id, "user_id": current_user.id}
    )
    if not session:
        raise HTTPException(status_code=404, detail="Test sessiyası tapılmadı")

    user_answers = session.get("answers", {})

    questions_with_answers = []
    correct_count = 0
    total = len(user_answers)

    for qid, answer in user_answers.items():
        question = await db.questions.find_one({"_id": ObjectId(qid)})
        if not question:
            continue

        options = question.get("options")
        if not options:
            options = [
                question.get("option_a"),
                question.get("option_b"),
                question.get("option_c"),
                question.get("option_d"),
            ]
            options = [opt for opt in options if opt is not None]

        correct_index = question.get("correct_answer")
        if isinstance(correct_index, str):
            if correct_index.isdigit():
                correct_index = int(correct_index)
            else:
                letter_map = {"A": 0, "B": 1, "C": 2, "D": 3}
                correct_index = letter_map.get(correct_index.upper(), None)
        user_index = int(answer) if isinstance(answer, str) else answer

        is_correct = (user_index == correct_index)
        if is_correct:
            correct_count += 1

        questions_with_answers.append({
            "question": question.get("question_text"),
            "options": options,
            "user_answer": user_index,
            "correct_answer": correct_index,
            "is_correct": is_correct,
            "explanation": question.get("explanation", ""),
            "category": question.get("category", "")
        })

    percentage = round((correct_count / total) * 100) if total > 0 else 0

    # 🟢 Burada DB-də sessiyanı update edirik
    await db.test_sessions.update_one(
        {"id": session_id, "user_id": current_user.id},
        {"$set": {
            "score": correct_count,
            "total_questions": total,
            "correct_answers": correct_count,
            "percentage": percentage,
            "completed": True,
            "completed_at": datetime.utcnow(),
            "questions_with_answers": questions_with_answers
        }}
    )

    result = {
        "score": correct_count,
        "total_questions": total,
        "correct_answers": correct_count,
        "percentage": percentage,
        "questions_with_answers": questions_with_answers
    }

    # Update user aggregate stats
    user_doc = await db.users.find_one({"id": current_user.id})
    if user_doc:
        prev_total = int(user_doc.get("total_tests", 0))
        prev_avg = float(user_doc.get("average_score", 0.0))
        new_total = prev_total + 1
        # weighted average by number of tests
        new_avg = ((prev_avg * prev_total) + percentage) / new_total if new_total > 0 else percentage
        await db.users.update_one(
            {"id": current_user.id},
            {"$set": {"total_tests": new_total, "average_score": new_avg}}
        )

    # Store a test result document for history
    try:
        test_result_doc = {
            "user_id": current_user.id,
            "user_name": current_user.full_name,
            "score": correct_count,
            "percentage": percentage,
            "total_questions": total,
            "correct_answers": correct_count,
            "questions_with_answers": questions_with_answers,
            "completed_at": datetime.utcnow(),
        }
        await db.test_results.insert_one(test_result_doc)
    except Exception:
        pass

    return result


@api_router.get("/tests/{session_id}/result")
async def get_test_result(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    session = await db.test_sessions.find_one(
        {"id": session_id, "user_id": current_user.id}
    )
    if not session:
        raise HTTPException(status_code=404, detail="Test sessiyası tapılmadı")

    # Əgər artıq nəticə hesablanıbsa onu qaytar
    if "result" in session:
        return session["result"]

    # Yoxdursa, /complete-dəki hesablamanı təkrar edək
    user_answers = session.get("answers", {})

    questions_with_answers = []
    correct_count = 0
    total = len(user_answers)

    for qid, answer in user_answers.items():
        question = await db.questions.find_one({"_id": ObjectId(qid)})
        if not question:
            continue

        options = question.get("options")
        if not options:
            options = [
                question.get("option_a"),
                question.get("option_b"),
                question.get("option_c"),
                question.get("option_d"),
            ]
            options = [opt for opt in options if opt is not None]

        correct_index = question.get("correct_answer")
        if isinstance(correct_index, str):
            if correct_index.isdigit():
                correct_index = int(correct_index)
            else:
                letter_map = {"A": 0, "B": 1, "C": 2, "D": 3}
                correct_index = letter_map.get(correct_index.upper(), None)
        user_index = int(answer) if isinstance(answer, str) else answer

        is_correct = (user_index == correct_index)
        if is_correct:
            correct_count += 1

        questions_with_answers.append({
            "question": question.get("question_text"),
            "options": options,
            "user_answer": user_index,
            "correct_answer": correct_index,
            "is_correct": is_correct,
            "explanation": question.get("explanation", ""),
            "category": question.get("category", "")
        })

    result = {
        "score": correct_count,
        "total_questions": total,
        "correct_answers": correct_count,
        "percentage": round((correct_count / total) * 100) if total > 0 else 0,
        "questions_with_answers": questions_with_answers
    }

    # istəyirsən databazada da saxla:
    await db.test_sessions.update_one(
        {"id": session_id},
        {"$set": {"result": result}}
    )

    return result



# Leaderboard
@api_router.get("/leaderboard")
async def get_leaderboard():
    users_cursor = db.users.find(
        {"total_tests": {"$gt": 0}},
        {"password": 0}
    ).sort("average_score", -1).limit(50)
    users_raw = await users_cursor.to_list(None)
    users = [parse_from_mongo(user) for user in users_raw]
    
    leaderboard = []
    for i, user in enumerate(users):
        leaderboard.append({
            "rank": i + 1,
            "id": user["id"],
            "full_name": user["full_name"],
            "bio": user.get("bio", ""),
            "profile_image": user.get("profile_image"),
            "total_tests": user["total_tests"],
            "average_score": round(user["average_score"], 1)
        })
    
    return leaderboard

@api_router.get("/users/{user_id}/profile")
async def get_user_profile(user_id: str):
    user_raw = await db.users.find_one({"id": user_id}, {"password": 0})
    if not user_raw:
        raise HTTPException(status_code=404, detail="İstifadəçi tapılmadı")
    
    user = parse_from_mongo(user_raw)
    
    recent_tests_cursor = db.test_results.find(
        {"user_id": user_id}
    ).sort("completed_at", -1).limit(5)
    recent_tests_raw = await recent_tests_cursor.to_list(None)
    recent_tests = [parse_from_mongo(test) for test in recent_tests_raw]
    
    return {
        "user": user,
        "recent_tests": recent_tests
    }

# Profile image upload
@api_router.post("/profile/upload-image")
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # Check file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Yalnız şəkil faylları qəbul edilir")
    
    # Read and process image
    image_data = await file.read()
    image = Image.open(BytesIO(image_data))
    
    # Resize image
    image.thumbnail((200, 200), Image.Resampling.LANCZOS)
    
    # Convert to base64
    buffer = BytesIO()
    image.save(buffer, format="JPEG", quality=85)
    image_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    # Update user profile
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"profile_image": f"data:image/jpeg;base64,{image_base64}"}}
    )
    
    return {"profile_image": f"data:image/jpeg;base64,{image_base64}"}

# Admin routes
@api_router.get("/admin/stats")
async def get_admin_stats(admin: User = Depends(get_admin_user)):
    total_users = await db.users.count_documents({})
    total_questions = await db.questions.count_documents({})
    total_tests = await db.test_results.count_documents({})
    
    recent_users_cursor = db.users.find(
        {},
        {"password": 0}
    ).sort("created_at", -1).limit(10)
    recent_users_raw = await recent_users_cursor.to_list(None)
    recent_users = [parse_from_mongo(user) for user in recent_users_raw]
    
    return AdminStats(
        total_users=total_users,
        total_questions=total_questions,
        total_tests=total_tests,
        recent_users=recent_users
    )

@api_router.get("/admin/users")
async def get_all_users(admin: User = Depends(get_admin_user)):
    users_cursor = db.users.find({}, {"password": 0})
    users_raw = await users_cursor.to_list(None)
    users = [parse_from_mongo(user) for user in users_raw]
    return users

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, admin: User = Depends(get_admin_user)):
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="İstifadəçi tapılmadı")
    
    # Also delete user's test results
    await db.test_results.delete_many({"user_id": user_id})
    await db.test_sessions.delete_many({"user_id": user_id})
    
    return {"message": "İstifadəçi uğurla silindi"}

@api_router.get("/admin/questions")
async def get_all_questions(admin: User = Depends(get_admin_user)):
    questions_cursor = db.questions.find()
    questions_raw = await questions_cursor.to_list(None)
    normalized = []
    for q in questions_raw:
        qn = parse_from_mongo(dict(q))
        # Ensure id field is present
        if 'id' not in qn:
            _id = q.get('_id')
            if _id is not None:
                try:
                    qn['id'] = str(_id)
                except Exception:
                    pass
        # Ensure options array exists for UI
        if 'options' not in qn or not isinstance(qn.get('options'), list):
            opts = [qn.get('option_a'), qn.get('option_b'), qn.get('option_c'), qn.get('option_d')]
            qn['options'] = [o for o in opts if o is not None]
        # Normalize correct_answer to int index
        ca = qn.get('correct_answer')
        if isinstance(ca, str):
            if ca.isdigit():
                qn['correct_answer'] = int(ca)
            else:
                letter_map = {"A": 0, "B": 1, "C": 2, "D": 3}
                qn['correct_answer'] = letter_map.get(ca.upper(), ca)
        normalized.append(qn)
    return normalized
from uuid import uuid4
@api_router.post("/admin/questions")
async def create_question(question_data: QuestionCreate, admin: User = Depends(get_admin_user)):
    qid = str(uuid4())

    # options massivini formalaşdır
    if question_data.options:
        options = [opt for opt in question_data.options if opt]
    else:
        options = [question_data.option_a, question_data.option_b, question_data.option_c, question_data.option_d]
        options = [opt for opt in options if opt]  # boşları atırıq

    # correct_answer tipini və aralığını yoxla
    try:
        correct_index = int(question_data.correct_answer)
    except Exception:
        raise HTTPException(status_code=422, detail="correct_answer rəqəm olmalıdır (0-3)")
    if correct_index < 0 or correct_index >= len(options):
        raise HTTPException(status_code=422, detail="correct_answer variantların intervalında deyil")

    question_dict = {
        "id": qid,
        "category": question_data.category,
        "question_text": question_data.question_text,
        "options": options,
        "correct_answer": correct_index,
        "explanation": question_data.explanation
    }

    insert_result = await db.questions.insert_one(question_dict)
    created = await db.questions.find_one({"_id": insert_result.inserted_id})
    return parse_from_mongo(created)


 

# Initialize sample data
 

 

@api_router.post("/init-data")
async def initialize_data():
    # 1. Check if questions already exist
    existing_questions = await db.questions.count_documents({})
    if existing_questions > 0:
        return {"message": "Məlumatlar artıq mövcuddur"}
    
    # 2. Insert sample questions
    for question_data in sample_questions:
        question = Question(**question_data)
        question_dict = prepare_for_mongo(question.dict())
        await db.questions.insert_one(question_dict)
    
    # 3. Create admin user
    admin_user = User(
        email="admin@pythontest.az",
        full_name="Admin",
        bio="Python Test Platforması Admini",
        is_admin=True
    )
    
    admin_dict = admin_user.dict()
    admin_dict["password"] = get_password_hash("admin123")  # plaintext -> hashed
    admin_dict = prepare_for_mongo(admin_dict)
    
    await db.users.insert_one(admin_dict)
    
    return {"message": "Məlumatlar uğurla əlavə edildi", "admin_email": "admin@pythontest.az", "admin_password": "admin123"}


# Include the router in the main app
app.include_router(api_router)

cors_env = os.environ.get('CORS_ORIGINS')
if not cors_env or cors_env.strip() == '*' or cors_env.strip() == '"*"':
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
else:
    allowed_origins = [o.strip() for o in cors_env.split(',') if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
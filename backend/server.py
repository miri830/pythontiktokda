from fastapi import FastAPI, APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta, timezone
import jwt
from passlib.context import CryptContext
import random
import base64
from io import BytesIO
from PIL import Image
from bson import ObjectId



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
    # Gamification
    xp: int = 0
    level: int = 1
    streak_current: int = 0
    streak_best: int = 0
    last_active: Optional[datetime] = None
    # Premium flag
    is_premium: bool = False
    # Notification preferences
    notify_new_questions: bool = True

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    bio: Optional[str] = ""
    notify_new_questions: Optional[bool] = True

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
    is_premium: Optional[bool] = False
    notify_new_questions: Optional[bool] = True

class UserQuestionSubmission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: str
    category: str
    question_text: str
    options: List[str]
    correct_answer: int
    explanation: str
    status: str = "pending"  # pending, approved, rejected
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None

class UserQuestionCreate(BaseModel):
    category: str
    question_text: str
    options: List[str]
    correct_answer: int
    explanation: str

class UserNotification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    message: str
    type: str = "info"  # info, success, warning, error
    read: bool = False
    question_id: Optional[str] = None  # For new question notifications
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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
    is_premium: Optional[bool] = False



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
    recent_users: List[Dict[str, Any]]

# User Quiz Models
class UserQuiz(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    creator_id: str
    creator_name: str
    title: str
    description: Optional[str] = ""
    category: str
    questions: List[Dict]  # List of question objects
    is_public: bool = True
    share_code: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    total_attempts: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserQuizCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    category: str
    questions: List[Dict]
    is_public: bool = True

class SharedQuizAttempt(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    quiz_id: str
    quiz_title: str
    quiz_creator_id: str
    solver_id: Optional[str] = None
    solver_name: str
    answers: Dict[int, int]  # question_index -> answer_index
    score: int
    percentage: float
    total_questions: int
    correct_answers: int
    completed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SharedQuizSubmission(BaseModel):
    answers: Dict[int, int]
    user_name: str

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
        conditions.append({"_id": str(ObjectId(question_id))})
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
        bio=user_data.bio,
        notify_new_questions=user_data.notify_new_questions if user_data.notify_new_questions is not None else True
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
class StartOptions(BaseModel):
    limit: Optional[int] = None
    premium_only: Optional[bool] = False
    specific_question_id: Optional[str] = None  # For single question tests

@api_router.post("/tests/start")
async def start_test(opts: Optional[StartOptions] = None, current_user: User = Depends(get_current_user)):
    print("Current user:", current_user)
    
    # Check if this is a single question test
    if opts and opts.specific_question_id:
        # Find the specific question
        try:
            specific_question = await db.questions.find_one({"_id": ObjectId(opts.specific_question_id)})
        except Exception:
            # Try with string id
            specific_question = await db.questions.find_one({"id": opts.specific_question_id})
        
        if not specific_question:
            raise HTTPException(status_code=404, detail="Sual tapılmadı")
        
        selected_questions = [specific_question]
    else:
        # Original logic for multiple questions
        # Mövcud bazadan təsadüfi suallar seç (limit verilə bilər)
        # Premium rejim: premium istifadəçi üçün yalnız premium suallar; adi istifadəçi üçün premium suallar daxil edilməsin
        query = {}
        if not current_user.is_premium:
            query = {"is_premium": {"$ne": True}}
        elif opts and opts.premium_only:
            query = {"is_premium": True}
        all_questions = await db.questions.find(query).to_list(1000)
        if not all_questions:
            raise HTTPException(status_code=400, detail="Kifayət qədər sual yoxdur")
        requested = 8
        if opts and opts.limit:
            try:
                requested = max(1, int(opts.limit))
            except Exception:
                requested = 8
        if len(all_questions) < requested:
            requested = len(all_questions)
        selected_questions = random.sample(all_questions, requested)
    
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

# New endpoint for starting single question tests
@api_router.post("/tests/start-single-question/{question_id}")
async def start_single_question_test(question_id: str, current_user: User = Depends(get_current_user)):
    """Start a test with only a specific question - used for notification clicks"""
    opts = StartOptions(specific_question_id=question_id, limit=1)
    return await start_test(opts, current_user)

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

    # Ensure session is a dictionary and has the required structure
    if not isinstance(session, dict):
        raise HTTPException(status_code=404, detail="Test sessiyası düzgün formatda deyil")

    user_answers = session.get("answers", {})

    questions_with_answers = []
    correct_count = 0
    
    # Safely get questions list with proper type checking
    questions_data = session.get("questions", [])
    if not isinstance(questions_data, list):
        questions_data = []
    
    total = len(questions_data)

    # Iterate through questions with proper type checking
    for qid in questions_data:
        # Normalize qid to ObjectId if possible
        try:
            q_obj_id = ObjectId(qid)
        except Exception:
            q_obj_id = qid

        question = await db.questions.find_one({"_id": q_obj_id})
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

        # user's answer for this question (may be None)
        raw_user_answer = user_answers.get(str(qid))
        if raw_user_answer is None:
            user_index = None
            is_correct = False
        else:
            user_index = int(raw_user_answer) if isinstance(raw_user_answer, str) else raw_user_answer
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

    # Update user aggregate stats + gamification
    user_doc = await db.users.find_one({"id": current_user.id})
    if user_doc:
        prev_total = int(user_doc.get("total_tests", 0))
        prev_avg = float(user_doc.get("average_score", 0.0))
        new_total = prev_total + 1
        # weighted average by number of tests
        new_avg = ((prev_avg * prev_total) + percentage) / new_total if new_total > 0 else percentage
        # XP gain: base = correct answers, bonus for high score
        xp_gain = correct_count + (10 if percentage >= 80 else 0) + (5 if percentage >= 60 and percentage < 80 else 0)
        now_dt = datetime.now(timezone.utc)
        last_active = user_doc.get("last_active")
        streak_current = int(user_doc.get("streak_current", 0))
        streak_best = int(user_doc.get("streak_best", 0))
        # Streak logic: if last_active is yesterday (UTC), increment; if today, keep; else reset
        def date_only(dt):
            return dt.astimezone(timezone.utc).date() if isinstance(dt, datetime) else None
        today = now_dt.date()
        if last_active:
            last_date = date_only(last_active)
            if last_date and last_date == today:
                pass
            elif last_date and (today - last_date).days == 1:
                streak_current += 1
            else:
                streak_current = 1
        else:
            streak_current = 1
        streak_best = max(streak_best, streak_current)
        new_xp = int(user_doc.get("xp", 0)) + xp_gain
        # Simple level curve: level up every 100 xp
        new_level = max(1, int(new_xp // 100) + 1)
        await db.users.update_one(
            {"id": current_user.id},
            {"$set": {
                "total_tests": new_total,
                "average_score": new_avg,
                "xp": new_xp,
                "level": new_level,
                "streak_current": streak_current,
                "streak_best": streak_best,
                "last_active": now_dt
            }}
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


# Gamification summary for Dashboard
@api_router.get("/gamification/summary")
async def gamification_summary(current_user: User = Depends(get_current_user)):
    now_dt = datetime.now(timezone.utc)
    start_of_day = datetime(now_dt.year, now_dt.month, now_dt.day, tzinfo=timezone.utc)
    start_of_week = start_of_day - timedelta(days=start_of_day.weekday())

    # Aggregate test counts today and this week
    daily_count = await db.test_results.count_documents({
        "user_id": current_user.id,
        "completed_at": {"$gte": start_of_day}
    })
    weekly_count = await db.test_results.count_documents({
        "user_id": current_user.id,
        "completed_at": {"$gte": start_of_week}
    })

    # Targets
    daily_target = 1
    weekly_target = 5

    # Load fresh user doc for xp/level/streak
    user_doc = await db.users.find_one({"id": current_user.id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="İstifadəçi tapılmadı")
    xp = int(user_doc.get("xp", 0))
    level = int(user_doc.get("level", 1))
    streak_current = int(user_doc.get("streak_current", 0))
    streak_best = int(user_doc.get("streak_best", 0))
    # XP to next level
    next_level_at = level * 100
    xp_in_level = xp - ((level - 1) * 100)
    xp_progress = max(0, min(100, int((xp_in_level / 100) * 100)))

    return {
        "level": level,
        "xp": xp,
        "xp_progress": xp_progress,
        "streak_current": streak_current,
        "streak_best": streak_best,
        "daily": {"done": daily_count, "target": daily_target},
        "weekly": {"done": weekly_count, "target": weekly_target}
    }


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

    # Yoxdursa, bütün suallar üzrə nəticəni hesabla (cavablanmayanlar da daxil)
    # Check if session is a valid dict
    if not isinstance(session, dict):
        raise HTTPException(status_code=404, detail="Test sessiyası düzgün formatda deyil")
        
    user_answers = session.get("answers", {})

    questions_with_answers = []
    correct_count = 0
    # Safely get questions list
    questions_list = session.get("questions", [])
    if not isinstance(questions_list, list):
        questions_list = []
    total = len(questions_list)

    for qid in questions_list:
        try:
            q_obj_id = ObjectId(qid)
        except Exception:
            q_obj_id = qid

        question = await db.questions.find_one({"_id": q_obj_id})
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

        raw_user_answer = user_answers.get(str(qid))
        if raw_user_answer is None:
            user_index = None
            is_correct = False
        else:
            user_index = int(raw_user_answer) if isinstance(raw_user_answer, str) else raw_user_answer
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
    users_raw = await users_cursor.to_list(1000)
    users = [parse_from_mongo(user) for user in users_raw]
    
    leaderboard = []
    for i, user in enumerate(users):
        # Ensure user is a dictionary before accessing keys
        if isinstance(user, dict):
            # Safely convert average_score to float
            avg_score_raw = user.get("average_score", 0.0)
            try:
                # Check if it's a valid type for float conversion
                if isinstance(avg_score_raw, (int, float, str)):
                    avg_score = float(avg_score_raw)
                else:
                    avg_score = 0.0
            except (ValueError, TypeError):
                avg_score = 0.0
                
            leaderboard.append({
                "rank": i + 1,
                "id": user.get("id", ""),
                "full_name": user.get("full_name", ""),
                "bio": user.get("bio", ""),
                "profile_image": user.get("profile_image"),
                "total_tests": user.get("total_tests", 0),
                "average_score": round(avg_score, 1),
                "is_premium": user.get("is_premium", False)
            })
        else:
            # Fallback for unexpected user data type
            leaderboard.append({
                "rank": i + 1,
                "id": "",
                "full_name": "",
                "bio": "",
                "profile_image": None,
                "total_tests": 0,
                "average_score": 0.0,
                "is_premium": False
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
    recent_tests_raw = await recent_tests_cursor.to_list(1000)
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
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Yalnız şəkil faylları qəbul edilir")
    
    # Read and process image
    image_data = await file.read()
    image = Image.open(BytesIO(image_data))
    # JPEG yazmaq üçün şəkli uyğun moda çevir (P, RGBA və s. -> RGB)
    if image.mode not in ("RGB",):
        image = image.convert("RGB")
    
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

# Update bio
class BioUpdate(BaseModel):
    bio: str

@api_router.post("/profile/update-bio")
async def update_bio(payload: BioUpdate, current_user: User = Depends(get_current_user)):
    safe_bio = (payload.bio or "").strip()
    # Limit length to avoid abuse
    if len(safe_bio) > 500:
        raise HTTPException(status_code=422, detail="Bio 500 simvoldan uzun ola bilməz")

    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"bio": safe_bio}}
    )
    return {"bio": safe_bio}

# Update full name
class NameUpdate(BaseModel):
    full_name: str

@api_router.post("/profile/update-name")
async def update_name(payload: NameUpdate, current_user: User = Depends(get_current_user)):
    safe_name = (payload.full_name or "").strip()
    if len(safe_name) < 2 or len(safe_name) > 100:
        raise HTTPException(status_code=422, detail="Ad 2-100 simvol arası olmalıdır")
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"full_name": safe_name}}
    )
    return {"full_name": safe_name}

# User question submission
@api_router.post("/submit-question")
async def submit_question(question_data: UserQuestionCreate, current_user: User = Depends(get_current_user)):
    # Create user question submission
    submission = UserQuestionSubmission(
        user_id=current_user.id,
        user_name=current_user.full_name,
        category=question_data.category,
        question_text=question_data.question_text,
        options=question_data.options,
        correct_answer=question_data.correct_answer,
        explanation=question_data.explanation
    )
    
    submission_dict = prepare_for_mongo(submission.dict())
    await db.user_question_submissions.insert_one(submission_dict)
    
    return {"message": "Sualınız təsdiqlənmək üçün göndərildi", "submission_id": submission.id}

@api_router.post("/profile/update-notification-settings")
async def update_notification_settings(settings: dict, current_user: User = Depends(get_current_user)):
    # Update user notification preferences
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"notify_new_questions": settings.get("notify_new_questions", True)}}
    )
    
    # Get updated user data
    updated_user = await db.users.find_one({"id": current_user.id})
    
    return {
        "message": "Bildiri\u015f t\u0259nziml\u0259m\u0259l\u0259ri yenil\u0259ndi",
        "notify_new_questions": updated_user.get("notify_new_questions", True) if updated_user else True
    }

# User notifications
@api_router.get("/notifications")
async def get_notifications(current_user: User = Depends(get_current_user)):
    notifications_cursor = db.user_notifications.find({"user_id": current_user.id}).sort("created_at", -1).limit(20)
    notifications_raw = await notifications_cursor.to_list(1000)
    notifications = [parse_from_mongo(notif) for notif in notifications_raw]
    return notifications

@api_router.post("/notifications/{notification_id}/mark-read")
async def mark_notification_read(notification_id: str, current_user: User = Depends(get_current_user)):
    await db.user_notifications.update_one(
        {"id": notification_id, "user_id": current_user.id},
        {"$set": {"read": True}}
    )
    return {"message": "Bildiriş oxundu olaraq işarələndi"}

# Test endpoint to create sample notifications
@api_router.post("/test/create-notification")
async def create_test_notification(current_user: User = Depends(get_current_user)):
    # Create a test notification for the user
    notification = UserNotification(
        user_id=current_user.id,
        title="Test Bildirişi! 🚀",
        message="Bu bir test bildirişidir. Bildiriş sistemi düzgün işləyir!",
        type="info"
    )
    await db.user_notifications.insert_one(prepare_for_mongo(notification.dict()))
    return {"message": "Test bildirişi yaradıldı", "notification_id": notification.id}

# Admin routes
@api_router.get("/admin/question-submissions")
async def get_question_submissions(admin: User = Depends(get_admin_user)):
    submissions_cursor = db.user_question_submissions.find().sort("submitted_at", -1)
    submissions_raw = await submissions_cursor.to_list(1000)
    submissions = [parse_from_mongo(sub) for sub in submissions_raw]
    return submissions

@api_router.post("/admin/question-submissions/{submission_id}/approve")
async def approve_question_submission(submission_id: str, admin: User = Depends(get_admin_user)):
    # Get submission
    submission = await db.user_question_submissions.find_one({"id": submission_id})
    if not submission:
        raise HTTPException(status_code=404, detail="Sual təqdimi tapılmadı")
    
    # Create question from submission
    question_data = {
        "category": submission["category"],
        "question_text": submission["question_text"],
        "options": submission["options"],
        "correct_answer": submission["correct_answer"],
        "explanation": submission["explanation"],
        "is_premium": False,
        "created_at": datetime.now(timezone.utc)
    }
    
    qid = str(uuid4())
    question_data["id"] = qid
    
    # Insert question
    await db.questions.insert_one(prepare_for_mongo(question_data))
    
    # Update submission status
    await db.user_question_submissions.update_one(
        {"id": submission_id},
        {"$set": {
            "status": "approved",
            "reviewed_at": datetime.now(timezone.utc),
            "reviewed_by": admin.id
        }}
    )
    
    # Send notification to user who submitted
    notification = UserNotification(
        user_id=submission["user_id"],
        title="Sualınız təsdiqləndi! 🎉",
        message=f"'{submission['question_text'][:50]}...' sualınız təsdiqləndi və sistemə əlavə olundu.",
        type="success"
    )
    await db.user_notifications.insert_one(prepare_for_mongo(notification.dict()))
    
    # Send notification to all users who want to be notified about new questions
    users_to_notify = db.users.find({"notify_new_questions": True})
    async for user in users_to_notify:
        if user["id"] != submission["user_id"]:  # Don't send to the submitter again
            new_question_notification = UserNotification(
                user_id=user["id"],
                title="Yeni sual əlavə olundu! 📚",
                message=f"Yeni sual sistemə əlavə edildi: '{submission['question_text'][:50]}...' - Kateqoriya: {submission['category']}",
                type="info",
                question_id=qid  # Add the question ID for single question tests
            )
            await db.user_notifications.insert_one(prepare_for_mongo(new_question_notification.dict()))
    
    return {"message": "Sual təsdiqləndi və əlavə olundu", "question_id": qid}

@api_router.post("/admin/question-submissions/{submission_id}/reject")
async def reject_question_submission(submission_id: str, admin: User = Depends(get_admin_user)):
    # Get submission
    submission = await db.user_question_submissions.find_one({"id": submission_id})
    if not submission:
        raise HTTPException(status_code=404, detail="Sual təqdimi tapılmadı")
    
    # Update submission status
    await db.user_question_submissions.update_one(
        {"id": submission_id},
        {"$set": {
            "status": "rejected",
            "reviewed_at": datetime.now(timezone.utc),
            "reviewed_by": admin.id
        }}
    )
    
    # Send notification to user
    notification = UserNotification(
        user_id=submission["user_id"],
        title="Sualınız ləğv edildi 😔",
        message=f"'{submission['question_text'][:50]}...' sualınız təsdiqlənmədi. Zəhmət olmasa daha keyfiyyətli suallar göndərin.",
        type="warning"
    )
    await db.user_notifications.insert_one(prepare_for_mongo(notification.dict()))
    
    return {"message": "Sual ləğv edildi"}

@api_router.get("/admin/stats")
async def get_admin_stats(admin: User = Depends(get_admin_user)):
    total_users = await db.users.count_documents({})
    total_questions = await db.questions.count_documents({})
    total_tests = await db.test_results.count_documents({})
    
    recent_users_cursor = db.users.find(
        {},
        {"password": 0}
    ).sort("created_at", -1).limit(10)
    recent_users_raw = await recent_users_cursor.to_list(1000)
    recent_users = [parse_from_mongo(user) for user in recent_users_raw]
    
    # Ensure recent_users is a list of dictionaries
    recent_users_dicts = []
    for user in recent_users:
        if isinstance(user, dict):
            recent_users_dicts.append(user)
        else:
            # Convert to dict if it's not already
            recent_users_dicts.append({"id": str(user) if user else ""})
    
    return AdminStats(
        total_users=total_users,
        total_questions=total_questions,
        total_tests=total_tests,
        recent_users=recent_users_dicts
    )

@api_router.get("/admin/users")
async def get_all_users(admin: User = Depends(get_admin_user)):
    users_cursor = db.users.find({}, {"password": 0})
    users_raw = await users_cursor.to_list(1000)
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

@api_router.post("/admin/users/{user_id}/toggle-premium")
async def toggle_premium(user_id: str, admin: User = Depends(get_admin_user)):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="İstifadəçi tapılmadı")
    new_value = not bool(user.get("is_premium", False))
    await db.users.update_one({"id": user_id}, {"$set": {"is_premium": new_value}})
    return {"is_premium": new_value}

@api_router.get("/admin/questions")
async def get_all_questions(admin: User = Depends(get_admin_user)):
    questions_cursor = db.questions.find()
    questions_raw = await questions_cursor.to_list(1000)
    normalized = []
    for q in questions_raw:
        qn = parse_from_mongo(dict(q))
        # Ensure id field is present
        if 'id' not in qn and isinstance(qn, dict):
            _id = q.get('_id')
            if _id is not None:
                try:
                    qn['id'] = str(_id)
                except Exception:
                    pass
        # Ensure options array exists for UI
        if isinstance(qn, dict) and ('options' not in qn or not isinstance(qn.get('options'), list)):
            opts = [qn.get('option_a'), qn.get('option_b'), qn.get('option_c'), qn.get('option_d')]
            qn['options'] = [o for o in opts if o is not None]
        # Normalize correct_answer to int index
        if isinstance(qn, dict):
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
        "explanation": question_data.explanation,
        "is_premium": bool(question_data.is_premium)
    }

    insert_result = await db.questions.insert_one(question_dict)
    created = await db.questions.find_one({"_id": insert_result.inserted_id})
    
    # Send notification to all users who want to be notified about new questions
    users_to_notify = db.users.find({"notify_new_questions": True})
    async for user in users_to_notify:
        new_question_notification = UserNotification(
            user_id=user["id"],
            title="Yeni sual əlavə olundu! 📚",
            message=f"Admin tərəfindən yeni sual əlavə edildi: '{question_data.question_text[:50]}...' - Kateqoriya: {question_data.category}",
            type="info",
            question_id=qid  # Add the question ID for single question tests
        )
        await db.user_notifications.insert_one(prepare_for_mongo(new_question_notification.dict()))
    
    return parse_from_mongo(created)


# Admin: 500 sualı 17 mövzu üzrə seed et
class SeedRequest(BaseModel):
    total: int = 500

@api_router.post("/admin/seed-questions")
async def seed_questions(req: dict, admin: User = Depends(get_admin_user)):
    raise HTTPException(status_code=410, detail="Bu endpoint deaktiv edilib")


 

# Initialize sample data
 

 

@api_router.post("/init-data")
async def initialize_data():
    # 1. Check if questions already exist
    existing_questions = await db.questions.count_documents({})
    if existing_questions > 0:
        return {"message": "Məlumatlar artıq mövcuddur"}
    
    # 2. Insert Informatika topics sample questions (17 kateqoriya)
    topics_questions = [
        {"category": "İnformasiya və informasiya prosesləri", "question_text": "İnformasiya nədir?", "options": ["Məlumatın mənalandırılmış forması", "Yalnız rəqəmlər", "Təsadüfi simvollar", "Səs faylı"], "correct_answer": 0, "explanation": "İnformasiya – istifadəçi üçün mənası olan məlumatdır."},
        {"category": "Say sistemləri", "question_text": "İkiyəlik say sistemində 1010 hansı ədədə bərabərdir?", "options": ["8", "9", "10", "12"], "correct_answer": 2, "explanation": "1010(2) = 10(10)."},
        {"category": "İnformasiyanın kodlaşdırılması və miqdarının ölçülməsi", "question_text": "1 bayt neçə bitdən ibarətdir?", "options": ["4", "8", "16", "32"], "correct_answer": 1, "explanation": "1 bayt = 8 bit."},
        {"category": "Modelləşdirmə", "question_text": "Model nədir?", "options": ["Orijinal obyektin sadələşdirilmiş təsviri", "Proqram", "Cədvəl", "Format"], "correct_answer": 0, "explanation": "Model – obyektin və ya prosesin mühüm cəhətlərini əks etdirən təsviridir."},
        {"category": "Kompüterin aparat təminatı", "question_text": "RAM nə üçün istifadə olunur?", "options": ["Daimi yaddaş", "Müvəqqəti işləmə yaddaşı", "İnternet bağlantısı", "Qrafika emalı"], "correct_answer": 1, "explanation": "RAM prosessorun işlədiyi məlumatları müvəqqəti saxlayır."},
        {"category": "Kompüterin proqram təminatı", "question_text": "Aşağıdakılardan hansı sistem proqramıdır?", "options": ["Brauzer", "Antivirus", "Əməliyyat sistemi", "Tekst redaktoru"], "correct_answer": 2, "explanation": "ƏS sistem proqram təminatıdır."},
        {"category": "Əməliyyat sistemi", "question_text": "ƏS-in əsas funksiyası nədir?", "options": ["Qrafik çəkmək", "Proqram tərtibi", "Resursların idarə edilməsi", "Musiqi oxutmaq"], "correct_answer": 2, "explanation": "ƏS kompüter resurslarını idarə edir."},
        {"category": "Mətnlərin email", "question_text": "Email göndərərkən “Mövzu” sahəsi nə üçündür?", "options": ["Fayl əlavə etmək", "Məktubun başlığını yazmaq", "Şəkil yerləşdirmək", "Gizli surət"], "correct_answer": 1, "explanation": "Mövzu – məktubun başlığıdır."},
        {"category": "Elektron cədvəllər", "question_text": "Excel-də cəmi hesablamaq üçün hansı funksiya istifadə olunur?", "options": ["AVERAGE", "SUM", "COUNT", "MAX"], "correct_answer": 1, "explanation": "SUM – cəmləmə funksiyasıdır."},
        {"category": "Verilənlər bazası", "question_text": "SQL-də cədvəldən bütün sətirləri seçən əmri qeyd edin.", "options": ["GET * FROM", "PULL *", "SELECT * FROM", "FETCH ALL"], "correct_answer": 2, "explanation": "SELECT * FROM table – bütün sətirləri seçir."},
        {"category": "Kompüter qrafikası", "question_text": "Vektor qrafikasının xüsusiyyəti nədir?", "options": ["Piksellərdən ibarətdir", "Koordinat və əyrilərə əsaslanır", "Rəng dərinliyi yoxdur", "Yaddaş tələb etmir"], "correct_answer": 1, "explanation": "Vektor qrafika riyazi təsvirlərdən istifadə edir."},
        {"category": "Alqoritm", "question_text": "Alqoritmin əsas xassəsi hansıdır?", "options": ["Təsadüfilik", "Müəyyənlik", "Sonsuzluq", "Belirsizlik"], "correct_answer": 1, "explanation": "Alqoritm addımlarının mənası aydın olmalıdır (müəyyənlik)."},
        {"category": "Proqramlaşdırma", "question_text": "Yüksək səviyyəli dillərin üstünlüyü nədir?", "options": ["Maşın kodudur", "İnsana daha yaxın sintaksis", "Yavaş işləyir", "Portativ deyil"], "correct_answer": 1, "explanation": "Yüksək səviyyəli dillər oxunaqlıdır və daşınandır."},
        {"category": "Kompüter şəbəkəsi", "question_text": "IP ünvan nədir?", "options": ["Email ünvanı", "Fiziki ünvan", "Şəbəkədə cihazın unikal identifikatoru", "DNS adı"], "correct_answer": 2, "explanation": "IP – şəbəkədə identifikator rolunu oynayır."},
        {"category": "İnternet", "question_text": "HTTP nədir?", "options": ["Proqramlaşdırma dili", "Şəbəkə protokolu", "Brauzer", "Ağ kart"], "correct_answer": 1, "explanation": "HTTP – veb üçün tətbiq səviyyəli protokoldur."},
        {"category": "Veb-proqramlaşdırma", "question_text": "HTML nədir?", "options": ["Stil dili", "Ssenari dili", "İşarələmə dili", "Baza dili"], "correct_answer": 2, "explanation": "HTML – veb səhifənin strukturunu təsvir edir."},
        {"category": "İnformasiya təhlükəsizliyi", "question_text": "Parol üçün ən yaxşı praktika hansıdır?", "options": ["Qısa və sadə", "Hər yerdə eyni", "Uzun və mürəkkəb", "Heç vaxt dəyişməmək"], "correct_answer": 2, "explanation": "Uzun və mürəkkəb parollar daha təhlükəsizdir."}
    ]

    for question_data in topics_questions:
        question = Question(**question_data)
        question_dict = prepare_for_mongo(question.dict())
        await db.questions.insert_one(question_dict)
    
    # 3. Create admin user
    admin_user = User(
        email="admin@pythontest.az",
        full_name="Admin",
        bio="İnformatika testləri admini",
        is_admin=True
    )
    
    admin_dict = admin_user.dict()
    admin_dict["password"] = get_password_hash("admin123")  # plaintext -> hashed
    admin_dict = prepare_for_mongo(admin_dict)
    
    await db.users.insert_one(admin_dict)
    
    return {"message": "Məlumatlar uğurla əlavə edildi", "admin_email": "admin@pythontest.az", "admin_password": "admin123"}

# User Quiz Endpoints
@api_router.post("/user-quizzes/create")
async def create_user_quiz(quiz_data: UserQuizCreate, current_user: User = Depends(get_current_user)):
    quiz = UserQuiz(
        creator_id=current_user.id,
        creator_name=current_user.full_name,
        **quiz_data.dict()
    )
    
    quiz_dict = prepare_for_mongo(quiz.dict())
    result = await db.user_quizzes.insert_one(quiz_dict)
    
    # Return the created quiz with share_code
    created_quiz = await db.user_quizzes.find_one({"id": quiz.id})
    normalized_quiz = parse_from_mongo(created_quiz)
    
    return {
        "message": "Quiz uğurla yaradıldı", 
        "quiz_id": quiz.id,
        "quiz": normalized_quiz
    }

@api_router.get("/user-quizzes/my-quizzes")
async def get_my_quizzes(current_user: User = Depends(get_current_user)):
    quizzes_cursor = db.user_quizzes.find({"creator_id": current_user.id})
    quizzes = await quizzes_cursor.to_list(1000)
    
    normalized_quizzes = []
    for quiz in quizzes:
        quiz_data = parse_from_mongo(quiz)
        # Get attempt count
        quiz_id = quiz_data.get("id", "") if isinstance(quiz_data, dict) else ""
        attempt_count = await db.shared_quiz_attempts.count_documents({"quiz_id": quiz_id})
        if isinstance(quiz_data, dict):
            quiz_data["total_attempts"] = attempt_count
        normalized_quizzes.append(quiz_data)
    
    return normalized_quizzes

@api_router.get("/shared-quiz/{share_code}")
async def get_shared_quiz(share_code: str):
    quiz = await db.user_quizzes.find_one({"share_code": share_code})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz tapılmadı")
    
    quiz_data = parse_from_mongo(quiz)
    # Don't include correct answers in the response
    if isinstance(quiz_data, dict) and "questions" in quiz_data:
        for question in quiz_data.get("questions", []):
            if isinstance(question, dict):
                if "correct_answer" in question:
                    del question["correct_answer"]
                if "explanation" in question:
                    del question["explanation"]
    
    return quiz_data

@api_router.post("/shared-quiz/{share_code}/submit")
async def submit_shared_quiz(share_code: str, submission: SharedQuizSubmission):
    # Get the quiz with correct answers
    quiz = await db.user_quizzes.find_one({"share_code": share_code})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz tapılmadı")
    
    quiz_data = parse_from_mongo(quiz)
    
    # Calculate score
    total_questions = len(quiz_data.get("questions", [])) if isinstance(quiz_data, dict) else 0
    correct_answers = 0
    
    if isinstance(quiz_data, dict) and "questions" in quiz_data:
        for question_index, user_answer in submission.answers.items():
            if question_index < len(quiz_data["questions"]):
                question = quiz_data["questions"][question_index]
                if isinstance(question, dict) and "correct_answer" in question:
                    correct_answer = question["correct_answer"]
                    if user_answer == correct_answer:
                        correct_answers += 1
    
    score = int((correct_answers / total_questions) * 100) if total_questions > 0 else 0
    
    # Save attempt
    # Safely extract values with proper type checking
    quiz_id = ""
    quiz_title = ""
    quiz_creator_id = ""
    
    if isinstance(quiz_data, dict):
        quiz_id = str(quiz_data.get("id", "")) if quiz_data.get("id") is not None else ""
        quiz_title = str(quiz_data.get("title", "")) if quiz_data.get("title") is not None else ""
        quiz_creator_id = str(quiz_data.get("creator_id", "")) if quiz_data.get("creator_id") is not None else ""
    
    attempt = SharedQuizAttempt(
        quiz_id=quiz_id,
        quiz_title=quiz_title,
        quiz_creator_id=quiz_creator_id,
        solver_name=submission.user_name,
        answers=submission.answers,
        score=score,
        percentage=score,
        total_questions=total_questions,
        correct_answers=correct_answers
    )
    
    attempt_dict = prepare_for_mongo(attempt.dict())
    await db.shared_quiz_attempts.insert_one(attempt_dict)
    
    # Update quiz attempt count
    if quiz_id:
        await db.user_quizzes.update_one(
            {"id": quiz_id},
            {"$inc": {"total_attempts": 1}}
        )
    
    # Send notification to quiz creator
    if quiz_creator_id:
        notification = UserNotification(
            user_id=quiz_creator_id,
            title="Quiz Həll Edildi! 🎉",
            message=f"{submission.user_name} adlı istifadəçi \"{quiz_title}\" quizinizi həll etdi və {score}% nəticə əldə etdi.",
            type="success"
        )
        
        notification_dict = prepare_for_mongo(notification.dict())
        await db.notifications.insert_one(notification_dict)
    
    # Return results with correct answers for review
    questions = quiz_data.get("questions", []) if isinstance(quiz_data, dict) else []
    return {
        "score": score,
        "percentage": score,
        "correct_answers": correct_answers,
        "total_questions": total_questions,
        "questions_with_answers": questions
    }

@api_router.get("/quiz-stats/{quiz_id}")
async def get_quiz_stats(quiz_id: str, current_user: User = Depends(get_current_user)):
    # Verify ownership
    quiz = await db.user_quizzes.find_one({"id": quiz_id, "creator_id": current_user.id})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz tapılmadı və ya icazəniz yoxdur")
    
    # Get all attempts
    attempts_cursor = db.shared_quiz_attempts.find({"quiz_id": quiz_id})
    attempts = await attempts_cursor.to_list(1000)
    
    quiz_title = quiz.get("title", "") if isinstance(quiz, dict) else ""
    
    if not attempts:
        return {
            "quiz_title": quiz_title,
            "total_attempts": 0,
            "average_score": 0,
            "attempts": []
        }
    
    # Calculate statistics
    total_attempts = len(attempts)
    total_score = 0
    for attempt in attempts:
        if isinstance(attempt, dict) and "score" in attempt:
            total_score += attempt["score"]
    average_score = total_score / total_attempts if total_attempts > 0 else 0
    
    normalized_attempts = []
    for attempt in attempts:
        attempt_data = parse_from_mongo(attempt)
        normalized_attempts.append(attempt_data)
    
    return {
        "quiz_title": quiz_title,
        "total_attempts": total_attempts,
        "average_score": round(average_score, 1),
        "attempts": normalized_attempts
    }

@api_router.delete("/user-quizzes/{quiz_id}")
async def delete_user_quiz(quiz_id: str, current_user: User = Depends(get_current_user)):
    # Verify ownership
    result = await db.user_quizzes.delete_one({"id": quiz_id, "creator_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Quiz tapılmadı və ya icazəniz yoxdur")
    
    # Also delete related attempts
    await db.shared_quiz_attempts.delete_many({"quiz_id": quiz_id})
    
    return {"message": "Quiz uğurla silindi"}


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
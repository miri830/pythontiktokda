# Here are your Instructions
# Backend qovluğuna keç
cd pythontiktokda-main

cd backend

# Python virtual environment yarat
python -m venv venv

# Virtual environment aktivləşdir

# Windows üçün:
venv\Scripts\Activate.ps1

# Mac/Linux üçün:
source venv/bin/activate

# Kitabxanaları yüklə
pip install -r requirements.txt

# Backend işə sal
uvicorn server:app --reload --host 0.0.0.0 --port 8001
# Yeni terminal tab aç: Ctrl + Shift + `   



# Frontend qovluğuna keç
cd frontend

# Node.js paketlərini yüklə
yarn install

# Frontend işə sal
yarn start
1111
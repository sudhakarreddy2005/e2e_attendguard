# 🎓 AttendGuard  
## Student Attendance Violation Detection System

(feat: Enhance Detect and Violations pages with new UI elements, file upload functionality, and improved data handling)

It leverages a ResNet-based deep learning model through the `face_recognition` library to generate 128-dimensional face embeddings for robust and reliable identity matching.



## 📌 Project Overview

AttendGuard automates attendance violation monitoring by :

- Registering students with validated face images
- Extracting deep learning facial embeddings (128-d vectors)
- Matching captured images against stored embeddings
- Calculating similarity using Euclidean distance
- Logging confirmed violations into the database
- Displaying both captured and registered images in the frontend

This system is suitable for campus security monitoring, attendance tracking, and smart surveillance applications.



## 🚀 Key Features

- Deep Learning Face Recognition (ResNet – dlib)
- 128-Dimensional Face Embedding Storage
- JWT-Based Authentication
- Student Registration with Face Validation (Single Face Enforcement)
- Real-Time Image Matching with Confidence Score
- Violation Confirmation Workflow
- Automatic Bunk Count Increment
- MongoDB Integration
- Secure Secret Key Handling via `.env`
- Training Folder & Database Synchronization



## 🧠 Face Recognition Pipeline

### Registration Phase
1. User uploads a student image.
2. System validates exactly one face in the image.
3. Extracts a 128-dimensional embedding vector.
4. Stores:
   - Student metadata
   - Embedding vector
   - Image filename
   - Status and timestamps

### Matching Phase
1. User uploads a captured image.
2. System extracts face encoding.
3. Compares with stored embeddings using Euclidean distance.
4. Identifies best match if distance < threshold (default 0.45).
5. Calculates confidence:

Confidence = (1 − Distance) × 100

6. Returns matched student details and image references.
7. On confirmation, violation is recorded in MongoDB.



## 🏗 System Architecture

Frontend (React.js)  
↓  
Flask Backend (REST API)  
↓  
Deep Learning Face Recognition (ResNet via dlib)  
↓  
MongoDB Database  
↓  
File Storage (training / uploads)


## 📂 Project Structure

```
e2e/
│
├── backend/
│   ├── app.py
│   ├── validate_pipeline.py
│   ├── storage/
│   │   ├── training/
│   │   └── uploads/
│   ├── start.sh
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   └── App.jsx
│   ├── package.json
│   └── public/
│
└── README.md
```




## 🛠 Technology Stack

### Backend
- Python
- Flask
- MongoDB
- PyMongo
- face_recognition (dlib ResNet Model)
- NumPy
- JWT Authentication

### Frontend
- React.js
- Axios
- JavaScript (ES6+)

### Database
- MongoDB
  - students
  - violations
  - users



## ⚙️ Installation Guide

### 1️⃣ Clone Repository

git clone https://github.com/your-username/e2e.git  
cd e2e



### 2️⃣ Backend Setup

cd backend  
python3 -m venv venv  
source venv/bin/activate  
pip install -r requirements.txt  

Create a `.env` file inside backend folder:

MONGO_URL=mongodb://localhost:27017/  
APP_SECRET=your_secure_64_character_secret_key  
FACE_DISTANCE_THRESHOLD=0.45  

Run backend:

./start.sh  

Backend runs at:  
http://localhost:5000



### 3️⃣ Frontend Setup

cd frontend  
npm install  
npm run dev  

Frontend runs at:  
http://localhost:3000



## 🔐 API Endpoints

### Authentication
- POST /auth/register
- POST /auth/login

### Student Management
- POST /students
- GET /students
- GET /students/<student_id>
- POST /students/fix_pending

### Face Matching
- POST /match

### Violations
- POST /violations/confirm
- GET /violations



## 📊 Database Schema

### students Collection
- student_id (string)
- name (string)
- dept (string)
- year (string)
- mobile (string)
- embedding (array of 128 floats)
- image_filename (string)
- bunk_count (int)
- status (active / pending_image)
- created_at
- updated_at

### violations Collection
- student_id
- student_name
- location
- confidence
- distance
- capture_image
- registered_image
- timestamp



## 🔒 Security

- JWT-based protected routes
- Secure password hashing
- Minimum 32-character APP_SECRET validation
- `.env` excluded from Git
- Virtual environment excluded from repository
- Image validation for single-face enforcement



## 📈 Performance

- ResNet-based deep learning model
- 128D embeddings for strong facial discrimination
- Optimized threshold for high-accuracy matching
- Robust under lighting and pose variations



## 🎯 Applications

- Smart campus monitoring
- Automated attendance violation tracking
- AI-based identity verification
- Security surveillance systems
- Access control automation

---



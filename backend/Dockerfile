FROM python:3.10-slim

RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libgl1 \
    libglib2.0-0

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .
CMD ["gunicorn","app:app","--bind","0.0.0.0:8080","--workers","2","--threads","4","--timeout","120"]
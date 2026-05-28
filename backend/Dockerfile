FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Render задаёт $PORT; локально дефолтим 8000
ENV PORT=8000
EXPOSE 8000

# shell-форма чтобы $PORT раскрылся
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}

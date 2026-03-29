FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install --no-cache-dir --timeout=2000 -r requirements.txt
COPY . .
CMD ["sh", "-c", "python manage.py migrate && python manage.py seed_admin && python manage.py runserver 0.0.0.0:8000"]

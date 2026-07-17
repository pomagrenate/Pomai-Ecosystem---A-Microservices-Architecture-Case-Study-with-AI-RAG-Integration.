FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# The command will be overridden in docker-compose.yml (e.g. python api.py)
CMD ["python", "api.py"]

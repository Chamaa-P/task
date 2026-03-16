FROM python:3.11-alpine

WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir \
    docker==7.0.0 \
    requests==2.31.0

# Copy autoscaler script
COPY autoscaler.py .

CMD ["python", "-u", "autoscaler.py"]

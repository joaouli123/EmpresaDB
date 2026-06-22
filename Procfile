web: gunicorn src.api.main:app -k uvicorn.workers.UvicornWorker -w ${WEB_CONCURRENCY:-3} -b 0.0.0.0:${PORT:-8000} --timeout 120 --graceful-timeout 30
worker: python run_email_worker.py

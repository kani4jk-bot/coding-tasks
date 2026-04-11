# Running the Architecture Project

## Frontend
```bash
cd /home/kani/.openclaw/workspace/coding-tasks/tasks/2026-03-27-architecture-project
npm install
npm run dev -- --host 0.0.0.0 --port 3000
```

## Backend
```bash
cd /home/kani/.openclaw/workspace/coding-tasks/tasks/2026-03-27-architecture-project
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

## Notes
- This machine is likely CPU-only, so first model load may be very slow.
- Hugging Face model downloads can be several GB total.
- Backend default port: 5001
- Frontend default port: 3000

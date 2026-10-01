# SignMitra — Local Development Guide

Quick reference for starting the SignMitra backend and frontend locally on Windows.

## Project Location

```powershell
D:\Projects\SignMitra\signmitra
```

## 1. Start the Backend

Open a PowerShell terminal and run:

```powershell
cd D:\Projects\SignMitra\signmitra
.\backend\.venv\Scripts\Activate.ps1
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

Backend URL: http://127.0.0.1:8000

API documentation: http://127.0.0.1:8000/docs

Keep this terminal open while using the application.

## 2. Start the Frontend

Open a **second PowerShell terminal** and run:

```powershell
cd D:\Projects\SignMitra\signmitra
npm run dev
```

Frontend URL: http://localhost:3000

Keep this terminal open while using the application.

## 3. Stop the Servers

In each terminal, press:

```text
Ctrl + C
```

## Important Notes

* Start both backend and frontend to use the full application.
* Run the backend command from the project root, not from inside the `backend` folder.
* Keep environment variables and API keys in local `.env` files. Never commit or share them.






Wa iyyakum, bro! ❤️ Alhamdulillah, both servers are up and running.

* Frontend: [http://localhost:3000](http://localhost:3000) 

* Backend API: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) 

Keep both terminals open while using SignMitra. And that `GET /globals.css 404` is worth checking later if you notice styling missing—but your frontend itself is responding with `200`.

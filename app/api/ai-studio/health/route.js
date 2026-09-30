import { NextResponse } from 'next/server.js';

export async function GET() {
  const pythonBackendUrl = process.env.AI_BACKEND_URL || 'http://127.0.0.1:8000';
  try {
    const res = await fetch(`${pythonBackendUrl}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ ...data, backend_online: true, backend_url: pythonBackendUrl });
    }
  } catch (err) {
    // Backend offline or unreachable
  }

  return NextResponse.json({
    status: 'degraded',
    service: 'SignMitra Frontend API',
    database: 'offline',
    backend_online: false,
    backend_url: pythonBackendUrl,
    ai_provider: {
      provider: 'unconfigured',
      configured: false,
      status_message: 'Python FastAPI backend is offline. Run: python -m uvicorn backend.main:app --port 8000'
    },
    isl_engine: 'Model Checkpoint Required'
  });
}

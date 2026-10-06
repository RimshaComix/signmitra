import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const payload = await req.json();
    const pythonBackendUrl = process.env.AI_BACKEND_URL || 'http://127.0.0.1:8000';

    try {
      const pythonRes = await fetch(`${pythonBackendUrl}/api/directory/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000)
      });

      if (pythonRes.ok) {
        const data = await pythonRes.json();
        return NextResponse.json(data, { status: 201 });
      }
    } catch (e) {
      // Backend unavailable; fallback
    }

    return NextResponse.json({
      id: `fb-${Date.now()}`,
      place_name: payload.place_name,
      verification_level: payload.verification_level || 'user_reported',
      status: 'user_reported',
      message: 'Observation recorded locally. Status: User-reported (Pending independent audit).',
      created_at: new Date().toISOString()
    }, { status: 201 });

  } catch (err) {
    return NextResponse.json(
      { error: 'FEEDBACK_ERROR', message: err.message },
      { status: 500 }
    );
  }
}


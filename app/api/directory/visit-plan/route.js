import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const payload = await req.json();
    const pythonBackendUrl = process.env.AI_BACKEND_URL || 'http://127.0.0.1:8000';

    try {
      const pythonRes = await fetch(`${pythonBackendUrl}/api/directory/visit-plan`, {
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
      // Backend unavailable; echo back plan with a generated ID so frontend can continue locally
    }

    const planId = payload.id || `plan-${Date.now()}`;
    return NextResponse.json({
      ...payload,
      id: planId,
      created_at: new Date().toISOString(),
      backend_persisted: false
    }, { status: 201 });

  } catch (err) {
    return NextResponse.json(
      { error: 'FAILED_TO_SAVE_PLAN', message: err.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const pythonBackendUrl = process.env.AI_BACKEND_URL || 'http://127.0.0.1:8000';
    try {
      const pythonRes = await fetch(`${pythonBackendUrl}/api/directory/visit-plans`, {
        signal: AbortSignal.timeout(10000)
      });
      if (pythonRes.ok) {
        const data = await pythonRes.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      // Fallback
    }

    return NextResponse.json([]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


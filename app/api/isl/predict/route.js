import { NextResponse } from 'next/server';

const SEQUENCE_LENGTH = 30;
const FEATURES_PER_FRAME = 126;

function getIslPythonApiUrl() {
  return (
    process.env.ISL_PYTHON_API ||
    process.env.AI_BACKEND_URL ||
    'http://127.0.0.1:8000'
  ).replace(/\/+$/, '');
}

/**
 * GET /api/isl/predict
 * Queries the FastAPI `/health` endpoint to report honest model status
 * (MODEL READY vs MODEL NOT TRAINED vs MODEL UNAVAILABLE) to the frontend.
 */
export async function GET() {
  const baseUrl = getIslPythonApiUrl();
  try {
    const res = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4000),
      cache: 'no-store'
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          status: 'unavailable',
          backend_available: false,
          model_loaded: false,
          model: 'isl-lstm-v1',
          message: `FastAPI returned HTTP ${res.status}.`
        },
        { status: 503 }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      ...data,
      backend_available: true
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: 'unavailable',
        backend_available: false,
        model_loaded: false,
        model: 'isl-lstm-v1',
        message: 'FastAPI ISL service is unreachable. Start the Python server on port 8000.'
      },
      { status: 503 }
    );
  }
}

/**
 * POST /api/isl/predict
 * Validates that a (30, 126) landmark sequence is present and forwards it to
 * the Python FastAPI `/predict` endpoint. Never performs fake or fallback inference.
 */
export async function POST(req) {
  let payload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      {
        recognized: false,
        sign: null,
        message: 'Invalid JSON request body.'
      },
      { status: 400 }
    );
  }

  if (!payload || !Array.isArray(payload.sequence)) {
    return NextResponse.json(
      {
        recognized: false,
        sign: null,
        message: "Request body must include a 'sequence' array of 30 frames."
      },
      { status: 400 }
    );
  }

  const { sequence } = payload;
  if (
    sequence.length !== SEQUENCE_LENGTH ||
    !sequence.every(
      (frame) => Array.isArray(frame) && frame.length === FEATURES_PER_FRAME
    )
  ) {
    return NextResponse.json(
      {
        recognized: false,
        sign: null,
        message: `Invalid sequence shape: expected (${SEQUENCE_LENGTH}, ${FEATURES_PER_FRAME}).`
      },
      { status: 400 }
    );
  }

  const baseUrl = getIslPythonApiUrl();

  try {
    const res = await fetch(`${baseUrl}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sequence }),
      signal: AbortSignal.timeout(5000)
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const detail = data?.detail;
      const errMessage =
        typeof detail === 'object' && detail?.message
          ? detail.message
          : typeof detail === 'string'
          ? detail
          : data?.message || 'Model inference unavailable.';

      return NextResponse.json(
        {
          recognized: false,
          sign: null,
          model_loaded:
            typeof detail === 'object' && 'model_loaded' in detail
              ? detail.model_loaded
              : false,
          model: 'isl-lstm-v1',
          message: errMessage
        },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        recognized: false,
        sign: null,
        backend_available: false,
        model_loaded: false,
        model: 'isl-lstm-v1',
        message: 'FastAPI ISL inference service is unavailable.'
      },
      { status: 503 }
    );
  }
}


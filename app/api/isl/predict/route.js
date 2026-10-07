import { NextResponse } from 'next/server';

const NUM_FEATURES = 126;

function getIslPythonApiUrl() {
  return (
    process.env.ISL_PYTHON_API ||
    process.env.AI_BACKEND_URL ||
    'http://127.0.0.1:8000'
  ).replace(/\/+$/, '');
}

/**
 * GET /api/isl/predict
 * Queries the FastAPI `/health` endpoint to report model status
 * (`ISL Static V1`, 23 classes, threshold) to the ISL Lab UI.
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
          model: 'isl-static-v1',
          message: 'ISL recognition model is not trained/configured.'
        },
        { status: 503 }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      ...data,
      backend_available: true
    });
  } catch {
    return NextResponse.json(
      {
        status: 'unavailable',
        backend_available: false,
        model_loaded: false,
        model: 'isl-static-v1',
        message: 'FastAPI ISL recognition service is unavailable on port 8000.'
      },
      { status: 503 }
    );
  }
}

/**
 * POST /api/isl/predict
 * Validates incoming 126-feature hand landmark payload (`features`, `landmarks`, or `sequence`)
 * and forwards it to FastAPI `/predict`. Never fabricates fallback predictions.
 */
export async function POST(req) {
  let payload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        status: 'invalid_input',
        prediction: null,
        message: 'Invalid JSON request body.'
      },
      { status: 400 }
    );
  }

  if (!payload || typeof payload !== 'object') {
    return NextResponse.json(
      {
        success: false,
        status: 'invalid_input',
        prediction: null,
        message: 'Request body must be a JSON object.'
      },
      { status: 400 }
    );
  }

  const vec = payload.features || payload.landmarks;
  const seq = payload.sequence;

  const isValidVec =
    Array.isArray(vec) &&
    vec.length === NUM_FEATURES &&
    vec.every((v) => typeof v === 'number' && Number.isFinite(v));

  const isValidSeq =
    Array.isArray(seq) &&
    seq.length > 0 &&
    seq.every(
      (frame) =>
        Array.isArray(frame) &&
        frame.length === NUM_FEATURES &&
        frame.every((v) => typeof v === 'number' && Number.isFinite(v))
    );

  if (!isValidVec && !isValidSeq) {
    return NextResponse.json(
      {
        success: false,
        status: 'invalid_input',
        prediction: null,
        message: `Expected 'features' or 'landmarks' array of ${NUM_FEATURES} finite numbers.`
      },
      { status: 400 }
    );
  }

  const baseUrl = getIslPythonApiUrl();

  try {
    const res = await fetch(`${baseUrl}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isValidVec ? { features: vec } : { sequence: seq }),
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
          : data?.message || 'ISL recognition model is not trained/configured.';

      return NextResponse.json(
        {
          success: false,
          status: 'model_unavailable',
          recognized: false,
          prediction: null,
          sign: null,
          model_loaded:
            typeof detail === 'object' && 'model_loaded' in detail
              ? detail.model_loaded
              : false,
          model: 'isl-static-v1',
          message: errMessage
        },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json(
      {
        success: false,
        status: 'backend_unavailable',
        recognized: false,
        prediction: null,
        sign: null,
        backend_available: false,
        model_loaded: false,
        model: 'isl-static-v1',
        message: 'FastAPI ISL recognition service is unavailable.'
      },
      { status: 503 }
    );
  }
}


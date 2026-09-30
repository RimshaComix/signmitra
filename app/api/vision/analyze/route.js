import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const payload = await req.json();
    const { image_base64, imageBase64, mode = 'notice' } = payload;
    const rawImage = image_base64 || imageBase64;

    if (!rawImage) {
      return NextResponse.json(
        { detail: 'Image data (image_base64) is required.' },
        { status: 400 }
      );
    }

    // 1. Try forwarding to Python FastAPI backend
    const pythonBackendUrl = process.env.AI_BACKEND_URL || 'http://127.0.0.1:8000';
    try {
      const pythonRes = await fetch(`${pythonBackendUrl}/api/vision/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: rawImage,
          mode
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (pythonRes.ok) {
        const pythonData = await pythonRes.json();
        return NextResponse.json({ ...pythonData, backend_source: 'fastapi_python' });
      } else if (pythonRes.status < 500) {
        const pythonErr = await pythonRes.json().catch(() => ({ detail: 'Backend request error' }));
        return NextResponse.json(pythonErr, { status: pythonRes.status });
      }
    } catch (e) {
      // Backend unavailable; forward to internal ai-studio route or handle gracefully
    }

    // Fallback: Validate base64 structure and size
    const b64Data = rawImage.replace(/^data:[^;]+;base64,/, '');
    const sizeBytes = Math.floor((b64Data.length * 3) / 4);

    if (sizeBytes > 5 * 1024 * 1024) {
      return NextResponse.json(
        { detail: 'Image size exceeds maximum limit of 5MB.' },
        { status: 400 }
      );
    }

    // Honest unconfigured fallback
    return NextResponse.json({
      extracted_text: '',
      detected_type: mode,
      structured_fields: {},
      confidence_note: 'Deterministic validation passed. Optical character recognition (OCR) requires an active Vision AI provider key.',
      is_interpreted_by_ai: false,
      engine: 'unconfigured_fallback',
      provenance: 'Deterministic Image Validation',
      live_inference_blocked: true,
      validation_details: {
        size_bytes: sizeBytes,
        readable: true
      },
      error: 'Optical character recognition is blocked: No active Vision AI provider key configured.'
    });
  } catch (err) {
    return NextResponse.json(
      { detail: `Image processing error: ${err.message}` },
      { status: 500 }
    );
  }
}

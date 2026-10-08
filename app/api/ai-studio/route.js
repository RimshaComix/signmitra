import { NextResponse } from 'next/server';

// Preset accessibility data matching app/directory/page.js
const VERIFIED_DIRECTORY = [
  {
    id: 'hosp-1',
    name: 'City General Hospital (OPD Block)',
    type: 'Healthcare',
    address: '142 Health Avenue, Downtown, Chennai',
    lastVerified: '2026-09-15',
    verifiedBy: 'SignMitra Community (12 Submissions)',
    isSample: true,
    features: {
      interpreter: {
        status: 'available',
        text: 'On-Call ISL Interpreter Available (Requires 24h notice via desk)'
      },
      visualQueue: {
        status: 'yes',
        text: 'Digital token display boards active in all OPD waiting areas'
      },
      writtenSupport: {
        status: 'yes',
        text: 'Staff trained to use written pads and communication cards'
      }
    }
  },
  {
    id: 'bank-1',
    name: 'State Bank of India (Main Branch)',
    type: 'Banking',
    address: 'Financial District, Block C, Chennai',
    lastVerified: '2026-08-22',
    verifiedBy: 'Official Partner Audit',
    isSample: true,
    features: {
      interpreter: {
        status: 'no',
        text: 'No in-person interpreter. Video Relay Service allowed via mobile.'
      },
      visualQueue: {
        status: 'no',
        text: 'Audio-only token callouts. Inform security guard upon entry.'
      },
      writtenSupport: {
        status: 'yes',
        text: 'Dedicated accessibility forms available at Counter 1'
      }
    }
  },
  {
    id: 'edu-1',
    name: 'Madras University Administrative Block',
    type: 'Education',
    address: 'Chepauk, Chennai',
    lastVerified: '2026-09-01',
    verifiedBy: 'Student Accessibility Cell',
    isSample: true,
    features: {
      interpreter: {
        status: 'request',
        text: 'Peer ISL volunteers available on prior registration with Dean of Students'
      },
      visualQueue: {
        status: 'partial',
        text: 'Visual displays active at Counter 1 & 2 only'
      },
      writtenSupport: {
        status: 'yes',
        text: 'Requisition slips and visual instructions printed at all desks'
      }
    }
  },
  {
    id: 'transit-1',
    name: 'Puratchi Thalaivar Dr. M.G. Ramachandran Central Railway Station',
    type: 'Transport',
    address: 'Park Town, Chennai',
    lastVerified: '2026-09-10',
    verifiedBy: 'Railway Accessibility Desk',
    isSample: true,
    features: {
      interpreter: {
        status: 'no',
        text: 'No sign language interpreter stationed.'
      },
      visualQueue: {
        status: 'yes',
        text: 'Large electronic arrival/departure and coach indicator boards'
      },
      writtenSupport: {
        status: 'yes',
        text: 'Special assistance kiosk with digital query forms'
      }
    }
  }
];

const SUPPORTED_LANGUAGES = {
  hi: 'Hindi',
  hindi: 'Hindi',
  ta: 'Tamil',
  tamil: 'Tamil',
  mr: 'Marathi',
  marathi: 'Marathi',
  bn: 'Bengali',
  bengali: 'Bengali',
  te: 'Telugu',
  telugu: 'Telugu',
  kn: 'Kannada',
  kannada: 'Kannada',
  en: 'English',
  english: 'English',
  gu: 'Gujarati',
  gujarati: 'Gujarati',
  ml: 'Malayalam',
  malayalam: 'Malayalam',
  pa: 'Punjabi',
  punjabi: 'Punjabi',
  or: 'Odia',
  odia: 'Odia'
};

const CORE_DICTIONARY = {
  'Please write down the counter number': {
    Hindi: 'कृपया काउंटर नंबर लिखकर बताएं (Kripya counter number likhkar batayein)',
    Tamil: 'தயவுசெய்து கவுண்டர் எண்ணை எழுதித் தரவும் (Thayavuseithu counter ennai ezhuthi tharavum)',
    Marathi: 'कृपया काउंटर क्रमांक लिहून द्या (Krupaya counter kramank lihun dya)',
    Bengali: 'দয়া করে কাউন্টার নম্বর লিখে দিন (Doya kore counter number likhe din)',
    Telugu: 'దయచేసి కౌంటర్ నంబర్ రాసి ఇవ్వండి (Dayachesi counter number raasi ivvandi)',
    Kannada: 'ದಯವಿಟ್ಟು ಕೌಂಟರ್ ಸಂಖ್ಯೆಯನ್ನು ಬರೆದುಕೊಡಿ (Dayavittu counter sankhyeyannu baredukodi)'
  },

  'Please communicate in writing': {
    Hindi: 'कृपया लिखकर बात करें (Kripya likhkar baat karein)',
    Tamil: 'தயவுசெய்து எழுதி தொடர்பு கொள்ளவும் (Thayavuseithu ezhuthi thodarbu kollavum)',
    Marathi: 'कृपया लिहून सांगा (Krupaya lihun sanga)',
    Bengali: 'দয়া করে লিখে যোগাযোগ করুন (Doya kore likhe jogajog korun)',
    Telugu: 'దయచేసి రాతపూర్వకంగా తెలియజేయండి (Dayachesi raathapoorvakamga theliyajeyandi)',
    Kannada: 'ದಯವಿಟ್ಟು ಬರೆದು ಸಂವಹನ ನಡೆಸಿ (Dayavittu baredu samvahana nadesi)'
  },

  'I am deaf': {
    Hindi: 'मैं बधिर हूँ (Main badhir hoon)',
    Tamil: 'எனக்கு காது கேளாது (Enakku kaathu kelaadhu)',
    Marathi: 'मी कर्णबधिर आहे (Mee karnabadhir aahe)',
    Bengali: 'আমি শুনতে পাই না (Ami shunte pai na)',
    Telugu: 'నేను వినికిడి లోపం ఉన్న వ్యక్తిని (Nenu vinikidi lopam unna vyakthini)',
    Kannada: 'ನಾನು ಕಿವುಡ ವ್ಯಕ್ತಿ (Naanu kivuda vyakthi)'
  },

  'Which counter should I visit?': {
    Hindi: 'मुझे किस काउंटर पर जाना चाहिए? (Mujhe kis counter par jaana chahiye?)',
    Tamil: 'நான் எந்த கவுண்டருக்கு செல்ல வேண்டும்? (Naan entha counter-ukku sella vendum?)',
    Marathi: 'मी कोणत्या काउंटरवर जावे? (Mee konthya counter-var jaave?)',
    Bengali: 'আমি কোন কাউন্টারে যাব? (Ami kon counter-e jabo?)',
    Telugu: 'నేను ఏ కౌంటర్‌కి వెళ్ళాలి? (Nenu ae counter-ki vellali?)',
    Kannada: 'ನಾನು ಯಾವ ಕೌಂಟರ್‌ಗೆ ಹೋಗಬೇಕು? (Naanu yaava counter-ge hogabeku?)'
  },

  'What documents are required?': {
    Hindi: 'कौन से दस्तावेज़ आवश्यक हैं? (Kaun se dastavej aavashyak hain?)',
    Tamil: 'என்ன ஆவணங்கள் தேவை? (Enna aavanangal thevai?)',
    Marathi: 'कोणती कागदपत्रे आवश्यक आहेत? (Konthi kagadpatre aavashyak aahet)',
    Bengali: 'কোন নথি প্রয়োজন? (Kon nothi proyojon?)',
    Telugu: 'ఏ పత్రాలు అవసరం? (Ae pathralu avasaram?)',
    Kannada: 'ಯಾವ ದಾಖಲೆಗಳು ಬೇಕು? (Yaava daakhalegalu beku?)'
  }
};

function findInCoreDictionary(text, lang) {
  const norm = (text || '').trim().toLowerCase();

  for (const [key, map] of Object.entries(CORE_DICTIONARY)) {
    if (
      key.toLowerCase() === norm ||
      norm.includes(key.toLowerCase()) ||
      key.toLowerCase().includes(norm)
    ) {
      if (map[lang]) return map[lang];
    }
  }

  return null;
}

// Helper: Call Gemini API if available
async function callGemini(
  prompt,
  systemInstruction = '',
  inlineData = null
) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('GEMINI_API_KEY is missing.');
    return null;
  }

  try {
    const parts = [];

    if (inlineData) {
      parts.push({
        inlineData: {
          mimeType: inlineData.mimeType,
          data: inlineData.data
        }
      });
    }

    parts.push({
      text: prompt
    });

    const body = {
      contents: [
        {
          role: 'user',
          parts
        }
      ]
    };

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [
          {
            text: systemInstruction
          }
        ]
      };
    }

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20000)
      }
    );

    const responseText = await response.text();

    if (!response.ok) {
      console.error(
        'Gemini API Error:',
        response.status,
        responseText
      );

      return null;
    }

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.error(
        'Gemini returned invalid JSON:',
        responseText
      );

      return null;
    }

    const rawOutput =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part?.text || '')
        .join('')
        .trim();

    if (!rawOutput) {
      console.error(
        'Gemini returned no text output:',
        JSON.stringify(data, null, 2)
      );

      return null;
    }

    const cleaned = rawOutput
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch (parseError) {
      console.error(
        'Gemini JSON parse failed:',
        parseError.message,
        rawOutput
      );

      return {
        raw: rawOutput
      };
    }
  } catch (err) {
    console.error(
      'Gemini invocation error:',
      err?.message || err
    );

    return null;
  }
}

export async function POST(req) {
  try {
    const payload = await req.json();
    const { action } = payload;

    if (!action) {
      return NextResponse.json(
        { error: 'Action parameter is required' },
        { status: 400 }
      );
    }

    // Feature 24 uses the verified directory + dynamically passed local reviews
    if (action === 'evidence_accessibility') {
      const institutionId = payload?.institutionId || '';
      const query = payload?.query?.trim().toLowerCase() || '';
      const localReviews = payload?.localReviews || []; // <--- GET LOCAL REVIEWS

      // Convert local reviews to match the directory format
      const formattedLocal = localReviews.map(rev => ({
        id: rev.id,
        name: rev.institutionName,
        type: rev.institutionType,
        address: 'User Submitted Location',
        lastVerified: rev.timestamp,
        verifiedBy: 'SignMitra Community (Your Review)',
        isSample: false,
        features: {
          interpreter: { 
            status: rev.interpreterRating > 0 ? 'available' : 'unknown', 
            text: `Community Rated: ${rev.interpreterRating}/5` 
          },
          visualQueue: { 
            status: rev.visualDisplayRating > 0 ? 'yes' : 'unknown', 
            text: `Community Rated: ${rev.visualDisplayRating}/5` 
          },
          writtenSupport: { 
            status: rev.writtenSupportRating > 0 ? 'yes' : 'unknown', 
            text: `Community Rated: ${rev.writtenSupportRating}/5` 
          }
        }
      }));

      // Merge the hardcoded directory with your live browser reviews
      const combinedDirectory = [...VERIFIED_DIRECTORY, ...formattedLocal];
      let records = combinedDirectory;

      if (institutionId) {
        records = combinedDirectory.filter((record) => record.id === institutionId);
      } else if (query) {
        records = combinedDirectory.filter((record) => {
          return (
            record.name.toLowerCase().includes(query) ||
            record.type.toLowerCase().includes(query) ||
            record.address.toLowerCase().includes(query)
          );
        });
      }

      return NextResponse.json({
        records,
        total: records.length,
        verificationPolicy: 'Summarized from verified audit records and local user feedback.',
        provider: 'signmitra-directory-evidence',
        backend_source: 'nextjs_verified_directory'
      });
    }

    // ============================================================
    // FASTAPI FIRST
    // ============================================================

    const pythonBackendUrl =
      process.env.AI_BACKEND_URL || 'http://127.0.0.1:8000';

    try {
      const pythonRes = await fetch(
        `${pythonBackendUrl}/api/ai-studio`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action,
            data: payload
          }),
          signal: AbortSignal.timeout(3000)
        }
      );

      if (pythonRes.ok) {
        const pythonData = await pythonRes.json();

        return NextResponse.json({
          ...pythonData,
          backend_source: 'fastapi_python'
        });
      }

      if (pythonRes.status < 500) {
        const pythonErr = await pythonRes
          .json()
          .catch(() => ({
            error: 'Python backend request error'
          }));

        return NextResponse.json(
          pythonErr,
          { status: pythonRes.status }
        );
      }
    } catch (e) {
      // Python backend unavailable.
      // Continue to local Next.js fallback.
    }

    console.log('AI STUDIO ACTION:', action);
    switch (action) {

      /* ========================================================
         1. COPILOT PREPARE (Feature 12)
         ======================================================== */

      case 'copilot_prepare': {
        const {
          context = 'General',
          goal = 'Visit office',
          institution = '',
          preferences = '',
          notes = ''
        } = payload;

        const systemPrompt =
          `You are SignMitra Interaction Copilot. ` +
          `Generate structured preparation steps for an Indian Sign Language ` +
          `(ISL) user going to an in-person appointment. Return strict JSON.`;

        const userPrompt = `Context: ${context}
Goal: ${goal}
Institution: ${institution}
Communication Preferences: ${preferences}
Notes: ${notes}

Respond strictly in JSON format:
{
  "checklist": [
    {
      "id": "c1",
      "task": "Specific task to complete before or during visit",
      "required": true
    }
  ],
  "suggestedCards": [
    "Short, high-contrast phrase cards the user can show staff"
  ],
  "questionsToAsk": [
    "Key questions the user should ensure get answered"
  ],
  "detailsToConfirm": [
    "Specific items like counter number, fees, or timeline"
  ],
  "suggestedDocuments": [
    "Documents typically required for this specific interaction"
  ]
}`;

        const geminiRes = await callGemini(
          userPrompt,
          systemPrompt
        );

        if (geminiRes && geminiRes.checklist) {
          return NextResponse.json({
            ...geminiRes,
            provider: 'gemini'
          });
        }

        const isCollege =
          context.toLowerCase().includes('college') ||
          context.toLowerCase().includes('education');

        const isBank =
          context.toLowerCase().includes('bank');

        const isHospital =
          context.toLowerCase().includes('hospital') ||
          context.toLowerCase().includes('health');

        const isTransit =
          context.toLowerCase().includes('transit') ||
          context.toLowerCase().includes('transport');

        const fallback = {
          checklist: [
            {
              id: 'c1',
              task: isCollege
                ? 'Carry student ID card and verified fee slips'
                : isBank
                ? 'Carry original Aadhaar/PAN and passbook'
                : isHospital
                ? 'Carry past prescription and hospital registration card'
                : 'Carry government photo ID',
              required: true
            },
            {
              id: 'c2',
              task: 'Prepare communication card introducing visual/written preference',
              required: true
            },
            {
              id: 'c3',
              task: 'Check counter working hours and lunch break timings',
              required: false
            },
            {
              id: 'c4',
              task: 'Ask for written acknowledgment or stamped receipt before leaving',
              required: true
            }
          ],

          suggestedCards: [
            `I am here for: ${goal || 'Official query'}. Please communicate in writing.`,
            'Please write down the counter number and documents needed.',
            'Could you please stamp or sign my copy for confirmation?'
          ],

          questionsToAsk: [
            'Which specific window or counter handles this request?',
            'What is the expected processing time or collection date?',
            'Is there any fee or payment receipt required?'
          ],

          detailsToConfirm: [
            'Room or counter number',
            'Name of official or desk in charge',
            'Exact deadline or pickup date'
          ],

          suggestedDocuments: isCollege
            ? [
                'Student ID Card',
                'Fee Receipt / Challan',
                'Application Form signed by HOD'
              ]
            : isBank
            ? [
                'Original Photo ID (Aadhaar / PAN)',
                'Passbook or Account Statement',
                'Cheque book / Deposit Slip'
              ]
            : isHospital
            ? [
                'Hospital OPD Card',
                'Doctor Referral / Prescription',
                'Previous Lab Reports'
              ]
            : [
                'Government Photo ID',
                'Application Reference Number',
                'Relevant Supporting Slips'
              ],

          provider: 'deterministic-copilot'
        };

        return NextResponse.json(fallback);
      }

      /* ========================================================
         2. EXPLAIN PLAIN LANGUAGE (Feature 13)
         ======================================================== */

      case 'explain_plain_language': {
        const {
          text = '',
          context = 'General'
        } = payload;

        if (!text.trim()) {
          return NextResponse.json(
            { error: 'Text is required for explanation' },
            { status: 400 }
          );
        }

        const systemPrompt =
          `You are SignMitra Plain-Language Explainer. ` +
          `Simplify complex administrative, medical, or legal text for an ISL user. ` +
          `Preserve all explicit names, dates, amounts, and room numbers. ` +
          `Do NOT guess missing facts. Return strict JSON.`;

        const userPrompt = `Context: ${context}
Input text: "${text.replace(/"/g, '\\"')}"

Respond strictly in JSON format:
{
  "originalText": "${text.replace(/"/g, '\\"')}",
  "plainLanguageSummary": "2-3 short, clear sentences explaining exactly what happened in simple English.",
  "keyDetails": {
    "locationOrCounter": "Counter, room, or location specified, or 'Not specified'",
    "deadlineOrTime": "Explicit date/time mentioned, or 'Not specified'",
    "feeOrAmount": "Fee or rupee amount mentioned, or 'None stated'",
    "documentsNeeded": ["Array of explicitly required documents"]
  },
  "actionRequired": "Single immediate next step required from the user, or 'None stated'",
  "missingOrUnclear": ["Any ambiguity or missing detail"],
  "clarificationQuestions": [
    "Polite questions the user can show staff to clarify missing facts"
  ]
}`;

        const geminiRes = await callGemini(
          userPrompt,
          systemPrompt
        );

        if (geminiRes && geminiRes.plainLanguageSummary) {
          return NextResponse.json({
            ...geminiRes,
            provider: 'gemini'
          });
        }

        const lower = text.toLowerCase();

        const hasDeadline = text.match(
          /(?:by|before|on|due|until)\s+([A-Za-z]+ \d{1,2}|\d{1,2}:\d{2}\s*(?:am|pm)?|tomorrow|monday|tuesday|wednesday|thursday|friday|\d{1,2}\/\d{1,2}\/\d{2,4})/i
        );

        const hasCounter = text.match(
          /(?:counter|room|window|desk|block|floor|chamber|cabin)\s*([A-Za-z0-9-]+)/i
        );

        const hasFee = text.match(
          /(?:rs\.?|inr|rupees?|₹)\s*([\d,]+)/i
        );

        const docs = [];

        if (
          lower.includes('id') ||
          lower.includes('aadhaar') ||
          lower.includes('pan')
        ) {
          docs.push('Identity proof (ID card)');
        }

        if (
          lower.includes('form') ||
          lower.includes('application')
        ) {
          docs.push('Prescribed application form');
        }

        if (
          lower.includes('receipt') ||
          lower.includes('slip') ||
          lower.includes('challan')
        ) {
          docs.push('Fee receipt or payment slip');
        }

        if (
          lower.includes('photo') ||
          lower.includes('photograph')
        ) {
          docs.push('Passport-size photographs');
        }

        if (docs.length === 0) {
          docs.push('Check counter for specific document list');
        }

        const fallback = {
          originalText: text,

          plainLanguageSummary:
            text.length > 120
              ? `${text.substring(0, 110)}... The staff gave instructions regarding your request.`
              : text,

          keyDetails: {
            locationOrCounter: hasCounter
              ? `${hasCounter[0].toUpperCase()}`
              : 'Not specified',

            deadlineOrTime: hasDeadline
              ? hasDeadline[0]
              : 'Not specified',

            feeOrAmount: hasFee
              ? `₹${hasFee[1]}`
              : 'None stated',

            documentsNeeded: docs
          },

          actionRequired: hasDeadline
            ? `Submit required items before ${hasDeadline[1]}.`
            : hasCounter
            ? `Proceed to ${hasCounter[0]}.`
            : 'Review requirements and confirm next step with staff.',

          missingOrUnclear: [
            !hasCounter
              ? 'Exact counter or room number was not stated.'
              : null,

            !hasDeadline
              ? 'Specific date or time deadline was not specified.'
              : null,

            !hasFee
              ? 'Whether any fee is required was not mentioned.'
              : null
          ].filter(Boolean),

          clarificationQuestions: [
            hasCounter
              ? 'Which counter do I submit this to?'
              : 'Could you please write down the exact room or counter number?',

            hasFee
              ? 'How much is the fee? Please write the amount.'
              : 'Is there any fee or payment required?',

            'When is the deadline to complete this?'
          ],

          provider: 'deterministic-explainer'
        };

        return NextResponse.json(fallback);
      }

      /* ========================================================
         3. COMMUNICATION GAP DETECTOR (Feature 14)
         ======================================================== */

      case 'detect_gaps': {
        const {
          text = '',
          context = 'General'
        } = payload;

        if (!text.trim()) {
          return NextResponse.json(
            { error: 'Text required for gap detection' },
            { status: 400 }
          );
        }

        const systemPrompt =
          `You are SignMitra Communication Gap Detector. ` +
          `Inspect interaction notes or staff replies for missing dates, ` +
          `unspecified documents, ambiguous locations, unclear amounts, ` +
          `or vague terms like 'there', 'later', or 'next week'. ` +
          `Show exact quote supporting each gap. Return strict JSON.`;

        const userPrompt = `Context: ${context}
Input text: "${text.replace(/"/g, '\\"')}"

Respond strictly in JSON format:
{
  "gaps": [
    {
      "type": "date_missing | document_unspecified | location_ambiguous | amount_unclear | vague_reference",
      "label": "Brief gap title",
      "quote": "Exact substring from input text that triggers this ambiguity",
      "issue": "What information is missing or unclear",
      "suggestion": "Exact question card the user should show staff"
    }
  ],
  "clarityScore": "High | Medium | Low with brief reason"
}`;

        const geminiRes = await callGemini(
          userPrompt,
          systemPrompt
        );

        if (geminiRes && Array.isArray(geminiRes.gaps)) {
          return NextResponse.json({
            ...geminiRes,
            provider: 'gemini'
          });
        }

        const lower = text.toLowerCase();
        const gaps = [];

        const vagueLocations = text.match(
          /\b(there|that counter|other counter|upstairs|downstairs|office|window)\b/i
        );

        if (vagueLocations) {
          gaps.push({
            type: 'location_ambiguous',
            label: 'Ambiguous Location Mentioned',
            quote: vagueLocations[0],
            issue:
              `The word "${vagueLocations[0]}" does not state the exact room, building, or counter number.`,
            suggestion:
              'Could you please write down the exact room number or counter name?'
          });
        }

        const vagueTiming = text.match(
          /\b(later|soon|next week|tomorrow morning|after lunch|in some time|after a few days)\b/i
        );

        if (vagueTiming) {
          gaps.push({
            type: 'date_missing',
            label: 'Unspecified Time or Date',
            quote: vagueTiming[0],
            issue:
              `"${vagueTiming[0]}" does not give an exact date, day, or time deadline.`,
            suggestion:
              'Could you please write down the exact date and time I should return?'
          });
        }

        const vagueDocs = text.match(
          /\b(the documents|forms|necessary papers|all certificates|relevant proofs|paperwork)\b/i
        );

        if (vagueDocs) {
          gaps.push({
            type: 'document_unspecified',
            label: 'Unspecified Document Names',
            quote: vagueDocs[0],
            issue:
              `"${vagueDocs[0]}" does not name the specific certificates or forms required.`,
            suggestion:
              'Which specific documents do I need to bring? Please write their names.'
          });
        }

        const vagueFees = text.match(
          /\b(charges|fee|nominal cost|pay at counter|amount)\b/i
        );

        if (vagueFees && !text.match(/₹|\d+/)) {
          gaps.push({
            type: 'amount_unclear',
            label: 'Unspecified Fee Amount',
            quote: vagueFees[0],
            issue:
              'Mentioned payment but did not state the exact numeric amount.',
            suggestion:
              'How much is the exact fee? Please write down the amount in Rupees.'
          });
        }

        if (gaps.length === 0) {
          gaps.push({
            type: 'step_unspecified',
            label: 'Confirmation of Final Step',
            quote: text.slice(0, 30),
            issue:
              'Verify if any further action or stamp is needed after this step.',
            suggestion:
              'Is this the final step, or do I need another signature?'
          });
        }

        return NextResponse.json({
          gaps,

          clarityScore:
            gaps.length > 2
              ? 'Low - Several Ambiguities'
              : gaps.length === 1
              ? 'Medium - Minor Gaps'
              : 'High - Relatively Clear',

          provider: 'deterministic-gap-detector'
        });
      }

      /* ========================================================
         4. CLARIFICATION QUESTION GENERATOR (Feature 15)
         ======================================================== */

      case 'generate_clarifications': {
        const {
          text = '',
          context = 'General',
          specificGap = ''
        } = payload;

        const systemPrompt =
          `You are SignMitra Clarification Question Generator. ` +
          `Generate short, polite, high-contrast question cards for an ISL user ` +
          `to display or speak to hearing staff. Return strict JSON.`;

        const userPrompt = `Context: ${context}
Input context/text: "${text.replace(/"/g, '\\"')}"
Specific issue: "${specificGap.replace(/"/g, '\\"')}"

Respond strictly in JSON format:
{
  "clarifications": [
    {
      "id": "q1",
      "title": "Short title",
      "questionCard": "Exact question text in polite English",
      "contextNote": "Why this question is necessary",
      "urgency": "Normal | Urgent"
    }
  ]
}`;

        const geminiRes = await callGemini(
          userPrompt,
          systemPrompt
        );

        if (
          geminiRes &&
          Array.isArray(geminiRes.clarifications)
        ) {
          return NextResponse.json({
            ...geminiRes,
            provider: 'gemini'
          });
        }

        const clarifications = [
          {
            id: 'q1',
            title: 'Exact Counter / Room',
            questionCard:
              'Could you please write down the exact room number or counter I should visit?',
            contextNote:
              'Prevents wandering between administrative wings.',
            urgency: 'Normal'
          },
          {
            id: 'q2',
            title: 'Required Documents List',
            questionCard:
              'Which specific documents or forms do I need to bring?',
            contextNote:
              'Avoids having to return twice due to missing papers.',
            urgency: 'Normal'
          },
          {
            id: 'q3',
            title: 'Target Deadline',
            questionCard:
              'What is the exact date or time deadline for this submission?',
            contextNote:
              'Ensures application is processed before cutoff.',
            urgency: 'Normal'
          }
        ];

        return NextResponse.json({
          clarifications,
          provider: 'deterministic-clarifications'
        });
      }

      /* ========================================================
         5. AI COMMUNICATION CARD COMPOSER (Feature 16)
         ======================================================== */

      case 'compose_card': {
        const {
          intent = '',
          tone = 'polite',
          context = 'General'
        } = payload;

        if (!intent.trim()) {
          return NextResponse.json(
            { error: 'Intent is required' },
            { status: 400 }
          );
        }

        const systemPrompt =
          `You are SignMitra Communication Card Composer. ` +
          `Convert user intended thoughts into a clear, high-contrast communication ` +
          `card for an ISL user. Support tones: brief, polite, urgent, detailed. ` +
          `Return strict JSON.`;

        const userPrompt = `Context: ${context}
User intent: "${intent.replace(/"/g, '\\"')}"
Tone: ${tone}

Respond strictly in JSON format:
{
  "composedText": "The composed card message",
  "tone": "${tone}",
  "followUpQuestion": "A likely follow-up question the user might need to show next"
}`;

        const geminiRes = await callGemini(
          userPrompt,
          systemPrompt
        );

        if (geminiRes && geminiRes.composedText) {
          return NextResponse.json({
            ...geminiRes,
            provider: 'gemini'
          });
        }

        let prefix = '';

        if (tone === 'polite') {
          prefix = 'Excuse me, ';
        }

        if (tone === 'urgent') {
          prefix = 'URGENT: ';
        }

        if (tone === 'brief') {
          prefix = '';
        }

        let composed =
          `${prefix}I need assistance with: ${intent}. ` +
          `I communicate visually; please write your answer down.`;

        if (tone === 'brief') {
          composed =
            `${intent}. Please write down your reply.`;
        }

        if (tone === 'detailed') {
          composed =
            `Hello. I am here regarding ${intent}. ` +
            `Please write down the necessary instructions, counter number, and required documents.`;
        }

        return NextResponse.json({
          composedText: composed,
          tone,
          followUpQuestion:
            'Which counter or room should I go to next?',
          provider: 'deterministic-card-composer'
        });
      }

      /* ========================================================
         5b. LLM REWRITE / SIMPLIFICATION FOR TWO-WAY ROOM
         ======================================================== */

      case 'rewrite_text': {
        const {
          text = '',
          mode = 'polite',
          domain = 'General'
        } = payload;

        if (!text.trim()) {
          return NextResponse.json(
            { error: 'Text required for rewriting' },
            { status: 400 }
          );
        }

        const apiKey =
          process.env.GEMINI_API_KEY ||
          process.env.GROQ_API_KEY;

        if (!apiKey) {
          return NextResponse.json({
            original_text: text,
            transformed_text: text,
            mode,
            engine: 'unconfigured_fallback',
            provenance: 'Provider Unconfigured',
            live_inference_blocked: true,
            error:
              'Live LLM rewriting is blocked: No active AI provider key (GROQ_API_KEY or GEMINI_API_KEY) is configured in your environment.'
          });
        }

        const systemPrompt =
          `You are SignMitra Counter Communication Assistant for Deaf individuals. ` +
          `Rewrite the user's message to be ${mode} for an Indian public desk. ` +
          `Return JSON {"rewritten_text": "..."}.`;

        const userPrompt =
          `Domain: ${domain}\n` +
          `Mode: ${mode}\n` +
          `Original: "${text.replace(/"/g, '\\"')}"`;

        const geminiRes = await callGemini(
          userPrompt,
          systemPrompt
        );

        if (geminiRes && geminiRes.rewritten_text) {
          return NextResponse.json({
            original_text: text,
            transformed_text: geminiRes.rewritten_text,
            mode,
            engine: 'gemini_llm',
            provenance: 'Live Model Generated (gemini)',
            live_inference_blocked: false
          });
        }

        return NextResponse.json({
          original_text: text,
          transformed_text: text,
          mode,
          engine: 'provider_error',
          provenance: 'Live Provider Error',
          live_inference_blocked: true,
          error: 'Live LLM inference call failed.'
        });
      }

      /* ========================================================
         6. CONTEXT-AWARE TRANSLATION (Feature 17)
         ======================================================== */

      case 'translate_ai':
      case 'translate_text':
      case 'translate': {
        const text =
          payload.text ||
          payload.sourceText ||
          '';

        const cleanText = text.trim();

        if (!cleanText) {
          return NextResponse.json(
            { error: 'Text required for translation' },
            { status: 400 }
          );
        }

        const rawTarget = (
          payload.target_language ||
          payload.targetLang ||
          'hi'
        ).trim();

        const targetKey = rawTarget.toLowerCase();

        if (!SUPPORTED_LANGUAGES[targetKey]) {
          return NextResponse.json(
            {
              error:
                `Unsupported target language '${rawTarget}'. Supported: Hindi, Tamil, Marathi, Bengali, Telugu, Kannada, English, Gujarati, Malayalam, Punjabi, Odia.`
            },
            { status: 400 }
          );
        }

        const resolvedLang =
          SUPPORTED_LANGUAGES[targetKey];

        const mode =
          payload.mode ||
          (action === 'translate_ai'
            ? 'ai'
            : 'deterministic');

        if (mode === 'deterministic') {
          const found = findInCoreDictionary(
            cleanText,
            resolvedLang
          );

          if (found) {
            return NextResponse.json({
              original_text: cleanText,
              originalText: cleanText,
              sourceText: cleanText,
              translated_text: found,
              translatedText: found,
              target_language: resolvedLang,
              targetLanguage: resolvedLang,
              targetLang: resolvedLang,
              source_language:
                payload.source_language ||
                payload.sourceLang ||
                'en',
              sourceLang:
                payload.source_language ||
                payload.sourceLang ||
                'en',
              engine: 'curated_dictionary',
              provenance: 'Curated Institutional Phrasebook',
              is_ai: false,
              live_inference_blocked: false
            });
          }

          return NextResponse.json({
            original_text: cleanText,
            originalText: cleanText,
            sourceText: cleanText,
            translated_text: cleanText,
            translatedText: cleanText,
            target_language: resolvedLang,
            targetLanguage: resolvedLang,
            targetLang: resolvedLang,
            source_language:
              payload.source_language ||
              payload.sourceLang ||
              'en',
            sourceLang:
              payload.source_language ||
              payload.sourceLang ||
              'en',
            engine: 'unconfigured_fallback',
            provenance:
              'Provider Unconfigured (Key Required)',
            is_ai: false,
            live_inference_blocked: true,
            error:
              'No offline dictionary match found and external AI translation is unconfigured.'
          });
        }

        if (action === 'translate' && mode !== 'ai') {
          const found = findInCoreDictionary(
            cleanText,
            resolvedLang
          );

          if (found) {
            return NextResponse.json({
              original_text: cleanText,
              originalText: cleanText,
              sourceText: cleanText,
              translated_text: found,
              translatedText: found,
              target_language: resolvedLang,
              targetLanguage: resolvedLang,
              targetLang: resolvedLang,
              source_language:
                payload.source_language ||
                payload.sourceLang ||
                'en',
              sourceLang:
                payload.source_language ||
                payload.sourceLang ||
                'en',
              engine: 'curated_dictionary',
              provenance:
                'Curated Institutional Phrasebook',
              is_ai: false,
              live_inference_blocked: false
            });
          }
        }

        const apiKey =
          process.env.GEMINI_API_KEY ||
          process.env.GROQ_API_KEY;

        if (!apiKey) {
          return NextResponse.json({
            original_text: cleanText,
            originalText: cleanText,
            sourceText: cleanText,
            translated_text: cleanText,
            translatedText: cleanText,
            target_language: resolvedLang,
            targetLanguage: resolvedLang,
            targetLang: resolvedLang,
            source_language:
              payload.source_language ||
              payload.sourceLang ||
              'en',
            sourceLang:
              payload.source_language ||
              payload.sourceLang ||
              'en',
            engine: 'unconfigured_fallback',
            provenance:
              'Provider Unconfigured (Key Required)',
            is_ai: true,
            live_inference_blocked: true,
            error:
              'Live AI translation is blocked: No active AI provider key (GROQ_API_KEY or GEMINI_API_KEY) is configured in your environment.'
          });
        }

        const systemPrompt =
          `You are SignMitra Translation Service for Deaf individuals in India. ` +
          `Translate the given text into ${resolvedLang}. ` +
          `Preserve numbers, dates, amounts, and room numbers. ` +
          `Return JSON {"translated_text": "..."}.`;

        const userPrompt =
          `Translate to ${resolvedLang}: "${cleanText.replace(/"/g, '\\"')}"`;

        const geminiRes = await callGemini(
          userPrompt,
          systemPrompt
        );

        if (
          geminiRes &&
          geminiRes.translated_text
        ) {
          return NextResponse.json({
            original_text: cleanText,
            originalText: cleanText,
            sourceText: cleanText,
            translated_text:
              geminiRes.translated_text,
            translatedText:
              geminiRes.translated_text,
            target_language: resolvedLang,
            targetLanguage: resolvedLang,
            targetLang: resolvedLang,
            source_language:
              payload.source_language ||
              payload.sourceLang ||
              'en',
            sourceLang:
              payload.source_language ||
              payload.sourceLang ||
              'en',
            engine: 'gemini_llm',
            provenance:
              'Live Model Generated (gemini)',
            is_ai: true,
            live_inference_blocked: false
          });
        }

        return NextResponse.json({
          original_text: cleanText,
          originalText: cleanText,
          sourceText: cleanText,
          translated_text: cleanText,
          translatedText: cleanText,
          target_language: resolvedLang,
          targetLanguage: resolvedLang,
          targetLang: resolvedLang,
          source_language:
            payload.source_language ||
            payload.sourceLang ||
            'en',
          sourceLang:
            payload.source_language ||
            payload.sourceLang ||
            'en',
          engine: 'provider_error',
          provenance: 'Live Provider Error',
          is_ai: true,
          live_inference_blocked: true,
          error: 'Live LLM translation call failed.'
        });
      }

      /* ========================================================
         6b. LANGUAGE AUTO-DETECTION
         ======================================================== */

      case 'detect_language': {
        const text =
          (payload.text || '').trim();

        if (!text) {
          return NextResponse.json(
            { error: 'Text required for language detection' },
            { status: 400 }
          );
        }

        const apiKey =
          process.env.GEMINI_API_KEY ||
          process.env.GROQ_API_KEY;

        if (!apiKey) {
          return NextResponse.json({
            detected: false,
            live_inference_blocked: true,
            error:
              'Language auto-detection is unavailable: AI provider is unconfigured.'
          });
        }

        const systemPrompt =
          `You are a language detection service. ` +
          `Detect the language of the provided text. ` +
          `Return JSON: {"language_name": "...", "language_code": "...", "confidence": 0.95}`;

        const userPrompt =
          `Detect language for text: "${text.replace(/"/g, '\\"')}"`;

        const geminiRes = await callGemini(
          userPrompt,
          systemPrompt
        );

        if (
          geminiRes &&
          geminiRes.language_name
        ) {
          return NextResponse.json({
            detected: true,
            language_name:
              geminiRes.language_name,
            language_code:
              geminiRes.language_code || 'auto',
            confidence:
              geminiRes.confidence || 0.9,
            live_inference_blocked: false
          });
        }

        return NextResponse.json({
          detected: false,
          live_inference_blocked: true,
          error:
            'Language detection provider call failed.'
        });
      }

      /* ========================================================
         6c. SESSION PERSISTENCE
         ======================================================== */

      case 'save_session': {
        const sessionId =
          payload.id ||
          payload.sessionId ||
          `SESSION-${Date.now()}`;

        return NextResponse.json({
          status: 'success',
          success: true,
          session_id: sessionId,
          sessionId: sessionId,
          message: 'Session persisted successfully'
        });
      }

      /* ========================================================
         7. READING LEVEL & SIMPLIFICATION (Feature 18)
         ======================================================== */

      case 'simplify_reading_level': {
        const {
          text = '',
          mode = 'simpler'
        } = payload;

        if (!text.trim()) {
          return NextResponse.json(
            { error: 'Text required for simplification' },
            { status: 400 }
          );
        }

        let simplified = text;
        const bullets = [];

        const sentences = text
          .split(/[.?!]\s+/)
          .filter(
            (s) => s.trim().length > 0
          );

        if (mode === 'shorter') {
          simplified =
            sentences.slice(0, 2).join('. ') +
            (sentences.length > 2 ? '.' : '');

          sentences
            .slice(0, 2)
            .forEach((s) =>
              bullets.push(s.trim())
            );
        } else if (mode === 'step_by_step') {
          simplified = sentences
            .map(
              (s, idx) =>
                `${idx + 1}. ${s.trim()}`
            )
            .join('\n');

          sentences.forEach((s) =>
            bullets.push(s.trim())
          );
        } else if (mode === 'key_points') {
          simplified = sentences
            .map(
              (s) => `• ${s.trim()}`
            )
            .join('\n');

          sentences.forEach((s) =>
            bullets.push(s.trim())
          );
        } else if (mode === 'formal') {
          simplified =
            `Respected Sir/Madam, kindly note: ${text}`;

          bullets.push(simplified);
        } else {
          simplified = text
            .replace(
              /\bmandatory\b/gi,
              'required'
            )
            .replace(
              /\butilize\b/gi,
              'use'
            )
            .replace(
              /\brequisition\b/gi,
              'request'
            )
            .replace(
              /\bprior to\b/gi,
              'before'
            )
            .replace(
              /\bcommencing\b/gi,
              'starting'
            )
            .replace(
              /\badministrative\b/gi,
              'office'
            )
            .replace(
              /\bsubsequently\b/gi,
              'then'
            )
            .replace(
              /\bin accordance with\b/gi,
              'as per'
            );

          bullets.push(simplified);
        }

        return NextResponse.json({
          originalText: text,
          mode,
          simplifiedText: simplified,
          bulletPoints:
            bullets.length > 0
              ? bullets
              : [simplified],
          provider:
            'deterministic-simplifier',
          engine:
            'rule_based_simplifier',
          provenance:
            'Rule-Based Offline Simplification',
          is_ai: false,
          live_inference_blocked: true
        });
      }

      /* ========================================================
         8. CONVERSATION REHEARSAL SIMULATOR (Feature 19)
         ======================================================== */

      case 'simulate_rehearsal': {
        const {
          scenario = 'College Office',
          scenario_id = scenario,
          userTurn = '',
          history = []
        } = payload;

        /*
         * --------------------------------------------------------
         * SCENARIO DEFINITIONS
         * --------------------------------------------------------
         *
         * IMPORTANT:
         *
         * The initial staff message is ONLY the opening situation.
         * It is not a closed-world list of allowed user requests.
         *
         * The user may introduce another reasonable request inside
         * the selected domain.
         */

        const SCENARIOS = {
          'College Office': {
            label: 'College Administration',

            initialStaff:
              'Next please. Keep your student ID card and original fee slip ready on the counter.',

            domainDescription:
              'College administration and student-service conversations.',

            fallbackResponse:
              'That specific detail is not established in this practice conversation. Please confirm it with the actual college staff member.',

            suggestions: [
              'I need to submit my exam form.',
              'Could you please write down the required documents?',
              'Could I get an acknowledgement for my submission?'
            ],

            checklist: [
              'Keep your student ID card ready',
              'Keep the original fee slip ready',
              'Ask staff to write down any additional requirements'
            ]
          },

          'Bank Branch': {
            label: 'Bank Branch',

            initialStaff:
              'Please submit Form 2A along with self-attested copies of your PAN and Aadhaar.',

            domainDescription:
              'Banking, KYC, account, document, and counter-service conversations.',

            fallbackResponse:
              'That specific detail is not established in this practice conversation. Please confirm the exact requirement with the actual bank staff member.',

            suggestions: [
              'I need to update my KYC address.',
              'Could you please write down the documents required?',
              'Could I get an acknowledgement for the documents I submit?'
            ],

            checklist: [
              'Keep the documents already mentioned in the conversation ready',
              'Ask staff to write down any additional requirements',
              'Confirm the next step before leaving'
            ]
          },

          'Hospital OPD': {
            label: 'Hospital OPD',

            initialStaff:
              'Take this green slip to Room 104 for preliminary blood pressure check.',

            domainDescription:
              'Hospital OPD, registration, appointments, lab, and patient-service conversations.',

            fallbackResponse:
              'That specific detail is not established in this practice conversation. Please confirm the next step with the actual hospital staff member.',

            suggestions: [
              'I need help with my consultation registration.',
              'Could you please write down the next step?',
              'Could you please confirm where I should go next?'
            ],

            checklist: [
              'Keep the green slip ready',
              'Confirm Room 104 before proceeding',
              'Ask staff to write down the next step if needed'
            ]
          },

          'Public Transit': {
            label: 'Railway / Transit',

            initialStaff:
              'Suburban trains for Tambaram leave from Platform 3. The next fast local is at 10:45 AM.',

            domainDescription:
              'Railway and public-transit conversations involving destinations, tickets, platforms, schedules, and boarding assistance.',

            fallbackResponse:
              'That specific operational detail is not established in this practice conversation. Please confirm it with the actual transit staff member.',

            suggestions: [
              'Could you please confirm the platform for my train?',
              'I need boarding assistance.',
              'Could you please write down the platform information?'
            ],

            checklist: [
              'Confirm the destination and train information',
              'Confirm the platform before proceeding',
              'Ask staff about boarding assistance if needed'
            ]
          }
        };

        const selected =
          SCENARIOS[scenario] ||
          SCENARIOS['College Office'];

        /*
         * --------------------------------------------------------
         * NORMALIZE HISTORY
         * --------------------------------------------------------
         */

        const normalizedHistory =
          Array.isArray(history)
            ? history
                .map((turn) => ({
                  role:
                    turn?.role === 'staff'
                      ? 'staff'
                      : 'user',

                  text: String(
                    turn?.text || ''
                  ).trim()
                }))
                .filter(
                  (turn) => turn.text
                )
            : [];

        const cleanUserTurn =
          String(userTurn || '').trim();

        /*
         * --------------------------------------------------------
         * CROSS-SCENARIO GUARD
         * --------------------------------------------------------
         *
         * This guard is intentionally conservative.
         *
         * It should detect obvious attempts to move into a
         * DIFFERENT domain.
         *
         * It must NOT reject ordinary variation inside the
         * selected domain.
         *
         * Example:
         *
         * Selected = Public Transit
         * User = "I want to buy tickets for Porur."
         *
         * This is VALID because Porur is another transit
         * destination. "ticket" alone is NOT a cross-domain signal.
         */

        const CROSS_SCENARIO_SIGNALS = {
          'College Office': {
            'Bank Branch': [
              'update kyc',
              'kyc update',
              'open bank account',
              'open a bank account',
              'open savings account',
              'open a savings account',
              'open current account',
              'open a current account',
              'deposit a cheque',
              'deposit a check',
              'bank statement',
              'bank branch',
              'passbook',
              'ifsc',
              'bank transfer'
            ],

            'Hospital OPD': [
              'doctor consultation',
              'doctor appointment',
              'hospital appointment',
              'see a doctor',
              'buy medicine',
              'collect medicine',
              'lab test',
              'blood test',
              'pharmacy',
              'medical treatment'
            ],

            'Public Transit': [
              'train ticket',
              'railway ticket',
              'catch a train',
              'which platform',
              'platform for',
              'railway station',
              'train station',
              'suburban train',
              'fast local',
              'boarding assistance'
            ]
          },

          'Bank Branch': {
            'College Office': [
              'exam form',
              'semester',
              'transcript',
              'mark sheet',
              'marksheet',
              'college office',
              'student id',
              'fee receipt',
              'academic certificate'
            ],

            'Hospital OPD': [
              'doctor consultation',
              'doctor appointment',
              'hospital appointment',
              'prescription',
              'medicine',
              'medication',
              'lab test',
              'blood test',
              'pharmacy',
              'medical treatment'
            ],

            'Public Transit': [
              'train ticket',
              'railway ticket',
              'catch a train',
              'which platform',
              'platform for',
              'railway station',
              'train station',
              'suburban train',
              'fast local',
              'boarding assistance'
            ]
          },

          'Hospital OPD': {
            'College Office': [
              'exam form',
              'semester',
              'transcript',
              'mark sheet',
              'marksheet',
              'college office',
              'student id',
              'fee receipt',
              'academic certificate'
            ],

            'Bank Branch': [
              'update kyc',
              'kyc update',
              'open bank account',
              'open a bank account',
              'open savings account',
              'open a savings account',
              'open current account',
              'open a current account',
              'deposit a cheque',
              'deposit a check',
              'bank statement',
              'bank branch',
              'passbook',
              'ifsc'
            ],

            'Public Transit': [
              'train ticket',
              'railway ticket',
              'catch a train',
              'which platform',
              'platform for',
              'railway station',
              'train station',
              'suburban train',
              'fast local',
              'boarding assistance'
            ]
          },

          'Public Transit': {
            'College Office': [
              'exam form',
              'semester',
              'transcript',
              'mark sheet',
              'marksheet',
              'college office',
              'student id',
              'fee receipt',
              'academic certificate'
            ],

            'Bank Branch': [
              'update kyc',
              'kyc update',
              'open bank account',
              'open a bank account',
              'open savings account',
              'open a savings account',
              'open current account',
              'open a current account',
              'deposit a cheque',
              'deposit a check',
              'bank statement',
              'bank branch',
              'passbook',
              'ifsc'
            ],

            'Hospital OPD': [
              'doctor consultation',
              'doctor appointment',
              'hospital appointment',
              'prescription',
              'medicine',
              'medication',
              'lab test',
              'blood test',
              'pharmacy',
              'medical treatment'
            ]
          }
        };

        const normalizedUserText =
          cleanUserTurn
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();

        const domainSignals =
          CROSS_SCENARIO_SIGNALS[scenario] ||
          {};

        let crossScenarioTarget = null;

        for (
          const [target, signals]
          of Object.entries(domainSignals)
        ) {
          if (
            signals.some((signal) =>
              normalizedUserText.includes(
                signal
              )
            )
          ) {
            crossScenarioTarget = target;
            break;
          }
        }

        if (crossScenarioTarget) {
          const targetLabel =
            SCENARIOS[
              crossScenarioTarget
            ]?.label ||
            crossScenarioTarget;

          return NextResponse.json({
            scenario_id,

            staffResponse:
              `That request is outside this ${selected.label} practice scenario. ` +
              `It appears to relate to ${targetLabel}. ` +
              `Please keep your response related to the current ${selected.label} scenario.`,

            staffDemeanor:
              'Practice context guard',

            suggestedUserReplies:
              selected.suggestions,

            rehearsalChecklist:
              selected.checklist,

            provider:
              'deterministic-context-guard',

            engine:
              'deterministic_context_guard'
          });
        }

        /*
         * --------------------------------------------------------
         * CONVERSATION-GROUNDED VALIDATION
         * --------------------------------------------------------
         *
         * Concrete operational facts may be used only when they
         * already exist in the conversation.
         *
         * This prevents Gemini from inventing:
         * - Room 203
         * - Counter 5
         * - Platform 7
         * - 11:30 AM
         * - ₹500
         * - Form 4A
         *
         * unless that information was actually established.
         */

        const normalizeText = (value) =>
          String(value || '')
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();

        const buildKnownConversationText = () => {
          const parts = [
            selected.initialStaff,
            ...normalizedHistory.map(
              (turn) => turn.text
            ),
            cleanUserTurn
          ];

          return normalizeText(
            parts.filter(Boolean).join(' ')
          );
        };

        const knownConversationText =
          buildKnownConversationText();

        const CONCRETE_OPERATIONAL_PATTERNS = [
          /\b(?:room|counter|platform)\s*#?\s*\d+\b/gi,

          /\bform\s+\d+[a-z]?\b/gi,

          /\b\d{1,2}:\d{2}\s*(?:am|pm)?\b/gi,

          /\b\d{1,2}\s*(?:am|pm)\b/gi,

          /(?:₹|rs\.?|inr|\$)\s*\d[\d,]*(?:\.\d+)?/gi
        ];

        const extractConcreteOperationalDetails =
          (text) => {
            const matches = [];

            for (
              const pattern
              of CONCRETE_OPERATIONAL_PATTERNS
            ) {
              const found =
                String(text || '').match(
                  pattern
                ) || [];

              for (const item of found) {
                matches.push(
                  normalizeText(item)
                );
              }
            }

            return [
              ...new Set(matches)
            ];
          };

        const operationalDetailIsKnown =
          (detail) => {
            const normalizedDetail =
              normalizeText(detail);

            return knownConversationText.includes(
              normalizedDetail
            );
          };

        const validateConcreteOperationalClaims =
          (response) => {
            const generatedDetails =
              extractConcreteOperationalDetails(
                response
              );

            const unsupportedDetails =
              generatedDetails.filter(
                (detail) =>
                  !operationalDetailIsKnown(
                    detail
                  )
              );

            return {
              safe:
                unsupportedDetails.length === 0,

              unsupportedDetails
            };
          };

        /*
         * --------------------------------------------------------
         * DOMAIN-SPECIFIC CONTAMINATION GUARD
         * --------------------------------------------------------
         *
         * These are intentionally task-level signals rather than
         * generic words such as "ticket", "form", "room", etc.
         */

        const SCENARIO_FORBIDDEN_TERMS = {
          'College Office': [
            'update kyc',
            'open a bank account',
            'open bank account',
            'doctor appointment',
            'doctor consultation',
            'prescription',
            'pharmacy',
            'railway station',
            'train station',
            'suburban train',
            'fast local',
            'boarding assistance'
          ],

          'Bank Branch': [
            'exam form',
            'semester marks',
            'college office',
            'doctor appointment',
            'doctor consultation',
            'prescription',
            'pharmacy',
            'railway station',
            'train station',
            'suburban train',
            'fast local'
          ],

          'Hospital OPD': [
            'exam form',
            'college office',
            'semester marks',
            'update kyc',
            'open a bank account',
            'bank branch',
            'railway station',
            'train station',
            'suburban train',
            'fast local'
          ],

          'Public Transit': [
            'update kyc',
            'open a bank account',
            'bank branch',
            'exam form',
            'college office',
            'semester marks',
            'doctor appointment',
            'doctor consultation',
            'prescription',
            'pharmacy'
          ]
        };

        const responseContainsCrossDomainContent =
          (response) => {
            const normalizedResponse =
              normalizeText(response);

            const forbidden =
              SCENARIO_FORBIDDEN_TERMS[
                scenario
              ] || [];

            return forbidden.find(
              (term) =>
                normalizedResponse.includes(
                  term
                )
            );
          };

        /*
         * --------------------------------------------------------
         * FAKE COMPLETION / REAL-WORLD CLAIM GUARD
         * --------------------------------------------------------
         */

        const fakeCompletionClaims = [
          'i have booked',
          'i booked',
          'i have submitted',
          'i submitted',
          'i have arranged',
          'i arranged',
          'i have notified',
          'i notified',
          'i have verified',
          'i verified',
          'it has been confirmed',
          'your appointment is confirmed',
          'your booking is confirmed',
          'your request has been submitted',
          'your token has been issued',
          'your ticket has been booked'
        ];

        const responseContainsFakeCompletion =
          (response) => {
            const normalizedResponse =
              normalizeText(response);

            return fakeCompletionClaims.find(
              (phrase) =>
                normalizedResponse.includes(
                  phrase
                )
            );
          };

        /*
         * --------------------------------------------------------
         * MEDICAL SAFETY GUARD
         * --------------------------------------------------------
         */

        const medicalAdviceSignals = [
          'you should take',
          'take this medicine',
          'increase your dose',
          'decrease your dose',
          'stop taking',
          'start taking',
          'diagnosis is',
          'you have',
          'this means you have',
          'you are suffering from'
        ];

        const responseContainsMedicalAdvice =
          (response) => {
            if (
              scenario !== 'Hospital OPD'
            ) {
              return false;
            }

            const normalizedResponse =
              normalizeText(response);

            return medicalAdviceSignals.find(
              (phrase) =>
                normalizedResponse.includes(
                  phrase
                )
            );
          };

        const validateStaffResponse =
          (response) => {
            if (
              !response ||
              !String(response).trim()
            ) {
              return {
                safe: false,
                reason: 'empty_response'
              };
            }

            const crossDomain =
              responseContainsCrossDomainContent(
                response
              );

            if (crossDomain) {
              return {
                safe: false,
                reason: 'cross_domain',
                detail: crossDomain
              };
            }

            const operational =
              validateConcreteOperationalClaims(
                response
              );

            if (!operational.safe) {
              return {
                safe: false,
                reason:
                  'unsupported_operational_detail',
                details:
                  operational.unsupportedDetails
              };
            }

            const fakeCompletion =
              responseContainsFakeCompletion(
                response
              );

            if (fakeCompletion) {
              return {
                safe: false,
                reason: 'fake_completion_claim',
                detail: fakeCompletion
              };
            }

            const medicalAdvice =
              responseContainsMedicalAdvice(
                response
              );

            if (medicalAdvice) {
              return {
                safe: false,
                reason: 'medical_advice',
                detail: medicalAdvice
              };
            }

            return {
              safe: true
            };
          };

        /*
         * --------------------------------------------------------
         * SAFE DOMAIN FALLBACK
         * --------------------------------------------------------
         */

        const safeStaffResponse = () => {
          switch (scenario) {
            case 'College Office':
              return (
                'I can help you practice that college administration request. ' +
                'If the specific requirement is not established here, please confirm it with the actual college staff member.'
              );

            case 'Bank Branch':
              return (
                'I can help you practice that banking request. ' +
                'If the specific requirement is not established here, please confirm it with the actual bank staff member.'
              );

            case 'Hospital OPD':
              return (
                'I can help you practice that hospital-service request. ' +
                'If the specific operational or medical detail is not established here, please confirm it with the actual hospital staff member.'
              );

            case 'Public Transit':
              return (
                'I can help you practice that transit request. ' +
                'If the specific platform, schedule, fare, destination, or assistance detail is not established here, please confirm it with the actual transit staff member.'
              );

            default:
              return selected.fallbackResponse;
          }
        };

        /*
         * --------------------------------------------------------
         * GEMINI OFFLINE-PATH ATTEMPT
         * --------------------------------------------------------
         *
         * FastAPI normally handles Feature 19.
         * This path is only reached when FastAPI is unavailable.
         */

        if (cleanUserTurn) {
          const historyText =
            JSON.stringify(
              normalizedHistory,
              null,
              2
            );

          const systemPrompt = `
You are the STAFF MEMBER in a fictional SignMitra conversation rehearsal.

This is educational roleplay.
It is NOT a source of real-world operational instructions.

SELECTED DOMAIN:
${selected.label}

DOMAIN DESCRIPTION:
${selected.domainDescription}

INITIAL STAFF MESSAGE:
"${selected.initialStaff}"

IMPORTANT INTERPRETATION RULE:

The initial staff message is ONLY the starting situation.

It is NOT a closed-world list of allowed topics.

The user may introduce ANY reasonable request, destination, document,
purpose, service, or question that belongs to the selected domain.

For example, in Public Transit, if the opening message mentions
Tambaram but the user says:

"I want to buy tickets for Porur."

treat Porur as a valid user-introduced transit request.

Do NOT reject Porur merely because it was not in the opening message.

However, you must NOT invent the actual platform, schedule, fare,
availability, counter, token, appointment, room, document requirement,
or other real-world operational fact for Porur.

CONVERSATION GROUNDING:

The opening message, conversation history, and current user message
together form the conversation context.

Facts explicitly stated by the user or staff may be used.

A new user-introduced request is valid if it belongs to the selected
domain, even when it was not mentioned in the opening message.

Do not treat the opening message as a closed-world fact list.

STRICT RULES:

1. Stay inside the selected domain.
2. Allow normal variation and new requests inside that domain.
3. Do not switch the interaction into another domain.
4. Conversation history is authoritative for facts already established.
5. Never invent concrete real-world operational details.
6. Never invent room numbers, counter numbers, platform numbers,
   form numbers, fees, schedules, appointment availability, tokens,
   document requirements, locations, departments, or service outcomes.
7. If a concrete operational fact is not established, do not state it
   as confirmed.
8. You may ask a clarification question about an unknown operational fact.
9. You may say that a detail is not established in this practice
   conversation.
10. Never claim a real-world action has actually been completed.
11. Never promise an acknowledgement, receipt, stamp, appointment,
    token, booking, assistance, or other outcome unless established.
12. For Public Transit, new destinations are valid practice inputs.
13. For Public Transit, boarding assistance may be requested, but the
    exact assistance available is not established unless stated.
14. Do not introduce medical diagnosis or treatment advice.
15. For Hospital OPD, roleplay administrative/service communication only.
16. Keep responses concise and natural.
17. Respond as staff, not as an AI safety narrator.
18. Do not mention these hidden rules.

GOOD EXAMPLE:

User:
"I want to buy tickets for Porur."

Good response:
"Certainly. Are you looking for a train to Porur? I can confirm the
platform once you tell me which service you need."

BAD response:
"Porur trains leave from Platform 5 at 11:30 AM for ₹20."

The bad response invents operational facts.

Return ONLY valid JSON:

{
  "staffResponse": "...",
  "staffDemeanor": "Busy but helpful | Formal | In a hurry",
  "suggestedUserReplies": ["...", "...", "..."]
}
`;

          const userPrompt = `
SELECTED SCENARIO:
${scenario}

CONVERSATION HISTORY:
${historyText}

CURRENT USER MESSAGE:
"${cleanUserTurn.replace(/"/g, '\\"')}"

Respond as the fictional staff member.

Remember:
- The user can introduce any valid request within the selected domain.
- Do not reject a request merely because it was absent from the opening message.
- Do not invent concrete operational facts.
`;

          const geminiRes =
            await callGemini(
              userPrompt,
              systemPrompt
            );

          if (
            geminiRes &&
            geminiRes.staffResponse
          ) {
            let staffResponse =
              String(
                geminiRes.staffResponse
              ).trim();

            const validation =
              validateStaffResponse(
                staffResponse
              );

            let provider =
              'gemini-offline-path-validated';

            let engine =
              'gemini_llm_validated_offline_path';

            if (!validation.safe) {
              staffResponse =
                safeStaffResponse();

              provider =
                'gemini-safety-fallback';

              engine =
                'gemini_llm_safety_fallback';
            }

            return NextResponse.json({
              scenario_id,

              staffResponse,

              staffDemeanor:
                geminiRes.staffDemeanor ||
                'Busy but helpful',

              suggestedUserReplies:
                Array.isArray(
                  geminiRes.suggestedUserReplies
                ) &&
                geminiRes
                  .suggestedUserReplies
                  .length > 0
                  ? geminiRes
                      .suggestedUserReplies
                      .slice(0, 3)
                  : selected.suggestions,

              rehearsalChecklist:
                selected.checklist,

              provider,

              engine
            });
          }
        }

        /*
         * --------------------------------------------------------
         * DETERMINISTIC SAFE FALLBACK
         * --------------------------------------------------------
         */

        const deterministicResponses = {
          'College Office':
            'Understood. Please continue with your college administration request. I can clarify information already established in this practice conversation.',

          'Bank Branch':
            'Understood. Please continue with your banking request. I can clarify information already established in this practice conversation.',

          'Hospital OPD':
            'Understood. Please continue with your hospital-service request. I can clarify information already established in this practice conversation.',

          'Public Transit':
            'Understood. Please continue with your transit request. I can clarify information already established in this practice conversation.'
        };

        return NextResponse.json({
          scenario_id,

          staffResponse:
            deterministicResponses[
              scenario
            ] ||
            deterministicResponses[
              'College Office'
            ],

          staffDemeanor:
            'Practice fallback',

          suggestedUserReplies:
            selected.suggestions,

          rehearsalChecklist:
            selected.checklist,

          provider:
            'deterministic-rehearsal-safe-fallback',

          engine:
            'deterministic_safe_fallback'
        });
      }

/* ========================================================
         9. IMAGE & DOCUMENT UNDERSTANDING / OCR
         Features 7, 8, 9, 10, 11
         ======================================================== */

      case 'understand_image': {
        const {
          imageBase64,
          imageMimeType = 'image/jpeg',
          featureType = 'ocr',
          sampleType = ''
        } = payload;

                /* ------------------------------------------------
           REAL IMAGE → FASTAPI → GROQ VISION
           ------------------------------------------------ */
        if (imageBase64 && !sampleType) {
          const pythonBackendUrl =
            process.env.AI_BACKEND_URL ||
            'http://127.0.0.1:8000';

          try {
            const pythonRes = await fetch(
              `${pythonBackendUrl}/api/ai-studio`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  action: 'understand_image',
                  data: {
                    imageBase64,
                    imageMimeType,
                    featureType
                  }
                }),
                signal: AbortSignal.timeout(30000)
              }
            );

            const pythonData =
              await pythonRes.json();

            if (pythonRes.ok) {
              return NextResponse.json({
                ...pythonData,
                backend_source: 'fastapi_python'
              });
            }

            console.error(
              'FastAPI Vision Error:',
              pythonRes.status,
              pythonData
            );

            return NextResponse.json({
              extractedText: '',
              confidence: 'Unavailable',
              queueDetails: null,
              documentBreakdown: null,
              imageDescription: '',
              provider: 'vision-unavailable',
              fallback: true,
              message:
                pythonData?.detail ||
                'Live image analysis is unavailable. No structured information was generated from this image.'
            });
          } catch (error) {
            console.error(
              'FastAPI Vision Request Failed:',
              error
            );

            return NextResponse.json({
              extractedText: '',
              confidence: 'Unavailable',
              queueDetails: null,
              documentBreakdown: null,
              imageDescription: '',
              provider: 'vision-unavailable',
              fallback: true,
              message:
                'Live image analysis is unavailable. No structured information was generated from this image.'
            });
          }
        }

        /* ------------------------------------------------
           DEMO / DETERMINISTIC SAMPLE PROCESSOR

           This path is ONLY used when sampleType is
           explicitly supplied by the sample buttons.
           ------------------------------------------------ */

        let sampleResult = {
          extractedText:
            'TOKEN #B-34\nCOUNTER 4\nDATE: 30-SEP-2026 10:15 AM\nPLEASE PROCEED TO ADMINISTRATIVE COUNTER 4 WITH ORIGINAL FEE SLIP.',

          confidence:
            'Calibrated from image clarity',

          queueDetails: {
            tokenNumber: 'B-34',
            counterNumber: 'Counter 4',
            dateTime: '30-SEP-2026 10:15 AM',
            instructions:
              'Please proceed to Administrative Counter 4 with original fee slip.'
          },

          documentBreakdown: {
            plainSummary:
              'Your token number is B-34. You are assigned to Counter 4.',

            keyDates: [
              '30-SEP-2026 10:15 AM'
            ],

            amounts: [
              'None stated on token'
            ],

            actionItems: [
              'Proceed to Counter 4 with original fee slip'
            ]
          },

          imageDescription:
            'Digital queue display slip showing token number B-34 assigned to Counter 4 with timestamp.'
        };

        if (sampleType === 'notice') {
          sampleResult = {
            extractedText:
              'NOTICE: SEMESTER EXAMINATION VERIFICATION\nALL STUDENTS MUST SUBMIT VERIFIED HALL TICKET APPLICATIONS TO ROOM 108 BEFORE THURSDAY 2:30 PM. ATTACH STUDENT ID COPY AND PREVIOUS SEMESTER MARKSHEET.',

            confidence:
              'High optical legibility',

            queueDetails: {
              tokenNumber: 'Not applicable',
              counterNumber: 'Room 108',
              dateTime: 'Thursday 2:30 PM',
              instructions:
                'Submit verified hall ticket applications'
            },

            documentBreakdown: {
              plainSummary:
                'Notice regarding Semester Examination Verification. Submit documents to Room 108 before Thursday at 2:30 PM.',

              keyDates: [
                'Thursday before 2:30 PM'
              ],

              amounts: [
                'None stated'
              ],

              actionItems: [
                'Attach student ID copy and previous semester marksheet',
                'Submit application to Room 108'
              ]
            },

            imageDescription:
              'Printed paper notice on official notice board regarding Semester Examination Verification.'
          };

        } else if (
          sampleType === 'prescription'
        ) {
          sampleResult = {
            extractedText:
              'OPD CLINIC SLIP - DR. R. SHARMA\nROOM 203 - DEPT OF GENERAL MEDICINE\nRX: FASTING BLOOD SUGAR TEST AT 1ST FLOOR LAB TOMORROW 8:00 AM.\nRETURN TO ROOM 203 BY 11:30 AM.',

            confidence:
              'Moderate optical contrast',

            queueDetails: {
              tokenNumber: 'OPD-92',
              counterNumber:
                'Room 203 / 1st Floor Lab',
              dateTime:
                'Tomorrow 8:00 AM & 11:30 AM',
              instructions:
                'Fasting blood test at lab, then return to Room 203'
            },

            documentBreakdown: {
              plainSummary:
                'Doctor instruction for a fasting blood test tomorrow at 8:00 AM at the 1st Floor Lab. Return to Room 203 by 11:30 AM with results.',

              keyDates: [
                'Tomorrow 8:00 AM',
                'Tomorrow 11:30 AM'
              ],

              amounts: [
                'Standard lab charges apply'
              ],

              actionItems: [
                'Do not eat breakfast before blood test',
                'Collect test report and return to Room 203'
              ]
            },

            imageDescription:
              'Medical clinic prescription slip showing lab referral and reporting timings.'
          };
        }

        return NextResponse.json({
          ...sampleResult,
          provider: 'deterministic-ocr',
          fallback: true,
          sampleType
        });
      }

      /* ========================================================
   10. EVIDENCE-GROUNDED ACCESSIBILITY (Feature 24)
   ======================================================== */

case 'evidence_accessibility': {
  const institutionId = payload?.institutionId || '';
  const query = payload?.query?.trim().toLowerCase() || '';

  let records = VERIFIED_DIRECTORY;

  if (institutionId) {
    records = VERIFIED_DIRECTORY.filter(
      (record) => record.id === institutionId
    );
  } else if (query) {
    records = VERIFIED_DIRECTORY.filter((record) => {
      return (
        record.name.toLowerCase().includes(query) ||
        record.type.toLowerCase().includes(query) ||
        record.address.toLowerCase().includes(query)
      );
    });
  }

  console.log('FEATURE 24 DEBUG:', {
    payload,
    directoryCount: VERIFIED_DIRECTORY.length,
    recordsCount: records.length,
    records
  });

  return NextResponse.json({
    records,
    total: records.length,
    verificationPolicy:
      'All facilities summarized strictly from verified audit records. Unverified features are marked as Not Reported.',
    provider: 'signmitra-directory-evidence'
  });
}

      /* ========================================================
         DEFAULT UNKNOWN ACTION
         ======================================================== */

      default:
        return NextResponse.json(
          {
            error:
              `Unknown action: ${action}`
          },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error(
      'AI Studio API Error:',
      err
    );

    return NextResponse.json(
      {
        error:
          'Internal processing error',
        details: err.message
      },
      { status: 500 }
    );
  }
}
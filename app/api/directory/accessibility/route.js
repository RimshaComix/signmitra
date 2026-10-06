import { NextResponse } from 'next/server';

/**
 * Accessibility Evidence Lookup
 *
 * Free approach:
 * - OpenStreetMap / Nominatim for public place metadata
 * - Wikimedia REST API for publicly documented place information
 * - Conservative keyword evidence extraction
 *
 * IMPORTANT:
 * Absence of evidence NEVER means "not available".
 * Only explicit evidence can produce "available" or "unavailable".
 */

const APP_USER_AGENT =
  'SignMitra-Accessibility-Directory/1.0 (accessibility@example.com)';

const UNKNOWN_TEXT = {
  interpreter: 'No reliable public source was found confirming ISL interpreter availability.',
  visualQueue:
    'No reliable public source was found confirming visual queue or display support.',
  writtenSupport:
    'No reliable public source was found confirming written communication support.'
};

const FEATURE_RULES = {
  interpreter: {
    positive: [
      'sign language interpreter',
      'sign-language interpreter',
      'isl interpreter',
      'indian sign language interpreter',
      'sign language interpretation',
      'sign-language interpretation',
      'interpreter service',
      'interpreting service'
    ],
    negative: [
      'no sign language interpreter',
      'sign language interpreter not available',
      'interpreter service not available',
      'interpreter unavailable'
    ]
  },

  visualQueue: {
    positive: [
      'visual queue',
      'visual token',
      'visual tokens',
      'display board',
      'display boards',
      'digital display',
      'queue display',
      'electronic display',
      'visual display',
      'token display'
    ],
    negative: [
      'no visual queue',
      'visual queue not available',
      'display board not available',
      'visual display not available'
    ]
  },

  writtenSupport: {
    positive: [
      'written communication',
      'written support',
      'written instructions',
      'writing pad',
      'writing pads',
      'pen and paper',
      'written notes',
      'communication in writing',
      'written communication support'
    ],
    negative: [
      'written support not available',
      'written communication not available',
      'writing support not available'
    ]
  }
};

/**
 * Normalize text before keyword matching.
 */
function normalizeText(value = '') {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Escape text used in a regular expression.
 */
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Find a short sentence/snippet around matched evidence.
 */
function getEvidenceSnippet(text, keyword) {
  const normalized = normalizeText(text);

  const index = normalized.indexOf(keyword.toLowerCase());

  if (index === -1) {
    return null;
  }

  const start = Math.max(0, index - 180);
  const end = Math.min(normalized.length, index + keyword.length + 220);

  let snippet = normalized.slice(start, end).trim();

  if (start > 0) {
    snippet = '…' + snippet;
  }

  if (end < normalized.length) {
    snippet = snippet + '…';
  }

  return snippet;
}

/**
 * Analyze a source for one accessibility feature.
 *
 * Conservative rule:
 * - Explicit negative evidence => unavailable
 * - Explicit positive evidence => available
 * - Otherwise => unknown
 */
function analyzeFeature(text, feature) {
  const normalized = normalizeText(text);
  const rules = FEATURE_RULES[feature];

  if (!rules) {
    return {
      status: 'unknown',
      text: UNKNOWN_TEXT[feature]
    };
  }

  // Negative evidence gets priority.
  for (const keyword of rules.negative) {
    if (normalized.includes(keyword)) {
      return {
        status: 'unavailable',
        text: `Public source indicates that ${featureLabel(feature)} is not available.`,
        evidence: getEvidenceSnippet(text, keyword)
      };
    }
  }

  for (const keyword of rules.positive) {
    if (normalized.includes(keyword)) {
      return {
        status: 'available',
        text: `Public source mentions ${featureLabel(feature)}.`,
        evidence: getEvidenceSnippet(text, keyword)
      };
    }
  }

  return {
    status: 'unknown',
    text: UNKNOWN_TEXT[feature]
  };
}

function featureLabel(feature) {
  switch (feature) {
    case 'interpreter':
      return 'ISL/sign-language interpreter support';

    case 'visualQueue':
      return 'visual queue or display support';

    case 'writtenSupport':
      return 'written communication support';

    default:
      return 'this accessibility feature';
  }
}

/**
 * Safely fetch a URL with a timeout.
 */
async function safeFetch(url, options = {}) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, options.timeout || 8000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': APP_USER_AGENT,
        Accept: 'application/json,text/html;q=0.9,*/*;q=0.8',
        ...(options.headers || {})
      }
    });

    return response;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Search OpenStreetMap Nominatim for the exact place.
 *
 * This is intentionally one request per user-triggered verification.
 */
async function lookupOpenStreetMap({ name, address }) {
  const query = [name, address].filter(Boolean).join(', ');

  if (!query.trim()) {
    return null;
  }

  try {
    const url = new URL(
      'https://nominatim.openstreetmap.org/search'
    );

    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', '3');

    const response = await safeFetch(url.toString(), {
      timeout: 8000,
      headers: {
        'Referer': 'http://localhost:3000/'
      }
    });

    if (!response.ok) {
      return null;
    }

    const results = await response.json();

    if (!Array.isArray(results) || results.length === 0) {
      return null;
    }

    return results[0];
  } catch (error) {
    console.warn('OpenStreetMap lookup failed:', error.message);
    return null;
  }
}

/**
 * Search Wikimedia's public API for a potentially relevant page.
 *
 * This is supplementary evidence only.
 */
async function lookupWikimedia(name) {
  if (!name?.trim()) {
    return null;
  }

  try {
    const searchUrl = new URL(
      'https://en.wikipedia.org/w/rest.php/v1/search/page'
    );

    searchUrl.searchParams.set('q', name);
    searchUrl.searchParams.set('limit', '3');

    const searchResponse = await safeFetch(searchUrl.toString(), {
      timeout: 8000
    });

    if (!searchResponse.ok) {
      return null;
    }

    const searchData = await searchResponse.json();

    const pages = Array.isArray(searchData?.pages)
      ? searchData.pages
      : [];

    if (pages.length === 0) {
      return null;
    }

    const page = pages[0];

    const title = page?.title;

    if (!title) {
      return null;
    }

    const pageUrl =
      'https://en.wikipedia.org/w/rest.php/v1/page/' +
      encodeURIComponent(title);

    const pageResponse = await safeFetch(pageUrl, {
      timeout: 8000
    });

    if (!pageResponse.ok) {
      return null;
    }

    const pageData = await pageResponse.json();

    return {
      title,
      url:
        pageData?.html_url ||
        `https://en.wikipedia.org/wiki/${encodeURIComponent(
          title.replace(/ /g, '_')
        )}`,
      text: pageData?.source || pageData?.description || ''
    };
  } catch (error) {
    console.warn('Wikimedia lookup failed:', error.message);
    return null;
  }
}

/**
 * Convert OSM result into searchable public-source text.
 */
function buildOsmEvidence(osmResult) {
  if (!osmResult) {
    return '';
  }

  const address = osmResult.address || {};

  return [
    osmResult.name,
    osmResult.display_name,
    osmResult.type,
    osmResult.class,
    address.amenity,
    address.building,
    address.city,
    address.town,
    address.state,
    address.country
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * Build the final feature result from all collected evidence.
 *
 * Positive/negative evidence is only returned if a real source
 * actually contains matching accessibility language.
 */
function buildFeatureResult(feature, sources) {
  const positiveEvidence = [];
  const negativeEvidence = [];

  for (const source of sources) {
    if (!source?.text) {
      continue;
    }

    const result = analyzeFeature(source.text, feature);

    if (result.status === 'available') {
      positiveEvidence.push({
        source: source.title,
        url: source.url,
        evidence: result.evidence
      });
    }

    if (result.status === 'unavailable') {
      negativeEvidence.push({
        source: source.title,
        url: source.url,
        evidence: result.evidence
      });
    }
  }

  /**
   * Explicit negative evidence.
   */
  if (negativeEvidence.length > 0 && positiveEvidence.length === 0) {
    return {
      status: 'unavailable',
      text: negativeEvidence[0].evidence
        ? `Public source indicates that ${featureLabel(feature)} is not available.`
        : UNKNOWN_TEXT[feature],
      evidence: negativeEvidence[0].evidence,
      source: negativeEvidence[0].url
    };
  }

  /**
   * Explicit positive evidence.
   */
  if (positiveEvidence.length > 0) {
    return {
      status: 'available',
      text: `Public source mentions ${featureLabel(feature)}.`,
      evidence: positiveEvidence[0].evidence,
      source: positiveEvidence[0].url
    };
  }

  /**
   * No evidence.
   */
  return {
    status: 'unknown',
    text: UNKNOWN_TEXT[feature],
    evidence: null,
    source: null
  };
}

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      place_id,
      name,
      address,
      latitude,
      longitude
    } = body;

    if (!place_id || !name) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_REQUIRED_FIELDS',
          message: 'place_id and name are required.'
        },
        { status: 400 }
      );
    }

    /*
     * ------------------------------------------------------------
     * 1. Start with the place information supplied by the frontend.
     * ------------------------------------------------------------
     */

    const sources = [];

    /*
     * ------------------------------------------------------------
     * 2. Verify the place against OpenStreetMap.
     * ------------------------------------------------------------
     */

    const osmResult = await lookupOpenStreetMap({
      name,
      address
    });

    if (osmResult) {
      sources.push({
        type: 'openstreetmap',
        title: 'OpenStreetMap',
        url: `https://www.openstreetmap.org/${osmResult.osm_type}/${osmResult.osm_id}`,
        text: buildOsmEvidence(osmResult)
      });
    }

    /*
     * ------------------------------------------------------------
     * 3. Supplement with Wikimedia if a relevant public page exists.
     * ------------------------------------------------------------
     */

    const wikipediaResult = await lookupWikimedia(name);

    if (wikipediaResult) {
      sources.push({
        type: 'wikimedia',
        title: `Wikimedia — ${wikipediaResult.title}`,
        url: wikipediaResult.url,
        text: wikipediaResult.text
      });
    }

    /*
     * ------------------------------------------------------------
     * 4. Analyze accessibility features conservatively.
     * ------------------------------------------------------------
     */

    const features = {
      interpreter: buildFeatureResult(
        'interpreter',
        sources
      ),

      visualQueue: buildFeatureResult(
        'visualQueue',
        sources
      ),

      writtenSupport: buildFeatureResult(
        'writtenSupport',
        sources
      )
    };

    /*
     * ------------------------------------------------------------
     * 5. Determine verification state.
     * ------------------------------------------------------------
     */

    const evidenceCount = Object.values(features).filter(
      (feature) => feature.status !== 'unknown'
    ).length;

    const verificationLevel =
      evidenceCount > 0
        ? 'public_source_evidence'
        : 'no_public_evidence';

    /*
     * ------------------------------------------------------------
     * 6. Return structured evidence to the directory page.
     * ------------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      place: {
        id: place_id,
        name,
        address: address || null,
        latitude: latitude ?? osmResult?.lat ?? null,
        longitude: longitude ?? osmResult?.lon ?? null
      },

      features,

      verificationLevel,

      verifiedBy:
        evidenceCount > 0
          ? 'Public Source Evidence Lookup'
          : 'No public accessibility evidence found',

      sourcesChecked: sources.map((source) => ({
        type: source.type,
        title: source.title,
        url: source.url
      })),

      sourceCount: sources.length,

      evidenceCount,

      lastVerified: new Date().toISOString(),

      message:
        evidenceCount > 0
          ? 'Public accessibility evidence was found and classified.'
          : 'No reliable public accessibility evidence was found. Unknown does not mean unavailable.'
    });

  } catch (error) {
    console.error(
      'Accessibility lookup error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: 'ACCESSIBILITY_LOOKUP_FAILED',
        message:
          'Unable to complete the public accessibility lookup.'
      },
      { status: 500 }
    );
  }
}
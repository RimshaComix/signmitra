const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
const TIMEOUT_MS = 6000;

// Helper to prevent hanging requests in spotty network or offline conditions
async function fetchWithTimeout(resource, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export const signMitraAPI = {
  // 1. Initialize a new stateful session on the server
  createSession: async (domain, intent) => {
    const res = await fetchWithTimeout(`${BASE_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, intent }),
    });
    if (!res.ok) throw new Error('Failed to initialize server session');
    return res.json();
  },

  // 2. Fetch an existing session card's data matrix
  getSession: async (sessionId) => {
    const res = await fetchWithTimeout(`${BASE_URL}/sessions/${sessionId}`);
    if (!res.ok) throw new Error('Session lookup failure');
    return res.json();
  },

  // 3. Drive the state machine transitions (SUBMIT_ENTITY, BACK, CANCEL, HANDOFF_STAFF)
  transitionSession: async (sessionId, action, incomingEntities = null) => {
    const res = await fetchWithTimeout(`${BASE_URL}/sessions/${sessionId}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, incomingEntities }),
    });
    if (!res.ok) throw new Error('State transition failure');
    return res.json();
  },

  // 4. Record the two-way response submitted by the hearing staff member
  submitStaffResponse: async (sessionId, selectedOption, customText = '') => {
    const res = await fetchWithTimeout(`${BASE_URL}/sessions/${sessionId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selectedOption, customText }),
    });
    if (!res.ok) throw new Error('Failed to log staff response');
    return res.json();
  },

  // 5. Securely fetch a user's emergency profile parameters from the cloud vault
  getEmergencyProfile: async (userId) => {
    const res = await fetchWithTimeout(`${BASE_URL}/emergency/profile/${userId}`);
    if (!res.ok) throw new Error('Failed to retrieve server health profile');
    return res.json();
  },

  // 6. Synchronize/Upsert emergency metrics directly into the secure MongoDB database cluster
  saveEmergencyProfile: async (profileData) => {
    const res = await fetchWithTimeout(`${BASE_URL}/emergency/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });
    if (!res.ok) throw new Error('Failed to synchronize profile parameters with server');
    return res.json();
  }
};
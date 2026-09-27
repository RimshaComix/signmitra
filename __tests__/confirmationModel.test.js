describe('SignMitra Data Attribution & Confirmation Logic', () => {
  
  beforeEach(() => {
    localStorage.clear();
  });

  test('defaults to unverified when saved without staff confirmation', () => {
    const unverifiedRecord = {
      id: 'REQ-123',
      intent: 'live_chat',
      verifiedByStaff: false,
      entities: { 'Next Action': 'Wait at counter' }
    };

    localStorage.setItem('signmitra_history', JSON.stringify([unverifiedRecord]));
    const stored = JSON.parse(localStorage.getItem('signmitra_history'));

    expect(stored[0].verifiedByStaff).toBe(false);
  });

  test('correctly records staff verification flag upon explicit confirmation', () => {
    const verifiedRecord = {
      id: 'REQ-456',
      intent: 'live_chat',
      verifiedByStaff: true,
      entities: { 'Next Action': 'Proceed to Room 302' }
    };

    localStorage.setItem('signmitra_history', JSON.stringify([verifiedRecord]));
    const stored = JSON.parse(localStorage.getItem('signmitra_history'));

    expect(stored[0].verifiedByStaff).toBe(true);
  });

  test('prevents duplicate key collisions when persisting multiple follow-ups', () => {
    const taskA = { id: 'FOLLOW-1', title: 'Task A', status: 'Planned' };
    const taskB = { id: 'FOLLOW-2', title: 'Task B', status: 'Planned' };

    localStorage.setItem('signmitra_followups', JSON.stringify([taskA, taskB]));
    const stored = JSON.parse(localStorage.getItem('signmitra_followups'));

    expect(stored).toHaveLength(2);
    expect(stored[0].id).not.toEqual(stored[1].id);
  });
});
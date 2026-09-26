const aiService = require('../../src/services/ai.service');

describe('Unit Test: AI Campus Intelligence Service (Groq)', () => {
  it('should moderate academic listing and return valid structured JSON', async () => {
    const result = await aiService.moderateListing({
      title: 'University Physics with Modern Physics 14th Edition',
      description: 'Used textbook for Engineering students, clean pages, no highlighting.',
      category: 'Textbooks',
      price: 450,
    });

    expect(result).toBeDefined();
    expect(typeof result.approved).toBe('boolean');
    expect(Array.isArray(result.flag_reasons)).toBe(true);
    expect(typeof result.risk_score).toBe('number');
    expect(result.risk_score).toBeLessThanOrEqual(50);
  }, 25000);

  it('should evaluate fair-trade barter between two academic items', async () => {
    const result = await aiService.estimateBarterFairness({
      offeredItem: {
        title: 'Accounting Principles 12th Ed Weygandt',
        condition: 'Good',
        price: 300,
        description: 'Hardbound book for CBA students',
      },
      requestedItem: {
        title: 'Financial Accounting Vol 1 Valix 2024',
        condition: 'Like New',
        price: 350,
        description: 'Reviewer with complete practice problems',
      },
    });

    expect(result).toBeDefined();
    expect(typeof result.fair).toBe('boolean');
    expect(typeof result.fairness_score).toBe('number');
    expect(typeof result.analysis).toBe('string');
  }, 25000);

  it('should generate an autofill listing draft for campus item', async () => {
    const draft = await aiService.autofillListing({
      query: 'UC Blue Polo Uniform Large',
      campus: 'UC Main',
    });

    expect(draft).toBeDefined();
    expect(typeof draft.title).toBe('string');
    expect(draft.title.length).toBeGreaterThan(0);
    expect(typeof draft.description).toBe('string');
    expect(typeof draft.suggested_price).toBe('number');
    expect(Array.isArray(draft.tags)).toBe(true);
  }, 25000);

  it('should suggest safe physical meetup zones on UC campus', async () => {
    const suggestion = await aiService.suggestSafeMeetup({
      buyerCampus: 'UC Main',
      sellerCampus: 'UC Main',
      proposedTime: '1:00 PM',
    });

    expect(suggestion).toBeDefined();
    expect(Array.isArray(suggestion.recommended_locations)).toBe(true);
    expect(suggestion.recommended_locations.length).toBeGreaterThan(0);
    expect(suggestion.recommended_locations[0].safety_rating).toBeDefined();
    expect(suggestion.time_assessment).toBeDefined();
  }, 25000);
});

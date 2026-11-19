jest.mock('../../src/config/db', () => ({
  raw: jest.fn()
}));

const db = require('../../src/config/db');
const { ensureListingStatusSchema } = require('../../src/services/listingStatusSchema.service');

describe('ensureListingStatusSchema', () => {
  it('upgrades the legacy enum while preserving old rows and adds active/reserved states', async () => {
    db.raw
      .mockResolvedValueOnce([[{ Type: "enum('available','pending','sold','archived','banned','deleted')" }], []])
      .mockResolvedValueOnce([{}, []])
      .mockResolvedValueOnce([{}, []])
      .mockResolvedValueOnce([{}, []]);

    await ensureListingStatusSchema();

    expect(db.raw).toHaveBeenCalledTimes(4);
    expect(db.raw.mock.calls[1][0]).toContain("'reserved'");
    expect(db.raw.mock.calls[2][0]).toContain("= 'active' WHERE");
    expect(db.raw.mock.calls[3][0]).toContain("'swapped'");
  });
});

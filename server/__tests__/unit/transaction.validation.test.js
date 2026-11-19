const { createTransactionSchema } = require('../../src/validations/transaction.validation');

describe('createTransactionSchema', () => {
  it('preserves the requested quantity and accepts barter payment', () => {
    const { error, value } = createTransactionSchema.validate({
      listingId: 'listing-123',
      sellerId: 'seller-123',
      amount: 125,
      paymentMethod: 'barter',
      quantity: 4
    }, { stripUnknown: true });

    expect(error).toBeUndefined();
    expect(value.quantity).toBe(4);
    expect(value.paymentMethod).toBe('barter');
  });

  it('defaults quantity to one when the client omits it', () => {
    const { error, value } = createTransactionSchema.validate({ listingId: 'listing-123' });
    expect(error).toBeUndefined();
    expect(value.quantity).toBe(1);
  });

  it('rejects zero, fractional, and excessive quantities', () => {
    for (const quantity of [0, 1.5, 101]) {
      const { error } = createTransactionSchema.validate({ listingId: 'listing-123', quantity });
      expect(error).toBeDefined();
    }
  });
});

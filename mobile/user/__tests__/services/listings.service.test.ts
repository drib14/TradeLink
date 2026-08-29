import { mobileListingsService } from '../../services/listings.service';
import { mobileApi } from '../../services/api';

jest.mock('../../services/api', () => ({
  mobileApi: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
}));

describe('Mobile App Listings Service Test Suite', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call /listings with query filters', async () => {
    const mockListings = [
      { id: 'list_1', title: 'Calculus Book', price: 350 },
      { id: 'list_2', title: 'Nursing Scrubs', price: 650 },
    ];

    (mobileApi.get as jest.Mock).mockResolvedValueOnce({
      status: 'success',
      data: { listings: mockListings },
    });

    const filters = { campus: 'UC Banilad', category: 'Textbooks' };
    const result = await mobileListingsService.getListings(filters);

    expect(mobileApi.get).toHaveBeenCalledWith('/listings', filters);
    expect(result.length).toBe(2);
    expect(result[0].title).toBe('Calculus Book');
  });

  it('should call /listings/:id for single item details', async () => {
    const mockListing = {
      id: 'list_99',
      title: 'Sony Headphones',
      price: 8900,
    };

    (mobileApi.get as jest.Mock).mockResolvedValueOnce({
      status: 'success',
      data: { listing: mockListing },
    });

    const result = await mobileListingsService.getListingById('list_99');

    expect(mobileApi.get).toHaveBeenCalledWith('/listings/list_99');
    expect(result.title).toBe('Sony Headphones');
  });
});

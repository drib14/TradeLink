import { mobileApi, API_BASE_URL, setMobileAccessToken, getMobileAccessToken } from '../../services/api';

describe('Mobile App API Client Test Suite', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should have API_BASE_URL defined properly', () => {
    expect(API_BASE_URL).toBeDefined();
    expect(typeof API_BASE_URL).toBe('string');
  });

  it('should store and retrieve access token', async () => {
    await setMobileAccessToken('test_jwt_mobile_token_123');
    const token = await getMobileAccessToken();
    expect(token).toBe('test_jwt_mobile_token_123');
  });

  it('should include Authorization header when token is set', async () => {
    await setMobileAccessToken('token_abc');

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success', data: { listings: [] } }),
    });

    await mobileApi.get('/listings');

    expect(global.fetch).toHaveBeenCalled();
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const headers = fetchCall[1].headers;

    expect(headers['Authorization']).toBe('Bearer token_abc');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('should handle API errors and throw normalized error format', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ status: 'error', message: 'Session expired.' }),
    });

    await expect(mobileApi.get('/auth/me')).rejects.toEqual(
      expect.objectContaining({
        status: 'error',
        statusCode: 401,
        message: 'Session expired.',
      })
    );
  });
});

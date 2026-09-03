import { mobileAuthService } from '../../services/auth.service';
import { mobileApi } from '../../services/api';

jest.mock('../../services/api', () => ({
  mobileApi: {
    post: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
  },
  setMobileAccessToken: jest.fn(),
  getMobileAccessToken: jest.fn(),
}));

describe('Mobile App Auth Service Test Suite', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call /auth/login with student ID and return user and token', async () => {
    const mockUser = {
      id: 'usr_test_123',
      name: 'Maria Santos',
      email: 'maria.santos@gmail.com',
      studentId: '202104982',
      campus: 'UC Banilad',
      role: 'student',
    };

    (mobileApi.post as jest.Mock).mockResolvedValueOnce({
      status: 'success',
      data: {
        user: mockUser,
        accessToken: 'access_token_123',
      },
    });

    const result = await mobileAuthService.login('202104982', 'password123');

    expect(mobileApi.post).toHaveBeenCalledWith('/auth/login', {
      studentId: '202104982',
      idNumber: '202104982',
      emailOrStudentId: '202104982',
      password: 'password123',
    });
    expect(result.user).toEqual(mockUser);
    expect(result.accessToken).toBe('access_token_123');
  });

  it('should call /auth/register with personal email and student details', async () => {
    const newStudent = {
      name: 'Kenzo Lim',
      email: 'kenzo.lim@gmail.com',
      studentId: '2023123456',
      campus: 'UC LM' as const,
      college: 'Engineering' as const,
      password: 'SecurePassword123!',
    };

    (mobileApi.post as jest.Mock).mockResolvedValueOnce({
      status: 'success',
      data: {
        user: { id: 'usr_kenzo', ...newStudent },
        accessToken: 'kenzo_token',
      },
    });

    const result = await mobileAuthService.register(newStudent);

    expect(mobileApi.post).toHaveBeenCalledWith('/auth/register', expect.objectContaining({
      name: 'Kenzo Lim',
      email: 'kenzo.lim@gmail.com',
      studentId: '2023123456',
      campus: 'UC LM',
      college: 'Engineering',
    }));
    expect(result.accessToken).toBe('kenzo_token');
  });
});

import { LoginInput } from './auth.types';

export class AuthService {
  async login(credentials: LoginInput) {
    // Mock login logic
    if (credentials.email === 'demo@test.com' && credentials.password === '123456') {
      return { token: 'mock-jwt-token', user: { id: 1, email: credentials.email } };
    }
    throw new Error('Invalid credentials');
  }
}

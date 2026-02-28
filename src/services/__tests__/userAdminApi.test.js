import { describe, it, expect, vi, beforeEach } from 'vitest';

import { apiService } from '../axiosApi.js';
import { userAdminAPI } from '../userAdminApi.js';

vi.mock('../axiosApi.js', () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('userAdminAPI', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('list', () => {
    it('should return users array from response.users', async () => {
      apiService.get.mockResolvedValue({ users: [{ id: 1, name: 'Alice' }] });

      const result = await userAdminAPI.list();

      expect(result).toEqual([{ id: 1, name: 'Alice' }]);
      expect(apiService.get).toHaveBeenCalledWith('/users', { params: {} });
    });

    it('should return raw array if response is already an array', async () => {
      apiService.get.mockResolvedValue([{ id: 1 }]);

      const result = await userAdminAPI.list();

      expect(result).toEqual([{ id: 1 }]);
    });

    it('should return response as-is if no users property and not array', async () => {
      apiService.get.mockResolvedValue({ data: 'something' });

      const result = await userAdminAPI.list();

      expect(result).toEqual({ data: 'something' });
    });

    it('should return empty array for falsy response', async () => {
      apiService.get.mockResolvedValue(null);

      const result = await userAdminAPI.list();

      expect(result).toEqual([]);
    });

    it('should pass params to API', async () => {
      apiService.get.mockResolvedValue({ users: [] });

      await userAdminAPI.list({ role: 'admin', page: 1 });

      expect(apiService.get).toHaveBeenCalledWith('/users', { params: { role: 'admin', page: 1 } });
    });
  });

  describe('create', () => {
    it('should create a user and return user from response', async () => {
      const userData = { name: 'Bob', email: 'bob@test.com', password: 'pass123', role: 'viewer' };
      apiService.post.mockResolvedValue({ user: { id: 2, ...userData } });

      const result = await userAdminAPI.create(userData);

      expect(result).toEqual({ id: 2, ...userData });
      expect(apiService.post).toHaveBeenCalledWith('/users', {
        name: 'Bob',
        email: 'bob@test.com',
        password: 'pass123',
        role: 'viewer',
      });
    });

    it('should include permissions when provided', async () => {
      const userData = { name: 'Bob', email: 'bob@test.com', password: 'pass', role: 'admin', permissions: { invoices: true } };
      apiService.post.mockResolvedValue({ user: { id: 3 } });

      await userAdminAPI.create(userData);

      expect(apiService.post).toHaveBeenCalledWith('/users', {
        name: 'Bob',
        email: 'bob@test.com',
        password: 'pass',
        role: 'admin',
        permissions: { invoices: true },
      });
    });

    it('should return raw response if no user property', async () => {
      apiService.post.mockResolvedValue({ id: 4, name: 'Raw' });

      const result = await userAdminAPI.create({ name: 'Raw', email: 'r@t.com', password: 'p', role: 'viewer' });

      expect(result).toEqual({ id: 4, name: 'Raw' });
    });
  });

  describe('update', () => {
    it('should update user and return user from response', async () => {
      apiService.patch.mockResolvedValue({ user: { id: 1, name: 'Updated' } });

      const result = await userAdminAPI.update(1, { name: 'Updated' });

      expect(result).toEqual({ id: 1, name: 'Updated' });
      expect(apiService.patch).toHaveBeenCalledWith('/users/1', { name: 'Updated' });
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      apiService.delete.mockResolvedValue({ success: true });

      const result = await userAdminAPI.remove(5);

      expect(result).toEqual({ success: true });
      expect(apiService.delete).toHaveBeenCalledWith('/users/5');
    });
  });

  describe('changePassword', () => {
    it('should change user password', async () => {
      apiService.put.mockResolvedValue({ message: 'Password changed' });

      const result = await userAdminAPI.changePassword(3, { currentPassword: 'old', newPassword: 'new' });

      expect(result).toEqual({ message: 'Password changed' });
      expect(apiService.put).toHaveBeenCalledWith('/users/3/password', { currentPassword: 'old', newPassword: 'new' });
    });
  });

  describe('invite', () => {
    it('should send user invitation', async () => {
      apiService.post.mockResolvedValue({ invitation: { id: 10 } });

      const result = await userAdminAPI.invite({ name: 'Charlie', email: 'charlie@test.com', role: 'editor' });

      expect(result).toEqual({ invitation: { id: 10 } });
      expect(apiService.post).toHaveBeenCalledWith('/users/invite', { name: 'Charlie', email: 'charlie@test.com', role: 'editor' });
    });
  });

  describe('resendInvite', () => {
    it('should resend invitation by email', async () => {
      apiService.post.mockResolvedValue({ success: true });

      const result = await userAdminAPI.resendInvite('charlie@test.com');

      expect(result).toEqual({ success: true });
      expect(apiService.post).toHaveBeenCalledWith('/users/invite/resend', { email: 'charlie@test.com' });
    });
  });

  describe('revokeInvite', () => {
    it('should revoke invitation by id', async () => {
      apiService.post.mockResolvedValue({ success: true });

      const result = await userAdminAPI.revokeInvite(10);

      expect(result).toEqual({ success: true });
      expect(apiService.post).toHaveBeenCalledWith('/users/invite/revoke', { invitationId: 10 });
    });
  });

  describe('listInvitations', () => {
    it('should return invitations array', async () => {
      apiService.get.mockResolvedValue({ invitations: [{ id: 10, email: 'charlie@test.com' }] });

      const result = await userAdminAPI.listInvitations();

      expect(result).toEqual([{ id: 10, email: 'charlie@test.com' }]);
    });

    it('should return empty array if no invitations property', async () => {
      apiService.get.mockResolvedValue({});

      const result = await userAdminAPI.listInvitations();

      expect(result).toEqual([]);
    });
  });
});

import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get API URL from environment variables
const API_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL || process.env.API_URL || 'https://padel-community-app-production.up.railway.app/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('user');
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async sendOTP(identifier: string, medium: 'email' | 'whatsapp') {
    const response = await this.client.post('/auth/send-otp', {
      identifier,
      medium,
    });
    return response.data;
  }

  async verifyOTP(identifier: string, code: string, name?: string) {
    const response = await this.client.post('/auth/verify-otp', {
      identifier,
      code,
      name,
    });
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  async updateProfile(updates: any) {
    const response = await this.client.put('/auth/profile', updates);
    return response.data;
  }

  async register(data: { email: string; name: string; phone: string; password: string }) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async verifyRegistrationOTP(phone: string, code: string) {
    const response = await this.client.post('/auth/verify-registration', {
      phone,
      code,
    });
    return response.data;
  }

  async login(identifier: string, password: string) {
    const response = await this.client.post('/auth/login', {
      identifier,
      password,
    });
    return response.data;
  }

  async forgotPassword(identifier: string) {
    const response = await this.client.post('/auth/forgot-password', {
      identifier,
    });
    return response.data;
  }

  async resetPassword(phone: string, code: string, newPassword: string) {
    const response = await this.client.post('/auth/reset-password', {
      phone,
      code,
      newPassword,
    });
    return response.data;
  }

  async savePushToken(pushToken: string) {
    const response = await this.client.post('/auth/push-token', {
      pushToken,
    });
    return response.data;
  }

  async switchRole(role: string) {
    const response = await this.client.post('/auth/switch-role', {
      role,
    });
    return response.data;
  }

  // Community endpoints
  async getAllCommunities() {
    const response = await this.client.get('/communities');
    return response.data;
  }

  async getCommunity(id: string) {
    const response = await this.client.get(`/communities/${id}`);
    return response.data;
  }

  async getUserCommunities() {
    const response = await this.client.get('/communities/my-communities');
    return response.data;
  }

  async createCommunity(data: any) {
    const response = await this.client.post('/communities', data);
    return response.data;
  }

  async updateCommunity(id: string, updates: any) {
    const response = await this.client.put(`/communities/${id}`, updates);
    return response.data;
  }

  async joinCommunity(id: string) {
    const response = await this.client.post(`/communities/${id}/join`);
    return response.data;
  }

  async leaveCommunity(id: string) {
    const response = await this.client.post(`/communities/${id}/leave`);
    return response.data;
  }

  async getSubCommunities(communityId: string) {
    const response = await this.client.get(`/communities/${communityId}/sub-communities`);
    return response.data.sub_communities || [];
  }

  async joinCommunityWithSubs(communityId: string, subCommunityIds: string[]) {
    const response = await this.client.post(`/communities/${communityId}/join-with-subs`, {
      sub_community_ids: subCommunityIds,
    });
    return response.data;
  }

  async createSubCommunity(communityId: string, data: any) {
    const response = await this.client.post(`/communities/${communityId}/sub-communities`, data);
    return response.data;
  }

  async updateSubCommunity(communityId: string, subCommunityId: string, updates: any) {
    const url = `/communities/${communityId}/sub-communities/${subCommunityId}`;
    console.log('[API] Updating sub-community:', { communityId, subCommunityId, updates, url });
    try {
      const response = await this.client.put(url, updates);
      console.log('[API] Update successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[API] Update failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        error: error.response?.data,
        url,
      });
      throw error;
    }
  }

  async deleteSubCommunity(communityId: string, subCommunityId: string) {
    const url = `/communities/${communityId}/sub-communities/${subCommunityId}`;
    console.log('[API] Deleting sub-community:', { communityId, subCommunityId, url });
    try {
      const response = await this.client.delete(url);
      console.log('[API] Delete successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[API] Delete failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        error: error.response?.data,
        url,
      });
      throw error;
    }
  }

  // Session endpoints
  async getAvailableSessions(communityId?: string) {
    const response = await this.client.get('/sessions/available', {
      params: { community_id: communityId },
    });
    return response.data;
  }

  async getSession(id: string) {
    const response = await this.client.get(`/sessions/${id}`);
    return response.data;
  }

  async createSession(data: any) {
    const response = await this.client.post('/sessions', data);
    return response.data;
  }

  async updateSession(id: string, updates: any) {
    const response = await this.client.put(`/sessions/${id}`, updates);
    return response.data;
  }

  async cancelSession(id: string) {
    const response = await this.client.delete(`/sessions/${id}`);
    return response.data;
  }

  async getManagerSessions(status?: string) {
    const response = await this.client.get('/sessions/manager/sessions', {
      params: { status },
    });
    return response.data;
  }

  async getSessionBookings(sessionId: string) {
    const response = await this.client.get(`/sessions/${sessionId}/bookings`);
    return response.data;
  }

  async getManagerStats() {
    const response = await this.client.get('/sessions/manager/stats');
    return response.data;
  }

  async getCommunityMembers() {
    const response = await this.client.get('/sessions/manager/members');
    return response.data;
  }

  // Booking endpoints
  async getUserBookings() {
    const response = await this.client.get('/bookings');
    return response.data;
  }

  async createPaymentIntent(sessionId: string) {
    const response = await this.client.post('/bookings/create-payment-intent', {
      session_id: sessionId,
    });
    return response.data;
  }

  async confirmBooking(sessionId: string, paymentIntentId: string) {
    const response = await this.client.post('/bookings/confirm-booking', {
      session_id: sessionId,
      payment_intent_id: paymentIntentId,
    });
    return response.data;
  }

  async createBooking(sessionId: string, paymentMethodId: string) {
    const response = await this.client.post('/bookings', {
      session_id: sessionId,
      payment_method_id: paymentMethodId,
    });
    return response.data;
  }

  async cancelBooking(id: string, force: boolean = false) {
    const response = await this.client.delete(`/bookings/${id}`, {
      data: { force },
    });
    return response.data;
  }

  async takePendingSpot(bookingId: string, paymentMethodId: string) {
    const response = await this.client.post(`/bookings/${bookingId}/take-spot`, {
      payment_method_id: paymentMethodId,
    });
    return response.data;
  }

  // Role endpoints
  async getMyRoles() {
    const response = await this.client.get('/roles/my-roles');
    return response.data;
  }

  async getAllRoles() {
    const response = await this.client.get('/roles/all');
    return response.data;
  }

  async assignRole(userEmail: string, roleName: string, communityId?: string) {
    const response = await this.client.post('/roles/assign', {
      user_email: userEmail,
      role_name: roleName,
      community_id: communityId,
    });
    return response.data;
  }

  async removeRole(userId: string, roleName: string, communityId?: string) {
    const response = await this.client.delete('/roles/remove', {
      data: {
        user_id: userId,
        role_name: roleName,
        community_id: communityId,
      },
    });
    return response.data;
  }

  async getManagedCommunities() {
    const response = await this.client.get('/roles/managed-communities');
    return response.data;
  }

  async sendCommunityNotification(communityId: string, notification: { title: string; message: string; sub_community_ids?: string[] }) {
    const response = await this.client.post(`/communities/${communityId}/notifications`, notification);
    return response.data;
  }

  async getCommunityManagers(communityId: string) {
    const response = await this.client.get(`/roles/community/${communityId}/managers`);
    return response.data;
  }

  async searchUsersForManager(communityId: string, searchTerm: string) {
    const response = await this.client.get(`/roles/community/${communityId}/search-users`, {
      params: { search: searchTerm },
    });
    return response.data;
  }

  async assignCommunityManager(communityId: string, userId: string) {
    const response = await this.client.post(`/roles/community/${communityId}/managers`, {
      user_id: userId,
    });
    return response.data;
  }

  async revokeCommunityManager(communityId: string, userId: string) {
    const response = await this.client.delete(`/roles/community/${communityId}/managers/${userId}`);
    return response.data;
  }

  // Friendship endpoints
  async sendFriendRequest(addresseeId: string) {
    const response = await this.client.post('/friendships/request', { addresseeId });
    return response.data;
  }

  async acceptFriendRequest(friendshipId: string) {
    const response = await this.client.post(`/friendships/accept/${friendshipId}`);
    return response.data;
  }

  async rejectFriendRequest(friendshipId: string) {
    const response = await this.client.post(`/friendships/reject/${friendshipId}`);
    return response.data;
  }

  async removeFriend(friendshipId: string) {
    const response = await this.client.delete(`/friendships/${friendshipId}`);
    return response.data;
  }

  async getFriends() {
    const response = await this.client.get('/friendships/friends');
    return response.data;
  }

  async getPendingFriendRequests() {
    const response = await this.client.get('/friendships/requests/pending');
    return response.data;
  }

  async getSentFriendRequests() {
    const response = await this.client.get('/friendships/requests/sent');
    return response.data;
  }

  async getSuggestedFriends() {
    const response = await this.client.get('/friendships/suggestions');
    return response.data;
  }

  async getFriendshipStatus(userId: string) {
    const response = await this.client.get(`/friendships/status/${userId}`);
    return response.data;
  }

  // Announcements endpoints
  async getMyAnnouncements() {
    const response = await this.client.get('/announcements/my-announcements');
    return response.data;
  }

  async getCommunityAnnouncements(communityId: string) {
    const response = await this.client.get(`/announcements/community/${communityId}`);
    return response.data;
  }

  async createAnnouncement(community_id: string, title: string, message: string) {
    const response = await this.client.post('/announcements', {
      community_id,
      title,
      message,
    });
    return response.data;
  }

  async updateAnnouncement(announcementId: string, title?: string, message?: string) {
    const response = await this.client.put(`/announcements/${announcementId}`, {
      title,
      message,
    });
    return response.data;
  }

  async deleteAnnouncement(announcementId: string) {
    const response = await this.client.delete(`/announcements/${announcementId}`);
    return response.data;
  }

  // Chat endpoints - Community Group Chats
  async getCommunityChats() {
    const response = await this.client.get('/chat/chats');
    return response.data;
  }

  async getCommunityMessages(communityId: string, limit?: number, offset?: number) {
    const params: any = {};
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    const response = await this.client.get(`/chat/communities/${communityId}/messages`, { params });
    return response.data;
  }

  async sendCommunityMessage(communityId: string, content: string) {
    const response = await this.client.post(`/chat/communities/${communityId}/messages`, {
      content,
    });
    return response.data;
  }

  // Session Template endpoints
  async getSessionTemplates(communityId: string, includeInactive: boolean = false) {
    const response = await this.client.get(`/session-templates/community/${communityId}`, {
      params: { include_inactive: includeInactive },
    });
    return response.data;
  }

  async getSessionTemplate(templateId: string) {
    const response = await this.client.get(`/session-templates/${templateId}`);
    return response.data;
  }

  async createSessionTemplate(data: any) {
    const response = await this.client.post('/session-templates', data);
    return response.data;
  }

  async updateSessionTemplate(templateId: string, updates: any) {
    const response = await this.client.put(`/session-templates/${templateId}`, updates);
    return response.data;
  }

  async deleteSessionTemplate(templateId: string) {
    const response = await this.client.delete(`/session-templates/${templateId}`);
    return response.data;
  }

  async bulkCreateSessions(templateIds: string[], weeksAhead: number, startDate?: string) {
    const response = await this.client.post('/session-templates/bulk-create-sessions', {
      template_ids: templateIds,
      weeks_ahead: weeksAhead,
      start_date: startDate,
    });
    return response.data;
  }

  async sendSessionNotification(sessionId: string, notification: { title: string; message: string }) {
    const response = await this.client.post(`/sessions/${sessionId}/notifications`, notification);
    return response.data;
  }
}

export default new ApiService();

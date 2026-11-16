// Service giao tiếp REST API chat: lấy hội thoại, tin nhắn, sửa/thu hồi tin nhắn, xóa hội thoại
import { apiClient } from './apiClient';
import type {
  Conversation,
  ChatUser,
  DirectConversationResponse,
  MessagesPaginationResponse,
  Message,
} from '../types/chat.types';

// Helper trích xuất data từ các dạng ApiResponse khác nhau của Spring Boot:
// Ví dụ: { success: true, message: "...", data: [...] } hoặc trả thẳng [...]
function extractData<T>(response: unknown): T {
  if (response && typeof response === 'object') {
    const obj = response as Record<string, unknown>;
    if ('data' in obj) {
      return obj.data as T;
    }
  }
  return response as T;
}

export const chatService = {
  /**
   * Lấy danh sách cuộc hội thoại gần đây của người dùng
   * GET /api/conversations
   */
  async getConversations(): Promise<Conversation[]> {
    const res = await apiClient.get<unknown>('/api/conversations');
    const data = extractData<Conversation[]>(res);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Tìm kiếm người dùng theo từ khóa
   * GET /api/users/search?q={keyword}
   */
  async searchUsers(keyword: string): Promise<ChatUser[]> {
    if (!keyword.trim()) return [];
    const encoded = encodeURIComponent(keyword.trim());
    const res = await apiClient.get<unknown>(`/api/users/search?q=${encoded}`);
    const data = extractData<ChatUser[]>(res);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Tạo mới hoặc lấy ID cuộc hội thoại 1-1 với user
   * POST /api/conversations/direct/{userId}
   */
  async getOrCreateDirectConversation(userId: number): Promise<DirectConversationResponse> {
    const res = await apiClient.post<unknown>(`/api/conversations/direct/${userId}`);
    const data = extractData<DirectConversationResponse | { conversationId: number }>(res);
    
    // Hỗ trợ cả conversation_id và conversationId
    if (data && typeof data === 'object') {
      const convId =
        ('conversation_id' in data ? data.conversation_id : undefined) ??
        ('conversationId' in data ? data.conversationId : undefined);
      if (typeof convId === 'number') {
        return { conversation_id: convId };
      }
    }
    return data as DirectConversationResponse;
  },

   //Lấy lịch sử chat (Cursor-based pagination)
  async getMessages(
    conversationId: number,
    limit: number = 20,
    beforeId?: number
  ): Promise<MessagesPaginationResponse> {
    let url = `/api/messages/${conversationId}?limit=${limit}`;
    if (beforeId !== undefined && beforeId !== null) {
      url += `&beforeId=${beforeId}`;
    }

    const res = await apiClient.get<unknown>(url);
    const parsed = extractData<unknown>(res);

    if (parsed && typeof parsed === 'object') {
      const p = parsed as Record<string, unknown>;
      // Chuẩn { data: Message[], hasMore: boolean }
      if (Array.isArray(p.data)) {
        return {
          data: p.data,
          hasMore: Boolean(p.hasMore),
        };
      }
      // Nếu backend trả thẳng mảng Message[]
      if (Array.isArray(parsed)) {
        return {
          data: parsed,
          hasMore: parsed.length >= limit,
        };
      }
    }

    return { data: [], hasMore: false };
  },


  //Lấy danh sách ID các user đang online ban đầu từ Redis
  async getOnlineUsers(): Promise<number[]> {
    try {
      const res = await apiClient.get<unknown>('/api/presence/online');
      const data = extractData<number[]>(res);
      if (Array.isArray(data)) {
        return data.map(Number);
      }
      return [];
    } catch (err) {
      console.error('Lỗi khi lấy danh sách user online:', err);
      return [];
    }
  },

  /**
   * Chỉnh sửa nội dung tin nhắn
   * PUT /api/messages/{messageId}
   */
  async editMessage(messageId: number, newContent: string, receiverId?: number): Promise<Message> {
    const res = await apiClient.put<unknown>(`/api/messages/${messageId}`, {
      newContent,
      receiverId,
    });
    return extractData<Message>(res);
  },

  /**
   * Thu hồi tin nhắn
   * DELETE /api/messages/{messageId}?receiverId={receiverId}
   */
  async deleteMessage(messageId: number, receiverId?: number): Promise<void> {
    let url = `/api/messages/${messageId}`;
    if (receiverId) {
      url += `?receiverId=${receiverId}`;
    }
    await apiClient.delete(url);
  },

  /**
   * Xóa toàn bộ cuộc hội thoại
   * DELETE /api/conversations/{conversationId}
   */
  async deleteConversation(conversationId: number): Promise<void> {
    await apiClient.delete(`/api/conversations/${conversationId}`);
  },

  /**
   * Tạo nhóm chat mới
   * POST /api/conversations/group
   */
  async createGroup(payload: { name: string; avatarUrl?: string; memberIds: number[] }): Promise<Conversation> {
    const res = await apiClient.post<unknown>('/api/conversations/group', payload);
    return extractData<Conversation>(res);
  },

  /**
   * Lấy chi tiết cuộc hội thoại (thông tin nhóm, danh sách thành viên)
   * GET /api/conversations/{conversationId}
   */
  async getConversationDetails(conversationId: number): Promise<Conversation> {
    const res = await apiClient.get<unknown>(`/api/conversations/${conversationId}`);
    return extractData<Conversation>(res);
  },

  /**
   * Cập nhật thông tin nhóm (chỉ ADMIN)
   * PUT /api/conversations/group/{conversationId}
   */
  async updateGroupInfo(conversationId: number, payload: { name?: string; avatarUrl?: string }): Promise<Conversation> {
    const res = await apiClient.put<unknown>(`/api/conversations/group/${conversationId}`, payload);
    return extractData<Conversation>(res);
  },

  /**
   * Thêm thành viên vào nhóm (chỉ ADMIN)
   * POST /api/conversations/group/{conversationId}/members
   */
  async addGroupMembers(conversationId: number, memberIds: number[]): Promise<Conversation> {
    const res = await apiClient.post<unknown>(`/api/conversations/group/${conversationId}/members`, { memberIds });
    return extractData<Conversation>(res);
  },

  /**
   * Xóa thành viên khỏi nhóm (chỉ ADMIN)
   * DELETE /api/conversations/group/{conversationId}/members/{targetUserId}
   */
  async removeGroupMember(conversationId: number, targetUserId: number): Promise<void> {
    await apiClient.delete(`/api/conversations/group/${conversationId}/members/${targetUserId}`);
  },

  /**
   * Rời khỏi nhóm
   * POST /api/conversations/group/{conversationId}/leave
   */
  async leaveGroup(conversationId: number): Promise<void> {
    await apiClient.post(`/api/conversations/group/${conversationId}/leave`);
  },
};

export default chatService;

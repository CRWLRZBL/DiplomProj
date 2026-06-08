import { apiClient } from './apiClient';
import type {
  ChatMessage,
  StaffDirectInboxItem,
  StaffPeer,
  SupportInboxItem,
  SupportThread,
} from '../models/chat';

export const chatService = {
  async getSupportThread(viewerUserId: number, clientUserId: number): Promise<SupportThread> {
    const { data } = await apiClient.get<SupportThread>('/messages/support/thread', {
      params: { viewerUserId, clientUserId },
    });
    return data;
  },

  async postSupportMessage(
    senderUserId: number,
    clientUserId: number,
    body: string
  ): Promise<ChatMessage> {
    const { data } = await apiClient.post<ChatMessage>('/messages/support/messages', {
      senderUserId,
      clientUserId,
      body,
    });
    return data;
  },

  async getSupportInbox(staffUserId: number): Promise<SupportInboxItem[]> {
    const { data } = await apiClient.get<SupportInboxItem[]>('/messages/support/inbox', {
      params: { staffUserId },
    });
    return data;
  },

  async getStaffPeers(userId: number): Promise<StaffPeer[]> {
    const { data } = await apiClient.get<StaffPeer[]>('/messages/staff/peers', {
      params: { userId },
    });
    return data;
  },

  async getStaffThread(userId: number, peerUserId: number): Promise<SupportThread> {
    const { data } = await apiClient.get<SupportThread>('/messages/staff/thread', {
      params: { userId, peerUserId },
    });
    return data;
  },

  async postStaffMessage(
    senderUserId: number,
    conversationId: number,
    body: string
  ): Promise<ChatMessage> {
    const { data } = await apiClient.post<ChatMessage>('/messages/staff/messages', {
      senderUserId,
      conversationId,
      body,
    });
    return data;
  },

  async getStaffDirectInbox(staffUserId: number): Promise<StaffDirectInboxItem[]> {
    const { data } = await apiClient.get<StaffDirectInboxItem[]>('/messages/staff/inbox', {
      params: { staffUserId },
    });
    return data;
  },
};

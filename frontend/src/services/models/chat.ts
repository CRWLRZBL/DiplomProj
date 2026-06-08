export interface ChatMessage {
  messageId: number;
  senderUserId: number;
  senderName: string;
  body: string;
  createdAt: string;
}

export interface SupportThread {
  conversationId: number;
  clientUserId: number;
  messages: ChatMessage[];
}

export interface SupportInboxItem {
  conversationId: number;
  clientUserId: number;
  clientDisplayName: string;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
}

export interface StaffDirectInboxItem {
  conversationId: number;
  peerUserId: number;
  peerDisplayName: string;
  peerRoleName: string;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
}

export interface StaffPeer {
  userId: number;
  displayName: string;
  roleName: string;
}

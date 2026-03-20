export type ConversationSummary = {
  id: string;
  roomId: string;
  seekerUserId: string;
  createdAt: string;
  roomTitle: string;
  unreadCount: number;
  lastMessageAt: string;
  members: { userId: string; firstName: string }[];
  roomPhotoUrl: string | null;
};

export type ConversationDetail = {
  id: string;
  roomId: string;
  seekerUserId: string;
  createdAt: string;
  roomTitle: string;
  members: { userId: string; firstName: string }[];
};

export type MessageRow = {
  id: string;
  conversationId: string;
  senderId: string;
  senderDeviceId: string | null;
  messageType: string;
  createdAt: string;
  payload: string | null;
  senderFirstName: string | null;
};

export type MessagesPage = {
  messages: MessageRow[];
  nextCursor: string | null;
};

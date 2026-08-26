export interface ChatUser {
  id: string;
  username: string;
  levelBadge?: string;
  walletAddress?: string;
}

export interface ChatMessage {
  id: string;
  sender: ChatUser;
  text: string;
  timestamp: number;
  isSystemAnnouncement?: boolean;
}

export interface GlobalChatWidgetProps {
  messages: ChatMessage[];
  currentUser: ChatUser;
  onSendMessage: (text: string) => Promise<void>;
  onTipUser?: (recipientAddress: string) => void;
  isOpenDefault?: boolean;
  maxCharCount?: number;
}

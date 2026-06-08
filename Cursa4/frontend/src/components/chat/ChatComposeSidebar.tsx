import React from 'react';
import { Button } from 'react-bootstrap';
import ChatAttachmentPicker from './ChatAttachmentPicker';

export type QuickAction = {
  label: string;
  text: string;
};

type Props = {
  title?: string;
  quickActions: QuickAction[];
  onQuickAction: (text: string) => void;
  onAttach: (line: string) => void;
  onRemoveAttachment?: () => void;
  attachmentClearToken?: number;
  disabled?: boolean;
};

const ChatComposeSidebar: React.FC<Props> = ({
  title = 'Действия',
  quickActions,
  onQuickAction,
  onAttach,
  onRemoveAttachment,
  attachmentClearToken,
  disabled,
}) => {
  return (
    <aside className="chat-dialog-sidebar">
      {quickActions.length > 0 && (
        <div className="chat-sidebar-section">
          <h6 className="chat-sidebar-title">{title}</h6>
          <div className="chat-sidebar-actions">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                type="button"
                variant="outline-secondary"
                size="sm"
                className="chat-sidebar-action-btn"
                disabled={disabled}
                onClick={() => onQuickAction(action.text)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="chat-sidebar-section">
        <h6 className="chat-sidebar-title">Вложение</h6>
        <ChatAttachmentPicker
          layout="sidebar"
          onAttach={onAttach}
          onRemove={onRemoveAttachment}
          clearToken={attachmentClearToken}
          disabled={disabled}
        />
      </div>
    </aside>
  );
};

export default ChatComposeSidebar;

import React from 'react';
import { Button, Card, Form } from 'react-bootstrap';
import type { SupportThread } from '../../services/models/chat';
import { utils } from '../../utils/constants';
import LoadingSpinner from '../common/LoadingSpinner';
import ChatComposeSidebar, { type QuickAction } from './ChatComposeSidebar';
import ChatMessageBody from './ChatMessageBody';
import AutoGrowTextarea from './AutoGrowTextarea';

type Props = {
  title: string;
  thread: SupportThread | null;
  loading: boolean;
  userId: number;
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: (e: React.FormEvent) => void;
  sending: boolean;
  onRefresh?: () => void;
  emptyHint?: string;
  quickActions: QuickAction[];
  onQuickAction: (text: string) => void;
  onAttach: (line: string) => void;
  onRemoveAttachment?: () => void;
  attachmentClearToken: number;
  sidebarTitle?: string;
};

const ChatDialogPanel: React.FC<Props> = ({
  title,
  thread,
  loading,
  userId,
  draft,
  onDraftChange,
  onSend,
  sending,
  onRefresh,
  emptyHint = 'Пока нет сообщений. Напишите вопрос — менеджер ответит в этом окне.',
  quickActions,
  onQuickAction,
  onAttach,
  onRemoveAttachment,
  attachmentClearToken,
  sidebarTitle,
}) => {
  return (
    <Card className="shadow-sm chat-dialog-card">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <span>{title}</span>
        {onRefresh && (
          <Button variant="outline-secondary" size="sm" onClick={onRefresh}>
            Обновить
          </Button>
        )}
      </Card.Header>
      <Card.Body className="p-0">
        {loading && !thread ? (
          <div className="p-4">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="chat-dialog-layout">
            <div className="chat-dialog-main">
              <div className="chat-thread">
                {thread?.messages.length === 0 && (
                  <p className="text-muted small mb-0">{emptyHint}</p>
                )}
                {thread?.messages.map((m) => {
                  const mine = m.senderUserId === userId;
                  return (
                    <div
                      key={m.messageId}
                      className={`chat-bubble ${mine ? 'mine' : 'theirs'}`}
                    >
                      <div className="chat-meta">
                        {mine ? 'Вы' : m.senderName} · {utils.formatDate(m.createdAt)}
                      </div>
                      <ChatMessageBody body={m.body} />
                    </div>
                  );
                })}
              </div>

              <Form onSubmit={onSend} className="chat-compose-actions chat-compose-main">
                <div className="chat-compose-row">
                  <AutoGrowTextarea
                    value={draft}
                    onChange={onDraftChange}
                    placeholder="Текст сообщения…"
                    maxLength={2000}
                    disabled={sending}
                    className="chat-compose-textarea"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    className="chat-compose-send px-4 flex-shrink-0"
                    disabled={sending || !draft.trim()}
                  >
                    {sending ? '…' : 'Отправить'}
                  </Button>
                </div>
              </Form>
            </div>

            <ChatComposeSidebar
              title={sidebarTitle}
              quickActions={quickActions}
              onQuickAction={onQuickAction}
              onAttach={onAttach}
              onRemoveAttachment={onRemoveAttachment}
              attachmentClearToken={attachmentClearToken}
              disabled={sending}
            />
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ChatDialogPanel;

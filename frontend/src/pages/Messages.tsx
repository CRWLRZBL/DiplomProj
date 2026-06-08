import React, { useCallback, useEffect, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Nav,
  ListGroup,
  Badge,
} from 'react-bootstrap';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES, USER_ROLE_LABELS, utils } from '../utils/constants';
import { getApiErrorMessage } from '../utils/apiError';
import { chatService } from '../services/api/chatService';
import type {
  SupportThread,
  SupportInboxItem,
  StaffDirectInboxItem,
} from '../services/models/chat';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ChatDialogPanel from '../components/chat/ChatDialogPanel';
import type { QuickAction } from '../components/chat/ChatComposeSidebar';
import './Messages.css';

const CLIENT_QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'Запросить расчёт',
    text: 'Хочу узнать финальную цену с учётом скидок и доп. оборудования.',
  },
  {
    label: 'Видео-осмотр',
    text: 'Хочу видео-осмотр конкретного авто (ЛКП/салон/двигатель).',
  },
  {
    label: 'Тест-драйв',
    text: 'Хочу записаться на тест-драйв. Маршрут: город/шоссе/бездорожье.',
  },
];

const STAFF_QUICK_ACTIONS: QuickAction[] = [
  {
    label: '3 авто в наличии',
    text: 'Осталось 3 авто в наличии в этом цвете. Хотите забронировать на 24 часа?',
  },
  {
    label: 'Поставка завтра',
    text: 'Завтра ожидаем поставку этого цвета. Могу поставить в лист ожидания.',
  },
  {
    label: 'Видео-осмотр',
    text: 'Могу снять видео-осмотр: ЛКП/салон/запуск/свет. Что именно показать?',
  },
  {
    label: 'Расчёт цены',
    text: 'Для расчёта финальной цены напишите: комплектацию, цвет и какие опции интересуют.',
  },
  {
    label: 'Тест-драйв',
    text: 'Можем записать на тест-драйв на завтра: шоссе/город/бездорожье — какой маршрут удобнее?',
  },
];

function resolveUserId(user: { userId?: number; id?: number; Id?: number }): number {
  if (typeof user.userId === 'number' && !Number.isNaN(user.userId)) return user.userId;
  if (typeof user.id === 'number') return user.id;
  if (typeof user.Id === 'number') return user.Id;
  return 0;
}

const Messages: React.FC = () => {
  const { user } = useAuth();
  const userId = user ? resolveUserId(user) : 0;
  const isClient = user?.roleName === USER_ROLES.CLIENT;
  const isStaff =
    user?.roleName === USER_ROLES.MANAGER || user?.roleName === USER_ROLES.ADMIN;

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [attachmentClearToken, setAttachmentClearToken] = useState(0);

  const [thread, setThread] = useState<SupportThread | null>(null);

  const [staffSection, setStaffSection] = useState<'clients' | 'colleagues'>('clients');
  const [supportInbox, setSupportInbox] = useState<SupportInboxItem[]>([]);
  const [staffInbox, setStaffInbox] = useState<StaffDirectInboxItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedPeerId, setSelectedPeerId] = useState<number | null>(null);

  const loadClientThread = useCallback(async () => {
    if (!user || !isClient || userId <= 0) return;
    setLoading(true);
    setError('');
    try {
      const t = await chatService.getSupportThread(userId, userId);
      setThread(t);
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, 'Не удалось загрузить переписку.'));
    } finally {
      setLoading(false);
    }
  }, [user, isClient, userId]);

  const loadStaffSupportInbox = useCallback(async () => {
    if (!user || !isStaff || userId <= 0) return;
    setLoading(true);
    setError('');
    try {
      const items = await chatService.getSupportInbox(userId);
      setSupportInbox(items);
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, 'Не удалось загрузить обращения клиентов.'));
    } finally {
      setLoading(false);
    }
  }, [user, isStaff, userId]);

  const loadStaffDirectInbox = useCallback(async () => {
    if (!user || !isStaff || userId <= 0) return;
    try {
      const items = await chatService.getStaffDirectInbox(userId);
      setStaffInbox(items);
    } catch (e) {
      console.warn('staff inbox', e);
    }
  }, [user, isStaff, userId]);

  const openClientThread = async (clientUserId: number) => {
    if (!user || !isStaff || userId <= 0) return;
    setSelectedClientId(clientUserId);
    setSelectedPeerId(null);
    setLoading(true);
    setError('');
    try {
      const t = await chatService.getSupportThread(userId, clientUserId);
      setThread(t);
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, 'Не удалось открыть диалог.'));
    } finally {
      setLoading(false);
    }
  };

  const openPeerThread = async (peerUserId: number) => {
    if (!user || !isStaff || userId <= 0) return;
    setSelectedPeerId(peerUserId);
    setSelectedClientId(null);
    setLoading(true);
    setError('');
    try {
      const t = await chatService.getStaffThread(userId, peerUserId);
      setThread(t);
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, 'Не удалось открыть переписку с коллегой.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || userId <= 0) return;
    if (isClient) {
      loadClientThread();
    } else if (isStaff) {
      loadStaffSupportInbox();
      loadStaffDirectInbox();
    }
  }, [user, userId, isClient, isStaff, loadClientThread, loadStaffSupportInbox, loadStaffDirectInbox]);

  useEffect(() => {
    if (!isStaff || staffSection !== 'colleagues') return;
    loadStaffDirectInbox();
  }, [isStaff, staffSection, loadStaffDirectInbox]);

  const refreshAfterSend = async () => {
    if (isClient) await loadClientThread();
    else if (isStaff) {
      if (staffSection === 'clients') {
        await loadStaffSupportInbox();
        if (selectedClientId != null) await openClientThread(selectedClientId);
      } else {
        await loadStaffDirectInbox();
        if (selectedPeerId != null) await openPeerThread(selectedPeerId);
      }
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !user || userId <= 0) return;

    setSending(true);
    setError('');
    try {
      if (isClient) {
        await chatService.postSupportMessage(userId, userId, text);
      } else if (isStaff) {
        if (staffSection === 'clients') {
          if (selectedClientId == null) {
            setError('Выберите клиента в списке слева.');
            setSending(false);
            return;
          }
          await chatService.postSupportMessage(userId, selectedClientId, text);
        } else {
          if (!thread) {
            setError('Выберите коллегу в списке слева.');
            setSending(false);
            return;
          }
          await chatService.postStaffMessage(userId, thread.conversationId, text);
        }
      }
      setDraft('');
      setAttachmentClearToken((t) => t + 1);
      await refreshAfterSend();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Не удалось отправить сообщение.'));
    } finally {
      setSending(false);
    }
  };

  const insertTemplate = (txt: string) => {
    setDraft((prev) => {
      const next = prev.trim().length ? `${prev.trim()}\n\n${txt}` : txt;
      return next;
    });
  };

  const appendAttachment = (line: string) => {
    insertTemplate(line);
  };

  const removeAttachmentFromDraft = () => {
    setDraft((prev) =>
      prev
        .split('\n')
        .filter((line) => !/^📎\s*.+:\s*.+$/.test(line.trim()))
        .join('\n')
        .trim()
    );
  };

  if (!user) {
    return <Navigate to="/profile?redirect=/messages" replace />;
  }

  if (userId <= 0) {
    return (
      <Container className="messages-page py-4">
        <Alert variant="warning">
          В данных профиля нет идентификатора пользователя. Выйдите и войдите снова.
        </Alert>
      </Container>
    );
  }

  return (
    <div className="messages-page py-4">
      <Container>
        <Row className="mb-3">
          <Col>
            <h1 className="h2 mb-2">Сообщения</h1>
            <p className="text-muted mb-2">
              {isClient
                ? 'Чат с менеджером салона: уточнения по автомобилям, заказам и условиям.'
                : 'Обращения клиентов и переписка между сотрудниками (администратор — менеджер).'}
            </p>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {isClient && (
          <Row>
            <Col xs={12}>
              <ChatDialogPanel
                title="Диалог с салоном"
                thread={thread}
                loading={loading}
                userId={userId}
                draft={draft}
                onDraftChange={setDraft}
                onSend={handleSend}
                sending={sending}
                onRefresh={() => loadClientThread()}
                quickActions={CLIENT_QUICK_ACTIONS}
                onQuickAction={insertTemplate}
                onAttach={appendAttachment}
                onRemoveAttachment={removeAttachmentFromDraft}
                attachmentClearToken={attachmentClearToken}
                sidebarTitle="Быстрые запросы"
              />
            </Col>
          </Row>
        )}

        {isStaff && (
          <Row>
            <Col md={4} className="mb-3">
              <Card className="shadow-sm">
                <Card.Header>
                  <Nav variant="tabs" className="border-0 card-header-tabs">
                    <Nav.Item>
                      <Nav.Link
                        role="button"
                        active={staffSection === 'clients'}
                        onClick={(ev) => {
                          ev.preventDefault();
                          setStaffSection('clients');
                          setThread(null);
                          setSelectedPeerId(null);
                        }}
                      >
                        Клиенты
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link
                        role="button"
                        active={staffSection === 'colleagues'}
                        onClick={(ev) => {
                          ev.preventDefault();
                          setStaffSection('colleagues');
                          setThread(null);
                          setSelectedClientId(null);
                        }}
                      >
                        Сотрудники
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>
                </Card.Header>
                <Card.Body className="p-0">
                  {staffSection === 'clients' && (
                    <ListGroup variant="flush" className="inbox-list">
                      {loading && supportInbox.length === 0 ? (
                        <ListGroup.Item className="text-center py-4">
                          <LoadingSpinner />
                        </ListGroup.Item>
                      ) : supportInbox.length === 0 ? (
                        <ListGroup.Item className="text-muted small">
                          Нет активных обращений. Клиенты появятся здесь после первого сообщения.
                        </ListGroup.Item>
                      ) : (
                        supportInbox.map((row) => (
                          <ListGroup.Item
                            key={row.conversationId}
                            action
                            active={selectedClientId === row.clientUserId}
                            onClick={() => openClientThread(row.clientUserId)}
                          >
                            <div className="fw-semibold">{row.clientDisplayName}</div>
                            <div className="small text-muted text-truncate">
                              {row.lastMessagePreview || '—'}
                            </div>
                            {row.lastMessageAt && (
                              <Badge bg="secondary" className="mt-1">
                                {utils.formatDate(row.lastMessageAt)}
                              </Badge>
                            )}
                          </ListGroup.Item>
                        ))
                      )}
                    </ListGroup>
                  )}
                  {staffSection === 'colleagues' && (
                    <ListGroup variant="flush" className="inbox-list">
                      {staffInbox.length === 0 ? (
                        <ListGroup.Item className="text-muted small">
                          Нет переписок. Начните диалог — выберите коллегу ниже (кнопка «Новый диалог»).
                        </ListGroup.Item>
                      ) : (
                        staffInbox.map((row) => (
                          <ListGroup.Item
                            key={row.conversationId}
                            action
                            active={selectedPeerId === row.peerUserId}
                            onClick={() => openPeerThread(row.peerUserId)}
                          >
                            <div className="fw-semibold">{row.peerDisplayName}</div>
                            <div className="small">
                              <Badge bg="light" text="dark">
                                {(USER_ROLE_LABELS as Record<string, string>)[row.peerRoleName] ||
                                  row.peerRoleName}
                              </Badge>
                            </div>
                            <div className="small text-muted text-truncate mt-1">
                              {row.lastMessagePreview || '—'}
                            </div>
                          </ListGroup.Item>
                        ))
                      )}
                    </ListGroup>
                  )}
                  {staffSection === 'colleagues' && (
                    <div className="p-2 border-top">
                      <StaffPeerPicker
                        userId={userId}
                        onPick={(peerId) => openPeerThread(peerId)}
                      />
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col md={8}>
              {!thread ? (
                <Card className="shadow-sm">
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <span>
                      {staffSection === 'clients'
                        ? 'Выберите клиента'
                        : 'Выберите коллегу или начните новый диалог'}
                    </span>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => {
                        if (staffSection === 'clients') loadStaffSupportInbox();
                        else loadStaffDirectInbox();
                      }}
                    >
                      Обновить список
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    <p className="text-muted small mb-0">
                      Откройте диалог в списке слева, чтобы увидеть сообщения.
                    </p>
                  </Card.Body>
                </Card>
              ) : (
                <ChatDialogPanel
                  title={
                    staffSection === 'clients' ? 'Переписка с клиентом' : 'Переписка с коллегой'
                  }
                  thread={thread}
                  loading={loading}
                  userId={userId}
                  draft={draft}
                  onDraftChange={setDraft}
                  onSend={handleSend}
                  sending={sending}
                  emptyHint="Нет сообщений в этом диалоге."
                  quickActions={
                    staffSection === 'clients' ? STAFF_QUICK_ACTIONS : []
                  }
                  onQuickAction={insertTemplate}
                  onAttach={appendAttachment}
                  onRemoveAttachment={removeAttachmentFromDraft}
                  attachmentClearToken={attachmentClearToken}
                  sidebarTitle={
                    staffSection === 'clients' ? 'Быстрые ответы' : 'Вложения'
                  }
                />
              )}
            </Col>
          </Row>
        )}
      </Container>
    </div>
  );
};

const StaffPeerPicker: React.FC<{ userId: number; onPick: (peerId: number) => void }> = ({
  userId,
  onPick,
}) => {
  const [peers, setPeers] = useState<{ userId: number; displayName: string; roleName: string }[]>(
    []
  );
  const [sel, setSel] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    setErr('');
    if (userId <= 0) {
      setErr('Выйдите из аккаунта и войдите снова — в сессии нет корректного ID пользователя.');
      setPeers([]);
      return;
    }
    (async () => {
      try {
        const list = await chatService.getStaffPeers(userId);
        if (!cancelled) setPeers(list);
      } catch (e) {
        if (!cancelled) {
          setErr(getApiErrorMessage(e, 'Не удалось загрузить список сотрудников.'));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <div>
      {err && <Alert variant="warning" className="py-2 small mb-2">{err}</Alert>}
      <Form.Group>
        <Form.Label className="small mb-1">Новый диалог с коллегой</Form.Label>
        <div className="d-flex gap-2">
          <Form.Select
            size="sm"
            value={sel}
            onChange={(e) => setSel(e.target.value)}
            aria-label="Выбор коллеги"
          >
            <option value="">Кого выбрать…</option>
            {peers.map((p) => (
              <option key={p.userId} value={String(p.userId)}>
                {p.displayName} ({(USER_ROLE_LABELS as Record<string, string>)[p.roleName] || p.roleName})
              </option>
            ))}
          </Form.Select>
          <Button
            size="sm"
            variant="primary"
            disabled={!sel}
            onClick={() => {
              const id = parseInt(sel, 10);
              if (!Number.isNaN(id)) onPick(id);
            }}
          >
            Открыть
          </Button>
        </div>
      </Form.Group>
    </div>
  );
};

export default Messages;

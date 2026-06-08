import React, { useEffect, useState } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLE_LABELS } from '../../utils/constants';
import Icon from '../common/Icon';

const ProfileEditor: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      phone: user.phone ?? '',
    });
  }, [user]);

  if (!user) return null;

  const initials = `${(user.firstName || '').charAt(0)}${(user.lastName || '').charAt(0) || 'U'}`;
  const roleLabel = USER_ROLE_LABELS[user.roleName] ?? user.roleName;

  const handleCancel = () => {
    setForm({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      phone: user.phone ?? '',
    });
    setEditing(false);
    setError('');
    setSuccess('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
      });
      setSuccess('Данные профиля сохранены');
      setEditing(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Не удалось сохранить изменения';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="text-center mb-3">
        <div className="dp-avatar">{initials}</div>
        <h4 className="mb-1">
          {user.firstName} {user.lastName}
        </h4>
        {roleLabel && <span className="dp-pill">{roleLabel}</span>}
      </div>

      {error && (
        <Alert variant="danger" className="py-2 small" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="py-2 small" onClose={() => setSuccess('')} dismissible>
          {success}
        </Alert>
      )}

      {editing ? (
        <Form className="dp-form" onSubmit={handleSave}>
          <Form.Group className="mb-3">
            <Form.Label>Имя</Form.Label>
            <Form.Control
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              required
              maxLength={100}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Фамилия</Form.Label>
            <Form.Control
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              required
              maxLength={100}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Телефон</Form.Label>
            <Form.Control
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+7 (999) 000-00-00"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control value={user.email} disabled readOnly />
            <Form.Text className="text-muted">Email изменяется через администратора</Form.Text>
          </Form.Group>
          <div className="d-flex gap-2 flex-wrap">
            <Button type="submit" className="btn-dealership-dark" disabled={saving}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </Button>
            <Button type="button" variant="outline-secondary" onClick={handleCancel} disabled={saving}>
              Отмена
            </Button>
          </div>
        </Form>
      ) : (
        <>
          <div className="dp-fieldLabel">Email</div>
          <div className="dp-fieldValue">{user.email}</div>
          <div className="dp-fieldLabel">Телефон</div>
          <div className="dp-fieldValue">{user.phone?.trim() || 'Не указан'}</div>
          <Button
            type="button"
            className="btn-dealership-dark w-100"
            onClick={() => {
              setEditing(true);
              setSuccess('');
              setError('');
            }}
          >
            <Icon name="edit" className="me-2" style={{ fontSize: '1.1rem', verticalAlign: 'middle' }} />
            Редактировать профиль
          </Button>
        </>
      )}
    </>
  );
};

export default ProfileEditor;

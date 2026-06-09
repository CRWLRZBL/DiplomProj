import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLE_LABELS, USER_ROLES } from '../../utils/constants';
import Icon from '../common/Icon';
import {
  normalizePhone,
  validateName,
  validatePhone,
} from '../../utils/validation';
import { getApiErrorMessage } from '../../utils/apiError';

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

  const phoneFormatted = useMemo(() => normalizePhone(form.phone), [form.phone]);
  const phoneError = form.phone.trim() ? validatePhone(phoneFormatted) : null;
  const firstNameError = form.firstName.trim() ? validateName(form.firstName, 'Имя') : null;
  const lastNameError = form.lastName.trim() ? validateName(form.lastName, 'Фамилия') : null;

  if (!user) return null;

  const initials = `${(user.firstName || '').charAt(0)}${(user.lastName || '').charAt(0) || 'U'}`;
  const roleLabel = USER_ROLE_LABELS[user.roleName] ?? user.roleName;
  const isAdmin = user.roleName === USER_ROLES.ADMIN;

  const emailHint = isAdmin
    ? 'Смена email выполняется другим администратором системы. Заявку через сайт подать нельзя — обратитесь к коллеге с правами администратора.'
    : 'Email изменяется через администратора. Для смены почты обратитесь в салон или напишите менеджеру в разделе «Сообщения».';

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
    setError('');
    setSuccess('');

    const fnErr = validateName(form.firstName, 'Имя');
    if (fnErr) {
      setError(fnErr);
      return;
    }
    const lnErr = validateName(form.lastName, 'Фамилия');
    if (lnErr) {
      setError(lnErr);
      return;
    }
    if (form.phone.trim()) {
      const phErr = validatePhone(phoneFormatted);
      if (phErr) {
        setError(phErr);
        return;
      }
    }

    setSaving(true);
    try {
      await updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() ? phoneFormatted : '',
      });
      setSuccess('Данные профиля сохранены');
      setEditing(false);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Не удалось сохранить изменения.'));
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
              isInvalid={!!firstNameError}
            />
            <Form.Control.Feedback type="invalid">{firstNameError}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Фамилия</Form.Label>
            <Form.Control
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              required
              maxLength={100}
              isInvalid={!!lastNameError}
            />
            <Form.Control.Feedback type="invalid">{lastNameError}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Телефон</Form.Label>
            <Form.Control
              type="tel"
              value={phoneFormatted}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+7 (999) 000-00-00"
              isInvalid={!!phoneError}
            />
            <Form.Control.Feedback type="invalid">{phoneError}</Form.Control.Feedback>
            <Form.Text className="text-muted">Формат: +7 (999) 999-99-99</Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control value={user.email} disabled readOnly />
            <Form.Text className="text-muted">{emailHint}</Form.Text>
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
          <Alert variant="light" className="small text-muted py-2 mb-3">
            {emailHint}
            <div className="mt-2">
              <strong>Забыли пароль или нет доступа к почте?</strong> Обратитесь к администратору салона
              или менеджеру через раздел «Сообщения» / по телефону на странице «Контакты».
              Самостоятельное восстановление пароля в системе пока не предусмотрено.
            </div>
          </Alert>
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

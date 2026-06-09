import React, { useEffect, useRef, useState } from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';
import { carService } from '../../services/api/carService';
import { resolvePublicImageUrl } from '../../utils/catalogImage';
import { getApiErrorMessage } from '../../utils/apiError';

const MAX_FILE_BYTES = 10 * 1024 * 1024;

type Props = {
  onAttach: (line: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
  /** Меняется после успешной отправки — сбрасывает превью */
  clearToken?: number;
  layout?: 'inline' | 'sidebar';
};

const ChatAttachmentPicker: React.FC<Props> = ({
  onAttach,
  onRemove,
  disabled,
  clearToken = 0,
  layout = 'inline',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    setPreviewUrl('');
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  }, [clearToken]);

  const clearPreview = () => {
    setPreviewUrl('');
    setError('');
    if (inputRef.current) inputRef.current.value = '';
    onRemove?.();
  };

  const handleFile = async (file: File) => {
    setError('');
    setPreviewUrl('');

    if (file.size > MAX_FILE_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      setError(`Файл слишком большой (${mb} МБ). Максимум — 10 МБ.`);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setUploading(true);
    try {
      const url = await carService.uploadCatalogImage(file);
      const publicUrl = resolvePublicImageUrl(url);
      setPreviewUrl(publicUrl);
      onAttach(`📎 ${file.name}: ${publicUrl}`);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось загрузить файл. Допустимы JPG, PNG, WEBP или GIF до 10 МБ.'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const isSidebar = layout === 'sidebar';

  return (
    <div className={`chat-attachment-picker ${isSidebar ? 'chat-attachment-picker--sidebar' : ''}`}>
      <div className={isSidebar ? 'd-grid' : 'd-flex flex-wrap align-items-center gap-2'}>
        <Button
          as="label"
          variant="outline-secondary"
          size="sm"
          className={isSidebar ? 'w-100 mb-1' : 'mb-0'}
          disabled={disabled || uploading}
        >
          {uploading ? (
            <>
              <Spinner animation="border" size="sm" className="me-1" />
              Загрузка…
            </>
          ) : (
            'Прикрепить файл'
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            hidden
            disabled={disabled || uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </Button>
        <Form.Text className={`text-muted mb-0 ${isSidebar ? 'small' : ''}`}>
          JPG, PNG, WEBP, GIF
        </Form.Text>
      </div>
      {error && <div className="small text-danger mt-1">{error}</div>}
      {previewUrl && (
        <div className="chat-attachment-preview">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
            <span className="small text-success">Файл прикреплён к сообщению</span>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="p-0 text-danger"
              onClick={clearPreview}
              disabled={disabled || uploading}
            >
              Убрать
            </Button>
          </div>
          <img src={previewUrl} alt="Превью вложения" loading="lazy" />
        </div>
      )}
    </div>
  );
};

export default ChatAttachmentPicker;

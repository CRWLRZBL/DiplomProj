import React, { useState, useRef } from 'react';
import { Card, Form, Button, Alert, ListGroup } from 'react-bootstrap';
import { importService, ImportResult } from '../../services/api/importService';
import { getApiErrorMessage } from '../../utils/apiError';

const CarImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = async () => {
    try {
      setError('');
      const blob = await importService.downloadTemplate();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'car_import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Не удалось скачать шаблон.'));
      console.error('Template download error:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Проверяем расширение файла
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        setError('Поддерживаются только файлы Excel (.xlsx, .xls)');
        return;
      }
      
      setFile(selectedFile);
      setError('');
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Выберите файл для импорта');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);

      const importResult = await importService.importCarsFromExcel(file);
      setResult(importResult);
      
      // Очищаем файл после успешного импорта
      if (importResult.successCount > 0) {
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err: unknown) {
      console.error('Import error:', err);
      setError(getApiErrorMessage(err, 'Не удалось импортировать файл.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm border-0">
      <Card.Header className="bg-light">
        <h4 className="mb-0">
          <i className="bi bi-file-earmark-arrow-down me-2"></i>
          Импорт автомобилей из Excel
        </h4>
      </Card.Header>
      <Card.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {result && (
          <Alert variant={result.errorCount === 0 ? 'success' : 'warning'}>
            <Alert.Heading>
              {result.errorCount === 0 ? 'Импорт завершен успешно!' : 'Импорт завершен с ошибками'}
            </Alert.Heading>
            <p>
              <strong>Импортировано:</strong> {result.successCount} автомобилей<br />
              <strong>Ошибок:</strong> {result.errorCount}
            </p>
            {result.errors.length > 0 && (
              <div>
                <strong>Ошибки:</strong>
                <ListGroup className="mt-2">
                  {result.errors.map((err, index) => (
                    <ListGroup.Item key={index} variant="danger">
                      {err}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            )}
          </Alert>
        )}

        <div className="mb-3">
          <Button
            variant="outline-primary"
            onClick={handleDownloadTemplate}
            className="w-100 mb-3"
          >
            <i className="bi bi-file-earmark-excel me-2"></i>
            Скачать шаблон Excel
          </Button>
        </div>

        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Выберите файл Excel для импорта</Form.Label>
            <Form.Control
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
            {file && (
              <Form.Text className="text-muted">
                Выбран файл: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </Form.Text>
            )}
          </Form.Group>

          <div className="mb-3">
            <small className="text-muted">
              <strong>Формат файла Excel:</strong><br />
              <strong>Колонка 1 — Марка</strong> (обязательно): например, «LADA». Должна совпадать со справочником.<br />
              <strong>Колонка 2 — Модель</strong> (обязательно): полное название, например «Granta Седан», «Vesta Седан».<br />
              <strong>Колонка 3 — Цвет</strong> (опционально): «Ледниковый», «Пантера», «Платина» и др. По умолчанию: «Ледниковый».<br />
              <strong>Колонка 4 — VIN</strong> (обязательно): 17 символов, уникальный для каждого авто.<br />
              <strong>Колонка 5 — Статус</strong> (опционально): «В наличии», «Забронирован», «Продан». По умолчанию: «В наличии».<br />
              <strong>Колонка 6 — Пробег</strong> (опционально): километры, целое число ≥ 0. По умолчанию: 0.<br />
              <br />
              <strong>Важно:</strong> первая строка — заголовки, данные со второй. Пустые строки пропускаются. При ошибке в строке она не импортируется, остальные обрабатываются.
            </small>
          </div>

          <Button
            variant="primary"
            onClick={handleImport}
            disabled={loading || !file}
            className="w-100 btn-dealership-dark"
          >
            {loading ? 'Импорт…' : 'Импортировать автомобили'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default CarImport;


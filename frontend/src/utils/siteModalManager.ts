import BootstrapModalManager from 'react-bootstrap/esm/BootstrapModalManager';

let manager: BootstrapModalManager | null = null;

/** Менеджер модалок без правки overflow у body — скролл блокирует useBodyScrollLock. */
export function getSiteModalManager(): BootstrapModalManager {
  if (!manager) {
    manager = new BootstrapModalManager({ handleContainerOverflow: false });
  }
  return manager;
}

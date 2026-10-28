import { describe, it, expect } from 'vitest';
import { QuickAddButton } from './quick-add-button';
import { CartNotificationModal } from './cart-notification-modal';

describe('QuickAddButton & CartNotificationModal', () => {
  it('exporta el componente nombrado QuickAddButton', () => {
    expect(typeof QuickAddButton).toBe('function');
  });

  it('exporta el componente nombrado CartNotificationModal', () => {
    expect(typeof CartNotificationModal).toBe('function');
  });
});

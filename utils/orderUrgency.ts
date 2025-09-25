export type OrderUrgencyLevel = 'normal' | 'warning' | 'critical';

export interface OrderUrgencyStyles {
  level: OrderUrgencyLevel;
  /**
   * Classes applied on the ticket wrapper. They follow the same palette as the timer
   * (brand primary for normal, yellow for warning, red for critical) while keeping
   * enough contrast for borders and default text.
   */
  container: string;
  /**
   * Classes applied on inner content sections (body, footer…). These sections get
   * a near-white background so text remains legible even when the wrapper switches
   * to intense urgency colours.
   */
  content: string;
}

const URGENCY_STYLE_MAP: Record<OrderUrgencyLevel, Omit<OrderUrgencyStyles, 'level'>> = {
  critical: {
    container: 'bg-red-600 border-red-700 text-white',
    content: 'bg-white/95 text-gray-900',
  },
  warning: {
    container: 'bg-yellow-400 border-yellow-500 text-gray-900',
    content: 'bg-white/95 text-gray-900',
  },
  normal: {
    container: 'bg-brand-primary/20 border-brand-primary text-brand-secondary',
    content: 'bg-white text-brand-text',
  },
};

export const getOrderUrgencyLevel = (startTime?: number): OrderUrgencyLevel => {
  if (!startTime) {
    return 'normal';
  }

  const minutes = (Date.now() - startTime) / 60000;

  if (minutes >= 20) {
    return 'critical';
  }

  if (minutes >= 10) {
    return 'warning';
  }

  return 'normal';
};

export const getOrderUrgencyStyles = (startTime?: number): OrderUrgencyStyles => {
  const level = getOrderUrgencyLevel(startTime);
  const styles = URGENCY_STYLE_MAP[level];

  return {
    level,
    container: styles.container,
    content: styles.content,
  };
};

/**
 * @deprecated prefer using {@link getOrderUrgencyStyles} to access both the
 * urgency level and the different sections' classes.
 */
export const getOrderUrgencyClass = (startTime?: number): string =>
  getOrderUrgencyStyles(startTime).container;

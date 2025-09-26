export type OrderUrgencyLevel = 'normal' | 'warning' | 'critical';

export interface OrderUrgencyStyles {
  level: OrderUrgencyLevel;
  /** Classes applied on the ticket wrapper border. */
  border: string;
  /** Accent colour used for badges or sidebands. */
  accent: string;
  /** Background and text colour for urgency badges. */
  badge: string;
  /** Icon/text colour accent for subtle highlights. */
  icon: string;
}

const URGENCY_STYLE_MAP: Record<OrderUrgencyLevel, Omit<OrderUrgencyStyles, 'level'>> = {
  critical: {
    border: 'urgency-border-critical',
    accent: 'urgency-accent-critical',
    badge: 'urgency-badge-critical',
    icon: 'urgency-icon-critical',
  },
  warning: {
    border: 'urgency-border-warning',
    accent: 'urgency-accent-warning',
    badge: 'urgency-badge-warning',
    icon: 'urgency-icon-warning',
  },
  normal: {
    border: 'urgency-border-normal',
    accent: 'urgency-accent-normal',
    badge: 'urgency-badge-normal',
    icon: 'urgency-icon-normal',
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
    border: styles.border,
    accent: styles.accent,
    badge: styles.badge,
    icon: styles.icon,
  };
};

/**
 * @deprecated prefer using {@link getOrderUrgencyStyles} to access both the
 * urgency level and the different sections' classes.
 */
export const getOrderUrgencyClass = (startTime?: number): string =>
  getOrderUrgencyStyles(startTime).border;

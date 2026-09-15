import styles from './Display.module.css';

interface DisplayProps {
  expression: string;
  value: string;
  error: string | null;
}

export function Display({ expression, value, error }: DisplayProps) {
  const text = error ?? value;
  const sizeClass = error ? styles.error : text.length > 16 ? styles.small : text.length > 11 ? styles.medium : '';

  return (
    <div className={styles.display}>
      <div className={styles.expression} data-testid="display-expression">
        {expression}
      </div>
      <output className={`${styles.value} ${sizeClass}`} aria-live="polite" data-testid="display-value">
        {text}
      </output>
    </div>
  );
}

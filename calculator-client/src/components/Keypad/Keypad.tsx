import { isAvailableOnError, type CalculatorAction } from '../../calculator/types';
import { KEYPAD_LAYOUT, type KeyDefinition } from './keypadLayout';
import styles from './Keypad.module.css';

interface KeypadProps {
  onPress: (action: CalculatorAction) => void;
  hasError: boolean;
  keys?: KeyDefinition[];
}

export function Keypad({ onPress, hasError, keys = KEYPAD_LAYOUT }: KeypadProps) {
  return (
    <div className={styles.keypad}>
      {keys.map((key) => (
        <button
          key={key.ariaLabel}
          type="button"
          className={`${styles.key} ${styles[key.variant]} ${key.wide ? styles.wide : ''}`}
          aria-label={key.ariaLabel}
          disabled={hasError && !isAvailableOnError(key.action)}
          onClick={() => onPress(key.action)}
        >
          {key.label}
        </button>
      ))}
    </div>
  );
}

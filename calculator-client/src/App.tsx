import { createHttpCalculatorApi } from './api/calculatorApi';
import { Calculator } from './components/Calculator/Calculator';
import { createLocalHistoryStorage } from './history/historyStorage';
import styles from './App.module.css';

const api = createHttpCalculatorApi();
const historyStorage = createLocalHistoryStorage();

export default function App() {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Calculator</h1>
        <p className={styles.subtitle}>Use the keypad or your keyboard. Press Enter to get the result.</p>
      </header>
      <main className={styles.main}>
        <Calculator api={api} historyStorage={historyStorage} />
      </main>
    </div>
  );
}

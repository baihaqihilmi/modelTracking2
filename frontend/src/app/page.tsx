import DashboardLayout from '@/components/layout/DashboardLayout';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <DashboardLayout>
      <div className={styles.container}>
        <h1 className={styles.title}>Dashboard</h1>
        <div className={styles.grid}>
          <div className={styles.card}>
            <h2>Welcome to Model Tracking System</h2>
            <p>Manage and track your TV models efficiently.</p>
          </div>
          <div className={styles.card}>
            <h3>Quick Stats</h3>
            <p>View your model tracking statistics and analytics.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


import Sidebar from './Sidebar';
import styles from './DashboardLayout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}


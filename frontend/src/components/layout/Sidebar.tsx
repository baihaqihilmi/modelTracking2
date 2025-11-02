'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <h2>Model Tracking</h2>
      </div>
      <nav className={styles.nav}>
        <Link
          href="/"
          className={`${styles.navItem} ${isActive('/') ? styles.active : ''}`}
        >
          <span className={styles.icon}>🏠</span>
          <span>Home</span>
        </Link>
        <Link
          href="/model"
          className={`${styles.navItem} ${isActive('/model') ? styles.active : ''}`}
        >
          <span className={styles.icon}>📊</span>
          <span>Model</span>
        </Link>
      </nav>
    </aside>
  );
}


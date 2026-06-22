// src/app/page.tsx
import Link from 'next/link'
import styles from './page.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <h1 className={styles.title}>
          ClubSpace
        </h1>
        <p className={styles.subtitle}>
          Manage your university student clubs with ease
        </p>
        <div className={styles.buttonGroup}>
          <Link href="/auth/login" className={styles.btnPrimary}>
            <span>Login</span>
          </Link>
          <Link href="/auth/register" className={styles.btnOutline}>
            <span>Register</span>
          </Link>
        </div>
        <div className={styles.footer}>
          <p>
            Built for universities, clubs, and students. Fully compliant with{' '}
            <Link href="/privacy" className={styles.footerLink}>
              GDPR &amp; POPIA
            </Link>.
          </p>
        </div>
      </div>
    </div>
  )
}

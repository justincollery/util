import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signIn, signOut } from 'next-auth/react';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Header.module.css';

const Header = () => {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link href="/">
            <span className={styles.logoText}>Irish Utility Compare</span>
          </Link>
        </div>

        <button className={styles.menuButton} onClick={toggleMenu} aria-label="Toggle menu">
          <span className={styles.menuIcon}></span>
        </button>

        <nav className={`${styles.nav} ${menuOpen ? styles.active : ''}`}>
          <ul className={styles.navList}>
            <li className={styles.navItem}>
              <Link href="/" className={router.pathname === '/' ? styles.active : ''}>
                Home
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/about" className={router.pathname === '/about' ? styles.active : ''}>
                About
              </Link>
            </li>
            {isAuthenticated ? (
              <>
                <li className={styles.navItem}>
                  <Link href="/dashboard" className={router.pathname === '/dashboard' ? styles.active : ''}>
                    Dashboard
                  </Link>
                </li>
                <li className={styles.navItem}>
                  <Link href="/upload-bill" className={router.pathname === '/upload-bill' ? styles.active : ''}>
                    Upload Bill
                  </Link>
                </li>
                <li className={styles.navItem}>
                  <button className={styles.signOutButton} onClick={() => signOut()}>
                    Sign Out
                  </button>
                </li>
                <li className={styles.navItem}>
                  <div className={styles.profileMenu}>
                    <div className={styles.profileImage}>
                      {user?.image ? (
                        <img src={user.image} alt={user.name} />
                      ) : (
                        <span>{user?.name?.charAt(0) || 'U'}</span>
                      )}
                    </div>
                  </div>
                </li>
              </>
            ) : (
              <li className={styles.navItem}>
                <button className={styles.signInButton} onClick={() => signIn()}>
                  Sign In
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
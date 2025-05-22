import Head from 'next/head';
import styles from '../styles/Home.module.css';
import UtilityComparisonForm from '../components/UtilityComparisonForm';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className={styles.container}>
      <Head>
        <title>Irish Utility Compare</title>
        <meta name="description" content="Compare utility deals in Ireland" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Irish Utility Compare
        </h1>

        <p className={styles.description}>
          Find the best deals on electricity, gas, and broadband in Ireland
        </p>

        {isAuthenticated && (
          <div className={styles.welcomeBanner}>
            <p>Welcome back, {user?.name || 'User'}! Ready to find more savings?</p>
          </div>
        )}

        <UtilityComparisonForm />

        <div className={styles.features}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>💰</div>
            <h3>Save Money</h3>
            <p>Our users save an average of €325 per year on their utility bills</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>⚡</div>
            <h3>Quick Comparison</h3>
            <p>Compare all providers in Ireland in just a few minutes</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📄</div>
            <h3>Bill Upload</h3>
            <p>Upload your bill and we'll analyze it for potential savings</p>
          </div>
        </div>
      </main>

      <section className={styles.ctaSection}>
        <div className={styles.ctaContainer}>
          <h2>Want personalized recommendations?</h2>
          <p>
            Sign in to upload your bills and get tailored savings recommendations based on your actual usage.
          </p>
          <div className={styles.ctaButtons}>
            {isAuthenticated ? (
              <a href="/upload-bill" className={styles.ctaPrimary}>Upload Your Bill</a>
            ) : (
              <a href="/auth/signin" className={styles.ctaPrimary}>Sign In</a>
            )}
            <a href="/about" className={styles.ctaSecondary}>Learn More</a>
          </div>
        </div>
      </section>
    </div>
  );
}
import { useState } from 'react';
import { getProviders, signIn } from "next-auth/react";
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '../../styles/SignIn.module.css';

export default function SignIn({ providers }) {
  const router = useRouter();
  const { callbackUrl } = router.query;
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = (providerId) => {
    setIsSigningIn(true);
    signIn(providerId, { callbackUrl: callbackUrl || '/' });
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Sign In | Irish Utility Compare</title>
        <meta name="description" content="Sign in to Irish Utility Compare" />
      </Head>

      <main className={styles.main}>
        <div className={styles.signInBox}>
          <h1 className={styles.title}>Sign In</h1>
          <p className={styles.description}>
            Sign in to save your comparisons and upload utility bills
          </p>

          <div className={styles.providers}>
            {Object.values(providers).map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleSignIn(provider.id)}
                className={`${styles.providerButton} ${styles[provider.id]}`}
                disabled={isSigningIn}
              >
                {provider.id === 'google' && (
                  <svg className={styles.providerIcon} viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                Sign in with {provider.name}
              </button>
            ))}
          </div>

          <div className={styles.info}>
            <p>By signing in, you agree to our Terms and Privacy Policy.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export async function getServerSideProps() {
  const providers = await getProviders();
  return {
    props: { providers },
  };
}
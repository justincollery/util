import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import styles from '../styles/Results.module.css';
import UtilityDealCard from '../components/UtilityDealCard';

// Mock data for demonstration
const mockDeals = {
  electricity: [
    {
      provider: "Energy Ireland",
      planName: "Green Electricity 12 Month Fixed",
      logoUrl: "/logos/energy-ireland.png",
      monthlyPrice: 89,
      annualSavings: 212,
      features: [
        "100% renewable electricity",
        "12-month price guarantee",
        "No exit fees",
        "Smart meter compatible"
      ],
      signupUrl: "#"
    },
    {
      provider: "Power Direct",
      planName: "Saver Plus Electricity",
      logoUrl: "/logos/power-direct.png",
      monthlyPrice: 92,
      annualSavings: 178,
      features: [
        "€50 welcome credit",
        "24/7 customer service",
        "Online account management",
        "Monthly billing option"
      ],
      signupUrl: "#"
    },
    {
      provider: "Irish Energy",
      planName: "Standard Variable Rate",
      logoUrl: "/logos/irish-energy.png",
      monthlyPrice: 95,
      annualSavings: 145,
      features: [
        "No contract lock-in",
        "Paper bills available",
        "Local Irish company",
        "Refer a friend bonus"
      ],
      signupUrl: "#"
    }
  ],
  gas: [
    {
      provider: "Gas Networks",
      planName: "Home Heating Value",
      logoUrl: "/logos/gas-networks.png",
      monthlyPrice: 78,
      annualSavings: 156,
      features: [
        "Low unit rate",
        "Free boiler service in year 1",
        "No exit fees",
        "24/7 emergency support"
      ],
      signupUrl: "#"
    },
    {
      provider: "Warm Homes",
      planName: "Flexi Gas Plan",
      logoUrl: "/logos/warm-homes.png",
      monthlyPrice: 82,
      annualSavings: 112,
      features: [
        "Flexible payment options",
        "Carbon offset program",
        "Online account management",
        "Monthly billing"
      ],
      signupUrl: "#"
    }
  ],
  broadband: [
    {
      provider: "Fast Connect",
      planName: "Fibre 500MB",
      logoUrl: "/logos/fast-connect.png",
      monthlyPrice: 45,
      annualSavings: 120,
      features: [
        "500MB download speed",
        "Unlimited usage",
        "Free installation",
        "No contract option available"
      ],
      signupUrl: "#"
    },
    {
      provider: "Net Ireland",
      planName: "Ultimate Broadband & TV",
      logoUrl: "/logos/net-ireland.png",
      monthlyPrice: 65,
      annualSavings: 95,
      features: [
        "350MB broadband",
        "120+ TV channels",
        "Free set-top box",
        "Sports package included"
      ],
      signupUrl: "#"
    },
    {
      provider: "Connect Plus",
      planName: "Basic Broadband",
      logoUrl: "/logos/connect-plus.png",
      monthlyPrice: 35,
      annualSavings: 84,
      features: [
        "100MB download speed",
        "Unlimited usage",
        "Phone support",
        "Ideal for basic internet usage"
      ],
      signupUrl: "#"
    }
  ],
  dual: [
    {
      provider: "Total Utilities",
      planName: "Dual Fuel Saver",
      logoUrl: "/logos/total-utilities.png",
      monthlyPrice: 155,
      annualSavings: 325,
      features: [
        "Combined electricity & gas",
        "Single monthly bill",
        "Online account management",
        "10% dual fuel discount"
      ],
      signupUrl: "#"
    },
    {
      provider: "Irish Energy",
      planName: "Home Bundle",
      logoUrl: "/logos/irish-energy.png",
      monthlyPrice: 160,
      annualSavings: 285,
      features: [
        "Fixed price for 12 months",
        "100% renewable electricity",
        "Free smart thermostat",
        "No exit fees"
      ],
      signupUrl: "#"
    }
  ]
};

export default function Results() {
  const router = useRouter();
  const [deals, setDeals] = useState([]);
  const [utilityType, setUtilityType] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would be an API call using the query parameters
    if (router.isReady) {
      const { utilityType } = router.query;
      
      setUtilityType(utilityType || 'electricity');
      
      // Simulate API call
      setTimeout(() => {
        setDeals(mockDeals[utilityType || 'electricity'] || []);
        setIsLoading(false);
      }, 1000);
    }
  }, [router.isReady, router.query]);

  const getUtilityTypeLabel = (type) => {
    const labels = {
      electricity: 'Electricity',
      gas: 'Gas',
      broadband: 'Broadband',
      dual: 'Electricity & Gas'
    };
    return labels[type] || type;
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Comparison Results | Irish Utility Compare</title>
        <meta name="description" content="Your utility comparison results" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Your Comparison Results</h1>
        
        <p className={styles.description}>
          We found {deals.length} {getUtilityTypeLabel(utilityType)} deals that could save you money
        </p>

        {isLoading ? (
          <div className={styles.loading}>
            <p>Finding the best deals for you...</p>
          </div>
        ) : (
          <div className={styles.resultsGrid}>
            {deals.map((deal, index) => (
              <UtilityDealCard key={index} deal={deal} />
            ))}
          </div>
        )}

        <div className={styles.newSearch}>
          <p>Not what you're looking for?</p>
          <button 
            onClick={() => router.push('/')}
            className={styles.newSearchButton}
          >
            Start a New Comparison
          </button>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} Irish Utility Compare. All rights reserved.</p>
      </footer>
    </div>
  );
}
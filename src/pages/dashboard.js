import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Dashboard.module.css';
import BillHistoryChart from '../components/BillHistoryChart';
import UtilitySpendingSummary from '../components/UtilitySpendingSummary';
import SavingsRecommendations from '../components/SavingsRecommendations';
import { 
  getElectricityData, 
  getGasData, 
  getBroadbandData, 
  getTotalSpending
} from '../services/utilityData';

// Mock data for uploaded bills
const mockBills = [
  {
    id: '1',
    type: 'electricity',
    provider: 'Electric Ireland',
    uploadDate: '2025-05-01',
    billDate: '2025-04-15',
    amount: 89.75,
    status: 'analyzed',
    savings: 112.5,
  },
  {
    id: '2',
    type: 'gas',
    provider: 'Bord Gáis Energy',
    uploadDate: '2025-04-10',
    billDate: '2025-03-28',
    amount: 78.30,
    status: 'analyzed',
    savings: 85.2,
  },
  {
    id: '3',
    type: 'broadband',
    provider: 'Eir',
    uploadDate: '2025-03-15',
    billDate: '2025-03-01',
    amount: 59.99,
    status: 'analyzed',
    savings: 120,
  },
];

// Mock data for saved comparisons
const mockComparisons = [
  {
    id: '1',
    type: 'electricity',
    date: '2025-05-10',
    providers: ['Electric Ireland', 'Bord Gáis Energy', 'SSE Airtricity'],
    bestDeal: 'SSE Airtricity',
    savings: 112.5,
  },
  {
    id: '2',
    type: 'gas',
    date: '2025-04-28',
    providers: ['Bord Gáis Energy', 'Flogas', 'Energia'],
    bestDeal: 'Energia',
    savings: 85.2,
  },
];

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [bills, setBills] = useState([]);
  const [comparisons, setComparisons] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [chartType, setChartType] = useState('line');
  const [timeframe, setTimeframe] = useState(12); // Default to 12 months
  const [recentUploads, setRecentUploads] = useState([]);
  const [showUploadNotification, setShowUploadNotification] = useState(false);

  // Dummy utility data for the charts
  const [electricityData, setElectricityData] = useState([]);
  const [gasData, setGasData] = useState([]);
  const [broadbandData, setBroadbandData] = useState([]);
  const [totalData, setTotalData] = useState([]);

  useEffect(() => {
    // If not loading and not authenticated, redirect to sign in
    if (!loading && !isAuthenticated) {
      router.push('/auth/signin');
    }
    
    // In a real app, fetch user's bills and comparisons from an API
    // For now, using mock data
    setBills(mockBills);
    setComparisons(mockComparisons);

    // Generate dummy utility data
    const elecData = getElectricityData(24); // Get 24 months of data
    const gasData = getGasData(24);
    const broadbandData = getBroadbandData(24);
    
    setElectricityData(elecData);
    setGasData(gasData);
    setBroadbandData(broadbandData);
    setTotalData(getTotalSpending(elecData, gasData, broadbandData));
  }, [isAuthenticated, loading, router]);

  // Handle bill uploads from chart component
  const handleBillUpload = (uploadData) => {
    // Create a new bill entry
    const newBill = {
      id: `upload-${Date.now()}`,
      type: uploadData.utilityType === 'all' ? 'multiple' : uploadData.utilityType,
      provider: 'Pending Analysis', // In a real app, this would be extracted from the bill
      uploadDate: new Date().toISOString().split('T')[0],
      billDate: new Date().toISOString().split('T')[0], // Would be extracted from the bill
      amount: 0, // Would be extracted from the bill
      status: 'processing',
      fileName: uploadData.file.name,
      fileUrl: uploadData.s3Url,
      s3Key: uploadData.s3Key
    };
    
    // Add the new bill to the list
    setBills(prevBills => [newBill, ...prevBills]);
    
    // Add to recent uploads
    setRecentUploads(prev => [newBill, ...prev].slice(0, 3));
    
    // Show notification
    setShowUploadNotification(true);
    
    // Hide notification after 5 seconds
    setTimeout(() => {
      setShowUploadNotification(false);
    }, 5000);
  };

  if (loading || !isAuthenticated) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Dashboard | Irish Utility Compare</title>
        <meta name="description" content="Your dashboard for Irish Utility Compare" />
      </Head>

      {/* Upload notification */}
      {showUploadNotification && (
        <div className={styles.uploadNotification}>
          <div className={styles.uploadNotificationContent}>
            <p>Bill uploaded successfully!</p>
            <button 
              className={styles.closeNotification}
              onClick={() => setShowUploadNotification(false)}
            >
              &times;
            </button>
          </div>
        </div>
      )}

      <main className={styles.main}>
        <div className={styles.welcomeSection}>
          <h1 className={styles.title}>Welcome, {user.name}</h1>
          <p className={styles.subtitle}>
            Manage your utilities and find better deals
          </p>

          <div className={styles.summaryCards}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>📄</div>
              <div className={styles.summaryInfo}>
                <h3>{bills.length}</h3>
                <p>Bills Uploaded</p>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>💰</div>
              <div className={styles.summaryInfo}>
                <h3>€{bills.reduce((total, bill) => total + (bill.savings || 0), 0).toFixed(2)}</h3>
                <p>Potential Savings</p>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>📊</div>
              <div className={styles.summaryInfo}>
                <h3>{comparisons.length}</h3>
                <p>Saved Comparisons</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.contentSection}>
          <div className={styles.tabs}>
            <button 
              className={`${styles.tabButton} ${activeTab === 'overview' ? styles.active : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`${styles.tabButton} ${activeTab === 'bills' ? styles.active : ''}`}
              onClick={() => setActiveTab('bills')}
            >
              Your Bills
            </button>
            <button 
              className={`${styles.tabButton} ${activeTab === 'comparisons' ? styles.active : ''}`}
              onClick={() => setActiveTab('comparisons')}
            >
              Saved Comparisons
            </button>
          </div>

          <div className={styles.tabContent}>
            {activeTab === 'overview' && (
              <div className={styles.overviewTab}>
                <div className={styles.timeframeSelector}>
                  <label htmlFor="timeframe">Showing data for:</label>
                  <select 
                    id="timeframe" 
                    value={timeframe} 
                    onChange={(e) => setTimeframe(parseInt(e.target.value))}
                    className={styles.select}
                  >
                    <option value="6">Last 6 months</option>
                    <option value="12">Last 12 months</option>
                    <option value="24">Last 24 months</option>
                  </select>
                  
                  <div className={styles.chartTypeToggle}>
                    <button 
                      className={`${styles.toggleButton} ${chartType === 'line' ? styles.active : ''}`}
                      onClick={() => setChartType('line')}
                    >
                      Line
                    </button>
                    <button 
                      className={`${styles.toggleButton} ${chartType === 'bar' ? styles.active : ''}`}
                      onClick={() => setChartType('bar')}
                    >
                      Bar
                    </button>
                  </div>
                </div>
                
                <h2 className={styles.sectionTitle}>Utility Spending History</h2>
                <BillHistoryChart 
                  electricityData={electricityData}
                  gasData={gasData}
                  broadbandData={broadbandData}
                  totalData={totalData}
                  chartType={chartType}
                  timeframe={timeframe}
                  onBillUpload={handleBillUpload}
                />
                
                {recentUploads.length > 0 && (
                  <div className={styles.recentUploads}>
                    <h3>Recent Uploads</h3>
                    <ul className={styles.recentUploadsList}>
                      {recentUploads.map(upload => (
                        <li key={upload.id} className={styles.recentUploadItem}>
                          <span className={styles.uploadFileName}>{upload.fileName}</span>
                          <span className={`${styles.uploadStatus} ${styles[upload.status]}`}>
                            {upload.status === 'processing' ? 'Processing' : 'Analyzed'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <UtilitySpendingSummary 
                  electricityData={electricityData}
                  gasData={gasData}
                  broadbandData={broadbandData}
                  totalData={totalData}
                  timeframe={timeframe}
                />
                
                <SavingsRecommendations />

                <div className={styles.actionsSection}>
                  <h3>Quick Actions</h3>
                  <div className={styles.actionButtons}>
                    <Link href="/upload-bill" className={styles.actionButton}>
                      Upload New Bill
                    </Link>
                    <Link href="/" className={styles.actionButton}>
                      Compare Utilities
                    </Link>
                    <Link href="/notifications" className={styles.actionButtonSecondary}>
                      Set Price Alerts
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bills' && (
              <div className={styles.billsTab}>
                <div className={styles.tabHeader}>
                  <h2>Your Uploaded Bills</h2>
                  <Link href="/upload-bill" className={styles.actionButton}>
                    Upload New Bill
                  </Link>
                </div>

                {bills.length > 0 ? (
                  <div className={styles.billsList}>
                    {bills.map((bill) => (
                      <div key={bill.id} className={styles.billCard}>
                        <div className={styles.billHeader}>
                          <div className={styles.billType}>{bill.type}</div>
                          <div className={styles.billProvider}>{bill.provider}</div>
                        </div>
                        <div className={styles.billDetails}>
                          <div className={styles.billInfo}>
                            <p><strong>Bill Date:</strong> {bill.billDate}</p>
                            <p><strong>Amount:</strong> {bill.status === 'processing' 
                              ? 'Processing...' 
                              : `€${bill.amount.toFixed(2)}`}
                            </p>
                            {bill.fileName && (
                              <p><strong>File:</strong> {bill.fileName}</p>
                            )}
                          </div>
                          <div className={styles.billActions}>
                            {bill.status === 'processing' ? (
                              <div className={styles.processingBadge}>
                                Processing
                              </div>
                            ) : (
                              <div className={styles.savingsBadge}>
                                Potential Savings: €{bill.savings.toFixed(2)}
                              </div>
                            )}
                            <Link 
                              href={bill.status === 'processing' ? '#' : `/bill/${bill.id}`} 
                              className={`${styles.viewButton} ${bill.status === 'processing' ? styles.disabled : ''}`}
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <p>You haven't uploaded any bills yet.</p>
                    <Link href="/upload-bill" className={styles.actionButton}>
                      Upload Your First Bill
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'comparisons' && (
              <div className={styles.comparisonsTab}>
                <div className={styles.tabHeader}>
                  <h2>Your Saved Comparisons</h2>
                  <Link href="/" className={styles.actionButton}>
                    New Comparison
                  </Link>
                </div>

                {comparisons.length > 0 ? (
                  <div className={styles.comparisonsList}>
                    {comparisons.map((comparison) => (
                      <div key={comparison.id} className={styles.comparisonCard}>
                        <div className={styles.comparisonHeader}>
                          <div className={styles.comparisonType}>{comparison.type}</div>
                          <div className={styles.comparisonDate}>
                            Compared on {comparison.date}
                          </div>
                        </div>
                        <div className={styles.comparisonDetails}>
                          <p><strong>Providers Compared:</strong> {comparison.providers.join(', ')}</p>
                          <p><strong>Best Deal:</strong> {comparison.bestDeal}</p>
                          <div className={styles.savingsBadge}>
                            Potential Savings: €{comparison.savings.toFixed(2)}
                          </div>
                          <Link href={`/comparison/${comparison.id}`} className={styles.viewButton}>
                            View Details
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <p>You haven't saved any comparisons yet.</p>
                    <Link href="/" className={styles.actionButton}>
                      Start Your First Comparison
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
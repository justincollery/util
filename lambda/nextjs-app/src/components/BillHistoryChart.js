import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/BillHistoryChart.module.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const BillHistoryChart = ({ 
  electricityData, 
  gasData, 
  broadbandData, 
  totalData,
  chartType = 'line',
  timeframe = 12,
  onBillUpload = null
}) => {
  const { user } = useAuth();
  const [chartData, setChartData] = useState(null);
  const [utilityType, setUtilityType] = useState('total');
  const chartRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  // Handle drag & drop file upload
  const onDrop = useCallback(async (acceptedFiles) => {
    if (!user?.id) {
      console.error('User not authenticated');
      setUploadStatus({
        status: 'error',
        message: 'Please sign in to upload bills'
      });
      return;
    }

    if (acceptedFiles.length === 0) return;

    try {
      setUploadStatus({
        status: 'uploading',
        message: 'Uploading bill...'
      });

      // Get the corresponding utility type folder
      const folderPath = `bills/${utilityType === 'total' ? 'all' : utilityType}/`;
      
      // Create FormData object for API request
      const formData = new FormData();
      formData.append('file', acceptedFiles[0]);
      formData.append('utilityType', utilityType === 'total' ? 'all' : utilityType);
      formData.append('folderPath', folderPath);
      
      // Set up a progress simulator since fetch doesn't support progress events
      let progressInterval;
      const simulateProgress = () => {
        let progress = 0;
        progressInterval = setInterval(() => {
          progress += Math.random() * 10;
          if (progress > 90) {
            clearInterval(progressInterval);
            progress = 90;
          }
          setUploadStatus({
            status: 'uploading',
            message: `Uploading... ${Math.floor(progress)}%`,
            progress: { percentage: Math.floor(progress) }
          });
        }, 300);
      };
      
      simulateProgress();
      
      // Use fetch to upload to our API endpoint
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      // Clear progress interval
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
        console.error('Upload error response:', errorData);
        throw new Error(errorData.error || errorData.details || 'Server error during upload');
      }
      
      // Set progress to 100% briefly before success message
      setUploadStatus({
        status: 'uploading',
        message: 'Uploading... 100%',
        progress: { percentage: 100 }
      });
      
      const uploadResult = await response.json();

      // Notify parent component of successful upload if callback provided
      if (onBillUpload) {
        onBillUpload({
          file: acceptedFiles[0],
          s3Key: uploadResult.key,
          s3Url: uploadResult.location,
          utilityType: utilityType === 'total' ? 'all' : utilityType
        });
      }

      setUploadStatus({
        status: 'success',
        message: 'Bill uploaded successfully!',
        result: uploadResult
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setUploadStatus(null);
      }, 3000);
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus({
        status: 'error',
        message: `Upload failed: ${error.message}`
      });
    }
  }, [user, utilityType, onBillUpload]);

  // Setup dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: 10485760 // 10MB
  });

  // Update chart data when inputs change
  useEffect(() => {
    prepareChartData();
  }, [electricityData, gasData, broadbandData, totalData, utilityType, timeframe]);

  // Update dragging state
  useEffect(() => {
    setIsDragging(isDragActive);
  }, [isDragActive]);

  // Prepare data for Chart.js
  const prepareChartData = () => {
    if (!electricityData || !gasData || !broadbandData || !totalData) return;

    // Limit data to selected timeframe
    const limitedElectricity = electricityData.slice(-timeframe);
    const limitedGas = gasData.slice(-timeframe);
    const limitedBroadband = broadbandData.slice(-timeframe);
    const limitedTotal = totalData.slice(-timeframe);

    // Select the active dataset based on utilityType
    let activeData;
    let color;
    let label;

    switch (utilityType) {
      case 'electricity':
        activeData = limitedElectricity;
        color = 'rgba(255, 159, 64, 0.8)';
        label = 'Electricity';
        break;
      case 'gas':
        activeData = limitedGas;
        color = 'rgba(54, 162, 235, 0.8)';
        label = 'Gas';
        break;
      case 'broadband':
        activeData = limitedBroadband;
        color = 'rgba(153, 102, 255, 0.8)';
        label = 'Broadband';
        break;
      case 'total':
      default:
        activeData = limitedTotal;
        color = 'rgba(75, 192, 192, 0.8)';
        label = 'Total Spending';
        break;
    }

    const labels = activeData.map(item => item.month);
    const data = activeData.map(item => item.amount);

    // For stacked view (showing all utilities)
    const isStacked = utilityType === 'all';
    const chartConfig = {
      labels,
      datasets: isStacked ? [
        {
          label: 'Electricity',
          data: limitedElectricity.map(item => item.amount),
          backgroundColor: 'rgba(255, 159, 64, 0.6)',
          borderColor: 'rgba(255, 159, 64, 1)',
          borderWidth: 2,
          fill: true,
        },
        {
          label: 'Gas',
          data: limitedGas.map(item => item.amount),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          fill: true,
        },
        {
          label: 'Broadband',
          data: limitedBroadband.map(item => item.amount),
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 2,
          fill: true,
        }
      ] : [
        {
          label,
          data,
          backgroundColor: color.replace('0.8', '0.6'),
          borderColor: color.replace('0.8', '1'),
          borderWidth: 2,
          fill: chartType === 'line',
          tension: 0.2
        }
      ]
    };

    setChartData(chartConfig);
  };

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `€${context.parsed.y.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return '€' + value;
          }
        }
      }
    }
  };

  // If stacked bar chart
  if (utilityType === 'all' && chartType === 'bar') {
    options.scales.y.stacked = true;
    options.scales.x.stacked = true;
  }

  const renderChart = () => {
    if (!chartData) return <div className={styles.loading}>Loading chart data...</div>;

    if (chartType === 'line') {
      return <Line ref={chartRef} data={chartData} options={options} />;
    } else {
      return <Bar ref={chartRef} data={chartData} options={options} />;
    }
  };

  return (
    <div 
      className={`${styles.chartContainer} ${isDragging ? styles.dragging : ''}`}
      {...getRootProps()}
    >
      <input {...getInputProps()} />
      
      {uploadStatus && (
        <div className={`${styles.uploadStatus} ${styles[uploadStatus.status]}`}>
          <p>{uploadStatus.message}</p>
          {uploadStatus.status === 'uploading' && uploadStatus.progress && (
            <div className={styles.uploadProgress}>
              <div 
                className={styles.uploadProgressBar}
                style={{ width: `${uploadStatus.progress.percentage}%` }}
              ></div>
            </div>
          )}
        </div>
      )}
      
      <div className={styles.chartControls}>
        <div className={styles.utilitySelector}>
          <select
            value={utilityType}
            onChange={(e) => setUtilityType(e.target.value)}
            className={styles.select}
          >
            <option value="total">Total Spending</option>
            <option value="electricity">Electricity Only</option>
            <option value="gas">Gas Only</option>
            <option value="broadband">Broadband Only</option>
            <option value="all">All Utilities (Stacked)</option>
          </select>
        </div>
      </div>
      
      <div className={styles.chartWrapper}>
        {renderChart()}
        
        {isDragging && (
          <div className={styles.dropOverlay}>
            <div className={styles.dropOverlayContent}>
              <svg className={styles.dropIcon} viewBox="0 0 24 24">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
              </svg>
              <p>Drop your bill here to upload</p>
            </div>
          </div>
        )}
      </div>
      
      <div className={styles.dropHint}>
        <p>
          <svg className={styles.hintIcon} viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          Drag and drop a bill directly onto the chart to upload it
        </p>
      </div>
    </div>
  );
};

export default BillHistoryChart;
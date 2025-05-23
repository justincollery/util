import { useState } from 'react';
import styles from '../styles/UtilitySpendingSummary.module.css';
import { calculateStats } from '../services/utilityData';

const UtilitySpendingSummary = ({ 
  electricityData, 
  gasData, 
  broadbandData, 
  totalData,
  timeframe = 12
}) => {
  // Get data for selected timeframe
  const getTimeframeData = (data) => data.slice(-timeframe);
  
  const electricityStats = calculateStats(getTimeframeData(electricityData));
  const gasStats = calculateStats(getTimeframeData(gasData));
  const broadbandStats = calculateStats(getTimeframeData(broadbandData));
  const totalStats = calculateStats(getTimeframeData(totalData));
  
  // Calculate monthly average
  const monthlyAverage = totalStats.avg;
  
  // Calculate percentages for the pie chart
  const electricityPercentage = (electricityStats.avg / monthlyAverage * 100).toFixed(1);
  const gasPercentage = (gasStats.avg / monthlyAverage * 100).toFixed(1);
  const broadbandPercentage = (broadbandStats.avg / monthlyAverage * 100).toFixed(1);

  return (
    <div className={styles.summaryContainer}>
      <h2 className={styles.summaryTitle}>
        Your Utility Spending Summary
        <span className={styles.timeframe}>Last {timeframe} months</span>
      </h2>
      
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Monthly Average</span>
            <span className={`${styles.statIcon} ${styles.totalIcon}`}>€</span>
          </div>
          <div className={styles.statValue}>€{monthlyAverage.toFixed(2)}</div>
          <div className={styles.statDetails}>
            <div className={styles.statDetail}>
              <span className={styles.detailLabel}>Min:</span>
              <span className={styles.detailValue}>€{totalStats.min.toFixed(2)}</span>
            </div>
            <div className={styles.statDetail}>
              <span className={styles.detailLabel}>Max:</span>
              <span className={styles.detailValue}>€{totalStats.max.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Electricity</span>
            <span className={`${styles.statIcon} ${styles.electricityIcon}`}>⚡</span>
          </div>
          <div className={styles.statValue}>€{electricityStats.avg.toFixed(2)}</div>
          <div className={styles.statDetails}>
            <div className={styles.statDetail}>
              <span className={styles.detailLabel}>Total:</span>
              <span className={styles.detailValue}>€{electricityStats.total.toFixed(2)}</span>
            </div>
            <div className={styles.statDetail}>
              <span className={styles.detailLabel}>% of Budget:</span>
              <span className={styles.detailValue}>{electricityPercentage}%</span>
            </div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Gas</span>
            <span className={`${styles.statIcon} ${styles.gasIcon}`}>🔥</span>
          </div>
          <div className={styles.statValue}>€{gasStats.avg.toFixed(2)}</div>
          <div className={styles.statDetails}>
            <div className={styles.statDetail}>
              <span className={styles.detailLabel}>Total:</span>
              <span className={styles.detailValue}>€{gasStats.total.toFixed(2)}</span>
            </div>
            <div className={styles.statDetail}>
              <span className={styles.detailLabel}>% of Budget:</span>
              <span className={styles.detailValue}>{gasPercentage}%</span>
            </div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Broadband</span>
            <span className={`${styles.statIcon} ${styles.broadbandIcon}`}>📡</span>
          </div>
          <div className={styles.statValue}>€{broadbandStats.avg.toFixed(2)}</div>
          <div className={styles.statDetails}>
            <div className={styles.statDetail}>
              <span className={styles.detailLabel}>Total:</span>
              <span className={styles.detailValue}>€{broadbandStats.total.toFixed(2)}</span>
            </div>
            <div className={styles.statDetail}>
              <span className={styles.detailLabel}>% of Budget:</span>
              <span className={styles.detailValue}>{broadbandPercentage}%</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.distribution}>
        <h3 className={styles.distributionTitle}>Your Spending Distribution</h3>
        <div className={styles.distributionChart}>
          <div 
            className={`${styles.distributionBar} ${styles.electricityBar}`}
            style={{ width: `${electricityPercentage}%` }}
            title={`Electricity: ${electricityPercentage}%`}
          ></div>
          <div 
            className={`${styles.distributionBar} ${styles.gasBar}`}
            style={{ width: `${gasPercentage}%` }}
            title={`Gas: ${gasPercentage}%`}
          ></div>
          <div 
            className={`${styles.distributionBar} ${styles.broadbandBar}`}
            style={{ width: `${broadbandPercentage}%` }}
            title={`Broadband: ${broadbandPercentage}%`}
          ></div>
        </div>
        <div className={styles.distributionLegend}>
          <div className={styles.legendItem}>
            <span className={`${styles.legendColor} ${styles.electricityColor}`}></span>
            <span className={styles.legendLabel}>Electricity ({electricityPercentage}%)</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendColor} ${styles.gasColor}`}></span>
            <span className={styles.legendLabel}>Gas ({gasPercentage}%)</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendColor} ${styles.broadbandColor}`}></span>
            <span className={styles.legendLabel}>Broadband ({broadbandPercentage}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UtilitySpendingSummary;
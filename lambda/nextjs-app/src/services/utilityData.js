// Generate dummy historical utility data
import { addMonths, format, subMonths } from 'date-fns';

// Function to generate random value within a range
const randomInRange = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Function to generate realistic prices with some seasonal variation
const generateMonthlyData = (months, baseAmount, seasonalFactor = 1, volatility = 0.1) => {
  const today = new Date();
  const data = [];

  for (let i = 0; i < months; i++) {
    const date = subMonths(today, i);
    const month = date.getMonth();
    
    // Add seasonal variation (higher in winter months, lower in summer)
    // Northern hemisphere: winter = Dec(11), Jan(0), Feb(1)
    const seasonalVariation = seasonalFactor * 
      (month === 11 || month === 0 || month === 1 ? 0.2 : 
       month === 5 || month === 6 || month === 7 ? -0.15 : 0);
    
    // Add some random volatility
    const randomVariation = (Math.random() - 0.5) * volatility;
    
    // Calculate amount with variations
    const amount = baseAmount * (1 + seasonalVariation + randomVariation);
    
    data.unshift({
      date: format(date, 'yyyy-MM-dd'),
      month: format(date, 'MMM yyyy'),
      amount: parseFloat(amount.toFixed(2))
    });
  }

  return data;
};

// Generate dummy data for past 12 months
export const getElectricityData = (months = 12) => {
  return generateMonthlyData(months, 95, 1.5, 0.15); // Higher seasonal factor for electricity
};

export const getGasData = (months = 12) => {
  return generateMonthlyData(months, 75, 2, 0.1); // Even higher seasonal factor for gas
};

export const getBroadbandData = (months = 12) => {
  return generateMonthlyData(months, 45, 0, 0.05); // No seasonal factor, low volatility for broadband
};

// Function to calculate stats from data
export const calculateStats = (data) => {
  if (!data || data.length === 0) return { avg: 0, min: 0, max: 0, total: 0 };
  
  const amounts = data.map(item => item.amount);
  const total = amounts.reduce((sum, amount) => sum + amount, 0);
  const avg = total / amounts.length;
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  
  return {
    avg: parseFloat(avg.toFixed(2)),
    min: parseFloat(min.toFixed(2)),
    max: parseFloat(max.toFixed(2)),
    total: parseFloat(total.toFixed(2))
  };
};

// Combine all utilities spending
export const getTotalSpending = (electricityData, gasData, broadbandData) => {
  const months = Math.min(
    electricityData.length,
    gasData.length,
    broadbandData.length
  );
  
  const combinedData = [];
  
  for (let i = 0; i < months; i++) {
    const total = 
      electricityData[i].amount + 
      gasData[i].amount + 
      broadbandData[i].amount;
      
    combinedData.push({
      date: electricityData[i].date,
      month: electricityData[i].month,
      amount: parseFloat(total.toFixed(2))
    });
  }
  
  return combinedData;
};
import Link from 'next/link';
import styles from '../styles/SavingsRecommendations.module.css';

const SavingsRecommendations = ({ utilityData }) => {
  // Sample recommendations based on electricity/gas/broadband
  const recommendations = [
    {
      type: 'electricity',
      title: "Switch to Electric Ireland's Green Future Plan",
      description: "Based on your usage patterns, you could save up to €215 annually by switching to Electric Ireland's Green Future plan with 100% renewable energy.",
      potentialSavings: 215,
      difficulty: 'easy',
      cta: 'Compare Electricity Plans'
    },
    {
      type: 'gas',
      title: 'Energia Dual Fuel Discount',
      description: 'Bundling your gas and electricity with Energia could save you 15% on your gas bill. Based on your current usage, this would save approximately €135 per year.',
      potentialSavings: 135,
      difficulty: 'easy',
      cta: 'View Dual Fuel Offers'
    },
    {
      type: 'broadband',
      title: 'Switch to Vodafone Home Essentials',
      description: 'Vodafone is currently offering a 12-month discount on their fiber broadband package which could save you €120 over the next year.',
      potentialSavings: 120,
      difficulty: 'easy',
      cta: 'View Broadband Deals'
    },
    {
      type: 'gas',
      title: 'Reduce Your Heating Schedule',
      description: 'Setting your heating to come on 30 minutes later and turn off 30 minutes earlier could save approximately 10% on your heating bill.',
      potentialSavings: 90,
      difficulty: 'medium',
      cta: 'Learn More'
    },
    {
      type: 'electricity',
      title: 'Night Rate Electricity Plan',
      description: 'Based on your upload bills, you might benefit from a day/night rate tariff. Running appliances at night could save up to 13% on your electricity costs.',
      potentialSavings: 148,
      difficulty: 'medium',
      cta: 'See Night Rate Plans'
    }
  ];

  // Sort recommendations by potential savings (highest first)
  const sortedRecommendations = [...recommendations].sort((a, b) => 
    b.potentialSavings - a.potentialSavings
  );

  // Calculate total potential savings
  const totalPotentialSavings = sortedRecommendations.reduce(
    (total, rec) => total + rec.potentialSavings, 
    0
  );

  const getDifficultyLabel = (difficulty) => {
    switch(difficulty) {
      case 'easy':
        return { label: 'Easy', color: '#047857' };
      case 'medium':
        return { label: 'Medium', color: '#B45309' };
      case 'hard':
        return { label: 'Advanced', color: '#BE123C' };
      default:
        return { label: 'Easy', color: '#047857' };
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Personalized Savings Recommendations</h2>
        <div className={styles.savingsBadge}>
          Potential Savings: €{totalPotentialSavings}/year
        </div>
      </div>

      <p className={styles.description}>
        Based on your utility usage history, we've identified these opportunities to save:
      </p>

      <div className={styles.recommendations}>
        {sortedRecommendations.map((rec, index) => {
          const difficulty = getDifficultyLabel(rec.difficulty);
          
          return (
            <div key={index} className={styles.recommendationCard}>
              <div className={styles.recommendationHeader}>
                <div className={styles.recommendationType}>
                  {rec.type === 'electricity' && (
                    <span className={`${styles.typeIcon} ${styles.electricity}`}>⚡</span>
                  )}
                  {rec.type === 'gas' && (
                    <span className={`${styles.typeIcon} ${styles.gas}`}>🔥</span>
                  )}
                  {rec.type === 'broadband' && (
                    <span className={`${styles.typeIcon} ${styles.broadband}`}>📡</span>
                  )}
                  <span className={styles.typeText}>{rec.type}</span>
                </div>
                <div 
                  className={styles.difficultyBadge}
                  style={{ backgroundColor: `${difficulty.color}20`, color: difficulty.color }}
                >
                  {difficulty.label}
                </div>
              </div>
              
              <h3 className={styles.recommendationTitle}>{rec.title}</h3>
              <p className={styles.recommendationDescription}>{rec.description}</p>
              
              <div className={styles.recommendationFooter}>
                <div className={styles.potentialSavings}>
                  <span className={styles.savingsLabel}>Potential Savings:</span>
                  <span className={styles.savingsValue}>€{rec.potentialSavings}/year</span>
                </div>
                <Link 
                  href={rec.type === 'electricity' ? '/?utilityType=electricity' : 
                        rec.type === 'gas' ? '/?utilityType=gas' : 
                        '/?utilityType=broadband'} 
                  className={styles.actionButton}
                >
                  {rec.cta}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SavingsRecommendations;
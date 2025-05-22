import styles from '../styles/UtilityDealCard.module.css';

const UtilityDealCard = ({ deal }) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <img 
          src={deal.logoUrl || "/placeholder-logo.png"} 
          alt={`${deal.provider} logo`} 
          className={styles.logo}
        />
        <div className={styles.headerInfo}>
          <h3 className={styles.provider}>{deal.provider}</h3>
          <p className={styles.planName}>{deal.planName}</p>
        </div>
      </div>
      
      <div className={styles.details}>
        <div className={styles.costInfo}>
          <span className={styles.price}>€{deal.monthlyPrice}</span>
          <span className={styles.period}>per month</span>
        </div>
        
        <div className={styles.savings}>
          {deal.annualSavings > 0 && (
            <p className={styles.savingsText}>
              Save €{deal.annualSavings} per year
            </p>
          )}
        </div>
      </div>
      
      <div className={styles.features}>
        <h4 className={styles.featuresTitle}>Features</h4>
        <ul className={styles.featuresList}>
          {deal.features.map((feature, index) => (
            <li key={index} className={styles.featureItem}>
              {feature}
            </li>
          ))}
        </ul>
      </div>
      
      <a href={deal.signupUrl || "#"} className={styles.signupButton}>
        Sign Up Now
      </a>
      
      <p className={styles.disclaimer}>
        * Terms and conditions apply. Based on your estimated usage.
      </p>
    </div>
  );
};

export default UtilityDealCard;
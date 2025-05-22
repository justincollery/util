import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/UtilityComparisonForm.module.css';

const UtilityComparisonForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    utilityType: 'electricity',
    currentProvider: '',
    annualUsage: '',
    eircode: '',
    houseType: 'house',
    bedrooms: '3',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Simple validation
    if (!formData.eircode) {
      newErrors.eircode = 'Eircode is required';
    } else if (!/^[A-Za-z0-9\s]{7,8}$/.test(formData.eircode.replace(/\s/g, ''))) {
      newErrors.eircode = 'Please enter a valid Eircode';
    }
    
    if (formData.utilityType !== 'broadband' && !formData.annualUsage) {
      newErrors.annualUsage = 'Annual usage is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    // In a real app, this would call an API before redirecting
    console.log('Form submitted:', formData);
    
    // Redirect to results page with query params
    router.push({
      pathname: '/results',
      query: formData
    });
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>Compare Your Utilities</h2>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="utilityType">Utility Type</label>
          <select 
            id="utilityType" 
            name="utilityType" 
            value={formData.utilityType}
            onChange={handleChange}
            className={styles.select}
          >
            <option value="electricity">Electricity</option>
            <option value="gas">Gas</option>
            <option value="broadband">Broadband</option>
            <option value="dual">Electricity & Gas Bundle</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="currentProvider">Current Provider (if any)</label>
          <input 
            type="text" 
            id="currentProvider" 
            name="currentProvider"
            value={formData.currentProvider}
            onChange={handleChange}
            className={styles.input}
            placeholder="e.g. Electric Ireland, Bord Gáis"
          />
        </div>

        {formData.utilityType !== 'broadband' && (
          <div className={styles.formGroup}>
            <label htmlFor="annualUsage">
              Annual Usage 
              {formData.utilityType === 'electricity' ? ' (kWh)' : formData.utilityType === 'gas' ? ' (kWh)' : ''}
            </label>
            <input 
              type="number" 
              id="annualUsage" 
              name="annualUsage"
              value={formData.annualUsage}
              onChange={handleChange}
              className={`${styles.input} ${errors.annualUsage ? styles.inputError : ''}`}
              placeholder="e.g. 4200"
            />
            {errors.annualUsage && (
              <p className={styles.errorText}>{errors.annualUsage}</p>
            )}
            <small className={styles.helpText}>
              Don't know? Average Irish home uses: 
              {formData.utilityType === 'electricity' ? ' 4,200 kWh' : formData.utilityType === 'gas' ? ' 11,000 kWh' : ''}
            </small>
          </div>
        )}

        <div className={styles.formGroup}>
          <label htmlFor="eircode">Eircode</label>
          <input 
            type="text" 
            id="eircode" 
            name="eircode"
            value={formData.eircode}
            onChange={handleChange}
            className={`${styles.input} ${errors.eircode ? styles.inputError : ''}`}
            placeholder="e.g. D01 F5P2"
          />
          {errors.eircode && (
            <p className={styles.errorText}>{errors.eircode}</p>
          )}
        </div>

        {formData.utilityType === 'broadband' && (
          <>
            <div className={styles.formGroup}>
              <label htmlFor="houseType">Property Type</label>
              <select 
                id="houseType" 
                name="houseType" 
                value={formData.houseType}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="business">Business</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="bedrooms">Bedrooms</label>
              <select 
                id="bedrooms" 
                name="bedrooms" 
                value={formData.bedrooms}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5+">5+</option>
              </select>
            </div>
          </>
        )}

        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Finding Deals...' : 'Find The Best Deals'}
        </button>
      </form>
    </div>
  );
};

export default UtilityComparisonForm;
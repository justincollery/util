import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/UploadBill.module.css';
import FileDropzone from '../components/FileDropzone';

export default function UploadBill() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    billType: 'electricity',
    provider: '',
    billDate: '',
    amount: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // If not loading and not authenticated, redirect to sign in
    if (!loading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, loading, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (uploadedFiles.length === 0) {
      newErrors.file = 'Please upload at least one bill';
    }
    
    if (!formData.provider) {
      newErrors.provider = 'Provider is required';
    }
    
    if (!formData.billDate) {
      newErrors.billDate = 'Bill date is required';
    }
    
    if (!formData.amount) {
      newErrors.amount = 'Bill amount is required';
    } else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsUploading(true);
    
    try {
      // In a real app, you would save bill metadata to your database
      const billData = {
        userId: user.id,
        files: uploadedFiles,
        ...formData,
        uploadDate: new Date().toISOString(),
      };
      
      console.log('Bill submitted successfully:', billData);
      
      // Navigate to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error submitting bill data:', error);
      setIsUploading(false);
    }
  };

  const handleUploadStart = (files) => {
    setIsUploading(true);
    console.log('Upload started for files:', files);
  };

  const handleUploadProgress = (progress) => {
    setUploadProgress(progress);
  };

  const handleUploadComplete = (results) => {
    setIsUploading(false);
    setUploadedFiles(prevFiles => [...prevFiles, ...results]);
    console.log('Upload completed:', results);
  };

  const handleUploadError = (error) => {
    setIsUploading(false);
    console.error('Upload error:', error);
    setErrors(prev => ({
      ...prev,
      file: 'Error uploading file: ' + error.message
    }));
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
        <title>Upload Bill | Irish Utility Compare</title>
        <meta name="description" content="Upload your utility bill for analysis" />
      </Head>

      <main className={styles.main}>
        <div className={styles.uploadCard}>
          <h1 className={styles.title}>Upload Your Bill</h1>
          <p className={styles.description}>
            Upload your utility bill and we'll analyze it to find you better deals.
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="billType">Bill Type</label>
              <select 
                id="billType" 
                name="billType" 
                value={formData.billType}
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
              <label htmlFor="provider">Provider</label>
              <input 
                type="text" 
                id="provider" 
                name="provider"
                value={formData.provider}
                onChange={handleChange}
                className={`${styles.input} ${errors.provider ? styles.inputError : ''}`}
                placeholder="e.g. Electric Ireland, Bord Gáis"
              />
              {errors.provider && (
                <p className={styles.errorText}>{errors.provider}</p>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="billDate">Bill Date</label>
              <input 
                type="date" 
                id="billDate" 
                name="billDate"
                value={formData.billDate}
                onChange={handleChange}
                className={`${styles.input} ${errors.billDate ? styles.inputError : ''}`}
              />
              {errors.billDate && (
                <p className={styles.errorText}>{errors.billDate}</p>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="amount">Bill Amount (€)</label>
              <input 
                type="number" 
                id="amount" 
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={`${styles.input} ${errors.amount ? styles.inputError : ''}`}
                placeholder="e.g. 89.50"
              />
              {errors.amount && (
                <p className={styles.errorText}>{errors.amount}</p>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>Upload Bill</label>
              <FileDropzone 
                userId={user?.id}
                folderPath={`bills/${formData.billType}/`}
                onUploadStart={handleUploadStart}
                onUploadProgress={handleUploadProgress}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
                acceptedFileTypes={{
                  'application/pdf': ['.pdf'],
                  'image/jpeg': ['.jpg', '.jpeg'],
                  'image/png': ['.png']
                }}
                maxFileSize={10485760} // 10MB
              />
              {errors.file && (
                <p className={styles.errorText}>{errors.file}</p>
              )}
            </div>

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isUploading || uploadedFiles.length === 0}
            >
              {isUploading ? 'Uploading...' : 'Submit Bill Details'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
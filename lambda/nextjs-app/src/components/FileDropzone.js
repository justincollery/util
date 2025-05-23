import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import styles from '../styles/FileDropzone.module.css';

const FileDropzone = ({ 
  userId, 
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  acceptedFileTypes = {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png']
  },
  maxFileSize = 10485760, // 10MB
  folderPath = '',
  multiple = false
}) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  // Update the parent component when upload progress changes
  useEffect(() => {
    if (onUploadProgress && Object.keys(uploadProgress).length > 0) {
      onUploadProgress(uploadProgress);
    }
  }, [uploadProgress, onUploadProgress]);

  const onDrop = useCallback(acceptedFiles => {
    // Add the accepted files to the state with additional properties
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: `${file.name}-${Date.now()}`,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      status: 'queued', // queued, uploading, completed, error
      progress: 0,
      error: null
    }));
    
    // If not allowing multiple files, replace the previous files
    if (!multiple) {
      setFiles(newFiles);
    } else {
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  }, [multiple]);

  // Configure the dropzone
  const { 
    getRootProps, 
    getInputProps, 
    isDragActive,
    isDragAccept,
    isDragReject,
    fileRejections
  } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxSize: maxFileSize,
    multiple,
    disabled: uploading
  });

  // Helper to get the file type label
  const getFileTypeLabel = () => {
    const types = Object.values(acceptedFileTypes).flat();
    return types.map(type => type.replace('.', '')).join(', ').toUpperCase();
  };

  // Upload a single file using our API endpoint
  const uploadFile = async (fileObj) => {
    if (!userId) {
      console.error('User ID is required for uploading files');
      return;
    }

    try {
      // Update file status to uploading
      setFiles(prevFiles => 
        prevFiles.map(f => 
          f.id === fileObj.id 
            ? { ...f, status: 'uploading', progress: 0 } 
            : f
        )
      );

      // Create form data
      const formData = new FormData();
      formData.append('file', fileObj.file);
      formData.append('utilityType', folderPath.split('/')[1] || 'all');
      formData.append('folderPath', folderPath);

      // Simulate progress since we can't track it with fetch
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const currentProgress = prev[fileObj.id]?.percentage || 0;
          if (currentProgress < 90) {
            const newProgress = currentProgress + 10;
            
            // Update file status with progress
            setFiles(prevFiles => 
              prevFiles.map(f => 
                f.id === fileObj.id 
                  ? { ...f, progress: newProgress } 
                  : f
              )
            );
            
            return {
              ...prev,
              [fileObj.id]: {
                loaded: newProgress,
                total: 100,
                percentage: newProgress,
                elapsedTime: 0
              }
            };
          }
          return prev;
        });
      }, 500);

      // Upload using our API endpoint
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();

      // Update file status to completed
      setFiles(prevFiles => 
        prevFiles.map(f => 
          f.id === fileObj.id 
            ? { 
                ...f, 
                status: 'completed', 
                progress: 100, 
                s3Key: result.key, 
                s3Url: result.location 
              } 
            : f
        )
      );

      // Update progress to 100%
      setUploadProgress(prev => ({
        ...prev,
        [fileObj.id]: {
          loaded: 100,
          total: 100,
          percentage: 100,
          elapsedTime: 0
        }
      }));

      return result;
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // Update file status to error
      setFiles(prevFiles => 
        prevFiles.map(f => 
          f.id === fileObj.id 
            ? { ...f, status: 'error', error: error.message } 
            : f
        )
      );

      throw error;
    }
  };

  // Upload all queued files
  const uploadFiles = async () => {
    if (files.length === 0 || !userId) return;
    
    const queuedFiles = files.filter(f => f.status === 'queued');
    if (queuedFiles.length === 0) return;

    setUploading(true);
    if (onUploadStart) onUploadStart(queuedFiles);

    try {
      const results = [];
      
      // Upload files sequentially to avoid overwhelming the network
      for (const fileObj of queuedFiles) {
        const result = await uploadFile(fileObj);
        results.push(result);
      }
      
      if (onUploadComplete) onUploadComplete(results);
      return results;
    } catch (error) {
      if (onUploadError) onUploadError(error);
    } finally {
      setUploading(false);
    }
  };

  // Remove a file from the list
  const removeFile = (fileId) => {
    setFiles(prevFiles => prevFiles.filter(f => f.id !== fileId));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
  };

  // Clear all files
  const clearFiles = () => {
    // Clean up any object URLs to prevent memory leaks
    files.forEach(fileObj => {
      if (fileObj.preview) URL.revokeObjectURL(fileObj.preview);
    });
    setFiles([]);
    setUploadProgress({});
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      files.forEach(fileObj => {
        if (fileObj.preview) URL.revokeObjectURL(fileObj.preview);
      });
    };
  }, [files]);

  return (
    <div className={styles.dropzoneContainer}>
      <div 
        {...getRootProps({
          className: `${styles.dropzone} ${isDragActive ? styles.active : ''} ${isDragAccept ? styles.accept : ''} ${isDragReject ? styles.reject : ''}`
        })}
      >
        <input {...getInputProps()} />
        
        <div className={styles.dropzoneContent}>
          {isDragActive ? (
            <p>Drop the files here ...</p>
          ) : (
            <>
              <svg className={styles.uploadIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
              </svg>
              <p className={styles.dropzoneText}>
                Drag & drop your utility bill here, or <span className={styles.browse}>browse</span>
              </p>
              <p className={styles.dropzoneInfo}>
                Supported formats: {getFileTypeLabel()}
              </p>
              <p className={styles.dropzoneInfo}>
                Max size: {Math.round(maxFileSize / 1048576)}MB
              </p>
            </>
          )}
        </div>
      </div>

      {fileRejections.length > 0 && (
        <ul className={styles.errorList}>
          {fileRejections.map(({ file, errors }) => (
            <li key={file.name} className={styles.errorItem}>
              <p className={styles.errorFilename}>{file.name}</p>
              <ul>
                {errors.map(error => (
                  <li key={error.code} className={styles.errorMessage}>{error.message}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <div className={styles.fileList}>
          <div className={styles.fileListHeader}>
            <h3>Selected Files</h3>
            <button 
              type="button" 
              className={styles.clearButton}
              onClick={clearFiles}
              disabled={uploading}
            >
              Clear All
            </button>
          </div>
          
          <ul>
            {files.map((fileObj) => (
              <li key={fileObj.id} className={`${styles.fileItem} ${styles[fileObj.status]}`}>
                <div className={styles.fileDetails}>
                  {fileObj.preview ? (
                    <img 
                      src={fileObj.preview} 
                      alt={fileObj.file.name} 
                      className={styles.filePreview} 
                    />
                  ) : fileObj.file.type === 'application/pdf' ? (
                    <div className={styles.pdfIcon}>PDF</div>
                  ) : (
                    <div className={styles.fileIcon}>FILE</div>
                  )}
                  
                  <div className={styles.fileInfo}>
                    <p className={styles.fileName}>{fileObj.file.name}</p>
                    <p className={styles.fileSize}>{Math.round(fileObj.file.size / 1024)} KB</p>
                    
                    {fileObj.status === 'uploading' && (
                      <div className={styles.progressContainer}>
                        <div 
                          className={styles.progressBar} 
                          style={{ width: `${fileObj.progress}%` }}
                        ></div>
                        <span className={styles.progressText}>{fileObj.progress}%</span>
                      </div>
                    )}
                    
                    {fileObj.status === 'error' && (
                      <p className={styles.fileError}>{fileObj.error}</p>
                    )}
                  </div>
                </div>
                
                <button 
                  type="button" 
                  className={styles.removeButton}
                  onClick={() => removeFile(fileObj.id)}
                  disabled={uploading && fileObj.status === 'uploading'}
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
          
          <div className={styles.uploadActions}>
            <button
              type="button"
              className={styles.uploadButton}
              onClick={uploadFiles}
              disabled={uploading || files.filter(f => f.status === 'queued').length === 0}
            >
              {uploading ? 'Uploading...' : 'Upload Files'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileDropzone;
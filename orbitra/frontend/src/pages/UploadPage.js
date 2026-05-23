import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  FileText, Image, X, Loader, CheckCircle,
  UploadCloud, Sparkles, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { itineraryAPI } from '../services/api';
import './UploadPage.css';

const UploadPage = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [itineraryId, setItineraryId] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(null); // 'processing' | 'completed' | 'failed'
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length) {
      rejectedFiles.forEach(({ errors }) => {
        toast.error(errors[0]?.message || 'File not accepted');
      });
    }
    const newFiles = acceptedFiles.map((file) =>
      Object.assign(file, { preview: URL.createObjectURL(file) })
    );
    setFiles((prev) => {
      const combined = [...prev, ...newFiles];
      return combined.slice(0, 5);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024,
    multiple: true,
  });

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUpload = async () => {
    if (!files.length) {
      toast.error('Please add at least one document');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('documents', file));

      const { data } = await itineraryAPI.upload(formData, (e) => {
        const progress = Math.round((e.loaded * 100) / e.total);
        setUploadProgress(progress);
      });

      setItineraryId(data.itineraryId);
      setProcessingStatus('processing');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
      setUploading(false);
    }
  };

  // Poll for status
  useEffect(() => {
    if (!itineraryId || processingStatus !== 'processing') return;

    const interval = setInterval(async () => {
      try {
        const { data } = await itineraryAPI.getStatus(itineraryId);
        if (data.status === 'completed') {
          clearInterval(interval);
          setProcessingStatus('completed');
          setTimeout(() => navigate(`/itinerary/${itineraryId}`), 1200);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setProcessingStatus('failed');
          toast.error(data.itinerary?.errorMessage || 'Processing failed');
          setUploading(false);
        }
      } catch {
        // ignore polling errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [itineraryId, processingStatus, navigate]);

  // Cleanup previews
  useEffect(() => {
    return () => files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
  }, [files]);

  if (processingStatus === 'processing' || processingStatus === 'completed') {
    return (
      <div className="upload-page">
        <div className="processing-state">
          <div className={`processing-icon ${processingStatus === 'completed' ? 'success' : ''}`}>
            {processingStatus === 'completed' ? (
              <CheckCircle size={48} />
            ) : (
              <Loader size={48} className="spin-icon" />
            )}
          </div>
          <h2>
            {processingStatus === 'completed'
              ? 'Itinerary Ready!'
              : 'Generating Your Itinerary'}
          </h2>
          <p>
            {processingStatus === 'completed'
              ? 'Redirecting to your itinerary...'
              : 'Our AI is reading your documents and crafting a personalized itinerary...'}
          </p>
          {processingStatus === 'processing' && (
            <div className="processing-steps">
              {['Extracting document data', 'Parsing booking details', 'Generating itinerary with AI', 'Finalizing schedule'].map(
                (step, i) => (
                  <div key={i} className="processing-step" style={{ animationDelay: `${i * 0.5}s` }}>
                    <Sparkles size={13} />
                    {step}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="upload-page">
      <div className="container">
        <div className="upload-header">
          <h1>Upload Travel Documents</h1>
          <p>Upload your flight tickets, hotel bookings, or any travel documents — our AI will build a complete itinerary for you.</p>
        </div>

        <div className="upload-layout">
          {/* Dropzone */}
          <div className={`dropzone ${isDragActive ? 'drag-active' : ''}`} {...getRootProps()}>
            <input {...getInputProps()} />
            <div className="dropzone-content">
              <div className="dropzone-icon">
                <UploadCloud size={32} />
              </div>
              <h3>{isDragActive ? 'Drop files here' : 'Drag & drop documents'}</h3>
              <p>or <span>browse files</span> from your device</p>
              <div className="dropzone-formats">
                <span>PDF</span>
                <span>JPG</span>
                <span>PNG</span>
                <span>WebP</span>
              </div>
              <p className="dropzone-limit">Up to 5 files · Max 10MB each</p>
            </div>
          </div>

          {/* File list + tips */}
          <div className="upload-sidebar">
            {/* Tips */}
            <div className="upload-tips card">
              <h3>💡 What to upload</h3>
              <ul>
                <li>✈️ Flight e-tickets (PDF or screenshot)</li>
                <li>🏨 Hotel booking confirmations</li>
                <li>🚆 Train / bus tickets</li>
                <li>🚗 Car rental confirmations</li>
                <li>📋 Tour bookings</li>
              </ul>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="file-list card">
                <div className="file-list-header">
                  <h3>Selected Files ({files.length}/5)</h3>
                </div>
                <div className="file-items">
                  {files.map((file, i) => (
                    <div key={i} className="file-item">
                      <div className="file-icon">
                        {file.type === 'application/pdf' ? (
                          <FileText size={16} />
                        ) : (
                          <Image size={16} />
                        )}
                      </div>
                      <div className="file-info">
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">{formatSize(file.size)}</span>
                      </div>
                      <button
                        className="btn btn-ghost file-remove"
                        onClick={() => removeFile(i)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upload button */}
        {files.length > 0 && (
          <div className="upload-actions">
            {uploading && uploadProgress < 100 && (
              <div className="progress-bar-wrapper">
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span>{uploadProgress}% uploaded</span>
              </div>
            )}
            <button
              className="btn btn-primary upload-btn"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <><span className="spinner" /> Uploading...</>
              ) : (
                <><Sparkles size={16} /> Generate Itinerary <ArrowRight size={16} /></>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;

import { useState } from 'react';

export function ImageDebugger() {
  const [testImageUrl, setTestImageUrl] = useState('');
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const testImage = () => {
    const url = 'http://localhost:8000/api/image/2025-07-04%20113256.jpg';
    setTestImageUrl(url);
    setLoadStatus('loading');
    setErrorMessage('');

    const img = new Image();
    
    img.onload = () => {
      console.log('Test image loaded successfully:', url);
      setLoadStatus('success');
    };
    
    img.onerror = (error) => {
      console.error('Test image failed to load:', url, error);
      setLoadStatus('error');
      setErrorMessage('Failed to load test image');
    };
    
    img.src = url;
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Image Debugger</h3>
      <button onClick={testImage}>Test Image Load</button>
      <div>Status: {loadStatus}</div>
      {errorMessage && <div style={{ color: 'red' }}>Error: {errorMessage}</div>}
      {testImageUrl && (
        <div style={{ marginTop: '10px' }}>
          <p>Test Image URL: {testImageUrl}</p>
          <img 
            src={testImageUrl} 
            alt="Test" 
            style={{ maxWidth: '200px', maxHeight: '200px' }}
            onLoad={() => console.log('Direct img tag loaded')}
            onError={() => console.log('Direct img tag failed')}
          />
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Socket } from 'socket.io-client';

interface SubdomainEnumerationProps {
  socket: Socket | null;
}

const SubdomainEnumeration: React.FC<SubdomainEnumerationProps> = ({ socket }) => {
  const [domain, setDomain] = useState('');
  const [subdomains, setSubdomains] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const handleStartScan = async () => {
    if (!domain) return;
    setIsScanning(true);
    setSubdomains([]);
    try {
      const userId = localStorage.getItem('userId');
      await axios.post('/api/subdomain-enumeration', { domain, userId });
    } catch (error) {
      console.error('Error starting subdomain enumeration:', error);
    }
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('subdomain-found', (subdomain: string) => {
      setSubdomains(prevSubdomains => [...prevSubdomains, subdomain]);
    });

    socket.on('subdomain-scan-finished', () => {
      setIsScanning(false);
    });

    return () => {
      socket.off('subdomain-found');
      socket.off('subdomain-scan-finished');
    };
  }, [socket]);

  return (
    <div className="card">
      <div className="card-header">Subdomain Enumeration</div>
      <div className="card-body">
        <div className="input-group mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Enter domain (e.g., example.com)"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleStartScan}
            disabled={isScanning}
          >
            {isScanning ? 'Scanning...' : 'Start Scan'}
          </button>
        </div>
        <ul className="list-group">
          {subdomains.map((subdomain, index) => (
            <li key={index} className="list-group-item">{subdomain}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SubdomainEnumeration;

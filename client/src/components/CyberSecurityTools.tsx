import React, { useState, useEffect } from 'react';
import '../HackerTheme.css';

interface GitHubTool {
  name: string;
  owner: string;
  url: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
}

const CyberSecurityTools: React.FC = () => {
  const [tools, setTools] = useState<GitHubTool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const response = await fetch('https://anonymous-api-tvtx.onrender.com/github-tools');
        const data = await response.json();
        setTools(data);
      } catch (error) {
        console.error('Error fetching cybersecurity tools:', error);
      }
    };

    const initialFetch = async () => {
      setLoading(true);
      await fetchTools();
      setLoading(false);
    };

    initialFetch();

    const intervalId = setInterval(fetchTools, 30000); // Refresh every 30 seconds

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-center mb-4">Top 100 Cybersecurity Tools from GitHub</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {tools.map((tool) => (
          <div key={tool.url} className="card h-100">
            <div className="card-body d-flex flex-column">
              <h5 className="card-title"><a href={tool.url} target="_blank" rel="noopener noreferrer">{tool.name}</a></h5>
              <h6 className="card-subtitle mb-2 text-muted">{tool.owner}</h6>
              <p className="card-text flex-grow-1">{tool.description}</p>
              <div>
                <span className="badge bg-primary me-1">{tool.language}</span>
                <span className="badge bg-success me-1">★ {tool.stars}</span>
                <span className="badge bg-info">Forks: {tool.forks}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CyberSecurityTools;

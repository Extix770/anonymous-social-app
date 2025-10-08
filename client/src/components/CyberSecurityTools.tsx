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
        const response = await fetch('http://localhost:3001/github-tools');
        const data = await response.json();
        setTools(data);
      } catch (error) {
        console.error('Error fetching cybersecurity tools:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTools();
  }, []);

  if (loading) {
    return <div className="hacker-theme">Loading...</div>;
  }

  return (
    <div className="hacker-theme">
      <h2>Top 10 Cybersecurity Tools from GitHub</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Owner</th>
            <th>Description</th>
            <th>Language</th>
            <th>Stars</th>
            <th>Forks</th>
          </tr>
        </thead>
        <tbody>
          {tools.map((tool) => (
            <tr key={tool.url}>
              <td><a href={tool.url} target="_blank" rel="noopener noreferrer">{tool.name}</a></td>
              <td>{tool.owner}</td>
              <td>{tool.description}</td>
              <td>{tool.language}</td>
              <td>{tool.stars}</td>
              <td>{tool.forks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CyberSecurityTools;

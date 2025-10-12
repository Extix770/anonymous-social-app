import React, { useState } from 'react';

const LocalTools: React.FC = () => {
  const [subfinderDomain, setSubfinderDomain] = useState('');
  const [subfinderCommand, setSubfinderCommand] = useState('');
  const [subfinderResults, setSubfinderResults] = useState('');
  const [parsedSubfinderResults, setParsedSubfinderResults] = useState<string[]>([]);

  const generateSubfinderCommand = () => {
    if (!subfinderDomain) return;
    const command = `subfinder -d ${subfinderDomain}`;
    setSubfinderCommand(command);
  };

  const parseSubfinderResults = () => {
    const results = subfinderResults.split('\n').filter(Boolean);
    setParsedSubfinderResults(results);
  };

  return (
    <div className="card">
      <div className="card-header">Local Security Tools</div>
      <div className="card-body">
        <h5>Subfinder</h5>
        <div className="input-group mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Enter domain (e.g., example.com)"
            value={subfinderDomain}
            onChange={(e) => setSubfinderDomain(e.target.value)}
          />
          <button
            className="btn btn-primary"
            type="button"
            onClick={generateSubfinderCommand}
          >
            Generate Command
          </button>
        </div>
        {subfinderCommand && (
          <div className="mb-3">
            <label htmlFor="subfinder-command" className="form-label">Generated Command</label>
            <textarea
              id="subfinder-command"
              className="form-control"
              rows={1}
              value={subfinderCommand}
              readOnly
            />
          </div>
        )}
        <div className="mb-3">
          <label htmlFor="subfinder-results" className="form-label">Paste Results</label>
          <textarea
            id="subfinder-results"
            className="form-control"
            rows={5}
            value={subfinderResults}
            onChange={(e) => setSubfinderResults(e.target.value)}
          />
        </div>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={parseSubfinderResults}
        >
          Parse Results
        </button>
        {parsedSubfinderResults.length > 0 && (
          <div className="mt-3">
            <h5>Parsed Results</h5>
            <ul className="list-group">
              {parsedSubfinderResults.map((subdomain, index) => (
                <li key={index} className="list-group-item">{subdomain}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocalTools;

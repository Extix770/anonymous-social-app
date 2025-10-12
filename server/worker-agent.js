const io = require('socket.io-client');
const { exec } = require('child_process');

const SERVER_URL = 'https://anonymous-api-tvtx.onrender.com';

const socket = io(`${SERVER_URL}/worker`);

socket.on('connect', () => {
  console.log('Connected to the main server as a worker.');
});

socket.on('start-scan', ({ domain, userId }) => {
  console.log(`Starting scan for ${domain} (user: ${userId})`);

  const subfinder = exec(`subfinder -d ${domain}`);

  subfinder.stdout.on('data', (data) => {
    const results = data.toString().split('\n').filter(Boolean);
    results.forEach(result => {
      socket.emit('scan-result', { userId, result });
    });
  });

  subfinder.stderr.on('data', (data) => {
    socket.emit('scan-log', { userId, log: data.toString() });
  });

  subfinder.on('close', (code) => {
    console.log(`Scan finished for ${domain} with code ${code}`);
    socket.emit('scan-finished', { userId });
  });
});

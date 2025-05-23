const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;

// Enhanced logging
const log = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      platform: process.platform,
      nodeVersion: process.version,
      arch: process.arch,
      pid: process.pid,
      uptime: process.uptime()
    }
  };
  
  console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
  if (data) {
    console.log('Data:', JSON.stringify(data, null, 2));
  }
  
  // Write to log file
  try {
    fs.appendFileSync('/tmp/app-debug.log', JSON.stringify(logEntry) + '\n');
  } catch (err) {
    console.error('Failed to write to log file:', err.message);
  }
};

log('INFO', 'Starting debug server');
log('INFO', 'Environment variables', {
  NODE_ENV: process.env.NODE_ENV,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION,
  NEXT_PUBLIC_AWS_S3_BUCKET: process.env.NEXT_PUBLIC_AWS_S3_BUCKET,
  BILLS_TABLE_NAME: process.env.BILLS_TABLE_NAME
});

// Test Next.js availability
let nextAvailable = false;
try {
  require.resolve('next');
  nextAvailable = true;
  log('INFO', 'Next.js is available');
} catch (err) {
  log('ERROR', 'Next.js not available', { error: err.message });
}

// Test if we can import React
let reactAvailable = false;
try {
  require.resolve('react');
  reactAvailable = true;
  log('INFO', 'React is available');
} catch (err) {
  log('ERROR', 'React not available', { error: err.message });
}

// Check if package.json exists and is readable
let packageInfo = null;
try {
  const packagePath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packagePath)) {
    packageInfo = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    log('INFO', 'Package.json loaded', { 
      name: packageInfo.name, 
      version: packageInfo.version,
      dependencies: Object.keys(packageInfo.dependencies || {}).length,
      scripts: Object.keys(packageInfo.scripts || {})
    });
  } else {
    log('ERROR', 'Package.json not found');
  }
} catch (err) {
  log('ERROR', 'Failed to read package.json', { error: err.message });
}

// Check file system
try {
  const files = fs.readdirSync(__dirname);
  log('INFO', 'Application directory contents', { 
    files: files.slice(0, 20), // Limit to first 20 files
    totalFiles: files.length
  });
} catch (err) {
  log('ERROR', 'Failed to read directory', { error: err.message });
}

// Health check endpoint content
const generateHealthPage = () => {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Debug Health Check - Irish Utility Compare</title>
    <style>
        body { font-family: monospace; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .status { padding: 10px; margin: 10px 0; border-radius: 4px; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
        .code { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
        pre { margin: 0; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f2f2f2; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Debug Health Check</h1>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        
        <div class="status ${nextAvailable ? 'success' : 'error'}">
            <strong>Next.js Status:</strong> ${nextAvailable ? '✅ Available' : '❌ Not Available'}
        </div>
        
        <div class="status ${reactAvailable ? 'success' : 'error'}">
            <strong>React Status:</strong> ${reactAvailable ? '✅ Available' : '❌ Not Available'}
        </div>
        
        <div class="status info">
            <strong>Node.js Version:</strong> ${process.version}
        </div>
        
        <h2>Environment Variables</h2>
        <table>
            <tr><th>Variable</th><th>Value</th></tr>
            <tr><td>NODE_ENV</td><td>${process.env.NODE_ENV || 'undefined'}</td></tr>
            <tr><td>PORT</td><td>${process.env.PORT || 'undefined'}</td></tr>
            <tr><td>NEXTAUTH_URL</td><td>${process.env.NEXTAUTH_URL || 'undefined'}</td></tr>
            <tr><td>AWS_REGION</td><td>${process.env.NEXT_PUBLIC_AWS_REGION || 'undefined'}</td></tr>
            <tr><td>S3_BUCKET</td><td>${process.env.NEXT_PUBLIC_AWS_S3_BUCKET || 'undefined'}</td></tr>
        </table>
        
        ${packageInfo ? `
        <h2>Package Information</h2>
        <div class="code">
            <pre>${JSON.stringify({
              name: packageInfo.name,
              version: packageInfo.version,
              dependencies: Object.keys(packageInfo.dependencies || {}),
              scripts: packageInfo.scripts
            }, null, 2)}</pre>
        </div>
        ` : '<div class="status error">Package.json not found</div>'}
        
        <h2>System Information</h2>
        <table>
            <tr><td>Platform</td><td>${process.platform}</td></tr>
            <tr><td>Architecture</td><td>${process.arch}</td></tr>
            <tr><td>PID</td><td>${process.pid}</td></tr>
            <tr><td>Uptime</td><td>${Math.round(process.uptime())}s</td></tr>
            <tr><td>Memory Usage</td><td>${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB</td></tr>
        </table>
        
        <h2>Debug Actions</h2>
        <p><a href="/logs">View Application Logs</a></p>
        <p><a href="/test-nextjs">Test Next.js Initialization</a></p>
        <p><a href="/test-dependencies">Test Dependencies</a></p>
    </div>
</body>
</html>
  `;
};

const server = http.createServer((req, res) => {
  const url = req.url;
  log('INFO', `Request received`, { method: req.method, url, headers: req.headers });
  
  try {
    if (url === '/' || url === '/health') {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(generateHealthPage());
      
    } else if (url === '/logs') {
      try {
        const logs = fs.readFileSync('/tmp/app-debug.log', 'utf8');
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end(logs);
      } catch (err) {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('Logs not found: ' + err.message);
      }
      
    } else if (url === '/test-nextjs') {
      res.writeHead(200, {'Content-Type': 'application/json'});
      
      if (!nextAvailable) {
        res.end(JSON.stringify({
          success: false,
          error: 'Next.js not available'
        }, null, 2));
        return;
      }
      
      try {
        const next = require('next');
        res.end(JSON.stringify({
          success: true,
          nextjsVersion: next.version || 'unknown',
          message: 'Next.js can be imported successfully'
        }, null, 2));
      } catch (err) {
        log('ERROR', 'Next.js test failed', { error: err.message, stack: err.stack });
        res.end(JSON.stringify({
          success: false,
          error: err.message,
          stack: err.stack
        }, null, 2));
      }
      
    } else if (url === '/test-dependencies') {
      const dependencies = [
        'react', 'react-dom', 'next', 'aws-sdk', 'next-auth', 
        'chart.js', 'react-chartjs-2', 'firebase'
      ];
      
      const results = {};
      dependencies.forEach(dep => {
        try {
          require.resolve(dep);
          results[dep] = { available: true };
        } catch (err) {
          results[dep] = { available: false, error: err.message };
        }
      });
      
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify(results, null, 2));
      
    } else {
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end('Not Found');
    }
  } catch (err) {
    log('ERROR', 'Request handler error', { error: err.message, stack: err.stack });
    res.writeHead(500, {'Content-Type': 'text/plain'});
    res.end('Internal Server Error: ' + err.message);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  log('INFO', `Debug server started`, { port: PORT, host: '0.0.0.0' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log('INFO', 'SIGTERM received, shutting down gracefully');
  server.close(() => {
    log('INFO', 'Server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  log('ERROR', 'Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log('ERROR', 'Unhandled Rejection', { reason, promise });
  process.exit(1);
});
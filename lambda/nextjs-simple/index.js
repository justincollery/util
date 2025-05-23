// Simple Next.js-style Lambda handler for the Irish Utility Compare app
exports.handler = async (event, context) => {
  console.log('Request event:', JSON.stringify(event, null, 2));
  
  // Handle both API Gateway and direct Lambda invocations
  const path = event.path || event.rawPath || '/';
  const httpMethod = event.httpMethod || event.requestContext?.http?.method || 'GET';
  const queryStringParameters = event.queryStringParameters || {};
  const headers = event.headers || {};
  const body = event.body || '';
  
  // Extract stage for proper URL construction
  const stage = event.requestContext?.stage || '';
  const basePath = stage ? `/${stage}` : '';
  
  try {
    // Route handling - strip stage from path for routing logic
    const routePath = path.replace(new RegExp(`^/${stage}`), '') || '/';
    
    if (routePath === '/' || routePath === '') {
      return homePage(basePath);
    } else if (routePath === '/dashboard') {
      return dashboardPage(basePath);
    } else if (routePath === '/upload-bill') {
      return uploadBillPage(basePath);
    } else if (routePath === '/results') {
      return resultsPage(basePath);
    } else if (routePath.startsWith('/api/')) {
      return handleAPI(routePath, httpMethod, body, queryStringParameters);
    } else {
      return notFoundPage(basePath);
    }
    
  } catch (error) {
    console.error('Lambda error:', error);
    return errorPage(error, basePath);
  }
};

function homePage(basePath = '') {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html' },
    body: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Irish Utility Compare</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 40px; }
          .header h1 { color: #2d5a27; font-size: 2.5rem; margin-bottom: 10px; }
          .header p { color: #666; font-size: 1.2rem; }
          .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; margin: 40px 0; }
          .feature { padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px; text-align: center; }
          .feature h3 { color: #2d5a27; margin-bottom: 15px; }
          .cta { text-align: center; margin: 40px 0; }
          .btn { display: inline-block; padding: 15px 30px; background: #4caf50; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px; }
          .btn:hover { background: #45a049; }
          .btn-secondary { background: #2196f3; }
          .btn-secondary:hover { background: #1976d2; }
          .nav { margin-bottom: 30px; }
          .nav a { display: inline-block; margin-right: 20px; color: #2d5a27; text-decoration: none; font-weight: 500; }
          .nav a:hover { text-decoration: underline; }
          .status { background: #e8f5e8; border: 1px solid #4caf50; border-radius: 5px; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <nav class="nav">
            <a href="${basePath}/">Home</a>
            <a href="${basePath}/dashboard">Dashboard</a>
            <a href="${basePath}/upload-bill">Upload Bill</a>
            <a href="${basePath}/results">Results</a>
          </nav>
          
          <div class="status">
            ✅ <strong>Serverless Deployment Successful!</strong> - Now running on AWS Lambda + API Gateway
          </div>
          
          <header class="header">
            <h1>Irish Utility Compare</h1>
            <p>Compare utility rates and optimize your energy costs across Ireland</p>
          </header>
          
          <div class="features">
            <div class="feature">
              <h3>📄 Bill Upload & Analysis</h3>
              <p>Upload your utility bills and get instant AI-powered analysis with spending breakdowns and usage patterns.</p>
            </div>
            
            <div class="feature">
              <h3>💰 Cost Comparison</h3>
              <p>Compare rates from major Irish energy providers including Electric Ireland, Energia, and Bord Gáis Energy.</p>
            </div>
            
            <div class="feature">
              <h3>📊 Smart Recommendations</h3>
              <p>Get personalized recommendations to reduce your utility costs based on your usage patterns.</p>
            </div>
          </div>
          
          <div class="cta">
            <a href="${basePath}/upload-bill" class="btn">Upload Your First Bill</a>
            <a href="${basePath}/dashboard" class="btn btn-secondary">View Dashboard</a>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; text-align: center;">
            <p>🚀 <strong>Infrastructure:</strong> AWS Lambda + API Gateway + DynamoDB + S3</p>
            <p>⚡ <strong>Performance:</strong> Serverless, scalable, cost-effective</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
}

function dashboardPage(basePath = '') {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html' },
    body: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dashboard - Irish Utility Compare</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .nav { margin-bottom: 30px; }
          .nav a { display: inline-block; margin-right: 20px; color: #2d5a27; text-decoration: none; font-weight: 500; }
          .nav a:hover { text-decoration: underline; }
          .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
          .card { padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa; }
          .card h3 { color: #2d5a27; margin-bottom: 15px; }
          .metric { font-size: 2rem; font-weight: bold; color: #4caf50; }
          .btn { display: inline-block; padding: 10px 20px; background: #4caf50; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <nav class="nav">
            <a href="${basePath}/">Home</a>
            <a href="${basePath}/dashboard">Dashboard</a>
            <a href="${basePath}/upload-bill">Upload Bill</a>
            <a href="${basePath}/results">Results</a>
          </nav>
          
          <h1>Your Dashboard</h1>
          
          <div class="dashboard-grid">
            <div class="card">
              <h3>📊 Bills Processed</h3>
              <div class="metric">0</div>
              <p>Upload your first bill to get started</p>
              <a href="${basePath}/upload-bill" class="btn">Upload Bill</a>
            </div>
            
            <div class="card">
              <h3>💰 Potential Savings</h3>
              <div class="metric">€0</div>
              <p>Estimated monthly savings available</p>
            </div>
            
            <div class="card">
              <h3>⚡ Current Provider</h3>
              <div class="metric">-</div>
              <p>Upload a bill to see your current provider</p>
            </div>
            
            <div class="card">
              <h3>📈 Usage Trend</h3>
              <div class="metric">-</div>
              <p>Monthly usage comparison</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };
}

function uploadBillPage(basePath = '') {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html' },
    body: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Upload Bill - Irish Utility Compare</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .nav { margin-bottom: 30px; }
          .nav a { display: inline-block; margin-right: 20px; color: #2d5a27; text-decoration: none; font-weight: 500; }
          .upload-area { border: 2px dashed #4caf50; border-radius: 8px; padding: 60px; text-align: center; margin: 30px 0; }
          .upload-area:hover { background: #f8fff8; }
          .btn { display: inline-block; padding: 15px 30px; background: #4caf50; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
          .supported-formats { background: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <nav class="nav">
            <a href="${basePath}/">Home</a>
            <a href="${basePath}/dashboard">Dashboard</a>
            <a href="${basePath}/upload-bill">Upload Bill</a>
            <a href="${basePath}/results">Results</a>
          </nav>
          
          <h1>Upload Your Utility Bill</h1>
          
          <div class="upload-area">
            <h3>📄 Drag & Drop Your Bill Here</h3>
            <p>or click to browse files</p>
            <a href="#" class="btn">Choose File</a>
          </div>
          
          <div class="supported-formats">
            <h4>✅ Supported Formats:</h4>
            <ul>
              <li>PDF files from Irish energy providers</li>
              <li>Electric Ireland, Energia, Bord Gáis Energy, SSE Airtricity</li>
              <li>Gas and electricity bills</li>
            </ul>
          </div>
          
          <div style="margin-top: 30px; color: #666;">
            <p><strong>What happens next?</strong></p>
            <ol>
              <li>Your bill is securely uploaded to AWS S3</li>
              <li>AI analyzes the bill using AWS Bedrock</li>
              <li>Data is extracted and stored in DynamoDB</li>
              <li>You get instant cost comparison and recommendations</li>
            </ol>
          </div>
        </div>
      </body>
      </html>
    `
  };
}

function resultsPage(basePath = '') {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html' },
    body: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Results - Irish Utility Compare</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .nav { margin-bottom: 30px; }
          .nav a { display: inline-block; margin-right: 20px; color: #2d5a27; text-decoration: none; font-weight: 500; }
          .results-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
          .provider-card { padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; }
          .savings { color: #4caf50; font-weight: bold; font-size: 1.2rem; }
          .current { background: #e8f5e8; border-color: #4caf50; }
        </style>
      </head>
      <body>
        <div class="container">
          <nav class="nav">
            <a href="${basePath}/">Home</a>
            <a href="${basePath}/dashboard">Dashboard</a>
            <a href="${basePath}/upload-bill">Upload Bill</a>
            <a href="${basePath}/results">Results</a>
          </nav>
          
          <h1>Comparison Results</h1>
          
          <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin: 20px 0;">
            ⚠️ <strong>No bills uploaded yet.</strong> Please <a href="${basePath}/upload-bill">upload a bill</a> to see comparison results.
          </div>
          
          <div class="results-grid">
            <div class="provider-card current">
              <h3>Electric Ireland (Current)</h3>
              <p><strong>Monthly Cost:</strong> €--</p>
              <p><strong>Unit Rate:</strong> €-- per kWh</p>
              <div class="savings">Your current provider</div>
            </div>
            
            <div class="provider-card">
              <h3>Energia</h3>
              <p><strong>Monthly Cost:</strong> €--</p>
              <p><strong>Unit Rate:</strong> €-- per kWh</p>
              <div class="savings">Save €-- per month</div>
            </div>
            
            <div class="provider-card">
              <h3>Bord Gáis Energy</h3>
              <p><strong>Monthly Cost:</strong> €--</p>
              <p><strong>Unit Rate:</strong> €-- per kWh</p>
              <div class="savings">Save €-- per month</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };
}

function handleAPI(path, method, body, query) {
  // API endpoints
  if (path === '/api/bills' && method === 'GET') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bills: [], message: 'No bills found' })
    };
  }
  
  if (path === '/api/upload' && method === 'POST') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, message: 'Upload endpoint ready' })
    };
  }
  
  return {
    statusCode: 404,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'API endpoint not found' })
  };
}

function notFoundPage() {
  return {
    statusCode: 404,
    headers: { 'Content-Type': 'text/html' },
    body: `
      <!DOCTYPE html>
      <html>
      <head><title>Page Not Found</title></head>
      <body>
        <h1>404 - Page Not Found</h1>
        <p><a href="/">Return to Home</a></p>
      </body>
      </html>
    `
  };
}

function errorPage(error) {
  return {
    statusCode: 500,
    headers: { 'Content-Type': 'text/html' },
    body: `
      <!DOCTYPE html>
      <html>
      <head><title>Server Error</title></head>
      <body>
        <h1>500 - Server Error</h1>
        <p>Sorry, something went wrong.</p>
        <pre>${error.message}</pre>
        <p><a href="/">Return to Home</a></p>
   
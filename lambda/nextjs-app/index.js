const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Lambda handler for Next.js app
exports.handler = async (event, context) => {
  console.log('Lambda event:', JSON.stringify(event, null, 2));
  
  // Configure Next.js for serverless
  const app = next({
    dev: false,
    conf: {
      distDir: '.next',
      generateEtags: false,
      compress: false
    }
  });
  
  const handle = app.getRequestHandler();
  
  try {
    await app.prepare();
    
    // Convert API Gateway event to Node.js request format
    const { path, queryStringParameters, httpMethod, headers, body } = event;
    
    // Construct URL
    const query = queryStringParameters || {};
    const url = path + (Object.keys(query).length > 0 ? '?' + new URLSearchParams(query).toString() : '');
    
    // Create mock request and response objects
    const req = {
      url,
      method: httpMethod,
      headers: headers || {},
      body: body || '',
      connection: { remoteAddress: '127.0.0.1' }
    };
    
    const res = {
      statusCode: 200,
      headers: {},
      body: '',
      finished: false,
      
      writeHead(status, responseHeaders) {
        this.statusCode = status;
        if (responseHeaders) {
          Object.assign(this.headers, responseHeaders);
        }
      },
      
      setHeader(name, value) {
        this.headers[name] = value;
      },
      
      write(chunk) {
        this.body += chunk;
      },
      
      end(chunk) {
        if (chunk) this.body += chunk;
        this.finished = true;
      }
    };
    
    // Handle the request
    await handle(req, res);
    
    // Return API Gateway response
    return {
      statusCode: res.statusCode,
      headers: res.headers,
      body: res.body,
      isBase64Encoded: false
    };
    
  } catch (error) {
    console.error('Lambda error:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html' },
      body: `
        <!DOCTYPE html>
        <html>
          <head><title>Server Error</title></head>
          <body>
            <h1>500 - Internal Server Error</h1>
            <p>Sorry, something went wrong.</p>
            <pre>${error.message}</pre>
          </body>
        </html>
      `,
      isBase64Encoded: false
    };
  }
};
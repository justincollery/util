const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const port = process.env.PORT || 8080
const dev = false // Force production mode

console.log('Starting Next.js application...')
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: port,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION
})

const app = next({ 
  dev,
  hostname: '0.0.0.0',
  port 
})

const handle = app.getRequestHandler()

app.prepare().then(() => {
  console.log('Next.js app prepared successfully')
  
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('Internal server error')
    }
  }).listen(port, '0.0.0.0', (err) => {
    if (err) {
      console.error('Server failed to start:', err)
      throw err
    }
    console.log(`> Ready on http://0.0.0.0:${port}`)
  })
}).catch((err) => {
  console.error('Failed to start Next.js app:', err)
  process.exit(1)
})

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})
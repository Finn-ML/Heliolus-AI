// Minimal Fastify test server
import Fastify from 'fastify';

console.log('Creating Fastify server...');

const server = Fastify({
  logger: true
});

console.log('Adding routes...');

server.get('/health', async (request, reply) => {
  return { status: 'healthy', message: 'Minimal server works!' };
});

console.log('Starting server...');

const start = async () => {
  try {
    console.log('About to listen on port 3002...');
    await server.listen({ port: 3002, host: '0.0.0.0' });
    console.log('✅ Minimal server is running on http://0.0.0.0:3002');
    console.log('Health check: http://0.0.0.0:3002/health');
  } catch (err) {
    console.error('❌ Error starting server:', err);
    server.log.error(err);
    process.exit(1);
  }
};

start();
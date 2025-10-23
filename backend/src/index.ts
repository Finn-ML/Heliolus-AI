/**
 * Heliolus Platform Backend API
 * Main entry point for the application server
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
// Priority: .env.local > .env (allows local overrides)
// Load .env.local FIRST with override: true to replace Replit Secrets
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { startServer, defaultConfig } from './server';

async function main() {
  try {
    // Start the server with default configuration
    const server = await startServer(defaultConfig);
    
    // Handle process termination gracefully
    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}, shutting down gracefully...`);
      try {
        await server.close();
        console.log('Server closed successfully');
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // nodemon restart
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();

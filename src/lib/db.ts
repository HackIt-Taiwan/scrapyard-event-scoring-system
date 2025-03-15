import mongoose from 'mongoose';

// MongoDB connection string - use an environment variable in production
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hackathon-scoring';

// Set database name explicitly - can be overridden by environment variable
const DATABASE_NAME = process.env.DATABASE_NAME || 'rating';

// Global variable to maintain the connection across hot reloads in development
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      directConnection: true,
      serverSelectionTimeoutMS: 10000, // Timeout after 10 seconds
      dbName: DATABASE_NAME, // Explicitly set the database name
    };
    
    console.log('Connecting to MongoDB...');
    console.log(`URI: ${MONGODB_URI.replace(/:[^:@]*@/, ':****@')}`); // Log URI with hidden password
    console.log(`Database: ${DATABASE_NAME}`);
    
    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('MongoDB connected successfully!');
        return mongoose.connection;
      })
      .catch(err => {
        console.error('MongoDB connection error:', err);
        cached.promise = null; // Reset the promise so we can try again
        throw err; // Re-throw to let the caller handle it
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
}

export default connectToDatabase; 
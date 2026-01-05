import Fastify from 'fastify'
import mysql from '@fastify/mysql'
import userRouter from "./src/routes/user.js";

const fastify = Fastify({
  logger: true
});

// database
fastify.register(mysql, {
  connectionString: process.env.DB_URL,
  promise: true
})

fastify.register(userRouter);

fastify.get('/', (request, reply) => {
    return {
        message: 'Welcome to auth service!!!',
    }
})

const start = async () => {
    const PORT = process.env.PORT || 4000;
    try {
        // Run the server!
        await fastify.listen({ port: PORT });
        console.log(`Server listening on port ${PORT}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
    
}

start();
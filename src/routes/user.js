import {pipeline} from 'node:stream/promises'
import fs from 'node:fs'
import {authHandler} from '../../src/hooks/auth.js'
import fastifyMultipart from '@fastify/multipart'

const createUserSchema = {
    body: {
        type: "object",
        required: ['full_name', 'email', 'password'],
        properties: {
            full_name: {
                type: 'string',
            },
            email: {
                type: 'string',
            },
            password: {
                type: 'string',
            },
        }
    },
    response: {
        201: {
            type: 'object',
            properties: {
                success: {
                    type: 'boolean',
                },
                id: {
                    type: 'string',
                },
                total: {
                    type: 'string',
                },
                message: {
                    type: 'string',
                },
                data: {
                    type: 'array',
                }
            }
        }
    }
}

async function userRouter(fastify, opts) {
    fastify.register(fastifyMultipart, {
        limits: {
            fieldNameSize: 100, // Max field name size in bytes
            fieldSize: 100,     // Max field value size in bytes
            fields: 10,         // Max number of non-file fields
            fileSize: 1000000,  // For multipart forms, the max file size in bytes
            files: 1,           // Max number of file fields
            headerPairs: 2000,  // Max number of header key=>value pairs
            parts: 1000         // For multipart forms, the max number of parts (fields + files)
            }
    })
    fastify.post('/api/users', { schema: createUserSchema }, async (request, reply) => {

        const {full_name, email, password} = request.body;

        const query = `
                        INSERT INTO users (full_name, email, password)
                        VALUES (?, ?, ?)
                      `

    const [result] = await fastify.mysql.query(query, [
      full_name,
      email,
      password
    ])
        const insertedID = result?.insertId;
        
        fastify.log.info(`User created!! ${insertedID}`);
        
        reply.code(201);
        return {
            id: insertedID,
            message: "User created!!!",
        }
    })

    fastify.post('/api/upload', async (request, reply) => {
        const data = await request.file();
        await pipeline(data.file, fs.createWriteStream(`static/${data.filename}`))
        
        return {
            message: "File Uploaded !!!",
        }
    })

    fastify.get('/api/users', async (request, reply) => {

        const { email } = request.query

        let sql = 'SELECT id, full_name, email FROM users'
        const params = []

        if (email) {
            sql += ' WHERE email = ?'
            params.push(email)
        }

        const [rows] = await fastify.mysql.query(sql, params)
        
        reply.code(200);
        return {
            success: true,
            message: "Data retrieve successfully.",
            total: rows.length,
            data: rows
        }
    })

    fastify.get('/api/user/:id', {preHandler: authHandler}, async (request, reply) => {

        const { id } = request.params

        const [rows] = await fastify.mysql.query(
            'SELECT id, full_name, email FROM users WHERE id = ?',
            [id]
        )

        // user not found
        if (rows.length === 0) {
            reply.code(404)
            return {
            success: false,
            message: 'User not found'
            }
        }
        
        reply.code(200);
        return {
            success: true,
            message: "Data retrieve successfully.",
            total: rows.length,
            data: rows
        }
    })
}

export default userRouter;
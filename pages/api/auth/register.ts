// pages/api/auth/register.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { hashPassword } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { email, password, address } = req.body;

        // Hash the password
        const hashedPassword = await hashPassword(password);

        try {
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    address,
                },
            });
            res.status(201).json({ user });
        } catch (error) {
            res.status(500).json({ error: 'User creation failed' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
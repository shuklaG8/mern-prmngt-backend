import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const isObjectId = (val) => objectIdRegex.test(val);

export const createUserSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' })
      .trim()
      .min(2, { message: 'Name must be at least 2 characters' }),
    email: z.string({ required_error: 'Email is required' })
      .trim()
      .email({ message: 'Invalid email address' }),
    password: z.string({ required_error: 'Password is required' })
      .min(6, { message: 'Password must be at least 6 characters' }),
    role: z.enum(['Admin', 'User']).default('User'),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().refine(isObjectId, { message: 'Invalid User ID format' }),
  }),
  body: z.object({
    name: z.string().trim().min(2, { message: 'Name must be at least 2 characters' }).optional(),
    email: z.string().trim().email({ message: 'Invalid email address' }).optional(),
    role: z.enum(['Admin', 'User']).optional(),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }).optional(),
  }),
});

export const changeRoleSchema = z.object({
  body: z.object({
    userId: z.string({ required_error: 'User ID is required' })
      .refine(isObjectId, { message: 'Invalid User ID format' }),
    role: z.enum(['Admin', 'User'], { required_error: 'Role must be Admin or User' }),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().refine(isObjectId, { message: 'Invalid User ID format' }),
  }),
});

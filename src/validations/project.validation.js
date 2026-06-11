import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const isObjectId = (val) => objectIdRegex.test(val);

const robustPreprocessAssignedUsers = (val) => {
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return val ? [val] : [];
    }
  }
  if (val && !Array.isArray(val)) {
    return [val];
  }
  return val;
};

export const createProjectSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' })
      .trim()
      .min(3, { message: 'Title must be at least 3 characters' }),
    description: z.string({ required_error: 'Description is required' })
      .trim()
      .min(5, { message: 'Description must be at least 5 characters' }),
    startDate: z.string({ required_error: 'Start date is required' })
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start date' }),
    endDate: z.string({ required_error: 'End date is required' })
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid end date' }),
    status: z.enum(['Pending', 'In-Progress', 'Completed']).optional().default('Pending'),
    assignedUsers: z.preprocess(
      robustPreprocessAssignedUsers,
      z.array(z.string().refine(isObjectId, { message: 'Invalid Assigned User ID format' }))
    ).optional().default([]),
  }).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: 'End date must be greater than or equal to start date',
    path: ['endDate'],
  }),
});

export const updateProjectSchema = z.object({
  params: z.object({
    id: z.string().refine(isObjectId, { message: 'Invalid Project ID format' }),
  }),
  body: z.object({
    title: z.string().trim().min(3, { message: 'Title must be at least 3 characters' }).optional(),
    description: z.string().trim().min(5, { message: 'Description must be at least 5 characters' }).optional(),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start date' }).optional(),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid end date' }).optional(),
    status: z.enum(['Pending', 'In-Progress', 'Completed']).optional(),
    assignedUsers: z.preprocess(
      robustPreprocessAssignedUsers,
      z.array(z.string().refine(isObjectId, { message: 'Invalid Assigned User ID format' }))
    ).optional(),
  }).refine((data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) >= new Date(data.startDate);
    }
    return true;
  }, {
    message: 'End date must be greater than or equal to start date',
    path: ['endDate'],
  }),
});

export const updateProjectStatusSchema = z.object({
  body: z.object({
    projectId: z.string({ required_error: 'Project ID is required' })
      .refine(isObjectId, { message: 'Invalid Project ID format' }),
    status: z.enum(['Pending', 'In-Progress', 'Completed'], {
      required_error: 'Status is required and must be Pending, In-Progress, or Completed',
    }),
    doing: z.string().optional(),
    done: z.string().optional(),
    willDo: z.string().optional(),
  }),
});

export const projectIdParamSchema = z.object({
  params: z.object({
    id: z.string().refine(isObjectId, { message: 'Invalid Project ID format' }),
  }),
});

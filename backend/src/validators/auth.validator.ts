import { z } from 'zod'

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters long')

export const signupSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(100),
    email: z
      .string()
      .trim()
      .email('Enter a valid email address')
      .transform((value) => value.toLowerCase()),
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Enter a valid email address')
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1, 'Password is required'),
})

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Enter a valid email address')
    .transform((value) => value.toLowerCase()),
})

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

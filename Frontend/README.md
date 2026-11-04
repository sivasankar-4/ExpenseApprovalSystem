# Multi-Tenant Expense Approval System — Frontend

## Overview

A React-based frontend for a multi-tenant expense approval system. The application provides authenticated users with interfaces for submitting, reviewing, and managing expenses based on their roles and permissions.

The frontend communicates with a Spring Boot REST API for authentication, authorization, expense management, and approval workflows.

## Live Demo

https://expense-approval-system-frontend-roan.vercel.app/

## Backend repo link
https://github.com/sivasankar-4/multi-tenant-expense-approval-system

## Features

- User registration and login
- JWT-based authentication
- Protected routes
- Role-based access
- Expense submission and management
- Expense approval workflow
- Logout and session handling
- Responsive user interface
- Centralized API communication with Axios
- Automatic access-token handling

## Tech Stack

- React
- TypeScript
- Vite
- Axios
- React Router
- Tailwind CSS
- Zod
- Framer Motion

## Authentication Flow

The frontend communicates with the backend authentication API for:

1. User registration
2. Login
3. Access-token handling
4. Forgot password
5. OTP verification
6. Password reset
7. Logout

Protected application routes require an authenticated session.


## Future Improvements
Complete persistent refresh-token/session handling
Code splitting and bundle optimization
Additional automated frontend tests
Improved accessibility coverage

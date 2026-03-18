# Project Context

Project Name: SME-Onboard Platform  
Purpose: Optimize employee onboarding process for SMEs.

This platform is a SaaS onboarding management system that helps HR automate and manage the entire employee onboarding lifecycle.

The system manages onboarding from **pre-first day → first day → first month → evaluation stages**.

---

# Core Goals

1. Reduce manual HR work
2. Automate onboarding workflows
3. Improve new employee experience
4. Provide onboarding analytics and insights

---

# Main User Roles

### HR Admin

Responsible for managing onboarding processes.

Permissions:

- Create onboarding templates
- Assign onboarding tasks
- Manage employees
- Monitor onboarding progress
- View reports and analytics

---

### Manager

Responsible for team onboarding support.

Permissions:

- View assigned employees
- Evaluate employees
- Track onboarding progress

---

### New Employee

User going through the onboarding journey.

Permissions:

- View onboarding checklist
- Complete assigned tasks
- Access company documents
- Answer onboarding surveys
- Ask questions via chatbot

---

# Core System Modules

## 1. User Management

- Authentication
- Role-based access control
- Profile management

## 2. Onboarding Template

HR can create reusable onboarding templates.

Example:
Software Engineer Template

Checklist:

- Send welcome email
- Prepare laptop
- Create system accounts
- Assign mentor

---

## 3. Onboarding Checklist

When HR adds a new employee, the system automatically:

- Generates onboarding checklist
- Assigns tasks to HR / IT / Manager
- Tracks completion progress

---

## 4. Task Management

Each onboarding task includes:

- title
- description
- assigned department
- deadline
- completion status

---

## 5. Notification System

System automatically sends:

- Welcome emails
- Task reminders
- Deadline notifications

---

## 6. Document Library

Employees can access:

- Employee handbook
- Company policies
- Training documents
- Company culture materials

System tracks reading progress.

---

## 7. Survey & Evaluation

System automatically sends onboarding surveys:

- Day 7
- Day 30
- Day 60

Managers also evaluate employee progress.

---

## 8. AI Chatbot

AI assistant helps new employees by answering:

- company policies
- HR processes
- onboarding questions

---

## 9. Dashboard & Analytics

HR dashboard includes:

- onboarding progress
- employee satisfaction
- task completion rate

---

# Tech Stack

Frontend:

- ReactJS
- TypeScript
- TailwindCSS
- React Query

Backend:

- .NET / NodeJS REST API

Database:

- PostgreSQL

Cache:

- Redis

Deployment:

- Docker

---

# Frontend Architecture

Frontend follows a modular structure:

features/
onboarding
employees
templates
surveys
dashboard

Each feature contains:

- pages
- components
- hooks
- services
- types

---

# Coding Guidelines

Use:

- Functional React components
- Custom hooks for business logic
- Service layer for API calls
- TypeScript interfaces for models

Avoid:

- Large components
- Direct API calls inside UI components

---

# Expected Behavior for Copilot

When generating code:

- Follow the feature-based architecture
- Use TypeScript types
- Use reusable components
- Keep UI components simple
- Move logic to hooks or services

# Timetracking App

A full-stack time tracking and PTO management application with an Angular frontend, Spring Boot backend, and Strapi CMS.

## Overview

Timetracking App is a comprehensive employee time management system designed to help track work hours, manage paid time off (PTO), and filter activity logs. The application features a modern responsive interface, AI-powered chatbot assistance, and robust backend API with database support.

## Architecture

The project is organized into three main components:

- **Frontend**: Angular 17 single-page application with Material Design UI
- **Backend**: Spring Boot 4.0 RESTful API with PostgreSQL database
- **CMS**: Strapi 5.15 headless CMS for content management

## Technology Stack

### Frontend
- Angular 17.3
- TypeScript 5.4
- Angular Material 17.3 for UI components
- RxJS 7.8 for reactive programming
- OpenAI 4.11 for AI chatbot integration
- Karma and Jasmine for testing

### Backend
- Java 21
- Spring Boot 4.0
- Spring Data JPA for database operations
- Spring Validation for input validation
- PostgreSQL for production database
- H2 in-memory database for local development
- Lombok for code generation

### CMS
- Strapi 5.15
- React 18 for admin interface
- TypeScript 5
- Node.js 18-22

### Additional Services
- GCP Cloud SQL for PostgreSQL database hosting
- GitHub Pages for deployment
- GitHub Actions for CI/CD automation
- Render for backend deployment options

## Features

- Time entry tracking with date, duration, and description
- PTO (Paid Time Off) management and approval workflow
- Activity log filtering and search
- AI-powered chatbot assistance powered by OpenAI
- Dark theme support
- Responsive design for desktop and mobile
- Real-time data synchronization

## Getting Started

### Prerequisites
- Node.js 18+ and npm 6+
- Java 21 (for backend)
- PostgreSQL 15+ (for production)

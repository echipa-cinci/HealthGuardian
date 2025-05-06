# Architecture Overview

## Overview

HealthGuardian is a medical dashboard application designed to help doctors monitor patient health parameters, set alert limits, provide recommendations, and respond to health alerts. The application follows a modern full-stack architecture with a React-based frontend and an Express.js backend, using PostgreSQL for data persistence.

The system is built with a clear separation between client and server components, supporting both doctor and patient user roles with different dashboards and capabilities. It employs real-time monitoring features through WebSockets for immediate alert notifications.

## System Architecture

The application follows a client-server architecture with the following components:

### Frontend

- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: React Query for server state
- **UI Components**: Custom components using Radix UI primitives and Tailwind CSS
- **Styling**: Tailwind CSS with a customizable theme

### Backend

- **Framework**: Express.js with TypeScript
- **API**: RESTful API endpoints
- **Real-time Communication**: WebSockets (via ws library)
- **Authentication**: Session-based authentication using Passport.js with local strategy

### Database

- **DBMS**: PostgreSQL
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Schema Validation**: Zod for schema validation both on client and server

## Key Components

### Client-side Components

1. **Authentication Module**
   - Handles user login/registration
   - Session management
   - Role-based access control (doctor vs patient views)

2. **Dashboard**
   - Doctor Dashboard: Shows patient statistics, alerts, and management tools
   - Patient Dashboard: Displays personal health metrics and recommendations

3. **Patient Management**
   - Patient listing and search
   - Patient profile creation/editing
   - Health parameter monitoring

4. **Alerts System**
   - Real-time monitoring of health parameters
   - Notification of threshold violations
   - Alert management interface

5. **UI Component Library**
   - Comprehensive set of UI components built with Radix UI primitives and styled with Tailwind CSS

### Server-side Components

1. **API Routes**
   - Authentication endpoints
   - Patient management endpoints
   - Health parameter endpoints
   - Alerts endpoints
   - Recommendations endpoints

2. **Storage Layer**
   - Database interfaces for CRUD operations
   - Connection pooling
   - Query builders

3. **Authentication System**
   - Passport.js integration
   - Session management
   - Password hashing (bcrypt)

4. **WebSocket Server**
   - Real-time alerts and notifications
   - Connection management

### Database Schema

The application uses a relational database with the following key tables:

1. **users**
   - Stores user credentials and basic profile information
   - Includes role distinction (doctor/patient)

2. **patient_profiles**
   - Stores detailed patient information
   - Links to the user account and the assigned doctor

3. **parameters**
   - Stores health measurements (ECG, SpO2, temperature, pulse)
   - Timestamped entries for tracking changes over time

4. **parameter_limits**
   - Defines acceptable ranges for health parameters
   - Used for triggering alerts when values are out of range

5. **recommendations**
   - Stores doctor recommendations for patients
   - Categorized by type

6. **alerts**
   - Records health parameter violations
   - Includes status tracking (active/resolved)

## Data Flow

### Authentication Flow

1. User submits credentials via the login form
2. Server verifies credentials using Passport.js
3. On success, a session is created and stored
4. Client receives authentication confirmation and user details
5. UI renders appropriate dashboard based on user role

### Patient Monitoring Flow

1. Health parameters are recorded in the database
2. System compares parameters against defined limits
3. When parameters exceed limits, alerts are generated
4. WebSocket connections push alerts to doctor dashboards in real-time
5. Doctors can view and manage alerts through the dashboard
6. Patient dashboards display their own health parameters and any recommendations

### Doctor-Patient Interaction Flow

1. Doctors can view a list of their patients
2. Selecting a patient displays detailed health information
3. Doctors can set parameter limits for each patient
4. Doctors can add recommendations that appear on patient dashboards
5. Patients can view their health data and recommendations

## External Dependencies

### Frontend Dependencies

- **@radix-ui**: UI primitives for accessible components
- **@tanstack/react-query**: Data fetching and cache management
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Lightweight routing
- **react-hook-form**: Form handling with validation
- **zod**: Schema validation
- **recharts**: Data visualization components

### Backend Dependencies

- **express**: Web server framework
- **passport**: Authentication middleware
- **bcrypt**: Password hashing
- **drizzle-orm**: Database ORM
- **postgres**: PostgreSQL client
- **ws**: WebSockets implementation
- **zod**: Schema validation

### Development Dependencies

- **typescript**: Type checking
- **vite**: Frontend build tool
- **esbuild**: JavaScript bundler
- **tsx**: TypeScript execution environment

## Deployment Strategy

The application is configured for deployment on platforms like Replit, with the following approach:

1. **Build Process**:
   - Frontend: Vite builds optimized static assets
   - Backend: esbuild bundles server code
   - Combined build output stored in the `dist` directory

2. **Runtime Configuration**:
   - Environment variables for database connections and secrets
   - Production mode settings for optimized performance

3. **Database**:
   - Supports PostgreSQL (likely using NeonDB based on imports)
   - Database URL provided via environment variables
   - Schema migrations using Drizzle Kit

4. **Hosting**:
   - Configured for Replit deployment with autoscaling
   - Static assets served by Express from the build directory
   - Single server handles both API and static content

## Security Considerations

1. **Authentication**:
   - Password hashing using bcrypt
   - Session-based authentication
   - CSRF protection through secure cookies

2. **Data Protection**:
   - Input validation using Zod schemas
   - Parameterized queries through Drizzle ORM
   - Role-based access control

3. **Frontend Security**:
   - API responses sanitization
   - Error handling to prevent information leakage

## Performance Optimizations

1. **Frontend**:
   - React Query for efficient data fetching and caching
   - Code splitting for reduced bundle size
   - Optimized build process with Vite

2. **Backend**:
   - Connection pooling for database access
   - Response compression
   - Efficient query patterns using Drizzle ORM

3. **Database**:
   - Indexed queries for common access patterns
   - Relation-based data model for efficient joins
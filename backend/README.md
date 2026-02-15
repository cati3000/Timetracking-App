# Time Tracking Backend - Spring Boot

A Spring Boot backend application for the Time Tracking Angular application with GCP Cloud SQL PostgreSQL database support.

## Features

- ✅ **CRUD Operations** for time entries (Create, Read, Update, Delete)
- ✅ **Server-side Validation** (email format, field length constraints)
- ✅ **Global Exception Handling** with proper error messages to frontend
- ✅ **GCP Cloud SQL PostgreSQL** support with local H2 fallback
- ✅ **CORS Configuration** for Angular frontend
- ✅ **RESTful API** with consistent response format

## Tech Stack

- **Java 21**
- **Spring Boot 4.0.0**
- **Spring Data JPA**
- **PostgreSQL** (GCP Cloud SQL) or **H2** (local)
- **Lombok**
- **Bean Validation**

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/time-entries` | Create a new time entry |
| GET | `/api/time-entries` | Get all time entries |
| GET | `/api/time-entries?startDate={date}&endDate={date}` | Get entries by date range |
| GET | `/api/time-entries/{id}` | Get a specific time entry |
| PUT | `/api/time-entries/{id}` | Update a time entry |
| DELETE | `/api/time-entries/{id}` | Delete a time entry |

## Request/Response Format

### Create Time Entry (POST)
```json
{
  "data": {
    "date": "2025-12-16",
    "type": "WORK",
    "startTime": "09:00:00",
    "endTime": "17:00:00",
    "duration": 28800,
    "durationSeconds": 28800,
    "durationFormatted": "08:00:00",
    "description": "Worked on backend API",
    "statuss": "Pending",
    "email": "user@example.com"
  }
}
```

### Response Format
```json
{
  "data": {
    "id": 1,
    "date": "2025-12-16",
    "type": "WORK",
    ...
  },
  "error": null
}
```

## Setup Instructions

### Option 1: GCP Cloud SQL PostgreSQL (Recommended)

1. **Create GCP Cloud SQL PostgreSQL Instance**
   - Go to Google Cloud Console → SQL
   - Create a new PostgreSQL database
   - Choose machine type (shared-core for dev, standard for production)
   - Enable public IP and add your IP to authorized networks
   - Note down: public IP, database name, username, password

2. **Set Environment Variables**
   ```bash
   export DB_HOST=34.123.45.67
   export DB_PORT=5432
   export DB_NAME=timetracking
   export DB_USERNAME=postgres
   export DB_PASSWORD=your-database-password
   ```

3. **Run the Application**
   ```bash
   ./mvnw spring-boot:run
   ```

### Option 2: Local H2 Database (Development)

1. **Edit application.properties**
   - Comment out PostgreSQL configuration
   - Uncomment H2 configuration lines

2. **Run the Application**
   ```bash
   ./mvnw spring-boot:run
   ```

3. **Access H2 Console** (optional)
   - URL: http://localhost:8080/h2-console
   - JDBC URL: jdbc:h2:mem:timetracking
   - Username: sa
   - Password: (leave empty)

### Option 3: Local PostgreSQL

1. **Install PostgreSQL**

2. **Create Database**
   ```sql
   CREATE DATABASE timetracking;
   ```

3. **Set Environment Variables**
   ```bash
   export DB_HOST=localhost
   export DB_PORT=5432
   export DB_NAME=timetracking
   export DB_USERNAME=postgres
   export DB_PASSWORD=postgres
   ```

4. **Run the Application**
   ```bash
   ./mvnw spring-boot:run
   ```

## Validation Rules

The backend enforces the following validation rules:

- **Date**: Required, must be in YYYY-MM-DD format
- **Type**: Required, must be either "WORK" or "PTO"
- **Duration**: Required, must be non-negative integer
- **Email**: Optional, must be valid email format if provided (max 100 chars)
- **Start/End Time**: Optional, max 20 characters
- **Description**: Optional, max 500 characters
- **Status**: Optional, max 50 characters
- **Duration Formatted**: Optional, max 50 characters

## Building for Production

```bash
# Build JAR file
./mvnw clean package

# Run the JAR
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

## GCP Deployment

### Deploy Backend to Google Cloud Run

1. **Build the JAR:**
   ```bash
   cd backend
   ./mvnw clean package
   ```

2. **Create Dockerfile:**
   ```dockerfile
   FROM eclipse-temurin:21-jre
   COPY target/backend-0.0.1-SNAPSHOT.jar app.jar
   ENTRYPOINT ["java","-jar","/app.jar"]
   ```

3. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy timetracking-backend \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars DB_HOST=34.123.45.67,DB_PORT=5432,DB_NAME=timetracking,DB_USERNAME=postgres,DB_PASSWORD=your-password
   ```

4. **Update Frontend API_BASE:**
   ```typescript
   export const API_BASE = 'https://timetracking-backend-xxxxx-uc.a.run.app';
   ```

### Deploy to Google Compute Engine (VM)

1. **Create VM Instance**
   - Go to Compute Engine → VM Instances
   - Create new instance with Java 21

2. **Install Java:**
   ```bash
   sudo apt-get update
   sudo apt-get install -y openjdk-21-jdk
   ```

3. **Upload JAR file** via SCP or Cloud Storage

4. **Run application:**
   ```bash
   export DB_HOST=34.123.45.67
   export DB_PORT=5432
   export DB_NAME=timetracking
   export DB_USERNAME=postgres
   export DB_PASSWORD=your-password
   
   nohup java -jar backend-0.0.1-SNAPSHOT.jar > app.log 2>&1 &
   ```

5. **Configure Firewall:** Allow ingress on port 8080

## Testing the API

### Using curl:

```bash
# Create entry
curl -X POST http://localhost:8080/api/time-entries \
  -H "Content-Type: application/json" \
  -d '{"data":{"date":"2025-12-16","type":"WORK","duration":3600,"description":"Testing"}}'

# Get all entries
curl http://localhost:8080/api/time-entries

# Get entry by ID
curl http://localhost:8080/api/time-entries/1

# Update entry
curl -X PUT http://localhost:8080/api/time-entries/1 \
  -H "Content-Type: application/json" \
  -d '{"data":{"date":"2025-12-16","type":"WORK","duration":7200,"description":"Updated"}}'

# Delete entry
curl -X DELETE http://localhost:8080/api/time-entries/1
```

## Project Structure

```
backend/
├── src/main/java/com/example/backend/
│   ├── BackendApplication.java          # Main application class
│   ├── controller/
│   │   └── TimeEntryController.java     # REST endpoints
│   ├── service/
│   │   └── TimeEntryService.java        # Business logic & validation
│   ├── repository/
│   │   └── TimeEntryRepository.java     # Database access
│   ├── entity/
│   │   └── TimeEntry.java               # JPA entity
│   ├── dto/
│   │   ├── TimeEntryDTO.java            # Request DTO
│   │   ├── TimeEntryResponse.java       # Response DTO
│   │   ├── ApiResponse.java             # API wrapper
│   │   └── ErrorDetails.java            # Error response
│   ├── exception/
│   │   ├── GlobalExceptionHandler.java  # Exception handling
│   │   ├── ResourceNotFoundException.java
│   │   └── ValidationException.java
│   └── config/
│       └── WebConfig.java               # CORS configuration
└── src/main/resources/
    └── application.properties            # Configuration
```

## Troubleshooting

### Connection Issues
- Verify Cloud SQL authorized networks allow your IP on port 5432
- Check if environment variables are set correctly
- Ensure Cloud SQL instance is publicly accessible (if connecting from outside GCP)
- Consider using Cloud SQL Proxy for more secure connection

### Validation Errors
- Check request body format matches the expected structure
- Ensure all required fields are present
- Verify date format is YYYY-MM-DD

### CORS Errors
- Update allowed origins in WebConfig.java
- Ensure Angular app is running on an allowed origin

## License

MIT

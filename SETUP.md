# Setup Instructions for Time Tracking Application

## Backend Setup

### Prerequisites
- Java 21 or higher
- Maven
- PostgreSQL (optional for local) or GCP Cloud SQL account

### Quick Start - Option 1: H2 In-Memory Database (Easiest)

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Edit `src/main/resources/application.properties` and uncomment the H2 configuration:
   ```properties
   # Comment out PostgreSQL lines
   # Uncomment these:
   spring.datasource.url=jdbc:h2:mem:timetracking
   spring.datasource.driver-class-name=org.h2.Driver
   spring.datasource.username=sa
   spring.datasource.password=
   spring.h2.console.enabled=true
   spring.h2.console.path=/h2-console
   ```

3. Run the application:
   ```bash
   ./mvnw spring-boot:run
   ```
   (On Windows: `mvnw.cmd spring-boot:run`)

4. Backend will start on: http://localhost:8080

5. Access H2 Console (optional): http://localhost:8080/h2-console

### Quick Start - Option 2: Local PostgreSQL

1. Install and start PostgreSQL

2. Create database:
   ```sql
   CREATE DATABASE timetracking;
   ```

3. Set environment variables:
   ```bash
   # Linux/Mac
   export DB_HOST=localhost
   export DB_PORT=5432
   export DB_NAME=timetracking
   export DB_USERNAME=postgres
   export DB_PASSWORD=postgres

   # Windows PowerShell
   $env:DB_HOST="localhost"
   $env:DB_PORT="5432"
   $env:DB_NAME="timetracking"
   $env:DB_USERNAME="postgres"
   $env:DB_PASSWORD="postgres"
   ```

4. Run the application:
   ```bash
   ./mvnw spring-boot:run
   ```

### Quick Start - Option 3: GCP Cloud SQL (Production)

1. **Create GCP Cloud SQL PostgreSQL Instance:**
   - Go to Google Cloud Console → SQL
   - Click "Create Instance"
   - Choose PostgreSQL
   - Configure machine type (shared-core for dev, standard for prod)
   - Enable public IP
   - Add authorized networks (your IP)
   - Note the public IP address after creation

2. **Configure Authorized Networks:**
   - Go to your instance → Connections tab
   - Add network with your IP address
   - Or use 0.0.0.0/0 for development (not recommended for production)

3. **Create database:**
   - Go to Databases tab
   - Click "Create database"
   - Name: timetracking

4. **Set environment variables with your Cloud SQL details:**
   ```bash
   export DB_HOST=34.123.45.67
   export DB_PORT=5432
   export DB_NAME=timetracking
   export DB_USERNAME=postgres
   export DB_PASSWORD=your-database-password
   ```

5. Run the application:
   ```bash
   ./mvnw spring-boot:run
   ```

## Frontend Setup

### Update API Base URL

Update `techTreck/src/api-base.ts` to point to your local backend:

```typescript
// For local development
export const API_BASE = 'http://localhost:8080';

// For production (your deployed backend)
// export const API_BASE = 'https://your-backend-url.com';
```

### Run Angular App

```bash
cd techTreck
npm install
ng serve
```

Access at: http://localhost:4200

## Testing the Backend

### Option 1: PowerShell Test Script
```powershell
cd backend
.\test-api.ps1
```

### Option 2: Manual cURL Tests

**Create Entry:**
```bash
curl -X POST http://localhost:8080/api/time-entries \
  -H "Content-Type: application/json" \
  -d '{"data":{"date":"2025-12-16","type":"WORK","duration":3600,"description":"Testing"}}'
```

**Get All Entries:**
```bash
curl http://localhost:8080/api/time-entries
```

**Get by ID:**
```bash
curl http://localhost:8080/api/time-entries/1
```

**Update Entry:**
```bash
curl -X PUT http://localhost:8080/api/time-entries/1 \
  -H "Content-Type: application/json" \
  -d '{"data":{"date":"2025-12-16","type":"WORK","duration":7200}}'
```

**Delete Entry:**
```bash
curl -X DELETE http://localhost:8080/api/time-entries/1
```

### Option 3: Using Postman or Insomnia

Import these endpoints into Postman:
- Base URL: `http://localhost:8080`
- All requests require `Content-Type: application/json` header
- Body format: `{ "data": { ...fields... } }`

## Deployment to GCP

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

### Alternative: Deploy to Compute Engine (VM)

1. **Create VM Instance** in Compute Engine

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

## Troubleshooting

### Backend won't start
- Check Java version: `java -version` (should be 21+)
- Check if port 8080 is already in use
- Verify database connection settings
- Check logs for specific errors

### Frontend can't connect to backend
- Verify backend is running: `curl http://localhost:8080/api/time-entries`
- Check CORS configuration in `WebConfig.java`
- Ensure API_BASE in Angular matches backend URL
- Check browser console for errors

### Database connection errors
- Verify PostgreSQL is running or Cloud SQL instance is active
- Check credentials are correct
- For Cloud SQL: ensure authorized networks include your IP
- Test connection: `psql -h DB_HOST -U DB_USERNAME -d DB_NAME`

### Validation errors
- Check request body format matches API documentation
- Ensure all required fields are present
- Verify date format is YYYY-MM-DD
- Check email format is valid

## Project Structure

```
projecte/
├── backend/                    # Spring Boot Backend
│   ├── src/
│   │   └── main/
│   │       ├── java/com/example/backend/
│   │       │   ├── controller/         # REST APIs
│   │       │   ├── service/            # Business logic
│   │       │   ├── repository/         # Database access
│   │       │   ├── entity/             # JPA entities
│   │       │   ├── dto/                # Data transfer objects
│   │       │   ├── exception/          # Error handling
│   │       │   └── config/             # Configuration
│   │       └── resources/
│   │           └── application.properties
│   ├── pom.xml                 # Maven dependencies
│   ├── README.md              # Detailed backend docs
│   └── test-api.ps1           # Test script
└── techTreck/                 # Angular Frontend
    └── src/
        ├── api-base.ts        # API configuration
        └── app/
            ├── time-tracking/
            └── log-api.service.ts
```

## Next Steps

1. ✅ Backend is complete with all CRUD operations
2. ✅ Server-side validation implemented
3. ✅ Exception handling configured
4. ✅ GCP Cloud SQL support ready
5. ✅ Frontend reorganized with clean architecture
6. ✅ CMS and learning resources properly structured
7. ⏭️ Update Angular API_BASE to your backend URL
8. ⏭️ Test all operations
9. ⏭️ Deploy to GCP (Cloud Run, Compute Engine, or GKE)
10. ⏭️ Configure production environment variables

Good luck with your deployment! 🚀

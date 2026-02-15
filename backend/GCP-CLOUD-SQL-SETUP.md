# GCP Cloud SQL Setup Guide

## Step-by-Step Guide to Create PostgreSQL Cloud SQL Instance

### 1. Create Cloud SQL Database

1. **Log in to Google Cloud Console**
   - Go to https://console.cloud.google.com/
   - Navigate to SQL (Cloud SQL) service
   - Or search for "SQL" in the search bar

2. **Create Instance**
   - Click "Create Instance"
   - Choose "PostgreSQL"
   - Choose PostgreSQL version: PostgreSQL 15 or 16 (latest stable)

3. **Instance Info**
   - Instance ID: `timetracking-db` (or your choice)
   - Password: Create a strong password for postgres user
   - Choose region and zone:
     - Region: Choose closest to your users (e.g., us-central1, europe-west1)
     - Zone: Single zone (for dev) or Multiple zones (for production HA)

4. **Configuration Options**
   
   **For Development (Free tier eligible with $300 credit):**
   - Machine type: Lightweight or Shared core
   - Storage: 10 GB SSD (can autoscale)
   - Edition: Enterprise (recommended)
   
   **For Production:**
   - Machine type: Standard or High memory
   - Storage: 20+ GB SSD with autoscaling
   - Edition: Enterprise
   - High availability: Enable for production

5. **Connections**
   - **Public IP**: Enable (for external access)
   - **Private IP**: Optional (for VPC access)
   - **Authorized networks**: Add your IP address
     - Click "Add network"
     - Name: "My Development IP"
     - Network: Your public IP (find at https://whatismyip.com)
   - **SSL mode**: Optional (recommended for production)

6. **Data Protection**
   - Automated backups: Enable
   - Backup window: Choose preferred time
   - Point-in-time recovery: Enable (recommended)
   - Retention: 7-365 days

7. **Maintenance**
   - Maintenance window: Choose preferred day/time
   - Order of updates: Any available window

8. **Flags** (Advanced)
   - Leave default or customize as needed

9. **Labels** (Optional)
   - Add labels for organization (e.g., env:development, app:timetracking)

10. **Click "Create Instance"**
    - Wait 5-10 minutes for creation

### 2. Configure Authorized Networks (Firewall)

1. **Go to SQL → Instances**
   - Click your database instance
   - Go to "Connections" tab

2. **Add Authorized Networks**
   - Under "Public IP" section
   - Click "Add network"
   - For each IP/network to allow:
     - Name: Descriptive name (e.g., "Office", "Home")
     - Network: IP address or CIDR range
       - **For development**: Your IP or 0.0.0.0/0 (anywhere - not recommended)
       - **For production**: Specific IP ranges or Cloud Run/GKE CIDR
   - Save changes

3. **Alternative: Cloud SQL Proxy** (More secure)
   - Download Cloud SQL Proxy
   - Connect without exposing public IP
   - See section below for setup

### 3. Create Database

1. **Go to SQL → Instances**
   - Click your database instance
   - Go to "Databases" tab
   - Click "Create database"
   - Database name: `timetracking`
   - Character set: UTF8 (default)
   - Collation: Default
   - Click "Create"

### 4. Get Connection Details

1. **Go to SQL → Instances**
   - Click your database instance
   - Note the following:
     - **Public IP address**: something like `34.123.45.67`
     - **Connection name**: `project-id:region:instance-name`
     - **Port**: 5432 (default PostgreSQL port)

2. **Save these credentials:**
   ```
   DB_HOST=34.123.45.67
   DB_PORT=5432
   DB_NAME=timetracking
   DB_USERNAME=postgres
   DB_PASSWORD=your-database-password
   ```

### 5. Test Connection

**Using psql (command line):**
```bash
psql -h 34.123.45.67 \
     -U postgres \
     -d timetracking \
     -p 5432
```

**Using pgAdmin or DBeaver:**
- Host: Your Cloud SQL public IP
- Port: 5432
- Database: timetracking
- Username: postgres
- Password: Your database password

**Using Cloud SQL Proxy (Recommended for production):**
```bash
# Download Cloud SQL Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy

# Start proxy
./cloud-sql-proxy project-id:region:instance-name

# Connect via localhost
psql -h 127.0.0.1 -U postgres -d timetracking
```

### 6. Configure Spring Boot Application

**Option A: Direct Connection with Public IP (Simple)**

```bash
# Linux/Mac
export DB_HOST=34.123.45.67
export DB_PORT=5432
export DB_NAME=timetracking
export DB_USERNAME=postgres
export DB_PASSWORD=your-password

# Windows PowerShell
$env:DB_HOST="34.123.45.67"
$env:DB_PORT="5432"
$env:DB_NAME="timetracking"
$env:DB_USERNAME="postgres"
$env:DB_PASSWORD="your-password"
```

**Option B: Cloud SQL Proxy (More Secure)**

1. Start Cloud SQL Proxy:
```bash
./cloud-sql-proxy --port 5432 project-id:region:instance-name
```

2. Connect via localhost:
```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=timetracking
export DB_USERNAME=postgres
export DB_PASSWORD=your-password
```

**Option C: Create .env file (for local development)**

Create `backend/.env`:
```properties
DB_HOST=34.123.45.67
DB_PORT=5432
DB_NAME=timetracking
DB_USERNAME=postgres
DB_PASSWORD=your-password
```

⚠️ **Important**: Never commit `.env` file to Git!

### 7. Run Your Application

```bash
cd backend
./mvnw spring-boot:run
```

Check logs for successful connection:
```
HikariPool-1 - Starting...
HikariPool-1 - Start completed.
```

## Cost Estimation

### GCP Free Trial
- **$300 credit** for 90 days for new customers
- Can be used for any GCP services including Cloud SQL

### Cloud SQL Pricing (us-central1)

**Shared-core instance** (Development):
- db-f1-micro (0.6 GB RAM): ~$7-10/month
- Storage (10 GB): ~$1.70/month
- Backup (10 GB): ~$0.80/month
- **Total**: ~$10-12/month

**Dedicated CPU instances** (Production):
- db-n1-standard-1 (3.75 GB RAM, 1 vCPU): ~$50/month
- db-n1-standard-2 (7.5 GB RAM, 2 vCPUs): ~$100/month
- Storage (100 GB): ~$17/month
- Backup (100 GB): ~$8/month
- **Total**: ~$75-125/month

**High Availability** (Production):
- Adds ~2x the cost for instance
- Recommended for critical applications

## Production Best Practices

### 1. Security
- ✅ Use Private IP with VPC peering
- ✅ Restrict authorized networks to specific IPs
- ✅ Enable SSL/TLS connections
- ✅ Use Secret Manager for credentials
- ✅ Enable Cloud SQL IAM authentication
- ✅ Enable audit logging
- ✅ Regularly rotate passwords

### 2. High Availability
- ✅ Enable High Availability (HA) configuration
- ✅ Set up read replicas for read-heavy workloads
- ✅ Enable automated backups
- ✅ Configure backup retention (7-365 days)
- ✅ Enable point-in-time recovery

### 3. Performance
- ✅ Choose appropriate machine type
- ✅ Enable Query Insights
- ✅ Set up monitoring and alerting
- ✅ Configure connection pooling (HikariCP settings)
- ✅ Use SSD storage for better performance

### 4. Monitoring
```properties
# Spring Boot application.properties
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000
```

## Troubleshooting

### Cannot connect to Cloud SQL
1. ✅ Check authorized networks allow your IP on port 5432
2. ✅ Verify public IP is enabled (for external access)
3. ✅ Check firewall rules
4. ✅ Verify credentials are correct
5. ✅ Check if Cloud SQL instance is "Running" status
6. ✅ Ensure database exists (check Databases tab)

### Timeout errors
1. ✅ Check authorized networks configuration
2. ✅ Verify network connectivity
3. ✅ Try using Cloud SQL Proxy
4. ✅ Increase connection timeout in Spring Boot

### Authentication failed
1. ✅ Verify username and password
2. ✅ Check database name is correct (case-sensitive)
3. ✅ Ensure postgres user has proper permissions
4. ✅ Try resetting the postgres user password

### High costs
1. ✅ Use shared-core (f1-micro) for development
2. ✅ Delete unused Cloud SQL instances
3. ✅ Reduce backup retention period
4. ✅ Use committed use discounts for production (save up to 57%)
5. ✅ Stop instances when not in use (development only)

## Connecting from Different Environments

### From Local Development
```properties
# Direct connection with public IP
spring.datasource.url=jdbc:postgresql://34.123.45.67:5432/timetracking

# Or via Cloud SQL Proxy
spring.datasource.url=jdbc:postgresql://localhost:5432/timetracking
```

### From Google Cloud Run
- Use Unix socket connection
- Add Cloud SQL connection name in service configuration
- No need for passwords with IAM authentication

### From Google Kubernetes Engine (GKE)
- Use Cloud SQL Proxy sidecar container
- Configure workload identity
- Use private IP for better performance

### From Compute Engine (VM)
- Use Cloud SQL Proxy
- Or connect via private IP if in same VPC
- Configure service account with Cloud SQL Client role

### From App Engine
```yaml
# app.yaml
env_variables:
  DB_HOST: "/cloudsql/project-id:region:instance-name"
  DB_USER: "postgres"
  DB_PASS: "your-password"
  DB_NAME: "timetracking"
```

### From Docker
```yaml
environment:
  - DB_HOST=34.123.45.67
  - DB_PORT=5432
  - DB_NAME=timetracking
  - DB_USERNAME=postgres
  - DB_PASSWORD=secret
```

## Cloud SQL Proxy Setup (Recommended for Production)

### Install Cloud SQL Proxy

**Linux:**
```bash
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy
sudo mv cloud-sql-proxy /usr/local/bin/
```

**macOS:**
```bash
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.amd64
chmod +x cloud-sql-proxy
sudo mv cloud-sql-proxy /usr/local/bin/
```

**Windows:**
```powershell
Invoke-WebRequest -Uri "https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.x64.exe" -OutFile "cloud-sql-proxy.exe"
```

### Run Cloud SQL Proxy

```bash
# Using connection name
cloud-sql-proxy --port 5432 PROJECT-ID:REGION:INSTANCE-NAME

# With credentials file
cloud-sql-proxy --port 5432 --credentials-file=/path/to/key.json PROJECT-ID:REGION:INSTANCE-NAME

# Multiple instances
cloud-sql-proxy PROJECT-ID:REGION:INSTANCE1 PROJECT-ID:REGION:INSTANCE2
```

### Configure Application for Proxy
```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=timetracking
export DB_USERNAME=postgres
export DB_PASSWORD=your-password
```

## Database Migrations

For production, consider using Flyway or Liquibase for database versioning:

**Add to pom.xml:**
```xml
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
```

**Configure in application.properties:**
```properties
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration
spring.jpa.hibernate.ddl-auto=validate
```

## Backup and Recovery

### Automatic Backups
- Enabled by default
- Daily backups during backup window
- Configurable retention (1-365 days)
- Point-in-time recovery available

### Manual Backup (On-Demand)
1. Go to SQL → Instances
2. Click your database instance
3. Click "Create backup" or go to "Backups" tab
4. Click "Create backup"
5. Enter backup description
6. Click "Create"

### Restore from Backup
1. Go to SQL → Instances
2. Click your database instance
3. Go to "Backups" tab
4. Select backup
5. Click "Restore"
6. Choose:
   - Restore to same instance (overwrites data)
   - Restore to new instance (creates clone)
7. Confirm restore

### Point-in-Time Recovery
1. Go to SQL → Instances
2. Click your database instance  
3. Click "Create clone" or use gcloud command:
```bash
gcloud sql backups restore BACKUP_ID \
  --backup-instance=SOURCE_INSTANCE \
  --backup-project=PROJECT_ID \
  --restore-instance=TARGET_INSTANCE
```

### Export Database (Manual Backup)
```bash
# Using Cloud SQL export
gcloud sql export sql INSTANCE_NAME gs://BUCKET_NAME/backup.sql \
  --database=timetracking

# Or using pg_dump via proxy
pg_dump -h localhost -U postgres timetracking > backup.sql
```

## Next Steps

1. ✅ Create Cloud SQL instance
2. ✅ Configure authorized networks
3. ✅ Create database
4. ✅ Test connection
5. ✅ Update Spring Boot configuration
6. ✅ Run application locally with Cloud SQL
7. ✅ Deploy to production (Cloud Run, GKE, or Compute Engine)
8. ✅ Set up monitoring and alerts

Need help? Check GCP Cloud SQL documentation: https://cloud.google.com/sql/docs

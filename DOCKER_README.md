# HerFoodCode Docker Containerization

This document describes the complete containerization setup for the HerFoodCode application, including the FastAPI backend with RAG model integration and the Next.js frontend.

## 🏗️ Architecture

The application is containerized using Docker Compose with the following services:

- **Backend**: FastAPI application with RAG model integration
- **Frontend**: Next.js application
- **Network**: Custom bridge network for service communication

## 📁 File Structure

```
hfc_app/
├── backend/
│   ├── Dockerfile              # Multi-stage backend container
│   ├── docker-compose.yml      # Backend-only compose (for development)
│   ├── .dockerignore          # Backend build exclusions
│   ├── env.example            # Environment variables template
│   └── ...
├── frontend/pcos-advice-app/
│   ├── Dockerfile              # Multi-stage frontend container
│   ├── .dockerignore          # Frontend build exclusions
│   └── ...
├── data/
│   ├── vectorstore/           # RAG model data (mounted as volume)
│   ├── processed/             # Processed data (mounted as volume)
│   └── ...
├── docker-compose.yml         # Production compose file
├── deploy.sh                  # Deployment script
└── DOCKER_README.md          # This file
```

## 🚀 Quick Start

### Prerequisites

1. **Docker & Docker Compose**: Install Docker Desktop or Docker Engine
2. **Environment Variables**: Set up your API keys and configuration

### 1. Environment Setup

Create the backend environment file:

```bash
cp backend/env.example backend/.env
```

Edit `backend/.env` with your configuration:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Security
SECRET_KEY=your_secret_key_here_change_in_production

# Database Configuration
DATABASE_URL=sqlite:///./users.db

# Environment
ENVIRONMENT=production

# Logging
LOG_LEVEL=INFO

# CORS Settings (comma-separated list of allowed origins)
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### 2. Deploy the Application

Use the deployment script:

```bash
./deploy.sh
```

Or manually with Docker Compose:

```bash
# Build and start all services
docker-compose up --build -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 🔧 Configuration

### Backend Configuration

The backend service includes:

- **Multi-stage build**: Optimized for production
- **Non-root user**: Security best practices
- **Health checks**: Container orchestration support
- **Volume mounts**: Persistent data storage
- **Environment variables**: Flexible configuration

### Frontend Configuration

The frontend service includes:

- **Standalone output**: Optimized for containerization
- **Multi-stage build**: Reduced image size
- **Non-root user**: Security best practices
- **Environment variables**: API endpoint configuration

### Volume Mounts

The following volumes are mounted for data persistence:

```yaml
volumes:
  # Backend data
  - ./backend/data:/app/data
  # RAG model vectorstore
  - ./data/vectorstore:/app/data/vectorstore
  # Processed data
  - ./data/processed:/app/data/processed
```

## 🛠️ Development

### Backend Development

For backend-only development:

```bash
cd backend
docker-compose up --build
```

### Frontend Development

For frontend-only development:

```bash
cd frontend/pcos-advice-app
npm run dev
```

### Full Stack Development

```bash
# Start all services
docker-compose up --build

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart specific service
docker-compose restart backend
```

## 📊 Monitoring & Health Checks

### Health Endpoints

- **Backend Health**: `GET /health`
- **Frontend**: Root endpoint response

### Health Check Configuration

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Logging

View application logs:

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Follow logs with timestamps
docker-compose logs -f -t
```

## 🔒 Security Considerations

### Environment Variables

- Never commit `.env` files to version control
- Use strong, unique `SECRET_KEY` values
- Rotate API keys regularly
- Use environment-specific configurations

### Container Security

- Non-root users in containers
- Minimal base images
- Regular security updates
- Network isolation

### CORS Configuration

Configure allowed origins in `backend/.env`:

```env
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

## 🚀 Production Deployment

### Environment Variables

For production, ensure all environment variables are properly set:

```env
OPENAI_API_KEY=your_production_openai_key
SECRET_KEY=your_strong_secret_key
ENVIRONMENT=production
ALLOWED_ORIGINS=https://yourdomain.com
```

### Database Configuration

For production, consider using a proper database:

```env
DATABASE_URL=postgresql://user:password@host:port/database
```

### Reverse Proxy

Use a reverse proxy (nginx, traefik) for:

- SSL termination
- Load balancing
- Rate limiting
- Static file serving

### Monitoring

Implement monitoring for:

- Container health
- Application metrics
- Error tracking
- Performance monitoring

## 🐛 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check if ports are in use
   lsof -i :3000
   lsof -i :8000
   ```

2. **Permission Issues**
   ```bash
   # Fix volume permissions
   sudo chown -R $USER:$USER data/
   ```

3. **Build Failures**
   ```bash
   # Clean build cache
   docker-compose build --no-cache
   ```

4. **Service Not Starting**
   ```bash
   # Check logs
   docker-compose logs backend
   docker-compose logs frontend
   ```

### Debug Commands

```bash
# Enter container shell
docker-compose exec backend bash
docker-compose exec frontend sh

# Check container status
docker-compose ps

# View resource usage
docker stats

# Clean up
docker-compose down --volumes --remove-orphans
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [ChromaDB Documentation](https://docs.trychroma.com/)

## 🤝 Contributing

When contributing to the containerized setup:

1. Test changes locally
2. Update documentation
3. Follow security best practices
4. Maintain backward compatibility
5. Update environment templates 
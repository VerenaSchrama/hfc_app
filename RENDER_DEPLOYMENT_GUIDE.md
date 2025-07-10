# HerFoodCode Complete Render Deployment Guide

## 🎯 Overview

This guide covers deploying your entire HerFoodCode application to Render:
- **Backend**: FastAPI + RAG Model (Render Web Service)
- **Frontend**: Next.js (Render Static Site or Vercel)
- **Data**: Vectorstore persistence and environment configuration

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   External      │
│   (Next.js)     │◄──►│  (FastAPI)      │◄──►│   (OpenAI)      │
│                 │    │                 │    │                 │
│ • Vercel        │    │ • Render        │    │ • GPT-4 API     │
│ • Static Site   │    │ • Web Service   │    │ • Embeddings    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Data Storage  │
                       │                 │
                       │ • Vectorstore   │
                       │ • SQLite DB     │
                       │ • Processed     │
                       └─────────────────┘
```

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Repository

Ensure your GitHub repository has the correct structure:
```
hfc_app/
├── backend/
│   ├── Dockerfile              ✅ Ready
│   ├── requirements.txt        ✅ Ready
│   ├── main.py                 ✅ Ready
│   ├── rag_pipeline.py         ✅ Ready
│   └── data/
│       └── strategies.csv      ✅ Ready
├── frontend/pcos-advice-app/
│   ├── package.json            ✅ Ready
│   ├── next.config.ts          ✅ Ready
│   └── src/                    ✅ Ready
├── data/
│   ├── vectorstore/            ✅ 20MB+ data
│   └── processed/              ✅ Ready
└── docker-compose.yml          ✅ Ready
```

### Step 2: Deploy Backend to Render

#### 2.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub account
3. Verify email address

#### 2.2 Create Web Service
1. **Dashboard** → **New** → **Web Service**
2. **Connect Repository**: Select your GitHub repo
3. **Configure Service**:
   ```
   Name: hfc-backend
   Environment: Docker
   Region: Choose closest to your users
   Branch: main (or your default branch)
   Root Directory: backend/
   ```

#### 2.3 Configure Build Settings
```yaml
Build Command: (auto-detected from Dockerfile)
Start Command: (auto-detected from Dockerfile)
```

#### 2.4 Set Environment Variables
In Render dashboard → **Environment** tab:

**Required Variables**:
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
SECRET_KEY=your-very-secure-secret-key-here
```

**Production Variables**:
```env
ENVIRONMENT=production
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
LOG_LEVEL=INFO
```

**Optional Variables**:
```env
DATABASE_URL=sqlite:///./users.db
```

#### 2.5 Configure Persistent Disk
1. **Settings** → **Disks**
2. **Add Disk**:
   ```
   Name: vectorstore-data
   Mount Path: /app/data/vectorstore
   Size: 1GB (free tier) or larger for production
   ```

3. **Add Second Disk**:
   ```
   Name: processed-data
   Mount Path: /app/data/processed
   Size: 1GB
   ```

#### 2.6 Deploy Backend
1. **Create Web Service**
2. Render will automatically:
   - Build your Docker image
   - Deploy to their infrastructure
   - Provide a URL like: `https://hfc-backend.onrender.com`

#### 2.7 Verify Backend Deployment
```bash
# Test health endpoint
curl https://hfc-backend.onrender.com/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-01-07T..."
}
```

### Step 3: Deploy Frontend

#### Option A: Vercel (Recommended for Next.js)

**3.1 Create Vercel Account**
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub account

**3.2 Import Project**
1. **New Project** → **Import Git Repository**
2. Select your repository
3. **Configure Project**:
   ```
   Framework Preset: Next.js
   Root Directory: frontend/pcos-advice-app/
   Build Command: npm run build
   Output Directory: .next
   ```

**3.3 Set Environment Variables**
```env
NEXT_PUBLIC_API_URL=https://hfc-backend.onrender.com
NODE_ENV=production
```

**3.4 Deploy**
- Vercel will automatically build and deploy
- URL: `https://your-app.vercel.app`

#### Option B: Render Static Site (Alternative)

**3.1 Create Static Site**
1. **New** → **Static Site**
2. **Configure**:
   ```
   Name: hfc-frontend
   Build Command: cd frontend/pcos-advice-app && npm install && npm run build
   Publish Directory: frontend/pcos-advice-app/out
   ```

**3.2 Set Environment Variables**
```env
NEXT_PUBLIC_API_URL=https://hfc-backend.onrender.com
```

### Step 4: Configure Data Persistence

#### 4.1 Vectorstore Data Setup
Your RAG model data needs to be available in the container:

**Option A: Include in Repository** (Recommended for small data)
1. Ensure `data/vectorstore/` is in your repo
2. Render will copy it during build

**Option B: Upload to Persistent Disk**
1. After deployment, use Render's file upload feature
2. Upload vectorstore files to the mounted disk

#### 4.2 Database Setup
- SQLite file will be stored in persistent disk
- No additional configuration needed

### Step 5: Update CORS Configuration

#### 5.1 Backend CORS Update
In Render dashboard → **Environment Variables**:
```env
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app,https://yourdomain.com
```

#### 5.2 Redeploy Backend
- Render will automatically redeploy when environment variables change

### Step 6: Test Complete Application

#### 6.1 Health Checks
```bash
# Backend health
curl https://hfc-backend.onrender.com/health

# Frontend accessibility
curl https://your-frontend-domain.vercel.app
```

#### 6.2 Feature Testing
1. **Frontend**: Visit your Vercel URL
2. **Intake Flow**: Complete user intake
3. **RAG Model**: Test strategy recommendations
4. **Chat Interface**: Test advice generation
5. **User Registration**: Test account creation
6. **Data Persistence**: Verify logs and data storage

## 🔧 Render-Specific Configuration

### Backend Service Configuration
```yaml
# Render automatically detects from your Dockerfile
Service Type: Web Service
Environment: Docker
Build Command: (auto-detected)
Start Command: (auto-detected)
Health Check Path: /health
```

### Resource Allocation
**Free Tier**:
- 512MB RAM
- Shared CPU
- 750 hours/month
- 1GB persistent disk

**Paid Plans** (when you scale):
- 1GB+ RAM
- Dedicated CPU
- Unlimited hours
- Larger persistent disks

### Environment Variables Management
```bash
# Render Dashboard → Environment tab
OPENAI_API_KEY=sk-...          # Required
SECRET_KEY=your-secret-key     # Required
ALLOWED_ORIGINS=https://...    # Production
ENVIRONMENT=production         # Production
LOG_LEVEL=INFO                # Optional
```

## 📊 Monitoring & Logs

### Render Dashboard Monitoring
1. **Logs**: Real-time application logs
2. **Metrics**: CPU, memory, request count
3. **Health**: Automatic health check monitoring
4. **Deployments**: Build and deployment history

### Health Check Monitoring
```bash
# Manual health check
curl https://hfc-backend.onrender.com/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2025-01-07T10:30:00Z"
}
```

### Log Monitoring
- **Backend Logs**: Render Dashboard → Logs tab
- **Build Logs**: Render Dashboard → Deployments tab
- **Error Tracking**: Monitor for RAG model errors

## 🐛 Troubleshooting

### Common Issues

#### 1. Build Failures
**Symptoms**: Deployment fails during build
**Solutions**:
- Check Dockerfile syntax
- Verify requirements.txt
- Check build logs in Render dashboard

#### 2. RAG Model Not Working
**Symptoms**: Strategy recommendations fail
**Solutions**:
- Verify vectorstore data is in persistent disk
- Check OPENAI_API_KEY is set
- Monitor logs for vectorstore loading errors

#### 3. CORS Errors
**Symptoms**: Frontend can't connect to backend
**Solutions**:
- Update ALLOWED_ORIGINS with frontend domain
- Redeploy backend after environment variable change

#### 4. Environment Variables Missing
**Symptoms**: API calls return 500 errors
**Solutions**:
- Verify all required environment variables are set
- Check variable names match exactly
- Redeploy after adding variables

### Debug Commands
```bash
# Check backend health
curl https://hfc-backend.onrender.com/health

# Test API endpoint
curl -X POST https://hfc-backend.onrender.com/api/v1/strategies \
  -H "Content-Type: application/json" \
  -d '{"symptoms":["fatigue"],"goals":["energy"]}'

# Check frontend API connection
curl https://your-frontend-domain.vercel.app
```

## 🚀 Production Optimization

### Performance Optimization
1. **Enable Auto-scaling**: Render Pro plan
2. **CDN**: Automatic with Render
3. **Caching**: Implement Redis for session storage
4. **Database**: Consider PostgreSQL for production

### Security Hardening
1. **HTTPS**: Automatic with Render
2. **Environment Variables**: Secure storage
3. **CORS**: Restrict to specific domains
4. **Rate Limiting**: Implement API rate limits

### Monitoring Setup
1. **Error Tracking**: Sentry integration
2. **Performance Monitoring**: Render metrics
3. **Uptime Monitoring**: External monitoring service
4. **Log Aggregation**: Centralized logging

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Code pushed to GitHub
- [ ] Environment variables prepared
- [ ] OpenAI API key obtained
- [ ] Domain purchased (optional)

### Backend Deployment
- [ ] Render account created
- [ ] Web service configured
- [ ] Environment variables set
- [ ] Persistent disks configured
- [ ] Health check passes
- [ ] RAG model working

### Frontend Deployment
- [ ] Vercel account created
- [ ] Project imported
- [ ] Environment variables set
- [ ] Build successful
- [ ] API connection working

### Post-Deployment
- [ ] Complete feature testing
- [ ] CORS configuration verified
- [ ] Error monitoring setup
- [ ] Performance monitoring active
- [ ] Documentation updated

## 🎯 Success Metrics

### Technical Metrics
- **Uptime**: >99.9%
- **Response Time**: <2s for API calls
- **RAG Model**: <5s for strategy recommendations
- **Error Rate**: <1%

### User Experience Metrics
- **Page Load Time**: <3s
- **API Response Time**: <2s
- **Feature Completeness**: 100% working
- **Data Persistence**: User data saved correctly

## 📞 Support Resources

- **Render Documentation**: [docs.render.com](https://docs.render.com)
- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **FastAPI Documentation**: [fastapi.tiangolo.com](https://fastapi.tiangolo.com)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)

---

**Status**: Ready for deployment
**Estimated Time**: 30-60 minutes
**Difficulty**: Medium
**Success Rate**: High with this guide 
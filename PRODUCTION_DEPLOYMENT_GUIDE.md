# HerFoodCode Production Deployment Guide

## 🏠 Local vs Production Deployment

### Local Development (deploy.sh)
- **Purpose**: Run the app locally for development/testing
- **Command**: `./deploy.sh`
- **Result**: App runs on `http://localhost:3000` and `http://localhost:8000`
- **Use Case**: Development, testing, debugging

### Production Deployment (Platform-specific)
- **Purpose**: Deploy to public cloud platforms
- **Method**: Platform-specific deployment (Vercel, Render, etc.)
- **Result**: App runs on public URLs (e.g., `https://your-app.vercel.app`)
- **Use Case**: Public access, production use

## 🚀 Production Deployment Steps

### Step 1: Prepare Your Code
```bash
# Test local deployment first (optional)
./deploy.sh

# Verify everything works locally
curl http://localhost:8000/health
curl http://localhost:3000
```

### Step 2: Deploy Backend (FastAPI + RAG Model)

#### Option A: Render (Recommended)
1. **Push to GitHub**: Ensure your code is in a GitHub repository
2. **Create Render Account**: Sign up at [render.com](https://render.com)
3. **Create Web Service**:
   - Connect your GitHub repo
   - Select "Deploy from Dockerfile"
   - Set build context to `backend/`
   - Set environment variables:
     ```
     OPENAI_API_KEY=your_openai_key
     SECRET_KEY=your_secret_key
     ALLOWED_ORIGINS=https://your-frontend-domain.com
     ```
4. **Configure Volumes**: Use Render's persistent disk for vectorstore data
5. **Deploy**: Render will build and deploy automatically

#### Option B: Railway
1. **Create Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Deploy from GitHub**: Connect your repo
3. **Configure Service**: Select backend directory
4. **Set Environment Variables**: Same as Render
5. **Deploy**: Railway handles the rest

#### Option C: DigitalOcean App Platform
1. **Create DigitalOcean Account**: Sign up at [digitalocean.com](https://digitalocean.com)
2. **Create App**: Select "Deploy from Dockerfile"
3. **Configure**: Point to backend directory
4. **Set Environment Variables**: Same as above
5. **Deploy**: DigitalOcean builds and deploys

### Step 3: Deploy Frontend (Next.js)

#### Vercel (Recommended for Next.js)
1. **Create Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Import Repository**: Connect your GitHub repo
3. **Configure Project**:
   - Set root directory to `frontend/pcos-advice-app/`
   - Set environment variables:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
     NODE_ENV=production
     ```
4. **Deploy**: Vercel automatically builds and deploys

### Step 4: Connect Custom Domain (Optional)
1. **Purchase Domain**: Namecheap, Google Domains, etc.
2. **Configure DNS**: Point to Vercel (frontend)
3. **Update CORS**: Add your domain to `ALLOWED_ORIGINS` in backend
4. **SSL**: Automatic with Vercel

## 🔧 Environment Variables for Production

### Backend Environment Variables
```env
# Required
OPENAI_API_KEY=sk-your-openai-key-here
SECRET_KEY=your-very-secure-secret-key-here

# Production Settings
ENVIRONMENT=production
ALLOWED_ORIGINS=https://your-app.vercel.app,https://yourdomain.com

# Optional
DATABASE_URL=sqlite:///./users.db
LOG_LEVEL=INFO
```

### Frontend Environment Variables
```env
# Required
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com

# Optional
NODE_ENV=production
```

## 📊 Data Persistence for Production

### Vectorstore Data
**Option 1: Platform Volumes** (Recommended)
- Render: Use persistent disk
- Railway: Use volumes
- DigitalOcean: Use managed volumes

**Option 2: Rebuild on Deploy**
- Include vectorstore build in deployment process
- Slower deployments but simpler setup

**Option 3: External ChromaDB**
- Use ChromaDB cloud service
- Update `rag_pipeline.py` to use cloud connection

### Database
**Option 1: SQLite with Volume** (Current)
- Works for small to medium scale
- Use platform volumes for persistence

**Option 2: PostgreSQL** (Recommended for production)
- Use platform-managed databases
- Update `DATABASE_URL` to PostgreSQL connection

## 🚀 Quick Production Deployment Checklist

### Before Deployment
- [ ] Code pushed to GitHub
- [ ] Environment variables ready
- [ ] API keys obtained
- [ ] Domain purchased (optional)

### Backend Deployment
- [ ] Platform account created
- [ ] Repository connected
- [ ] Environment variables set
- [ ] Volume storage configured
- [ ] Health check passes (`/health` endpoint)

### Frontend Deployment
- [ ] Vercel account created
- [ ] Repository connected
- [ ] `NEXT_PUBLIC_API_URL` set to backend URL
- [ ] Build successful
- [ ] App accessible

### Post-Deployment
- [ ] Test all features
- [ ] Check CORS issues
- [ ] Verify RAG model working
- [ ] Monitor logs and errors
- [ ] Set up monitoring (optional)

## 🐛 Common Production Issues

### 1. CORS Errors
**Symptoms**: Frontend can't connect to backend
**Solution**: Update `ALLOWED_ORIGINS` in backend environment variables

### 2. Vectorstore Not Found
**Symptoms**: RAG model returns errors
**Solution**: Ensure vectorstore data is properly mounted or rebuilt

### 3. Environment Variables Missing
**Symptoms**: API calls fail
**Solution**: Check all required environment variables are set in platform dashboard

### 4. Build Failures
**Symptoms**: Deployment fails
**Solution**: Check platform logs, verify Dockerfile syntax

## 📈 Monitoring Production

### Health Checks
- Backend: `https://your-backend.onrender.com/health`
- Frontend: Root URL should load

### Logs
- Render: Dashboard → Logs
- Railway: Dashboard → Logs
- Vercel: Dashboard → Functions → Logs

### Performance
- Monitor API response times
- Check vectorstore query performance
- Monitor OpenAI API usage

## 🎯 Summary

**Local Development**: Use `./deploy.sh`
**Production Deployment**: Use platform-specific deployment (Render + Vercel)

The `deploy.sh` script is only for local development. For production, you'll deploy directly to cloud platforms using their deployment methods. 
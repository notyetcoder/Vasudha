# 🚀 **KUTUMB - DEPLOYMENT GUIDE**

Complete guide for deploying your Kutumb application to production.

---

## 📋 **TABLE OF CONTENTS**

1. [Vercel Deployment (Recommended)](#vercel-deployment)
2. [Docker Deployment](#docker-deployment)
3. [Traditional Server Deployment](#traditional-server-deployment)
4. [Supabase Setup](#supabase-setup)
5. [Environment Variables](#environment-variables)
6. [Pre-Deployment Checklist](#pre-deployment-checklist)
7. [Post-Deployment Verification](#post-deployment-verification)

---

## 🎯 **VERCEL DEPLOYMENT (RECOMMENDED)**

Vercel is the easiest way to deploy Next.js applications.

### **Prerequisites**
- GitHub account
- Vercel account (free tier available)
- Project pushed to GitHub

### **Step 1: Push to GitHub**

```bash
git init
git add .
git commit -m "Initial commit: Kutumb Relationship Finder"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/kutumb.git
git push -u origin main
```

### **Step 2: Connect to Vercel**

1. Go to [vercel.com](https://vercel.com)
2. Sign up or log in with GitHub
3. Click "New Project"
4. Select your `kutumb` repository
5. Framework: **Next.js** (should auto-detect)
6. Build Command: `npm run build`
7. Output Directory: `.next`
8. Install Command: `npm install`

### **Step 3: Set Environment Variables**

In Vercel project settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Step 4: Deploy**

Click "Deploy" button. Vercel will automatically:
- Install dependencies
- Build the project
- Deploy to CDN
- Provide a live URL

**Deployment time:** ~2-5 minutes

**Your app will be live at:** `https://your-project.vercel.app`

---

## 🐳 **DOCKER DEPLOYMENT**

Deploy using Docker for more control.

### **Prerequisites**
- Docker installed
- Docker Hub account (optional, for registry)

### **Step 1: Build Docker Image**

```bash
docker build -t kutumb:latest .
```

### **Step 2: Test Locally**

```bash
docker run -p 3000:3000 kutumb:latest
```

Visit: `http://localhost:3000`

### **Step 3: Push to Docker Hub** (Optional)

```bash
docker tag kutumb:latest YOUR-USERNAME/kutumb:latest
docker push YOUR-USERNAME/kutumb:latest
```

### **Step 4: Deploy to Server**

On your production server:

```bash
docker pull YOUR-USERNAME/kutumb:latest
docker run -d -p 80:3000 -p 443:3000 kutumb:latest
```

### **Using Docker Compose**

```bash
docker-compose up -d
```

---

## 🖥️ **TRADITIONAL SERVER DEPLOYMENT**

Deploy on a VPS or traditional server.

### **Prerequisites**
- VPS/Server with Node.js 18+
- SSH access
- Domain name (optional)

### **Step 1: Connect to Server**

```bash
ssh user@your-server.com
```

### **Step 2: Clone Repository**

```bash
cd /var/www
git clone https://github.com/YOUR-USERNAME/kutumb.git
cd kutumb
```

### **Step 3: Install Dependencies**

```bash
npm install
```

### **Step 4: Build Application**

```bash
npm run build
```

### **Step 5: Run with PM2** (Recommended)

Install PM2:
```bash
npm install -g pm2
```

Start application:
```bash
pm2 start npm --name "kutumb" -- start
pm2 save
pm2 startup
```

### **Step 6: Setup Nginx Reverse Proxy**

Create `/etc/nginx/sites-available/kutumb`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/kutumb /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### **Step 7: SSL Certificate** (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🗄️ **SUPABASE SETUP**

Set up Supabase database for production.

### **Step 1: Create Supabase Project**

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Choose region closest to users
4. Create strong password

### **Step 2: Create Database Schema**

1. Go to SQL Editor
2. Paste content from `scripts/schema.sql`
3. Run query
4. Verify tables created

### **Step 3: Get API Keys**

1. Go to Project Settings → API
2. Copy "URL" → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy "anon" key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### **Step 4: Set RLS Policies**

In Supabase, configure Row Level Security for your requirements.

### **Step 5: Test Connection**

Update `.env.local` and test:
```bash
npm run dev
# Try loading /explore page
# Should fetch users from Supabase
```

---

## 🔐 **ENVIRONMENT VARIABLES**

### **Development (.env.local)**

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### **Production (Vercel/Server)**

Set the same variables in:
- Vercel: Project Settings → Environment Variables
- Docker: Use `docker run -e NEXT_PUBLIC_SUPABASE_URL=...`
- Traditional: Set in `.env` file or system environment

### **Important**

- `NEXT_PUBLIC_*` variables are exposed to client
- Never commit `.env.local` to Git
- Use `.env.example` as template
- Rotate keys regularly

---

## ✅ **PRE-DEPLOYMENT CHECKLIST**

Before deploying, verify:

### **Code**
- [ ] No TypeScript errors: `npm run type-check`
- [ ] No lint warnings: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] All imports correct
- [ ] No console errors

### **Configuration**
- [ ] `.env.local` configured
- [ ] Supabase URL correct
- [ ] Supabase key correct
- [ ] Database schema created
- [ ] RLS policies configured

### **Database**
- [ ] Users table exists
- [ ] Indexes created
- [ ] Sample data inserted (optional)
- [ ] Connection tested

### **Testing**
- [ ] Home page loads
- [ ] Explore page works
- [ ] Relationships page works
- [ ] Language switching works
- [ ] Mobile responsive
- [ ] No broken links

### **Security**
- [ ] No secrets in code
- [ ] No API keys exposed
- [ ] Environment variables set
- [ ] HTTPS enabled (if applicable)
- [ ] RLS policies configured

### **Performance**
- [ ] Build time acceptable
- [ ] Bundle size optimized
- [ ] Images optimized
- [ ] No N+1 queries

---

## 🔍 **POST-DEPLOYMENT VERIFICATION**

After deploying, verify everything works:

### **Step 1: Test URLs**

```
✅ https://your-domain.com/
✅ https://your-domain.com/explore
✅ https://your-domain.com/relationships
```

### **Step 2: Test Features**

- [ ] Home page displays correctly
- [ ] Explore page loads users
- [ ] Can search for users
- [ ] Relationship finder works
- [ ] Language switching works
- [ ] Language persists on refresh

### **Step 3: Check Logs**

Vercel:
```bash
vercel logs
```

Server (PM2):
```bash
pm2 logs kutumb
```

Docker:
```bash
docker logs container_id
```

### **Step 4: Monitor Performance**

Vercel Analytics:
- Go to Vercel dashboard
- Check Core Web Vitals
- Monitor error rates

Server:
```bash
pm2 monit
```

### **Step 5: Test Mobile**

- Use browser dev tools
- Test on actual mobile device
- Verify touch interactions

---

## 🆘 **TROUBLESHOOTING**

### **Issue: Database connection fails**

```
✅ Check NEXT_PUBLIC_SUPABASE_URL is correct
✅ Check NEXT_PUBLIC_SUPABASE_ANON_KEY is correct
✅ Verify Supabase project is active
✅ Check network connectivity
```

### **Issue: Deployment fails**

```
✅ Check build logs in Vercel/Docker
✅ Verify dependencies installed
✅ Check for TypeScript errors
✅ Verify environment variables set
```

### **Issue: Users not loading**

```
✅ Check database schema created
✅ Verify RLS policies allow reads
✅ Check browser console for errors
✅ Verify API endpoint is correct
```

### **Issue: Slow performance**

```
✅ Enable caching in Vercel
✅ Optimize images
✅ Use CDN for static assets
✅ Check database indexes
```

---

## 📊 **MONITORING & MAINTENANCE**

### **Daily**
- Check error logs
- Monitor uptime

### **Weekly**
- Review analytics
- Check Core Web Vitals
- Update dependencies

### **Monthly**
- Review security logs
- Rotate keys
- Update Supabase
- Performance optimization

---

## 🔄 **CONTINUOUS DEPLOYMENT**

### **With GitHub Actions**

The `.github/workflows/ci-cd.yml` file is included.

To enable:

1. Go to GitHub repository
2. Settings → Secrets and variables → Actions
3. Add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
4. Enable Actions in repository
5. Push to `main` branch automatically deploys!

---

## 📈 **SCALING**

As your application grows:

### **Database**
- Upgrade Supabase plan
- Optimize queries
- Add caching layer

### **API**
- Implement rate limiting
- Add API authentication
- Cache responses

### **Frontend**
- Use Edge caching
- Optimize images
- Lazy load components

### **Infrastructure**
- Load balancer
- Multiple servers
- Geographic distribution

---

## 🎉 **DEPLOYMENT COMPLETE!**

Your Kutumb application is now live!

Share your deployment URL:
```
🌐 https://your-domain.com
```

Monitor and maintain:
```
📊 Check logs daily
📈 Review analytics weekly
🔐 Update security regularly
```

---

**Happy deploying!** 🚀

Made with ❤️ for the Kutumb community.

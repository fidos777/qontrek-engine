# 🚀 DEPLOYMENT GUIDE - Voltek Demo

## Quick Deploy Checklist (30 minutes)

```bash
✓ Step 1: Project created
✓ Step 2: Dependencies installed
✓ Step 3: Proof data added to public/data/
✓ Step 4: Local test passed (npm run dev)
✓ Step 5: Ready to deploy
```

---

## 🌐 DEPLOYMENT OPTIONS

### Option 1: Vercel (Recommended - Fastest)

**Why Vercel:**
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Zero configuration
- ✅ 2-minute deployment

**Steps:**

```bash
# 1. Install Vercel CLI (one-time)
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
cd voltek-demo
vercel --prod

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? (your account)
# - Link to existing project? N
# - Project name? voltek-demo
# - Directory? ./
# - Deploy? Y

# Result: Get URL like https://voltek-demo-abc123.vercel.app
```

**Post-Deployment:**

```bash
# Visit your URL
open https://your-url.vercel.app

# Test on mobile
# Send URL to your phone

# Custom domain (optional):
# Go to Vercel Dashboard → Project → Settings → Domains
# Add: demo.qontrek.com or demo.voltek.my
```

---

### Option 2: Netlify

```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Login
netlify login

# 3. Build locally
npm run build

# 4. Deploy
netlify deploy --prod

# Follow prompts:
# - Create & configure new site? Y
# - Team? (your account)
# - Site name? voltek-demo
# - Publish directory? .next
# - Deploy? Y

# Result: Get URL like https://voltek-demo.netlify.app
```

---

### Option 3: Railway

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize
railway init

# 4. Deploy
railway up

# Result: Get URL from Railway dashboard
```

---

### Option 4: DigitalOcean App Platform

**Via Dashboard:**

1. Go to [cloud.digitalocean.com](https://cloud.digitalocean.com)
2. Click "Create App"
3. Connect GitHub repo
4. Select branch: main
5. Build command: `npm run build`
6. Run command: `npm run start`
7. Click "Deploy"

**Result:** Get URL like `https://voltek-demo-abc123.ondigitalocean.app`

---

## 🎯 CUSTOM DOMAIN SETUP

### For demo.qontrek.com:

**At your DNS provider (Cloudflare/Namecheap/etc):**

```
Type: CNAME
Name: demo
Value: cname.vercel-dns.com
TTL: Auto
```

**At Vercel:**

1. Go to Project Settings → Domains
2. Add domain: `demo.qontrek.com`
3. Wait for DNS propagation (5-10 minutes)
4. Verify: `https://demo.qontrek.com`

### For demo.voltek.my:

**If Voltek owns the domain:**

```
Type: CNAME
Name: demo
Value: cname.vercel-dns.com
TTL: 300
```

**Or use subdomain:**

```
Type: CNAME
Name: qontrek-demo
Value: cname.vercel-dns.com
```

Result: `https://qontrek-demo.voltek.my`

---

## ⚡ OPTIMIZATION TIPS

### 1. Enable Caching

**In next.config.mjs:**

```javascript
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  
  // Add caching headers
  async headers() {
    return [
      {
        source: '/data/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600'
          }
        ]
      }
    ];
  }
};
```

### 2. Compress Images

```bash
# If you add Voltek logo
npm install sharp
```

### 3. Enable Analytics

**Add to layout.tsx:**

```typescript
// Google Analytics (if provided)
import Script from 'next/script'

export default function RootLayout() {
  return (
    <html>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
          strategy="afterInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## 🔒 SECURITY CHECKLIST

Before sharing URL publicly:

```bash
✓ No sensitive data in JSON files
✓ Phone numbers masked (if needed)
✓ Email addresses generic
✓ No API keys in code
✓ HTTPS enabled (automatic with Vercel)
✓ Rate limiting considered (if needed)
```

---

## 📊 MONITORING

### Setup Uptime Monitoring:

**UptimeRobot (Free):**

1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Add Monitor
3. URL: `https://your-demo-url.vercel.app/demo/g2`
4. Interval: 5 minutes
5. Get alerts if down

### Check Performance:

```bash
# Lighthouse audit
npx lighthouse https://your-demo-url.vercel.app/demo/g2

# Expected scores:
# Performance: 90+
# Accessibility: 95+
# Best Practices: 100
# SEO: 90+
```

---

## 🧪 PRE-LAUNCH CHECKLIST

**1 Hour Before Demo:**

```bash
# 1. Test deployment
✓ Visit URL
✓ Page loads in <3s
✓ Data displays correctly
✓ All buttons work
✓ Mobile responsive

# 2. Test on different devices
✓ Desktop Chrome
✓ Desktop Safari
✓ iPhone Safari
✓ Android Chrome

# 3. Have backup plan
✓ Video recording ready
✓ Screenshots saved
✓ Local version running
```

---

## 🎬 DEMO DAY PROTOCOL

### Before Presentation:

```bash
# 1. Check deployment status
curl -I https://your-demo-url.vercel.app

# 2. Clear browser cache
# 3. Open in incognito window
# 4. Have backup laptop ready
```

### During Presentation:

```
1. Open URL
2. Wait for full load
3. Follow demo script
4. If issue: Switch to video backup
```

### After Presentation:

```bash
# 1. Check analytics
# - How many visitors?
# - Any errors?
# - Geographic distribution?

# 2. Gather feedback
# - What impressed them?
# - What confused them?
# - What features requested?
```

---

## 🚨 ROLLBACK PROCEDURE

**If deployment breaks:**

```bash
# Vercel: Instant rollback
vercel rollback

# Or via Dashboard:
# 1. Go to Deployments
# 2. Find last working version
# 3. Click "Promote to Production"
```

---

## 📈 SCALING FOR TIER 2

**When ready to expand (add Gates 0,1,CFO,Docs):**

```bash
# 1. Current setup supports:
- Single dashboard (Gate 2)
- Static JSON data
- Demo mode only

# 2. For Tier 2, upgrade to:
- Multiple dashboards
- Supabase connection
- Authentication (NextAuth)
- Real-time updates

# 3. Deployment stays same:
- Same Vercel project
- Add environment variables
- Enable serverless functions
```

---

## 🎯 SUCCESS METRICS

### Deployment is successful when:

- ✅ URL accessible from anywhere
- ✅ HTTPS enabled (green lock)
- ✅ Page load < 3 seconds
- ✅ Mobile responsive
- ✅ No console errors
- ✅ Uptime monitoring enabled
- ✅ Backup plan ready
- ✅ Demo script practiced

---

## 🆘 EMERGENCY CONTACTS

**If deployment fails during demo:**

```
Plan A: Use deployed URL
Plan B: Use video recording
Plan C: Use localhost (if same network)
Plan D: Reschedule (last resort)
```

**Quick fixes:**

```bash
# Issue: URL not loading
→ Check Vercel status page
→ Try incognito window
→ Check DNS propagation

# Issue: Data not showing
→ Verify JSON file in deployment
→ Check browser console
→ Use fallback video

# Issue: Slow loading
→ May be CDN warming up
→ Refresh once
→ Give it 10 seconds
```

---

## ✅ FINAL PRE-LAUNCH CHECKLIST

```bash
Infrastructure:
  ✓ Deployed to Vercel
  ✓ Custom domain configured (optional)
  ✓ HTTPS enabled
  ✓ Uptime monitoring active

Testing:
  ✓ Desktop tested (Chrome, Safari, Firefox)
  ✓ Mobile tested (iOS, Android)
  ✓ Data displays correctly
  ✓ Actions work (modals appear)
  ✓ Performance acceptable (< 3s load)

Preparation:
  ✓ Demo script written
  ✓ Demo script practiced
  ✓ Backup video recorded
  ✓ Screenshots captured
  ✓ Feedback form ready

Security:
  ✓ No sensitive data exposed
  ✓ Phone numbers masked (if needed)
  ✓ Rate limiting considered

Contingency:
  ✓ Rollback procedure known
  ✓ Backup laptop ready
  ✓ Local version running
  ✓ Alternative demo method planned
```

---

## 🎉 YOU'RE READY TO LAUNCH!

**Deployment Complete:** Share your URL and impress Voltek! 🚀

**URL Examples:**
- `https://voltek-demo.vercel.app/demo/g2`
- `https://demo.qontrek.com`
- `https://qontrek-demo.voltek.my`

**Next Step:** Send URL to stakeholders and schedule demo call.

---

**Need help? Check main README.md for troubleshooting.**

# ⚡ QUICK REFERENCE - Voltek Demo

## 🚀 ULTRA-FAST SETUP (Copy-Paste Commands)

```bash
# 1. CREATE PROJECT (2 min)
npx create-next-app@latest voltek-demo --typescript --tailwind --app --no-src-dir --import-alias "@/*" --use-npm
cd voltek-demo
npm install lucide-react class-variance-authority clsx tailwind-merge

# 2. COPY FILES (1 min)
# Copy all files from /tmp/voltek-demo/* to voltek-demo/
# (Or download the complete package)

# 3. ADD DATA (1 min)
mkdir -p public/data
cp /path/to/proof/g2_dashboard_v19.1.json public/data/

# 4. TEST LOCALLY (30 sec)
npm run dev
open http://localhost:3001/demo/g2

# 5. DEPLOY (2 min)
npm install -g vercel
vercel --prod

# DONE! Share your URL 🎉
```

**Total Time: 6 minutes 30 seconds**

---

## 📋 ESSENTIAL COMMANDS

```bash
# Development
npm run dev                    # Start dev server (port 3001)
npm run build                  # Test production build
npm run start                  # Run production build locally

# Deployment
vercel                         # Deploy preview
vercel --prod                  # Deploy production
vercel rollback                # Rollback if issues

# Troubleshooting
rm -rf node_modules && npm install    # Fix dependency issues
cat public/data/g2_dashboard_v19.1.json | jq .    # Validate JSON
```

---

## 🎯 DEMO SCRIPT (2-Minute Version)

**[0:00-0:30] Opening:**
> "This is Voltek's live payment recovery dashboard.
> Everything you see is real data from your pipeline."

**[0:30-1:30] Features:**
> [Point to Business Impact] "RM 180k+ in your pipeline"
> [Point to KPIs] "12 leads at 80%, 8 at 20%, 3 handover"
> [Click Critical Lead] "Ahmad: 21 days overdue, RM 8k"
> [Click Call Button] "One-click dialer in production"
> [Scroll to Success] "Wong paid RM 7.2k in 4 days"

**[1:30-2:00] Closing:**
> "Real-time data. Mobile-ready. Trust Index 100%.
> Ready for your team today. Questions?"

---

## 🐛 INSTANT FIXES

### Error: "Failed to load data"
```bash
ls -lh public/data/g2_dashboard_v19.1.json  # File exists?
cat public/data/g2_dashboard_v19.1.json | jq .  # Valid JSON?
npm run dev  # Restart server
```

### Error: "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Error: "Deployment failed"
```bash
npm run build  # Test locally first
# Check Node version: node -v (should be 18+)
```

---

## 📱 TESTING CHECKLIST

```bash
Desktop:
  ✓ Chrome: http://localhost:3001/demo/g2
  ✓ Safari: http://localhost:3001/demo/g2
  ✓ All data displays
  ✓ Buttons work
  ✓ No console errors (F12)

Mobile:
  ✓ Find local IP: ifconfig | grep inet
  ✓ Open: http://192.168.X.X:3001/demo/g2
  ✓ Layout adapts
  ✓ Buttons tappable
```

---

## 🎨 BRAND CUSTOMIZATION

**Logo:**
```typescript
// app/demo/g2/page.tsx (line ~250)
<img src="/assets/voltek-logo.svg" className="h-8" />
```

**Colors:**
```typescript
// config/voltek-theme.ts
colors: {
  primary: "#FF6B00",    // Your orange
  secondary: "#2C3E50",  // Your blue
}
```

**Contact:**
```typescript
// config/voltek-theme.ts
contact: {
  phone: "+60 3-XXXX XXXX",
  email: "support@voltek.my"
}
```

---

## 🌐 URL OPTIONS

After deployment, you get:

```
Default:
https://voltek-demo-abc123.vercel.app/demo/g2

Custom (add in Vercel dashboard):
https://demo.qontrek.com
https://qontrek-demo.voltek.my
```

---

## 📊 SUCCESS INDICATORS

**You're ready when:**
- ✅ `npm run dev` works
- ✅ Dashboard shows data
- ✅ No red errors in console
- ✅ Mobile layout looks good
- ✅ Deployment URL works
- ✅ Demo script memorized

---

## 🚨 DEMO DAY CHECKLIST

**1 Hour Before:**
```bash
✓ Test URL in incognito
✓ Clear browser cache
✓ Test on phone
✓ Backup video ready
✓ Demo script reviewed
```

**During Demo:**
```bash
✓ Open URL fresh
✓ Wait for full load (2-3 sec)
✓ Follow script
✓ Show mobile version
✓ Answer questions
```

---

## 🎯 NEXT STEPS

**After Demo Success:**

1. **Gather Feedback** (30 min)
   - What impressed them?
   - What features do they want?
   - Ready for Tier 2?

2. **Plan Tier 2** (if approved)
   - Add Gates 0, 1, CFO, Docs
   - Connect Supabase
   - Add authentication
   - Timeline: 3-5 days

3. **Production Planning**
   - Custom domain
   - Real-time updates
   - WhatsApp integration
   - Training for ops team

---

## 📞 SUPPORT

**Issues?**
1. Check README.md (troubleshooting section)
2. Check DEPLOYMENT.md (deployment issues)
3. Check browser console for errors
4. Verify all files copied correctly

**Common Fixes:**
```bash
rm -rf node_modules && npm install  # 90% of issues
npm run dev                          # Restart server
```

---

## 💡 PRO TIPS

1. **Practice demo 3× before real presentation**
2. **Have backup video ready (record screen)**
3. **Test on actual Voltek WiFi network**
4. **Print demo script as backup**
5. **Know where Call/WhatsApp buttons are**

---

## 🎉 YOU GOT THIS!

**Remember:**
- Demo is only 2 minutes
- Focus on the RM 180k+ recovery opportunity
- Show, don't tell (click buttons, show actions)
- Confidence is key (you built this!)

**Your URL is your weapon. Use it. 🚀**

---

## 📈 METRICS TO HIGHLIGHT

```
Total Recoverable:  RM 180,400
Success Rate:       68.5% (7-day)
Avg Payment Time:   8.2 days
Current Pipeline:   23 leads active
```

---

**Built with Qontrek • Ready in <7 minutes • Production-Quality**

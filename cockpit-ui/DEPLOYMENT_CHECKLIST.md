# 🧭 Pre-Deployment Checklist

## Setup & Dependencies
- [ ] Run `npm install` to ensure all dependencies are installed
- [ ] Verify node version compatibility (Node.js 18+ recommended)
- [ ] Check that all environment variables are configured

## Technical Validation
- [ ] `npm run build` passes without errors
- [ ] `npm run type-check` passes (0 TypeScript errors after npm install)
- [ ] `npm run lint` passes (0 ESLint warnings)
- [ ] `npm run test` passes (all tests green)

## Performance Metrics
- [ ] Lighthouse Performance score ≥ 90
- [ ] Lighthouse Accessibility score ≥ 95
- [ ] Page load time < 2 seconds (measured on 3G network)
- [ ] Animations run at 60fps (no jank during scrolling)
- [ ] First Contentful Paint (FCP) < 1.8s
- [ ] Time to Interactive (TTI) < 3.8s

### Running Lighthouse
```bash
# Start the dev server
npm run dev

# In a new terminal, run Lighthouse (requires lighthouse-cli installed globally)
npm run lighthouse
# OR manually:
lighthouse http://localhost:3000/gates/g2 --only-categories=performance,accessibility --view
```

## Accessibility Compliance
- [ ] Keyboard navigation works on all interactive elements
- [ ] All buttons and links have proper focus indicators
- [ ] Screen reader tested (NVDA/JAWS on Windows, VoiceOver on macOS)
- [ ] Focus trap works in modals (Escape key closes modal)
- [ ] All images have alt text
- [ ] All form inputs have associated labels
- [ ] Color contrast ratio meets WCAG AA standards (4.5:1 for text)
- [ ] Touch targets are ≥ 44×44 pixels on mobile

## Cross-Browser Testing
- [ ] Chrome (latest) ✓
- [ ] Safari (latest) ✓
- [ ] Firefox (latest) ✓
- [ ] Edge (latest) ✓
- [ ] Mobile Safari (iOS) ✓
- [ ] Mobile Chrome (Android) ✓

### Browser-Specific Checks
- [ ] Safari: Motion animations use `will-change: transform, opacity`
- [ ] Firefox: Date parsing uses `new Date(Date.parse(...))` format
- [ ] All browsers: No console errors or warnings

## Responsive Design
- [ ] Mobile: 375px width (iPhone SE) ✓
- [ ] Mobile: 390px width (iPhone 12/13/14) ✓
- [ ] Tablet: 768px width (iPad) ✓
- [ ] Desktop: 1024px width ✓
- [ ] Large Desktop: 1440px+ width ✓

### Mobile-Specific Checks
- [ ] Touch feedback works on all interactive elements
- [ ] No horizontal scrolling on small screens
- [ ] Text is readable without zooming
- [ ] Forms are easy to fill on mobile
- [ ] Viewport height uses `100dvh` for proper mobile rendering

## Code Quality
- [ ] No `console.log` statements in production code
- [ ] All TypeScript strict mode checks pass
- [ ] No unused imports or variables
- [ ] All components have proper TypeScript types
- [ ] Error boundaries implemented for graceful failure handling

## UI/UX Polish
- [ ] Skeleton loaders show during data fetching
- [ ] Error states have user-friendly messages with retry options
- [ ] Loading states provide feedback to users
- [ ] Success states confirmed with visual feedback
- [ ] Empty states have helpful messaging

## Security
- [ ] No sensitive data exposed in client-side code
- [ ] API endpoints have proper authentication
- [ ] CORS configured correctly for production domain
- [ ] Content Security Policy (CSP) headers configured
- [ ] No hardcoded secrets or API keys

## Performance Optimizations Applied
- [x] Dynamic imports for heavy components
- [x] Memoization for expensive calculations using `useMemo`
- [x] `will-change` hints on animated elements
- [x] Skeleton loaders for async content
- [x] Proper image optimization (if applicable)
- [x] Code splitting enabled (Next.js default)

## Deployment
- [ ] Production build created: `npm run build`
- [ ] Build output verified in `.next/` directory
- [ ] Environment variables configured in deployment platform
- [ ] Production URL domain configured
- [ ] SSL certificate valid and active

### Vercel Deployment (if applicable)
```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy to production
vercel --prod
```

- [ ] Vercel deployment succeeds without errors
- [ ] Production URL is accessible
- [ ] All routes work on production domain
- [ ] API routes respond correctly

## Post-Deployment Verification
- [ ] Production site loads successfully
- [ ] All pages accessible and functional
- [ ] Data fetching works correctly
- [ ] Forms submit successfully
- [ ] No console errors in production
- [ ] Analytics tracking works (if configured)
- [ ] Error monitoring works (Sentry/etc., if configured)

## Rollback Plan
- [ ] Previous production version documented
- [ ] Rollback procedure documented and tested
- [ ] Database migrations (if any) are reversible

---

## Quick Pre-Flight Commands

```bash
# Install dependencies
npm install

# Run all checks
npm run type-check && npm run lint && npm run test && npm run build

# Start dev server for Lighthouse testing
npm run dev

# Run Lighthouse (in separate terminal after dev server starts)
npm run lighthouse
```

## Notes

- **TypeScript Errors**: If `npm run type-check` fails, ensure `npm install` has been run to install all type definitions
- **Performance**: Dynamic imports and memoization have been implemented for optimal performance
- **Accessibility**: All interactive elements have proper ARIA labels and keyboard navigation support
- **Mobile**: Touch targets meet minimum 44×44px requirement for better mobile UX

## Release Sign-Off

- [ ] All checklist items completed
- [ ] Product Owner approval
- [ ] Technical Lead approval
- [ ] QA sign-off

**Deployment Date**: ___________
**Deployed By**: ___________
**Production URL**: ___________

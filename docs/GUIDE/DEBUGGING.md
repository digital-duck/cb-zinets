# Debugging Guide: Nothing Displays

If the app shows a blank page instead of the input bar, follow this checklist.

## Quick Checklist

- [ ] API server running (`http://localhost:8000`)
- [ ] Frontend dev server running (`http://localhost:5173`)
- [ ] Browser cache cleared
- [ ] No console errors (F12)
- [ ] Page at correct URL (#/)

---

## Step 1: Verify Services are Running

### API Server
```bash
# Terminal 1
cd /home/papagame/projects/digital-duck/cb_zinets
python -m uvicorn api.app:app --reload --port 8000

# Should show:
# INFO:     Uvicorn running on http://0.0.0.0:8000
```

Test it:
```bash
curl http://localhost:8000/api/domains
# Should return JSON (even if empty)
```

### Frontend Server
```bash
# Terminal 2
cd /home/papagame/projects/digital-duck/cb_zinets
npm run dev

# Should show:
# Local: http://localhost:5173
# Press 'q' to quit
```

---

## Step 2: Check Browser Console (F12)

1. **Open DevTools**: Press `F12`
2. **Go to Console tab**
3. **Look for red errors**

Common issues:

### Error: Module not found
```
Module not found: "src/pages/GraphBuilder.js"
```
**Fix**: Restart frontend server (`npm run dev`)

### Error: Cannot read property of undefined
```
TypeError: Cannot read property 'addEventListener' of null
```
**Fix**: HTML elements not rendering. Check if component is mounted.

### Error: Failed to fetch
```
Failed to fetch from http://localhost:8000/api/phrase/graph
```
**Fix**: API server not running or port is wrong

---

## Step 3: Check Network Tab

1. **Open DevTools**: Press `F12`
2. **Go to Network tab**
3. **Reload page** (Ctrl+R)
4. **Look for failed requests** (red X)

### Expected requests:
- ✅ `index.html` (200)
- ✅ `main.js` (200)
- ✅ `style.css` (200)
- ✅ Other JS files (200)

### Troubleshoot failed requests:
- **404 Not Found**: File missing or wrong path
- **Failed to connect**: Server not running
- **Timeout**: Server is slow

---

## Step 4: Test HTML at Root

1. Open `http://localhost:5173/`
2. You should see:
   - ConceptBook header with logo
   - Page content below

**If blank**: Frontend has rendering issue

---

## Step 5: Check If Header Displays

1. Open DevTools (F12)
2. **Elements tab** → Inspect
3. Look for `<header class="cb-header">`

**If found**: Component is rendering  
**If not found**: GraphBuilder component not loading

---

## Step 6: Test API Directly

From your terminal:
```bash
curl -X POST http://localhost:8000/api/phrase/graph \
  -H "Content-Type: application/json" \
  -d '{"phrase":"画蛇添足","max_depth":10}' \
  | head -c 500

# Should return HTML starting with:
# {"html":"<!DOCTYPE html>..."
```

If error, check API logs in Terminal 1.

---

## Step 7: Browser-Specific Issues

### Chrome/Edge
- [ ] Clear cache: Ctrl+Shift+Delete
- [ ] Try Incognito mode (Ctrl+Shift+N)
- [ ] Check if JavaScript is enabled (⋮ → Settings → Site Settings)

### Firefox
- [ ] Clear cache: Ctrl+Shift+Delete
- [ ] Try Private Window (Ctrl+Shift+P)

### Safari
- [ ] Clear cache: ⌘+Shift+Delete
- [ ] Enable Developer Tools (Safari → Preferences → Advanced → Show features)

---

## Step 8: Port Conflicts

If ports are already in use:

### Find process on port 8000
```bash
lsof -i :8000
# Kill it: kill -9 <PID>
```

### Find process on port 5173
```bash
lsof -i :5173
# Kill it: kill -9 <PID>
```

Then restart services with `npm run dev` and `python -m uvicorn ...`

---

## Step 9: Verify CSS is Loaded

1. **DevTools → Elements → Styles**
2. Look for styles from `style.css`
3. Check if `.cb-input-bar` has styles

**If missing**: CSS not loaded or filename wrong

---

## Step 10: Full Refresh

```bash
# 1. Kill all services (Ctrl+C in terminals)
# 2. Clear browser cache (Ctrl+Shift+Delete)
# 3. Clear npm cache
npm cache clean --force

# 4. Reinstall dependencies
npm install

# 5. Restart services
npm run dev
python -m uvicorn api.app:app --reload --port 8000

# 6. Open browser fresh tab
# http://localhost:5173/#/
```

---

## Detailed Inspection

### Check HTML Structure
1. **DevTools → Elements tab**
2. Look for:
   ```html
   <header class="cb-header">...</header>
   <main class="cb-graph-builder-page">
     <div class="cb-input-bar">
       <div class="cb-input-container">
         <input class="cb-phrase-input" ... />
         <button class="cb-build-btn">...</button>
       </div>
     </div>
     <div class="cb-graph-output" ...></div>
   </main>
   ```

### Check CSS Applied
```javascript
// Run in console (F12)
const input = document.querySelector('.cb-phrase-input')
const computed = window.getComputedStyle(input)
console.log('Background:', computed.backgroundColor)
console.log('Display:', computed.display)
console.log('Padding:', computed.padding)
```

Should show actual values, not 'inherit' or 'auto'

---

## Common Solutions

### Issue: Page is all white
**Solutions**:
1. Check if header is there (inspect element)
2. If header missing: restart `npm run dev`
3. If header there but no input bar: check CSS is loaded
4. Clear cache and refresh

### Issue: Input bar visible but button doesn't work
**Solutions**:
1. Check console for JavaScript errors
2. Check if API server is running
3. Test API with curl (see Step 6)
4. Check Network tab for failed fetch

### Issue: Button works but no graph appears
**Solutions**:
1. Check Network tab for API response
2. If 500 error: check API logs (Terminal 1)
3. If 200 but empty: API might have error in response
4. Check console for JavaScript errors

### Issue: Graph appears but looks broken
**Solutions**:
1. Might be normal - vis-network needs time to render
2. Wait 2-3 seconds for graph to fully load
3. Check console for warnings
4. Try zooming in/out (scroll wheel)

---

## Enable Debug Logging

### Frontend Logging
Edit `src/pages/GraphBuilder.js` and uncomment console.log:
```javascript
console.log('Sending request to API...')
// ... rest of code
console.log('Received HTML from API, rendering...')
```

### API Logging
Run API with verbose:
```bash
python -m uvicorn api.app:app --reload --port 8000 --log-level debug
```

---

## Report Issues

If still not working, collect:

1. **Browser console output** (F12 → Console)
2. **Network tab errors** (F12 → Network)
3. **API server logs** (from terminal)
4. **Browser + OS** (Firefox on Mac, Chrome on Windows, etc.)

---

## Checklist for Clean State

```bash
# 1. Kill all processes
# (Ctrl+C in all terminals)

# 2. Clean cache
npm cache clean --force
rm -rf node_modules
npm install

# 3. Clear browser cache
# Ctrl+Shift+Delete → Clear all time → Apply

# 4. Restart everything
# Terminal 1
python -m uvicorn api.app:app --reload --port 8000

# Terminal 2
npm run dev

# 5. Open fresh browser tab
# http://localhost:5173/#/

# 6. Open console
# F12 → Console tab

# 7. Check for errors
```

---

**Still stuck?** Check the diagnostic output above step by step. Most issues are either:
1. Service not running (API or frontend)
2. Browser cache (clear it)
3. Port conflict (kill other process)
4. Missing files (reinstall with npm)

All fixable with the steps above.

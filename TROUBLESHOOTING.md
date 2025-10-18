# Wallet Connection Troubleshooting

## If You Have HashPack Installed But It's Not Connecting

### Step 1: Check HashPack Extension

1. **Open HashPack Extension**
   - Click the HashPack icon in your browser toolbar
   - Make sure you're logged in to your account

2. **Switch to Testnet**
   - Open HashPack
   - Go to Settings ⚙️
   - Network → Select "Testnet"
   - This is CRITICAL - must be on testnet!

3. **Check dApp Connections**
   - In HashPack, go to "Connected Apps"
   - If "Hedera Ramp Hub" is listed, disconnect it
   - Then reconnect from our app

### Step 2: Browser Console Check

1. **Open Developer Console**
   - Press `F12` or `Cmd+Option+I` (Mac)
   - Go to Console tab

2. **Check for HashPack**
   - Type: `window.hashconnect`
   - Should return an object (not undefined)
   
3. **Reload the Page**
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Try connecting again

### Step 3: Connection Steps

1. **Visit:** http://localhost:8080
2. **Click:** "Get Started" 
3. **Click:** "Connect Wallet to Continue"
4. **Click:** "Connect HashPack"
5. **Wait:** Extension popup should appear (might take 2-3 seconds)
6. **Approve:** Click "Approve" in HashPack popup

### Step 4: If Still Not Working

**Try This:**

1. **Disable and Re-enable HashPack**
   - Go to `chrome://extensions/`
   - Find HashPack
   - Toggle it off, then on

2. **Clear Browser Cache**
   - Settings → Privacy → Clear browsing data
   - Check "Cached images and files"
   - Clear last hour

3. **Restart Browser**
   - Completely quit browser
   - Reopen and try again

4. **Check Browser Compatibility**
   - HashPack works best on Chrome/Brave
   - Try a different browser if needed

### Common Issues

#### Issue: "HashPack wallet not found"
**Solution:** 
- Make sure HashPack extension is installed and enabled
- Check `chrome://extensions/` 
- Extension should show as "On"

#### Issue: Popup doesn't appear
**Solution:**
- Check browser popup blocker
- Allow popups for localhost
- Click HashPack icon manually and approve

#### Issue: "Network mismatch"
**Solution:**
- HashPack must be on **Testnet**
- App is configured for testnet
- Settings → Network → Testnet

#### Issue: Connection approved but wallet not showing
**Solution:**
- Hard refresh the page (`Cmd+Shift+R`)
- Check localStorage: `localStorage.getItem('walletState')`
- Clear and reconnect

### Debug Mode

Open browser console and run:

```javascript
// Check if HashPack is detected
console.log('HashPack available:', !!window.hashconnect);

// Check wallet state
console.log('Wallet state:', localStorage.getItem('walletState'));

// Clear wallet state
localStorage.removeItem('walletState');
```

### Test Connection Manually

1. Open HashPack extension
2. Go to "Connected Apps"
3. Click "Connect New App"
4. Enter: http://localhost:8080
5. Approve connection
6. Refresh our app

### Still Having Issues?

**Check these:**

1. ✅ HashPack extension installed
2. ✅ HashPack is on Testnet (not Mainnet)
3. ✅ Browser allows popups
4. ✅ Page loaded on http://localhost:8080
5. ✅ No browser errors in console
6. ✅ Extension is enabled

### Alternative: Try Blade Wallet

If HashPack continues to have issues:

1. Install Blade Wallet from Chrome Web Store
2. Create account
3. Switch to Testnet
4. Try connecting with Blade instead

### Contact Info

If nothing works, check:
- Browser: What browser are you using?
- HashPack version: Check in extension details
- Console errors: Share any red errors from console
- Network: Confirm you're on Testnet in HashPack

---

**Most Common Fix:** Make sure HashPack is set to **Testnet** in Settings!


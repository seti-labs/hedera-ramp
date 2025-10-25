# 🔄 Complete Wallet Connection Flow

## 📁 **All Files Involved in Wallet Connection**

### **🎯 Core Wallet Files**
1. **`src/services/walletManager.ts`** - Central wallet engine
2. **`src/context/WalletContext.tsx`** - State provider
3. **`src/components/WalletButton.tsx`** - Connect button
4. **`src/components/WalletConnect.tsx`** - Connection dialog

### **📱 Pages Using Wallet**
5. **`src/pages/Dashboard.tsx`** - Shows wallet info
6. **`src/pages/Landing.tsx`** - Landing page
7. **`src/pages/Profile.tsx`** - User profile
8. **`src/pages/Welcome.tsx`** - Welcome page
9. **`src/components/ProtectedRoute.tsx`** - Route protection
10. **`src/components/Navbar.tsx`** - Navigation

### **🧪 Testing & Utils**
11. **`src/utils/walletTest.ts`** - Development testing
12. **`src/App.tsx`** - Main app (imports test)

---

## 🔄 **Complete Connection Flow**

### **Phase 1: App Initialization**

```
1. App.tsx loads
   ↓
2. WalletProvider mounts (WalletContext.tsx)
   ↓
3. walletManager.getState() - Get initial state
   ↓
4. walletManager.subscribe() - Subscribe to state changes
   ↓
5. attemptAutoConnect() - Start auto-connect process
```

**Files Involved:**
- `src/App.tsx` (line 21-22: imports walletTest)
- `src/context/WalletContext.tsx` (lines 18, 27-28, 38-57)

### **Phase 2: HashPack Detection**

```
6. walletManager.checkHashPackAvailability()
   ↓
7. Check multiple detection methods:
   - window.hashconnect
   - window.HashConnect  
   - window.hashpack
   - 'hashconnect' in window
   - chrome.runtime
   ↓
8. If detected: walletManager.initialize()
   ↓
9. Import @hashgraph/hashconnect
   ↓
10. Create HashConnect instance
   ↓
11. Initialize with app metadata
```

**Files Involved:**
- `src/services/walletManager.ts` (lines 140-174, 31-65)

### **Phase 3: Auto-Connect Attempt**

```
12. walletManager.autoConnect()
   ↓
13. Check if already connected
   ↓
14. Check HashPack availability
   ↓
15. walletManager.connectWallet()
   ↓
16. Set up pairing event listener
   ↓
17. Call hashconnect.connect()
   ↓
18. HashPack popup opens (if not blocked)
```

**Files Involved:**
- `src/services/walletManager.ts` (lines 319-346, 162-201)
- `src/context/WalletContext.tsx` (lines 38-57)

### **Phase 4: User Interaction**

```
19. User approves connection in HashPack
   ↓
20. pairingEvent fires with account data
   ↓
21. Extract accountId from pairing data
   ↓
22. Update wallet state:
    - isConnected: true
    - accountId: "0.0.7123927-xfeou"
    - walletType: "hashpack"
    - balance: "0"
   ↓
23. Notify all subscribers
```

**Files Involved:**
- `src/services/walletManager.ts` (lines 176-201, 70-75, 80-85)

### **Phase 5: Balance & Backend Sync**

```
24. walletManager.getBalance()
   ↓
25. Fetch from Hedera Mirror Node API
   ↓
26. Convert tinybars to HBAR
   ↓
27. Update balance in state
   ↓
28. walletManager.syncWithBackend()
   ↓
29. POST /api/wallet/account
   ↓
30. Update backend with wallet info
```

**Files Involved:**
- `src/services/walletManager.ts` (lines 104-128, 207-239)
- `src/context/WalletContext.tsx` (lines 67-78)

### **Phase 6: Component Updates**

```
31. All components receive new state
   ↓
32. WalletButton shows connected state
   ↓
33. Dashboard shows balance
   ↓
34. Navbar shows wallet info
   ↓
35. ProtectedRoute allows access
```

**Files Involved:**
- `src/components/WalletButton.tsx` (lines 16, 39-70)
- `src/pages/Dashboard.tsx` (lines 21, 22)
- `src/components/Navbar.tsx` (lines 11)
- `src/components/ProtectedRoute.tsx` (lines 13)

---

## 🐛 **Potential Failure Points**

### **Detection Failures**
- HashPack extension not installed
- Extension not unlocked
- Browser compatibility issues
- Network connectivity problems

### **Connection Failures**
- Popup blockers preventing HashPack popup
- User cancels connection
- Network timeout
- HashConnect initialization errors

### **Sync Failures**
- Backend server not running
- API authentication issues
- Network connectivity to Hedera Mirror Node
- Invalid account data

---

## 🔧 **Debug Commands**

### **Check Current State**
```typescript
// In browser console
console.log('Wallet state:', walletManager.getState());
```

### **Test Detection**
```typescript
// In browser console
walletManager.checkHashPackAvailability().then(console.log);
```

### **Test Connection**
```typescript
// In browser console
walletManager.autoConnect().then(console.log);
```

### **Manual Connection**
```typescript
// In browser console
walletManager.connectWallet().then(() => {
  console.log('Connected:', walletManager.getState());
});
```

---

## 📊 **Flow Summary**

```
App Start → WalletProvider → Auto-Connect → HashPack Detection → 
Initialize HashConnect → Connect Wallet → User Approval → 
Extract Account → Update State → Get Balance → Sync Backend → 
Notify Components → UI Updates
```

**Total Files: 12**
**Total Steps: 35**
**Key Components: 4**
**API Calls: 3** (HashConnect, Mirror Node, Backend)

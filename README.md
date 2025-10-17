STACK
- Framework: Expo (React Native + TypeScript)
- UI: NativeWind (TailwindCSS for React Native)
- Wallet Integration: Hedera via WalletConnect or Blade/HashPack mobile SDKs
- Backend: Flask REST API (mocked for now)
- Network: Hedera Testnet
- State Management: React Context + AsyncStorage for persistence
- Navigation: React Navigation (Bottom Tabs + Stack)

APP STRUCTURE & FEATURES
1. **Authentication & KYC**
   - Simple login/register flow (email/password, stored locally for demo)
   - “Verify Identity” screen simulating KYC (photo upload + ID field)
   - Save verification state locally or from backend `/api/kyc`

2. **Wallet Connection**
   - “Connect Wallet” screen using WalletConnect to link HashPack or Blade wallet
   - Display connected account ID + HBAR balance (via Mirror Node REST API)
   - Context provider for wallet state (`WalletContext`)

3. **On-Ramp (Fiat → Crypto)**
   - Form: enter fiat amount (USD)
   - Choose mock payment method (“Card”, “Bank Transfer”)
   - “Deposit” button → POST `/api/onramp`
   - After confirmation, show Hedera transaction hash + success message.

4. **Off-Ramp (Crypto → Fiat)**
   - Form: enter token amount to convert to fiat
   - “Withdraw” button → POST `/api/offramp`
   - Displays simulated payout confirmation (fiat amount + transaction hash)

5. **Dashboard**
   - Shows:
     - Wallet balance (Hedera Testnet)
     - Recent transactions (from `/api/dashboard`)
     - KYC status badge
   - Buttons: “On-Ramp”, “Off-Ramp”, “Profile”

6. **Profile**
   - View/update user info
   - KYC status
   - Connected wallet ID
   - Logout button

7. **Security**
   - Never store private keys in the app.
   - Use WalletConnect for transaction signing.
   - API requests authenticated via JWT token from backend.

8. **Navigation**
   - Bottom tab bar: `Dashboard | On-Ramp | Off-Ramp | Profile`
   - Stack navigation for auth and KYC screens.

9. **Developer Setup**
   - Include:
     - `app.json`, `package.json`, `tsconfig.json`
     - `.env.example` with `API_BASE_URL`, `HEDERA_NETWORK`
     - Tailwind config via `nativewind`
   - Commands:
     ```
     npx create-expo-app hedera-ramp
     cd hedera-ramp
     npm install nativewind react-navigation axios @react-native-async-storage/async-storage
     npm start
     ```

10. **Deliverables**
   - `App.tsx` (entry point)
   - `src/navigation/AppNavigator.tsx`
   - `src/context/AuthContext.tsx`
   - `src/context/WalletContext.tsx`
   - `src/screens/LoginScreen.tsx`
   - `src/screens/DashboardScreen.tsx`
   - `src/screens/OnRampScreen.tsx`
   - `src/screens/OffRampScreen.tsx`
   - `src/screens/ProfileScreen.tsx`
   - `src/components/WalletButton.tsx`, `TransactionCard.tsx`
   - `src/hooks/useAPI.ts`, `src/hooks/useWallet.ts`
   - Tailwind + theme configuration
   - README.md with setup & run instructions

Provide:
- Full folder structure
- Sample code for connecting to WalletConnect and calling the Flask backend
- Mocked transaction data for UI testing
- Clear inline comments explaining each part

Goal: fully functional Expo app scaffold that can run on iOS/Android simulators, connect to Flask backend later, and interact with Hedera Testnet via wallet.

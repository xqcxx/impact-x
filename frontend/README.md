# Impact-X Frontend

Cross-chain crowdfunding platform frontend built with React, TypeScript, and Vite.

## Features

- **Campaign Creation**: Create campaigns with rich text stories and IPFS metadata storage
- **Dual Wallet Support**: Connect with Ethereum (RainbowKit) and Stacks wallets
- **Escrow Donations**: Secure USDCx donations held in smart contract escrow
- **Campaign Discovery**: Browse, search, and filter campaigns by category
- **My Campaigns**: Dashboard for campaign creators to manage and claim funds

## Tech Stack

- React 19.2 + TypeScript
- Vite 7.3 (Build tool)
- TailwindCSS (Styling with Glassmorphism)
- TipTap (Rich text editor)
- Stacks.js (Blockchain integration)
- RainbowKit (Ethereum wallets)

## Getting Started

```bash
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
VITE_PINATA_JWT=your_pinata_jwt
VITE_NETWORK=testnet
```

## Build

```bash
npm run build
```

Built application will be in `dist/` folder.

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

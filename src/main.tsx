import './polyfills';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux/';
import { store } from '@/app/store'; // order this early
import { BrowserRouter } from 'react-router-dom';
import App from './App';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { setup, strict, voidSheet } from 'twind';

import '@/styles/colors.css';
import '@/styles/base.css';
import '@/styles/components.css';
import '@/styles/utils.css';
import '@/styles/main.css';

setup({
  preflight: false, // do not include base style reset (default: use tailwind preflight)
  mode: 'warn', // throw errors for invalid rules (default: warn)
  hash: false, // hash all generated class names (default: false)
  theme: {}, // define custom theme values (default: tailwind theme)
  darkMode: 'class', // use a different dark mode strategy (default: 'media')
});

import { chains as skaleChains } from '@/features/network/chains';
import { WagmiConfig, createClient, configureChains, mainnet } from 'wagmi';
import { ConnectKitProvider, getDefaultClient } from 'connectkit';

import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';

const chains = [mainnet, ...Object.values(skaleChains.staging)];

const { provider } = configureChains(chains, [
  jsonRpcProvider({
    rpc: (chain) => {
      return chain?.rpcUrls
        ? {
            http: chain.rpcUrls.default.http[0],
          }
        : null;
    },
  }),
]);

const alchemyId = 'wee';

const wagmiClient = createClient(
  getDefaultClient({
    appName: 'SKALE Admin UI',
    alchemyId, // for wallet-connect
    provider,
    chains,
  }),
);

const queryClient = new QueryClient();

// beware: context hell beyond level-6 nesting

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <WagmiConfig client={wagmiClient}>
          <BrowserRouter>
            <ConnectKitProvider theme="nouns">
              <App />
            </ConnectKitProvider>
          </BrowserRouter>
        </WagmiConfig>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
);

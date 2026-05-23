import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import store from '@/redux/store';
import ClerkSetupRequired from '@/components/auth/ClerkSetupRequired';
import { getClerkPublishableKey } from '@/lib/clerkKey';
import '@/index.css';

const root = createRoot(document.getElementById('root')!);
const publishableKey = getClerkPublishableKey();

if (!publishableKey) {
  root.render(
    <StrictMode>
      <ClerkSetupRequired />
    </StrictMode>,
  );
} else {
  root.render(
    <StrictMode>
      <ClerkProvider
        publishableKey={publishableKey}
        afterSignOutUrl="/"
        signInFallbackRedirectUrl="/onboarding"
        signUpFallbackRedirectUrl="/onboarding"
      >
        <Provider store={store}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Provider>
      </ClerkProvider>
    </StrictMode>,
  );
}

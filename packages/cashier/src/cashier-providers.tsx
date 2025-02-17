import React from 'react';
import { APIProvider } from '@deriv/api';
import { StoreProvider } from '@deriv/stores';
import { ThemeProvider } from '@deriv/ui';
import { CashierStoreProvider } from './stores/useCashierStores';
import { TRootStore } from 'Types';

const CashierProviders = ({ children, store }: React.PropsWithChildren<{ store: TRootStore }>) => {
    return (
        <StoreProvider store={store}>
            <CashierStoreProvider>
                <APIProvider>
                    <ThemeProvider>{children}</ThemeProvider>
                </APIProvider>
            </CashierStoreProvider>
        </StoreProvider>
    );
};

export default CashierProviders;

import { action, observable, makeObservable } from 'mobx';
import { isCryptocurrency } from '@deriv/shared';
import { TWebSocket, TRootStore, TServerError } from 'Types';

export type TTransactionItem = {
    address_hash: string;
    address_url: string;
    amount: number;
    id: string;
    is_valid_to_cancel: number;
    status_code: string;
    status_message: string;
    submit_date: number;
    transaction_type: string;
};

type TSubscribeCashierPayments = {
    error: TServerError;
    cashier_payments: { crypto: Array<TTransactionItem> };
};

export default class TransactionHistoryStore {
    constructor(public WS: TWebSocket, public root_store: TRootStore) {
        makeObservable(this, {
            crypto_transactions: observable,
            is_crypto_transactions_cancel_modal_visible: observable,
            is_crypto_transactions_status_modal_visible: observable,
            is_crypto_transactions_visible: observable,
            is_loading: observable,
            selected_crypto_transaction_id: observable,
            selected_crypto_status: observable,
            selected_crypto_status_description: observable,
            onMount: action.bound,
            unsubscribeCryptoTransactions: action.bound,
            getCryptoTransactions: action.bound,
            setCryptoTransactionsHistory: action.bound,
            updateCryptoTransactions: action.bound,
            sortCryptoTransactions: action.bound,
            cancelCryptoTransaction: action.bound,
            setSelectedCryptoTransactionId: action.bound,
            setIsCryptoTransactionsCancelModalVisible: action.bound,
            showCryptoTransactionsCancelModal: action.bound,
            hideCryptoTransactionsCancelModal: action.bound,
            setSelectedCryptoStatus: action.bound,
            setSelectedCryptoStatusDescription: action.bound,
            setIsCryptoTransactionsStatusModalVisible: action.bound,
            showCryptoTransactionsStatusModal: action.bound,
            hideCryptoTransactionsStatusModal: action.bound,
            setLoading: action.bound,
            setIsCryptoTransactionsVisible: action.bound,
        });

        this.root_store = root_store;
        this.WS = WS;
    }
    crypto_transactions: Array<TTransactionItem> = [];
    is_crypto_transactions_cancel_modal_visible = false;
    is_crypto_transactions_status_modal_visible = false;
    is_crypto_transactions_visible = false;
    is_loading = false;
    selected_crypto_transaction_id = '';
    selected_crypto_status = '';
    selected_crypto_status_description = '';

    async onMount() {
        const { currency, switched } = this.root_store.client;
        const is_crypto = !!currency && isCryptocurrency(currency);

        if (is_crypto && !switched) {
            this.setLoading(true);
            await this.unsubscribeCryptoTransactions();
            await this.getCryptoTransactions();
            this.setLoading(false);
        }
    }

    async unsubscribeCryptoTransactions() {
        await this.WS.authorized.cashierPayments?.({ provider: 'crypto', transaction_type: 'all' }).then(response => {
            if (!response.error) {
                const { crypto } = response.cashier_payments;
                this.setCryptoTransactionsHistory(crypto);
            }
        });
    }

    async getCryptoTransactions(): Promise<void> {
        await this.WS.subscribeCashierPayments?.((response: TSubscribeCashierPayments) => {
            if (!response.error) {
                const { crypto } = response.cashier_payments;
                this.updateCryptoTransactions(crypto);
            }
        });
    }

    setCryptoTransactionsHistory(transactions: Array<TTransactionItem>): void {
        this.crypto_transactions = transactions;
        this.sortCryptoTransactions();
    }

    updateCryptoTransactions(transactions: Array<TTransactionItem>): void {
        transactions.forEach(transaction => {
            const index = this.crypto_transactions.findIndex(crypto => crypto.id === transaction.id);
            if (index === -1) {
                this.crypto_transactions.push(transaction);
            } else {
                Object.assign(this.crypto_transactions[index], transaction);
            }
        });
        this.sortCryptoTransactions();
    }

    sortCryptoTransactions(): void {
        this.crypto_transactions = this.crypto_transactions.slice().sort((a, b) => b.submit_date - a.submit_date);
    }

    async cancelCryptoTransaction(transaction_id: string): Promise<void> {
        await this.WS.cancelCryptoTransaction?.(transaction_id).then(response => {
            if (!response.error) {
                this.setSelectedCryptoTransactionId('');
                this.setIsCryptoTransactionsCancelModalVisible(false);
                return Promise.resolve(response);
            }
            return Promise.reject(response.error);
        });
    }

    setSelectedCryptoTransactionId(id: string): void {
        this.selected_crypto_transaction_id = id;
    }

    setIsCryptoTransactionsCancelModalVisible(is_visible: boolean): void {
        this.is_crypto_transactions_cancel_modal_visible = is_visible;
    }

    showCryptoTransactionsCancelModal(id: string): void {
        this.setSelectedCryptoTransactionId(id);
        this.setIsCryptoTransactionsCancelModalVisible(true);
    }

    hideCryptoTransactionsCancelModal(): void {
        this.setSelectedCryptoTransactionId('');
        this.setIsCryptoTransactionsCancelModalVisible(false);
    }

    setSelectedCryptoStatus(status: string): void {
        this.selected_crypto_status = status;
    }

    setSelectedCryptoStatusDescription(description: string): void {
        this.selected_crypto_status_description = description;
    }

    setIsCryptoTransactionsStatusModalVisible(is_visible: boolean): void {
        this.is_crypto_transactions_status_modal_visible = is_visible;
    }

    showCryptoTransactionsStatusModal(description: string, name: string): void {
        this.setSelectedCryptoStatusDescription(description);
        this.setSelectedCryptoStatus(name);
        this.setIsCryptoTransactionsStatusModalVisible(true);
    }

    hideCryptoTransactionsStatusModal(): void {
        this.setIsCryptoTransactionsStatusModalVisible(false);
    }

    setLoading(is_loading: boolean): void {
        this.is_loading = is_loading;
    }

    setIsCryptoTransactionsVisible(is_visible: boolean): void {
        this.is_crypto_transactions_visible = is_visible;
    }
}

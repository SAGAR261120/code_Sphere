import api from '../lib/axios.js';

export const walletService = {
  getWallet: () => api.get('/wallet'),
  getTransactions: (page = 1) => api.get('/wallet/transactions', { params: { page } }),
  getCoinTransactions: (page = 1) => api.get('/wallet/coin-transactions', { params: { page } }),
  initiateDeposit: (data) => api.post('/wallet/deposit/initiate', data),
  verifyRazorpayDeposit: (data) => api.post('/wallet/deposit/verify-razorpay', data),
  submitManualDeposit: (formData) =>
    api.post('/wallet/deposit/manual', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

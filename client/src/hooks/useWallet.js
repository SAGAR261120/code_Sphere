import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { walletService } from '../services/wallet.service.js';

export function useWalletData() {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletService.getWallet().then((r) => r.data.data),
  });
}

export function useWalletTransactions(page = 1) {
  return useQuery({
    queryKey: ['wallet-transactions', page],
    queryFn: () => walletService.getTransactions(page).then((r) => r.data.data),
  });
}

export function useCoinTransactions(page = 1) {
  return useQuery({
    queryKey: ['coin-transactions', page],
    queryFn: () => walletService.getCoinTransactions(page).then((r) => r.data.data),
  });
}

export function useInitiateDeposit() {
  return useMutation({
    mutationFn: (data) => walletService.initiateDeposit(data).then((r) => r.data.data),
    onError: (err) => toast.error(err.response?.data?.message || 'Deposit failed'),
  });
}

export function useVerifyDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => walletService.verifyRazorpayDeposit(data).then((r) => r.data),
    onSuccess: () => {
      toast.success('Wallet credited successfully!');
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Verification failed'),
  });
}

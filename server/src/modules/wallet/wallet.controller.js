import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import * as walletService from './wallet.service.js';

export const getWalletData = asyncHandler(async (req, res) => {
  const data = await walletService.getWalletData(req.user._id);
  res.json(new ApiResponse(200, data));
});

export const getWalletTransactions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const data = await walletService.getWalletTransactions(req.user._id, page);
  res.json(new ApiResponse(200, data));
});

export const getCoinTransactions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const data = await walletService.getCoinTransactions(req.user._id, page);
  res.json(new ApiResponse(200, data));
});

export const initiateDeposit = asyncHandler(async (req, res) => {
  const { amount, method } = req.body;
  const data = await walletService.initiateDeposit(req.user._id, amount, method);
  res.status(201).json(new ApiResponse(201, data, 'Deposit initiated'));
});

export const verifyRazorpayDeposit = asyncHandler(async (req, res) => {
  await walletService.verifyRazorpayDeposit(req.user._id, req.body);
  res.json(new ApiResponse(200, null, 'Payment verified. Wallet credited.'));
});

export const submitManualDeposit = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const proofImageUrl = req.file?.location || req.file?.path || req.body.proofImageUrl;
  const data = await walletService.submitManualDeposit(req.user._id, amount, proofImageUrl);
  res.status(201).json(new ApiResponse(201, data, data.message));
});

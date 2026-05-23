import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import * as orderService from './order.service.js';

export const createOrder = asyncHandler(async (req, res) => {
  const { productId, paymentMethod, couponCode, mixedOptionIndex } = req.body;
  const result = await orderService.createOrder({
    userId: req.user._id,
    productId,
    paymentMethod,
    couponCode,
    mixedOptionIndex,
  });
  res.status(201).json(new ApiResponse(201, result, 'Order created'));
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const data = await orderService.getUserOrders(req.user._id, page);
  res.json(new ApiResponse(200, data));
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id, req.user._id);
  res.json(new ApiResponse(200, order));
});

export const getDownloadToken = asyncHandler(async (req, res) => {
  const token = await orderService.getDownloadToken(req.params.id, req.user._id);
  res.json(new ApiResponse(200, { downloadToken: token }));
});

export const adminGetAllOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const { status, search } = req.query;
  const data = await orderService.adminGetAllOrders(page, status, search);
  res.json(new ApiResponse(200, data));
});

export const processRefund = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  await orderService.processRefund(req.params.id, reason, req.user._id);
  res.json(new ApiResponse(200, null, 'Refund processed successfully'));
});

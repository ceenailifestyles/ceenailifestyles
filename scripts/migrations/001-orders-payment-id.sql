-- Migration: 001-orders-payment-id.sql
-- Description: Add razorpayPaymentId column with UNIQUE index to orders table to prevent replay attacks

ALTER TABLE `orders`
  ADD COLUMN `razorpayPaymentId` VARCHAR(191) NULL DEFAULT NULL AFTER `paymentMethod`,
  ADD UNIQUE KEY `orders_razorpayPaymentId_unique` (`razorpayPaymentId`);


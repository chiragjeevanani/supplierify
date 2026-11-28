import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import ShopPage from '../pages/ShopPage';
import ProductDetailPage from '../pages/ProductDetailPage';
import CartPage from '../pages/CartPage';
import CheckoutPage from '../pages/CheckoutPage';
import WishlistPage from '../pages/WishlistPage';
import OrderTrackingPage from '../pages/OrderTrackingPage';
import AccountPage from '../pages/AccountPage';
import LoginPage from '../pages/LoginPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import AboutPage from '../pages/AboutPage';
import ContactPage from '../pages/ContactPage';
import PrivacyPolicyPage from '../pages/PrivacyPolicyPage';
import TermsPage from '../pages/TermsPage';
import ShippingReturnPage from '../pages/ShippingReturnPage';
import GrievancePage from '../pages/GrievancePage';
import HelpSupportPage from '../pages/HelpSupportPage';
import CreditPage from '../pages/CreditPage';
import UserLayout from '../components/UserLayout';
import RequireAuth from '../components/RequireAuth';

export default function UserRoutes() {
  return (
    <UserLayout>
      <Routes>
        {/* Open to everyone: signing in, and the pages people must be able to read before they sign up */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-and-conditions" element={<TermsPage />} />
        <Route path="/shipping-and-return-policy" element={<ShippingReturnPage />} />
        <Route path="/grievance-redressal" element={<GrievancePage />} />
        <Route path="/terms" element={<Navigate to="/terms-and-conditions" replace />} />
        <Route path="/shipping-policy" element={<Navigate to="/shipping-and-return-policy" replace />} />
        <Route path="/grievance" element={<Navigate to="/grievance-redressal" replace />} />
        <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />

        {/* Everything else needs a signed-in customer */}
        <Route element={<RequireAuth />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/help-support" element={<HelpSupportPage />} />
          <Route path="/help" element={<Navigate to="/help-support" replace />} />
          <Route path="/order-tracking" element={<OrderTrackingPage />} />
          <Route path="/order-tracking/:orderId" element={<OrderTrackingPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/credit" element={<CreditPage />} />
          {/* Catch-all to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </UserLayout>
  );
}

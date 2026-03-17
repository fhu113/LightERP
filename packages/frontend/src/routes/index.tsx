import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MainLayout from '../layouts/MainLayout';
import Dashboard from '../pages/Dashboard';
import SubjectList from '../pages/master/SubjectList';
import CustomerList from '../pages/master/CustomerList';
import SupplierList from '../pages/master/SupplierList';
import MaterialList from '../pages/master/MaterialList';
import MasterDataMaintenance from '../pages/master/MasterDataMaintenance';
import SalesOrderList from '../pages/sales/SalesOrderList';
import DeliveryList from '../pages/sales/DeliveryList';
import SalesInvoiceList from '../pages/sales/SalesInvoiceList';
import ReceiptList from '../pages/sales/ReceiptList';
import PurchaseOrderList from '../pages/purchase/PurchaseOrderList';
import PurchaseReceiptList from '../pages/purchase/PurchaseReceiptList';
import PurchaseInvoiceList from '../pages/purchase/PurchaseInvoiceList';
import PaymentList from '../pages/purchase/PaymentList';
import VoucherEntry from '../pages/finance/VoucherEntry';
import VoucherList from '../pages/finance/VoucherList';
import SubjectBalance from '../pages/finance/SubjectBalance';
import SalesReport from '../pages/reports/SalesReport';
import PurchaseReport from '../pages/reports/PurchaseReport';
import InventoryReport from '../pages/reports/InventoryReport';
import DocumentQuery from '../pages/reports/DocumentQuery';
import UserManagement from '../pages/system/UserManagement';
import SystemConfig from '../pages/system/SystemConfig';
import DatabaseCleanup from '../pages/system/DatabaseCleanup';
import InventoryQuery from '../pages/inventory/InventoryQuery';
import InventoryTransactions from '../pages/inventory/InventoryTransactions';
import InventoryAdjustmentPage from '../pages/inventory/InventoryAdjustment';
import ProductionOrderList from '../pages/production/ProductionOrderList';
import ProductionReceiptList from '../pages/production/ProductionReceiptList';
import BOMList from '../pages/production/BOMList';
import LoginPage from '../pages/auth/LoginPage';
import { Spin } from 'antd';

//  ProtectedRoute - 需要登录才能访问
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  // 加载状态先显示loading，但最多2秒后显示登录页
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f0f2f5'
      }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 登录页 - 无需认证 */}
      <Route path="/login" element={<LoginPage />} />

      {/* 需要认证的路由 */}
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="master">
          <Route path="subjects" element={<SubjectList />} />
          <Route path="customers" element={<CustomerList />} />
          <Route path="suppliers" element={<SupplierList />} />
          <Route path="materials" element={<MaterialList />} />
          <Route path="maintenance" element={<MasterDataMaintenance />} />
        </Route>
        <Route path="sales">
          <Route path="orders" element={<SalesOrderList />} />
          <Route path="deliveries" element={<DeliveryList />} />
          <Route path="invoices" element={<SalesInvoiceList />} />
          <Route path="receipts" element={<ReceiptList />} />
        </Route>
        <Route path="purchase">
          <Route path="orders" element={<PurchaseOrderList />} />
          <Route path="receipts" element={<PurchaseReceiptList />} />
          <Route path="invoices" element={<PurchaseInvoiceList />} />
          <Route path="payments" element={<PaymentList />} />
        </Route>
        <Route path="production">
          <Route path="orders" element={<ProductionOrderList />} />
          <Route path="receipts" element={<ProductionReceiptList />} />
          <Route path="boms" element={<BOMList />} />
        </Route>
        <Route path="finance">
          <Route path="vouchers" element={<VoucherEntry />} />
          <Route path="voucher-list" element={<VoucherList />} />
          <Route path="balance" element={<SubjectBalance />} />
        </Route>
        <Route path="reports">
          <Route path="sales" element={<SalesReport />} />
          <Route path="purchase" element={<PurchaseReport />} />
          <Route path="inventory" element={<InventoryReport />} />
          <Route path="documents" element={<DocumentQuery />} />
        </Route>
        <Route path="inventory">
          <Route path="query" element={<InventoryQuery />} />
          <Route path="transactions" element={<InventoryTransactions />} />
          <Route path="adjustments" element={<InventoryAdjustmentPage />} />
        </Route>
        <Route path="system">
          <Route path="users" element={<UserManagement />} />
          <Route path="config" element={<SystemConfig />} />
          <Route path="cleanup" element={<DatabaseCleanup />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
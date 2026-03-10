import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Dashboard from '../pages/Dashboard';
import SubjectList from '../pages/master/SubjectList';
import CustomerList from '../pages/master/CustomerList';
import SupplierList from '../pages/master/SupplierList';
import MaterialList from '../pages/master/MaterialList';
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
import UserManagement from '../pages/system/UserManagement';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="master">
          <Route path="subjects" element={<SubjectList />} />
          {/* 预留其他主数据路由 */}
          <Route path="customers" element={<CustomerList />} />
          <Route path="suppliers" element={<SupplierList />} />
          <Route path="materials" element={<MaterialList />} />
        </Route>
        <Route path="sales">
          <Route path="orders" element={<SalesOrderList />} />
          <Route path="deliveries" element={<DeliveryList />} />
          <Route path="invoices" element={<SalesInvoiceList />} />
          <Route path="receipts" element={<ReceiptList />} />
          {/* 预留其他销售路由 */}
        </Route>
        <Route path="purchase">
          <Route path="orders" element={<PurchaseOrderList />} />
          <Route path="receipts" element={<PurchaseReceiptList />} />
          <Route path="invoices" element={<PurchaseInvoiceList />} />
          <Route path="payments" element={<PaymentList />} />
          {/* 预留其他采购路由 */}
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
        </Route>
        <Route path="system">
          <Route path="users" element={<UserManagement />} />
        </Route>
        {/* 默认重定向到首页 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
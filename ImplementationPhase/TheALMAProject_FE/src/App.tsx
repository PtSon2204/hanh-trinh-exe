import React from 'react';
// Import trang Danh sách đơn hàng mà bạn đã code
import OrderListPage from './features/orders/pages/OrderListPage';

function App() {
  return (
    // Cái div này tạo ra cái nền màu xám nhạt để nhìn đơn hàng cho rõ
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', padding: '20px' }}>
      
      {/* Gọi Component của bạn ra màn hình */}
      <OrderListPage />

    </div>
  );
}

export default App;
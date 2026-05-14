// src/features/orders/pages/OrderListPage.tsx
import React, { useEffect, useState } from 'react';
import { orderApi } from '../api/orderApi';
import type { OrderResponseDto } from '../types/index';
import type { PagedResult } from '../../../shared/types/pagination';

const OrderListPage = () => {
  // State lưu trữ dữ liệu đơn hàng
  const [orderData, setOrderData] = useState<PagedResult<OrderResponseDto> | null>(null);
  // State quản lý trạng thái đang tải
  const [loading, setLoading] = useState<boolean>(true);
  // State quản lý lỗi
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        // Tạm thời fix cứng trang 1, lấy 10 item (Sau này bạn có thể làm phân trang động)
        const data = await orderApi.getMyOrders({ pageNumber: 1, pageSize: 10 });
        setOrderData(data);
      } catch (err) {
        console.error("Lỗi khi tải đơn hàng:", err);
        setError("Không thể tải danh sách đơn hàng. Bạn đã đăng nhập chưa?");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders(); // Chạy hàm khi component vừa render
  }, []); // Mảng rỗng [] nghĩa là chỉ chạy 1 lần duy nhất

  // 1. Nếu đang tải thì hiện dòng chữ này
  if (loading) return <div style={{ padding: '20px' }}>Đang tải dữ liệu...</div>;
  
  // 2. Nếu có lỗi thì hiện màu đỏ
  if (error) return <div style={{ color: 'red', padding: '20px' }}>{error}</div>;
  
  // 3. Nếu data rỗng
  if (!orderData || orderData.data.length === 0) {
    return <div style={{ padding: '20px' }}>Bạn chưa có đơn hàng nào.</div>;
  }

  // 4. Nếu có data thì vẽ danh sách
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Lịch sử đơn hàng của tôi</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {orderData.data.map((order) => (
          <div key={order.orderId} style={{ 
            border: '1px solid #ddd', 
            padding: '15px', 
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Mã đơn: {order.orderCode}</h3>
            <p style={{ margin: '5px 0' }}>Tổng tiền: <strong>{order.totalAmount.toLocaleString('vi-VN')} VNĐ</strong></p>
            <p style={{ margin: '5px 0' }}>Trạng thái: 
              <span style={{ color: order.orderStatus === 'Processing' ? 'orange' : 'green', marginLeft: '5px' }}>
                {order.orderStatus}
              </span>
            </p>
            <p style={{ margin: '5px 0' }}>Thanh toán: {order.paymentStatus}</p>
            <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
              Ngày đặt: {new Date(order.createdAt).toLocaleDateString('vi-VN')}
            </p>
            
            <button style={{ 
              marginTop: '10px', padding: '8px 16px', 
              backgroundColor: '#007bff', color: 'white', 
              border: 'none', borderRadius: '4px', cursor: 'pointer' 
            }}>
              Xem chi tiết
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderListPage;
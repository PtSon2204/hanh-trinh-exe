// Price calculation only - color and canvas logic handled in customizer.html inline script
document.addEventListener('DOMContentLoaded', () => {
    const sizeInputs = document.querySelectorAll('.size-input');
    sizeInputs.forEach(input => {
        input.addEventListener('input', calculatePrice);
    });
});

function calculatePrice() {
    let totalQty = 0;
    const sizeInputs = document.querySelectorAll('.size-input');
    
    sizeInputs.forEach(input => {
        totalQty += parseInt(input.value) || 0;
    });
    
    const basePrice = 120000;
    const totalPrice = totalQty * basePrice;
    
    const priceDisplay = document.getElementById('total-price-display');
    const summaryDisplay = document.getElementById('qty-summary-display');
    
    if (priceDisplay) priceDisplay.textContent = totalPrice.toLocaleString('vi-VN') + 'đ';
    if (summaryDisplay) summaryDisplay.textContent = `Số lượng: ${totalQty} áo`;
}

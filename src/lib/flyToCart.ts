/**
 * Tiện ích hiệu ứng "Ném sách vào giỏ hàng" (Parabolic Fly-to-Cart Animation)
 * Tạo chuyển động vòng cung parabol mượt mà từ vị trí nút bấm / bìa sách bay thẳng vào icon giỏ hàng trên Header.
 */

export function triggerFlyToCart(
  coverUrl: string,
  startSource?: HTMLElement | MouseEvent | React.MouseEvent | TouchEvent | null
) {
  if (typeof window === 'undefined') return;

  // 1. TỌA ĐỘ BẮT ĐẦU (Nơi click hoặc vị trí cuốn sách)
  let startX = window.innerWidth / 2;
  let startY = window.innerHeight / 2;

  if (startSource) {
    if ('clientX' in startSource && typeof startSource.clientX === 'number') {
      startX = startSource.clientX;
      startY = startSource.clientY;
    } else if ('currentTarget' in startSource && (startSource.currentTarget as any)?.getBoundingClientRect) {
      const rect = (startSource.currentTarget as HTMLElement).getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
    } else if ('getBoundingClientRect' in startSource && typeof (startSource as any).getBoundingClientRect === 'function') {
      const rect = (startSource as HTMLElement).getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
    }
  }

  // 2. TỌA ĐỘ ĐÍCH ĐẾN (Icon giỏ hàng trên Header)
  const cartIcon =
    document.getElementById('header-cart-icon') ||
    document.querySelector('[data-cart-icon]') ||
    document.getElementById('header-cart-btn');

  let endX = window.innerWidth - 80;
  let endY = 40;

  if (cartIcon) {
    const rect = cartIcon.getBoundingClientRect();
    endX = rect.left + rect.width / 2;
    endY = rect.top + rect.height / 2;
  }

  // 3. TẠO PHẦN TỬ CUỐN SÁCH BAY LƯỢN (FLYING CLONE)
  const flyer = document.createElement('div');
  flyer.style.position = 'fixed';
  flyer.style.zIndex = '99999';
  flyer.style.pointerEvents = 'none';
  flyer.style.width = '55px';
  flyer.style.height = '80px';
  flyer.style.borderRadius = '10px';
  flyer.style.overflow = 'hidden';
  flyer.style.border = '2px solid #F5A623';
  flyer.style.boxShadow = '0 12px 28px rgba(245, 166, 35, 0.5), 0 4px 12px rgba(11, 31, 58, 0.3)';
  flyer.style.willChange = 'transform, opacity';
  flyer.style.transformOrigin = 'center center';

  // Chèn ảnh bìa cuốn sách
  const img = document.createElement('img');
  img.src = coverUrl;
  img.alt = 'Flying book';
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'cover';
  img.style.display = 'block';
  flyer.appendChild(img);

  document.body.appendChild(flyer);

  // 4. QUỸ ĐẠO HÌNH VÒNG CUNG PARABOL (PARABOLIC CURVE)
  const duration = 750; // ms
  const startTime = performance.now();

  // Độ cao đỉnh parabol (cong vồng lên trời)
  const horizontalDist = Math.abs(endX - startX);
  const verticalDist = Math.abs(endY - startY);
  const arcHeight = Math.max(140, Math.min(320, horizontalDist * 0.25 + verticalDist * 0.35 + 80));

  function animate(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing hàm mũ mượt mà
    const t = progress;
    // Ease-in-out cho trục hoành X
    const easeProgress = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    // Vị trí X (tiến dần về giỏ hàng)
    const currentX = startX + (endX - startX) * easeProgress - 27; // Căn giữa 55px

    // Vị trí Y (đường thẳng nối + cong parabol ngược lên trên)
    const straightY = startY + (endY - startY) * easeProgress;
    const parabola = 4 * arcHeight * t * (1 - t);
    const currentY = straightY - parabola - 40; // Căn giữa 80px

    // Thu nhỏ dần từ 1.0 xuống 0.2 và xoay nhẹ 360 độ tạo cảm giác được "ném"
    const scale = 1 - 0.78 * t;
    const rotate = t * 360;
    const opacity = t > 0.85 ? Math.max(0, (1 - t) / 0.15) : 1;

    flyer.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(${scale}) rotate(${rotate}deg)`;
    flyer.style.opacity = `${opacity}`;

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Kết thúc animation: Xóa phần tử bay
      flyer.remove();

      // Kích hoạt hiệu ứng nảy / rung lắc (bounce) của icon Giỏ Hàng trên Header
      if (cartIcon) {
        cartIcon.classList.add('animate-cart-bounce');
        setTimeout(() => {
          cartIcon.classList.remove('animate-cart-bounce');
        }, 600);
      }
    }
  }

  requestAnimationFrame(animate);
}

/* Nút chuyển sáng / tối.
 *
 * Trang luôn mở ra ở nền sáng — kể cả khi máy người đọc đang để dark mode.
 * Đó là chủ ý: nền giấy là bộ mặt của site, và ai cũng thấy đúng bộ mặt đó
 * ở lần ghé đầu tiên. Bấm nút một cái là sang tối, và lựa chọn đó nằm trong
 * localStorage của riêng máy họ, không đụng tới ai khác.
 *
 * File này chỉ xử lý cú bấm. Việc vẽ đúng màu ngay từ đầu do đoạn script
 * ngắn trong <head> của mỗi trang làm — phải chạy trước khi trang vẽ, nếu
 * không người đã chọn tối sẽ thấy một nháy trắng rồi mới đổi.
 */
(function () {
  var root = document.documentElement;
  var KEY  = 'theme';

  /* Không hỏi hệ điều hành nữa. Chưa chọn gì nghĩa là sáng. */
  function current() {
    return root.dataset.theme === 'dark' ? 'dark' : 'light';
  }

  function label(btn) {
    var next = current() === 'dark' ? 'sáng' : 'tối';
    btn.setAttribute('aria-label', 'Chuyển sang chế độ ' + next);
    btn.setAttribute('title', 'Chế độ ' + next);
  }

  var buttons = document.querySelectorAll('.theme-toggle');
  Array.prototype.forEach.call(buttons, function (btn) {
    label(btn);
    btn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem(KEY, next); } catch (e) { /* chế độ ẩn danh */ }
      Array.prototype.forEach.call(buttons, label);
    });
  });
})();

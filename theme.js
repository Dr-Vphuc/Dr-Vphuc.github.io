/* Nút chuyển sáng / tối.
 *
 * Ba trạng thái, nhưng người đọc chỉ thấy hai: khi chưa bấm gì, trang nghe
 * theo hệ điều hành (CSS lo, không cần JS). Bấm một cái là ghi đè, và lựa
 * chọn đó nằm trong localStorage của riêng máy họ.
 *
 * File này chỉ xử lý cú bấm. Việc vẽ đúng màu ngay từ đầu do đoạn script
 * ngắn trong <head> của mỗi trang làm — phải chạy trước khi trang vẽ, nếu
 * không sẽ thấy một nháy trắng rồi mới đổi sang tối.
 */
(function () {
  var root = document.documentElement;
  var KEY  = 'theme';

  function systemPrefersDark() {
    return window.matchMedia &&
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function current() {
    return root.dataset.theme || (systemPrefersDark() ? 'dark' : 'light');
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

  /* Nếu người đọc chưa chọn gì mà đổi chế độ ở hệ điều hành, màu tự đổi theo
     (CSS lo), nhưng nhãn của nút thì phải cập nhật ở đây. */
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onChange = function () {
      if (!root.dataset.theme) Array.prototype.forEach.call(buttons, label);
    };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }
})();

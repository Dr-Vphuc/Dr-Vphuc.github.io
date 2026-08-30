# Hướng dẫn

Blog tĩnh chạy trên GitHub Pages, kèm một trang soạn bài tại `/write/`.
Không có server, không có database, không tốn phí.

## Dựng lần đầu

**1. Tạo repo trên GitHub**

Đặt tên **đúng** `Dr-Vphuc.github.io`, để **Public** (Pages chỉ
miễn phí với repo public).

Đặt tên khác cũng chạy được, nhưng site sẽ nằm ở `.../ten-repo/` và mọi
đường dẫn `/style.css`, `/posts/...` trong các file sẽ hỏng. Nếu đã lỡ, phải
sửa hết thành đường dẫn tương đối.

**2. Đẩy thư mục này lên**

```bash
cd blog
git init
git add .
git commit -m "Khởi tạo blog"
git branch -M main
git remote add origin https://github.com/Dr-Vphuc/Dr-Vphuc.github.io.git
git push -u origin main
```

**3. Bật GitHub Pages**

Repo → **Settings** → **Pages** → *Source*: **Deploy from a branch** →
nhánh `main`, thư mục `/ (root)` → Save.

Chờ khoảng một phút, site lên ở `https://dr-vphuc.github.io/`.

**4. Khai báo repo cho trang soạn bài**

Mở `write/app.js`, sửa khối `CONFIG` ở đầu file:

```js
const CONFIG = {
  owner:     'Dr-Vphuc',
  repo:      'Dr-Vphuc.github.io',
  branch:    'main',
  siteTitle: 'Ghi chép triết học',
  author:    '',
};
```

Đổi tên site thì sửa thêm trong `index.html`, `about.html`, `404.html` —
mấy file đó viết tay, không sinh tự động.

**5. Tạo token**

GitHub → **Settings** → **Developer settings** → **Personal access tokens** →
**Fine-grained tokens** → *Generate new token*:

- **Repository access**: `Only select repositories` → chọn đúng repo blog
- **Permissions** → *Repository permissions* → **Contents**: `Read and write`
- Hạn dùng: 90 ngày hoặc 1 năm

Không cấp thêm quyền gì khác. Token này rò ra ngoài thì kẻ lạ cũng chỉ sửa
được đúng repo blog, không đụng được phần còn lại của tài khoản.

Vào `https://dr-vphuc.github.io/write/`, dán token, bấm lưu. Token nằm
trong `localStorage` của trình duyệt, lần sau vào là viết luôn.

**Đừng bao giờ ghi token vào file rồi push** — repo là public.

## Viết bài

Vào `/write/`:

| Thao tác | Cách làm |
|---|---|
| Bài mới | Ô chọn để ở *— Bài mới —*, gõ tiêu đề rồi viết |
| Sửa bài cũ | Chọn tên bài trong ô bên cạnh tiêu đề |
| Đậm / nghiêng | Bôi đen rồi bấm **B** / *I*, hoặc Ctrl+B / Ctrl+I |
| Tiêu đề mục | Đặt con trỏ vào dòng, bấm **H2** (hoặc H3 cho mục con) |
| Trích dẫn, danh sách | Bôi đen mấy dòng rồi bấm nút tương ứng |
| Đường dẫn | Bôi đen chữ, bấm **Link** (Ctrl+K), sửa phần `https://` |
| Chú thích cuối trang | Đặt con trỏ trong câu, bấm **Chú thích**, gõ nội dung ở dòng cuối |
| Đăng | Bấm **Đăng** → xem lại → **Xác nhận đăng** |

Khung bên phải là bài thật, đúng font và giao diện người đọc sẽ thấy.

Bài đang viết tự lưu vào máy sau mỗi lần ngừng gõ. Đóng nhầm tab thì mở lại
`/write/` là còn nguyên. Ctrl+S lưu ngay lập tức.

Đăng xong, GitHub Pages dựng lại mất khoảng **30–60 giây**.

### Sửa bài đã đăng

Chọn bài trong ô, sửa, đăng lại. **Đường dẫn không đổi** kể cả khi bạn sửa
tiêu đề — cố ý như vậy, để link đã chia sẻ không chết. Ngày đăng giữ nguyên,
bài sẽ hiện thêm "cập nhật ngày …".

Muốn đổi hẳn đường dẫn thì phải làm tay: đổi tên thư mục trong `posts/` và
sửa dòng tương ứng trong `index.html`.

### Xoá bài

Chưa có nút xoá. Làm tay: xoá thư mục `posts/<slug>/` và xoá dòng `<li>`
tương ứng trong `index.html`, rồi commit.

## Cấu trúc

```
.nojekyll              tắt Jekyll của GitHub Pages — đừng xoá
index.html             trang chủ; danh sách bài nằm giữa hai dấu mốc
                       <!--POSTS_START--> và <!--POSTS_END--> (đừng xoá)
about.html             trang giới thiệu, sửa tay
404.html               trang báo không tìm thấy
style.css              toàn bộ giao diện, khoảng 200 dòng
posts/<slug>/index.md    bản gốc bạn soạn
posts/<slug>/index.html  bản người đọc xem (không cần JavaScript)
write/                 trang soạn bài — chỉ mình bạn dùng
```

Mỗi lần đăng, trang soạn bài ghi cả ba file (`index.md`, `index.html`,
`index.html` ở gốc) trong **đúng một commit**, nên không có chuyện bài đã lên
mà trang chủ chưa cập nhật.

## Xem thử trên máy trước khi push

```bash
cd blog
python -m http.server 8765
```

Rồi mở `http://localhost:8765/`. Cần chạy qua server thật (không mở file
trực tiếp) vì các đường dẫn trong site bắt đầu bằng `/`.

## Về sau

- **Bình luận**: [Giscus](https://giscus.app) — lưu ở GitHub Discussions, free.
- **Tìm kiếm**: [Pagefind](https://pagefind.app) — chạy phía trình duyệt.
- **Tên miền riêng**: mua tên miền, thêm file `CNAME` chứa tên miền, trỏ DNS
  theo hướng dẫn của GitHub Pages.
- **Đổi font**: thêm `<link>` Google Fonts vào các file HTML rồi sửa biến
  `--serif` trong `style.css`. Chọn font có bộ ký tự Vietnamese.
- **Chuyển sang Hugo/Astro**: các file `posts/*/index.md` đã có sẵn frontmatter
  `title` / `date`, copy thẳng sang là chạy. Đường dẫn `/posts/<slug>/` cũng
  trùng với cách Hugo và Astro sinh URL, nên link cũ không chết.

## Giới hạn cần biết

- Trang `/write/` ai vào cũng xem được — nó không phải chỗ bảo mật. Cái chặn
  người lạ là token, mà token chỉ nằm trong trình duyệt của bạn.
- Repo là public, nên mọi thứ commit lên đều công khai, kể cả bài nháp.
  Nháp chưa đăng thì chỉ nằm trong máy bạn, chưa lên GitHub.
- Chưa có upload ảnh. Tạm thời: đặt file ảnh vào `posts/<slug>/` bằng git,
  rồi chèn `![mô tả](/posts/<slug>/ten-anh.jpg)` trong bài.
- Khai báo chú thích phải nằm gọn trên **một dòng**.

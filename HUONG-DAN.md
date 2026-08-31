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
Hai bên cuộn theo nhau: cuộn bên nào thì bên kia đi theo đúng đoạn đang đọc,
và gõ thêm chữ ở giữa bài cũng không làm khung bên phải nhảy đi đâu.

Bài đang viết tự lưu vào máy sau mỗi lần ngừng gõ. Đóng nhầm tab thì mở lại
`/write/` là còn nguyên. Ctrl+S lưu ngay lập tức.

Đăng xong, GitHub Pages dựng lại mất khoảng **30–60 giây**.
Bài mới nằm trên GitHub, chưa có trong thư mục trên máy — xem mục
[Trước khi sửa trên máy](#trước-khi-sửa-trên-máy-kéo-bài-mới-về).

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
index.html             trang chủ: bìa + danh sách bài. Danh sách nằm giữa
                       <!--POSTS_START--> và <!--POSTS_END--> (đừng xoá)
art/                   tranh bìa
fonts/                 font chữ ký, bản đã cắt còn 5 chữ cái
tools/                 script cắt font — không ảnh hưởng trang web
about.html             trang giới thiệu, sửa tay
404.html               trang báo không tìm thấy
style.css              toàn bộ giao diện
theme.js               nút chuyển sáng / tối
posts/<slug>/index.md    bản gốc bạn soạn
posts/<slug>/index.html  bản người đọc xem (không cần JavaScript)
write/                 trang soạn bài — chỉ mình bạn dùng
```

Mỗi lần đăng, trang soạn bài ghi cả ba file (`index.md`, `index.html`,
`index.html` ở gốc) trong **đúng một commit**, nên không có chuyện bài đã lên
mà trang chủ chưa cập nhật.

## Tranh bìa

Đang dùng `art/spiral-of-life.webp` — *The Spiral of Life* của Alexander Butaev,
đã xin phép tác giả. Dòng ghi nguồn nằm ở chân trang `index.html`, **đừng xoá**.

File gốc `my-art.jpg` là ảnh chụp bản vẽ trên giấy, nên không dùng thẳng được:
nền giấy sẽ thành một ô chữ nhật đè lên nền site, và ánh sáng lúc chụp không
đều (góc trên sáng hơn góc dưới khoảng 50 mức). Bản đang dùng đã qua ba bước:

1. **San phẳng ánh sáng** — ước lượng trường sáng bằng bộ lọc max rồi chia ra,
   nếu không phần dưới ảnh sẽ còn một mảng xám.
2. **Chuyển độ đậm thành độ đục** — nét càng đậm càng đặc, giấy thành trong
   suốt. Ngưỡng: trắng 242, đen 85. Nhẹ tay hơn thì lộ hạt giấy khi đảo màu;
   mạnh tay hơn thì nét mỏng đi.
3. **Nén WebP** chất lượng 80, alpha 60 → 131 KB (ảnh gốc 175 KB).

Vì nét nằm trên nền trong suốt nên chế độ tối chỉ cần đảo màu là ra nét trắng,
không phải xử lý gì thêm.

Quay lại hình tạm: đổi `src` về `/art/spiral-placeholder.svg` và `height` về
`857` trong `index.html`.

### Thay bằng tranh khác

1. Đặt file vào `art/`. **Phải có nền trong suốt** (WebP/PNG có alpha, hoặc SVG).
   Ảnh chụp giấy thì phải tách nền như trên trước.
2. Sửa `src`, `width`, `height` của thẻ `<img>` trong khối `.hero-art`. Điền
   đúng kích thước thật của file để trang không giật lúc tải.
3. Viết lại `alt` mô tả tranh.
4. Sửa hoặc xoá dòng ghi nguồn ở chân trang cho khớp.

Bề rộng hiển thị là `min(42vw, 66vh, 600px)` — giới hạn theo cả chiều ngang
lẫn chiều cao khung nhìn, để tranh không bao giờ đẩy mũi cuộn ra khỏi màn hình.
Tranh nhiều màu thì phải sửa `--art-filter` trong `style.css` — quy tắc đảo màu
hiện tại chỉ hợp với tranh đơn sắc.

## Bìa toàn màn hình

Bìa cao đúng một khung nhìn (`min-height: 100svh`), nên danh sách bài nằm dưới
nếp gấp và phải cuộn mới thấy. Mũi tên góc dưới bên trái nhảy tới đó.

Vì bìa lấp kín màn hình nên **phải** có dấu hiệu báo bên dưới còn nội dung —
nếu bỏ mũi tên đi, một phần người đọc sẽ tưởng trang chỉ có bấy nhiêu.

Muốn bỏ chế độ toàn màn hình, quay về bìa ngắn như cũ: trong `style.css` xoá
hai dòng `min-height` của `.hero`, và đặt lại `min-height: 24rem` cho
`.hero-inner`.

## Về chuyện chống sao chép tranh

Ảnh bìa có đặt `pointer-events: none`, nên chuột phải không hiện "Lưu hình ảnh
thành...", và không kéo thả ảnh ra ngoài được.

**Đây là gờ giảm tốc, không phải khoá.** Không tồn tại cách chặn thật, vì trình
duyệt bắt buộc phải tải trọn ảnh về máy người xem mới vẽ được. Vẫn lấy được
bằng: chụp màn hình, gõ thẳng `…/art/spiral-of-life.webp`, mở tab Network của
DevTools, hoặc tắt JavaScript. Đừng đưa lên đây thứ gì mà bị sao chép là thiệt
hại thật.

Thứ bảo vệ thật sự là dòng ghi nguồn ở chân trang, và chữ ký của Butaev nằm sẵn
trong tranh ở góc phải dưới.

## Chữ ký

Dòng `Some thoughts on life` ở bìa có kèm chữ ký viết tay `Vphuc`, nằm trong
`index.html`:

```html
<p class="hero-tagline"><span>Some thoughts on life</span><span class="sig">Vphuc</span></p>
```

Font là **MTD Verona Lotte** (bản Việt hóa của *Verona* — Yasir Ekinci).

### Font này được cắt nhỏ, và đó là cố ý

File gốc `F:utos\MTD Verona Lotte.otf` nặng 672 KB và **không nằm trong
repo**. Thứ được đẩy lên mạng là `fonts/verona-lotte-sig.woff2`, 6 KB, chỉ
chứa đúng năm chữ cái **V p h u c**.

Hai lý do:

1. Trang tải nhanh hơn — 6 KB thay vì 672 KB cho một chữ ký.
2. Repo này công khai. Đẩy nguyên bản `.otf` lên là phát cho bất kỳ ai cả
   bộ font của người khác. Bản cắt năm chữ thì không dùng lại được vào
   việc gì.

**Muốn đổi tên trong chữ ký** thì phải làm hai bước, thiếu bước nào cũng
hỏng: sửa chữ trong `index.html`, rồi sửa `CHU_KY` trong
`tools/lam-font-chu-ky.py` và chạy:

```
pip install fonttools brotli
python tools/lam-font-chu-ky.py
```

Không chạy lại thì chữ mới không có trong font, trình duyệt sẽ rơi về
font dự phòng (Parisienne) cho riêng mấy chữ đó.

### Viết thường, không viết hoa

Font này viết hoa thì các chữ cái móc vào nhau: `VPHUC` đọc ra thành
"VP ff CIC". Chữ thường mới ra đúng tên. Đó là lý do khối
`.hero-tagline .sig` trong `style.css` không còn dòng `text-transform`.

Cũng vì nét rất mảnh nên cỡ chữ phải to: `2.8rem`. Nhỏ hơn 2rem thì trên
màn hình thường nó nhạt gần như mất.

## Chế độ sáng / tối

Trang luôn mở ra ở nền sáng — kể cả khi máy người đọc đang để dark mode.
Nền giấy là bộ mặt của site, nên ai cũng thấy đúng bộ mặt đó ở lần ghé đầu tiên.
Nút hình mặt trăng ở góc trên bên phải cho họ đổi sang tối, và lựa chọn đó
nhớ lại trong `localStorage` của riêng máy họ.

Một hệ quả cần biết: nếu bạn đã từng bấm nút chọn tối trên máy mình thì
trình duyệt vẫn nhớ, và bạn sẽ không thấy gì đổi cả. Mở DevTools → Console,
gõ `localStorage.removeItem('theme')` rồi tải lại để xem đúng thứ khách thấy.

Đổi màu thì sửa hai dòng `--l-*` (sáng) và `--d-*` (tối) ở đầu `style.css`.
Khối `:root[data-theme="dark"]` bên dưới chỉ chọn dùng bảng nào — **đừng đặt mã
màu vào đó**.

Muốn trang nghe lại theo hệ điều hành như trước: chép khối đó ra một bản
nữa, đổi bộ chọn thành `:root:not([data-theme="light"])` rồi bọc trong
`@media (prefers-color-scheme: dark)`, và đặt bản đó **trước** khối cũ — hai
khối cùng độ ưu tiên nên khối đứng sau thắng. Trong `theme.js` thì sửa hàm
`current()` cho nó hỏi lại `matchMedia`, không thì nhãn của nút sẽ nói sai.

Muốn bỏ hẳn chế độ tối: xoá khối `:root[data-theme="dark"]`, xoá `theme.js`,
và xoá thẻ `<button class="theme-toggle">` trong các file HTML (kể cả bản mẫu
trong `write/app.js`).

Trang `/write/` có bảng màu riêng và vẫn theo hệ điều hành — nó là công cụ
của bạn, không phải mặt tiền của site.

## Trước khi sửa trên máy: kéo bài mới về

Trang `/write/` đăng bài bằng cách gọi thẳng GitHub API. Bài đi từ trình duyệt
lên GitHub, **không đi qua thư mục trên máy này**. Nên mỗi lần bạn đăng một
bài là GitHub có thêm một commit mà máy bạn không có.

Thói quen cần có: **mở thư mục ra là kéo về trước, rồi mới sửa.**

```bash
cd blog
git pull
```

Muốn xem trước có gì mới rồi hẵng kéo:

```bash
git fetch
git status                      # "behind 'origin/main' by N commits"
git log --oneline main..origin/main
```

### Quên kéo thì gặp gì

Lúc push sẽ ăn nguyên câu này:

```
! [rejected]        main -> main (fetch first)
error: failed to push some refs
```

Không hỏng gì cả. Git chỉ từ chối ghi đè lên phần nó biết là bạn chưa thấy.
Chữa:

```bash
git pull --rebase     # xếp commit của bạn lên trên mấy bài vừa tải về
git push
```

`--rebase` để lịch sử thành một mạch thẳng, không sinh ra commit "Merge
branch..." mỗi lần đăng bài. Bỏ nó đi cũng chạy, chỉ là lịch sử rối hơn.

### Đang sửa dở, chưa commit

`git pull` sẽ không chịu chạy vì sợ đè mất phần bạn đang làm. Cất tạm đi rồi
lấy lại:

```bash
git stash
git pull
git stash pop
```

### Nếu nó báo xung đột

Hiếm, vì hai bên thường động vào hai chỗ khác nhau. Chỉ có hai file có thể
đụng nhau thật:

**`index.html`** — `/write/` chèn thêm dòng `<li>` của bài mới, còn bạn thì có
thể vừa sửa giao diện trang chủ. Mở file ra, xoá mấy dòng `<<<<<<<` `=======`
`>>>>>>>`, **giữ cả hai phần**: dòng `<li>` của bài mới, và phần bạn sửa. Hai
mốc `<!--POSTS_START-->` / `<!--POSTS_END-->` phải còn nguyên, trang `/write/`
đọc danh sách bài theo hai mốc đó.

**`posts/<slug>/index.html`** — chỉ xảy ra khi bạn sửa tay đúng cái bài mà
`/write/` cũng vừa đăng lại. Bản của `/write/` là bản mới hơn, lấy nó.

Sửa xong, báo cho Git biết là đã xong:

```bash
git add <file vừa sửa>
git rebase --continue      # nếu nãy chạy git pull --rebase
git commit                 # nếu nãy chạy git pull không kèm --rebase
```

Muốn bỏ hết, lùi về như chưa làm gì: `git rebase --abort` (hoặc
`git merge --abort` nếu không dùng `--rebase`).

> Đừng dùng `--ours` / `--theirs` cho nhanh nếu chưa chắc. Trong lúc *rebase*
> hai chữ đó **đảo ngược** so với lúc *merge*: `--ours` lại là bản tải từ
> GitHub về, `--theirs` mới là commit của bạn. Mở file ra sửa tay bao giờ
> cũng đúng.

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
- **Đổi font**: sửa biến `--serif` / `--ui` / `--script` trong `style.css`
  và thẻ `<link>` Google Fonts trong các file HTML. **Kiểm tra font có bộ
  `vietnamese` không** — nhiều font phổ biến không có (Poppins, Lato,
  Josefin Sans...), chữ tiếng Việt sẽ rơi về font hệ thống giữa chừng.
  Cách kiểm tra: mở link CSS của Google Fonts, tìm chuỗi `U+1EA0`.
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

/* =================================================================
   Trình soạn bài — chạy hoàn toàn trong trình duyệt.
   Đăng bài = gọi thẳng GitHub API để tạo một commit vào repo này.
   Không có server, không có backend.
   ================================================================= */

/* ---- 1. Sửa mấy dòng này một lần rồi thôi ---------------------- */

const CONFIG = {
  owner:     'Dr-Vphuc',                 // tên tài khoản GitHub
  repo:      'Dr-Vphuc.github.io',       // tên repo
  branch:    'main',                               // nhánh chính (repo cũ có thể là 'master')
  siteTitle: 'Autos',
  author:    '',                                   // để trống thì cuối trang chỉ hiện tên site
};

/* ---- 2. Tiện ích nhỏ ------------------------------------------- */

const $ = (id) => document.getElementById(id);

// btoa chỉ nhận chuỗi, mà String.fromCharCode(...cả_mảng) thì tràn ngăn xếp
// ngay với một tấm ảnh vài trăm KB. Nên cắt từng khúc.
const b64encodeBytes = (bytes) => {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
};

const b64encode = (str) => b64encodeBytes(new TextEncoder().encode(str));

const b64decode = (b64) => {
  const bin = atob(b64.replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

const escapeHtml = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const safeId = (s) => String(s).replace(/[^A-Za-z0-9_-]/g, '-');

// Bỏ dấu tiếng Việt để làm đường dẫn: "Bàn về tự do" -> "ban-ve-tu-do"
const slugify = (str) => String(str)
  .normalize('NFD').replace(/\p{Diacritic}/gu, '')   // xoá dấu thanh, dấu mũ
  .replace(/đ/g, 'd').replace(/Đ/g, 'D')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 70);

const todayISO = () => {
  const d = new Date(), p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const viDate = (iso) => {
  const [y, m, d] = String(iso).split('-').map(Number);
  return Number.isFinite(d) ? `${d} tháng ${m}, ${y}` : String(iso);
};

/* ---- 3. Markdown -> HTML, kèm chú thích cuối trang -------------- */

marked.setOptions({ gfm: true, breaks: false, headerIds: false, mangle: false });

/* Ảnh đứng riêng một khối thì thành <figure> có dòng chú thích bên dưới; ảnh
   nằm lẫn giữa câu thì vẫn chỉ là một thẻ <img>.

   Quy ước: chữ trong ![...] vừa là lời tả cho máy đọc màn hình, vừa là dòng
   chú thích — một chỗ để gõ chứ không phải hai. Khi nào cần tách hai thứ đó
   ra thì viết ![lời tả](đường-dẫn "chú thích").

   Chỗ gỡ thẻ <p> ra khỏi <figure> không phải để mã nguồn cho đẹp: <figure>
   nằm trong <p> là HTML sai, trình duyệt sẽ tự cắt <p> làm đôi, thế là một
   khối markdown hoá ra ba thẻ — mà bảng mốc cuộn ở mục 9 đếm theo khối. */
marked.use({
  renderer: {
    image(href, title, text) {
      let src;
      try { src = encodeURI(href).replace(/%25/g, '%'); } catch (_) { return text; }
      // Kích thước nằm sẵn trong tên file (xem mục 8), nhờ vậy trình duyệt
      // chừa đúng chỗ từ đầu: ảnh tải xong trang không giật, và bảng mốc cuộn
      // dựng trước lúc ảnh về vẫn còn đúng.
      const co = src.match(/-(\d{1,5})x(\d{1,5})\.[a-z0-9]+$/i);
      const kt = co ? ` width="${co[1]}" height="${co[2]}"` : '';
      // text và title đều đã được marked thoát ký tự rồi, thoát nữa là hỏng.
      return `<img src="${src}" alt="${text}"${title ? ` title="${title}"` : ''}`
           + `${kt} loading="lazy" decoding="async">`;
    },

    paragraph(text) {
      const t = text.trim();
      if (/^<img\s[^>]*>$/.test(t)) {
        const lay = (ten) => (t.match(new RegExp(` ${ten}="([^"]*)"`)) || ['', ''])[1];
        const cthich = lay('title') || lay('alt');
        if (!cthich) return t + '\n';
        // Bỏ title đi: chú thích đã hiện thành chữ bên dưới rồi, để lại thì
        // rê chuột vào ảnh lại bật thêm một cái nhãn nữa nói đúng câu đó.
        return `<figure>${t.replace(/ title="[^"]*"/, '')}`
             + `<figcaption>${cthich}</figcaption></figure>\n`;
      }
      return `<p>${t}</p>\n`;
    },
  },
});

/* Phần xử lý chú thích tách riêng vì chỗ đồng bộ cuộn cũng cần dùng: nó phải
   nhìn đúng cái văn bản mà marked nhìn thì số dòng mới khớp với ô soạn thảo.
   Hai phép thay thế dưới đây đều không thêm bớt dòng nào — dòng khai báo bị
   làm rỗng chứ không bị xoá, còn dấu hiệu trong câu chỉ đổi chữ tại chỗ. Giữ
   nguyên tính chất đó, hỏng nó là cuộn lệch. */
function tachChuThich(md) {
  const defs = new Map();

  // Gom các dòng khai báo:  [^1]: nội dung chú thích
  let text = md.replace(/^[ \t]*\[\^([^\]\s]+)\]:[ \t]*(.+)$/gm, (_m, id, body) => {
    defs.set(id, body.trim());
    return '';
  });

  // Thay dấu hiệu trong câu, đánh số theo thứ tự xuất hiện
  const order = [];
  text = text.replace(/\[\^([^\]\s]+)\]/g, (m, id) => {
    if (!defs.has(id)) return m;
    let n = order.indexOf(id);
    if (n === -1) { order.push(id); n = order.length - 1; }
    const sid = safeId(id);
    return `<sup class="fnref" id="fnref-${sid}"><a href="#fn-${sid}">${n + 1}</a></sup>`;
  });

  return { text, defs, order };
}

function renderMarkdown(md) {
  const { text, defs, order } = tachChuThich(md);

  let html = marked.parse(text).trim();

  if (order.length) {
    const items = order.map((id) => {
      const sid = safeId(id);
      return `<li id="fn-${sid}">${marked.parseInline(defs.get(id))} `
           + `<a class="fn-back" href="#fnref-${sid}">↩</a></li>`;
    }).join('\n');
    html += `\n<section class="footnotes">\n<ol>\n${items}\n</ol>\n</section>`;
  }
  return html;
}

/* Mỗi khối markdown ở cấp cao nhất bắt đầu ở dòng nào (đếm từ 0). Đây là cái
   bắc cầu giữa hai bên khi cuộn: biết khối thứ i bắt đầu ở dòng nào thì biết
   chỗ nào trong ô soạn ứng với chỗ nào trong bài đã dựng.

   Trả null khi không chắc — bên gọi sẽ lùi về cuộn chia theo tỉ lệ. Thà cuộn
   thô còn hơn cuộn sai chỗ, mà sai chỗ thì khó chịu hơn nhiều. */
function viTriDongCuaKhoi(md) {
  const demDong = (s) => (String(s).match(/\n/g) || []).length;
  const text = tachChuThich(md).text;

  let tokens;
  try { tokens = marked.lexer(text); } catch (_) { return null; }

  // Chốt an toàn: ghép độ dài các token lại phải đúng bằng văn bản. Có thứ
  // marked nuốt mất raw (dòng khai báo link kiểu [tên]: url chẳng hạn) — gặp
  // vậy thì mọi số dòng phía sau lệch hết, thà bỏ.
  let tong = 0;
  tokens.forEach((t) => { tong += demDong(t.raw); });
  if (tong !== demDong(text)) return null;

  const dong = [];
  let d = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'space') { d += demDong(t.raw); continue; }
    dong.push(d);
    d += demDong(t.raw);
    // marked gộp các token 'text' nằm liền nhau thành một thẻ <p>, nên ở đây
    // cũng phải gộp — không thì số mốc nhiều hơn số thẻ và cả bản đồ hỏng.
    if (t.type === 'text') {
      while (i + 1 < tokens.length && tokens[i + 1].type === 'text') {
        d += demDong(tokens[++i].raw);
      }
    }
  }
  return dong;
}

// Dấu hiệu chú thích chưa có dòng khai báo tương ứng — nếu bỏ sót, bài đăng ra
// sẽ hiện trơ ra "[^1]" giữa câu.
function missingFootnotes(md) {
  const defs = new Set();
  md.replace(/^[ \t]*\[\^([^\]\s]+)\]:[ \t]*(.+)$/gm, (_m, id) => { defs.add(id); return ''; });
  const refs = new Set();
  md.replace(/^[ \t]*\[\^[^\]\s]+\]:.*$/gm, '')
    .replace(/\[\^([^\]\s]+)\]/g, (_m, id) => { refs.add(id); return ''; });
  return [...refs].filter((id) => !defs.has(id));
}

/* ---- 4. Khuôn trang bài viết ------------------------------------ */

function excerpt(md, len = 155) {
  const plain = md
    .replace(/^[ \t]*\[\^[^\]]+\]:.*$/gm, '')
    .replace(/^#{1,6}\s+/gm, '').replace(/^>\s?/gm, '')
    .replace(/\[\^[^\]]+\]/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')      // ảnh: bỏ hẳn, kể cả lời tả
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#>-]/g, '')
    .replace(/\s+/g, ' ').trim();
  return plain.length > len ? plain.slice(0, len).replace(/\s\S*$/, '') + '…' : plain;
}

function buildPostHtml({ title, date, updated, bodyMd }) {
  const body = renderMarkdown(bodyMd);
  const updatedHtml = updated && updated !== date
    ? `<span class="updated">cập nhật ${viDate(updated)}</span>` : '';
  const footerLine = CONFIG.author
    ? `${escapeHtml(CONFIG.siteTitle)} · ${escapeHtml(CONFIG.author)}`
    : escapeHtml(CONFIG.siteTitle);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — ${escapeHtml(CONFIG.siteTitle)}</title>
<meta name="description" content="${escapeHtml(excerpt(bodyMd))}">
<script>try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@500;600&family=Parisienne&display=swap">
<link rel="stylesheet" href="/style.css">
<script src="/theme.js" defer></script>
</head>
<body>

<header class="site-header">
  <div class="site-header-row">
    <a class="site-title" href="/">${escapeHtml(CONFIG.siteTitle)}</a>
    <button class="theme-toggle" type="button" aria-label="Chuyển chế độ sáng tối">
      <svg class="i-moon" viewBox="0 0 16 16" aria-hidden="true"><path d="M13.6 10.1A6.1 6.1 0 0 1 5.9 2.4 6.1 6.1 0 1 0 13.6 10.1Z"/></svg>
      <svg class="i-sun" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3.3"/><path d="M8 .8v1.4M8 13.8v1.4M.8 8h1.4M13.8 8h1.4M2.9 2.9l1 1M12.1 12.1l1 1M2.9 13.1l1-1M12.1 3.9l1-1"/></svg>
    </button>
  </div>
</header>

<main>
<article class="post">
<h1>${escapeHtml(title)}</h1>
<p class="post-meta"><time datetime="${escapeHtml(date)}">${viDate(date)}</time>${updatedHtml}</p>
${body}
</article>
<p class="back"><a href="/">← Về trang chủ</a></p>
</main>

<footer class="site-footer">
  <p>${footerLine}</p>
</footer>

</body>
</html>
`;
}

/* ---- 5. Frontmatter của file .md -------------------------------- */

function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { meta: {}, body: raw };
  const meta = {};
  m[1].split(/\r?\n/).forEach((line) => {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].trim().replace(/^"(.*)"$/, '$1');
  });
  return { meta, body: raw.slice(m[0].length).replace(/^\r?\n/, '') };
}

function buildMd({ title, date, updated, body }) {
  const lines = ['---', `title: "${title.replace(/"/g, "'")}"`, `date: ${date}`];
  if (updated && updated !== date) lines.push(`updated: ${updated}`);
  lines.push('---', '', body.trim(), '');
  return lines.join('\n');
}

/* ---- 6. GitHub API --------------------------------------------- */

let token = localStorage.getItem('gh-token') || '';

async function gh(path, { method = 'GET', body } = {}) {
  const res = await fetch(
    `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}${path}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    },
  );
  if (!res.ok) {
    let detail = '';
    try { detail = (await res.json()).message || ''; } catch (_) { /* bỏ qua */ }
    const hint = res.status === 401 ? ' — token sai hoặc đã hết hạn'
               : res.status === 403 ? ' — token thiếu quyền Contents: Read and write'
               : res.status === 404 ? ' — sai owner/repo/branch trong CONFIG, hoặc token không thấy repo này'
               : '';
    throw new Error(`GitHub ${res.status}${hint}${detail ? ': ' + detail : ''}`);
  }
  return res.status === 204 ? null : res.json();
}

async function getFile(path) {
  try {
    const data = await gh(`/contents/${path}?ref=${CONFIG.branch}`);
    return b64decode(data.content);
  } catch (e) {
    if (String(e.message).includes('404')) return null;
    throw e;
  }
}

// Ghi nhiều file trong ĐÚNG MỘT commit, để không bao giờ có trạng thái nửa vời
// (bài đã lên nhưng trang chủ chưa cập nhật, hoặc ngược lại).
async function commitFiles(message, files) {
  const ref     = await gh(`/git/ref/heads/${CONFIG.branch}`);
  const headSha = ref.object.sha;
  const head    = await gh(`/git/commits/${headSha}`);

  const tree = [];
  for (const f of files) {
    // f.bytes cho file nhị phân (ảnh), f.content cho văn bản.
    const blob = await gh('/git/blobs', {
      method: 'POST',
      body: {
        content: f.bytes ? b64encodeBytes(f.bytes) : b64encode(f.content),
        encoding: 'base64',
      },
    });
    tree.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha });
  }

  const newTree = await gh('/git/trees', {
    method: 'POST', body: { base_tree: head.tree.sha, tree },
  });
  const commit = await gh('/git/commits', {
    method: 'POST', body: { message, tree: newTree.sha, parents: [headSha] },
  });
  await gh(`/git/refs/heads/${CONFIG.branch}`, { method: 'PATCH', body: { sha: commit.sha } });
  return commit.sha;
}

/* ---- 7. Danh sách bài nằm ngay trong index.html ------------------ */

const MARKERS = /(<!--POSTS_START-->)([\s\S]*?)(<!--POSTS_END-->)/;

function parseEntries(indexHtml) {
  const m = indexHtml.match(MARKERS);
  if (!m) throw new Error('index.html thiếu cặp dấu mốc POSTS_START / POSTS_END');
  const doc = new DOMParser().parseFromString(`<ul>${m[2]}</ul>`, 'text/html');
  return [...doc.querySelectorAll('li')].map((li) => ({
    slug:  (li.querySelector('a')?.getAttribute('href') || '')
             .replace(/^\/posts\//, '').replace(/\/$/, ''),
    title: (li.querySelector('a')?.textContent || '').trim(),
    date:  li.querySelector('time')?.getAttribute('datetime') || '',
  })).filter((e) => e.slug);
}

function writeEntries(indexHtml, entries) {
  // Xếp tăng dần: bài cũ nhất nằm trên cùng. Hai bài cùng ngày thì sort của
  // JavaScript giữ nguyên thứ tự cũ, mà bài mới luôn được đẩy vào cuối mảng,
  // nên trong một ngày cũng vẫn là cũ trước mới sau.
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const block = sorted.map((e) =>
    `    <li><time datetime="${escapeHtml(e.date)}">${viDate(e.date)}</time>`
  + `<a href="/posts/${e.slug}/">${escapeHtml(e.title)}</a></li>`).join('\n');
  return indexHtml.replace(MARKERS, (_m, a, _b, c) => `${a}\n${block}\n${c}`);
}

/* ---- 8. Ảnh trong bài -------------------------------------------
   Một tấm ảnh đi qua ba chặng:

     1. Ngay lúc dán, trong trình duyệt: co nhỏ lại rồi xuất WebP. Đi qua
        canvas nên rụng luôn EXIF — rụng cả toạ độ GPS mà máy ảnh điện
        thoại nhét vào mọi tấm hình. Blog công khai, không nên mang theo.
     2. Nằm chờ trong IndexedDB, cạnh bản nháp. Đóng tab mở lại vẫn còn.
     3. Bấm Đăng thì lên GitHub cùng với bài, trong đúng một commit — chứ
        không phải bài lên rồi mà ảnh còn lửng lơ.

   Tên file có dạng  anh/2026-08-31-a3f1c2d4-1600x1067.webp:
   ngày tháng để xếp cho dễ nhìn; tám ký tự băm để hai ảnh khác nhau không
   đè nhau, mà dán lại đúng tấm cũ thì trùng tên nên khỏi đẩy lần nữa; và
   kích thước để lúc dựng trang biết chừa sẵn chỗ (xem hàm image ở mục 3).
   ------------------------------------------------------------------- */

const ANH_THUMUC = 'anh';
const ANH_CANH   = 1600;    // cạnh dài nhất, tính bằng pixel
const ANH_CHAT   = 0.82;    // chất lượng WebP
// Nền lót cho ảnh trong suốt — đúng màu --l-bg trong style.css. Một bức vẽ nét
// đen trên nền trong suốt mà để nguyên thì ở chế độ tối nó biến mất hẳn: nét
// đen trên nền đen. Lót giấy vào là hai chế độ nhìn như nhau, và người dán
// thấy sao thì người đọc thấy vậy. Ảnh chụp vốn đã kín nên không đổi gì.
const ANH_NEN    = '#fbfaf7';
// Qua canvas là GIF mất động, SVG mất nét. Hai thứ này đẩy nguyên xi.
const ANH_GIU_NGUYEN = new Set(['image/gif', 'image/svg+xml']);

// Đường dẫn trong repo (anh/x.webp) làm khoá; trong bài viết thì có thêm dấu
// gạch chéo đứng đầu (/anh/x.webp) vì nó phải tính từ gốc site.
const khoaAnh = (src) => String(src).replace(/^\/+/, '');

// khoá -> { blob, url, daDang }.  url là địa chỉ blob: dùng cho khung xem trước.
const anhCho = new Map();

/* -- kho tạm trong máy -- */

const DB_TEN = 'autos-write', DB_KHO = 'anh';
let dbHua = null;

function moKho() {
  if (dbHua) return dbHua;
  dbHua = new Promise((xong, hong) => {
    const r = indexedDB.open(DB_TEN, 1);
    r.onupgradeneeded = () => {
      if (!r.result.objectStoreNames.contains(DB_KHO)) {
        r.result.createObjectStore(DB_KHO, { keyPath: 'path' });
      }
    };
    r.onsuccess = () => xong(r.result);
    r.onerror = () => hong(r.error);
    // Chế độ ẩn danh chặn IndexedDB. Chịu — ảnh vẫn chèn và đăng được như
    // thường, chỉ là đóng tab thì mất, nên đừng để hỏng cả trình soạn.
  }).catch(() => null);
  return dbHua;
}

async function khoLam(quyen, viec) {
  const db = await moKho();
  if (!db) return null;
  return new Promise((xong) => {
    let kq = null;
    const t = db.transaction(DB_KHO, quyen);
    const yc = viec(t.objectStore(DB_KHO));
    if (yc) yc.onsuccess = () => { kq = yc.result; };
    t.oncomplete = () => xong(kq);
    t.onerror = t.onabort = () => xong(null);
  });
}

const khoGhi = (rec)  => khoLam('readwrite', (s) => s.put(rec));
const khoXoa = (path) => khoLam('readwrite', (s) => s.delete(path));

// Ảnh đã đăng thì bản trên GitHub mới là bản thật; giữ lại một tháng cho những
// lần sửa bài liền sau đó, rồi dọn để kho khỏi phình ra mãi.
const ANH_HAN = 30 * 24 * 60 * 60 * 1000;

async function napKhoAnh() {
  const ds = (await khoLam('readonly', (s) => s.getAll())) || [];
  const gio = Date.now();
  ds.forEach((r) => {
    if (!r || !r.blob) return;
    if (r.daDang && gio - (r.ts || 0) > ANH_HAN) { khoXoa(r.path); return; }
    anhCho.set(r.path, {
      blob: r.blob, url: URL.createObjectURL(r.blob), daDang: !!r.daDang,
    });
  });
}

/* -- đọc, co nhỏ, đặt tên -- */

async function docAnh(file) {
  if (window.createImageBitmap) {
    // from-image: ảnh chụp dọc bằng điện thoại nằm ngang trong file, chỉ có
    // một thẻ EXIF bảo xoay. Bỏ qua thẻ đó là ảnh đăng lên bị nằm nghiêng.
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); }
    catch (_) { /* trình duyệt cũ: quay về cách dưới */ }
  }
  return new Promise((xong, hong) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload  = () => { URL.revokeObjectURL(url); xong(im); };
    im.onerror = () => { URL.revokeObjectURL(url); hong(new Error('không đọc được ảnh')); };
    im.src = url;
  });
}

async function nenAnh(file) {
  if (ANH_GIU_NGUYEN.has(file.type)) {
    return {
      blob: file, duoi: file.type === 'image/gif' ? 'gif' : 'svg', w: 0, h: 0,
    };
  }

  const goc = await docAnh(file);
  const w0 = goc.width, h0 = goc.height;
  if (!w0 || !h0) throw new Error('ảnh rỗng');

  const ti = Math.min(1, ANH_CANH / Math.max(w0, h0));   // chỉ thu, không phóng
  const w = Math.max(1, Math.round(w0 * ti));
  const h = Math.max(1, Math.round(h0 * ti));

  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  g.fillStyle = ANH_NEN;
  g.fillRect(0, 0, w, h);
  g.drawImage(goc, 0, 0, w, h);
  if (goc.close) goc.close();

  const blob = await new Promise((xong) => cv.toBlob(xong, 'image/webp', ANH_CHAT));
  if (!blob) throw new Error('trình duyệt này không xuất được WebP');
  return { blob, duoi: 'webp', w, h };
}

async function bamNgan(blob) {
  const h = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return [...new Uint8Array(h).slice(0, 4)]
    .map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Nhận một file, trả về đường dẫn để viết vào bài.
async function nhanAnh(file) {
  const a = await nenAnh(file);
  const ma = await bamNgan(a.blob);
  const co = a.w && a.h ? `-${a.w}x${a.h}` : '';
  const path = `${ANH_THUMUC}/${todayISO()}-${ma}${co}.${a.duoi}`;

  if (!anhCho.has(path)) {
    anhCho.set(path, { blob: a.blob, url: URL.createObjectURL(a.blob), daDang: false });
    khoGhi({ path, blob: a.blob, daDang: false, ts: Date.now() });
  }
  return '/' + path;
}

// Bắt cả ![](...) lẫn <img src="..."> viết tay, nên quét thẳng đường dẫn.
function anhTrongBai(md) {
  const thay = String(md).match(/\/anh\/[A-Za-z0-9._-]+/g) || [];
  return [...new Set(thay.map(khoaAnh))];
}

/* ---- 9. Giao diện ----------------------------------------------- */

const state = { editing: null, date: null, entries: [] };
let armed = false;   // đã bấm "Đăng", đang chờ xác nhận

function say(text, kind = '') {
  const el = $('msg');
  el.className = kind;
  el.innerHTML = text;
}

/* -- token -- */

async function unlock() {
  if (CONFIG.owner.startsWith('TEN-GITHUB')) {
    $('gate-msg').textContent =
      'Chưa điền owner/repo: mở file write/app.js và sửa khối CONFIG ở đầu file.';
    return false;
  }
  try {
    await gh('');                       // gọi thử để kiểm tra token và CONFIG
  } catch (e) {
    $('gate-msg').textContent = e.message;
    return false;
  }
  $('gate').classList.add('hidden');
  $('app').classList.remove('hidden');
  try {
    await refreshEntries();
  } catch (e) {
    say(escapeHtml(e.message), 'err');
  }
  // Trước khi dựng khung xem trước, vì bản nháp có thể đang trỏ vào ảnh chưa đăng.
  try { await napKhoAnh(); } catch (_) { /* không có kho thì ảnh chỉ sống trong phiên này */ }
  restoreDraft();
  updateSlugInfo();
  renderPreview();
  return true;
}

$('token-save').addEventListener('click', async () => {
  const v = $('token-input').value.trim();
  if (!v) return;
  token = v;
  $('gate-msg').textContent = 'Đang kiểm tra…';
  if (await unlock()) localStorage.setItem('gh-token', token);
});

$('token-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $('token-save').click();
});

/* -- danh sách bài trong ô chọn -- */

async function refreshEntries() {
  const indexHtml = await getFile('index.html');
  if (indexHtml === null) throw new Error('Không tìm thấy index.html trong repo');
  state.entries = parseEntries(indexHtml);
  const picker = $('picker');
  picker.innerHTML = '<option value="">— Bài mới —</option>'
    + state.entries.map((e) =>
        `<option value="${escapeHtml(e.slug)}">${escapeHtml(e.title)}</option>`).join('');
  picker.value = state.editing || '';
}

$('picker').addEventListener('change', async (e) => {
  const slug = e.target.value;
  disarm();
  if (!slug) { newPost(); return; }
  say('Đang tải bài…');
  try {
    const raw = await getFile(`posts/${slug}/index.md`);
    if (raw === null) throw new Error(`Không thấy posts/${slug}/index.md`);
    const { meta, body } = parseFrontmatter(raw);
    state.editing = slug;
    state.date = meta.date || todayISO();
    $('title').value = meta.title || '';
    $('editor').value = body;
    say('');
    $('draft-info').textContent = '';
    updateSlugInfo();
    renderPreview();
    offerDraft(slug);
  } catch (err) {
    say(escapeHtml(err.message), 'err');
  }
});

function newPost() {
  state.editing = null;
  state.date = null;
  $('title').value = '';
  $('editor').value = '';
  $('picker').value = '';
  say('');
  restoreDraft();
  updateSlugInfo();
  renderPreview();
}

/* -- thanh công cụ -- */

const ed = $('editor');

function surround(before, after) {
  const { selectionStart: s, selectionEnd: e, value: v } = ed;
  const sel = v.slice(s, e);
  // Khoảng trắng phải nằm NGOÀI cặp dấu, nếu không Markdown không hiểu:
  // "**đậm **" là chữ thường, "**đậm** " mới là chữ đậm. Bấm đúp chọn một từ
  // thường dính luôn dấu cách phía sau, nên chỗ này hay sai.
  const lead = sel.match(/^\s*/)[0];
  const tail = sel.slice(lead.length).match(/\s*$/)[0];
  const core = sel.slice(lead.length, sel.length - tail.length);
  ed.value = v.slice(0, s) + lead + before + core + after + tail + v.slice(e);
  const start = s + lead.length + before.length;
  ed.focus();
  ed.setSelectionRange(start, start + core.length);
  onEdit();
}

function prefixLines(prefix, numbered = false) {
  const { selectionStart: s, selectionEnd: e, value: v } = ed;
  const start = v.lastIndexOf('\n', Math.max(0, s - 1)) + 1;
  const nl = v.indexOf('\n', e);
  const end = nl === -1 ? v.length : nl;
  const block = v.slice(start, end).split('\n')
    .map((line, i) => (numbered ? `${i + 1}. ` : prefix)
                    + line.replace(/^\s*([#>]+\s*|[-*]\s+|\d+\.\s+)/, ''))
    .join('\n');
  ed.value = v.slice(0, start) + block + v.slice(end);
  ed.focus();
  ed.setSelectionRange(start + block.length, start + block.length);
  onEdit();
}

function insertAt(text) {
  const { selectionStart: s, value: v } = ed;
  ed.value = v.slice(0, s) + text + v.slice(ed.selectionEnd);
  ed.focus();
  ed.setSelectionRange(s + text.length, s + text.length);
  onEdit();
}

function addFootnote() {
  const { selectionStart: s, value: v } = ed;

  // Sau khi thêm một chú thích, con trỏ nằm ở cuối dòng khai báo. Bấm tiếp
  // mà không chặn thì dấu hiệu mới rơi vào giữa phần khai báo -> vô nghĩa.
  const from = v.lastIndexOf('\n', Math.max(0, s - 1)) + 1;
  const nl = v.indexOf('\n', s);
  const line = v.slice(from, nl === -1 ? v.length : nl);
  if (/^\s*\[\^[^\]]*\]:/.test(line)) {
    say('Con trỏ đang ở dòng khai báo chú thích — bấm vào chỗ trong bài trước đã.', 'err');
    return;
  }

  let n = 1;
  while (v.includes(`[^${n}]`)) n += 1;             // nhãn kế tiếp chưa dùng
  const withMarker = v.slice(0, s) + `[^${n}]` + v.slice(ed.selectionEnd);
  ed.value = withMarker.replace(/\s*$/, '') + `\n\n[^${n}]: `;
  ed.focus();
  ed.setSelectionRange(ed.value.length, ed.value.length);
  onEdit();
  say(`Đã thêm chú thích ${n} — gõ nội dung ở dòng cuối cùng.`);
}

/* -- chèn ảnh -- */

const CHU_THICH_MAU = 'Chú thích';
let dangXuLyAnh = false;

function chenAnh(duongDan) {
  const v = ed.value;
  const truoc = v.slice(0, ed.selectionStart).replace(/[ \t]+$/, '');
  const sau   = v.slice(ed.selectionEnd).replace(/^[ \t]+/, '');
  // Ảnh phải đứng riêng một khối thì mới thành <figure> có chú thích; dính vào
  // đoạn văn thì nó chỉ là một thẻ <img> giữa câu. Nên chừa dòng trống hai đầu.
  const dem  = truoc === '' || /\n\n$/.test(truoc) ? '' : (/\n$/.test(truoc) ? '\n' : '\n\n');
  const duoi = sau   === '' || /^\n\n/.test(sau)   ? '' : (/^\n/.test(sau)   ? '\n' : '\n\n');
  const than = duongDan.map((p) => `![${CHU_THICH_MAU}](${p})`).join('\n\n');

  ed.value = truoc + dem + than + duoi + sau;

  // Bôi đen sẵn chữ "Chú thích" của tấm đầu tiên: gõ tiếp là đè lên luôn,
  // không phải rê chuột, không có hộp thoại nào chặn ngang mạch viết.
  const dau = truoc.length + dem.length + 2;      // qua hai ký tự "!["
  ed.focus();
  ed.setSelectionRange(dau, dau + CHU_THICH_MAU.length);
  onEdit();
}

async function themAnh(files) {
  const ds = [...files].filter((f) => /^image\//.test(f.type));
  if (!ds.length) { say('Chỗ đó chỉ nhận ảnh thôi.', 'err'); return; }
  if (dangXuLyAnh) return;

  dangXuLyAnh = true;
  say(ds.length > 1 ? `Đang xử lý ${ds.length} ảnh…` : 'Đang xử lý ảnh…');

  const duongDan = [], hong = [];
  for (const f of ds) {
    // Từng file một chứ không bỏ cả mẻ: một tấm .heic của iPhone mà trình
    // duyệt không giải mã được thì cũng không nên kéo theo mấy tấm còn lại.
    try { duongDan.push(await nhanAnh(f)); }
    catch (e) { hong.push(`${f.name || 'ảnh'} (${e.message})`); }
  }
  dangXuLyAnh = false;

  if (duongDan.length) chenAnh(duongDan);
  if (hong.length) {
    say(`Không chèn được: ${escapeHtml(hong.join(', '))}`, 'err');
  } else {
    say(`Đã chèn ${duongDan.length} ảnh — sẽ lên GitHub khi bấm Đăng.`);
  }
}

ed.addEventListener('paste', (e) => {
  const files = e.clipboardData ? [...e.clipboardData.files] : [];
  if (!files.some((f) => /^image\//.test(f.type))) return;   // dán chữ: để yên
  e.preventDefault();
  themAnh(files);
});

// Thả file lên <textarea> mà không chặn thì trình duyệt bỏ trang này để mở
// file đó — mất sạch những gì đang gõ. Nên chặn mọi cú thả file, kể cả file
// không phải ảnh; themAnh sẽ nói lại là không nhận.
['dragenter', 'dragover'].forEach((ten) => ed.addEventListener(ten, (e) => {
  if (!e.dataTransfer || ![...e.dataTransfer.types].includes('Files')) return;
  e.preventDefault();
  ed.classList.add('tha-anh');
}));
['dragleave', 'dragend', 'drop'].forEach((ten) =>
  ed.addEventListener(ten, () => ed.classList.remove('tha-anh')));

ed.addEventListener('drop', (e) => {
  if (!e.dataTransfer || !e.dataTransfer.files.length) return;
  e.preventDefault();
  themAnh(e.dataTransfer.files);
});

$('anh-input').addEventListener('change', (e) => {
  themAnh(e.target.files);
  e.target.value = '';    // chọn lại đúng file vừa rồi vẫn phải nổ sự kiện
});

const COMMANDS = {
  image:    () => $('anh-input').click(),
  bold:     () => surround('**', '**'),
  italic:   () => surround('*', '*'),
  h2:       () => prefixLines('## '),
  h3:       () => prefixLines('### '),
  quote:    () => prefixLines('> '),
  ul:       () => prefixLines('- '),
  ol:       () => prefixLines('', true),
  link:     () => surround('[', '](https://)'),
  hr:       () => insertAt('\n\n---\n\n'),
  footnote: addFootnote,
  logout:   () => {
    localStorage.removeItem('gh-token');
    token = '';
    location.reload();
  },
};

$('toolbar').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-cmd]');
  if (btn && COMMANDS[btn.dataset.cmd]) COMMANDS[btn.dataset.cmd]();
});

ed.addEventListener('keydown', (e) => {
  if (!(e.ctrlKey || e.metaKey)) return;
  const k = e.key.toLowerCase();
  if (k === 'b') { e.preventDefault(); COMMANDS.bold(); }
  if (k === 'i') { e.preventDefault(); COMMANDS.italic(); }
  if (k === 'k') { e.preventDefault(); COMMANDS.link(); }
  if (k === 's') { e.preventDefault(); saveDraft(); }
});

/* -- xem trước + lưu nháp -- */

let previewTimer, draftTimer;
let giuViTriXemTruoc = false, viTriXemTruocCanGiu = 0;

const previewDoc = () => { try { return $('preview').contentDocument; } catch (_) { return null; } };
const previewWin = () => { try { return $('preview').contentWindow; } catch (_) { return null; } };

/* Ảnh vừa dán thì /anh/... còn 404 vì chưa lên GitHub — trong khung xem trước
   trỏ tạm vào bản nằm trong máy. Ảnh của bài đã đăng thì không có trong anhCho
   nữa, mà cũng chẳng cần: trình soạn cùng tên miền với trang thật nên đường
   dẫn tính từ gốc tải thẳng được.

   Đổi ngay trên chuỗi HTML, trước khi nó vào tài liệu — chứ đợi vào rồi mới
   sửa src thì trình duyệt đã kịp bắn một yêu cầu 404, mà lúc đang gõ thì cứ
   300ms một lần như thế. */
function anhSangBlob(html) {
  return html.replace(/(<img\b[^>]*?\bsrc=")(\/anh\/[^"]+)"/g, (ca, dau, p) => {
    const a = anhCho.get(khoaAnh(p));
    return a ? dau + a.url + '"' : ca;
  });
}

// Ảnh viết tay không mang kích thước trong tên file, nên đến lúc tải xong bố
// cục mới đổi — bảng mốc cuộn dựng trước đó sai, bắt dựng lại.
function theoDoiAnh() {
  const doc = previewDoc();
  if (!doc) return;
  doc.querySelectorAll('article.post img').forEach((im) => {
    if (!im.complete) im.addEventListener('load', () => { bangMoc = null; }, { once: true });
  });
}

/* Nạp lại cả trang xem trước thì nó tụt về đầu, mà đang gõ giữa bài thì cứ
   300ms lại bị ném lên đầu một lần. Nên chỉ nạp cả trang đúng lần đầu; những
   lần sau thay mỗi ruột của <article class="post">. Phần đầu trang, chân
   trang và nút sáng/tối không đổi khi đang gõ — giữ nguyên chúng thì chỗ đang
   cuộn còn nguyên, và nút vẫn còn cái người nghe sự kiện mà theme.js gắn cho
   nó lúc nạp (thay cả <body> là mất, vì script không chạy lại). */
function renderPreview() {
  const previousPreviewScrollY = previewWin()?.scrollY ?? 0;
  const title = $('title').value.trim() || 'Chưa có tiêu đề';
  const date = state.date || todayISO();
  let html;
  try {
    html = buildPostHtml({
      title, date, updated: state.editing ? todayISO() : null, bodyMd: ed.value,
    });
  } catch (e) {
    $('preview').srcdoc =
      `<pre style="padding:1rem;color:#a33">${escapeHtml(e.message)}</pre>`;
    return;
  }

  const cu = previewDoc() && previewDoc().querySelector('article.post');
  if (cu) {
    const moi = new DOMParser().parseFromString(html, 'text/html')
      .querySelector('article.post');
    if (moi) {
      giuViTriXemTruoc = true;
      viTriXemTruocCanGiu = previousPreviewScrollY;
      cu.innerHTML = anhSangBlob(moi.innerHTML);
      theoDoiAnh();
      danhDauDong();
      cuonTheoOSoan();      // phần nằm trên chỗ đang đọc có thể dài ngắn khác đi
      return;
    }
  }
  $('preview').srcdoc = anhSangBlob(html);   // lần đầu, hoặc khung hỏng thì dựng lại
}

/* ---- Cuộn theo nhau -----------------------------------------------
   Cách làm: dựng một bảng gồm những cặp (chỗ cuộn bên soạn, chỗ cuộn bên xem
   trước) tại mỗi khối của bài, rồi nội suy tuyến tính giữa các cặp đó. Chia
   theo tỉ lệ đơn thuần sẽ lệch ngay khi bài có khối mã hay ảnh — chúng chiếm
   vài dòng văn bản nhưng cả gang tay trên trang.
   -------------------------------------------------------------------- */

/* Bản sao vô hình của ô soạn thảo. Cần nó vì <textarea> không cho hỏi dòng
   thứ n nằm ở đâu, mà chữ lại tự xuống dòng nên một dòng trong văn bản có
   thể chiếm hai ba dòng trên màn hình. Chép y nguyên font, bề rộng, lề của ô
   soạn rồi đo offsetTop từng dòng. */
const guong = document.createElement('div');
guong.id = 'editor-mirror';
guong.setAttribute('aria-hidden', 'true');
document.body.appendChild(guong);

const NET_CHU = [
  'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight',
  'letterSpacing', 'wordSpacing', 'textIndent', 'textTransform', 'tabSize',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
];

function doDinhDong() {
  const cs = getComputedStyle(ed);
  NET_CHU.forEach((k) => { guong.style[k] = cs[k]; });
  // clientWidth chứ không phải offsetWidth: nó đã trừ thanh cuộn ra rồi, mà
  // thanh cuộn hẹp đi vài chục pixel là chữ xuống dòng ở chỗ khác.
  guong.style.width = ed.clientWidth + 'px';

  const frag = document.createDocumentFragment();
  const o = ed.value.split('\n').map((d) => {
    const s = document.createElement('span');
    s.style.display = 'block';
    s.textContent = d === '' ? '\u200b' : d;   // dòng trống vẫn phải cao một dòng
    frag.appendChild(s);
    return s;
  });
  guong.textContent = '';
  guong.appendChild(frag);
  return o.map((s) => s.offsetTop);
}

// Bảng mốc dùng chung cho cả hai chiều cuộn; đặt null là bắt dựng lại.
let bangMoc = null, lucCuoi = 0;

/* Gắn số dòng nguồn vào từng khối trong bài đã dựng, làm mốc cho việc cuộn.
   Không khớp được thì không gắn gì, và việc cuộn tự lùi về chia theo tỉ lệ. */
function danhDauDong() {
  bangMoc = null;
  const art = previewDoc() && previewDoc().querySelector('article.post');
  if (!art) return;

  // Hai thẻ đầu là tiêu đề bài và dòng ngày tháng, do khuôn trang sinh ra chứ
  // không ứng với dòng nào trong ô soạn. Khối chú thích ở cuối cũng vậy.
  const khoi = [...art.children].slice(2);
  if (khoi.length && khoi[khoi.length - 1].classList.contains('footnotes')) khoi.pop();

  const dong = viTriDongCuaKhoi(ed.value);
  if (!dong || dong.length !== khoi.length) return;
  khoi.forEach((el, i) => { el.dataset.ln = dong[i]; });
}

function dungBang() {
  const doc = previewDoc(), win = previewWin();
  const soanMax = Math.max(0, ed.scrollHeight - ed.clientHeight);
  const xemMax = doc && win
    ? Math.max(0, doc.documentElement.scrollHeight - win.innerHeight) : 0;

  const b = [[0, 0]];                       // đầu khớp đầu
  if (doc && win) {
    const dinh = doDinhDong();
    doc.querySelectorAll('article.post [data-ln]').forEach((el) => {
      const x = Math.min(dinh[Number(el.dataset.ln)] || 0, soanMax);
      const y = Math.min(el.getBoundingClientRect().top + win.scrollY, xemMax);
      const cuoi = b[b.length - 1];
      // Bảng phải tăng dần ở cả hai cột, không thì nội suy chạy giật lùi.
      if (x > cuoi[0] && y >= cuoi[1]) b.push([x, y]);
    });
  }
  if (soanMax > b[b.length - 1][0]) b.push([soanMax, xemMax]);   // đáy khớp đáy
  return b;
}

// Dựng lại bảng ở đầu mỗi lượt cuộn, rồi dùng lại cho đến khi tay rời chuột.
// Trong một lượt cuộn bố cục không đổi, mà đo lại mỗi sự kiện thì giật.
function layBang() {
  const gio = Date.now();
  if (!bangMoc || gio - lucCuoi > 200) bangMoc = dungBang();
  lucCuoi = gio;
  return bangMoc;
}

function noiSuy(b, x, cot) {        // cot 0: đưa vào chỗ cuộn bên soạn; 1: bên xem
  const k = cot, r = 1 - cot;
  if (x <= b[0][k]) return b[0][r];
  for (let i = 1; i < b.length; i++) {
    if (x <= b[i][k]) {
      const a = b[i - 1], c = b[i], d = c[k] - a[k];
      return d <= 0 ? c[r] : a[r] + (x - a[k]) * (c[r] - a[r]) / d;
    }
  }
  return b[b.length - 1][r];
}

// Cuộn bên này làm bên kia cuộn theo, mà bên kia cuộn lại bắn ra sự kiện cuộn
// nữa — không chặn thì hai bên đá qua đá lại. Mở khoá sau hai khung hình, lúc
// đó sự kiện do mình gây ra đã bay hết.
let khoaCuon = false;
function khoa(fn) {
  if (khoaCuon) return;
  khoaCuon = true;
  const mo = () => { khoaCuon = false; };
  try { fn(); } finally {
    requestAnimationFrame(() => requestAnimationFrame(mo));
    setTimeout(mo, 150);   // phòng thân: tab chạy nền thì rAF bị treo, khoá sẽ kẹt
  }
}

function khoiPhucViTriXemTruoc(y) {
  const doc = previewDoc(), win = previewWin();
  if (!doc || !win) return;
  const max = Math.max(0, doc.documentElement.scrollHeight - win.innerHeight);
  khoa(() => win.scrollTo(0, Math.min(y, max)));
}

function cuonTheoOSoan() {
  if (giuViTriXemTruoc) {
    giuViTriXemTruoc = false;
    khoiPhucViTriXemTruoc(viTriXemTruocCanGiu);
    return;
  }
  const win = previewWin();
  if (!win) return;
  khoa(() => win.scrollTo(0, noiSuy(layBang(), ed.scrollTop, 0)));
}

function cuonTheoXemTruoc() {
  const win = previewWin();
  if (!win) return;
  khoa(() => { ed.scrollTop = noiSuy(layBang(), win.scrollY, 1); });
}

ed.addEventListener('scroll', cuonTheoOSoan, { passive: true });
window.addEventListener('resize', () => { bangMoc = null; });

$('preview').addEventListener('load', () => {
  const doc = previewDoc(), win = previewWin();
  if (!doc || !win) return;
  // style.css bật cuộn mượt cho cả site. Trong khung xem trước thì nó biến mỗi
  // lần cuộn theo thành một đoạn chạy có quán tính, đuổi không kịp và giật.
  const st = doc.createElement('style');
  st.textContent = 'html{scroll-behavior:auto!important}';
  doc.head.appendChild(st);
  win.addEventListener('scroll', cuonTheoXemTruoc, { passive: true });
  theoDoiAnh();
  danhDauDong();
  cuonTheoOSoan();
});

const draftKey = () => 'draft:' + (state.editing || '__new__');

function saveDraft() {
  if (!$('title').value.trim() && !ed.value.trim()) return;
  localStorage.setItem(draftKey(), JSON.stringify({
    title: $('title').value, body: ed.value, ts: Date.now(),
  }));
  const t = new Date(), p = (n) => String(n).padStart(2, '0');
  $('draft-info').textContent = `nháp đã lưu ${p(t.getHours())}:${p(t.getMinutes())}`;
}

function restoreDraft() {
  const raw = localStorage.getItem(draftKey());
  if (!raw) { $('draft-info').textContent = ''; return; }
  try {
    const d = JSON.parse(raw);
    $('title').value = d.title || '';
    ed.value = d.body || '';
    $('draft-info').textContent = 'đã khôi phục bản nháp';
  } catch (_) { /* nháp hỏng thì bỏ qua */ }
}

// Mở một bài đã đăng mà máy còn bản nháp chưa đăng của chính bài đó
function offerDraft(slug) {
  const raw = localStorage.getItem('draft:' + slug);
  if (!raw) return;
  try {
    const d = JSON.parse(raw);
    if (d.body === ed.value) { localStorage.removeItem('draft:' + slug); return; }
    say('Máy này còn bản nháp chưa đăng của bài đó. <a href="#" id="restore-draft">Khôi phục</a>');
    $('restore-draft').addEventListener('click', (e) => {
      e.preventDefault();
      $('title').value = d.title || $('title').value;
      ed.value = d.body;
      renderPreview();
      say('Đã khôi phục bản nháp.');
    });
  } catch (_) { /* bỏ qua */ }
}

function updateSlugInfo() {
  if (state.editing) {
    $('slug-info').innerHTML =
      `sửa bài · URL giữ nguyên <code>/posts/${escapeHtml(state.editing)}/</code>`;
  } else {
    const s = slugify($('title').value);
    $('slug-info').innerHTML = s
      ? `bài mới · <code>/posts/${escapeHtml(s)}/</code>`
      : 'bài mới · nhập tiêu đề để sinh đường dẫn';
  }
}

function onEdit() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(renderPreview, 300);
  clearTimeout(draftTimer);
  draftTimer = setTimeout(saveDraft, 800);
  disarm();
}

ed.addEventListener('input', onEdit);
$('title').addEventListener('input', () => { updateSlugInfo(); onEdit(); });

/* -- đăng bài -- */

function disarm() {
  armed = false;
  $('publish-confirm').classList.add('hidden');
  $('publish').classList.remove('hidden');
}

$('publish').addEventListener('click', () => {
  const title = $('title').value.trim();
  const body = ed.value.trim();
  if (!title) { say('Chưa có tiêu đề.', 'err'); return; }
  if (!body)  { say('Bài đang trống.', 'err'); return; }

  const slug = state.editing || slugify(title);
  if (!slug) {
    say('Tiêu đề không sinh được đường dẫn — cần ít nhất một chữ cái hoặc chữ số.', 'err');
    return;
  }
  if (!state.editing && state.entries.some((e) => e.slug === slug)) {
    say(`Đã có bài dùng đường dẫn <code>/posts/${escapeHtml(slug)}/</code>. `
      + 'Đổi tiêu đề, hoặc chọn bài đó ở ô bên trên để sửa.', 'err');
    return;
  }

  const missing = missingFootnotes(body);
  const warn = missing.length
    ? ` <strong>Chú thích ${missing.map((i) => `[^${escapeHtml(i)}]`).join(', ')} `
      + 'chưa có nội dung</strong> — vẫn đăng được, nhưng sẽ hiện trơ giữa câu.'
    : '';

  armed = true;
  $('publish').classList.add('hidden');
  $('publish-confirm').classList.remove('hidden');
  say((state.editing
    ? `Cập nhật <code>/posts/${escapeHtml(slug)}/</code> — bấm xác nhận.`
    : `Đăng bài mới vào <code>/posts/${escapeHtml(slug)}/</code> — bấm xác nhận.`) + warn,
    missing.length ? 'err' : '');
  setTimeout(() => { if (armed) disarm(); }, 12000);
});

$('publish-confirm').addEventListener('click', async () => {
  if (!armed) return;
  disarm();

  const title   = $('title').value.trim();
  const body    = ed.value.trim();
  const slug    = state.editing || slugify(title);
  const date    = state.date || todayISO();
  const updated = state.editing ? todayISO() : null;

  $('publish').disabled = true;
  say('Đang đăng…');

  try {
    if (!state.editing && (await getFile(`posts/${slug}/index.md`)) !== null) {
      throw new Error(`posts/${slug}/ đã tồn tại trong repo. Đổi tiêu đề đi.`);
    }

    let indexHtml = await getFile('index.html');
    if (indexHtml === null) throw new Error('Không tìm thấy index.html trong repo');
    const entries = parseEntries(indexHtml);
    const found = entries.find((e) => e.slug === slug);
    if (found) found.title = title;
    else entries.push({ slug, title, date });
    indexHtml = writeEntries(indexHtml, entries);

    const files = [
      { path: `posts/${slug}/index.md`,   content: buildMd({ title, date, updated, body }) },
      { path: `posts/${slug}/index.html`, content: buildPostHtml({ title, date, updated, bodyMd: body }) },
      { path: 'index.html',               content: indexHtml },
    ];

    // Ảnh nào còn nằm trong kho máy này và chưa đăng thì gửi kèm. Ảnh không có
    // trong kho thì hoặc đã đăng rồi, hoặc do máy khác đăng — đằng nào cũng đã
    // nằm sẵn trên repo, đẩy lại chỉ tốn công.
    const anhMoi = anhTrongBai(body)
      .map((p) => [p, anhCho.get(p)])
      .filter(([, a]) => a && !a.daDang);
    for (const [p, a] of anhMoi) {
      files.push({ path: p, bytes: new Uint8Array(await a.blob.arrayBuffer()) });
    }
    if (anhMoi.length) say(`Đang đăng… (kèm ${anhMoi.length} ảnh)`);

    await commitFiles(`${state.editing ? 'Cập nhật' : 'Bài mới'}: ${title}`, files);

    // Từ đây bản trên GitHub mới là bản thật. Vẫn giữ blob lại một thời gian
    // (xem ANH_HAN) để khung xem trước còn hiện ngay được khi mở bài ra sửa.
    anhMoi.forEach(([p, a]) => {
      a.daDang = true;
      khoGhi({ path: p, blob: a.blob, daDang: true, ts: Date.now() });
    });

    localStorage.removeItem(draftKey());
    state.editing = slug;
    state.date = date;
    await refreshEntries();
    updateSlugInfo();
    $('draft-info').textContent = '';
    say('Đã đăng. GitHub Pages dựng lại mất khoảng 30–60 giây · '
      + `<a href="/posts/${slug}/" target="_blank" rel="noopener">mở bài</a>`, 'ok');
  } catch (err) {
    say(escapeHtml(err.message), 'err');
  } finally {
    $('publish').disabled = false;
  }
});

/* -- khởi động -- */

window.addEventListener('beforeunload', (e) => {
  if (ed.value.trim() && localStorage.getItem(draftKey()) === null) {
    e.preventDefault();
    e.returnValue = '';
  }
});

if (token) {
  unlock().then((ok) => { if (!ok) $('token-input').focus(); });
} else {
  $('token-input').focus();
}

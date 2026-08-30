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
  siteTitle: 'Ghi chép triết học',
  author:    '',                                   // để trống thì cuối trang chỉ hiện tên site
};

/* ---- 2. Tiện ích nhỏ ------------------------------------------- */

const $ = (id) => document.getElementById(id);

const b64encode = (str) => {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin);
};

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

function renderMarkdown(md) {
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
<link rel="stylesheet" href="/style.css">
</head>
<body>

<header class="site-header">
  <a class="site-title" href="/">${escapeHtml(CONFIG.siteTitle)}</a>
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
    const blob = await gh('/git/blobs', {
      method: 'POST',
      body: { content: b64encode(f.content), encoding: 'base64' },
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
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const block = sorted.map((e) =>
    `    <li><time datetime="${escapeHtml(e.date)}">${viDate(e.date)}</time>`
  + `<a href="/posts/${e.slug}/">${escapeHtml(e.title)}</a></li>`).join('\n');
  return indexHtml.replace(MARKERS, (_m, a, _b, c) => `${a}\n${block}\n${c}`);
}

/* ---- 8. Giao diện ----------------------------------------------- */

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

const COMMANDS = {
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

function renderPreview() {
  const title = $('title').value.trim() || 'Chưa có tiêu đề';
  const date = state.date || todayISO();
  try {
    $('preview').srcdoc = buildPostHtml({
      title, date, updated: state.editing ? todayISO() : null, bodyMd: ed.value,
    });
  } catch (e) {
    $('preview').srcdoc =
      `<pre style="padding:1rem;color:#a33">${escapeHtml(e.message)}</pre>`;
  }
}

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

    await commitFiles(`${state.editing ? 'Cập nhật' : 'Bài mới'}: ${title}`, [
      { path: `posts/${slug}/index.md`,   content: buildMd({ title, date, updated, body }) },
      { path: `posts/${slug}/index.html`, content: buildPostHtml({ title, date, updated, bodyMd: body }) },
      { path: 'index.html',               content: indexHtml },
    ]);

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

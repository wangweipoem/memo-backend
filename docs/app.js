// API 配置 — 部署时将 API_URL 改为后端实际地址
const API_URL = 'https://memo-backend-production-8f82.up.railway.app';
const TOKEN_KEY = 'memo_token';

// ============ Token 管理 ============
function getToken() { return localStorage.getItem(TOKEN_KEY); }
function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
function logout() { localStorage.removeItem(TOKEN_KEY); location.reload(); }

// ============ DOM 引用 ============
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ============ 转义 ============
function escapeHtml(s) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(s).replace(/[&<>"']/g, c => map[c]);
}

// ============ Auth ============
$('#form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#login-email').value;
    const password = $('#login-pass').value;
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.token) {
        setToken(data.token);
        initApp();
    } else {
        $('#auth-msg').textContent = data.message || '登录失败';
    }
});

$('#form-register').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#reg-email').value;
    const password = $('#reg-pass').value;
    if (password.length < 6) {
        $('#auth-msg').textContent = '密码至少6位';
        return;
    }
    const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    $('#auth-msg').textContent = data.message || '注册失败';
    if (res.ok) {
        // 注册成功，切换到登录
        $('[data-tab="login"]').click();
    }
});

// Tab 切换
$$('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        $$('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;
        $$('.form').forEach(f => f.classList.remove('active'));
        $(`#form-${target}`).classList.add('active');
        $('#auth-msg').textContent = '';
    });
});

$('#btn-logout').addEventListener('click', logout);

// ============ Notes CRUD ============
let editingId = null;

// 保存（创建或更新）
$('#btn-save').addEventListener('click', async () => {
    const title = $('#note-title').value.trim();
    const content = $('#note-content').value.trim();
    if (!title) { $('#note-msg').textContent = '标题不能为空'; return; }

    const token = getToken();
    const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };

    let res;
    if (editingId) {
        res = await fetch(`${API_URL}/notes/${editingId}`, {
            method: 'PUT', headers, body: JSON.stringify({ title, content })
        });
    } else {
        res = await fetch(`${API_URL}/notes`, {
            method: 'POST', headers, body: JSON.stringify({ title, content })
        });
    }

    if (res.ok) {
        clearEditor();
        loadNotes();
    } else {
        const d = await res.json().catch(() => ({}));
        $('#note-msg').textContent = d.message || '操作失败';
    }
});

$('#btn-cancel-edit').addEventListener('click', clearEditor);

function clearEditor() {
    editingId = null;
    $('#note-title').value = '';
    $('#note-content').value = '';
    $('#editor-title').textContent = '新建备忘录';
    $('#btn-save').textContent = '保存';
    $('#btn-cancel-edit').classList.add('hidden');
    $('#note-msg').textContent = '';
}

$('#btn-refresh').addEventListener('click', loadNotes);

async function loadNotes() {
    const token = getToken();
    const list = $('#notes-list');
    const msg = $('#list-msg');

    const res = await fetch(`${API_URL}/notes`, {
        headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!res.ok) {
        msg.textContent = '加载失败，请刷新重试';
        return;
    }

    const notes = await res.json();
    list.innerHTML = '';
    msg.textContent = '';

    const countEl = $('#note-count');
    if (countEl) countEl.textContent = notes.length;

    if (notes.length === 0) {
        list.innerHTML = '<div class="empty-state"><div class="icon">📭</div><p>暂无备忘录，新建一个吧</p></div>';
        msg.textContent = '';
        return;
    }

    notes.forEach(n => {
        const li = document.createElement('li');
        li.className = 'note-item';
        li.innerHTML = `
            <div class="note-body">
                <strong class="note-title-text">${escapeHtml(n.title)}</strong>
                <p class="note-content-text">${escapeHtml(n.content || '')}</p>
                <span class="note-time">更新于 ${new Date(n.updated_at).toLocaleString('zh-CN')}</span>
            </div>
            <div class="note-actions">
                <button class="btn-edit" data-id="${n.id}" data-title="${escapeHtml(n.title)}" data-content="${escapeHtml(n.content || '')}">编辑</button>
                <button class="btn-del" data-id="${n.id}">删除</button>
            </div>
        `;
        list.appendChild(li);
    });

    // 绑定删除事件
    $$('.btn-del').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!confirm('确定删除这条备忘录？')) return;
            const id = btn.dataset.id;
            const res = await fetch(`${API_URL}/notes/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + getToken() }
            });
            if (res.ok) {
                loadNotes();
            } else {
                alert('删除失败');
            }
        });
    });

    // 绑定编辑事件
    $$('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => {
            editingId = btn.dataset.id;
            $('#note-title').value = btn.dataset.title;
            $('#note-content').value = btn.dataset.content;
            $('#editor-title').textContent = '编辑备忘录';
            $('#btn-save').textContent = '更新';
            $('#btn-cancel-edit').classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// ============ 初始化 ============
function initApp() {
    const token = getToken();
    if (token) {
        // 解码 token 获取邮箱
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            $('#user-email').textContent = payload.email;
        } catch { /* ignore */ }

        $('#auth').classList.add('hidden');
        $('#app').classList.remove('hidden');
        loadNotes();
    } else {
        $('#auth').classList.remove('hidden');
        $('#app').classList.add('hidden');
    }
}

initApp();

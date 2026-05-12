const API = 'http://localhost:3000'; // 本地测试时用这个，部署后改为线上后端地址
const tokenKey = 'memo_token';

function setToken(t) { localStorage.setItem(tokenKey, t); }
function getToken() { return localStorage.getItem(tokenKey); }
function logout() { localStorage.removeItem(tokenKey); location.reload(); }

document.getElementById('btn-register').addEventListener('click', async () => {
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-pass').value;
    const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    alert(data.message || 'Registered');
});

document.getElementById('btn-login').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-pass').value;
    const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.token) {
        setToken(data.token);
        initApp();
    } else {
        alert(data.message || 'Login failed');
    }
});

document.getElementById('btn-logout').addEventListener('click', logout);

document.getElementById('btn-create').addEventListener('click', async ()=>{
    const title = document.getElementById('note-title').value;
    const content = document.getElementById('note-content').value;
    const token = getToken();
    const res = await fetch(`${API}/notes`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ title, content })
    });
    if (res.ok) { loadNotes(); } else { alert('Create failed'); }
});

async function loadNotes(){
    const token = getToken();
    if (!token) { alert('Please login'); return; }
    const res = await fetch(`${API}/notes`, { headers: { Authorization: 'Bearer ' + token }});
    if (!res.ok) { alert('Load notes failed'); return; }
    const notes = await res.json();
    const list = document.getElementById('notes-list');
    list.innerHTML = '';
    notes.forEach(n => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${escapeHtml(n.title)}</strong> - ${escapeHtml(n.content)} 
      <button data-id="${n.id}" class="del">Delete</button>`;
        list.appendChild(li);
    });
    document.querySelectorAll('.del').forEach(btn=>{
        btn.addEventListener('click', async (e)=>{
            const id = e.target.getAttribute('data-id');
            const token = getToken();
            await fetch(`${API}/notes/${id}`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token }});
            loadNotes();
        });
    });
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function initApp(){
    const token = getToken();
    if (token) {
        document.getElementById('auth').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        loadNotes();
    } else {
        document.getElementById('auth').style.display = 'block';
        document.getElementById('app').style.display = 'none';
    }
}

initApp();
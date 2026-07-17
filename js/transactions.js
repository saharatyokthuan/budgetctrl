// transactions.js
(function(){
  let filterType = 'all';
  const listEl = document.getElementById('list');

  function runningBalances(){
    const all = DB.getTx().slice().sort((a,b)=> a.date===b.date ? a.createdAt-b.createdAt : (a.date<b.date?-1:1));
    let bal = 0; const map = {};
    for(const t of all){ bal += t.type==='income'? t.amount : -t.amount; map[t.id]=bal; }
    return map;
  }

  function render(){
    const balMap = runningBalances();
    const q = document.getElementById('q').value.trim().toLowerCase();
    const from = document.getElementById('fromDate').value;
    const to = document.getElementById('toDate').value;

    let list = DB.getTx().filter(t=>{
      if(filterType!=='all' && t.type!==filterType) return false;
      if(from && t.date<from) return false;
      if(to && t.date>to) return false;
      if(q && !(t.category.toLowerCase().includes(q) || (t.note||'').toLowerCase().includes(q))) return false;
      return true;
    });

    if(!list.length){ listEl.innerHTML = '<div class="empty">ไม่พบรายการ</div>'; return; }

    listEl.innerHTML = list.map(t=>`
      <div class="ledger-row" data-id="${t.id}">
        <span class="dot ${t.type}"></span>
        <span class="meta">
          <div class="cat">${Utils.escapeHtml(t.category)}</div>
          <div class="note">${Utils.fmtDate(t.date)}${t.note?' · '+Utils.escapeHtml(t.note):''}</div>
        </span>
        <span class="bal">${Utils.money(balMap[t.id])}</span>
        <span class="amt ${t.type}">${t.type==='income'?'+':'-'}${Utils.money(t.amount)}</span>
        <span class="del" data-del="${t.id}">✕</span>
      </div>
    `).join('');
  }

  document.getElementById('q').addEventListener('input', render);
  document.getElementById('fromDate').addEventListener('change', render);
  document.getElementById('toDate').addEventListener('change', render);
  document.getElementById('typeTabs').addEventListener('click', e=>{
    if(e.target.tagName!=='BUTTON') return;
    [...e.currentTarget.children].forEach(b=>b.classList.remove('active'));
    e.target.classList.add('active');
    filterType = e.target.dataset.v;
    render();
  });
  listEl.addEventListener('click', e=>{
    const id = e.target.dataset.del;
    if(id && confirm('ลบรายการนี้?')){ DB.deleteTx(id); render(); }
  });

  // ---- Modal / add form ----
  const backdrop = document.getElementById('modalBackdrop');
  const openModal = ()=>{
    document.getElementById('fDate').value = Utils.todayISO();
    populateCategories('expense');
    backdrop.classList.add('open');
  };
  const closeModal = ()=> backdrop.classList.remove('open');
  document.getElementById('addBtn').addEventListener('click', openModal);
  document.getElementById('modalClose').addEventListener('click', closeModal);
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop) closeModal(); });

  let formType = 'expense';
  document.getElementById('formTypeTabs').addEventListener('click', e=>{
    if(e.target.tagName!=='BUTTON') return;
    [...e.currentTarget.children].forEach(b=>b.classList.remove('active'));
    e.target.classList.add('active');
    formType = e.target.dataset.v;
    populateCategories(formType);
  });

  function populateCategories(type){
    const sel = document.getElementById('fCategory');
    const cats = DB.getCats(type);
    sel.innerHTML = cats.map(c=>`<option value="${Utils.escapeHtml(c.name)}">${Utils.escapeHtml(c.name)}</option>`).join('')
      || '<option value="อื่นๆ">อื่นๆ</option>';
  }

  document.getElementById('saveBtn').addEventListener('click', ()=>{
    const amount = parseFloat(document.getElementById('fAmount').value);
    if(!amount || amount<=0){ Utils.toast('กรอกจำนวนเงินให้ถูกต้อง'); return; }
    DB.addTx({
      type: formType,
      amount,
      category: document.getElementById('fCategory').value || 'อื่นๆ',
      date: document.getElementById('fDate').value || Utils.todayISO(),
      note: document.getElementById('fNote').value.trim()
    });
    document.getElementById('fAmount').value='';
    document.getElementById('fNote').value='';
    closeModal();
    render();
    Utils.toast('บันทึกแล้ว');
  });

  // ---- Export xlsx ----
  document.getElementById('exportBtn').addEventListener('click', ()=>{
    const rows = DB.getTx().slice().reverse().map(t=>({
      วันที่: t.date, ประเภท: t.type==='income'?'รายรับ':'รายจ่าย',
      หมวดหมู่: t.category, จำนวนเงิน: t.amount, โน้ต: t.note||''
    }));
    if(!rows.length){ Utils.toast('ไม่มีข้อมูลให้ส่งออก'); return; }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, `budgetctrl_transactions_${Utils.todayISO()}.xlsx`);
  });

  render();
})();

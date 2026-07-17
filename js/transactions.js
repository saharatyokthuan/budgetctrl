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
      <div class="ledger-row" data-id="${t.id}" style="cursor:pointer">
        <span class="dot ${t.type}"></span>
        <span class="meta" data-open="${t.id}">
          <div class="cat">${Utils.escapeHtml(t.category)}</div>
          <div class="note">${Utils.fmtDate(t.date)}${t.note?' · '+Utils.escapeHtml(t.note):''}</div>
        </span>
        <span class="bal">${Utils.money(balMap[t.id])}</span>
        <span class="amt ${t.type}" data-open="${t.id}">${t.type==='income'?'+':'-'}${Utils.money(t.amount)}</span>
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
    const delId = e.target.dataset.del;
    const openId = e.target.closest('[data-open]')?.dataset.open;
    if(delId && confirm('ลบรายการนี้?')){ DB.deleteTx(delId); render(); return; }
    if(openId) openEdit(openId);
  });

  // ---- Modal state ----
  const backdrop = document.getElementById('modalBackdrop');
  const modalTitle = document.getElementById('modalTitle');
  const formTypeTabs = document.getElementById('formTypeTabs');
  const debtFields = document.getElementById('debtFields');
  const categoryField = document.getElementById('categoryField');
  const dateField = document.getElementById('dateField');
  let formType = 'expense';
  let debtKind = 'owe';
  let editingId = null; // null = adding new, otherwise id of tx being edited

  function setFormType(type){
    formType = type;
    [...formTypeTabs.children].forEach(b=>b.classList.toggle('active', b.dataset.v===type));
    const isDebt = type==='debt';
    debtFields.style.display = isDebt ? '' : 'none';
    categoryField.style.display = isDebt ? 'none' : '';
    dateField.style.display = isDebt ? 'none' : '';
    if(!isDebt) populateCategories(type);
  }

  function populateCategories(type){
    const sel = document.getElementById('fCategory');
    const cats = DB.getCats(type);
    sel.innerHTML = cats.map(c=>`<option value="${Utils.escapeHtml(c.name)}">${Utils.escapeHtml(c.name)}</option>`).join('')
      || '<option value="อื่นๆ">อื่นๆ</option>';
  }

  function openAdd(){
    editingId = null;
    modalTitle.textContent = 'เพิ่มรายการ';
    document.getElementById('saveBtn').textContent = 'บันทึก';
    [...formTypeTabs.children].forEach(b=> b.style.display = '');
    document.getElementById('fAmount').value='';
    document.getElementById('fNote').value='';
    document.getElementById('fPerson').value='';
    document.getElementById('fDue').value='';
    document.getElementById('fDate').value = Utils.todayISO();
    setFormType('expense');
    backdrop.classList.add('open');
  }

  function openEdit(id){
    const t = DB.getTx().find(x=>x.id===id);
    if(!t) return;
    if(t.debtId){
      Utils.toast('รายการนี้มาจากหน้าหนี้/ยืม-คืน แก้ไขได้ที่หน้านั้นแทน');
      return;
    }
    editingId = id;
    modalTitle.textContent = 'แก้ไขรายการ';
    document.getElementById('saveBtn').textContent = 'บันทึกการแก้ไข';
    // editing an existing plain transaction: hide the ยืม/คืน quick-entry tab
    [...formTypeTabs.children].forEach(b=> b.style.display = b.dataset.v==='debt' ? 'none' : '');
    setFormType(t.type);
    document.getElementById('fAmount').value = t.amount;
    document.getElementById('fDate').value = t.date;
    document.getElementById('fNote').value = t.note || '';
    document.getElementById('fCategory').value = t.category;
    backdrop.classList.add('open');
  }

  const closeModal = ()=> backdrop.classList.remove('open');
  document.getElementById('addBtn').addEventListener('click', openAdd);
  document.getElementById('modalClose').addEventListener('click', closeModal);
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop) closeModal(); });

  formTypeTabs.addEventListener('click', e=>{
    if(e.target.tagName!=='BUTTON') return;
    setFormType(e.target.dataset.v);
  });
  document.getElementById('debtKindTabs').addEventListener('click', e=>{
    if(e.target.tagName!=='BUTTON') return;
    [...e.currentTarget.children].forEach(b=>b.classList.remove('active'));
    e.target.classList.add('active');
    debtKind = e.target.dataset.v;
  });

  document.getElementById('saveBtn').addEventListener('click', ()=>{
    const amount = parseFloat(document.getElementById('fAmount').value);
    if(!amount || amount<=0){ Utils.toast('กรอกจำนวนเงินให้ถูกต้อง'); return; }

    if(formType==='debt'){
      const person = document.getElementById('fPerson').value.trim();
      if(!person){ Utils.toast('กรอกชื่อคน/ร้าน'); return; }
      DB.addDebt({
        kind: debtKind, person, amount,
        dueDate: document.getElementById('fDue').value || null,
        note: document.getElementById('fNote').value.trim()
      });
      closeModal();
      render();
      Utils.toast('บันทึกแล้ว (ดูรายละเอียดเพิ่มที่หน้าหนี้/ยืม-คืน)');
      return;
    }

    const payload = {
      type: formType,
      amount,
      category: document.getElementById('fCategory').value || 'อื่นๆ',
      date: document.getElementById('fDate').value || Utils.todayISO(),
      note: document.getElementById('fNote').value.trim()
    };

    if(editingId){ DB.updateTx(editingId, payload); }
    else { DB.addTx(payload); }

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

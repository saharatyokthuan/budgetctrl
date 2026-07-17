// recurring.js
(function(){
  const freqLabel = {daily:'ทุกวัน', weekly:'ทุกสัปดาห์', monthly:'ทุกเดือน'};
  const listEl = document.getElementById('list');

  function render(){
    const list = DB.getRecurring();
    if(!list.length){ listEl.innerHTML = '<div class="empty">ยังไม่มีรายการประจำ</div>'; return; }
    listEl.innerHTML = list.map(r=>`
      <div class="ledger-row" data-id="${r.id}">
        <span class="dot ${r.type}"></span>
        <span class="meta">
          <div class="cat">${Utils.escapeHtml(r.category)}</div>
          <div class="note">${freqLabel[r.frequency]} · ครั้งถัดไป ${Utils.fmtDate(r.nextDate)}${r.note?' · '+Utils.escapeHtml(r.note):''}</div>
        </span>
        <span class="amt ${r.type}">${r.type==='income'?'+':'-'}${Utils.money(r.amount)}</span>
        <span class="del" data-del="${r.id}">✕</span>
      </div>
    `).join('');
  }

  listEl.addEventListener('click', e=>{
    const id = e.target.dataset.del;
    if(id && confirm('ลบรายการประจำนี้? (รายการที่สร้างไปแล้วจะไม่ถูกลบ)')){ DB.deleteRecurring(id); render(); }
  });

  const backdrop = document.getElementById('modalBackdrop');
  let formType = 'expense';
  function populateCategories(type){
    document.getElementById('fCategory').innerHTML = DB.getCats(type).map(c=>`<option>${Utils.escapeHtml(c.name)}</option>`).join('');
  }
  document.getElementById('addBtn').addEventListener('click', ()=>{
    document.getElementById('fAmount').value='';
    document.getElementById('fNote').value='';
    document.getElementById('fStart').value = Utils.todayISO();
    populateCategories(formType);
    backdrop.classList.add('open');
  });
  document.getElementById('modalClose').addEventListener('click', ()=>backdrop.classList.remove('open'));
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop) backdrop.classList.remove('open'); });
  document.getElementById('formTypeTabs').addEventListener('click', e=>{
    if(e.target.tagName!=='BUTTON') return;
    [...e.currentTarget.children].forEach(b=>b.classList.remove('active'));
    e.target.classList.add('active');
    formType = e.target.dataset.v;
    populateCategories(formType);
  });
  document.getElementById('saveBtn').addEventListener('click', ()=>{
    const amount = parseFloat(document.getElementById('fAmount').value);
    if(!amount || amount<=0){ Utils.toast('กรอกจำนวนเงินให้ถูกต้อง'); return; }
    DB.addRecurring({
      type: formType, amount,
      category: document.getElementById('fCategory').value,
      frequency: document.getElementById('fFreq').value,
      startDate: document.getElementById('fStart').value || Utils.todayISO(),
      note: document.getElementById('fNote').value.trim()
    });
    backdrop.classList.remove('open');
    render();
    Utils.toast('บันทึกแล้ว');
  });

  render();
})();

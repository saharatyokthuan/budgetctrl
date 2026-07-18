// debts.js
(function(){
  let filterKind = 'all';
  const listEl = document.getElementById('list');

  function statusBadge(d){
    if(d.status==='paid') return '<span class="badge paid">ชำระครบแล้ว</span>';
    if(d.dueDate && Utils.daysUntil(d.dueDate)<0) return '<span class="badge overdue">เลยกำหนด</span>';
    return '<span class="badge pending">ค้างอยู่</span>';
  }

  function render(){
    let list = DB.getDebts();
    if(filterKind!=='all') list = list.filter(d=>d.kind===filterKind);
    list = list.slice().sort((a,b)=> (a.status==='paid')-(b.status==='paid') || (a.dueDate||'9999').localeCompare(b.dueDate||'9999'));

    if(!list.length){ listEl.innerHTML = '<div class="empty">ยังไม่มีรายการ</div>'; return; }

    listEl.innerHTML = list.map(d=>`
      <div class="card" style="margin-bottom:8px" data-id="${d.id}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div style="font-weight:700">${Utils.escapeHtml(d.person)}</div>
            <div style="font-size:11px;color:var(--text-dim)">
              ${d.kind==='owe'?'ฉันเป็นหนี้':'ให้ยืม'} · ${d.dueDate?'ครบกำหนด '+Utils.fmtDate(d.dueDate):'ไม่มีกำหนด'}
            </div>
          </div>
          ${statusBadge(d)}
        </div>
        <div style="font-family:var(--mono);font-size:20px;font-weight:700;margin:8px 0;color:${d.kind==='owe'?'var(--expense)':'var(--income)'}">
          ${Utils.money(d.remaining)} <span style="font-size:11px;color:var(--text-dim);font-weight:400">คงเหลือ / เต็ม ${Utils.money(d.amount)}</span>
        </div>
        ${d.note?`<div style="font-size:12px;color:var(--text-dim);margin-bottom:8px">${Utils.escapeHtml(d.note)}</div>`:''}
        <div class="row">
          ${d.status!=='paid'?`<button class="btn sm" data-repay="${d.id}">${d.kind==='owe'?'บันทึกจ่าย':'บันทึกรับคืน'}</button>`:''}
          <button class="btn secondary sm" data-del="${d.id}">ลบ</button>
        </div>
      </div>
    `).join('');
  }

  document.getElementById('kindTabs').addEventListener('click', e=>{
    if(e.target.tagName!=='BUTTON') return;
    [...e.currentTarget.children].forEach(b=>b.classList.remove('active'));
    e.target.classList.add('active');
    filterKind = e.target.dataset.v;
    render();
  });

  listEl.addEventListener('click', e=>{
    const delId = e.target.dataset.del;
    const repayId = e.target.dataset.repay;
    if(delId && confirm('ลบรายการนี้?')){ DB.deleteDebt(delId); render(); }
    if(repayId) openRepay(repayId);
  });

  // ---- Add modal ----
  const backdrop = document.getElementById('modalBackdrop');
  let formKind = 'owe';
  document.getElementById('addBtn').addEventListener('click', ()=>{
    document.getElementById('fPerson').value='';
    document.getElementById('fAmount').value='';
    document.getElementById('fDue').value='';
    document.getElementById('fNote').value='';
    backdrop.classList.add('open');
  });
  document.getElementById('modalClose').addEventListener('click', ()=>backdrop.classList.remove('open'));
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop) backdrop.classList.remove('open'); });
  document.getElementById('formKindTabs').addEventListener('click', e=>{
    if(e.target.tagName!=='BUTTON') return;
    [...e.currentTarget.children].forEach(b=>b.classList.remove('active'));
    e.target.classList.add('active');
    formKind = e.target.dataset.v;
  });
  document.getElementById('saveBtn').addEventListener('click', ()=>{
    const person = document.getElementById('fPerson').value.trim();
    const amount = parseFloat(document.getElementById('fAmount').value);
    if(!person || !amount || amount<=0){ Utils.toast('กรอกชื่อและจำนวนเงินให้ถูกต้อง'); return; }
    DB.addDebt({
      kind: formKind, person, amount,
      dueDate: document.getElementById('fDue').value || null,
      note: document.getElementById('fNote').value.trim()
    });
    backdrop.classList.remove('open');
    render();
    Utils.toast('บันทึกแล้ว');
  });

  // ---- Repay modal ----
  const repayBackdrop = document.getElementById('repayBackdrop');
  let repayTargetId = null;
  function openRepay(id){
    repayTargetId = id;
    const d = DB.getDebts().find(x=>x.id===id);
    document.getElementById('repayTitle').textContent = d.kind==='owe' ? 'บันทึกการจ่ายคืน' : 'บันทึกการรับคืน';
    document.getElementById('repayAmount').value = d.remaining;
    repayBackdrop.classList.add('open');
  }
  document.getElementById('repayClose').addEventListener('click', ()=>repayBackdrop.classList.remove('open'));
  repayBackdrop.addEventListener('click', e=>{ if(e.target===repayBackdrop) repayBackdrop.classList.remove('open'); });
  document.getElementById('repaySave').addEventListener('click', ()=>{
    const amt = parseFloat(document.getElementById('repayAmount').value);
    if(!amt || amt<=0){ Utils.toast('กรอกจำนวนเงินให้ถูกต้อง'); return; }
    DB.repayDebt(repayTargetId, amt);
    repayBackdrop.classList.remove('open');
    render();
    Utils.toast('บันทึกแล้ว');
  });

  render();
})();

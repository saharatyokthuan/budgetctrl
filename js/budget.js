// budget.js
(function(){
  const mk = Utils.monthKey();
  document.getElementById('monthLabel').textContent = Utils.fmtDate(mk+'-01').replace(/^\d+\s/,'');

  const listEl = document.getElementById('list');

  function render(){
    const budgets = DB.getBudgets();
    if(!budgets.length){ listEl.innerHTML = '<div class="empty">ยังไม่ได้ตั้งงบประมาณ</div>'; return; }

    listEl.innerHTML = budgets.map(b=>{
      const spent = DB.spentInMonth(b.category, mk);
      const pct = b.limit>0 ? Math.min(150, spent/b.limit*100) : 0;
      const cls = pct>=100?'over':(pct>=80?'warn':'');
      return `
        <div style="margin-bottom:14px" data-id="${b.id}">
          <div style="display:flex;justify-content:space-between;font-size:13px">
            <span style="font-weight:600">${Utils.escapeHtml(b.category)}</span>
            <span style="font-family:var(--mono)">${Utils.money(spent)} / ${Utils.money(b.limit)}</span>
          </div>
          <div class="progress"><div class="fill ${cls}" style="width:${Math.min(100,pct)}%"></div></div>
          <div style="text-align:right;margin-top:4px">
            <span class="del" data-del="${b.id}" style="font-size:12px;color:var(--text-dim);cursor:pointer">ลบ ✕</span>
          </div>
        </div>
      `;
    }).join('');
  }

  listEl.addEventListener('click', e=>{
    const id = e.target.dataset.del;
    if(id && confirm('ลบงบประมาณนี้?')){ DB.deleteBudget(id); render(); }
  });

  const backdrop = document.getElementById('modalBackdrop');
  document.getElementById('addBtn').addEventListener('click', ()=>{
    const sel = document.getElementById('fCategory');
    sel.innerHTML = DB.getCats('expense').map(c=>`<option>${Utils.escapeHtml(c.name)}</option>`).join('');
    document.getElementById('fLimit').value='';
    backdrop.classList.add('open');
  });
  document.getElementById('modalClose').addEventListener('click', ()=>backdrop.classList.remove('open'));
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop) backdrop.classList.remove('open'); });
  document.getElementById('saveBtn').addEventListener('click', ()=>{
    const limit = parseFloat(document.getElementById('fLimit').value);
    if(!limit || limit<=0){ Utils.toast('กรอกวงเงินให้ถูกต้อง'); return; }
    DB.setBudget(document.getElementById('fCategory').value, limit);
    backdrop.classList.remove('open');
    render();
    Utils.toast('บันทึกแล้ว');
  });

  render();
})();

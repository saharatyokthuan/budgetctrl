// goals.js
(function(){
  const listEl = document.getElementById('list');

  function render(){
    const list = DB.getGoals();
    if(!list.length){ listEl.innerHTML = '<div class="empty">ยังไม่มีเป้าหมาย</div>'; return; }
    listEl.innerHTML = list.map(g=>{
      const pct = g.target>0 ? Math.min(100, g.saved/g.target*100) : 0;
      return `
        <div style="margin-bottom:16px" data-id="${g.id}">
          <div style="display:flex;justify-content:space-between;font-size:13px">
            <span style="font-weight:600">${Utils.escapeHtml(g.name)}</span>
            <span style="font-family:var(--mono)">${Utils.money(g.saved)} / ${Utils.money(g.target)}</span>
          </div>
          <div class="progress"><div class="fill" style="width:${pct}%"></div></div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
            <span style="font-size:11px;color:var(--text-dim)">${g.deadline?'กำหนด '+Utils.fmtDate(g.deadline):''}</span>
            <span>
              <button class="btn sm" data-add="${g.id}">เติมเงิน</button>
              <span class="del" data-del="${g.id}" style="font-size:12px;color:var(--text-dim);cursor:pointer;margin-left:8px">ลบ ✕</span>
            </span>
          </div>
        </div>
      `;
    }).join('');
  }

  listEl.addEventListener('click', e=>{
    const delId = e.target.dataset.del;
    const addId = e.target.dataset.add;
    if(delId && confirm('ลบเป้าหมายนี้?')){ DB.deleteGoal(delId); render(); }
    if(addId) openAddMoney(addId);
  });

  const backdrop = document.getElementById('modalBackdrop');
  document.getElementById('addBtn').addEventListener('click', ()=>{
    document.getElementById('fName').value='';
    document.getElementById('fTarget').value='';
    document.getElementById('fDeadline').value='';
    backdrop.classList.add('open');
  });
  document.getElementById('modalClose').addEventListener('click', ()=>backdrop.classList.remove('open'));
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop) backdrop.classList.remove('open'); });
  document.getElementById('saveBtn').addEventListener('click', ()=>{
    const name = document.getElementById('fName').value.trim();
    const target = parseFloat(document.getElementById('fTarget').value);
    if(!name || !target || target<=0){ Utils.toast('กรอกชื่อและจำนวนเงินให้ถูกต้อง'); return; }
    DB.addGoal({ name, target, deadline: document.getElementById('fDeadline').value || null });
    backdrop.classList.remove('open');
    render();
    Utils.toast('บันทึกแล้ว');
  });

  const addMoneyBackdrop = document.getElementById('addMoneyBackdrop');
  let targetGoalId = null;
  function openAddMoney(id){
    targetGoalId = id;
    document.getElementById('addMoneyAmount').value='';
    addMoneyBackdrop.classList.add('open');
  }
  document.getElementById('addMoneyClose').addEventListener('click', ()=>addMoneyBackdrop.classList.remove('open'));
  addMoneyBackdrop.addEventListener('click', e=>{ if(e.target===addMoneyBackdrop) addMoneyBackdrop.classList.remove('open'); });
  document.getElementById('addMoneySave').addEventListener('click', ()=>{
    const amt = parseFloat(document.getElementById('addMoneyAmount').value);
    if(!amt || amt<=0){ Utils.toast('กรอกจำนวนเงินให้ถูกต้อง'); return; }
    DB.addToGoal(targetGoalId, amt);
    addMoneyBackdrop.classList.remove('open');
    render();
    Utils.toast('บันทึกแล้ว');
  });

  render();
})();

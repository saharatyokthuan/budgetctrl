// dashboard.js
(function(){
  const bal = DB.balance();
  const balEl = document.getElementById('balanceAmt');
  balEl.textContent = Utils.money(bal);
  balEl.className = 'amount ' + (bal>=0?'pos':'neg');

  const tx = DB.getTx();
  document.getElementById('txCount').textContent = tx.length + ' รายการ';

  const mk = Utils.monthKey();
  const monthTx = tx.filter(t=>Utils.monthKey(t.date)===mk);
  document.getElementById('mIncome').textContent = Utils.money(monthTx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0));
  document.getElementById('mExpense').textContent = Utils.money(monthTx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0));

  // ---- Alerts: budgets near/over limit + debts due soon ----
  const alerts = [];
  DB.getBudgets().forEach(b=>{
    const spent = DB.spentInMonth(b.category, mk);
    const pct = b.limit>0 ? (spent/b.limit*100) : 0;
    if(pct>=80){
      alerts.push({
        type: pct>=100?'over':'warn',
        text: `งบ "${Utils.escapeHtml(b.category)}" ใช้ไป ${Utils.money(spent)} จาก ${Utils.money(b.limit)} (${Math.round(pct)}%)`
      });
    }
  });
  DB.getDebts().filter(d=>d.status==='pending' && d.dueDate).forEach(d=>{
    const days = Utils.daysUntil(d.dueDate);
    if(days<=7){
      const who = d.kind==='owe' ? `ต้องจ่าย ${Utils.escapeHtml(d.person)}` : `${Utils.escapeHtml(d.person)} ต้องคืน`;
      alerts.push({
        type: days<0 ? 'over' : 'warn',
        text: `${who} ${Utils.money(d.remaining)} — ${days<0? 'เลยกำหนด '+Math.abs(days)+' วัน' : (days===0?'ครบกำหนดวันนี้':'อีก '+days+' วัน')}`
      });
    }
  });

  if(alerts.length){
    document.getElementById('alertsCard').style.display='';
    document.getElementById('alertsList').innerHTML = alerts.map(a=>
      `<div class="ledger-row"><span class="dot ${a.type==='over'?'expense':'income'}" style="background:${a.type==='over'?'var(--expense)':'var(--debt)'}"></span><span class="meta"><span class="cat">${a.text}</span></span></div>`
    ).join('');
  }

  // ---- Recent transactions ----
  const recent = tx.slice(0,6);
  if(recent.length){
    document.getElementById('recentList').innerHTML = recent.map(t=>`
      <div class="ledger-row">
        <span class="dot ${t.type}"></span>
        <span class="meta">
          <div class="cat">${Utils.escapeHtml(t.category)}</div>
          ${t.note?`<div class="note">${Utils.escapeHtml(t.note)}</div>`:''}
        </span>
        <span class="amt ${t.type}">${t.type==='income'?'+':'-'}${Utils.money(t.amount)}</span>
      </div>
    `).join('');
  }
})();

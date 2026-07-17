// settings.js
(function(){
  let catType = 'expense';
  const catListEl = document.getElementById('catList');

  function renderCats(){
    const cats = DB.getCats(catType);
    catListEl.innerHTML = cats.length ? cats.map(c=>`
      <div class="ledger-row">
        <span class="meta"><span class="cat">${Utils.escapeHtml(c.name)}</span></span>
        <span class="del" data-del="${c.id}">✕</span>
      </div>
    `).join('') : '<div class="empty">ยังไม่มีหมวดหมู่</div>';
  }
  document.getElementById('catTypeTabs').addEventListener('click', e=>{
    if(e.target.tagName!=='BUTTON') return;
    [...e.currentTarget.children].forEach(b=>b.classList.remove('active'));
    e.target.classList.add('active');
    catType = e.target.dataset.v;
    renderCats();
  });
  catListEl.addEventListener('click', e=>{
    const id = e.target.dataset.del;
    if(id && confirm('ลบหมวดหมู่นี้?')){ DB.deleteCat(id); renderCats(); }
  });
  document.getElementById('addCatBtn').addEventListener('click', ()=>{
    const input = document.getElementById('newCatName');
    const name = input.value.trim();
    if(!name){ Utils.toast('กรอกชื่อหมวดหมู่'); return; }
    DB.addCat(name, catType);
    input.value='';
    renderCats();
    Utils.toast('เพิ่มแล้ว');
  });
  renderCats();

  // ---- Backup ----
  document.getElementById('backupBtn').addEventListener('click', ()=>{
    const data = DB.exportAll();
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `budgetctrl_backup_${Utils.todayISO()}.json`;
    a.click();
  });
  document.getElementById('importFile').addEventListener('change', e=>{
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const data = JSON.parse(reader.result);
        DB.importAll(data);
        Utils.toast('นำเข้าข้อมูลสำเร็จ กำลังโหลดหน้าใหม่...');
        setTimeout(()=>location.reload(), 1000);
      }catch(err){ Utils.toast('ไฟล์ไม่ถูกต้อง'); }
    };
    reader.readAsText(file);
  });

  // ---- Sheets sync ----
  const webhookInput = document.getElementById('webhookUrl');
  webhookInput.value = DB.getSettings().sheetsWebhook || '';
  webhookInput.addEventListener('change', ()=> DB.setSettings({sheetsWebhook: webhookInput.value.trim()}));
  document.getElementById('syncBtn').addEventListener('click', async ()=>{
    const url = webhookInput.value.trim();
    if(!url){ Utils.toast('กรอก Web App URL ก่อน'); return; }
    DB.setSettings({sheetsWebhook:url});
    try{
      await fetch(url, {
        method:'POST',
        mode:'no-cors',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(DB.exportAll())
      });
      Utils.toast('ส่งข้อมูลแล้ว (ตรวจสอบผลที่ Google Sheets)');
    }catch(err){
      Utils.toast('ซิงค์ไม่สำเร็จ ตรวจสอบ URL');
    }
  });

  // ---- Reset ----
  document.getElementById('resetBtn').addEventListener('click', ()=>{
    if(confirm('ยืนยันล้างข้อมูลทั้งหมด? การกระทำนี้ย้อนกลับไม่ได้')){
      Object.values(DB.KEYS).forEach(k=>localStorage.removeItem(k));
      location.reload();
    }
  });
})();

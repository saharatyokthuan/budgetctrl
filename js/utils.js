// utils.js - shared helpers
const Utils = {
  uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); },

  money(n){
    n = Number(n) || 0;
    return n.toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
  },

  todayISO(){ return new Date().toISOString().slice(0,10); },

  monthKey(dateStr){ return (dateStr||this.todayISO()).slice(0,7); }, // YYYY-MM

  fmtDate(dateStr){
    if(!dateStr) return '-';
    const d = new Date(dateStr+'T00:00:00');
    const months=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()+543}`;
  },

  daysUntil(dateStr){
    const d = new Date(dateStr+'T00:00:00');
    const t = new Date(); t.setHours(0,0,0,0);
    return Math.round((d-t)/86400000);
  },

  addInterval(dateStr, freq){
    const d = new Date(dateStr+'T00:00:00');
    if(freq==='daily') d.setDate(d.getDate()+1);
    else if(freq==='weekly') d.setDate(d.getDate()+7);
    else if(freq==='monthly') d.setMonth(d.getMonth()+1);
    return d.toISOString().slice(0,10);
  },

  escapeHtml(s){
    return String(s??'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  },

  toast(msg){
    let el = document.getElementById('toast');
    if(!el){
      el = document.createElement('div');
      el.id='toast';
      el.style.cssText='position:fixed;left:50%;bottom:80px;transform:translateX(-50%);background:#1E262F;color:#E7ECEF;border:1px solid #2A343E;padding:10px 16px;border-radius:8px;font-size:13px;z-index:999;transition:opacity .2s;';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity='1';
    clearTimeout(el._t);
    el._t = setTimeout(()=>{ el.style.opacity='0'; }, 1800);
  }
};

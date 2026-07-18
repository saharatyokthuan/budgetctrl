// nav.js - renders sidebar (desktop) + bottom tab bar (mobile)
(function(){
  const LINKS = [
    {href:'index.html',      label:'ภาพรวม',      ico:'⌂'},
    {href:'transactions.html',label:'รายการ',      ico:'≡'},
    {href:'debts.html',      label:'หนี้/ยืม-คืน', ico:'⇄'},
    {href:'budget.html',     label:'งบประมาณ',    ico:'◔'},
    {href:'recurring.html',  label:'รายการประจำ', ico:'↻'},
    {href:'goals.html',      label:'เป้าหมายออม', ico:'✦'},
    {href:'settings.html',   label:'ตั้งค่า',      ico:'⚙'},
  ];

  function currentFile(){
    const p = location.pathname.split('/').pop();
    return p === '' ? 'index.html' : p;
  }

  function render(){
    const cur = currentFile();
    const sidebarMount = document.getElementById('sidebar-mount');
    const navbarMount = document.getElementById('navbar-mount');

    if(sidebarMount){
      sidebarMount.innerHTML =
        '<div class="brand">BUDGET//CTRL+</div>' +
        LINKS.map(l => `<a href="${l.href}" class="${l.href===cur?'active':''}"><span class="ico">${l.ico}</span>${l.label}</a>`).join('');
    }
    if(navbarMount){
      navbarMount.innerHTML = LINKS.map(l =>
        `<a href="${l.href}" class="${l.href===cur?'active':''}"><span class="ico">${l.ico}</span>${l.label}</a>`
      ).join('');
    }
  }

  document.addEventListener('DOMContentLoaded', render);
})();

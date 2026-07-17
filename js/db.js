// db.js - localStorage data layer for BUDGET//CTRL+
const DB = {
  KEYS:{
    tx:'bc_transactions', debts:'bc_debts', budgets:'bc_budgets',
    cats:'bc_categories', recurring:'bc_recurring', goals:'bc_goals',
    settings:'bc_settings'
  },

  _get(key, fallback){
    try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch(e){ return fallback; }
  },
  _set(key, val){ localStorage.setItem(key, JSON.stringify(val)); },

  init(){
    if(this._get(this.KEYS.cats,null)===null){
      this._set(this.KEYS.cats,[
        {id:Utils.uid(),name:'เงินเดือน',type:'income'},
        {id:Utils.uid(),name:'รายรับอื่นๆ',type:'income'},
        {id:Utils.uid(),name:'อาหาร',type:'expense'},
        {id:Utils.uid(),name:'เดินทาง',type:'expense'},
        {id:Utils.uid(),name:'ที่พัก/หอพัก',type:'expense'},
        {id:Utils.uid(),name:'ของใช้ส่วนตัว',type:'expense'},
        {id:Utils.uid(),name:'อื่นๆ',type:'expense'},
        {id:Utils.uid(),name:'ยืม/คืน',type:'income'},
        {id:Utils.uid(),name:'ยืม/คืน',type:'expense'},
      ]);
    }
    for(const k of ['tx','debts','budgets','recurring','goals']){
      if(this._get(this.KEYS[k],null)===null) this._set(this.KEYS[k],[]);
    }
    if(this._get(this.KEYS.settings,null)===null){
      this._set(this.KEYS.settings,{sheetsWebhook:''});
    }
    this.processRecurring();
  },

  // ---- Transactions ----
  getTx(){ return this._get(this.KEYS.tx,[]).sort((a,b)=> a.date<b.date?1:(a.date>b.date?-1:0)); },
  addTx(t){
    const list = this._get(this.KEYS.tx,[]);
    list.push({id:Utils.uid(), createdAt:Date.now(), ...t});
    this._set(this.KEYS.tx,list);
  },
  deleteTx(id){
    this._set(this.KEYS.tx, this._get(this.KEYS.tx,[]).filter(t=>t.id!==id));
  },
  updateTx(id, updates){
    const list = this._get(this.KEYS.tx,[]);
    const t = list.find(x=>x.id===id);
    if(!t) return;
    Object.assign(t, updates);
    this._set(this.KEYS.tx,list);
  },
  balance(){
    return this.getTx().reduce((s,t)=> s + (t.type==='income'? t.amount : -t.amount), 0);
  },

  // ---- Categories ----
  getCats(type){
    const c = this._get(this.KEYS.cats,[]);
    return type ? c.filter(x=>x.type===type) : c;
  },
  addCat(name,type){
    const list = this._get(this.KEYS.cats,[]);
    list.push({id:Utils.uid(),name,type});
    this._set(this.KEYS.cats,list);
  },
  deleteCat(id){
    this._set(this.KEYS.cats, this._get(this.KEYS.cats,[]).filter(c=>c.id!==id));
  },

  // ---- Debts / loans: kind = 'owe' (ฉันเป็นหนี้), 'lend' (ให้คนอื่นยืม) ----
  getDebts(){ return this._get(this.KEYS.debts,[]); },
  addDebt(d){
    const list = this._get(this.KEYS.debts,[]);
    const id = Utils.uid();
    list.push({id, remaining:d.amount, status:'pending', repayments:[], ...d});
    this._set(this.KEYS.debts,list);
    // record the cash movement in the transactions ledger too
    this.addTx({
      type: d.kind==='owe' ? 'income' : 'expense',
      amount: d.amount,
      category: 'ยืม/คืน',
      note: (d.kind==='owe' ? 'ยืมจาก ' : 'ให้ยืม ') + d.person,
      date: Utils.todayISO(),
      debtId: id
    });
  },
  repayDebt(id, amount){
    const list = this._get(this.KEYS.debts,[]);
    const d = list.find(x=>x.id===id);
    if(!d) return;
    amount = Math.min(amount, d.remaining);
    d.remaining = Math.round((d.remaining - amount)*100)/100;
    d.repayments.push({date:Utils.todayISO(), amount});
    if(d.remaining<=0) d.status='paid';
    this._set(this.KEYS.debts,list);
    // record the repayment in the transactions ledger too
    this.addTx({
      type: d.kind==='owe' ? 'expense' : 'income',
      amount,
      category: 'ยืม/คืน',
      note: (d.kind==='owe' ? 'จ่ายคืน ' : 'รับคืนจาก ') + d.person,
      date: Utils.todayISO(),
      debtId: id
    });
  },
  deleteDebt(id){
    this._set(this.KEYS.debts, this._get(this.KEYS.debts,[]).filter(d=>d.id!==id));
  },

  // ---- Budgets: per category monthly limit ----
  getBudgets(){ return this._get(this.KEYS.budgets,[]); },
  setBudget(category, limit){
    const list = this._get(this.KEYS.budgets,[]);
    const existing = list.find(b=>b.category===category);
    if(existing) existing.limit = limit;
    else list.push({id:Utils.uid(), category, limit});
    this._set(this.KEYS.budgets,list);
  },
  deleteBudget(id){
    this._set(this.KEYS.budgets, this._get(this.KEYS.budgets,[]).filter(b=>b.id!==id));
  },
  spentInMonth(category, monthKey){
    return this.getTx()
      .filter(t=>t.type==='expense' && t.category===category && Utils.monthKey(t.date)===monthKey)
      .reduce((s,t)=>s+t.amount,0);
  },

  // ---- Recurring ----
  getRecurring(){ return this._get(this.KEYS.recurring,[]); },
  addRecurring(r){
    const list = this._get(this.KEYS.recurring,[]);
    list.push({id:Utils.uid(), nextDate:r.startDate||Utils.todayISO(), ...r});
    this._set(this.KEYS.recurring,list);
  },
  deleteRecurring(id){
    this._set(this.KEYS.recurring, this._get(this.KEYS.recurring,[]).filter(r=>r.id!==id));
  },
  processRecurring(){
    const list = this._get(this.KEYS.recurring,[]);
    const today = Utils.todayISO();
    let changed = false;
    for(const r of list){
      let guard = 0;
      while(r.nextDate <= today && guard < 60){
        this.addTx({type:r.type, amount:r.amount, category:r.category, note:(r.note||'')+' (ทำซ้ำอัตโนมัติ)', date:r.nextDate, recurringId:r.id});
        r.nextDate = Utils.addInterval(r.nextDate, r.frequency);
        changed = true; guard++;
      }
    }
    if(changed) this._set(this.KEYS.recurring,list);
  },

  // ---- Goals ----
  getGoals(){ return this._get(this.KEYS.goals,[]); },
  addGoal(g){
    const list = this._get(this.KEYS.goals,[]);
    list.push({id:Utils.uid(), saved:0, ...g});
    this._set(this.KEYS.goals,list);
  },
  addToGoal(id, amount){
    const list = this._get(this.KEYS.goals,[]);
    const g = list.find(x=>x.id===id);
    if(g) g.saved = Math.round((g.saved+amount)*100)/100;
    this._set(this.KEYS.goals,list);
  },
  deleteGoal(id){
    this._set(this.KEYS.goals, this._get(this.KEYS.goals,[]).filter(g=>g.id!==id));
  },

  // ---- Settings / backup ----
  getSettings(){ return this._get(this.KEYS.settings,{sheetsWebhook:''}); },
  setSettings(s){ this._set(this.KEYS.settings, {...this.getSettings(), ...s}); },

  exportAll(){
    const data = {};
    for(const k in this.KEYS) data[k] = this._get(this.KEYS[k], null);
    return data;
  },
  importAll(data){
    for(const k in this.KEYS){
      if(data[k] !== undefined) this._set(this.KEYS[k], data[k]);
    }
  }
};

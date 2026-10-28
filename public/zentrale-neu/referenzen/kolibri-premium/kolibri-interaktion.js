(() => {
  const host = document.getElementById('secret58-kolibri-section');
  if (!host || host.dataset.k58Initialized === 'true') return;
  host.dataset.k58Initialized = 'true';
  const q = (id) => host.querySelector('#' + id);
  const rates = {premium: 15000, ultimate: 30000, signature: 50000};
  const money = (v) => new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(v);
  const controls = ['k58-paket','k58-seiten','k58-motion','k58-seo','k58-lang','k58-shop'].map(q);
  function calculation() {
    const base = rates[q('k58-paket').value];
    const pages = Number(q('k58-seiten').value);
    const addons = [{id:'k58-motion',name:'Individuelles Motion-Paket',price:1800},{id:'k58-seo',name:'Erweiterte SEO-Einrichtung',price:1200},{id:'k58-lang',name:'Zusätzliche Sprache',price:1700},{id:'k58-shop',name:'Einfacher Shop-Bereich',price:1490}].filter(a=>q(a.id).checked);
    return {price:base + pages*150 + addons.reduce((v,a)=>v+a.price,0),pages,addons,pack:q('k58-paket').selectedOptions[0].text};
  }
  function update(){q('k58-total').textContent=money(calculation().price);q('k58-copy-output').hidden=true;}
  controls.forEach(c=> c.addEventListener('change', update));
  q('k58-form').addEventListener('submit',e=>e.preventDefault());
  q('k58-copy').addEventListener('click',()=>{
    const x=calculation();
    const val='Kolibri Premium – unverbindliche Preisorientierung\n' + x.pack + '\nZusätzliche Seiten: '+x.pages+'\n'+(x.addons.length?x.addons.map(a=>a.name+': '+money(a.price)).join('\n'):'Keine Zusatzleistungen')+'\nRichtpreis einmalig (Endpreis, keine USt. nach § 19 UStG): '+money(x.price)+'\nEin verbindliches Angebot erfolgt nach individueller Prüfung.';
    q('k58-summary').value=val;
    q('k58-copy-output').hidden=false;
    q('k58-summary').focus();q('k58-summary').select();
  });
  update();
})();

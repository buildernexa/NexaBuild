let CMP=[];
function cmpT(i){const k=CMP.indexOf(i);k>=0?CMP.splice(k,1):CMP.push(i);if(CMP.length>2)CMP.shift();hist()}
function cmpHtml(){
 if(!CMP.length)return"";if(CMP.length<2)return`<p>Pilih satu build lagi untuk dibandingkan.</p>`;
 const [a,b]=CMP.map(i=>H[i]),sz=h=>((h.sum&&h.sum.files)||[]).reduce((x,f)=>x+f.size,0),sh=h=>(((h.sum&&h.sum.files)||[])[0]||{sha:"-"}).sha.slice(0,12);
 const row=(l,x,y)=>`<tr class="${x===y?"":"df"}"><td>${l}</td><td>${esc(x)}</td><td>${esc(y)}</td></tr>`,cf=h=>h.cfg||{};
 return `<div class="card"><h2>Perbandingan</h2><table class="ct">${row("Versi",a.vn+" ("+a.vc+")",b.vn+" ("+b.vc+")")}${row("Status",lab(a.st),lab(b.st))}${row("Durasi",fmtT(a.dur||0),fmtT(b.dur||0))}${row("Ukuran",fsz(sz(a)),fsz(sz(b)))}${row("Format",cf(a).fmt+" "+cf(a).var,cf(b).fmt+" "+cf(b).var)}${row("R8",cf(a).minify?"ya":"tidak",cf(b).minify?"ya":"tidak")}${row("Izin",(cf(a).perms||[]).join(", "),(cf(b).perms||[]).join(", "))}${row("SHA-256",sh(a),sh(b))}</table></div>`;
}
const lnk=i=>(H[i].assets&&H[i].assets[0]||{}).u||H[i].rel;
function copyLink(i){navigator.clipboard.writeText(lnk(i)).then(()=>toast("Tautan disalin"))}
async function qr(i){
 const b=$("#qrb");if(b.innerHTML){b.innerHTML="";return}
 try{
  if(!window.qrcode)await new Promise((ok,no)=>{const x=document.createElement("script");x.src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js";x.onload=ok;x.onerror=()=>no(Error("QR gagal dimuat"));document.head.appendChild(x)});
  const q=qrcode(0,"M");q.addData(lnk(i));q.make();b.innerHTML='<div class="card" style="display:grid;place-items:center;box-shadow:2px 2px 0 #000">'+q.createSvgTag({cellSize:5,margin:2})+"</div>";
 }catch(e){toast(e.message)}
}
async function queue(){
 if(!S.t)return 0;
 try{
  const r=await Promise.all(["in_progress","queued"].map(x=>api(`/repos/${S.r}/actions/runs?status=${x}&per_page=5`)));
  const l=r.flatMap(x=>x.workflow_runs),b=$("#qb");b.hidden=!l.length||busy;
  b.textContent=l.length?"Build lain di repo: "+l.map(x=>"#"+x.run_number+(x.status==="queued"?" (antre)":" (berjalan)")).join(", "):"";
  return busy?0:l.length;
 }catch{return -1}
}
function kv(e){
 const s=e.sum||{},f=s.files||[];
 return `<dl class="kv"><dt>Aplikasi</dt><dd>${esc(s.name||e.name)}</dd><dt>Package</dt><dd>${esc(s.pkg||(e.cfg||{}).pkg)}</dd><dt>Versi</dt><dd>${esc(e.vn)} (${e.vc})</dd><dt>Durasi</dt><dd>${fmtT(e.dur||0)}</dd></dl>${f.map(x=>`<div class="fl"><b>${esc(x.n)}</b> &middot; ${(x.size/1048576).toFixed(2)} MB<br><span class="mono">SHA-256 ${esc(x.sha)}</span></div>`).join("")}${(s.apk||[]).map(x=>`<div class="fl"><b>Isi APK</b> &middot; ${esc(x.label||"-")} &middot; ${esc(x.pkg)} ${esc(x.vn)} (${esc(x.vc)}) &middot; ${esc(x.assets)} berkas aset</div>`).join("")}${(s.gen||[]).length?`<details><summary>${s.gen.length} berkas dibuat</summary><pre>${esc(s.gen.join("\n"))}</pre></details>`:""}`;
}
function summ(e){
 $("#rs").innerHTML=`<div class="card"><div class="wh"><h2>Ringkasan hasil</h2><span class="tag success">Berhasil</span></div>${kv(e)}<div class="stack">${(e.assets||[]).map((a,j)=>`<button class="btn" onclick="dl(0,${j})">Unduh ${esc(a.n)}</button>`).join("")}<button class="btn w" onclick="share(0)">Bagikan</button><button class="btn w" onclick="copyLink(0)">Salin tautan</button><button class="btn w" onclick="qr(0)">Tampilkan QR</button><div id="qrb"></div></div></div>`;
}
function share(i){const e=H[i],d={title:e.name,text:e.name+" v"+e.vn,url:e.rel};navigator.share?navigator.share(d).catch(()=>{}):navigator.clipboard.writeText(e.rel).then(()=>toast("Tautan disalin"))}
async function dl(i,j){
 const a=H[i].assets[j];if(!a.id){window.open(a.u,"_blank");return}
 if(DL)return toast("Unduhan lain masih berjalan");
 const ab=DL=new AbortController(),p=$("#dp");p.hidden=false;
 const draw=(g,t,sp)=>{p.innerHTML=`<div class="wh"><b class="ell">${esc(a.n)}</b><button class="btn w" id="dc" style="width:auto;min-height:36px;padding:0 12px;box-shadow:none">Batal</button></div><div class="bar"><i style="width:${t?g/t*100:8}%"></i></div><p>${t?Math.round(g/t*100)+"% &middot; ":""}${(g/1048576).toFixed(1)}${t?" / "+(t/1048576).toFixed(1):""} MB &middot; ${(sp/1048576).toFixed(1)} MB/s</p>`;$("#dc").onclick=()=>ab.abort()};
 draw(0,a.s||0,0);
 try{
  const r=await fetch(`https://api.github.com/repos/${S.r}/releases/assets/${a.id}`,{headers:{Accept:"application/octet-stream",Authorization:"Bearer "+S.t},signal:ab.signal});
  if(!r.ok)throw Error(r.status);
  const tot=+r.headers.get("content-length")||a.s||0,rd=r.body.getReader(),ch=[],t0=performance.now();let g=0;
  for(;;){const {done,value}=await rd.read();if(done)break;ch.push(value);g+=value.length;draw(g,tot,g/((performance.now()-t0)/1000||1))}
  const u=URL.createObjectURL(new Blob(ch,{type:"application/octet-stream"})),x=document.createElement("a");x.href=u;x.download=a.n;x.click();setTimeout(()=>URL.revokeObjectURL(u),9e3);toast("Unduhan selesai");
 }catch(e){if(e.name==="AbortError")toast("Unduhan dibatalkan");else{toast("Unduhan langsung diblokir. Membuka tautan GitHub.");window.open(a.u,"_blank")}}
 DL=null;p.hidden=true;
}
function notify(t){
 if(!("Notification"in window)||Notification.permission!=="granted")return;
 try{navigator.serviceWorker.ready.then(r=>r.showNotification("NexaBuild",{body:t}))}catch{}
}

function attachRelease(e,rel){
 e.rel=rel.html_url;e.relid=rel.id;e.tag=rel.tag_name;
 e.assets=(rel.assets||[]).map(a=>({n:a.name,u:a.browser_download_url,id:a.id,s:a.size}));
 const m=(rel.body||"").match(/<!--nexa:(.*?)-->/s);try{e.sum=m?JSON.parse(m[1]):null}catch{e.sum=null}
}
/* build yang terputus (aplikasi ditutup saat berjalan) dicocokkan ulang dengan status di GitHub */
async function reconcile(){
 if(!S.t||busy)return;
 let ch=false;
 for(const e of H){
  if(e.st!=="running"||!e.runId)continue;
  try{
   const r=await api(`/repos/${S.r}/actions/runs/${e.runId}`);
   if(r.status!=="completed")continue;
   e.st=r.conclusion||"failure";e.dur=Math.round((Date.parse(r.updated_at)-Date.parse(r.run_started_at))/1000);ch=true;
   if(e.st==="success"){
    const vn=String((e.cfg||{}).vn||e.vn||"1.0.0").replace(/[^\w.+-]/g,"");
    const tag="v"+vn+"-"+r.run_number;let rel=null;
    try{rel=await api(`/repos/${S.r}/releases/tags/${encodeURIComponent(tag)}`)}catch{}
    if(rel)attachRelease(e,rel);else e.rel=r.html_url;
   }
  }catch{}
 }
 if(ch){sv("h",H);if(tab===2)hist();if(tab===0)home()}
}

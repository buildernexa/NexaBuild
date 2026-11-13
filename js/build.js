let WAITING=false;
async function build(){
 if(busy||WAITING)return;
 if(!S.t){toast("Hubungkan GitHub dulu");drawer(true);return}
 if(!val()){toast("Perbaiki isian yang ditandai");return}
 const vc0=S.vc,vcMap0={...(S.vcByPkg||{})},undo=()=>{S.vc=vc0;S.vcByPkg=vcMap0;sv("s",S)};let c;
 try{c=cfg()}catch(e){undo();$("#bm").textContent=e.message;return}
 c.build_id=crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+"-"+Math.random().toString(36).slice(2);
 try{
  const repo=await api("/repos/"+S.r);S.repoPrivate=!!repo.private;sv("s",S);
  if(c.sr==="zip"&&!S.repoPrivate)throw Error("Repo apk-builder masih public. Jadikan private sebelum mengunggah ZIP karena file akan masuk ke riwayat Git.");
 }catch(e){undo();$("#bm").textContent=e.message;return}
 if($("#ai").checked){
  try{
   const releases=await api(`/repos/${S.r}/releases?per_page=100`);let latest=0;
   for(const rel of releases){
    const match=(rel.body||"").match(/<!--nexa:([\s\S]*?)-->/);if(!match)continue;
    try{
     const meta=JSON.parse(match[1]);
     if(meta.pkg===c.pkg)latest=Math.max(latest,Number(meta.vc)||0);
     for(const a of (meta.apk||[]))if(a.pkg===c.pkg)latest=Math.max(latest,Number(a.vc)||0);
    }catch{}
   }
   if(latest>=c.vc){c.vc=latest+1;$("#vc").value=c.vc;S.vcByPkg[c.pkg]=c.vc;S.vc=c.vc;sv("s",S)}
  }catch(e){toast("Riwayat versi GitHub tidak terbaca; memakai penghitung lokal.")}
 }
 const pf=preflight(c);
 if(pf.E.length){undo();$("#bm").textContent=pf.E[0];return}
 if(pf.W.length)toast(pf.W[0]);
 const qn=await queue();
 if(qn<0){undo();$("#bm").textContent="Tidak dapat memeriksa antrean GitHub. Periksa koneksi lalu coba lagi.";return}
 if(qn){
  if(!confirm(`Ada ${qn} build lain di repo build. Tunggu sampai semuanya selesai sebelum build baru dikirim?`)){undo();return}
  WAITING=true;$("#go").disabled=true;$("#bm").textContent="Menunggu build sebelumnya selesai...";
  try{
   let elapsed=0;
   while(true){
    const active=await Promise.all(["in_progress","queued"].map(x=>api(`/repos/${S.r}/actions/runs?status=${x}&per_page=5`)));
    const pending=active.flatMap(x=>x.workflow_runs);
    const box=$("#qb");box.hidden=!pending.length;
    box.textContent=pending.length?"Menunggu: "+pending.map(x=>"#"+x.run_number+(x.status==="queued"?" (antre)":" (berjalan)")).join(", "):"";
    if(!pending.length)break;
    if(elapsed>=3600000)throw Error("Waktu tunggu mencapai 60 menit. Build belum dikirim.");
    await sleep(5000);elapsed+=5000;
   }
  }catch(e){WAITING=false;$("#go").disabled=false;undo();$("#bm").textContent=e.message;return}
  WAITING=false;$("#go").disabled=false;$("#bm").textContent="";
 }
 if(TPLOK!==true){
  $("#go").disabled=true;await checkTpl();
  if(TPLOK===false&&!await syncTpl(true)){$("#go").disabled=false;undo();return}
  $("#go").disabled=false;
 }
 try{
  await checkFixed();
  if(FIXED===false){
   const msg=$("#fkm");if(msg)msg.textContent="Mengaktifkan kunci tanda tangan tetap...";
   await enableFixed();
   await checkFixed();
  }
  if(FIXED!==true){undo();throw Error("Kunci tanda tangan tetap belum aktif. Periksa izin GitHub Actions secrets dan coba lagi.")}
 }catch(e){undo();$("#bm").textContent=e.message;return}
 if("Notification"in window&&Notification.permission==="default")Notification.requestPermission();
 busy=true;run=null;PL={};T={t0:Date.now(),steps:[],f:"",as:true,lf:0,pct:0,c,zip:c.sr==="zip"};
 const tm=$("#term");
 $("#nl").innerHTML="";$("#gl").innerHTML="";$("#lgd").hidden=true;$("#lgd").open=false;$("#hn").innerHTML="";$("#rs").innerHTML="";$("#mu").hidden=true;$("#sq").value="";
 $("#pct").dataset.v=0;$("#pct").textContent=0;$("#pf").style.width="0%";
 document.querySelectorAll("[data-f]").forEach(x=>x.setAttribute("aria-pressed",x.dataset.f===""));$("#as").setAttribute("aria-pressed","true");
 $("#go").disabled=true;$("#bm").textContent="";$("#logo").classList.add("spin");
 tm.classList.remove("land");void tm.offsetWidth;tm.classList.add("land");
 tmr=setInterval(termDraw,250);termDraw();plRender();tm.scrollIntoView({behavior:"smooth",block:"start"});
 const e={id:Date.now(),name:c.name,vn:c.vn,vc:c.vc,st:"running",t:Date.now(),cfg:c};H.unshift(e);sv("h",H);stats();
 const chk=()=>{if(T.cxReq&&!run)throw Error("Build dibatalkan.")};
 const getJob=async()=>{
  const jobs=(await api(`/repos/${S.r}/actions/runs/${run.id}/jobs`)).jobs||[];
  const j=jobs.find(x=>x.status==="in_progress")||jobs.find(x=>x.status==="queued")||jobs[jobs.length-1];
  if(j){
   if(T.currentJobId!==j.id){T.currentJobId=j.id;T.nolive=false;T.lf=0}
   T.steps=jobs.flatMap(x=>x.steps||[]);T.steps.forEach(x=>PL[x.name]=x.conclusion||x.status)
  }
  return j;
 };
 const getLog=async j=>{T.log=await(await api(`/repos/${S.r}/actions/jobs/${j.id}/logs`,{raw:true})).text();logApply();const m=[...T.log.slice(-6000).matchAll(/> Task :([\w:.-]+)/g)];T.task=m.length?m[m.length-1][1].replace(/^app:/,""):""};
 try{
  if(c.sr==="zip"){c.zip=await upZip(PF);chk()}
  const prev=(await api(`/repos/${S.r}/actions/runs?per_page=1`)).workflow_runs[0]?.id||0;
  const rp=await api("/repos/"+S.r);chk();
  const body=JSON.stringify({ref:rp.default_branch,inputs:{config:JSON.stringify(c)}});
  for(let a=0;;a++){
   try{await api(`/repos/${S.r}/actions/workflows/build.yml/dispatches`,{method:"POST",body});break}
   catch(x){if(a<3&&/^(404|422)/.test(x.message)){T.msg="Menunggu workflow siap";termDraw();await sleep(3000);chk();continue}throw x}
  }
  T.dsp=true;termDraw();
  for(let i=0;i<30&&!run;i++){
   chk();await sleep(3000);
   const runs=(await api(`/repos/${S.r}/actions/runs?event=workflow_dispatch&per_page=10`)).workflow_runs;
   run=runs.find(r=>String(r.display_title||r.name||"").includes(c.build_id))||runs.find(r=>r.id>prev)||null;
  }
  if(!run)throw Error("Run tidak ditemukan. Pastikan Actions aktif di repo build.");
  e.runId=run.id;sv("h",H);
  if(T.cxReq)await cancelRun();
  let r,j;
  for(let k=0;;k++){
   if(Date.now()-T.t0>70*60000)throw Error("Build melebihi 70 menit. Periksa run di GitHub.");
   j=await getJob();termDraw();plRender();
   if(j&&j.status!=="queued"&&!T.nolive)try{await getLog(j)}catch{if(++T.lf>2){T.nolive=true;line("nolive","Log langsung belum tersedia dari GitHub. Log lengkap muncul setelah selesai.","nt")}}
   r=await api(`/repos/${S.r}/actions/runs/${run.id}`);
   if(r.status==="completed")break;
   await sleep(2500+Math.min(k,10)*250);
  }
  j=await getJob();try{await getLog(j)}catch{}
  T.fin=true;T.ok=r.conclusion==="success";T.cx=r.conclusion==="cancelled";
  e.st=r.conclusion;e.dur=Math.round((Date.parse(r.updated_at)-Date.parse(r.run_started_at))/1000);T.dur=e.dur;
  e.sd={};KEY.forEach(k=>{const x=by(k);if(x&&x.conclusion==="success"&&x.started_at&&x.completed_at)e.sd[k]=Math.max(1,Math.round((Date.parse(x.completed_at)-Date.parse(x.started_at))/1000))});
  plRender();termDraw();logDraw();
  if(T.ok){
   const tag="v"+String(c.vn||"1.0.0").replace(/[^\w.+-]/g,"")+"-"+run.run_number;
   let rel=null;try{rel=await api(`/repos/${S.r}/releases/tags/${encodeURIComponent(tag)}`)}catch{}
   if(rel)attachRelease(e,rel);else{e.rel=r.html_url;toast("Build berhasil, tetapi release "+tag+" tidak ditemukan. Buka run di GitHub.")}
   sv("h",H);summ(e);
  }else if(!T.cx){
   const d=diagnose(T.log),fs=T.steps.find(x=>sc(x)==="er"),fk=fs&&key(fs.name);
   e.hint=d?(d.hint||d.primary):"Buka run di GitHub untuk detail.";e.err=d?d.primary:"";
   $("#hn").innerHTML=failCard(d,fk?NR[fk][0]:"",r.html_url);
  }
 }catch(err){
  T.dur=Math.round((Date.now()-T.t0)/1000);T.fin=true;T.ok=false;
  if(T.cxReq&&/dibatalkan/i.test(err.message)){e.st="cancelled";T.cx=true;termDraw()}
  else{
   let m=err.message;
   if(/^(404|422)/.test(m))m="Workflow belum siap di repo build ("+m+"). Perbarui repo build lewat banner di atas, lalu coba lagi.";
   e.st="failure";e.hint=m;$("#bm").textContent=m;termDraw();
   $("#hn").innerHTML=failCard({primary:m,ctx:[],hint:""},"",run?run.html_url:"");
  }
 }finally{
  if(H.length>60)H.length=60;clearInterval(tmr);$("#logo").classList.remove("spin");busy=false;run=null;$("#go").disabled=false;sv("h",H);stats();plRender();
  toast(`${e.name}: ${lab(e.st)}`);notify(`${e.name} ${lab(e.st).toLowerCase()}`);queue();
 }
}
async function cancelRun(){try{await api(`/repos/${S.r}/actions/runs/${run.id}/cancel`,{method:"POST"});toast("Pembatalan dikirim")}catch(e){toast(e.message)}}
async function cancel(){
 if(!busy)return toast("Tidak ada build yang berjalan");
 T.cxReq=true;if(T.xhr)try{T.xhr.abort()}catch{}
 if(run)await cancelRun();else toast("Membatalkan...");
}
function val(){
 const p=$("#pkg").value.trim(),v=$("#vc").value,pb=!!p&&!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(p),vb=v!==""&&!(+v>0&&Number.isInteger(+v));
 $("#pe").textContent=pb?"Format: com.contoh.app (huruf kecil, minimal dua bagian)":"";$("#ve").textContent=vb?"Harus bilangan bulat positif":"";
 $("#pkg").setAttribute("aria-invalid",pb);$("#vc").setAttribute("aria-invalid",vb);auUI();return !pb&&!vb;
}
const TPL={"WebView":{ori:"unspecified",mf:1,pm:["internet"]},"Link-in-bio":{ori:"portrait",mf:1,pm:["internet"],col:"#ffd600"},"Portfolio":{ori:"unspecified",mf:1,pm:["internet"],col:"#000000"},"PWA wrapper":{ori:"unspecified",mf:1,pm:["internet","notifications"]},"Kiosk":{ori:"landscape",ki:1,pm:["internet"]}};
const tplInit=()=>$("#tpl").innerHTML=Object.keys(TPL).map(k=>`<button class="chipb" onclick="tpl('${k}')">${k}</button>`).join("");
function tpl(k){
 const t=TPL[k];$("#ori").value=t.ori;$("#mf").checked=!!t.mf;$("#ki").checked=!!t.ki;if(t.col)$("#col").value=t.col;
 document.querySelectorAll(".pm").forEach(x=>x.checked=t.pm.includes(x.value));
 $("#v-build details").open=true;$("#url").focus();toast("Template "+k+" dimuat. Isi URL situsmu.");
}
async function upIcon(f){
 const im=t=>$("#im").textContent=t;
 if(!S.t){im("Hubungkan GitHub dulu.");return}
 if(!f||f.size>8*1024*1024){im("Pilih gambar PNG maksimal 8 MB.");return}
 try{
  im("1/3 Memvalidasi gambar...");
  const bmp=await createImageBitmap(f);
  if(bmp.width<64||bmp.height<64||bmp.width>8192||bmp.height>8192){bmp.close();throw Error("Ukuran gambar harus 64–8192 piksel per sisi.")}
  const canvas=document.createElement("canvas");canvas.width=1024;canvas.height=1024;
  const ctx=canvas.getContext("2d");const scale=Math.min(900/bmp.width,900/bmp.height);
  const w=Math.round(bmp.width*scale),h=Math.round(bmp.height*scale);
  ctx.clearRect(0,0,1024,1024);ctx.drawImage(bmp,(1024-w)/2,(1024-h)/2,w,h);bmp.close();
  const blob=await new Promise((ok,no)=>canvas.toBlob(x=>x?ok(x):no(Error("Konversi PNG gagal.")),"image/png"));
  if(blob.size>900*1024)throw Error("Hasil PNG lebih dari 900 KB. Gunakan gambar yang lebih sederhana.");
  const b=await new Promise((ok,no)=>{const x=new FileReader();x.onload=()=>ok(x.result.split(",")[1]);x.onerror=no;x.readAsDataURL(blob)});
  im("2/3 Memeriksa repo...");let sha;try{sha=(await api(`/repos/${S.r}/contents/assets/icon.png`)).sha}catch{}
  im("3/3 Mengunggah PNG...");
  await api(`/repos/${S.r}/contents/assets/icon.png`,{method:"PUT",body:JSON.stringify({message:"Update launcher icon",content:b,sha})});
  S.icon=true;sv("s",S);im("Ikon PNG valid terpasang untuk build berikutnya.");toast("Ikon diunggah");
 }catch(e){im(e.message)}
}

const KW=new Set("abstract actual annotation as assert boolean break byte by case catch char class companion const constructor continue crossinline data default delegate do double dynamic else enum expect extends external false field final finally float for fun get goto if implements import in infix init inline inner instanceof int interface internal is lateinit long native new noinline null object open operator out override package param private property protected public receiver reified return sealed set setparam short static strictfp super suspend switch synchronized tailrec this throw throws transient true try typealias val var vararg void volatile when where while".split());
function preflight(c){
 const E=[],W=[],bad=c.pkg.split(".").find(x=>KW.has(x));
 if(bad)W.push(`Segmen package "${bad}" adalah kata kunci. Otomatis diubah menjadi "${bad}_".`);
 if(c.vc>2100000000)E.push("versionCode terlalu besar (maksimal 2.100.000.000).");
 if(c.min<26||c.min>34)W.push("minSdk disesuaikan ke rentang 26 sampai 34.");
 if(c.url&&!/^https?:\/\//.test(c.url))E.push("URL WebView harus diawali http:// atau https://.");
 if(c.flv&&c.flv.split(",").some(x=>x.trim()&&!/^[a-z][a-z0-9]*$/i.test(x.trim())))W.push("Nama flavor hanya boleh huruf dan angka. Karakter lain dibuang.");
 (c.bc||"").split("\n").forEach(l=>{if(l.trim()&&!/^[A-Za-z_][A-Za-z0-9_]*=/.test(l.trim()))W.push(`BuildConfig "${l.trim().slice(0,24)}" bukan format KEY=nilai dan dilewati.`)});
 if(c.args&&!/^[\w\s=:.,@\/+"-]*$/.test(c.args))E.push("Argumen Gradle memuat karakter yang tidak diizinkan.");
 if(c.sub&&/\.\./.test(c.sub))E.push("Subfolder tidak boleh memuat '..'.");
 if(c.vn&&!/^[\w.+-]+$/.test(c.vn))W.push("versionName hanya boleh huruf, angka, titik, plus, dan minus. Karakter lain dibuang.");
 if(!navigator.onLine)E.push("Perangkat sedang offline.");
 return{E,W};
}

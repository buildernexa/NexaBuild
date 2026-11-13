function upZip(f){
 return new Promise((ok,no)=>{
  if(S.repoPrivate!==true)return no(Error("Repo apk-builder harus private sebelum ZIP diunggah. Buka menu koneksi lalu tekan 'Jadikan repo private'."));
  if(f.size>50*1048576)return no(Error("ZIP lebih dari 50 MB. Gunakan opsi repo GitHub untuk proyek besar."));
  const path=`uploads/${Date.now()}.zip`,rd=new FileReader();
  rd.onerror=()=>no(Error("Gagal membaca file ZIP."));
  rd.onload=()=>{
   const x=new XMLHttpRequest(),t0=performance.now();T.xhr=x;x.onabort=()=>no(Error("Build dibatalkan."));
   x.open("PUT",`https://api.github.com/repos/${S.r}/contents/${path}`);
   x.setRequestHeader("Authorization","Bearer "+S.t);x.setRequestHeader("Accept","application/vnd.github+json");x.setRequestHeader("Content-Type","application/json");
   x.upload.onprogress=e=>{if(!e.lengthComputable)return;T.up=e.loaded/e.total;const sz=T.up*f.size,sp=sz/((performance.now()-t0)/1000||1);line("up",`Mengunggah ZIP · ${Math.round(T.up*100)}% · ${(sz/1048576).toFixed(1)}/${(f.size/1048576).toFixed(1)} MB · ${(sp/1048576).toFixed(1)} MB/s`,"on")};
   x.onload=()=>{if(x.status<300){T.up=1;line("up","ZIP terunggah ("+(f.size/1048576).toFixed(1)+" MB)","ok");ok(path)}else no(Error("Unggah ZIP gagal ("+x.status+")."))};
   x.onerror=()=>no(Error("Koneksi terputus saat mengunggah ZIP."));
   x.send('{"message":"Unggah ZIP","content":"'+rd.result.split(",")[1]+'"}');
  };
  rd.readAsDataURL(f);
 });
}
/* ===== alur bertahap, analisis proyek, sinkron template ===== */
let ST=0,URLOK=false,A=null,AUTO={},PF=null,PFN="",PFSZ=0,FZ=null,TPLOK=null,TPLT=0,FIXED=null,SYNC_BAD=[];
const PMAP={INTERNET:"internet",CAMERA:"camera",READ_EXTERNAL_STORAGE:"storage",WRITE_EXTERNAL_STORAGE:"storage",ACCESS_FINE_LOCATION:"location",ACCESS_COARSE_LOCATION:"location",POST_NOTIFICATIONS:"notifications"};
const KN={flutter:"Flutter",capacitor:"Capacitor",rn:"React Native / Expo",gradle:"Gradle Android",web:"Web (HTML/JS)",site:"Situs web"};
const fsz=b=>b>1048576?(b/1048576).toFixed(1)+" MB":Math.max(1,Math.round(b/1024))+" KB";
const pretty=x=>String(x).replace(/[-_.]+/g," ").replace(/\b\w/g,c=>c.toUpperCase());
const effKind=()=>A&&A.kind&&A.conf>=70?A.kind:($("#kd").value||(A&&A.kind)||"");
const loadJSZip=()=>window.JSZip?Promise.resolve():new Promise((ok,no)=>{const x=document.createElement("script");x.src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";x.onload=ok;x.onerror=()=>no(Error("Pembaca ZIP gagal dimuat. Periksa koneksi."));document.head.appendChild(x)});
function idleDraw(){
 if(T.t0)return;
 const sr=$("#sr").value;
 line("idle",!sr?"Pilih sumber proyek untuk memulai":sr==="scratch"?"Siap membuat aplikasi dasar. Menunggu build dimulai":A||URLOK?"Siap dibuild. Menunggu build dimulai":sr==="zip"?"Menunggu file proyek dipilih":"Menunggu URL dibaca","id");
}
function setSrc(v){
 if($("#sr").value!==v){A=null;PF=null;FZ=null;URLOK=false;AUTO={};$("#an").innerHTML="";$("#kdw").hidden=true;$("#ut").hidden=true;dzUI();auUI()}
 $("#sr").value=v;document.querySelectorAll("#srcs button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.v===v));
 $("#szf").hidden=v!=="zip";$("#uf").hidden=v!=="url";$("#sbw").hidden=!v||v==="scratch";$("#rfw").hidden=v!=="url";$("#tplw").hidden=v!=="scratch";$("#ovw").hidden=!v||v==="scratch";
 if(v==="scratch")$("#an").innerHTML=`<div class="card" style="box-shadow:2px 2px 0 #000"><b>Aplikasi dasar tanpa proyek</b><p style="margin:6px 0 0">Dibuat dari konfigurasi saja: halaman teks, atau WebView bila kamu mengisi URL WebView.</p></div>`;
 idleDraw();
}
function dzUI(){$("#dz").classList.toggle("has",!!PF);$("#dzt").textContent=PF?PFN:"Pilih ZIP atau HTML";$("#dzs").textContent=PF?fsz(PFSZ):"Maks 50 MB";$("#dzx").hidden=!PF;$("#dzb").hidden=!!PF}
function auUI(){
 ["name","pkg","vn","vc"].forEach(f=>{const e=document.querySelector(`.au[data-f=${f}]`);if(!e)return;e.innerHTML=AUTO[f]===undefined?"":$("#"+f).value===String(AUTO[f])?"<em>otomatis</em>":`<button type="button" data-r="${f}">Kembalikan</button>`});
}
async function analyze(files,read,o={}){
 const has=f=>files.includes(f),pick=re=>files.find(f=>re.test(f)),R={kind:null,conf:0,meta:{},perms:[],warn:[],rec:[],n:files.length};
 const rd=async p=>{try{return await read(p)}catch{return ""}},kt=(t,re)=>(t.match(re)||[])[1];
 if(!files.length){R.warn.push("Proyek kosong atau subfolder salah.");return R}
 if(o.truncated)R.warn.push("Daftar berkas repo terpotong GitHub. Analisis bisa kurang lengkap.");
 if(o.priv)R.warn.push("Repo privat. Isi secret SRC_TOKEN di repo apk-builder agar build bisa mengambil kodenya.");
 let pk={};if(has("package.json")){try{pk=JSON.parse(await rd("package.json"))}catch{R.warn.push("package.json tidak valid.")}}
 const dp={...pk.dependencies,...pk.devDependencies},cap=pick(/^capacitor\.config\.(ts|json|js)$/),vx=(pk.version||"").match(/^\d+\.\d+\.\d+/);
 if(has("pubspec.yaml")){
  const t=await rd("pubspec.yaml"),v=t.match(/^version:\s*(\d+\.\d+\.\d+)(?:\+(\d+))?/m);
  R.kind="flutter";R.conf=98;R.meta.name=kt(t,/^name:\s*(\S+)/m);if(v){R.meta.vn=v[1];if(v[2])R.meta.vc=+v[2]}
  if(!files.some(f=>/^android\/app\/build\.gradle/.test(f)))R.warn.push("Folder android belum ada. Dibuat otomatis lewat flutter create saat build.");
  R.rec.push("Pakai AAB bila akan diunggah ke Play Store.");
 }else if(cap){
  const t=await rd(cap);R.kind="capacitor";R.conf=95;R.meta.pkg=kt(t,/appId["']?\s*[:=]\s*["']([^"']+)/);R.meta.name=kt(t,/appName["']?\s*[:=]\s*["']([^"']+)/);if(vx)R.meta.vn=vx[0];
  if(!has("package.json"))R.warn.push("package.json tidak ditemukan.");
  if(!files.some(f=>f.startsWith("android/")))R.rec.push("Platform android ditambahkan otomatis lewat npx cap add android.");
 }else if(dp["react-native"]||dp.expo){
  R.kind="rn";R.conf=92;R.meta.name=pk.name;if(vx)R.meta.vn=vx[0];
  try{const j=JSON.parse(await rd("app.json")),x=j.expo||j;R.meta.name=x.name||R.meta.name;R.meta.vn=x.version||R.meta.vn;if(x.android){R.meta.pkg=x.android.package;if(x.android.versionCode)R.meta.vc=x.android.versionCode}}catch{}
  if(!files.some(f=>f.startsWith("android/"))){if(dp.expo)R.rec.push("Folder android dibuat lewat expo prebuild saat build.");else R.warn.push("Proyek React Native tanpa folder android tidak bisa dibuild.")}
 }else if(has("gradlew")||has("settings.gradle")||has("settings.gradle.kts")){
  const ap=pick(/(^|\/)app\/build\.gradle(\.kts)?$/)||pick(/(^|\/)build\.gradle(\.kts)?$/);R.kind="gradle";R.conf=ap?93:75;
  if(ap){const t=await rd(ap),vc=kt(t,/versionCode\s*=?\s*(\d+)/);R.meta.pkg=kt(t,/applicationId\s*=?\s*["']([^"']+)/);R.meta.vn=kt(t,/versionName\s*=?\s*["']([^"']+)/);if(vc)R.meta.vc=+vc;R.meta.min=kt(t,/minSdk(?:Version)?\s*=?\s*(\d+)/);if(!/com\.android\.application/.test(t))R.warn.push("Modul ini tidak memakai plugin com.android.application.")}
  const mf=pick(/(^|\/)src\/main\/AndroidManifest\.xml$/);
  if(mf){const t=await rd(mf);R.perms=[...new Set([...t.matchAll(/uses-permission[^>]*android:name="android\.permission\.(\w+)"/g)].map(x=>PMAP[x[1]]).filter(Boolean))];const o2=kt(t,/screenOrientation="(\w+)"/);if(o2==="portrait"||o2==="landscape")R.meta.orient=o2}
  const gv=kt(await rd("gradle/wrapper/gradle-wrapper.properties"),/gradle-([\d.]+)/);if(gv&&+gv.split(".")[0]<7)R.warn.push(`Gradle ${gv} terlalu lama untuk Java 17. Perbarui wrapper ke 8.x.`);
  if(!has("gradlew"))R.warn.push("Tidak ada gradlew. Build memakai Gradle 8.7 dari runner.");
 }else if(has("package.json")||has("index.html")){
  const bs=pk.scripts&&pk.scripts.build,idx=has("index.html");
  R.kind="web";R.conf=bs?90:idx?96:40;R.meta.name=pk.name;if(vx)R.meta.vn=vx[0];R.perms=["internet"];
  if(!bs&&!idx)R.warn.push("Tidak ada index.html dan tidak ada skrip build. Build web akan gagal.");
  const wm=pick(/(^|\/)(manifest\.json|manifest\.webmanifest|site\.webmanifest)$/);
  if(wm)try{const j=JSON.parse(await rd(wm));if(j.name||j.short_name)R.meta.name=j.short_name||j.name;if(j.theme_color)R.meta.color=j.theme_color;if(/portrait|landscape/.test(j.orientation||""))R.meta.orient=/portrait/.test(j.orientation)?"portrait":"landscape"}catch{}
  if(!R.meta.name&&idx)R.meta.name=kt(await rd("index.html"),/<title>([^<]+)/i);
  R.rec.push("Web dibundel offline ke dalam APK. Izin internet tetap aktif untuk memanggil API.");
 }else R.warn.push("Jenis proyek tidak dikenali. Pilih jenis secara manual atau periksa subfolder.");
 const ic=pick(/(^|\/)(ic_launcher|icon|logo)[^/]*\.png$/i);if(ic)R.icon=ic;
 return R;
}
function anShow(R,nm){
 A=R;const m=R.meta,ok=R.kind&&R.conf>=70;
 $("#kdw").hidden=ok;
 $("#an").innerHTML=`<div class="card"><div class="wh"><h2>Hasil analisis</h2><span class="tag ${ok?"success":""}">${KN[R.kind]||"Tidak dikenali"}${R.kind?" · "+(R.conf>=90?"yakin":R.conf>=70?"cukup yakin":"kurang yakin"):""}</span></div>
 <dl class="kv">${R.n?`<dt>Berkas</dt><dd>${esc(R.n)}</dd>`:""}${m.name?`<dt>Nama</dt><dd>${esc(m.name)}</dd>`:""}${m.pkg?`<dt>Package</dt><dd>${esc(m.pkg)}</dd>`:""}${m.vn?`<dt>Versi</dt><dd>${esc(m.vn)}${m.vc?" ("+esc(m.vc)+")":""}</dd>`:""}${m.min?`<dt>minSdk</dt><dd>${esc(m.min)}</dd>`:""}${R.icon?`<dt>Ikon</dt><dd>${esc(R.icon)}</dd>`:""}</dl>
 ${R.perms.length?`<div class="chips" style="flex-wrap:wrap;margin:0 0 8px">${R.perms.map(x=>`<span class="tag">${esc(x)}</span>`).join("")}</div>`:""}
 ${R.warn.length?`<ul class="wl">${R.warn.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:""}
 ${R.rec.length?`<p style="margin:8px 0 0">${esc(R.rec.join(" "))}</p>`:""}</div>`;
 if(R.kind)prefill(R,nm);
 idleDraw();
}
function prefill(R,nm){
 const m=R.meta,base=m.name||nm||"Aplikasiku",slug=String(base).toLowerCase().replace(/[^a-z0-9]/g,""),okp=x=>x&&/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(x);
 AUTO={name:pretty(base),pkg:okp(m.pkg)?m.pkg:"com.app."+(/^[a-z]/.test(slug)?slug:"a"+slug),vn:m.vn||"1.0.0",vc:m.vc||1};
 for(const k in AUTO)$("#"+k).value=AUTO[k];
 if(R.perms.length)document.querySelectorAll(".pm").forEach(x=>x.checked=R.perms.includes(x.value));
 if(m.orient)$("#ori").value=m.orient;
 if(/^#[0-9a-f]{6}$/i.test(m.color||""))$("#col").value=m.color.toLowerCase();
 if(m.min)$("#min").value=Math.max(26,+m.min);
 $("#url").value=R.url||"";auUI();val();
}
async function onFile(f){
 FZ=f;PFN=f.name;PFSZ=f.size;PF=null;A=null;dzUI();
 if(f.size>50*1048576){FZ=null;$("#an").innerHTML=`<div class="card"><b>File terlalu besar</b><p style="margin:6px 0 0">Maksimal 50 MB. Untuk proyek besar gunakan URL repo GitHub.</p></div>`;idleDraw();return}
 $("#an").innerHTML=`<div class="card"><b>Membaca proyek...</b><div class="bar"><i class="ind"></i></div></div>`;
 try{
  await loadJSZip();let files,read,nm=f.name.replace(/\.(zip|html?)$/i,"");
  if(/\.html?$/i.test(f.name)){
   const txt=await f.text(),z=new JSZip();z.file("index.html",txt);
   PF=new File([await z.generateAsync({type:"blob"})],"project.zip");files=["index.html"];read=async()=>txt;
  }else{
   const z=await JSZip.loadAsync(f);PF=f;
   const names=Object.keys(z.files).filter(n=>!z.files[n].dir&&!n.startsWith("__MACOSX")&&!/(^|\/)\.git\//.test(n)),tops=new Set(names.map(n=>n.split("/")[0]));
   const pre=tops.size===1&&names.every(n=>n.includes("/"))?[...tops][0]+"/":"",sub=$("#sb").value.trim().replace(/^\/|\/$/g,""),pp=pre+(sub?sub+"/":"");
   files=names.filter(n=>n.startsWith(pp)).map(n=>n.slice(pp.length));read=p=>z.file(pp+p).async("string");
  }
  anShow(await analyze(files,read),nm);
 }catch(e){PF=null;$("#an").innerHTML=`<div class="card"><b>Gagal membaca file</b><p style="margin:6px 0 0">${esc(e.message||"ZIP rusak atau tidak didukung.")}</p></div>`}
 dzUI();idleDraw();
}
async function anRepo(){
 if(!S.t){toast("Hubungkan GitHub dulu");drawer(true);return}
 const u=$("#su").value.trim(),m=u.match(/^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:\/(tree|blob)\/([^/]+)(?:\/(.+?))?)?\/?$/);
 if(!m){$("#an").innerHTML=`<div class="card"><b>URL tidak valid</b><p style="margin:6px 0 0">Gunakan bentuk https://github.com/pemilik/repo</p></div>`;return}
 const [,o,r,ty,br,sp0]=m,sp=ty==="blob"&&sp0?sp0.split("/").slice(0,-1).join("/"):sp0;A=null;$("#anb").disabled=true;
 $("#an").innerHTML=`<div class="card"><b>Membaca repo...</b><div class="bar"><i class="ind"></i></div></div>`;
 try{
  const info=await api(`/repos/${o}/${r}`),ref=$("#rf").value.trim()||br||info.default_branch;
  const tr=await api(`/repos/${o}/${r}/git/trees/${encodeURIComponent(ref)}?recursive=1`),sub=($("#sb").value.trim()||sp||"").replace(/^\/|\/$/g,""),pre=sub?sub+"/":"";
  const files=tr.tree.filter(x=>x.type==="blob"&&x.path.startsWith(pre)).map(x=>x.path.slice(pre.length));
  const read=async p=>{const q=await fetch(`https://api.github.com/repos/${o}/${r}/contents/${pre}${p}?ref=${encodeURIComponent(ref)}`,{headers:{Authorization:"Bearer "+S.t,Accept:"application/vnd.github.raw+json"}});if(!q.ok)throw Error(q.status);return q.text()};
  $("#su").value=`https://github.com/${o}/${r}`;$("#sb").value=sub;if(!$("#rf").value&&br)$("#rf").value=br;
  anShow(await analyze(files,read,{truncated:tr.truncated,priv:info.private}),r);
 }catch(e){$("#an").innerHTML=`<div class="card"><b>Gagal membaca repo</b><p style="margin:6px 0 0">${esc(e.message)}</p></div>`}
 $("#anb").disabled=false;idleDraw();
}
const b64b=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function gsha(u8){const h=new TextEncoder().encode("blob "+u8.length+"\0"),m=new Uint8Array(h.length+u8.length);m.set(h);m.set(u8,h.length);return[...new Uint8Array(await crypto.subtle.digest("SHA-1",m))].map(x=>x.toString(16).padStart(2,"0")).join("")}
async function checkTpl(){
 if(!S.t)return;
 if(TPLOK===true&&Date.now()-TPLT<60000)return;
 try{
  const ks=Object.keys(TPLB),loc=await Promise.all(ks.map(k=>gsha(b64b(TPLB[k])))),rem=await Promise.all(ks.map(k=>api(`/repos/${S.r}/contents/${k}`).then(x=>x.sha,()=>null)));
  SYNC_BAD=ks.filter((k,i)=>rem[i]!==loc[i]);TPLOK=!SYNC_BAD.length;TPLT=Date.now();
  const e=$("#sync");e.hidden=TPLOK;
  e.innerHTML=TPLOK?"":`Repo build-mu perlu diperbarui (${SYNC_BAD.length} berkas) agar build tidak gagal. <button class="btn" id="syb" style="margin-top:8px">Perbarui sekarang</button>`;
  if(!TPLOK)$("#syb").onclick=()=>syncTpl();
 }catch{}
}
async function syncTpl(auto){
 const b=$("#syb"),ks=SYNC_BAD.length?SYNC_BAD:Object.keys(TPLB);if(b)b.disabled=true;
 try{
  for(const [i,p] of ks.entries()){
   const m=`Memperbarui repo build ${i+1}/${ks.length}`;if(b)b.textContent=m+"...";if(auto)toast(m);
   let sha;try{sha=(await api(`/repos/${S.r}/contents/${p}`)).sha}catch{}
   await api(`/repos/${S.r}/contents/${p}`,{method:"PUT",body:JSON.stringify({message:"Sinkron template NexaBuild",content:TPLB[p],sha})});
  }
  TPLOK=true;SYNC_BAD=[];$("#sync").hidden=true;await sleep(3000);
  if(!auto)toast("Repo build diperbarui");return true;
 }catch(e){if(b){b.disabled=false;b.textContent="Coba lagi"}toast("Pembaruan gagal: "+e.message);return false}
}
function classify(u){
 let x;try{x=new URL(u)}catch{return null}
 if(!/^https?:$/.test(x.protocol))return null;
 const h=x.hostname.replace(/^www\./,""),p=x.pathname;
 if(/\.zip$/i.test(p)||/\/archive\/|\/zipball\//.test(p)||/^codeload\./.test(h))return x.protocol==="https:"?{t:"ziplink"}:null;
 if(h==="github.com"&&/^\/[\w.-]+\/[\w.-]+/.test(p))return x.protocol==="https:"?{t:"repo",gh:true}:null;
 if(/\.git$/.test(p)||(/^(gitlab\.com|bitbucket\.org|codeberg\.org|gitea\.com)$/.test(h)&&p.split("/").filter(Boolean).length>=2))return x.protocol==="https:"?{t:"repo"}:null;
 return{t:"site"};
}
function srMap(){
 const v=$("#sr").value;
 if(v==="zip")return{sr:"zip"};
 if(v==="scratch")return{sr:"scratch"};
 const u=$("#su").value.trim(),k=classify(u);
 if(!k)throw Error("URL tidak valid. Situs dapat memakai HTTP/HTTPS; repo Git dan ZIP wajib HTTPS.");
 return k.t==="site"?{sr:"scratch",url:u,site:true,kind:""}:{sr:k.t,src:u};
}
async function readUrl(){
 const u=$("#su").value.trim(),k=classify(u),ut=$("#ut");
 if(!k){ut.hidden=true;$("#an").innerHTML=`<div class="card" style="box-shadow:2px 2px 0 #000"><b>URL tidak valid</b><p style="margin:6px 0 0">Situs memakai HTTP/HTTPS; repo Git dan ZIP wajib HTTPS.</p></div>`;return}
 ut.hidden=false;ut.textContent={site:"Situs web",ziplink:"Link ZIP",repo:k.gh?"Repo GitHub":"Repo Git"}[k.t];
 if(k.t==="repo"&&k.gh)return anRepo();
 A=null;const x=new URL(u),nm=k.t==="site"?x.hostname.replace(/^www\./,"").split(".")[0]:decodeURIComponent(x.pathname.split("/").filter(Boolean).pop()||"app").replace(/\.(zip|git)$/i,"");
 if(k.t==="site")anShow({kind:"site",conf:99,meta:{name:nm},perms:["internet"],warn:[],rec:["Situs ini dimuat di WebView. Aktifkan Halaman offline dan Tautan luar di bagian Tampilan dan perilaku."],n:0,url:u},nm);
 else{$("#an").innerHTML=`<div class="card" style="box-shadow:2px 2px 0 #000"><b>${k.t==="ziplink"?"Link ZIP":"Repo Git"} diterima</b><p style="margin:6px 0 0">Isi proyek dibaca saat build karena browser tidak bisa membukanya langsung. Jenisnya dikenali otomatis di server.</p></div>`;prefill({meta:{name:nm},perms:[],kind:"x"},nm)}
 URLOK=true;idleDraw();
}
async function putSecrets(pairs,m){
 m("1/3 Memuat enkripsi...");const so=(await import("https://cdn.jsdelivr.net/npm/libsodium-wrappers@0.7.13/+esm")).default;await so.ready;
 m("2/3 Mengambil kunci repo...");const pk=await api(`/repos/${S.r}/actions/secrets/public-key`),key=so.from_base64(pk.key,so.base64_variants.ORIGINAL);
 const enc=v=>so.to_base64(so.crypto_box_seal(so.from_string(v),key),so.base64_variants.ORIGINAL);
 m("3/3 Menyimpan secrets...");
 for(const [n,v] of pairs)await api(`/repos/${S.r}/actions/secrets/${n}`,{method:"PUT",body:JSON.stringify({encrypted_value:enc(v),key_id:pk.key_id})});
}
async function saveKs(){
 const f=$("#ksf").files[0],m=t=>$("#ksm").textContent=t,pw=$("#ksp").value,al=$("#kal").value.trim();
 if(!S.t)return m("Hubungkan GitHub dulu.");if(!f)return m("Pilih file keystore.");if(!pw||!al)return m("Isi password dan alias.");
 $("#ksb").disabled=true;
 try{
  const b64=await new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result.split(",")[1]);r.onerror=no;r.readAsDataURL(f)});
  await putSecrets([["KEYSTORE_B64",b64],["KS_PASS",pw],["KEY_ALIAS",al]],m);
  m("Selesai. Keystore ini dipakai di build berikutnya.");$("#ksp").value="";toast("Keystore tersimpan");
 }catch(e){m(e.message)}
 $("#ksb").disabled=false;
}
async function checkFixed(){
 if(!S.t)return;
 try{await api(`/repos/${S.r}/actions/secrets/KS_SEED`);FIXED=true}catch(e){FIXED=/^404/.test(e.message)?false:null}
 const t=$("#fkt"),b=$("#fkb");t.textContent=FIXED?"Aktif":FIXED===false?"Belum":"?";t.className="tag"+(FIXED?" success":"");b.hidden=!!FIXED;
}
async function enableFixed(){
 const m=t=>$("#fkm").textContent=t,b=$("#fkb");if(!S.t)return m("Hubungkan GitHub dulu.");
 b.disabled=true;
 try{
  const a=new Uint8Array(32);crypto.getRandomValues(a);
  await putSecrets([["KS_SEED",btoa(String.fromCharCode(...a))]],m);
  m("Selesai. Build berikutnya membuat kunci tetap dan menyimpannya terenkripsi di repo build.");toast("Kunci tetap aktif");await checkFixed();
 }catch(e){m(e.message)}
 b.disabled=false;
}

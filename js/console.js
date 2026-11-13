function cfg(dry){
 const g=i=>$("#"+i),n=g("name").value.trim();
 if(!n)throw Error("Nama aplikasi wajib diisi.");
 if(g("sr").value==="url"&&!g("su").value.trim())throw Error("Isi URL target dulu.");
 if(!g("sr").value)throw Error("Pilih sumber proyek dulu.");
 if(g("sr").value==="zip"&&!PF)throw Error("Pilih file ZIP atau HTML dulu.");
 const slug=n.toLowerCase().replace(/[^a-z0-9]/g,"");
 let vn=(g("vn").value.trim()||"1.0.0").replace(/[^\w.+-]/g,"")||"1.0.0";
 if(vn!==g("vn").value.trim()){g("vn").value=vn;toast("versionName dinormalisasi: "+vn)}
 let pkg=g("pkg").value.trim()||"com.app."+(/^[a-z]/.test(slug)?slug:"a"+slug);
 if(!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(pkg))throw Error("Package name tidak valid. Contoh: com.contoh.app");
 const reserved=new Set("abstract actual annotation as assert boolean break byte by case catch char class companion const constructor continue crossinline data default delegate do double dynamic else enum expect extends external false field final finally float for fun get goto if implements import in infix init inline inner instanceof int interface internal is lateinit long native new noinline null object open operator out override package param private property protected public receiver reified return sealed set setparam short static strictfp super suspend switch synchronized tailrec this throw throws transient true try typealias val var vararg void volatile when where while".split());
 const normalizePackage=value=>String(value||"").split(".").map(part=>reserved.has(part)?part+"_":part).join(".");
 const inputPkg=pkg,normalized=normalizePackage(pkg);
 if(normalized!==inputPkg){pkg=normalized;g("pkg").value=pkg;toast("Package disesuaikan agar valid untuk Java/Kotlin: "+pkg)}
 if(!g("ov").checked&&AUTO.pkg)pkg=normalizePackage(AUTO.pkg);
 let vc=+g("vc").value||1;
 if(!dry){
  S.vcByPkg=S.vcByPkg&&typeof S.vcByPkg==="object"?S.vcByPkg:{};
  const previous=Number(S.vcByPkg[pkg]||0);
  if(g("ai").checked)vc=Math.max(vc,previous+1);
  g("vc").value=vc;
  S.vcByPkg[pkg]=vc;S.vc=vc;sv("s",S);
 }
 return{name:n,pkg,vn,vc,min:+g("min").value||26,fmt:g("fmt").value,var:g("var").value,minify:g("mf").checked,abi:g("abi").checked,orient:g("ori").value,perms:[...document.querySelectorAll(".pm:checked")].map(x=>x.value),url:g("url").value.trim(),color:g("col").value,out:g("out").value.trim().replace(/[^\w.-]/g,"")||slug||"app",args:g("ar").value.trim(),notes:g("nt").value.trim(),flv:g("fl").value.trim(),bc:g("bc").value.trim(),kiosk:g("ki").checked,ref:g("rf").value.trim(),sub:g("sb").value.trim(),ov:g("ov").checked,ps:g("ov").checked&&(AUTO.pkg===undefined?!!g("pkg").value.trim():g("pkg").value.trim()!==AUTO.pkg),kind:effKind()==="site"?"":effKind(),fs:g("fs").checked,kp:g("kp").checked,zm:g("zm").checked,ex:g("extl").checked,of:g("of").checked,pt:g("pull").checked,sc:g("scb").checked?g("stc").value:"",ua:g("ua").value.trim(),upl:g("upl").checked,dwn:g("dwn").checked,sec:g("sec").checked,dbl:g("dbl").checked,rp:g("rp").checked,spl:g("spl").checked,spc:g("spc").value,icbg:g("icbgs").checked?g("icbgc").value:"",...srMap()};
}
const KEY=["Set up job","Run actions/checkout","Install image processor","Prepare source","Setup Java","Install Android SDK 36","Setup Node","Setup Flutter","Setup Gradle","Generate project","Build","Stage unsigned build outputs","Upload unsigned build outputs","Download unsigned build outputs","Sign and validate outputs","Upload signed artifact","Cleanup temporary source ZIP","Release"];
const NR={
 "Set up job":["Menyiapkan runner","Runner siap"],
 "Run actions/checkout":["Mengambil kode tepercaya","Kode siap"],
 "Install image processor":["Menyiapkan pemroses ikon","Pillow siap"],
 "Prepare source":["Membaca sumber proyek","Sumber proyek dikenali"],
 "Setup Java":["Menyalakan Java 17","Java 17 siap"],
 "Install Android SDK 36":["Memasang Android SDK 36","SDK dan build-tools siap"],
 "Setup Node":["Menyiapkan Node.js","Node.js siap"],
 "Setup Flutter":["Menyiapkan Flutter","Flutter siap"],
 "Setup Gradle":["Menyiapkan Gradle","Gradle siap"],
 "Generate project":["Merakit proyek dan ikon","Proyek dasar siap; signing dilakukan terpisah"],
 "Build":["Mengompilasi aplikasi","APK/AAB unsigned berhasil dibuat"],
 "Stage unsigned build outputs":["Mengemas hasil kompilasi","Output siap dikirim ke runner signing"],
 "Upload unsigned build outputs":["Mengirim output sementara","Output diterima job signing"],
 "Download unsigned build outputs":["Mengambil output kompilasi","Output siap ditandatangani"],
 "Sign and validate outputs":["Menandatangani dan memeriksa APK/AAB","Signature, package ID, versionCode, dan ikon diperiksa"],
 "Upload signed artifact":["Mengemas hasil bertanda tangan","Hasil siap diunduh"],
 "Cleanup temporary source ZIP":["Membersihkan ZIP sementara","ZIP dihapus dari branch aktif"],
 "Release":["Menerbitkan ke GitHub Releases","Rilis tersedia"]
};
const WD={"Set up job":5,"Run actions/checkout":3,"Install image processor":8,"Prepare source":8,"Setup Java":5,"Install Android SDK 36":25,"Setup Node":8,"Setup Flutter":60,"Setup Gradle":10,"Generate project":12,"Build":150,"Stage unsigned build outputs":8,"Upload unsigned build outputs":8,"Download unsigned build outputs":6,"Sign and validate outputs":20,"Upload signed artifact":6,"Cleanup temporary source ZIP":4,"Release":8};
const key=n=>KEY.find(k=>n.startsWith(k));
let T={as:true,f:"",lf:0},DL=null,tmr=null;
const fmtT=x=>{x=Math.max(0,Math.round(x));return String(Math.floor(x/60)).padStart(2,"0")+":"+String(x%60).padStart(2,"0")};
const sc=x=>!x?"":x.status==="in_progress"?"on":x.status!=="completed"?"":x.conclusion==="success"?"ok":x.conclusion==="skipped"?"":"er";
const cls=x=>/BUILD SUCCESSFUL/.test(x)?"s":/##\[error\]|\berror\b|FAILED|Exception/i.test(x)?"e":/##\[warning\]|\bwarning\b|deprecated/i.test(x)?"w":"";
const HINT=[
[/No module named 'PIL'|externally-managed/i,"Pemrosesan ikon gagal di runner. Perbarui repo build (sudah diperbaiki di versi terbaru), lalu ulangi."],
[/Tautan itu bukan file ZIP|File ZIP tidak ditemukan/i,"Periksa link atau file ZIP yang dipakai."],
[/Authentication failed|could not read Username|Repository not found|repository .* not found/i,"Repo tidak bisa diakses. Untuk repo privat, isi secret SRC_TOKEN di repo build."],
[/Jenis proyek tidak dikenali/i,"Pilih jenis proyek manual, atau arahkan ke subfolder yang benar."],
[/npm (ERR!|error) (code )?(E404|ETARGET|ERESOLVE|ENOENT)/i,"Dependensi npm tidak bisa dipasang. Periksa package.json dan lockfile proyekmu."],
[/Cannot find module|Module not found|vite|webpack|tsc|Rollup|esbuild|npm run build/i,"Perintah 'npm run build' gagal. Pastikan proyek bisa dibuild, lalu coba lagi."],
[/tidak punya skrip 'build'|tidak punya index\.html/i,"Proyek ini bukan situs statis. Aplikasi server tidak bisa dibungkus menjadi APK."],
[/Unsupported class file major version|source option \d+ is no longer supported|requires Java|JDK/i,"Versi Java proyek tidak cocok (runner memakai Java 17). Proyek lama perlu AGP 8 atau lebih baru."],
[/Namespace not specified|namespace/i,"Proyek belum menentukan namespace (wajib di AGP 8). Tambahkan namespace di build.gradle modul app."],
[/R8|minify|proguard|missing_rules|Missing classes/i,"R8 gagal memproses kode. Matikan R8 minify di Build dan rilis, lalu ulangi."],
[/keystore|\.jks|password was incorrect|Tag number over/i,"Keystore atau password tidak cocok. Hapus secrets KEYSTORE_B64 agar dibuat otomatis, atau simpan ulang keystore."],
[/versionCode APK .*seharusnya/i,"Gradle tidak menerapkan versionCode yang diminta. Gunakan angka literal di defaultConfig atau periksa konfigurasi flavor."],
[/Launcher icon tidak ditemukan/i,"Ikon launcher tidak ditemukan di APK. Unggah PNG ikon dan pastikan modul Android memakai AndroidManifest.xml standar."],
[/Manifest merger failed|Duplicate class/i,"Konflik manifest atau library duplikat di proyek."],
[/Could not resolve|Could not GET|Connection (reset|timed out)|timeout/i,"Gagal mengunduh dependensi. Coba jalankan ulang build."],
[/SDK location not found|ANDROID_HOME|licenses/i,"SDK Android belum siap. Jalankan ulang build."],
[/Permission denied/i,"Berkas build tidak punya izin eksekusi (gradlew). Pastikan gradlew ada di repo."],
[/Output .* tidak ditemukan/i,"Build selesai tetapi tidak menghasilkan berkas yang diminta. Cek format dan varian."]
];
const wt=k=>{const a=H.map(h=>h.sd&&h.sd[k]).filter(Boolean);return a.length?a.reduce((x,y)=>x+y)/a.length:WD[k]};
const by=k=>[...(T.steps||[])].reverse().find(x=>key(x.name)===k);
const rows=()=>KEY.filter(k=>{const x=by(k);return!(x&&x.conclusion==="skipped")&&!(!x&&T.c&&T.c.sr==="scratch"&&(k==="Setup Node"||k==="Setup Flutter"))});
function pctNow(){
 if(T.fin)return T.ok?100:T.pct||0;
 if(!T.steps.length)return T.zip?Math.round((T.up||0)*8):0;
 let tot=0,got=0;
 rows().forEach(k=>{const w=wt(k),x=by(k);tot+=w;if(!x)return;if(x.conclusion==="success")got+=w;else if(x.status==="in_progress"&&x.started_at)got+=w*Math.min(.95,Math.max(0,(Date.now()-Date.parse(x.started_at))/1000)/w)});
 const f=tot?got/tot:0;return Math.min(99,Math.round(T.zip?8+92*f:f*100));
}
function line(id,txt,c,tm){
 let e=document.getElementById(id);
 if(!e){e=document.createElement("div");e.id=id;e.innerHTML="<i></i><span></span><em></em>";$("#nl").appendChild(e)}
 const k="nl "+c;if(e.className!==k)e.className=k;
 if(e.children[1].textContent!==txt)e.children[1].textContent=txt;
 e.children[2].textContent=tm||"";
}
function termDraw(){
 if(!T.t0)return;
 const p=Math.max(T.pct||0,pctNow());T.pct=p;
 const pe=$("#pct");cu(pe,p,Math.abs(p-(+pe.dataset.v||0))<=2)
 $("#pf").style.width=p+"%";$("#pf").style.borderRightWidth=p?"2px":"0";
 $("#el").textContent=fmtT(T.fin?(T.dur||0):(Date.now()-T.t0)/1000);
 if(!T.dsp&&!T.zip)line("p0","Mengirim permintaan ke GitHub","on");
 if(T.dsp){line("p0","Permintaan terkirim ke GitHub","ok");line("p2",T.steps.length?"Runner tersedia":"Menunggu runner tersedia",T.steps.length?"ok":"on")}
 let cur=T.dsp?"Menunggu runner tersedia":T.zip&&(T.up||0)<1?"Mengunggah ZIP":"Mengirim permintaan";
 T.steps.forEach(x=>{
  const k=key(x.name),c=sc(x);if(!k||!c)return;
  let t=c==="ok"?NR[k][1]:NR[k][0];
  if(c==="on"){if(k==="Build"&&T.task)t+=" · "+T.task;cur=t}
  if(c==="er")t=NR[k][0]+" (gagal)";
  line("n_"+k,t,c,x.started_at?Math.max(0,Math.round(((x.completed_at?Date.parse(x.completed_at):Date.now())-Date.parse(x.started_at))/1000))+" dtk":"");
 });
 if(T.fin){cur=T.ok?"Selesai":T.cx?"Dibatalkan":"Gagal";line("fin",T.ok?"Selesai. Aplikasimu siap diunduh.":T.cx?"Build dibatalkan.":"Build berhenti. Penyebabnya ada di bagian atas.",T.ok?"ok":"er")}
 const te=$("#tt2");if(te.textContent!==cur)te.textContent=cur;
}
function parseLog(t){
 const gs=[];let g={n:"Log",l:[]};gs.push(g);
 t.split("\n").forEach(x=>{x=x.replace(/^\S+Z /,"");const m=x.match(/^##\[group\](.*)/);if(m){g={n:m[1],l:[]};gs.push(g);return}if(x.startsWith("##[endgroup]")){g={n:"Log",l:[]};gs.push(g);return}g.l.push(x)});
 return gs.filter(g=>g.l.some(l=>l.trim()));
}
function logApply(){
 if(!T.log)return;
 const gs=parseLog(T.log),box=$("#gl"),sb=$("#tb"),q=($("#sq").value||"").toLowerCase();
 const nb=sb.scrollHeight-sb.scrollTop-sb.clientHeight<48;
 $("#lgd").hidden=false;let base=0;
 gs.forEach((g,i)=>{
  let d=document.getElementById("g"+i);
  if(!d){d=document.createElement("details");d.id="g"+i;d.dataset.n=0;d.innerHTML="<summary></summary><pre></pre>";d.firstChild.onclick=()=>{d.dataset.u=1};if(i===gs.length-1)d.open=true;box.appendChild(d)}
  const n=+d.dataset.n,pre=d.lastChild;
  if(g.l.length>n&&n<1500){
   const add=g.l.slice(n,1500);
   pre.insertAdjacentHTML("beforeend",add.map((x,j)=>{const c=cls(x),v=(!T.f||c===T.f)&&(!q||x.toLowerCase().includes(q));return `<span class="ll L${c}" data-c="${c}"${v?"":" hidden"}><span class="ln">${base+n+j+1}</span>${esc(x)}</span>`}).join(""));
   d.dataset.n=n+add.length;
   if(add.some(x=>cls(x)==="e")&&!d.dataset.u)d.open=true;
  }
  const er=!!d.querySelector(".Le"),sm=d.firstChild,h=esc(g.n)+'<span class="tag">'+g.l.length+"</span>"+(er?'<span class="tag">Error</span>':"");
  if(sm.dataset.h!==h){sm.innerHTML=h;sm.dataset.h=h}
  base+=g.l.length;
 });
 if(T.as&&nb)sb.scrollTop=sb.scrollHeight;
}
function filt(){
 const q=($("#sq").value||"").toLowerCase(),on=!!(T.f||q);
 document.querySelectorAll("#gl details").forEach(d=>{let n=0;d.querySelectorAll(".ll").forEach(l=>{const v=(!T.f||l.dataset.c===T.f)&&(!q||l.textContent.toLowerCase().includes(q));l.hidden=!v;if(v)n++});d.hidden=on&&!n;if(on&&n&&!d.dataset.u)d.open=true});
}
const logDraw=()=>{logApply();filt()};
const termTxt=()=>(T.steps||[]).map(x=>`[${x.conclusion||x.status}] ${x.name}`).join("\n")+"\n\n"+(T.log||"");
function pin(i){H[i].pin=!H[i].pin;sv("h",H);hist()}

function diagnose(log){
 const L=(log||"").split("\n").map(x=>x.replace(/^\S+Z /,"")),ei=[];
 L.forEach((x,i)=>{if(/##\[error\]/.test(x))ei.push(i)});
 if(!ei.length)return null;
 const msgs=ei.map(i=>L[i].replace(/^.*##\[error\]/,"").trim()).filter(x=>x&&!/^Process completed with exit code/.test(x));
 const last=ei[ei.length-1];
 const ctx=L.slice(Math.max(0,last-14),last).filter(x=>x.trim()&&!/^##\[(group|endgroup)/.test(x));
 const primary=msgs.length?msgs[msgs.length-1]:(ctx.length?ctx[ctx.length-1].trim():"");
 const h=HINT.find(x=>x[0].test(primary+"\n"+ctx.join("\n")));
 return{primary,ctx:ctx.slice(-8),hint:h?h[1]:""};
}
function failCard(d,stage,url){
 d=d||{primary:"",ctx:[],hint:""};
 return `<div class="fail"><div class="wh"><h2>Build gagal${stage?" di tahap: "+esc(stage.toLowerCase()):""}</h2></div>${d.primary?`<p class="fm">${esc(d.primary)}</p>`:""}${d.hint?`<p><b>Saran:</b> ${esc(d.hint)}</p>`:""}${d.ctx.length?`<details><summary>Baris terakhir sebelum gagal</summary><pre>${esc(d.ctx.join("\n"))}</pre></details>`:""}<div class="g2c"><button class="btn w" onclick="copyErr()">Salin pesan</button>${url?`<a class="btn w" target="_blank" rel="noopener" href="${esc(url)}">Buka di GitHub</a>`:"<span></span>"}</div></div>`;
}
function copyErr(){navigator.clipboard.writeText((document.querySelector(".fail .fm")||{}).textContent||"").then(()=>toast("Pesan disalin"))}

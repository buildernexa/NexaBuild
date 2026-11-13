const $=s=>document.querySelector(s),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const ld=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},sv=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const esc=s=>String(s??"").replace(/[&<>"'`]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","`":"&#96;"}[c]));
const cn=x=>String(x??"").replace(/[^\w-]/g,"");
let S=ld("s",{}),H=ld("h",[]),PR=ld("p",{}),P={},run=null,busy=false,stp="",lg="";
/* data dari localStorage tidak dipercaya: bentuknya divalidasi sebelum dipakai */
if(!S||typeof S!=="object"||Array.isArray(S))S={};
if(!PR||typeof PR!=="object"||Array.isArray(PR))PR={};
H=(Array.isArray(H)?H:[]).filter(x=>x&&typeof x==="object").map(x=>({...x,cfg:x.cfg&&typeof x.cfg==="object"?x.cfg:{}}));
H.forEach(h=>{if(h.st==="running"&&!h.runId)h.st="terputus"});
const LAB={success:"Berhasil",failure:"Gagal",running:"Berjalan",cancelled:"Dibatalkan"},lab=s=>LAB[s]||"Terputus";
const IC={home:'<path d="M3 11l9-8 9 8M5 10v10h14V10"/>',cam:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',gauge:'<path d="M4 18a8 8 0 1 1 16 0"/><path d="M12 18l4-6"/>',wifi:'<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01"/>',layers:'<path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5"/>',run:'<path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5"/>',check:'<path d="M4 12l5 5 11-11"/>',plus:'<path d="M12 5v14M5 12h14"/>',redo:'<path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/>',hist:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',ext:'<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>'};
const ic=n=>`<svg viewBox="0 0 24 24">${IC[n]}</svg>`;
let tab=0,tt,ANIM=true,PL={};
function toast(m){const t=$("#ts");t.textContent=m;t.classList.add("show");clearTimeout(tt);tt=setTimeout(()=>t.classList.remove("show"),2600)}

const NEXA_VER="1.1.0";
async function api(p,o={}){
 const h={Authorization:"Bearer "+S.t,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"};
 if(o.body)h["Content-Type"]="application/json";
 let r;try{r=await fetch("https://api.github.com"+p,{...o,headers:h})}catch{throw Error("Tidak bisa terhubung ke GitHub. Periksa koneksi internet.")}
 if(r.status===401)throw Error("Token salah atau sudah kedaluwarsa.");
 if(r.status===403&&r.headers.get("x-ratelimit-remaining")==="0"){const rs=+r.headers.get("x-ratelimit-reset");throw Error("Batas API GitHub habis."+(rs?" Coba lagi pukul "+new Date(rs*1000).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})+".":" Coba lagi nanti."))};
 if(!r.ok){let m="";try{m=(await r.json()).message}catch{}throw Error(r.status+" "+m)}
 return o.raw?r:r.status===204?null:r.json();
}
function scopes(r){
 const s=r.headers.get("x-oauth-scopes");if(s===null)return;
 const have=s.split(",").map(x=>x.trim()),miss=["repo","workflow"].filter(x=>!have.includes(x));
 if(miss.length)throw Error("Scope kurang: "+miss.join(", ")+". Buat ulang token dengan scope tersebut.");
}

/* drawer */
function drawer(o){document.body.classList.toggle("open",o);$("#dr").setAttribute("aria-hidden",!o);if(o)ui()}
function ui(){
 $("#ds").innerHTML=S.t?`<span class="tag success">Terhubung</span><p style="margin:8px 0 0">${esc(S.u)}<br>${esc(S.r)}</p>`:`<span class="tag">Belum terhubung</span>`;
 const rp=$("#rpw");if(rp)rp.hidden=!S.t||S.repoPrivate!==false;
 if(S.tp&&!$("#tu").dataset.s){const q=S.tp.split("/");$("#tu").value=q[0];$("#tr").value=q[1]||"";$("#tu").dataset.s=1}
 $("#tk").placeholder=S.t?"Tersimpan di perangkat":"ghp_...";
 $("#lo").disabled=$("#tt").disabled=!S.t;
}
async function connect(){
 const t=$("#tk").value.trim()||S.t,tp=$("#tu").value.trim()+"/"+$("#tr").value.trim(),m=$("#lm"),b=$("#lb");
 if(!t||!/^[\w.-]+\/[\w.-]+$/.test(tp)){m.textContent="Isi token dan repo template (username/repo).";return}
 b.disabled=true;const old=S;S={...S,t,tp};
 try{
  m.textContent="1/3 Memeriksa token...";
  const r=await api("/user",{raw:true});scopes(r);const u=await r.json();
  S.u=u.login;S.r=u.login+"/apk-builder";
  try{await api("/repos/"+S.r)}catch(e){
   if(!/^404/.test(e.message))throw e;
   m.textContent="2/3 Membuat repo dari template...";
   try{await api(`/repos/${tp}/generate`,{method:"POST",body:JSON.stringify({owner:u.login,name:"apk-builder",private:true})})}
   catch(e2){throw Error(/^404/.test(e2.message)?"Repo template tidak ditemukan atau belum ditandai Template.":e2.message)}
   m.textContent="3/3 Menunggu workflow siap...";
   for(let i=0;i<15;i++){await sleep(2000);try{await api(`/repos/${S.r}/contents/.github/workflows/build.yml`);break}catch{}}
  }
  try{const br=await api("/repos/"+S.r);S.repoPrivate=!!br.private}catch{}
  sv("s",S);$("#tk").value="";m.textContent="";toast("Terhubung ke GitHub");drawer(false);loadProfile();checkTpl();checkFixed();
 }catch(e){S=old;m.textContent=e.message}
 b.disabled=false;ui();
}
async function test(){
 const m=$("#lm");m.textContent="Menguji koneksi...";
 try{const r=await api("/user",{raw:true});scopes(r);await api("/repos/"+S.r);m.textContent="";toast("Koneksi baik")}
 catch(e){m.textContent=e.message}
}
async function makeBuildRepoPrivate(){
 const b=$("#priv");if(b)b.disabled=true;
 try{const r=await api("/repos/"+S.r,{method:"PATCH",body:JSON.stringify({private:true})});S.repoPrivate=!!r.private;P.priv=S.repoPrivate;sv("s",S);ui();home();toast("Repo build sekarang private")}
 catch(e){toast("Gagal mengubah privasi repo: "+e.message)}
 if(b)b.disabled=false;
}
function disc(){S={vc:S.vc,vcByPkg:S.vcByPkg||{},repoPrivate:S.repoPrivate};localStorage.setItem("s",JSON.stringify(S));P={};ui();home();TPLOK=null;SYNC_BAD=[];TPLT=0;FIXED=null;toast("Koneksi diputus")}

/* home */
function go(n){
 tab=n;["#v-home","#v-build","#v-hist"].forEach((s,i)=>{const e=$(s);e.hidden=i!==n;if(i===n){e.classList.remove("in");void e.offsetWidth;e.classList.add("in")}});
 document.querySelectorAll("nav button").forEach(b=>{const on=+b.dataset.t===n;on?b.setAttribute("aria-current","page"):b.removeAttribute("aria-current")});
 if(n===0){ANIM=true;home()}if(n===1){queue();checkTpl();checkFixed()}if(n===2){hist();reconcile()}scrollTo(0,0);
}

/* history */

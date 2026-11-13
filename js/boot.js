/* events */
$("#mn").onclick=()=>drawer(true);$("#dx").onclick=$("#sc").onclick=()=>drawer(false);
$("#te").onclick=()=>{const i=$("#tk");i.type=i.type==="password"?"text":"password"};
$("#lb").onclick=connect;$("#tt").onclick=test;$("#lo").onclick=disc;$("#priv").onclick=makeBuildRepoPrivate;
$("#go").onclick=build;$("#cn").onclick=cancel;
$("#cp").onclick=()=>navigator.clipboard.writeText(termTxt()).then(()=>toast("Log disalin"));
$("#dt").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([termTxt()],{type:"text/plain"}));a.download="nexabuild-log.txt";a.click()};
$("#as").onclick=e=>{T.as=!T.as;e.currentTarget.setAttribute("aria-pressed",!!T.as)};
document.querySelectorAll("[data-f]").forEach(b=>b.onclick=()=>{T.f=b.dataset.f;document.querySelectorAll("[data-f]").forEach(x=>x.setAttribute("aria-pressed",x===b));logDraw()});
$("#sq").oninput=logDraw;document.querySelectorAll("#srcs button").forEach(b=>b.onclick=()=>setSrc(b.dataset.v));
$("#zf").onchange=e=>e.target.files[0]&&onFile(e.target.files[0]);
$("#dzx").onclick=e=>{e.preventDefault();PF=null;FZ=null;A=null;AUTO={};$("#zf").value="";$("#an").innerHTML="";$("#kdw").hidden=true;dzUI();auUI();idleDraw()};
$("#anb").onclick=readUrl;$("#su").onchange=()=>{URLOK=false};$("#ksb").onclick=saveKs;$("#fkb").onclick=enableFixed;
$("#sb").onchange=()=>{if($("#sr").value==="zip"&&FZ)onFile(FZ);else if($("#sr").value==="url"&&$("#su").value.trim())readUrl()};
$("#kd").onchange=()=>{idleDraw()};
$("#name").oninput=$("#vn").oninput=auUI;
document.addEventListener("click",e=>{const r=e.target.closest("[data-r]");if(r){$("#"+r.dataset.r).value=AUTO[r.dataset.r];auUI();val()}});

$("#mm").onclick=e=>{const m=$("#mu");m.hidden=!m.hidden;e.currentTarget.setAttribute("aria-expanded",!m.hidden)};
document.addEventListener("click",e=>{if(!e.target.closest("#mu,#mm"))$("#mu").hidden=true});
$("#ex").onclick=()=>{try{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(cfg(true),null,2)],{type:"application/json"}));a.download="nexabuild-config.json";a.click()}catch(e){toast(e.message)}};
$("#im2").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const c=JSON.parse(await f.text());if(!c||typeof c!=="object"||!c.name)throw Error("Format tidak dikenali");fill(c);toast("Konfigurasi diimpor")}catch(x){toast(x.message)}e.target.value=""};
let ipr;addEventListener("beforeinstallprompt",e=>{e.preventDefault();ipr=e;$("#ib").hidden=false});
$("#ib").onclick=async()=>{ipr.prompt();await ipr.userChoice;$("#ib").hidden=true};$("#pkg").oninput=$("#vc").oninput=val;
$("#ic").onchange=e=>e.target.files[0]&&upIcon(e.target.files[0]);
$("#psv").onclick=()=>{const n=prompt("Nama preset");if(!n)return;try{PR[n]=cfg(true);sv("p",PR);presets();$("#ps").value=n;toast("Preset disimpan")}catch(e){toast(e.message)}};
$("#ps").onchange=e=>{const c=PR[e.target.value];if(c){fill(c);toast("Preset dimuat")}};
$("#hq").oninput=$("#hf").onchange=hist;
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>go(+b.dataset.t));
let sx=0;$("#dr").addEventListener("touchstart",e=>sx=e.touches[0].clientX,{passive:true});
$("#dr").addEventListener("touchend",e=>{if(e.changedTouches[0].clientX-sx<-60)drawer(false)},{passive:true});
let py=null;
addEventListener("touchstart",e=>{py=scrollY===0&&!document.body.classList.contains("open")&&tab!==1?e.touches[0].clientY:null},{passive:true});
addEventListener("touchmove",e=>{if(py==null)return;const d=e.touches[0].clientY-py;$("#pt").style.transform=`translateY(${Math.max(0,Math.min(d,80))-60}px)`;$("#pt").textContent=d>70?"Lepas untuk muat ulang":"Tarik untuk muat ulang"},{passive:true});
addEventListener("touchend",e=>{if(py==null)return;const d=e.changedTouches[0].clientY-py;py=null;$("#pt").style.transform="";if(d>70){loadProfile();if(tab===2)hist();toast("Dimuat ulang")}},{passive:true});
addEventListener("online",()=>tab===0&&home());addEventListener("offline",()=>tab===0&&home());
setInterval(stats,3000);setInterval(tick,1000);
presets();ui();go(0);tplInit();val();idleDraw();termDraw();logDraw();if(S.t){loadProfile();reconcile()}
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js");

addEventListener("error",e=>{if(e.message&&!/ResizeObserver|Script error/.test(e.message))toast("Galat: "+e.message)});
addEventListener("unhandledrejection",e=>toast("Galat: "+((e.reason&&e.reason.message)||e.reason)));
{const v=$("#ver");if(v)v.textContent="v"+NEXA_VER}
{const q=new URLSearchParams(location.search).get("go");if(q==="build")go(1);else if(q==="history")go(2)}
addEventListener("touchcancel",()=>{py=null;$("#pt").style.transform=""},{passive:true});

function hist(){
 const q=$("#hq").value.trim().toLowerCase(),f=$("#hf").value;
 const rows=H.map((h,i)=>({h,i})).filter(({h})=>(!f||h.st===f)&&(!q||h.name.toLowerCase().includes(q))).sort((a,b)=>!!b.h.pin-!!a.h.pin);
 $("#hl").innerHTML=cmpHtml()+(rows.length?rows.map(({h,i})=>`<div class="card"><b style="font-size:16px">${esc(h.name)}</b> <span class="tag ${cn(h.st)}">${lab(h.st)}</span>${h.pin?' <span class="tag">Disematkan</span>':""}
 <p style="margin:6px 0 10px">v${esc(h.vn)} (${h.vc}) &middot; ${new Date(h.t).toLocaleString("id-ID",{dateStyle:"short",timeStyle:"short"})}${h.dur!=null?" &middot; "+h.dur+" dtk":""}</p>
 <div class="stack" style="margin:0">${(h.assets||[]).map((a,j)=>`<button class="btn" onclick="dl(${i},${j})">Unduh ${esc(a.n)}</button>`).join("")}${h.sum?`<button class="btn w" onclick="share(${i})">Bagikan</button><div>${kv(h)}</div>`:h.hint?`<p style="margin:0">${esc(h.hint)}</p>`:""}
 <div class="row" style="margin:0"><button class="btn w" onclick="again(${i})">Ulangi</button><button class="btn w" onclick="pin(${i})">${h.pin?"Lepas":"Sematkan"}</button><button class="btn w" onclick="del(${i})">Hapus</button></div><div class="row" style="margin:0"><button class="btn w" onclick="cmpT(${i})">${CMP.includes(i)?"Batal banding":"Bandingkan"}</button></div></div></div>`).join(""):`<p>${H.length?"Tidak ada hasil.":"Belum ada build. Mulai dari tab Build."}</p>`);
}
async function del(i){
 if(!confirm("Hapus build ini? Release dan filenya di GitHub ikut dihapus."))return;
 const h=H[i];
 if(h.relid&&S.t)try{await api(`/repos/${S.r}/releases/${h.relid}`,{method:"DELETE"});if(h.tag)await api(`/repos/${S.r}/git/refs/tags/${h.tag}`,{method:"DELETE"})}catch(e){toast("Release tidak terhapus: "+e.message)}
 H.splice(i,1);CMP=[];sv("h",H);hist();toast("Riwayat dihapus");
}
function fill0(c){
 const g=x=>$("#"+x);
 g("name").value=c.name;g("pkg").value=c.pkg;g("vn").value=c.vn;g("vc").value=c.vc;g("min").value=c.min;g("fmt").value=c.fmt;g("var").value=c.var;
 g("mf").checked=c.minify;g("abi").checked=c.abi;g("ori").value=c.orient;g("url").value=c.url;g("col").value=c.color;g("out").value=c.out;g("ar").value=c.args;g("nt").value=c.notes||"";g("fl").value=c.flv||"";g("bc").value=c.bc||"";g("ki").checked=!!c.kiosk;g("fs").checked=!!c.fs;g("kp").checked=!!c.kp;g("zm").checked=!!c.zm;g("extl").checked=!!c.ex;g("of").checked=!!c.of;g("pull").checked=!!c.pt;g("scb").checked=!!c.sc;if(c.sc)g("stc").value=c.sc;g("ua").value=c.ua||"";g("upl").checked=!!c.upl;g("dwn").checked=!!c.dwn;g("sec").checked=!!c.sec;g("dbl").checked=!!c.dbl;g("rp").checked=c.rp!==false;g("spl").checked=!!c.spl;if(c.spc)g("spc").value=c.spc;g("icbgs").checked=!!c.icbg;if(c.icbg)g("icbgc").value=c.icbg;g("su").value=c.src||"";g("rf").value=c.ref||"";g("sb").value=c.sub||"";g("ov").checked=c.ov!==false;setSrc(c.sr==="zip"?"zip":c.sr==="repo"||c.sr==="ziplink"||c.site?"url":"scratch");if(c.site)$("#su").value=c.url;auUI();
 document.querySelectorAll(".pm").forEach(x=>x.checked=c.perms.includes(x.value));
}
function again(i){fill(H[i].cfg);go(1)}

/* build */

function fill(c){
 if(!c||typeof c!=="object"||Array.isArray(c))c={};
 const n={...c},hx=v=>/^#[0-9a-fA-F]{6}$/.test(v||"")?v:"",pick=(v,l,d)=>l.includes(v)?v:d;
 n.perms=Array.isArray(c.perms)?c.perms.map(String):[];
 for(const k of ["name","pkg","vn","url","out","args","notes","flv","bc","ua","src","ref","sub"])n[k]=n[k]==null||typeof n[k]==="object"?"":String(n[k]);
 n.vn=n.vn||"1.0.0";n.vc=Math.max(1,parseInt(c.vc)||1);n.min=Math.min(34,Math.max(26,parseInt(c.min)||26));
 n.fmt=pick(c.fmt,["apk","aab","both"],"apk");n.var=pick(c.var,["release","debug"],"release");n.orient=pick(c.orient,["unspecified","portrait","landscape"],"unspecified");
 n.color=hx(c.color)||"#ffd600";n.sc=hx(c.sc);n.spc=hx(c.spc);n.icbg=hx(c.icbg);
 fill0(n);
}

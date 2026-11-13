const C="v17";
const SHELL=["./", "index.html", "privacy.html", "css/app.css", "manifest.json", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "js/core.js", "js/home.js", "js/history.js", "js/console.js", "js/analyze.js", "js/results.js", "js/build.js", "js/extras.js", "js/template.js", "js/boot.js"];
self.addEventListener("install",e=>e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL))));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x!=="ext").map(x=>caches.delete(x))))));
self.addEventListener("fetch",e=>{
 const r=e.request,u=new URL(r.url);
 if(r.method!=="GET"||u.hostname==="api.github.com")return;
 if(/(fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net)$/.test(u.hostname)){e.respondWith(caches.open("ext").then(c=>c.match(r).then(m=>m||fetch(r).then(x=>{c.put(r,x.clone());return x}))));return}
 e.respondWith(fetch(r).catch(()=>caches.match(r,{ignoreSearch:true})));
});

function cu(e,to,instant){
 const id=e._id=(e._id||0)+1,from=+e.dataset.v||0;e.dataset.v=to;
 if(instant||from===to||matchMedia("(prefers-reduced-motion:reduce)").matches){e.textContent=to;return}
 const t0=performance.now();(function f(t){if(id!==e._id)return;const k=Math.min(1,(t-t0)/600);e.textContent=Math.round(from+(to-from)*k);if(k<1)requestAnimationFrame(f)})(t0);
}
function presets(){$("#ps").innerHTML='<option value="">Pilih</option>'+Object.keys(PR).map(k=>`<option>${esc(k)}</option>`).join("")}

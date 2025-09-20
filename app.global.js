// app.global.js (sin ESM). Debe cargarse DESPUÉS de la librería UMD de Supabase.
(function(){
  if (!window.supabase) {
    console.error("Supabase UMD no cargado. Incluye <script src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js'></script> antes de app.global.js");
    return;
  }

  // ✅ CREDENCIALES SUPABASE (las que me pasaste)
  const SUPABASE_URL = "https://vnekfauzivwsyueeizvz.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuZWtmYXV6aXZ3c3l1ZWVpenZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NTk3MzEsImV4cCI6MjA3MzAzNTczMX0.XWGEFAa8PbNNWVSBfwfEmscgDbaEASE8Z20DfTFeRlM";

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  function qs(name, def=null){ return new URLSearchParams(location.search).get(name) ?? def; }
  function $(sel, root=document){ return root.querySelector(sel); }
  function $$(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
  function fmt(n){ return Number(n ?? 0).toFixed(2); }
  function copy(text){ if (navigator.clipboard) navigator.clipboard.writeText(text); }
  function toast(msg, type="ok"){
    let el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(()=>el.classList.add("show"),10);
    setTimeout(()=>{ el.classList.remove("show"); setTimeout(()=>el.remove(),200) }, 2200);
  }

  window.App = {
    supabase: client,
    WEIGHT_JUDGES: 0.6,
    WEIGHT_PUBLIC: 0.4,
    qs, $, $$, fmt, copy, toast
  };
})();

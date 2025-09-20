// admin.js (sin imports). Requiere window.App
(function(){
  const { supabase, $, toast, copy } = window.App;

  const titleInput = $("#title");
  const candidateInput = $("#candidate");
  const imageInput = $("#image");
  const judgesInput = $("#judges");
  const createBtn = $("#createPoll");
  const qrContainer = $("#qrContainer");
  const resultsBtn = $("#viewResultsBtn");

  const qrModal = $("#qrModal");
  const qrModalBox = $("#qrModalBox");
  const qrLink = $("#qrLink");
  const btnCopy = $("#copyLink");
  const btnClose = $("#closeQr");

  function pollUrl(id){ return ${location.origin}/vote.html?poll=${id} }
  function resultsUrl(id){ return results.html?poll=${id} }

  createBtn.onclick = async () => {
    try {
      const title = titleInput.value.trim();
      const candidate = candidateInput.value.trim();
      const image = imageInput.value.trim();
      const rawJudges = (judgesInput.value || "").trim();
      if (!title) return toast("El título es obligatorio", "warn");

      // Crear poll abierta
      const { data: poll, error } = await supabase
        .from("polls")
        .insert([{ title, candidate_name: candidate || null, image_url: image || null, is_open: true }])
        .select().single();
      if (error) throw error;

      // Upsert jueces por code y asignación
      if (rawJudges) {
        const codes = rawJudges.split(",").map(s => s.trim()).filter(Boolean);
        if (codes.length){
          const upsertRows = codes.map(code => ({ code, role: "judge" }));
          const { error: upErr } = await supabase.from("users").upsert(upsertRows, { onConflict: "code" });
          if (upErr) console.warn("Aviso upsert users:", upErr);
          const { data: judgeUsers } = await supabase.from("users").select("id, code").in("code", codes);
          const pjRows = (judgeUsers||[]).map(u => ({ poll_id: poll.id, user_id: u.id }));
          if (pjRows.length){
            const { error: pjErr } = await supabase.from("poll_judges").insert(pjRows);
            if (pjErr) console.warn("Aviso insert poll_judges:", pjErr);
          }
        }
      }

      // QR + botón resultados
      qrContainer.innerHTML = "";
      new QRCode(qrContainer, { text: pollUrl(poll.id), width: 256, height: 256 });
      resultsBtn.style.display = "inline-block";
      resultsBtn.onclick = () => location.href = resultsUrl(poll.id);
      toast("Encuesta creada ✅");
      await loadPolls();
    } catch (err) {
      console.error(err);
      toast(err?.message || "Error creando la encuesta", "bad");
    }
  };

  async function loadPolls(){
    const tbody = $("#pollRows");
    tbody.innerHTML = "<tr><td colspan='4' class='small'>Cargando…</td></tr>";
    const { data, error } = await supabase
      .from("polls").select("*").order("created_at", { ascending:false });
    if (error){ tbody.innerHTML = "<tr><td colspan='4'>Error cargando</td></tr>"; return }
    if (!data?.length){ tbody.innerHTML = "<tr><td colspan='4' class='small'>No hay encuestas</td></tr>"; return }

    tbody.innerHTML = data.map(p => {
      const state = p.is_open === false ? "<span class='tag bad'>Cerrada</span>" : "<span class='tag ok'>Abierta</span>";
      const created = p.created_at ? new Date(p.created_at).toLocaleString() : "-";
      return `<tr>
        <td>${p.title}</td>
        <td>${state}</td>
        <td>${created}</td>
        <td>
          <button class="secondary" data-act="results" data-id="${p.id}">Resultados</button>
          <button class="ghost" data-act="qr" data-id="${p.id}">QR</button>
          <button class="warning" data-act="toggle" data-id="${p.id}">${p.is_open===false?"Abrir":"Cerrar"}</button>
          <button class="danger" data-act="delete" data-id="${p.id}">Eliminar</button>
          <button class="secondary" data-act="copy" data-id="${p.id}">Copiar link</button>
        </td>
      </tr>`;
    }).join("");
  }

  document.addEventListener("click", async (e)=>{
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const id = btn.dataset.id;
    const act = btn.dataset.act;

    if (act==="results") location.href = results.html?poll=${id};
    if (act==="copy"){ copy(pollUrl(id)); toast("Link copiado"); }

    if (act==="qr"){
      qrModalBox.innerHTML = "";
      new QRCode(qrModalBox, { text: pollUrl(id), width: 256, height: 256 });
      qrLink.textContent = pollUrl(id);
      qrModal.classList.add("show");
    }

    if (act==="toggle"){
      const { data: p, error: getErr } = await supabase.from("polls").select("is_open").eq("id", id).single();
      if (getErr){ toast("Error leyendo estado", "bad"); return; }
      const { error } = await supabase.from("polls").update({ is_open: !p.is_open }).eq("id", id);
      if (error) toast("No se pudo cambiar el estado", "bad"); else { toast("Estado actualizado"); loadPolls(); }
    }

    if (act==="delete"){
      if (!confirm("¿Eliminar encuesta y sus votos?")) return;
      await supabase.from("votes").delete().eq("poll_id", id);
      await supabase.from("poll_judges").delete().eq("poll_id", id);
      const { error } = await supabase.from("polls").delete().eq("id", id);
      if (error) toast("No se pudo eliminar", "bad"); else { toast("Encuesta eliminada"); loadPolls(); }
    }
  });

  btnClose.onclick = ()=> qrModal.classList.remove("show");
  btnCopy.onclick = ()=> { copy(qrLink.textContent); toast("Link copiado"); };

  loadPolls();
})();

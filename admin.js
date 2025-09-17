createBtn.onclick = async () => {
  const title = titleInput.value.trim();
  const candidate = candidateInput.value.trim();
  const image = imageInput.value.trim();
  const judges = judgesInput.value.split(",").map(j => j.trim().toUpperCase()).filter(Boolean);

  if (!title) return alert("Debes ingresar un título para la encuesta.");

  try {
    // 1️⃣ Crear encuesta
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert([{ title, candidate_name: candidate, image_url: image }])
      .select()
      .single();

    if (pollError) {
      console.error("Error creando encuesta:", pollError);
      alert("Error al crear encuesta: " + pollError.message);
      return;
    }

    // 🔧 Guardar poll.id en variable global para usarlo después
    window.currentPollId = poll.id;

    // 2️⃣ Asignar jueces
    for (const code of judges) {
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("code", code)
        .maybeSingle();

      if (!user) {
        console.warn(`⚠ No se encontró el juez con código ${code}`);
        continue;
      }
      await supabase.from("poll_judges").insert([{ poll_id: poll.id, user_id: user.id }]);
    }

    // 3️⃣ Generar QR
    qrDiv.innerHTML = "";
    const qrUrl = `${location.origin}/vote.html?poll=${poll.id}`;
    new QRCode(qrDiv, {
      text: qrUrl,
      width: 280,
      height: 280,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });

    console.log("QR generado:", qrUrl);

    // 4️⃣ Mostrar botón de resultados
    const resultsBtn = document.getElementById("results");
    resultsBtn.style.display = "block";
    resultsBtn.onclick = () => {
      window.open(`${location.origin}/results.html?poll=${window.currentPollId}`, "_blank");
    };

    alert("Encuesta creada con éxito ✅");
  } catch (e) {
    console.error("Error general:", e);
    alert("Hubo un error inesperado. Revisa la consola para más detalles.");
  }
};

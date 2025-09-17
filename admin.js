import { supabase } from "./app.js";

// Elementos del DOM
const titleInput = document.getElementById("title");
const candidateInput = document.getElementById("candidate");
const imageInput = document.getElementById("image");
const judgesInput = document.getElementById("judges");
const createBtn = document.getElementById("create");
const qrDiv = document.getElementById("qr");

createBtn.onclick = async () => {
  const title = titleInput.value.trim();
  const candidate = candidateInput.value.trim();
  const image = imageInput.value.trim();

  // 🔧 Convertir los códigos de jueces a MAYÚSCULAS para evitar problemas de coincidencia
  const judges = judgesInput.value.split(",").map(j => j.trim().toUpperCase()).filter(Boolean);

  if (!title) return alert("Debes ingresar un título para la encuesta.");

  try {
    // 1️⃣ Insertar encuesta en "polls"
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

    // 2️⃣ Insertar jueces en "poll_judges"
    for (const code of judges) {
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("code", code)
        .maybeSingle(); // <- usa maybeSingle para evitar error si no existe

      if (userError || !user) {
        console.warn(`⚠ No se encontró el juez con código ${code}`);
        continue;
      }

      await supabase.from("poll_judges").insert([
        { poll_id: poll.id, user_id: user.id }
      ]);
    }

    // 3️⃣ Generar y mostrar QR
        
    qrDiv.innerHTML = "";
    const qrUrl = `${location.origin}/vote.html?poll=${poll.id}`;

    // qrcodejs usa esta sintaxis:
    new QRCode(qrDiv, {
      text: qrUrl,
      width: 280,
      height: 280,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });

    console.log("QR generado:", qrUrl);
    alert("Encuesta creada con éxito ✅");


  } catch (e) {
    console.error("Error general:", e);
    alert("Hubo un error inesperado. Revisa la consola para más detalles.");
  }
      // 4️⃣ Mostrar botón para ver resultados en vivo
    const resultsBtn = document.getElementById("results");
    resultsBtn.style.display = "block";
    resultsBtn.onclick = () => {
      window.open(`${location.origin}/results.html?poll=${poll.id}`, "_blank");
    };

};

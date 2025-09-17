import { supabase } from "./app.js";

document.getElementById("create").onclick = async () => {
  const title = document.getElementById("title").value.trim();
  const candidate = document.getElementById("candidate").value.trim();
  const image = document.getElementById("image").value.trim();
  const judges = document.getElementById("judges").value.split(",").map(s=>s.trim()).filter(Boolean);

  if(!title) return alert("Ingresa un título");

  const { data: poll, error } = await supabase
    .from("polls")
    .insert({ title, candidate_name:candidate, image_url:image })
    .select()
    .single();

  if(error) return alert(error.message);

  // Insertar jueces en poll_judges
  for(const code of judges){
    const { data:u } = await supabase.from("users").select("id").eq("code",code).single();
    if(u){
      await supabase.from("poll_judges").insert({ poll_id: poll.id, user_id: u.id });
    }
  }

  const qrDiv = document.getElementById("qr");
  qrDiv.innerHTML = "";
  const canvas = document.createElement("canvas");
  qrDiv.appendChild(canvas);
  const url = `${location.origin}/vote.html?poll=${poll.id}`;
  QRCode.toCanvas(canvas, url, { width: 300 });
};

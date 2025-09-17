import { supabase, qs } from "./app.js";

const pollId = qs("poll");

(async ()=>{
  const { data: poll } = await supabase.from("polls").select("*").eq("id", pollId).single();
  if(poll){
    document.getElementById("title").textContent = poll.title;
    document.getElementById("candidate").textContent = poll.candidate_name || "";
    if(poll.image_url) document.getElementById("photo").src = poll.image_url;
  }

  async function refresh(){
    const { data } = await supabase.rpc("poll_scores",{ p_poll_id: pollId });
    if(!data) return;
    document.getElementById("j").textContent = Number(data.judges_total||0).toFixed(1);
    document.getElementById("p").textContent = Number(data.public_avg||0).toFixed(1);
    document.getElementById("t").textContent = Number(data.total_40||0).toFixed(1);
  }

  refresh();
  supabase.channel("votes")
    .on("postgres_changes",{ event:"*", schema:"public", table:"votes", filter:`poll_id=eq.${pollId}` }, refresh)
    .subscribe();
})();

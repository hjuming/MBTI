(function(){
  const $ = sel => document.querySelector(sel);
  const app = { step:0, answers:[], scores:{E:0,I:0,S:0,N:0,T:0,F:0,J:0,P:0}, result:null };

  const startEl=$("#start-screen"), quizEl=$("#quiz-screen"), resultEl=$("#result-screen");
  const qTitle=$("#qTitle"), qOpts=$("#qOptions"), qIndex=$("#qIndex"), bar=$("#progressBar");

  $("#btnStart").addEventListener("click", ()=>{
    startEl.classList.add("hidden"); quizEl.classList.remove("hidden");
    app.step=0; app.answers=new Array(QUIZ.length).fill(null); renderQuestion();
    window.scrollTo(0,0);
  });
  $("#btnPrev").addEventListener("click", ()=>{ if(app.step>0){ app.step--; renderQuestion(); }});
  $("#btnNext").addEventListener("click", ()=>{
    const picked=qOpts.querySelector("input[type=radio]:checked");
    if(!picked) return alert("請先選擇一個選項");
    app.answers[app.step]=parseInt(picked.value,10);
    if(app.step<QUIZ.length-1){ app.step++; renderQuestion(); } else { computeAndShowResult(); }
  });
  $("#btnRestart").addEventListener("click", ()=>{ resultEl.classList.add("hidden"); startEl.classList.remove("hidden"); window.scrollTo(0,0); });
  $("#btnSend").addEventListener("click", sendEmail);

  function renderQuestion(){
    const q=QUIZ[app.step];
    qTitle.textContent=q.t; qIndex.textContent=`${app.step+1} / ${QUIZ.length}`;
    bar.style.width=`${Math.round((app.step/QUIZ.length)*100)}%`;
    qOpts.innerHTML=""; q.opts.forEach((o,idx)=>{
      const id=`q${app.step}_opt${idx}`;
      const el=document.createElement("label"); el.className="option";
      el.innerHTML=`<input type="radio" name="q${app.step}" id="${id}" value="${idx}"><span>${o.label}</span>`;
      qOpts.appendChild(el);
    });
    const prev=app.answers[app.step]; if(prev!==null){ qOpts.querySelector(`input[value="${prev}"]`).checked=true; }
  }

  const MBTI_KEYS=["INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP","ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP"];

  function computeAndShowResult(){
    // reset scores
    for(const k in app.scores) app.scores[k]=0;
    // tally
    QUIZ.forEach((q,qi)=>{
      const idx=app.answers[qi]; if(idx===null) return;
      q.opts[idx].tags.forEach(t=>app.scores[t]++);
    });
    // type
    const EI=app.scores.E>=app.scores.I?"E":"I";
    const SN=app.scores.S>=app.scores.N?"S":"N";
    const TF=app.scores.T>=app.scores.F?"T":"F";
    const JP=app.scores.J>=app.scores.P?"J":"P";
    const type=`${EI}${SN}${TF}${JP}`;

    // UI
    const scoreLine=`E:${app.scores.E}/I:${app.scores.I}｜S:${app.scores.S}/N:${app.scores.N}｜T:${app.scores.T}/F:${app.scores.F}｜J:${app.scores.J}/P:${app.scores.P}`;
    document.getElementById("typeLine").textContent=`${type}｜${scoreLine}`;
    const sg=document.getElementById("scoreGrid");
    sg.innerHTML=`
      <div class="chip">E：${app.scores.E}</div><div class="chip">I：${app.scores.I}</div>
      <div class="chip">S：${app.scores.S}</div><div class="chip">N：${app.scores.N}</div>
      <div class="chip">T：${app.scores.T}</div><div class="chip">F：${app.scores.F}</div>
      <div class="chip">J：${app.scores.J}</div><div class="chip">P：${app.scores.P}</div>`;

    const main=`assets/cards/${type}.jpg`;
    const mainImg=document.getElementById("mainCardImg");
    mainImg.src=main; mainImg.alt=type+" 圖卡";

    // Top4 by distance on normalized axes
    const order=MBTI_KEYS.map(k=>({type:k,d:distanceTo(k,app.scores)})).sort((a,b)=>a.d-b.d).slice(0,4);
    const top4=document.getElementById("top4List");
    top4.innerHTML="";
    order.forEach(o=>{
      const thumb=`assets/cards/${o.type}.jpg`;
      const el=document.createElement("div"); el.className="top4-card";
      el.innerHTML=`<img src="${thumb}" alt="${o.type}"><div class="cap">${o.type}</div>`;
      top4.appendChild(el);
    });

    app.result={type,score:{...app.scores},top4:order.map(x=>x.type),image:main};
    quizEl.classList.add("hidden"); resultEl.classList.remove("hidden"); window.scrollTo(0,0);
  }

  function distanceTo(type,s){
    const ideal={E:0,I:0,S:0,N:0,T:0,F:0,J:0,P:0};
    [type[0],type[1],type[2],type[3]].forEach(a=>ideal[a]=1);
    const maxEI=(s.E+s.I)||1, maxSN=(s.S+s.N)||1, maxTF=(s.T+s.F)||1, maxJP=(s.J+s.P)||1;
    const v={E:s.E/maxEI,I:s.I/maxEI,S:s.S/maxSN,N:s.N/maxSN,T:s.T/maxTF,F:s.F/maxTF,J:s.J/maxJP,P:s.P/maxJP};
    const keys=["E","I","S","N","T","F","J","P"]; let sum=0; keys.forEach(k=>{const d=v[k]-ideal[k]; sum+=d*d;}); return Math.sqrt(sum);
  }

  async function sendEmail(){
    const name=document.getElementById("nameInput").value||"(未填名)";
    const email=document.getElementById("emailInput").value||"";
    if(!email){ alert("若要寄送完整報告，請在首頁輸入 Email"); return; }
    const params={
      to_name:name, to_email:email,
      main_type: app.result.type,
      scores: `E:${app.result.score.E}/I:${app.result.score.I}; S:${app.result.score.S}/N:${app.result.score.N}; T:${app.result.score.T}/F:${app.result.score.F}; J:${app.result.score.J}/P:${app.result.score.P}`,
      top4: app.result.top4.join(" / "),
      image_url: location.origin + '/' + app.result.image
    };
    try{
      await emailjs.send(window.EMAILJS_SERVICE_ID, window.EMAILJS_TEMPLATE_ID, params);
      alert("已寄出完整報告到你的 Email！");
    }catch(err){
      console.error("EmailJS error:", err);
      alert("寄送失敗：請檢查 EmailJS 設定或稍後重試。");
    }
  }
})();
/* 初始化 EmailJS（從 <meta> 取三個 key） */
(function initEmailJS(){
  const pk = document.querySelector('meta[name="emailjs-public-key"]')?.content || "";
  if (pk) emailjs.init({ publicKey: pk });
})();

/* 讀 meta 方便後面送信 */
const EMAIL_CFG = {
  service: document.querySelector('meta[name="emailjs-service-id"]')?.content || "",
  template: document.querySelector('meta[name="emailjs-template-id"]')?.content || "",
};

const $ = (sel)=>document.querySelector(sel);
const $$ = (sel)=>document.querySelectorAll(sel);

const el = {
  hero: $("#hero"),
  startBtn: $("#startBtn"),
  quiz: $("#quiz"),
  loader: $("#loader"),
  error: $("#errorBox"),
  progressBar: $("#progressBar"),
  progressText: $("#progressText"),
  questionText: $("#questionText"),
  optionsWrap: $("#optionsWrap"),
  prevBtn: $("#prevBtn"),
  nextBtn: $("#nextBtn"),
  result: $("#result"),
  typeText: $("#typeText"),
  typeTitle: $("#typeTitle"),
  typeCard: $("#typeCard"),
  typeDesc: $("#typeDesc"),
  scoreList: $("#scoreList"),
  top4: $("#top4"),
  retakeBtn: $("#retakeBtn"),
  shareBtn: $("#shareBtn"),
  emailForm: $("#emailForm"),
  emailMsg: $("#emailMsg"),
};

let QUESTIONS = [];   // {id, question, options:[{text,tags[]},...]}
let current = 0;
let answers = [];    // index of selected option (0..3)
let score;           // {E,I,S,N,T,F,J,P}

/* 載入 Excel → 轉為 QUESTIONS 陣列 */
async function loadQuestions(){
  el.loader.classList.remove("hidden");
  try{
    const buf = await fetch(window.QUIZ_XLSX).then(r=>r.arrayBuffer());
    const wb = XLSX.read(buf, {type:"array"});
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json(ws, {defval:""});

    const alias = window.headerAliases;
    QUESTIONS = raw.map(row=>{
      const pick = (keys)=>Object.keys(row).find(k=>keys.includes(k.trim()))||"";
      const id = row[pick(alias.id)];
      const q  = row[pick(alias.question)];
      const o1 = row[pick(alias.opt1)], o2=row[pick(alias.opt2)], o3=row[pick(alias.opt3)], o4=row[pick(alias.opt4)];
      const t1 = (row[pick(alias.tags1)]+"").split(/[,\s/]+").filter(Boolean);
      const t2 = (row[pick(alias.tags2)]+"").split(/[,\s/]+").filter(Boolean);
      const t3 = (row[pick(alias.tags3)]+"").split(/[,\s/]+").filter(Boolean);
      const t4 = (row[pick(alias.tags4)]+"").split(/[,\s/]+").filter(Boolean);
      return {
        id, question:q,
        options:[
          {text:o1, tags:t1},
          {text:o2, tags:t2},
          {text:o3, tags:t3},
          {text:o4, tags:t4},
        ]
      };
    }).filter(q=>q.question);

    answers = new Array(QUESTIONS.length).fill(null);
  }catch(e){
    console.error(e);
    el.error.classList.remove("hidden");
  }finally{
    el.loader.classList.add("hidden");
  }
}

/* UI：顯示某一題 */
function renderQuestion(){
  const q = QUESTIONS[current];
  el.questionText.textContent = q.question;
  el.optionsWrap.innerHTML = "";
  q.options.forEach((opt,idx)=>{
    const div = document.createElement("button");
    div.type = "button";
    div.className = "option" + (answers[current]===idx ? " selected":"");
    div.innerText = opt.text || `選項 ${idx+1}`;
    div.onclick = ()=>{
      answers[current] = idx;
      renderQuestion();
    };
    el.optionsWrap.appendChild(div);
  });
  el.prevBtn.disabled = current===0;
  el.nextBtn.textContent = (current===QUESTIONS.length-1) ? "看結果" : "下一題";
  const pct = Math.round(((answers.filter(a=>a!==null).length)/QUESTIONS.length)*100);
  el.progressBar.style.width = `${pct}%`;
  el.progressText.textContent = `${answers.filter(a=>a!==null).length} / ${QUESTIONS.length}`;
}

/* 計分 */
function tally(){
  score = {E:0,I:0,S:0,N:0,T:0,F:0,J:0,P:0};
  answers.forEach((sel,i)=>{
    if(sel===null) return;
    const tags = QUESTIONS[i].options[sel].tags || [];
    tags.forEach(t=>{
      const k = t.trim().toUpperCase();
      if(score[k]!==undefined) score[k]+=1;
    });
  });
}

/* 取得四字母（同分→前者優先） */
function toType(s){
  const A = s.E>=s.I ? "E":"I";
  const B = s.S>=s.N ? "S":"N";
  const C = s.T>=s.F ? "T":"F";
  const D = s.J>=s.P ? "J":"P";
  return A+B+C+D;
}

/* 匹配 Top4（簡單四字母一致度 4~0；同分看 8 維差總和較小優先） */
function pickTop4(s){
  const types = Object.keys(window.TYPE_META);
  const user = toType(s);
  const userVec = {
    E: s.E>=s.I ? 1:0, I: s.I>s.E ? 1:0,
    S: s.S>=s.N ? 1:0, N: s.N>s.S ? 1:0,
    T: s.T>=s.F ? 1:0, F: s.F>s.T ? 1:0,
    J: s.J>=s.P ? 1:0, P: s.P>s.J ? 1:0,
  };

  const scoreType = (t)=>{
    const v = {
      E: t[0]==="E"?1:0, I: t[0]==="I"?1:0,
      S: t[1]==="S"?1:0, N: t[1]==="N"?1:0,
      T: t[2]==="T"?1:0, F: t[2]==="F"?1:0,
      J: t[3]==="J"?1:0, P: t[3]==="P"?1:0,
    };
    let letters = 0;
    if (t[0]===user[0]) letters++;
    if (t[1]===user[1]) letters++;
    if (t[2]===user[2]) letters++;
    if (t[3]===user[3]) letters++;
    // 次序：一致字母越多越好；差距總和越小越好
    const diff = ["E","I","S","N","T","F","J","P"].reduce((acc,k)=>acc+Math.abs((v[k]||0)-(userVec[k]||0)),0);
    return {letters, diff};
  };

  const ranked = types.map(t=>{
    const m = scoreType(t);
    return {type:t, letters:m.letters, diff:m.diff};
  }).sort((a,b)=> b.letters - a.letters || a.diff - b.diff);

  // 轉成百分比
  const base = ranked.slice(0,4).map(r=>r.letters);
  const sum = base.reduce((a,b)=>a+b,0) || 1;
  return ranked.slice(0,4).map(r=>{
    const pct = Math.round((r.letters / sum) * 100);
    let reason = [];
    for(let i=0;i<4;i++){
      if(r.type[i]===user[i]) reason.push(r.type[i]);
    }
    return { type:r.type, pct, reason: reason.join("、") || "整體傾向相近" };
  });
}

/* 渲染結果頁 */
function renderResult(){
  tally();
  const type = toType(score);
  const meta = window.TYPE_META[type];
  el.typeText.textContent = type;
  el.typeTitle.textContent = `${type} — ${meta.role}（${meta.keyword}）`;
  el.typeCard.src = window.cardSrc(type);
  el.typeCard.alt = `${type} 動物圖卡（${meta.role} / ${meta.keyword}）`;
  el.typeDesc.textContent = meta.desc;

  el.scoreList.innerHTML = "";
  ["E","I","S","N","T","F","J","P"].forEach(k=>{
    const li = document.createElement("li");
    li.innerHTML = `<span>${k}</span><strong>${score[k]||0}</strong>`;
    el.scoreList.appendChild(li);
  });

  const top = pickTop4(score);
  el.top4.innerHTML = top.map(t=>{
    const m = window.TYPE_META[t.type];
    return `<li><strong>${t.type}</strong> — ${m.animals.join(" × ")}（${t.pct}%；一致：${t.reason}）</li>`;
  }).join("");

  // Email form 綁定
  el.emailForm.onsubmit = async (e)=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      user_name: fd.get("user_name") || "",
      user_email: fd.get("user_email") || "",
      result_type: type,
      scores_json: JSON.stringify(score),
      top1_type: top[0]?.type || "", top1_reason: top[0]?.reason || "", top1_pct: top[0]?.pct || 0,
      top2_type: top[1]?.type || "", top2_reason: top[1]?.reason || "", top2_pct: top[1]?.pct || 0,
      top3_type: top[2]?.type || "", top3_reason: top[2]?.reason || "", top3_pct: top[2]?.pct || 0,
      top4_type: top[3]?.type || "", top4_reason: top[3]?.reason || "", top4_pct: top[3]?.pct || 0,
      retake_url: location.origin + location.pathname,
      pdf_url: "", // 可日後接 html2pdf
      cards_html: top.map(t=>{
        const m = window.TYPE_META[t.type];
        return `
          <tr>
            <td width="96"><img src="${window.cardSrc(t.type)}" alt="${t.type}" width="96"/></td>
            <td><strong>${t.type}</strong> — ${m.role} ${m.keyword}<br/>${m.animals.join(" × ")}｜一致：${t.reason}（${t.pct}%）</td>
          </tr>`;
      }).join("")
    };

    try{
      const {service, template} = EMAIL_CFG;
      if(!service || !template) throw new Error("EmailJS 參數未設定");
      await emailjs.send(service, template, payload);
      el.emailMsg.textContent = "已寄送完整報告，請至信箱查看。";
    }catch(err){
      console.error("EmailJS error:", err);
      el.emailMsg.textContent = "寄送失敗，稍後再試";
    }
  };

  el.result.classList.remove("hidden");
  el.quiz.classList.add("hidden");
  el.hero.classList.add("hidden");
}

/* 分享 */
async function share(){
  const txt = `我的 MBTI 動物原型：${el.typeText.textContent} ｜來測試 👉 ${location.href}`;
  if(navigator.share){
    try{ await navigator.share({title:document.title, text:txt, url:location.href}); }catch{}
  }else{
    await navigator.clipboard.writeText(txt);
    alert("連結已複製！");
  }
}

/* 事件 */
el.startBtn.onclick = async ()=>{
  await loadQuestions();
  if(!QUESTIONS.length) return;
  el.hero.classList.add("hidden");
  el.quiz.classList.remove("hidden");
  current = 0; answers.fill(null);
  renderQuestion();
};
el.prevBtn.onclick = ()=>{ if(current>0){ current--; renderQuestion(); }};
el.nextBtn.onclick = ()=>{
  if(answers[current]==null){ alert("請先選擇一個選項"); return; }
  if(current<QUESTIONS.length-1){ current++; renderQuestion(); }
  else{ renderResult(); }
};
el.retakeBtn.onclick = ()=>location.reload();
el.shareBtn.onclick = share;

/* 頁面進入：如果已經填過（例如返回），重新渲染 */
window.addEventListener("pageshow", ()=> {
  if(QUESTIONS.length && !el.quiz.classList.contains("hidden")){
    renderQuestion();
  }
});

/* 單頁式問卷：一題一頁、進度條、計分、結果＋EmailJS 寄送 */

const el = (sel) => document.querySelector(sel);
const app = el('#app');

const DIM_PAIRS = [
  ["E","I"],
  ["S","N"],
  ["T","F"],
  ["J","P"]
];

/* 16 型 → 動物與圖片（檔名：assets/cards/TYPE.jpg）
   ─ 依你提供的最終定案 ─ */
const TYPE_MAP = {
  // 🌬️ Analysts (NT – Air)
  "INTJ": { title:"Architect",   animals:"貓頭鷹 × 章魚",           img:"assets/cards/INTJ.jpg" },
  "INTP": { title:"Logician",    animals:"烏鴉 × 變色龍",           img:"assets/cards/INTP.jpg" },
  "ENTJ": { title:"Commander",   animals:"獅子 × 老鷹",             img:"assets/cards/ENTJ.jpg" },
  "ENTP": { title:"Debater",     animals:"狐狸 × 海豚",             img:"assets/cards/ENTP.jpg" },

  // 💧 Diplomats (NF – Water)（原文單貼有段落名錯置，這裡依型別正確歸類）
  "INFJ": { title:"Advocate",    animals:"狼 × 白馬",               img:"assets/cards/INFJ.jpg" },
  "INFP": { title:"Mediator",    animals:"鹿 × 兔子",               img:"assets/cards/INFP.jpg" },
  "ENFJ": { title:"Protagonist", animals:"黃金獵犬 × 大象",         img:"assets/cards/ENFJ.jpg" },
  "ENFP": { title:"Campaigner",  animals:"水獺 × 蝴蝶",             img:"assets/cards/ENFP.jpg" },

  // 🌍 Sentinels (SJ – Earth)
  "ISTJ": { title:"Logistician", animals:"海狸 × 烏龜",             img:"assets/cards/ISTJ.jpg" },
  "ISFJ": { title:"Defender",    animals:"母熊 × 企鵝",             img:"assets/cards/ISFJ.jpg" },
  "ESTJ": { title:"Executive",   animals:"牧羊犬 × 蜜蜂",           img:"assets/cards/ESTJ.jpg" },
  "ESFJ": { title:"Consul",      animals:"袋鼠 × 天鵝",             img:"assets/cards/ESFJ.jpg" },

  // 🔥 Explorers (SP – Fire)
  "ISTP": { title:"Virtuoso",    animals:"猴子 × 野狼",             img:"assets/cards/ISTP.jpg" },
  "ISFP": { title:"Adventurer",  animals:"孔雀 × 貓",               img:"assets/cards/ISFP.jpg" },
  "ESTP": { title:"Entrepreneur",animals:"老虎 × 獵豹",             img:"assets/cards/ESTP.jpg" },
  "ESFP": { title:"Entertainer", animals:"鸚鵡 × 海獅",             img:"assets/cards/ESFP.jpg" },
};

let state = {
  i: 0,
  answers: [],  // {id, text, tags}
  score: {E:0,I:0,S:0,N:0,T:0,F:0,J:0,P:0},
  name: "", email: ""
};

function renderProgress() {
  const total = MBTI_QUESTIONS.length;
  const pct = Math.round((state.i/total)*100);
  return `<div class="progress"><div style="width:${pct}%"></div><span>${state.i}/${total}</span></div>`;
}

function renderQuestion() {
  const q = MBTI_QUESTIONS[state.i];
  const progress = renderProgress();
  app.innerHTML = `
    ${progress}
    <section class="card">
      <h2>${q.q}</h2>
      <div class="opts">
        ${q.options.map((op,idx)=>`
          <button class="opt" data-idx="${idx}">${op.t}</button>
        `).join("")}
      </div>
      <div class="nav">
        <button class="ghost" ${state.i===0?"disabled":""} id="btnBack">上一題</button>
      </div>
    </section>
  `;
  app.querySelectorAll(".opt").forEach(btn=>{
    btn.addEventListener("click",()=>selectOption(q, parseInt(btn.dataset.idx,10)));
  });
  el("#btnBack")?.addEventListener("click", goBack);
}

function selectOption(q, idx){
  const op = q.options[idx];
  state.answers[state.i] = { id:q.id, text:op.t, tags:op.tags.slice() };
  // 記分
  op.tags.forEach(t=> state.score[t] = (state.score[t]||0)+1 );

  state.i++;
  if (state.i < MBTI_QUESTIONS.length) {
    renderQuestion();
  } else {
    renderForm();
  }
}

function goBack(){
  if (state.i===0) return;
  // 回退要扣掉上一題的分數
  const prev = state.answers[state.i-1];
  if (prev) prev.tags.forEach(t=> state.score[t]--);
  state.i--;
  renderQuestion();
}

function typeFromScore(sc){
  const letters = DIM_PAIRS.map(([a,b]) => (sc[a] >= sc[b] ? a : b)).join("");
  return letters;
}

function renderForm(){
  const progress = renderProgress();
  app.innerHTML = `
    ${progress}
    <section class="card">
      <h2>最後一步</h2>
      <p>留下稱呼與 Email，接收你的完整結果（含 4 張最接近的動物圖卡）。</p>
      <div class="form">
        <label>稱呼<input id="name" placeholder="你的名字"></label>
        <label>Email<input id="email" type="email" placeholder="you@example.com"></label>
      </div>
      <div class="nav">
        <button class="ghost" id="btnBack">上一題</button>
        <button id="btnFinish">看結果</button>
      </div>
    </section>
  `;
  el("#btnBack").addEventListener("click", goBack);
  el("#btnFinish").addEventListener("click", ()=>{
    state.name  = el("#name").value.trim();
    state.email = el("#email").value.trim();
    renderResult();
  });
}

function top4Types(sc){
  // 主型 + 單軸翻轉三個鄰近型
  const main = typeFromScore(sc);
  const neighbors = [];
  DIM_PAIRS.forEach(([a,b], idx)=>{
    const letters = main.split("");
    letters[idx] = (letters[idx]===a? b : a);
    neighbors.push(letters.join(""));
  });
  return [main, ...neighbors];
}

function renderResult(){
  const t = typeFromScore(state.score);
  const pack = TYPE_MAP[t] || {};

  const axis = DIM_PAIRS.map(([a,b])=>{
    const av = state.score[a]||0, bv = state.score[b]||0;
    return `<li>${a}/${b}：${av}／${bv}</li>`;
  }).join("");

  const picks = top4Types(state.score)
    .map(tp=>{
      const m = TYPE_MAP[tp]||{};
      return `
        <div class="pick">
          <img src="${m.img||''}" alt="${tp}" onerror="this.style.opacity=.1">
          <div class="cap"><strong>${tp}</strong> — ${m.animals||''}</div>
        </div>`;
    }).join("");

  app.innerHTML = `
    <section class="card">
      <h2>完成！你的結果</h2>
      <p class="lead">你的傾向：<strong>${t}</strong></p>
      <div class="hero">
        <img class="main-card" src="${pack.img||''}" alt="${t}" onerror="this.style.opacity=.1">
        <div class="meta">
          <h3>${pack.title||''}</h3>
          <p>${pack.animals||''}</p>
          <ul class="axis">${axis}</ul>
        </div>
      </div>

      <h3>為你挑的 4 張圖卡</h3>
      <div class="grid4">${picks}</div>

      <div class="email-panel">
        <button id="btnEmail">把完整報告寄到 Email</button>
      </div>
      <div class="again">
        <a href="./">再測一次</a>
      </div>
    </section>
  `;

  el("#btnEmail").addEventListener("click", sendEmail);
}

function sendEmail(){
  const payload = {
    name: state.name || "朋友",
    email: state.email || "",
    type: typeFromScore(state.score),
    score: JSON.stringify(state.score),
    answers: JSON.stringify(state.answers)
  };
  if (!payload.email) {
    alert("請輸入 Email");
    return;
  }
  emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, payload)
    .then(()=> alert("已寄出！請查收信箱"))
    .catch(err=>{
      console.error(err);
      alert("寄送失敗，稍後再試");
    });
}

/* 初始載入 */
(function start(){
  state = { i:0, answers:[], score:{E:0,I:0,S:0,N:0,T:0,F:0,J:0,P:0}, name:"", email:"" };
  renderQuestion();
})();

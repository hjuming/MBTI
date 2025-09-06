document.addEventListener('DOMContentLoaded', () => {
  // --- DOM 元素 ---
  const dom = {
    hero: document.getElementById('hero'),
    quiz: document.getElementById('quiz'),
    result: document.getElementById('result'),
    startBtn: document.getElementById('startBtn'),
    questionText: document.getElementById('questionText'),
    optionsWrap: document.getElementById('optionsWrap'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    typeTitle: document.getElementById('typeTitle'),
    typeSubtitle: document.getElementById('typeSubtitle'),
    typeCard: document.getElementById('typeCard'),
    typeDesc: document.getElementById('typeDesc'),
    scoreList: document.getElementById('scoreList'),
    top4List: document.getElementById('top4List'),
    retakeBtn: document.getElementById('retakeBtn'),
    shareBtn: document.getElementById('shareBtn'),
    emailForm: document.getElementById('emailForm'),
    emailMsg: document.getElementById('emailMsg'),
    // EmailJS 隱藏欄位
    emailMbtiType: document.getElementById('emailMbtiType'),
    emailTypeTitle: document.getElementById('emailTypeTitle'),
    emailTypeDesc: document.getElementById('emailTypeDesc'),
    emailTop4Types: document.getElementById('emailTop4Types'),
  };

  // --- 狀態管理 ---
  let currentQuestionIndex = 0;
  let userAnswers = new Array(questions.length).fill(null);
  const MBTI_KEYS = Object.keys(personalityData);

  // --- EmailJS 初始化 ---
  const emailPublicKey = document.querySelector('meta[name="emailjs-public-key"]').content;
  const emailServiceId = document.querySelector('meta[name="emailjs-service-id"]').content;
  const emailTemplateId = document.querySelector('meta[name="emailjs-template-id"]').content;
  if(emailPublicKey) {
    emailjs.init(emailPublicKey);
  }

  // --- 函式 ---

  const transitionTo = (targetSection) => {
    [dom.hero, dom.quiz, dom.result].forEach(section => {
      if (section !== targetSection) {
        section.classList.add('hidden');
      } else {
        section.classList.remove('hidden');
      }
    });
    window.scrollTo(0, 0);
  };

  const showQuestion = () => {
    const question = questions[currentQuestionIndex];
    dom.questionText.textContent = question.t;
    dom.optionsWrap.innerHTML = '';
    
    question.opts.forEach((opt) => {
      const optionBtn = document.createElement('button');
      optionBtn.className = 'option';
      optionBtn.textContent = opt.label;
      if (userAnswers[currentQuestionIndex] === opt.tags) {
        optionBtn.classList.add('selected');
      }
      optionBtn.addEventListener('click', () => {
        userAnswers[currentQuestionIndex] = opt.tags;
        showQuestion(); // 重新渲染以更新選擇狀態
      });
      dom.optionsWrap.appendChild(optionBtn);
    });

    updateProgress();
    updateNavButtons();
  };
  
  const updateProgress = () => {
    const progress = (currentQuestionIndex + 1) / questions.length * 100;
    dom.progressBar.style.width = `${progress}%`;
    dom.progressText.textContent = `${currentQuestionIndex + 1} / ${questions.length}`;
  };

  const updateNavButtons = () => {
    dom.prevBtn.disabled = currentQuestionIndex === 0;
    const isAnswered = userAnswers[currentQuestionIndex] !== null;
    dom.nextBtn.disabled = !isAnswered;
    dom.nextBtn.innerHTML = (currentQuestionIndex === questions.length - 1) 
      ? '查看結果 <i class="bi bi-check-circle"></i>' 
      : '下一題 <i class="bi bi-arrow-right"></i>';
  };

  const calculateResult = () => {
    const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    userAnswers.forEach(tags => {
      if (tags) {
        tags.forEach(tag => {
          if (scores.hasOwnProperty(tag)) scores[tag]++;
        });
      }
    });

    let resultType = '';
    resultType += scores.E >= scores.I ? 'E' : 'I';
    resultType += scores.N >= scores.S ? 'N' : 'S';
    resultType += scores.T >= scores.F ? 'T' : 'F';
    resultType += scores.J >= scores.P ? 'J' : 'P';
    
    const top4 = MBTI_KEYS
      .map(k => ({ type: k, d: distanceTo(k, scores) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 4)
      .map(item => item.type);

    return { resultType, scores, top4 };
  };

  // 您的優秀演算法，完全保留
  function distanceTo(type, s){
    const ideal={E:0,I:0,S:0,N:0,T:0,F:0,J:0,P:0};
    [type[0],type[1],type[2],type[3]].forEach(a=>ideal[a]=1);
    const maxEI=(s.E+s.I)||1, maxSN=(s.S+s.N)||1, maxTF=(s.T+s.F)||1, maxJP=(s.J+s.P)||1;
    const v={E:s.E/maxEI,I:s.I/maxEI,S:s.S/maxSN,N:s.N/maxSN,T:s.T/maxTF,F:s.F/maxTF,J:s.J/maxJP,P:s.P/maxJP};
    const keys=["E","I","S","N","T","F","J","P"]; let sum=0; keys.forEach(k=>{const d=v[k]-ideal[k]; sum+=d*d;}); return Math.sqrt(sum);
  }

  const showResultPage = () => {
    const { resultType, scores, top4 } = calculateResult();
    const data = personalityData[resultType];
    
    dom.typeTitle.textContent = data.title;
    dom.typeSubtitle.textContent = `${resultType} - ${data.animals}`;
    dom.typeCard.src = `./assets/cards/${resultType}.jpg`;
    dom.typeCard.alt = data.title;
    dom.typeDesc.textContent = data.description;
    
    // 填充 EmailJS 隱藏欄位
    dom.emailMbtiType.value = resultType;
    dom.emailTypeTitle.value = `${data.title} (${data.animals})`;
    dom.emailTypeDesc.value = data.description;
    dom.emailTop4Types.value = top4.join('、');

    // 顯示分數
    dom.scoreList.innerHTML = '';
    const dimensions = [['E', '外向', scores.E], ['I', '內向', scores.I], ['N', '直覺', scores.N], ['S', '實感', scores.S], ['F', '情感', scores.F], ['T', '思考', scores.T], ['P', '感知', scores.P], ['J', '判斷', scores.J]];
    for (let i = 0; i < dimensions.length; i += 2) {
        const d1 = dimensions[i];
        const d2 = dimensions[i+1];
        const total = d1[2] + d2[2];
        const p1 = total === 0 ? 50 : (d1[2] / total) * 100;
        
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${d1[1]}</span>
            <div class="score-bar"><div class="score-bar-inner" style="width: ${p1}%"></div></div>
            <span>${d2[1]}</span>
        `;
        dom.scoreList.appendChild(li);
    }
    
    // 顯示 Top 4
    dom.top4List.innerHTML = '';
    top4.forEach(type => {
        const card = document.createElement('div');
        card.className = 'top4-card';
        card.innerHTML = `<img src="./assets/cards/${type}.jpg" alt="${type}"><div class="cap">${type}</div>`;
        dom.top4List.appendChild(card);
    });

    transitionTo(dom.result);
  };
  
  const sendEmail = (e) => {
      e.preventDefault();
      const submitBtn = e.target.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> 寄送中...';
      dom.emailMsg.textContent = '';

      emailjs.sendForm(emailServiceId, emailTemplateId, e.target)
          .then(() => {
              dom.emailMsg.textContent = '✅ 報告已成功寄出！請檢查您的信箱。';
              dom.emailMsg.style.color = 'green';
              e.target.reset();
          }, (error) => {
              dom.emailMsg.textContent = `❌ 寄送失敗: ${error.text}。請檢查您的 EmailJS 設定。`;
              dom.emailMsg.style.color = 'red';
          })
          .finally(() => {
              submitBtn.disabled = false;
              submitBtn.innerHTML = '寄送完整報告';
          });
  };

  // --- 事件監聽 ---
  dom.startBtn.addEventListener('click', () => {
    transitionTo(dom.quiz);
    showQuestion();
  });
  
  dom.nextBtn.addEventListener('click', () => {
    if (userAnswers[currentQuestionIndex] === null) return;
    if (currentQuestionIndex < questions.length - 1) {
      currentQuestionIndex++;
      showQuestion();
    } else {
      showResultPage();
    }
  });

  dom.prevBtn.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      showQuestion();
    }
  });

  dom.retakeBtn.addEventListener('click', () => {
    currentQuestionIndex = 0;
    userAnswers.fill(null);
    transitionTo(dom.hero);
  });

  dom.shareBtn.addEventListener('click', async () => {
      const { resultType } = calculateResult();
      const data = personalityData[resultType];
      const shareData = {
          title: `我的人格原型是 ${data.title}！`,
          text: `我在「MBTI × 動物原型人格測驗」中，測出的結果是 ${resultType} - ${data.title}，快來測測看你的吧！`,
          url: window.location.href
      };
      try {
          if (navigator.share) {
            await navigator.share(shareData);
          } else {
            await navigator.clipboard.writeText(shareData.url);
            alert('結果頁面連結已複製到剪貼簿！');
          }
      } catch (err) {
          console.error("分享失敗:", err);
          await navigator.clipboard.writeText(shareData.url);
          alert('分享功能無法使用，結果連結已複製到剪貼簿。');
      }
  });

  dom.emailForm.addEventListener('submit', sendEmail);

});



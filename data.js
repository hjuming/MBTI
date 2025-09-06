/* 16 型與動物圖卡、短說明（2–3 句） */
window.TYPE_META = {
  INTJ:{ role:"Architect", keyword:"Visionary", animals:["貓頭鷹","章魚"],
    desc:"具遠見與冷靜洞察的策士，如貓頭鷹般沉著觀察，亦能像章魚般靈活應變、佈局全局。" },
  INTP:{ role:"Logician", keyword:"Curious", animals:["烏鴉","變色龍"],
    desc:"好奇且擅長解謎，像聰明的烏鴉一樣蒐集線索；也能如變色龍般調整方法、保持彈性。" },
  ENTJ:{ role:"Commander", keyword:"Leader", animals:["獅子","老鷹"],
    desc:"天生領導，決斷俐落；具老鷹般的宏觀視野與精準行動力，推動團隊往前。" },
  ENTP:{ role:"Debater", keyword:"Inventive", animals:["狐狸","海豚"],
    desc:"機智靈巧、點子成串；像海豚一樣好奇又愛玩，擅用幽默破解難題。" },
  INFJ:{ role:"Advocate", keyword:"Insightful", animals:["狼","白馬"],
    desc:"洞見人心、堅定信念；如群狼守望彼此，亦像白馬般高尚且能啟發他人。" },
  INFP:{ role:"Mediator", keyword:"Idealistic", animals:["鹿","兔子"],
    desc:"真誠溫柔，對理想執著；鹿的優雅敏感與兔子的純真和平，在你心中同在。" },
  ENFJ:{ role:"Protagonist", keyword:"Charismatic", animals:["黃金獵犬","大象"],
    desc:"具感染力與同理心；像黃金獵犬熱情忠誠，又似大象般穩重守護群體。" },
  ENFP:{ role:"Campaigner", keyword:"Enthusiastic", animals:["水獺","蝴蝶"],
    desc:"活潑有創意；如水獺愛玩也愛嘗試，新鮮多彩像蝴蝶般自由飛舞。" },
  ISTJ:{ role:"Logistician", keyword:"Reliable", animals:["海狸","烏龜"],
    desc:"重視秩序與責任；像海狸勤奮築巢，也如烏龜穩健耐心、踏實完成任務。" },
  ISFJ:{ role:"Defender", keyword:"Nurturing", animals:["母熊","企鵝"],
    desc:"溫厚照顧，守護細節；母熊的保護本能與企鵝的忠誠奉獻，讓人安心倚靠。" },
  ESTJ:{ role:"Executive", keyword:"Organizer", animals:["牧羊犬","蜜蜂"],
    desc:"管理與規範兼具；牧羊犬帶隊秩序分明，蜜蜂般勤奮協作、講求效率。" },
  ESFJ:{ role:"Consul", keyword:"Caring", animals:["袋鼠","天鵝"],
    desc:"關懷他人、維繫和諧；如袋鼠溫暖照料，也似天鵝優雅體貼、講究禮節。" },
  ISTP:{ role:"Virtuoso", keyword:"Practical", animals:["猴子","野狼"],
    desc:"動手能力強、臨機應變；像猴子靈巧用工具，亦如野狼獨立果敢、追求效率。" },
  ISFP:{ role:"Adventurer", keyword:"Creative", animals:["孔雀","貓"],
    desc:"審美敏銳、自由創作；孔雀展現藝術氣質，貓的優雅與自我步調讓靈感綻放。" },
  ESTP:{ role:"Entrepreneur", keyword:"Bold", animals:["老虎","獵豹"],
    desc:"大膽果決、行動迅捷；兼具老虎的氣魄與獵豹的速度，擅長現場突破。" },
  ESFP:{ role:"Entertainer", keyword:"Joyful", animals:["鸚鵡","海獅"],
    desc:"熱情外向、帶動氣氛；像鮮豔的鸚鵡善於社交，也如海獅活潑有表演力。" },
};

/* 16 型 → 動物卡圖檔路徑（確保檔名大寫 + .jpg） */
window.cardSrc = (type) => `./assets/cards/${type.toUpperCase()}.jpg`;

/* 題庫 Excel 檔路徑 */
window.QUIZ_XLSX = "./assets/MBTI_questionnaire_full.xlsx";

/* Excel 欄位別名（容錯對應） */
window.headerAliases = {
  id:["id","題號","編號"],
  question:["question","題目","題幹"],
  opt1:["opt1","A","選項1"],
  opt2:["opt2","B","選項2"],
  opt3:["opt3","C","選項3"],
  opt4:["opt4","D","選項4"],
  tags1:["tags1","tag1","標籤1"],
  tags2:["tags2","tag2","標籤2"],
  tags3:["tags3","tag3","標籤3"],
  tags4:["tags4","tag4","標籤4"],
};

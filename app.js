const els = {
  startSessionBtn: document.getElementById("startSessionBtn"),
  liveStatus: document.getElementById("liveStatus"),
  timer: document.getElementById("timer"),
  likeCount: document.getElementById("likeCount"),
  giftCount: document.getElementById("giftCount"),
  likeGoal: document.getElementById("likeGoal"),
  giftGoal: document.getElementById("giftGoal"),
  likeGoalText: document.getElementById("likeGoalText"),
  giftGoalText: document.getElementById("giftGoalText"),
  resetGoalsBtn: document.getElementById("resetGoalsBtn"),
  addTopicBtn: document.getElementById("addTopicBtn"),
  topicDialog: document.getElementById("topicDialog"),
  topicInput: document.getElementById("topicInput"),
  saveTopicBtn: document.getElementById("saveTopicBtn"),
  topicList: document.getElementById("topicList"),
  promptBox: document.getElementById("promptBox"),
  shufflePromptBtn: document.getElementById("shufflePromptBtn"),
  notes: document.getElementById("notes"),
  clearNotesBtn: document.getElementById("clearNotesBtn"),
  commentForm: document.getElementById("commentForm"),
  commentName: document.getElementById("commentName"),
  commentText: document.getElementById("commentText"),
  commentQueue: document.getElementById("commentQueue")
};

const defaultTopics = [
  "Hook + welcome new viewers",
  "Main product / topic demo",
  "Answer viewer questions",
  "Call to action + recap"
];

const prompts = [
  "Ask viewers where they are watching from.",
  "Ask a quick A-or-B question to get comments moving.",
  "Welcome new viewers and explain the live in one sentence.",
  "Ask viewers to drop an emoji if they want a closer demo.",
  "Remind viewers to follow before the next segment.",
  "Call out a useful viewer comment and build on it.",
  "Recap the main benefit in under 15 seconds.",
  "Thank recent gifters and returning viewers by name."
];

const state = {
  running: false,
  startedAt: null,
  elapsedBeforeStart: 0,
  timerId: null,
  topics: JSON.parse(localStorage.getItem("livepilot_topics") || "null") || defaultTopics.map(text => ({ text, done:false })),
  notes: localStorage.getItem("livepilot_notes") || "",
  comments: JSON.parse(localStorage.getItem("livepilot_comments") || "[]")
};

function formatTime(totalMs){
  const s = Math.floor(totalMs / 1000);
  const h = String(Math.floor(s/3600)).padStart(2,"0");
  const m = String(Math.floor((s%3600)/60)).padStart(2,"0");
  const sec = String(s%60).padStart(2,"0");
  return `${h}:${m}:${sec}`;
}

function currentElapsed(){
  return state.elapsedBeforeStart + (state.running ? Date.now() - state.startedAt : 0);
}

function updateTimer(){
  els.timer.textContent = formatTime(currentElapsed());
}

function toggleSession(){
  if(!state.running){
    state.running = true;
    state.startedAt = Date.now();
    state.timerId = setInterval(updateTimer, 500);
    els.startSessionBtn.textContent = "Pause Session";
    els.liveStatus.textContent = "Session live";
    els.liveStatus.classList.add("live");
  } else {
    state.elapsedBeforeStart = currentElapsed();
    state.running = false;
    clearInterval(state.timerId);
    els.timerId = null;
    els.startSessionBtn.textContent = "Resume Session";
    els.liveStatus.textContent = "Paused";
    els.liveStatus.classList.remove("live");
    updateTimer();
  }
}

function numberFor(id){
  return Number(document.getElementById(id).textContent.replace(/,/g,"")) || 0;
}

function setNumber(id,value){
  document.getElementById(id).textContent = value.toLocaleString();
  syncGoals();
}

function syncGoals(){
  const likes = numberFor("likeCount");
  const gifts = numberFor("giftCount");
  els.likeGoal.value = Math.min(likes,1000);
  els.giftGoal.value = Math.min(gifts,20);
  els.likeGoalText.textContent = `${likes.toLocaleString()} / 1,000`;
  els.giftGoalText.textContent = `${gifts.toLocaleString()} / 20`;
}

function renderTopics(){
  els.topicList.innerHTML = "";
  if(!state.topics.length){
    els.topicList.innerHTML = '<div class="empty">No talking points yet.</div>';
    return;
  }
  state.topics.forEach((topic,index)=>{
    const row = document.createElement("div");
    row.className = "topic" + (topic.done ? " done" : "");
    row.innerHTML = `
      <input type="checkbox" ${topic.done ? "checked" : ""} aria-label="Mark topic complete">
      <div class="topic-text"></div>
      <button class="remove" aria-label="Remove topic">✕</button>`;
    row.querySelector(".topic-text").textContent = topic.text;
    row.querySelector("input").addEventListener("change",e=>{
      state.topics[index].done = e.target.checked;
      persistTopics(); renderTopics();
    });
    row.querySelector(".remove").addEventListener("click",()=>{
      state.topics.splice(index,1); persistTopics(); renderTopics();
    });
    els.topicList.appendChild(row);
  });
}

function persistTopics(){
  localStorage.setItem("livepilot_topics",JSON.stringify(state.topics));
}

function renderComments(){
  els.commentQueue.innerHTML = "";
  if(!state.comments.length){
    els.commentQueue.innerHTML = '<div class="empty">Add comments or questions you want to answer on stream.</div>';
    return;
  }
  state.comments.forEach((item,index)=>{
    const row = document.createElement("div");
    row.className = "comment";
    row.innerHTML = `
      <div class="comment-body">
        <div class="comment-name"></div>
        <div class="comment-text"></div>
      </div>
      <button class="remove" aria-label="Remove comment">✓</button>`;
    row.querySelector(".comment-name").textContent = item.name || "Viewer";
    row.querySelector(".comment-text").textContent = item.text;
    row.querySelector(".remove").addEventListener("click",()=>{
      state.comments.splice(index,1);
      localStorage.setItem("livepilot_comments",JSON.stringify(state.comments));
      renderComments();
    });
    els.commentQueue.appendChild(row);
  });
}

els.startSessionBtn.addEventListener("click",toggleSession);

document.querySelectorAll("[data-add]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const id = btn.dataset.add;
    const step = Number(btn.dataset.step || 1);
    setNumber(id, numberFor(id) + step);
  });
});

els.resetGoalsBtn.addEventListener("click",()=>{
  setNumber("likeCount",0);
  setNumber("giftCount",0);
});

els.addTopicBtn.addEventListener("click",()=>{
  els.topicInput.value = "";
  els.topicDialog.showModal();
  setTimeout(()=>els.topicInput.focus(),0);
});

els.saveTopicBtn.addEventListener("click",e=>{
  if(!els.topicInput.value.trim()){
    e.preventDefault();
    return;
  }
  state.topics.push({text:els.topicInput.value.trim(),done:false});
  persistTopics();
  renderTopics();
});

document.querySelectorAll("[data-prompt]").forEach(btn=>{
  btn.addEventListener("click",()=> els.promptBox.textContent = btn.dataset.prompt);
});

els.shufflePromptBtn.addEventListener("click",()=>{
  const current = els.promptBox.textContent;
  let next = current;
  while(prompts.length > 1 && next === current){
    next = prompts[Math.floor(Math.random()*prompts.length)];
  }
  els.promptBox.textContent = next;
});

els.notes.value = state.notes;
els.notes.addEventListener("input",()=>{
  localStorage.setItem("livepilot_notes",els.notes.value);
});
els.clearNotesBtn.addEventListener("click",()=>{
  els.notes.value = "";
  localStorage.removeItem("livepilot_notes");
});

els.commentForm.addEventListener("submit",e=>{
  e.preventDefault();
  const text = els.commentText.value.trim();
  if(!text) return;
  state.comments.unshift({
    name: els.commentName.value.trim(),
    text
  });
  localStorage.setItem("livepilot_comments",JSON.stringify(state.comments));
  els.commentName.value = "";
  els.commentText.value = "";
  renderComments();
  setNumber("commentCount", numberFor("commentCount") + 1);
});

renderTopics();
renderComments();
syncGoals();
updateTimer();
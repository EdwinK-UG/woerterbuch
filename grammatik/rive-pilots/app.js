// Lesson text and recordings arrive from the chapter page after its access check.
const payload = await new Promise((resolve) => {
  window.addEventListener("message", function receive(event) {
    if (event.source !== window.parent || event.origin !== location.origin || event.data?.type !== "rive-pilot-data") return;
    window.removeEventListener("message", receive);
    resolve(event.data.payload);
  });
  window.parent.postMessage({ type: "rive-pilot-ready" }, location.origin);
});
const { cast, lessons, recordingPlan } = payload;
const embeddedRecordings = payload.recordings;
const closePilot = () => window.parent.postMessage({ type: "rive-pilot-close" }, location.origin);
document.getElementById("close-pilot").addEventListener("click", closePilot);
window.addEventListener("keydown", (event) => { if (event.key === "Escape") closePilot(); });
window.addEventListener("pagehide", () => {
  pause();
  for (const actor of actors.values()) { actor.resize?.disconnect(); actor.runtime?.cleanup(); }
});

const $ = (id) => document.getElementById(id);
const create = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
};
const button = (text, click, className) => {
  const node = create("button", text, className);
  node.type = "button";
  node.addEventListener("click", click);
  return node;
};
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const stage = $("stage");
const actors = new Map();
const recordings = new Map(typeof embeddedRecordings === "undefined" ? [] : embeddedRecordings);
const soundtrack = new Audio();
let activeAudio = null;
let key;
let lesson;
let timeline;
let currentSegment;
let time = 0;
let playing = false;
let practice = false;
let clock = 0;
let animationFrame = 0;
let question = 0;
let attempt = 0;
let independentCorrect = 0;

function updateActor(actor) {
  const vm = actor.vm;
  if (!vm) return;
  const { active, facingLeft, talking, action } = actor;
  const face = vm.enum("face");
  const facing = vm.boolean("facingLeft");
  const speech = vm.boolean("talking");
  if (facing) facing.value = facingLeft;
  if (speech) speech.value = !reducedMotion.matches && talking;
  if (face) face.value = active ? "smile" : "happy";
  if (action && !reducedMotion.matches) vm.trigger(action)?.trigger();
  actor.action = null;
}

function addActors() {
  if (window.rive?.RuntimeLoader) {
    window.rive.RuntimeLoader.setWasmUrl("runtime/rive.wasm");
    window.rive.RuntimeLoader.setWasmFallbackUrl?.("runtime/rive_fallback.wasm");
  }
  for (const [name, card] of Object.entries(cast)) {
    const figure = create("figure", null, "actor");
    figure.dataset.name = name;
    figure.dataset.ready = "false";
    figure.hidden = true;
    const canvas = create("canvas");
    const standIn = create("div", card.initials, "standin");
    const label = create("figcaption", name);
    figure.append(canvas, standIn, label);
    $("actors").append(figure);
    actors.set(name, { card, figure, canvas, vm: null, runtime: null, resize: null });
  }
}

function loadActor(actor) {
  if (actor.runtime || !window.rive?.Rive) return;
  const { card, canvas, figure } = actor;
  const src = "assets/" + card.id.toLowerCase() + ".riv";
  actor.runtime = new window.rive.Rive({
    src,
    canvas,
    artboard: card.id + " 3q",
    stateMachines: "Character",
    autoplay: true,
    autoBind: true,
    layout: new window.rive.Layout({ fit: window.rive.Fit.Contain }),
    onLoad() {
      actor.vm = actor.runtime.viewModelInstance;
      if (!actor.vm) return;
      figure.dataset.ready = "true";
      actor.resize = new ResizeObserver(() => {
        if (!figure.hidden) actor.runtime.resizeDrawingSurfaceToCanvas();
      });
      actor.resize.observe(canvas);
      actor.runtime.resizeDrawingSurfaceToCanvas();
      updateActor(actor);
    },
    onLoadError() {
      figure.dataset.ready = "false";
    },
  });
}

function showStage(castInScene, prop, active, cue, { talking = false, action = null } = {}) {
  stage.dataset.prop = prop;
  stage.dataset.reaction = action || "";
  $("stage-words").textContent = cue || "";
  for (const [name, actor] of actors) {
    const position = castInScene.indexOf(name);
    actor.figure.hidden = position < 0;
    actor.figure.style.order = String(position);
    actor.active = name === active;
    actor.figure.dataset.active = String(actor.active);
    actor.facingLeft = position === castInScene.length - 1;
    actor.talking = actor.active && talking;
    actor.action = actor.active ? action : null;
    if (position < 0) {
      actor.runtime?.pause();
      continue;
    }
    loadActor(actor);
    actor.runtime?.play();
    updateActor(actor);
  }
}

function setStageSpeech(enabled) {
  for (const actor of actors.values()) {
    const speech = actor.vm?.boolean("talking");
    if (speech) speech.value = enabled && !reducedMotion.matches && actor.talking;
  }
}

function buildTimeline() {
  let start = 0;
  const segments = lesson.scenes.flatMap((shot, sceneIndex) =>
    shot.lines.map((cue) => {
      const duration = recordings.has(cue.id) ? recordings.get(cue.id).duration + 0.65 : cue.seconds;
      const segment = { shot, sceneIndex, cue, start, end: start + duration };
      start += duration;
      return segment;
    })
  );
  timeline = { segments, duration: start };
  $("seek").max = start;
}

const formatTime = (seconds) => {
  const whole = Math.floor(seconds);
  return Math.floor(whole / 60) + ":" + String(whole % 60).padStart(2, "0");
};

function stopAudio() {
  soundtrack.pause();
  activeAudio = null;
}

function playCue(segment, offset) {
  const recording = recordings.get(segment.cue.id);
  if (!recording || offset >= recording.duration) return;
  activeAudio = recording;
  soundtrack.src = recording.url;
  soundtrack.currentTime = Math.max(0, offset);
  soundtrack.play().catch(() => {
    if (activeAudio === recording) activeAudio = null;
  });
}

function showSegment(segment, force = false) {
  if (segment === currentSegment && !force) return;
  currentSegment = segment;
  stopAudio();
  const { shot, cue } = segment;
  $("speaker").textContent = cue.speaker;
  $("caption").textContent = cue.text;
  const speaker = shot.cast.includes(cue.speaker) ? cue.speaker : null;
  showStage(shot.cast, cue.prop || shot.prop, cue.active || speaker, cue.cue ?? shot.cue, {
    talking: playing && Boolean(speaker),
    action: cue.action,
  });
  Array.from($("scenes").children).forEach((li, i) => {
    if (i === segment.sceneIndex) li.firstChild.setAttribute("aria-current", "step");
    else li.firstChild.removeAttribute("aria-current");
  });
  if (playing) playCue(segment, time - segment.start);
}

function showTime(force = false) {
  const segment = timeline.segments.find((segment) => time < segment.end) || timeline.segments.at(-1);
  showSegment(segment, force);
  $("seek").value = time;
  $("time").textContent = formatTime(time) + " / " + formatTime(timeline.duration);
  $("previous").disabled = segment.sceneIndex === 0;
  $("next").disabled = segment.sceneIndex === lesson.scenes.length - 1;
}

function seekTo(seconds) {
  time = Math.min(timeline.duration, Math.max(0, seconds));
  clock = performance.now();
  showTime(true);
}

function tick(now) {
  if (!playing) return;
  const elapsed = (now - clock) / 1000;
  clock = now;
  if (activeAudio && !soundtrack.ended && !soundtrack.paused) {
    time = currentSegment.start + soundtrack.currentTime;
  } else {
    time = Math.min(timeline.duration, time + elapsed);
  }
  showTime();
  if (time >= timeline.duration) pause();
  else animationFrame = requestAnimationFrame(tick);
}

function pause() {
  playing = false;
  cancelAnimationFrame(animationFrame);
  stopAudio();
  setStageSpeech(false);
  $("play").textContent = time >= (timeline?.duration ?? Infinity) ? "Erneut abspielen" : "Abspielen";
}

function play() {
  if (playing) {
    pause();
    return;
  }
  if (time >= timeline.duration) time = 0;
  playing = true;
  clock = performance.now();
  $("play").textContent = "Pause";
  showTime(true);
  animationFrame = requestAnimationFrame(tick);
}

function goToScene(index) {
  if (practice) leavePractice();
  const start = timeline.segments.find((segment) => segment.sceneIndex === index)?.start;
  if (start !== undefined) seekTo(start);
}

function startPractice() {
  pause();
  practice = true;
  question = 0;
  attempt = 0;
  independentCorrect = 0;
  $("video-controls").hidden = true;
  $("exercise").hidden = false;
  renderQuestion();
  $("exercise-content").focus();
}

function leavePractice() {
  practice = false;
  $("exercise").hidden = true;
  $("video-controls").hidden = false;
  showTime(true);
}

function finishPractice() {
  $("exercise-content").replaceChildren();
  $("feedback").textContent = "";
  $("speaker").textContent = "Fertig";
  const total = lesson.practice.filter((item) => item.independent).length;
  $("caption").textContent = "Ohne Tipp beim ersten Versuch: " + independentCorrect + " von " + total + ".";
  $("exercise-content").append(button("Noch einmal üben", startPractice));
  $("exercise-content").focus();
}

function renderQuestion() {
  const item = lesson.practice[question];
  const content = $("exercise-content");
  const feedback = $("feedback");
  feedback.textContent = "";
  $("speaker").textContent = item.active;
  $("caption").textContent = item.context;
  showStage(item.cast, item.prop, item.active, "");
  const label = create("p", (item.independent ? "Ohne Hilfe · " : "") + (question + 1) + " von " + lesson.practice.length, "question-number");
  const prompt = create("p", item.text, "question");
  prompt.id = "question";
  const form = create("form");
  const options = create("div", null, "options");
  let selected = null;
  let answerInput;
  const check = create("button", "Prüfen");
  check.type = "submit";
  check.disabled = true;
  if (item.input) {
    answerInput = create("input");
    answerInput.id = "answer";
    answerInput.type = "text";
    answerInput.autocomplete = "off";
    answerInput.autocapitalize = "none";
    answerInput.spellcheck = false;
    answerInput.setAttribute("aria-labelledby", "question");
    answerInput.addEventListener("input", () => { check.disabled = !answerInput.value.trim(); });
    options.append(answerInput);
  } else {
    const choices = create("div", null, "choices");
    choices.setAttribute("role", "group");
    choices.setAttribute("aria-labelledby", "question");
    for (const [index, option] of item.options.entries()) {
      const pick = button(option, () => {
        selected = index;
        for (const choice of choices.children) choice.setAttribute("aria-pressed", String(choice === pick));
        check.disabled = false;
      }, "quiet");
      pick.setAttribute("aria-pressed", "false");
      choices.append(pick);
    }
    options.append(choices);
  }
  options.append(check);
  form.append(options);
  content.tabIndex = -1;
  content.replaceChildren(label, prompt, form);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const normalize = (value) => value.normalize("NFC").trim().replace(/[.!?]$/, "").trim().toLocaleLowerCase("de");
    if (!answerInput && selected === null || answerInput && !answerInput.value.trim()) return;
    const correct = answerInput
      ? item.accepted.some((valid) => normalize(valid) === normalize(answerInput.value))
      : selected === item.answer;
    if (!correct) {
      attempt += 1;
      feedback.textContent = item.hint;
      showStage(item.cast, item.prop, item.active, "", { action: "think" });
      return;
    }
    if (item.independent && attempt === 0) independentCorrect += 1;
    feedback.textContent = item.why;
    showStage(item.cast, item.prop, item.active, item.cue, { action: item.action });
    const next = button(question === lesson.practice.length - 1 ? "Auswertung" : "Weiter", () => {
      question += 1;
      attempt = 0;
      if (question === lesson.practice.length) finishPractice();
      else {
        renderQuestion();
        content.focus();
      }
    });
    form.replaceWith(next);
    next.focus();
  });
}

function chooseLesson() {
  pause();
  key = location.hash === "#b1" ? "b1" : "a1";
  lesson = lessons[key];
  $("title").textContent = lesson.title;
  $("topic").textContent = lesson.level + " · " + lesson.topic;
  $("intro").textContent = lesson.intro;
  $("place").textContent = lesson.place;
  $("reference").textContent = lesson.reference;
  $("stage").dataset.room = key === "b1" ? "inn" : "shop";
    $("scenes").replaceChildren(...lesson.scenes.map((shot, index) => {
    const li = create("li");
    li.append(button(shot.title, () => goToScene(index), "quiet"));
    return li;
  }));
  document.title = lesson.title + " · Deutschklinik";
  buildTimeline();
  time = 0;
  leavePractice();
  updateAudioStatus();
}

function updateAudioStatus() {
  const total = recordingPlan.filter((cue) => cue.lesson === key).length;
  const loaded = recordingPlan.filter((cue) => cue.lesson === key && recordings.has(cue.id)).length;
  $("audio-status").textContent = loaded
    ? loaded + " von " + total + " Sprachaufnahmen geladen. Abschnitte ohne Aufnahme zeigen Untertitel."
    : "Vorschau mit Untertiteln. Sprachaufnahmen können pro Textabschnitt geladen werden.";
}

addActors();
$("play").addEventListener("click", play);
$("previous").addEventListener("click", () => goToScene(currentSegment.sceneIndex - 1));
$("next").addEventListener("click", () => goToScene(currentSegment.sceneIndex + 1));
$("seek").addEventListener("input", () => seekTo(Number($("seek").value)));
$("practice").addEventListener("click", startPractice);
$("back").addEventListener("click", () => {
  leavePractice();
  $("practice").focus();
});
reducedMotion.addEventListener("change", () => {
  if (playing) setStageSpeech(true);
});
window.addEventListener("hashchange", chooseLesson);
chooseLesson();

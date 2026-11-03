const $ = s => document.querySelector(s);
const DEFAULT_MODEL = { anthropic: 'claude-haiku-5-5', deepseek: 'deepseek-chat' };
const cfg = { provider: 'anthropic', key: '', model: '' };
try { Object.assign(cfg, JSON.parse(localStorage.getItem('trivia-cfg') || '{}')); } catch (e) {}
let qs = [], i = 0, score = 0;

const msg = t => { $('#msg').textContent = t; };
const show = id => ['start', 'quiz', 'result'].forEach(s => { $('#' + s).hidden = s !== id; });

function buildPrompt(topic) {
  return `Write 10 multiple-choice trivia questions about the topic: ${JSON.stringify(topic)}. ` +
    `Mix easy and hard. Each question has exactly 4 plausible choices and exactly one correct answer. ` +
    `Only use facts you are certain are true. Vary which position holds the correct answer. ` +
    `Reply with ONLY a JSON array (no markdown, no commentary) of objects shaped like ` +
    `{"question":"...","choices":["a","b","c","d"],"answer":0,"explanation":"one short sentence"} ` +
    `where "answer" is the 0-based index of the correct choice.`;
}

async function ask(prompt) {
  const model = cfg.model || DEFAULT_MODEL[cfg.provider];
  let r, d;
  if (cfg.provider === 'anthropic') {
    r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json', 'x-api-key': cfg.key,
        'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({ model, max_tokens: 4000, messages: [{ role: 'user', content: prompt }] })
    });
    d = await r.json();
    if (!r.ok) throw new Error(d.error?.message || r.status);
    return d.content.map(b => b.text || '').join('');
  }
  r = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + cfg.key },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] })
  });
  d = await r.json();
  if (!r.ok) throw new Error(d.error?.message || r.status);
  return d.choices[0].message.content;
}

function parse(text) {
  const a = text.indexOf('['), b = text.lastIndexOf(']');
  const arr = JSON.parse(text.slice(a, b + 1));
  return arr.filter(q => q && q.question && Array.isArray(q.choices) && q.choices.length === 4 &&
    Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4).slice(0, 10);
}

$('#go').onclick = async () => {
  const topic = $('#topic').value.trim();
  if (!topic) return msg('Type a topic first.');
  if (!cfg.key) { msg('Add your API key in Settings first.'); return $('#settings').showModal(); }
  $('#go').disabled = true; msg('Generating questions…');
  try {
    qs = parse(await ask(buildPrompt(topic)));
    if (!qs.length) throw new Error('No valid questions came back. Try again.');
    i = 0; score = 0; render(); show('quiz'); msg('');
  } catch (e) {
    msg('Error: ' + e.message + (e instanceof TypeError ? ' (the request was blocked or you are offline; see README)' : ''));
  }
  $('#go').disabled = false;
};

function render() {
  const q = qs[i];
  $('#prog').textContent = `Question ${i + 1} of ${qs.length}  |  Score ${score}`;
  $('#q').textContent = q.question;
  $('#exp').textContent = ''; $('#next').hidden = true;
  const box = $('#choices'); box.innerHTML = '';
  q.choices.forEach((c, n) => {
    const b = document.createElement('button');
    b.className = 'choice'; b.textContent = c; b.onclick = () => pick(n); box.append(b);
  });
}

function pick(n) {
  const q = qs[i], bs = [...document.querySelectorAll('.choice')];
  bs.forEach((b, k) => { b.disabled = true; if (k === q.answer) b.classList.add('ok'); });
  if (n === q.answer) score++; else bs[n].classList.add('bad');
  $('#prog').textContent = `Question ${i + 1} of ${qs.length}  |  Score ${score}`;
  $('#exp').textContent = (n === q.answer ? 'Correct. ' : 'Not quite. ') + (q.explanation || '');
  $('#next').textContent = i + 1 < qs.length ? 'Next question' : 'See my score';
  $('#next').hidden = false;
}

$('#next').onclick = () => {
  if (++i < qs.length) render();
  else { $('#score').textContent = `${score} / ${qs.length}`; show('result'); }
};
$('#again').onclick = () => { $('#topic').value = ''; msg(''); show('start'); $('#topic').focus(); };
$('#topic').addEventListener('keydown', e => { if (e.key === 'Enter') $('#go').click(); });

$('#gear').onclick = () => {
  $('#prov').value = cfg.provider; $('#key').value = cfg.key; $('#model').value = cfg.model;
  $('#settings').showModal();
};
$('#save').onclick = () => {
  cfg.provider = $('#prov').value; cfg.key = $('#key').value.trim(); cfg.model = $('#model').value.trim();
  try { localStorage.setItem('trivia-cfg', JSON.stringify(cfg)); } catch (e) {}
};

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');

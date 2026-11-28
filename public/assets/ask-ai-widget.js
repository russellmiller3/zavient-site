/* Standalone Ask AI Widget for any static website with /llms.txt + per-page index.md.
   Configure via window.AskAIWidgetConfig = { siteName, siteOrigin, apiEndpoint, ctaText, ctaHref, starterQuestions }.
   Features:
   - Sticky bottom-right Ask AI button with sparkles icon (plus any [data-ask-ai] triggers)
   - "Guided Concierge" drawer: teal header, scannable answers, plain source links, paper-airplane send,
     and a calculator/CTA strip pinned below the composer
   - Full-site RAG over /llms.txt + top 2 matching /slug/index.md pages
   - Persistent multi-turn chat stored in browser IndexedDB (with localStorage fallback)
   - External ChatGPT, Claude, and Perplexity pre-filled tab links (hidden once a chat starts) */
(function (root) {
  'use strict';

  const SPARKLES = '<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true"><path d="M12 2l2.1 5.9L20 10l-5.9 2.1L12 18l-2.1-5.9L4 10l5.9-2.1L12 2zm7 12l1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14zM5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15z"/></svg>';
  const PLANE = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2L11 13"></path><path d="M22 2L15 22L11 13L2 9L22 2Z"></path></svg>';

  function getConfig() {
    const cfg = root.AskAIWidgetConfig || {};
    const origin = (cfg.siteOrigin || (typeof location !== 'undefined' ? location.origin : 'https://example.com')).replace(/\/+$/, '');
    return {
      siteName: cfg.siteName || 'this site',
      siteOrigin: origin,
      apiEndpoint: cfg.apiEndpoint || '/api/ask',
      leadEndpoint: cfg.leadEndpoint || '/api/ask-lead',
      contentMode: cfg.contentMode === 'index' ? 'index' : 'markdown',
      llmsPath: cfg.llmsPath || '/llms.txt',
      collectContext: typeof cfg.collectContext === 'function' ? cfg.collectContext : null,
      storageName: cfg.storageName || 'ask_ai_widget_db',
      fallbackKey: cfg.fallbackKey || 'ask_ai_widget_state_v1',
      title: cfg.title || 'Site Guide',
      ctaLabel: cfg.ctaLabel || 'Want your range?',
      ctaText: cfg.ctaText || 'Get started →',
      ctaHref: cfg.ctaHref || '/contact/',
      starterQuestions: Array.isArray(cfg.starterQuestions) && cfg.starterQuestions.length
        ? cfg.starterQuestions
        : ['What does this site offer?', 'How does pricing work?', 'How do I get started?']
    };
  }

  const STORE_NAME = 'chat_state';
  const STATE_KEY = 'active';

  function openIdb() {
    if (typeof indexedDB === 'undefined') return Promise.resolve(null);
    return new Promise((resolve) => {
      try {
        const req = indexedDB.open(getConfig().storageName, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  async function saveChatState(state) {
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(getConfig().fallbackKey, JSON.stringify(state)); } catch {}
    const db = await openIdb();
    if (!db) return;
    await new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(state, STATE_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  async function loadChatState() {
    const db = await openIdb();
    if (db) {
      const fromIdb = await new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const req = tx.objectStore(STORE_NAME).get(STATE_KEY);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });
      if (fromIdb) return fromIdb;
    }
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(getConfig().fallbackKey);
        return raw ? JSON.parse(raw) : null;
      }
    } catch {}
    return null;
  }

  function parseLlmsTxt(text) {
    const entries = [];
    let section = 'General';
    for (const raw of String(text || '').split('\n')) {
      const line = raw.trim();
      if (line.startsWith('## ')) { section = line.slice(3).trim(); continue; }
      const m = line.match(/^- \[([^\]]+)\]\(([^)]+)\)(?::\s*(.*))?$/);
      if (m) entries.push({ section, title: m[1].trim(), url: m[2].trim(), description: (m[3] || '').trim() });
    }
    return entries;
  }

  // Turns a model answer into safe HTML: **bold**, "- " bullets, short paragraphs. No raw HTML is ever passed through.
  function formatAnswerHtml(text) {
    const esc = String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const bolded = esc.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    const lines = bolded.split('\n').map((l) => l.trim()).filter(Boolean);
    const out = [];
    let inList = false;
    for (const l of lines) {
      if (/^[-*•]\s+/.test(l)) {
        if (!inList) { out.push('<ul>'); inList = true; }
        out.push(`<li>${l.replace(/^[-*•]\s+/, '')}</li>`);
      } else {
        if (inList) { out.push('</ul>'); inList = false; }
        out.push(`<p>${l}</p>`);
      }
    }
    if (inList) out.push('</ul>');
    return out.join('');
  }

  function pageMarkdownUrl(origin, pathname) {
    const clean = String(pathname || '/').replace(/\/index\.html$/i, '').replace(/\/+$/, '');
    return clean === '' ? `${origin}/index.md` : `${origin}${clean}/index.md`;
  }

  function buildProviderUrls(cfg, question, pageTitle, pathname, extraUrls) {
    const q = String(question || '').trim() || `Summarize this page on ${cfg.siteName}.`;
    const mdUrl = cfg.contentMode === 'index' ? '' : pageMarkdownUrl(cfg.siteOrigin, pathname);
    const pageUrl = `${cfg.siteOrigin}${pathname || '/'}`;
    const extras = (extraUrls || []).slice(0, 2).map((u) => `- ${u}`).join('\n');
    const prompt = [
      `Read ${cfg.siteName}'s page "${pageTitle || cfg.siteName}" (${mdUrl ? mdUrl + ', web page: ' : ''}${pageUrl}) and the site index at ${cfg.siteOrigin}${cfg.llmsPath}.`,
      extras ? `Also check these related guides:\n${extras}` : '',
      `Answer this question using sourced facts and links: ${q}`
    ].filter(Boolean).join('\n\n');
    const enc = encodeURIComponent(prompt);
    return {
      prompt,
      chatgpt: `https://chatgpt.com/?q=${enc}`,
      claude: `https://claude.ai/new?q=${enc}`,
      perplexity: `https://www.perplexity.ai/search?q=${enc}`
    };
  }

  const STOP_WORDS = new Set(['what', 'how', 'much', 'does', 'this', 'that', 'with', 'from', 'have', 'about', 'site', 'page', 'their', 'your', 'could', 'would', 'most', 'which', 'when', 'where']);
  function extractKeywords(text) {
    return String(text || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/)
      .filter((w) => w.length >= 3 && !STOP_WORDS.has(w)).slice(0, 6);
  }

  let llmsCache = null;
  async function gatherContext(cfg, question) {
    const parts = [];
    const sources = [];

    let pageMd = '';
    if (cfg.contentMode === 'markdown') try {
      const clean = (location.pathname || '/').replace(/\/index\.html$/i, '').replace(/\/+$/, '');
      const res = await fetch(clean === '' ? '/index.md' : `${clean}/index.md`);
      if (res.ok) pageMd = await res.text();
    } catch {}
    if (!pageMd && typeof document !== 'undefined') {
      const content = document.querySelector('main, article') || document.body;
      const description = document.querySelector('meta[name="description"]')?.content;
      pageMd = [description, content.innerText].filter(Boolean).join('\n');
    }
    if (pageMd) parts.push(`CURRENT PAGE (${typeof document !== 'undefined' ? document.title : cfg.siteName}):\n${pageMd.slice(0, 2800)}`);

    const kws = extractKeywords(question);
    if (kws.length) {
      try {
        if (!llmsCache) {
          const res = await fetch(cfg.llmsPath);
          if (res.ok) llmsCache = parseLlmsTxt(await res.text());
        }
        if (llmsCache && llmsCache.length) {
          const scored = llmsCache.map((g) => {
            const hay = `${g.section} ${g.title} ${g.description} ${g.url}`.toLowerCase();
            const score = kws.reduce((n, kw) => n + (hay.includes(kw) ? 1 : 0), 0);
            return { ...g, score };
          }).filter((g) => g.score > 0).sort((a, b) => b.score - a.score).slice(0, 2);

          const fetched = await Promise.all(scored.map(async (g) => {
            let url;
            try { url = new URL(g.url, cfg.siteOrigin); } catch { return ''; }
            if (url.origin !== new URL(cfg.siteOrigin).origin || !/^https?:$/.test(url.protocol)) return '';
            if (cfg.contentMode === 'index') {
              sources.push({ title: g.title, path: url.pathname });
              return 'GUIDE "' + g.title + '" (' + url.pathname + '): ' + g.description;
            }
            const rel = url.pathname.replace(/\/+$/, '');
            const mdPath = rel === '' ? '/index.md' : `${rel}/index.md`;
            try {
              const r = await fetch(mdPath);
              if (!r.ok) throw new Error('not found');
              const txt = await r.text();
              sources.push({ title: g.title, path: rel === '' ? '/' : `${rel}/` });
              return `GUIDE "${g.title}" (${rel || '/'}):\n${txt.slice(0, 2200)}`;
            } catch {
              return `GUIDE "${g.title}": ${g.description}`;
            }
          }));
          if (fetched.length) parts.push(fetched.join('\n\n'));
        }
      } catch {}
    }

    return {
      contextText: parts.join('\n\n').slice(0, 7500),
      sources: sources.filter((s, i, arr) => arr.findIndex((x) => x.path === s.path) === i).slice(0, 3)
    };
  }

  function renderDiagram(diagram) {
    if (!Array.isArray(diagram?.steps) || diagram.steps.length < 2) return null;
    const steps = diagram.steps.slice(0, 6);
    const element = (tag, attributes, text) => {
      const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
      Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, value));
      if (text) node.textContent = text;
      return node;
    };
    const svg = element('svg', { viewBox: '0 0 320 ' + (steps.length * 56 - 10), role: 'img',
      'aria-label': [diagram.title, ...steps].join('. '), class: 'ask-ai-diagram' });
    svg.append(element('title', {}, diagram.title));
    steps.forEach((step, index) => {
      const y = index * 56;
      svg.append(element('rect', { x: 16, y: y + 1, width: 288, height: 40, rx: 8 }));
      svg.append(element('text', { x: 160, y: y + 26, 'text-anchor': 'middle' }, step));
      if (index < steps.length - 1) {
        svg.append(element('path', { d: 'M160 ' + (y + 42) + 'v11m-4-4 4 4 4-4' }));
      }
    });
    return svg;
  }

  function configureVoice(dialog, input) {
    const mic = dialog.querySelector('#ask-ai-mic');
    const read = dialog.querySelector('#ask-ai-read');
    const status = dialog.querySelector('#ask-ai-voice-status');
    const Recognition = root.SpeechRecognition || root.webkitSpeechRecognition;
    const synth = root.speechSynthesis;
    let recognition;
    let readReplies = false;
    let latest = '';
    const stopSpeaking = () => { if (readReplies) synth?.cancel(); };
    const speak = () => {
      if (!readReplies || !latest || dialog.hidden || recognition) return;
      synth.cancel();
      const utterance = new root.SpeechSynthesisUtterance(latest.replace(/\*\*/g, ''));
      if (document.documentElement.lang) utterance.lang = document.documentElement.lang;
      synth.speak(utterance);
    };

    read.hidden = !synth || !root.SpeechSynthesisUtterance;
    read.addEventListener('click', () => {
      stopSpeaking();
      readReplies = !readReplies;
      read.setAttribute('aria-pressed', String(readReplies));
      if (readReplies) speak();
    });

    mic.hidden = !Recognition;
    mic.addEventListener('click', () => {
      if (recognition) { recognition.stop(); return; }
      stopSpeaking();
      const active = new Recognition();
      if (document.documentElement.lang) active.lang = document.documentElement.lang;
      active.onresult = (event) => {
        if (dialog.hidden || recognition !== active) return;
        input.value = [input.value.trim(), event.results[0][0].transcript].filter(Boolean).join(' ').slice(0, 1000);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
        status.textContent = 'Dictation added. Review it before sending.';
      };
      active.onerror = () => { status.textContent = 'Microphone unavailable. You can type your question.'; };
      active.onend = () => {
        if (recognition === active) recognition = null;
        mic.setAttribute('aria-pressed', 'false');
        if (status.textContent === 'Listening…') status.textContent = '';
      };
      try {
        recognition = active;
        active.start();
        mic.setAttribute('aria-pressed', 'true');
        status.textContent = 'Listening…';
      } catch {
        recognition = null;
        status.textContent = 'Microphone unavailable. You can type your question.';
      }
    });

    return {
      cancel() {
        stopSpeaking();
        const active = recognition;
        recognition = null;
        active?.abort();
        status.textContent = '';
      },
      answer(value, play) { latest = value; if (play) speak(); },
    };
  }

  function initUi() {
    const cfg = getConfig();
    if (!document.querySelector('.ask-ai-fab')) {
      const fab = document.createElement('button');
      fab.type = 'button';
      fab.className = 'ask-ai-fab';
      fab.setAttribute('data-ask-ai', '');
      fab.setAttribute('aria-label', `Ask AI about ${cfg.siteName}`);
      fab.innerHTML = `${SPARKLES}<span>Ask AI<small>Highlight text to ask about it</small></span>`;
      fab.title = 'You can also highlight text on this page to ask about it';
      document.body.appendChild(fab);
    }

    const triggers = document.querySelectorAll('[data-ask-ai]');
    if (!triggers.length) return;

    let backdrop = null;
    const history = [];
    const savedMessages = [];
    let lastSources = [];
    let ctaHref = cfg.ctaHref;
    let conversationId = root.crypto?.randomUUID?.();
    let leadEnabled = false;
    let leadSent = false;
    let busy = false;
    let setSelection;
    let restore;
    let opener;
    const selectionButton = document.createElement('button');
    selectionButton.type = 'button';
    selectionButton.className = 'ask-ai-selection-button ask-ai-chip';
    selectionButton.textContent = 'Ask about selection';
    selectionButton.hidden = true;
    document.body.append(selectionButton);
    let selectedPassage = '';

    function updateSelectionButton() {
      const selection = root.getSelection();
      const anchor = selection?.anchorNode?.parentElement;
      const focus = selection?.focusNode?.parentElement;
      const insideWidget = (node) => node?.closest('.ask-ai-backdrop, .ask-ai-fab, .ask-ai-selection-button');
      selectedPassage = !insideWidget(anchor) && !insideWidget(focus) ? selection?.toString().trim().slice(0, 1200) || '' : '';
      selectionButton.hidden = !selectedPassage || (backdrop && !backdrop.hidden);
    }
    document.addEventListener('selectionchange', updateSelectionButton);
    selectionButton.addEventListener('pointerdown', (event) => event.preventDefault());
    selectionButton.addEventListener('click', async () => {
      const passage = selectedPassage;
      if (!passage) return;
      await ready;
      openDialog(true, selectionButton);
      setSelection(passage);
      root.getSelection()?.removeAllRanges();
      selectionButton.hidden = true;
    });

    function persist(isOpen) {
      saveChatState({
        open: Boolean(isOpen), messages: savedMessages.slice(-40), history: history.slice(-12), sources: lastSources,
        conversationId, leadEnabled, leadSent, ctaHref
      });
    }

    function ensureDialog() {
      if (backdrop) return backdrop;
      backdrop = document.createElement('div');
      backdrop.className = 'ask-ai-backdrop';
      backdrop.hidden = true;
      backdrop.innerHTML = `
        <div class="ask-ai-dialog" role="dialog" aria-modal="true" aria-labelledby="ask-ai-title">
          <div class="ask-ai-head">
            <h2 id="ask-ai-title">${SPARKLES}<span></span></h2>
            <div class="ask-ai-head-btns">
              <button type="button" class="ask-ai-reset" id="ask-ai-reset" hidden>New</button>
              <button type="button" class="ask-ai-close" aria-label="Close">&times;</button>
            </div>
          </div>
          <div class="ask-ai-body">
            <p class="ask-ai-mode" id="ask-ai-mode"></p>
            <div class="ask-ai-chips" id="ask-ai-chips"></div>
            <div class="ask-ai-thread" id="ask-ai-thread" role="log" aria-label="Chat messages" hidden></div>
            <div class="ask-ai-sources" id="ask-ai-sources" hidden></div>
            <form class="ask-ai-form" id="ask-ai-form">
              <div id="ask-ai-quote" class="ask-ai-quote" hidden>
                <blockquote></blockquote><button type="button" class="ask-ai-chip">Remove selection</button>
              </div>
              <div class="ask-ai-composer">
                <textarea id="ask-ai-input" rows="1" maxlength="1000" placeholder="Ask a question..." aria-label="Your question"></textarea>
                <button type="submit" class="ask-ai-primary" id="ask-ai-submit" aria-label="Send">${PLANE}</button>
              </div>
            </form>
            <div class="ask-ai-voice">
              <button type="button" class="ask-ai-chip" id="ask-ai-mic" aria-pressed="false" title="Use your browser’s dictation service" hidden>Dictate</button>
              <button type="button" class="ask-ai-chip" id="ask-ai-read" aria-pressed="false" hidden>Read replies</button>
              <span id="ask-ai-voice-status" role="status"></span>
            </div>
            <div id="ask-ai-contact" class="ask-ai-contact" hidden>
              <details>
                <summary>Get a follow-up by email</summary>
                <form>
                  <label>Email <input type="email" name="email" autocomplete="email" maxlength="254" required></label>
                  <label><input type="checkbox" required> Share this chat with the site team so they can reply.</label>
                  <button class="ask-ai-chip" type="submit">Send to the team</button>
                </form>
              </details>
              <p role="status"></p>
            </div>
            <div class="ask-ai-ext" id="ask-ai-ext">
              <span class="ask-ai-ext-label">Or open in:</span>
              <a class="ask-ai-link" id="ask-ai-chatgpt" target="_blank" rel="noopener">ChatGPT</a>
              <a class="ask-ai-link" id="ask-ai-claude" target="_blank" rel="noopener">Claude</a>
              <a class="ask-ai-link" id="ask-ai-perplexity" target="_blank" rel="noopener">Perplexity</a>
            </div>
          </div>
          <a class="ask-ai-footer-cta" id="ask-ai-footer-cta">
            <span></span>
            <b></b>
          </a>
        </div>`;
      document.body.appendChild(backdrop);

      backdrop.querySelector('#ask-ai-title span').textContent = cfg.title;
      backdrop.querySelector('#ask-ai-mode').textContent = `Ask about ${cfg.siteName}, or highlight page text to ask about that passage.`;
      const footerCta = backdrop.querySelector('#ask-ai-footer-cta');
      footerCta.href = ctaHref;
      footerCta.querySelector('span').textContent = cfg.ctaLabel;
      footerCta.querySelector('b').textContent = cfg.ctaText;

      const input = backdrop.querySelector('#ask-ai-input');
      const chips = backdrop.querySelector('#ask-ai-chips');
      const thread = backdrop.querySelector('#ask-ai-thread');
      const sourcesBox = backdrop.querySelector('#ask-ai-sources');
      const resetBtn = backdrop.querySelector('#ask-ai-reset');
      const closeBtn = backdrop.querySelector('.ask-ai-close');
      const form = backdrop.querySelector('#ask-ai-form');
      const extBox = backdrop.querySelector('#ask-ai-ext');
      const modeEl = backdrop.querySelector('#ask-ai-mode');
      const submit = backdrop.querySelector('#ask-ai-submit');
      const quote = backdrop.querySelector('#ask-ai-quote');
      const contact = backdrop.querySelector('#ask-ai-contact');
      const contactDetails = contact.querySelector('details');
      const leadForm = contact.querySelector('form');
      const leadStatus = contact.querySelector('[role="status"]');
      const voice = configureVoice(backdrop, input);
      let passage = '';
      let sendingLead = false;

      setSelection = (value) => {
        passage = value;
        quote.hidden = !value;
        quote.querySelector('blockquote').textContent = value;
        input.placeholder = value ? 'What would you like to know about this?' : 'Ask a question...';
      };
      quote.querySelector('button').addEventListener('click', () => { setSelection(''); input.focus(); });

      function renderContact() {
        contact.hidden = !leadEnabled && !leadSent;
        contactDetails.hidden = leadSent;
        if (leadSent) leadStatus.textContent = 'Transcript sent. The team can reply to your email.';
      }

      leadForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (leadSent || sendingLead || busy) return;
        const button = leadForm.querySelector('button');
        button.disabled = true;
        resetBtn.disabled = true;
        sendingLead = true;
        leadStatus.textContent = 'Sending transcript…';
        try {
          const result = await fetch(cfg.leadEndpoint, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationId, email: leadForm.elements.email.value, consent: true, turns: savedMessages.slice(-40) }),
          });
          const data = await result.json().catch(() => ({}));
          if (!result.ok || !data.sent) throw new Error(data.error || 'Unable to send. Please try again.');
          leadSent = true;
          leadForm.reset();
          renderContact();
        } catch (error) {
          leadStatus.textContent = error.message;
        } finally {
          sendingLead = false;
          button.disabled = false;
          resetBtn.disabled = busy;
          persist(!backdrop.hidden);
        }
      });

      // Once a chat starts, everything that is not the conversation steps aside.
      function setChatActive(active) {
        chips.hidden = active;
        extBox.hidden = active;
        modeEl.hidden = active;
        resetBtn.hidden = !active;
      }

      function actionButton(label, question) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'ask-ai-chip';
        b.textContent = label;
        b.addEventListener('click', () => {
          if (busy) return;
          input.value = question;
          form.requestSubmit();
        });
        return b;
      }
      cfg.starterQuestions.forEach((q) => {
        chips.appendChild(actionButton(q, q));
      });

      function updateLinks(extraUrls) {
        const urls = buildProviderUrls(cfg, input.value, document.title, location.pathname, extraUrls);
        backdrop.querySelector('#ask-ai-chatgpt').href = urls.chatgpt;
        backdrop.querySelector('#ask-ai-claude').href = urls.claude;
        backdrop.querySelector('#ask-ai-perplexity').href = urls.perplexity;
      }
      input.addEventListener('input', () => updateLinks());
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); }
      });
      updateLinks();

      function close() {
        voice.cancel();
        backdrop.hidden = true;
        persist(false);
        if (opener && !opener.hidden) opener.focus();
        else document.querySelector('.ask-ai-fab')?.focus();
      }
      closeBtn.addEventListener('click', close);
      footerCta.addEventListener('click', close);
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !backdrop.hidden) close(); });

      resetBtn.addEventListener('click', () => {
        if (busy || sendingLead) return;
        conversationId = root.crypto?.randomUUID?.();
        leadEnabled = leadSent = false;
        leadForm.reset();
        contactDetails.open = false;
        leadStatus.textContent = '';
        setSelection('');
        voice.cancel();
        voice.answer('', false);
        renderContact();
        history.length = 0; savedMessages.length = 0; lastSources = [];
        footerCta.href = ctaHref = cfg.ctaHref;
        thread.innerHTML = ''; thread.hidden = true;
        sourcesBox.innerHTML = ''; sourcesBox.hidden = true;
        setChatActive(false);
        persist(true); input.focus();
      });

      function renderReply(div, message) {
        div.innerHTML = formatAnswerHtml(message.text);
        const diagram = renderDiagram(message.diagram);
        if (diagram) div.append(diagram);
        if (Array.isArray(message.actions) && message.actions.length) {
          const list = document.createElement('div');
          list.className = 'ask-ai-followups';
          list.setAttribute('aria-label', 'Suggested questions');
          message.actions.slice(0, 3).forEach(({ label, question }) => list.append(actionButton(label, question)));
          div.append(list);
        }
      }

      function appendMessage(role, text, record = true, reply = {}) {
        const div = document.createElement('div');
        div.className = `ask-ai-msg ask-ai-msg-${role}`;
        if (role === 'bot') renderReply(div, { ...reply, text });
        else div.textContent = text;
        thread.appendChild(div);
        thread.hidden = false;
        thread.scrollTop = thread.scrollHeight;
        if (record) savedMessages.push({ role, text, ...reply });
        return div;
      }

      function renderSources(sources) {
        lastSources = sources || [];
        sourcesBox.innerHTML = '';
        lastSources.forEach((s) => {
          const a = document.createElement('a');
          a.className = 'ask-ai-source-link';
          if (typeof s?.path !== 'string' || !/^\/(?![\/\\])/.test(s.path)) return;
          a.href = s.path;
          a.textContent = s.title;
          a.addEventListener('click', () => persist(true));
          sourcesBox.appendChild(a);
        });
        sourcesBox.hidden = !lastSources.length;
      }

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (busy || sendingLead) return;
        const selected = passage;
        const q = input.value.trim() || (selected ? 'Explain this passage.' : '');
        if (!q) { input.focus(); return; }
        const visitorText = selected ? q + '\n\nSelected text: ' + selected : q;
        const turnId = root.crypto?.randomUUID?.();
        busy = true;
        resetBtn.disabled = true;
        voice.cancel();
        setSelection('');
        setChatActive(true);
        appendMessage('user', visitorText);
        input.value = '';
        const botMsg = appendMessage('bot', 'Searching site guides...', false);
        persist(true);
        submit.disabled = true;

        try {
          const context = cfg.collectContext
            ? await cfg.collectContext([q, selected].filter(Boolean).join(' '))
            : await gatherContext(cfg, q);
          const { contextText, sources } = context;
          const fallbackLinks = buildProviderUrls(cfg, visitorText, document.title, location.pathname,
            sources.map((source) => cfg.contentMode === 'index' ? cfg.siteOrigin + source.path : pageMarkdownUrl(cfg.siteOrigin, source.path)));
          for (const provider of ['chatgpt', 'claude', 'perplexity']) {
            backdrop.querySelector('#ask-ai-' + provider).href = fallbackLinks[provider];
          }
          botMsg.textContent = 'Thinking...';
          const res = await fetch(cfg.apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: q, context: contextText, selection: selected, page: location.pathname || '/', history: history.slice(-6), conversationId, turnId })
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.answer) throw new Error(data.error || 'AI unavailable');
          const message = { role: 'bot', text: data.answer, actions: data.actions, diagram: data.diagram };
          renderReply(botMsg, message);
          savedMessages.push(message);
          history.push({ role: 'user', content: visitorText }, { role: 'assistant', content: data.answer });
          leadEnabled = data.leadEnabled === true;
          const typedEmail = q.match(/[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
          if (leadEnabled && !leadSent && typedEmail) {
            leadForm.elements.email.value = typedEmail;
            contactDetails.open = true;
          }
          renderContact();
          voice.answer(data.answer, true);
          footerCta.href = ctaHref = context.ctaHref || cfg.ctaHref;
          renderSources(sources);
        } catch {
          const err = 'On-page AI could not answer right now. Try opening in ChatGPT, Claude, or Perplexity below.';
          renderReply(botMsg, { text: err, actions: [{ label: 'Try again', question: q }] });
          if (selected) setSelection(selected);
          extBox.hidden = false;
        } finally {
          busy = false;
          resetBtn.disabled = false;
          submit.disabled = false;
          thread.scrollTop = thread.scrollHeight;
          persist(!backdrop.hidden);
          if (!backdrop.hidden) input.focus();
        }
      });

      restore = (state) => {
        for (const message of state.messages) {
          if ((message?.role === 'user' || message?.role === 'bot') && typeof message.text === 'string') {
            appendMessage(message.role, message.text, false, message);
            savedMessages.push(message);
          }
        }
        setChatActive(savedMessages.length > 0);
        renderSources(Array.isArray(state.sources) ? state.sources : []);
        renderContact();
        const lastReply = [...savedMessages].reverse().find((message) => message.role === 'bot');
        voice.answer(lastReply?.text || '', false);
      };

      return backdrop;
    }

    function openDialog(focusInput = true, trigger) {
      const el = ensureDialog();
      if (trigger) opener = trigger;
      el.hidden = false;
      selectionButton.hidden = true;
      if (focusInput) el.querySelector('#ask-ai-input').focus();
      persist(true);
    }

    const ready = loadChatState().then((state) => {
      if (!Array.isArray(state?.messages) || !state.messages.length) return;
      if (Array.isArray(state.history)) history.push(...state.history);
      conversationId = state.conversationId || conversationId;
      leadEnabled = state.leadEnabled === true;
      leadSent = state.leadSent === true;
      ctaHref = typeof state.ctaHref === 'string' ? state.ctaHref : cfg.ctaHref;
      ensureDialog();
      restore(state);
      if (state.open) openDialog(false);
    });
    triggers.forEach((button) => button.addEventListener('click', async () => {
      await ready;
      openDialog(true, button);
    }));
  }

  const api = { getConfig, parseLlmsTxt, pageMarkdownUrl, buildProviderUrls, extractKeywords, formatAnswerHtml };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.AskAIWidget = api;
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initUi);
      else initUi();
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);

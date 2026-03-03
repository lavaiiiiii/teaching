const $ = (id) => document.getElementById(id);

function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function copyText(text) {
  if (!text.trim()) return alert('Nothing to copy yet.');
  navigator.clipboard.writeText(text)
    .then(() => alert('Copied!'))
    .catch(() => alert('Could not copy automatically. Please select and copy manually.'));
}

function localDraft({ recipient, tone, context, mustInclude }) {
  return `Subject: Quick update from your teacher\n\nHi ${recipient || 'there'},\n\nI hope you are well. I wanted to share an update: ${context || 'I wanted to share a quick classroom update.'}\n\n${mustInclude ? `Important details: ${mustInclude}\n\n` : ''}Tone requested: ${tone}.\n\nPlease let me know if you have any questions. I am happy to support.\n\nBest regards,\n[Teacher Name]`;
}

async function generateWithOpenClaw(payload) {
  const endpoint = $('apiEndpoint').value.trim();
  const apiKey = $('apiKey').value.trim();
  if (!endpoint || !apiKey) return null;

  const prompt = `Write a short, clear email for a teacher.\nRecipient: ${payload.recipient}\nTone: ${payload.tone}\nContext: ${payload.context}\nMust include: ${payload.mustInclude || 'None'}\nUse plain language for families. Keep it kind and practical.`;

  const body = {
    model: 'openclaw-teacher-assistant',
    messages: [
      { role: 'system', content: 'You help teachers write clear and friendly emails.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.4
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) throw new Error(`OpenClaw request failed (${res.status})`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() || null;
}

$('generateEmail').addEventListener('click', async () => {
  const payload = {
    recipient: $('recipient').value.trim(),
    tone: $('tone').value,
    context: $('emailContext').value.trim(),
    mustInclude: $('mustInclude').value.trim()
  };

  $('emailOutput').value = 'Generating...';

  try {
    const ai = await generateWithOpenClaw(payload);
    $('emailOutput').value = ai || localDraft(payload);
  } catch (err) {
    $('emailOutput').value = `${localDraft(payload)}\n\n[Note: OpenClaw error: ${err.message}]`;
  }
});

$('copyEmail').addEventListener('click', () => copyText($('emailOutput').value));
$('clearEmail').addEventListener('click', () => {
  $('recipient').value = '';
  $('tone').value = 'Friendly';
  $('emailContext').value = '';
  $('mustInclude').value = '';
  $('emailOutput').value = '';
});

function parseHM(v) {
  const [h, m] = v.split(':').map(Number);
  return h * 60 + m;
}

function fmtTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hr = ((h + 11) % 12) + 1;
  return `${hr}:${String(m).padStart(2, '0')} ${suffix}`;
}

function dateLabel(d) {
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

$('generateSlots').addEventListener('click', () => {
  const startDate = $('startDate').value || todayISO();
  const startMins = parseHM($('dayStart').value);
  const endMins = parseHM($('dayEnd').value);
  const slotLen = Number($('slotLength').value);

  if (endMins <= startMins) {
    alert('End time must be later than start time.');
    return;
  }

  const wrap = $('slots');
  wrap.innerHTML = '';

  const selected = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate + 'T00:00:00');
    d.setDate(d.getDate() + i);

    const group = document.createElement('div');
    group.className = 'day-group';
    group.innerHTML = `<h4>${dateLabel(d)}</h4>`;

    for (let t = startMins; t + slotLen <= endMins; t += slotLen) {
      const slotText = `${dateLabel(d)} ${fmtTime(t)}-${fmtTime(t + slotLen)}`;
      const id = `slot-${i}-${t}`;
      const row = document.createElement('label');
      row.className = 'slot';
      row.innerHTML = `<input type="checkbox" id="${id}" /> ${fmtTime(t)}-${fmtTime(t + slotLen)}`;

      row.querySelector('input').addEventListener('change', (e) => {
        if (e.target.checked) {
          selected.push(slotText);
        } else {
          const idx = selected.indexOf(slotText);
          if (idx >= 0) selected.splice(idx, 1);
        }
        $('scheduleMessage').value = selected.length
          ? `Hello,\n\nI am available for a meeting at these times in the next 7 days:\n- ${selected.join('\n- ')}\n\nPlease reply with your preferred option.\n\nThank you,\n[Teacher Name]`
          : '';
      });

      group.appendChild(row);
    }

    wrap.appendChild(group);
  }
});

$('copySchedule').addEventListener('click', () => copyText($('scheduleMessage').value));
$('startDate').value = todayISO();

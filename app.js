const $ = (id) => document.getElementById(id);

const chatHistory = [
  {
    role: 'system',
    content:
      'You are an assistant for university teachers. Help summarize today emails and assist meeting scheduling with a 7-day calendar.'
  }
];

const mailbox = [
  {
    from: 'Phong Nguyen <phong@student.edu>',
    subject: 'Nộp bài muộn môn AI',
    receivedAt: new Date(),
    snippet: 'Thầy/cô cho em xin nộp bù bài tập tuần này trước 20:00 tối nay.'
  },
  {
    from: 'Academic Office <office@university.edu>',
    subject: 'Nhắc lịch họp bộ môn',
    receivedAt: new Date(),
    snippet: 'Lịch họp bộ môn lúc 14:00 tại phòng A-302. Vui lòng xác nhận tham dự.'
  },
  {
    from: 'Tran Minh <minh@student.edu>',
    subject: 'Xin tư vấn đề tài cuối kỳ',
    receivedAt: new Date(Date.now() - 86400000),
    snippet: 'Em muốn đặt lịch 20 phút để xin ý kiến về đề tài cuối kỳ.'
  }
];

const selectedSlots = new Set();

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addMessage(role, text) {
  const msg = document.createElement('div');
  msg.className = `msg ${role}`;
  msg.textContent = text;
  $('chatLog').appendChild(msg);
  $('chatLog').scrollTop = $('chatLog').scrollHeight;
}

function parseHM(value) {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

function formatHM(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatDateLabel(date) {
  return date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

function isToday(date) {
  const t = new Date();
  return (
    date.getDate() === t.getDate() &&
    date.getMonth() === t.getMonth() &&
    date.getFullYear() === t.getFullYear()
  );
}

function summarizeTodayEmails() {
  const todayEmails = mailbox.filter((mail) => isToday(mail.receivedAt));

  if (!todayEmails.length) {
    return 'Hôm nay chưa có email mới trong hộp thư.';
  }

  const lines = todayEmails.map((mail, idx) => {
    return `${idx + 1}. ${mail.subject}\n   - Từ: ${mail.from}\n   - Nội dung nhanh: ${mail.snippet}`;
  });

  return `Tổng hợp email hôm nay (${todayEmails.length} email):\n\n${lines.join('\n\n')}\n\nGợi ý: Bạn có thể nhắn "soạn trả lời email số 1" để tôi tạo bản nháp phản hồi.`;
}

function draftReplyByIndex(input) {
  const match = input.match(/(\d+)/);
  if (!match) return null;

  const idx = Number(match[1]) - 1;
  const todayEmails = mailbox.filter((mail) => isToday(mail.receivedAt));
  const target = todayEmails[idx];
  if (!target) return 'Không tìm thấy email theo số bạn yêu cầu trong danh sách hôm nay.';

  return `Bản nháp trả lời:\n\nChào ${target.from.split(' <')[0]},\n\nCảm ơn bạn đã gửi email về: "${target.subject}".\nTôi đã nhận được thông tin và sẽ phản hồi chi tiết trong hôm nay.\n\nTrân trọng,\n[Giảng viên]`;
}

function generateScheduleGrid() {
  const startDate = $('startDate').value || todayISO();
  const startMin = parseHM($('dayStart').value);
  const endMin = parseHM($('dayEnd').value);
  const slotLength = Number($('slotLength').value);

  if (endMin <= startMin) {
    addMessage('assistant', 'Không thể tạo lịch: giờ kết thúc phải lớn hơn giờ bắt đầu.');
    return;
  }

  const wrap = $('scheduleTableWrap');
  wrap.innerHTML = '';
  selectedSlots.clear();

  const table = document.createElement('table');
  table.className = 'schedule-table';

  const head = document.createElement('thead');
  const hr = document.createElement('tr');
  hr.innerHTML = '<th>Ngày</th><th>Khung giờ trống</th>';
  head.appendChild(hr);
  table.appendChild(head);

  const body = document.createElement('tbody');

  for (let i = 0; i < 7; i++) {
    const d = new Date(`${startDate}T00:00:00`);
    d.setDate(d.getDate() + i);

    const tr = document.createElement('tr');
    const dateCell = document.createElement('td');
    dateCell.textContent = formatDateLabel(d);

    const slotsCell = document.createElement('td');
    slotsCell.className = 'slot-cell';

    for (let t = startMin; t + slotLength <= endMin; t += slotLength) {
      const slotText = `${d.toISOString().slice(0, 10)} ${formatHM(t)}-${formatHM(t + slotLength)}`;
      const label = document.createElement('label');
      label.className = 'slot-option';
      label.innerHTML = `<input type="checkbox" /> ${formatHM(t)}-${formatHM(t + slotLength)}`;

      label.querySelector('input').addEventListener('change', (e) => {
        if (e.target.checked) {
          selectedSlots.add(slotText);
        } else {
          selectedSlots.delete(slotText);
        }
      });

      slotsCell.appendChild(label);
    }

    tr.appendChild(dateCell);
    tr.appendChild(slotsCell);
    body.appendChild(tr);
  }

  table.appendChild(body);
  wrap.appendChild(table);
  $('scheduleActions').hidden = false;

  addMessage('assistant', 'Tôi đã tạo bảng lịch 7 ngày. Bạn chọn giờ trống rồi bấm "Lên lịch tự động".');
}

function buildAppointmentReply() {
  if (!selectedSlots.size) {
    addMessage('assistant', 'Bạn chưa chọn khung giờ nào trong bảng.');
    return;
  }

  const slots = Array.from(selectedSlots).sort();
  const reply = `Đã lên lịch hẹn tự động với các lựa chọn:\n- ${slots.join('\n- ')}\n\nTin nhắn gửi người hẹn:\nXin chào,\nTôi có thể gặp vào các khung giờ trên. Bạn vui lòng chọn 1 thời điểm phù hợp.\nTrân trọng,\n[Giảng viên]`;

  addMessage('assistant', reply);
}

async function askOpenClaw(userText) {
  const endpoint = $('apiEndpoint').value.trim();
  const apiKey = $('apiKey').value.trim();
  if (!endpoint || !apiKey) return null;

  const body = {
    model: 'openclaw-teacher-assistant',
    messages: [
      ...chatHistory,
      {
        role: 'user',
        content: `Yêu cầu từ giảng viên: ${userText}. Nếu có lịch hẹn thì tối đa 7 ngày.`
      }
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

function localAssistant(userText) {
  const q = userText.toLowerCase();

  if (q.includes('mail hôm nay') || q.includes('email hôm nay') || q.includes('thông tin mail')) {
    return summarizeTodayEmails();
  }

  if (q.includes('soạn trả lời email số')) {
    return draftReplyByIndex(userText);
  }

  if (q.includes('lịch hẹn') || q.includes('schedule') || q.includes('đặt lịch')) {
    generateScheduleGrid();
    return 'Bạn hãy chọn ngày/giờ trống trong bảng lịch phía dưới, sau đó bấm "Lên lịch tự động".';
  }

  return 'Tôi có thể giúp: (1) tổng hợp mail hôm nay, (2) soạn trả lời email, (3) tạo bảng lịch hẹn 7 ngày. Bạn hãy nhắn theo nhu cầu.';
}

async function handleAsk(text) {
  addMessage('user', text);
  chatHistory.push({ role: 'user', content: text });

  addMessage('assistant', 'Đang xử lý...');
  const thinkingNode = $('chatLog').lastElementChild;

  try {
    const aiReply = await askOpenClaw(text);
    const reply = aiReply || localAssistant(text);
    thinkingNode.textContent = reply;
    chatHistory.push({ role: 'assistant', content: reply });
  } catch (err) {
    const fallback = `${localAssistant(text)}\n\n[Lỗi OpenClaw: ${err.message}]`;
    thinkingNode.textContent = fallback;
    chatHistory.push({ role: 'assistant', content: fallback });
  }
}

$('chatForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = $('userInput').value.trim();
  if (!text) return;

  $('userInput').value = '';
  await handleAsk(text);
});

$('clearChat').addEventListener('click', () => {
  $('chatLog').innerHTML = '';
  $('scheduleTableWrap').innerHTML = '';
  $('scheduleActions').hidden = true;
  selectedSlots.clear();
  chatHistory.splice(1);
  addMessage('assistant', 'Đã xóa hội thoại. Bạn có thể hỏi: "Tổng hợp mail hôm nay" hoặc "Tạo lịch hẹn".');
});

$('generateSchedule').addEventListener('click', generateScheduleGrid);
$('autoSchedule').addEventListener('click', buildAppointmentReply);

for (const chip of document.querySelectorAll('.chip')) {
  chip.addEventListener('click', () => {
    $('userInput').value = chip.dataset.prompt;
    $('userInput').focus();
  });
}

$('startDate').value = todayISO();
addMessage(
  'assistant',
  'Xin chào giảng viên 👋 Tôi là trợ lí AI. Bạn có thể hỏi: "Tổng hợp mail hôm nay" hoặc "Cho tôi lịch hẹn".'
);

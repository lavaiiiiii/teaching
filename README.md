# Trợ lí AI cho Giảng viên (OpenClaw-ready)

Ứng dụng web dạng chat hỗ trợ giảng viên:

- Hỏi **"mail hôm nay"** để được tổng hợp nhanh email trong ngày.
- Hỏi **"lịch hẹn"** để AI tạo bảng chọn ngày/giờ trống (tối đa 7 ngày).
- Chọn slot trong bảng và bấm **Lên lịch tự động** để tạo tin nhắn hẹn.
- Có thể kết nối OpenClaw API (tuỳ chọn). Không có key vẫn dùng được chế độ local.

## Chạy local

```bash
python3 -m http.server 4173
```

Mở trình duyệt: <http://localhost:4173>

## Cấu hình OpenClaw (tuỳ chọn)

Nhập ở sidebar:
- API Endpoint (ví dụ: `https://api.openclaw.ai/v1/chat/completions`)
- API Key

## Prompt mẫu

- `Tổng hợp thông tin mail hôm nay`
- `Cho tôi lịch hẹn để sinh viên đặt trong 7 ngày tới`
- `Soạn trả lời email số 1`

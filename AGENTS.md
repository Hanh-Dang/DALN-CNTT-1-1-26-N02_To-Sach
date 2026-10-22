<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Quy ước Git & Commit chuẩn hóa

## 1. Định dạng Conventional Commits
- Cấu trúc bắt buộc: `type(scope): mô tả ngắn gọn`
- Các `type` hợp lệ: `feat`, `fix`, `docs`, `chore`, `refactor`, `perf`, `test`.
- **Mỗi commit chỉ dùng DUY NHẤT một type**. Tuyệt đối không dùng kiểu ghép (ví dụ: không dùng `docs & feat:`).
- Phần mô tả phải viết bằng **100% tiếng Việt**.
- Tiêu đề commit (subject line) **tối đa 72 ký tự**. Nếu cần giải thích chi tiết, xuống dòng viết ở phần thân commit (body).

## 2. Tính nguyên tử của Commit (Atomic Commits)
- Mỗi commit chỉ làm **đúng một việc duy nhất**.
- Khi sửa nhiều lỗi hoặc làm nhiều tác vụ cùng lúc, bắt buộc tách thành các commit riêng theo từng nhóm lỗi/chức năng, không gộp nhiều mã lỗi vào một commit.

## 3. Quy tắc an toàn Git bắt buộc
- **Tuyệt đối KHÔNG tự ý chạy**: `git push --force`, `git reset --hard`, `git rebase` trên lịch sử đã push, hay sửa đổi lịch sử nhánh `main` khi chưa có sự đồng ý rõ ràng của người phụ trách.
- **Bảo mật**: Tuyệt đối không commit file `.env` hoặc bất kỳ token, secret, khóa bí mật nào vào repository.

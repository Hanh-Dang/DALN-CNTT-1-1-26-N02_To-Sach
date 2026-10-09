import { PrismaClient, ReviewStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Đang khởi tạo dữ liệu đánh giá mẫu cho Tổ Sách ---');

  // Lấy danh sách sách và người dùng có sẵn
  const books = await prisma.book.findMany({ take: 10 });
  const users = await prisma.user.findMany({ take: 10 });

  if (books.length === 0 || users.length === 0) {
    console.error('Cần có ít nhất 1 sách và 1 user để tạo reviews.');
    return;
  }

  // Danh sách đánh giá sinh động, thực tế
  const sampleReviews = [
    {
      rating: 5,
      title: 'Tác phẩm xuất sắc, bìa sách Tổ Sách đóng gói rất kỹ!',
      body: 'Sách mới cứng nguyên seal, góc cạnh thẳng thớm không bị móp một chút nào. Nội dung thì khỏi phải bàn, cực kỳ thấm thía và truyền cảm hứng. Giao hàng tại Hà Nội chỉ mất 1 ngày.',
      status: ReviewStatus.APPROVED,
      isVerifiedPurchase: true,
    },
    {
      rating: 5,
      title: 'Đáng từng xu, kiến thức thực chiến và dễ hiểu',
      body: 'Mình đã đọc đi đọc lại 2 lần cuốn này. Lối hành văn mạch lạc, giải thích các khái niệm phức tạp một cách rất đời thường. Rất khuyên các bạn trẻ nên đọc ít nhất một lần.',
      status: ReviewStatus.APPROVED,
      isVerifiedPurchase: true,
    },
    {
      rating: 4,
      title: 'Chất lượng giấy tốt, font chữ dễ đọc',
      body: 'Giấy xốp ngà chống mỏi mắt rất thích, dàn trang thoáng đãng. Nội dung nửa đầu rất cuốn, nửa sau hơi dài dòng một chút nhưng vẫn là một cuốn sách hay.',
      status: ReviewStatus.APPROVED,
      isVerifiedPurchase: true,
    },
    {
      rating: 5,
      title: 'Mua làm quà tặng cho bạn bè rất ưng ý',
      body: 'Gói hàng cẩn thận, có bọc chống sốc 3 lớp dày dặn. Người nhận khen sách đẹp và ý nghĩa. Sẽ tiếp tục ủng hộ nhà sách Tổ Sách trong các đợt tới.',
      status: ReviewStatus.APPROVED,
      isVerifiedPurchase: false,
    },
    {
      rating: 4,
      title: 'Bản dịch mượt mà, giữ trọn tinh thần nguyên tác',
      body: 'Nhiều thuật ngữ chuyên ngành được dịch và chú thích chân trang rất cẩn thận, dễ hiểu cho người mới bắt đầu tiếp cận chủ đề này.',
      status: ReviewStatus.APPROVED,
      isVerifiedPurchase: true,
    },
    {
      rating: 3,
      title: 'Nội dung ở mức khá, giao hàng hơi chậm hơn dự kiến',
      body: 'Sách nội dung ổn nhưng bên bưu cục giao trễ 1 ngày so với thông báo. Tuy nhiên nhân viên nhà sách hỗ trợ tra cứu mã vận đơn rất nhiệt tình.',
      status: ReviewStatus.APPROVED,
      isVerifiedPurchase: true,
    },
    {
      rating: 5,
      title: 'Cuốn sách khai sáng tư duy tài chính cho mình!',
      body: 'Những bài học về tâm lý khi đối diện với tiền bạc thật sự đắt giá. Rất nhiều góc nhìn mới mẻ mà trước đây mình chưa từng nghĩ tới.',
      status: ReviewStatus.APPROVED,
      isVerifiedPurchase: true,
    },
    {
      rating: 4,
      title: 'Ấn bản đẹp, bookmark xinh xắn đi kèm',
      body: 'Rất thích cảm giác cầm cuốn sách trên tay, thơm mùi mực mới. Đọc liền một mạch trong hai buổi tối cuối tuần.',
      status: ReviewStatus.APPROVED,
      isVerifiedPurchase: false,
    },
    {
      rating: 5,
      title: 'Chất lượng dịch vụ tuyệt vời, 10/10 điểm',
      body: 'Đặt đơn lúc 9h sáng hôm qua mà trưa nay đã nhận được hàng ở quận Đống Đa rồi. Sách nguyên vẹn, thơm phức, giá lại còn tốt hơn giá bìa.',
      status: ReviewStatus.APPROVED,
      isVerifiedPurchase: true,
    },
    // Đánh giá PENDING (Chờ duyệt)
    {
      rating: 5,
      title: 'Đang đọc dở nhưng thấy rất hay, xin hỏi có tập 2 không shop?',
      body: 'Mình vừa đọc được 100 trang đầu thấy cực kỳ lôi cuốn. Không biết tác giả có dự định ra mắt thêm phần tiếp theo hay tác phẩm liên quan nào nữa không ạ?',
      status: ReviewStatus.PENDING,
      isVerifiedPurchase: true,
    },
    {
      rating: 4,
      title: 'Sách rất hay nhưng shipper gọi lúc đang bận họp',
      body: 'Nội dung sách 5 sao, đóng gói 5 sao. Trừ 1 sao do bạn shipper giao đúng giờ mình đang bận họp nội bộ, hẹn lại chiều mới lấy được.',
      status: ReviewStatus.PENDING,
      isVerifiedPurchase: true,
    },
    {
      rating: 5,
      title: 'Rất đáng đọc cho bất kỳ ai muốn hoàn thiện bản thân',
      body: 'Lời khuyên chân thành và gần gũi. Đọc xong cảm giác tâm trí nhẹ nhõm hơn nhiều.',
      status: ReviewStatus.PENDING,
      isVerifiedPurchase: false,
    },
    {
      rating: 2,
      title: 'Bìa sách hơi bị cấn góc nhẹ ở phần mép trên',
      body: 'Nội dung sách thì hay nhưng lúc nhận thấy mép gáy trên bị cấn nhẹ một chút xíu, có thể do va đập trong quá trình vận chuyển bưu cục.',
      status: ReviewStatus.PENDING,
      isVerifiedPurchase: true,
    },
    // Đánh giá REJECTED (Vi phạm / Spam)
    {
      rating: 1,
      title: 'Bấm vào link này để nhận voucher 500k miễn phí: http://spam-link.xyz',
      body: 'Quảng cáo cờ bạc và vay tiền online, nhận tiền ngay sau 5 phút truy cập link lừa đảo...',
      status: ReviewStatus.REJECTED,
      isVerifiedPurchase: false,
    },
    {
      rating: 1,
      title: 'Bình luận spam quảng cáo bán hàng đa cấp',
      body: 'Tuyển dụng cộng tác viên làm việc tại nhà thu nhập 20 triệu/tháng không cần cọc liên hệ zalo 0999999999...',
      status: ReviewStatus.REJECTED,
      isVerifiedPurchase: false,
    },
  ];

  // Xóa các reviews cũ hoặc chèn thêm
  let createdCount = 0;
  for (let i = 0; i < sampleReviews.length; i++) {
    const rev = sampleReviews[i];
    const book = books[i % books.length];
    const user = users[i % users.length];

    await prisma.review.create({
      data: {
        bookId: book.id,
        userId: user.id,
        rating: rev.rating,
        title: rev.title,
        body: rev.body,
        status: rev.status,
        isVerifiedPurchase: rev.isVerifiedPurchase,
        createdAt: new Date(Date.now() - (sampleReviews.length - i) * 3600 * 24 * 1000 * 3), // rải rác trong 45 ngày qua
      },
    });
    createdCount++;
  }

  // Cập nhật lại avgRating và ratingCount cho toàn bộ sách
  for (const b of books) {
    const agg = await prisma.review.aggregate({
      where: { bookId: b.id, status: ReviewStatus.APPROVED },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await prisma.book.update({
      where: { id: b.id },
      data: {
        avgRating: agg._avg.rating ? Number(agg._avg.rating.toFixed(1)) : 5,
        ratingCount: agg._count.rating || 0,
      },
    });
  }

  console.log(`✓ Đã nạp thành công ${createdCount} đánh giá mẫu đa dạng trạng thái (APPROVED, PENDING, REJECTED).`);
}

main()
  .catch((e) => {
    console.error('Lỗi khi nạp reviews:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export type TributeStage =
  | 'intro'
  | 'letter'
  | 'bouquet'
  | 'wishes'
  | 'gallery'
  | 'finale';

export interface StudentEntry {
  index: number;
  name: string;
}

export interface WishCard {
  id: string;
  chapter: string;
  title: string;
  message: string;
  signature: string;
  imageSrc: string;
  imageAlt: string;
}

export interface GalleryPhoto {
  id: string;
  title: string;
  subtitle: string;
  imageSrc: string;
  fallbackSrc: string;
  imageAlt: string;
  wishText: string;
}

export interface LyricLine {
  time: number;
  text: string;
}

export interface MusicTrack {
  id: string;
  label: string;
  title: string;
  artist: string;
  src: string;
  durationSeconds: number;
  lyrics: LyricLine[];
}

export const TEACHER_NAME = 'Ngô Thị Linh';
export const TEACHER_HONORIFIC = 'Cô Ngô Thị Linh';

export const STUDENT_NAMES: readonly StudentEntry[] = [
  { index: 1, name: 'Nguyễn Thị Lan Anh' },
  { index: 2, name: 'Lưu Ngọc Bảo' },
  { index: 3, name: 'Vi Thị Ngọc Bích' },
  { index: 4, name: 'Dương Chí Bình' },
  { index: 5, name: 'Mông Thị Châu' },
  { index: 6, name: 'Diệp Bách Cường' },
  { index: 7, name: 'Lâm Chí Cường' },
  { index: 8, name: 'Long Mạnh Cường' },
  { index: 9, name: 'Nông Viết Đăng' },
  { index: 10, name: 'Vi Thị Đào' },
  { index: 11, name: 'Giáp Minh Hằng' },
  { index: 12, name: 'Nguyễn Văn Hảo' },
  { index: 13, name: 'Trần Nguyễn Gia Hiếu' },
  { index: 14, name: 'Lương Thị Mai Hoa' },
  { index: 15, name: 'Sái Đức Khiêm' },
  { index: 16, name: 'Hoàng Đăng Khôi' },
  { index: 17, name: 'Lý Diệu Linh' },
  { index: 18, name: 'Vi Thùy Linh' },
  { index: 19, name: 'Hoàng Văn Lộc' },
  { index: 20, name: 'Lịch Thị Hoa Ly' },
  { index: 21, name: 'Ngô Thị Lưu Ly' },
  { index: 22, name: 'Hoàng Văn Mạnh' },
  { index: 23, name: 'Hoàng Anh Minh' },
  { index: 24, name: 'Hoàng Trung Nghĩa' },
  { index: 25, name: 'Dương Ảnh Nhi' },
  { index: 26, name: 'Nông Văn Phúc' },
  { index: 27, name: 'Trần Thế Tâm' },
  { index: 28, name: 'Vi Đức Tân' },
  { index: 29, name: 'Nguyễn Anh Thái' },
  { index: 30, name: 'Nguyễn Viết Thành' },
  { index: 31, name: 'Triêu Hữu Thành' },
  { index: 32, name: 'Nguyễn Trường Thịnh' },
  { index: 33, name: 'Lưu Thị Mai Thủy' },
  { index: 34, name: 'Hoàng Duy Toàn' },
  { index: 35, name: 'Phan Hoàng Bích Trâm' },
  { index: 36, name: 'Giáp Thị Huyền Trân' },
  { index: 37, name: 'Nguyễn Quỳnh Trang' },
  { index: 38, name: 'Nguyễn Hữu Trọng' },
  { index: 39, name: 'Trần Anh Tuấn' },
  { index: 40, name: 'Vắn Xuân Tùng' },
  { index: 41, name: 'Nịnh Duy Tuyên' },
  { index: 42, name: 'Nịnh Thị Thu Uyên' },
  { index: 43, name: 'Bàng Thị Kiều Vi' },
  { index: 44, name: 'Nguyễn Tuấn Việt' },
  { index: 45, name: 'Phạm Trọng Vương' },
];

export const LEFT_COLUMN_STUDENTS = STUDENT_NAMES.slice(0, 23);
export const RIGHT_COLUMN_STUDENTS = STUDENT_NAMES.slice(23);

export const BOUQUET_IMAGE_SRC = './src/assets/images/bouquet_pink_roses_1794898040217.jpg';
export const SUNLIT_ROSES_IMAGE_SRC = './src/assets/images/memory_sunlit_roses_1794898064728.jpg';
export const SILK_PETALS_IMAGE_SRC = './src/assets/images/memory_silk_petals_1794898065190.jpg';

export const TEACHER_LETTER = {
  greeting: 'Kính gửi cô Ngô Thị Linh thân mến,',
  dateLine: 'Ngày Nhà giáo Việt Nam 20 tháng 11',
  paragraphs: [
    'Có những người đến trong cuộc đời ta như một ngọn gió dịu dàng nhưng lại thắp sáng cả một bầu trời tuổi trẻ. Với chúng em, cô Ngô Thị Linh chính là người lái đò tận tụy, người đã kiên nhẫn dìu dắt từng bước đi, lắng nghe từng nỗi lo âu và gieo vào lòng 45 đứa học trò biết bao ước mơ đẹp.',
    'Mỗi trang giáo án cô soạn, mỗi lời nhắc nhở ân cần trên bục giảng, hay ánh mắt ấm áp của cô những ngày chúng em mệt mỏi đều trở thành hành trang quý giá theo chúng em suốt chặng đường trưởng thành.',
    'Nhân dịp 20/11, tập thể 45 học sinh xin gửi đến cô tất cả lòng biết ơn sâu sắc nhất. Chúc cô luôn mạnh khỏe, trẻ trung, giữ mãi nụ cười rạng rỡ và ngọn lửa yêu nghề cháy bỏng trong tim.',
  ],
  closing: 'Trọn vẹn yêu thương từ tập thể 45 học sinh của cô',
};

export const AI_WISH_CARDS: WishCard[] = [
  {
    id: 'wish-lantern',
    chapter: 'Lời chúc 01 · Tri ân người gieo mầm',
    title: 'Ngọn đèn soi sáng những ước mơ xanh',
    message:
      'Chúc cô Ngô Thị Linh một ngày 20/11 ngập tràn hoa thơm, nụ cười và hạnh phúc. Cảm ơn cô vì đã biến mỗi tiết học thành một hành trình dịu dàng, nơi chúng em không chỉ học kiến thức mà còn học cách sống tử tế và biết yêu thương.',
    signature: 'Gửi cô từ trái tim 45 học trò',
    imageSrc: SUNLIT_ROSES_IMAGE_SRC,
    imageAlt: 'Bình hoa hồng phấn bên khung cửa sổ nắng sớm',
  },
  {
    id: 'wish-health',
    chapter: 'Lời chúc 02 · Sức khỏe và bình an',
    title: 'Mong cô mãi rạng rỡ như đóa hồng mai',
    message:
      'Nghề giáo là nghề cao quý nhất nhưng cũng nhiều vất vả nhất. Chúng em kính chúc cô Ngô Thị Linh luôn dồi dào sức khỏe, tâm hồn luôn an yên, mỗi sớm mai thức dậy đều đón nhận thật nhiều niềm vui từ gia đình và từ những thế hệ học trò thân yêu.',
    signature: 'Kính chúc cô luôn bình an và hạnh phúc',
    imageSrc: SILK_PETALS_IMAGE_SRC,
    imageAlt: 'Những đóa mẫu đơn hồng phấn và dải lụa mềm',
  },
  {
    id: 'wish-memory',
    chapter: 'Lời chúc 03 · Kỷ niệm mái trường',
    title: 'Thanh xuân đẹp nhất là được làm học trò của cô',
    message:
      'Thời gian rồi sẽ trôi qua, chúng em rồi sẽ lớn khôn và bước ra những chân trời mới, nhưng bóng dáng cô Ngô Thị Linh dịu hiền bên bục giảng vẫn sẽ mãi là miền ký ức ấm áp nhất. Cảm ơn cô vì đã luôn bao dung và tin tưởng vào chúng em.',
    signature: 'Mãi khắc ghi công ơn dạy dỗ của cô',
    imageSrc: BOUQUET_IMAGE_SRC,
    imageAlt: 'Bó hoa hồng phấn và mẫu đơn tinh khôi',
  },
  {
    id: 'wish-passion',
    chapter: 'Lời chúc 04 · Ngọn lửa đam mê',
    title: 'Vững tay chèo đưa bao thế hệ cập bến tương lai',
    message:
      'Chúc cô Ngô Thị Linh luôn giữ trọn nhiệt huyết với sự nghiệp trồng người, gặt hái thật nhiều thành công trong công tác giảng dạy và luôn được bao bọc bởi sự kính trọng, yêu mến của đồng nghiệp cùng biết bao lứa học sinh.',
    signature: 'Chúc mừng ngày Nhà giáo Việt Nam 20/11',
    imageSrc: SUNLIT_ROSES_IMAGE_SRC,
    imageAlt: 'Hoa hồng phấn và cuốn sổ tri ân dưới nắng mai',
  },
];

export const GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    id: 'photo-1',
    title: 'Khoảnh khắc rạng rỡ bên cô',
    subtitle: 'Kỷ niệm 01 · Dấu ấn yêu thương',
    imageSrc: 'https://cdn.phototourl.com/anon/2026-11-17-349919fb-94b9-4afc-b2b1-9dc9829fc3ca.jpg',
    fallbackSrc: SUNLIT_ROSES_IMAGE_SRC,
    imageAlt: 'Khoảnh khắc kỷ niệm đáng nhớ cùng cô Ngô Thị Linh',
    wishText:
      'Chúc cô Ngô Thị Linh luôn rạng rỡ, giữ mãi nụ cười tươi tắn như nắng sớm và luôn là điểm tựa dịu dàng trong tim mỗi chúng em.',
  },
  {
    id: 'photo-2',
    title: 'Nụ cười ấm áp ngày hội trường',
    subtitle: 'Kỷ niệm 02 · Thanh xuân rực rỡ',
    imageSrc: 'https://cdn.phototourl.com/anon/2026-11-16-54ba6964-186c-40cf-a557-d4d427814c9f.jpg',
    fallbackSrc: SILK_PETALS_IMAGE_SRC,
    imageAlt: 'Hình ảnh kỷ niệm trân quý ngày 20-11 của cô Ngô Thị Linh',
    wishText:
      'Cảm ơn cô đã kiên nhẫn lắng nghe, đồng hành cùng 45 cá tính khác nhau để dệt nên một tập thể gắn kết và đầy ắp tiếng cười.',
  },
  {
    id: 'photo-3',
    title: 'Sắc hồng phấn dâng tặng cô',
    subtitle: 'Kỷ niệm 03 · Tri ân 20/11',
    imageSrc: BOUQUET_IMAGE_SRC,
    fallbackSrc: BOUQUET_IMAGE_SRC,
    imageAlt: 'Bó hoa hồng phấn dành tặng cô Ngô Thị Linh',
    wishText:
      'Mỗi cánh hoa hồng phấn là một lời cảm ơn chân thành gửi đến cô. Chúc cô một mùa Hiến chương thật ấm áp, trọn vẹn niềm vui và bình an.',
  },
  {
    id: 'photo-4',
    title: 'Trang vở và hương hoa sớm mai',
    subtitle: 'Kỷ niệm 04 · Hành trang trưởng thành',
    imageSrc: SUNLIT_ROSES_IMAGE_SRC,
    fallbackSrc: SUNLIT_ROSES_IMAGE_SRC,
    imageAlt: 'Hoa hồng phấn bên bàn giáo án nắng sớm',
    wishText:
      'Dù mai này mỗi người đi một ngả, những bài học từ cô Ngô Thị Linh sẽ mãi là ánh sáng nâng bước chúng em trên mọi nẻo đường.',
  },
];

export const FINALE_TRIBUTE_WISH =
  'Chúc mừng ngày Nhà giáo Việt Nam 20/11! Kính chúc cô Ngô Thị Linh mãi mãi hạnh phúc, khỏe mạnh và tỏa sáng cùng tình yêu thương của 45 học trò.';

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'track-1',
    label: 'Bài 1',
    title: 'Bụi Phấn · Khúc Tri Ân',
    artist: 'Nhạc nền 20/11 (bai1.mp3)',
    src: './bai1.mp3',
    durationSeconds: 48,
    lyrics: [
      { time: 0, text: 'Khi thầy viết bảng, bụi phấn rơi rơi...' },
      { time: 6, text: 'Có hạt bụi nào rơi trên bục giảng...' },
      { time: 12, text: 'Có hạt bụi nào vương trên tóc cô...' },
      { time: 18, text: 'Em yêu phút giây này, cô em tóc như bạc thêm...' },
      { time: 24, text: 'Bạc thêm vì bụi phấn, để cho em bài học hay...' },
      { time: 30, text: 'Mai sau lớn nên người, làm sao có thể nào quên...' },
      { time: 36, text: 'Ngày xưa cô dạy dỗ, khi em tuổi còn thơ...' },
      { time: 42, text: 'Kính dâng cô Ngô Thị Linh ngàn lời tri ân 20/11.' },
    ],
  },
  {
    id: 'track-2',
    label: 'Bài 2',
    title: 'Người Thầy · Mái Trường Mến Yêu',
    artist: 'Nhạc nền 20/11 (bai2.mp3)',
    src: './bai2.mp3',
    durationSeconds: 48,
    lyrics: [
      { time: 0, text: 'Người cô vẫn lặng lẽ đi về sớm trưa...' },
      { time: 6, text: 'Từng ngày giọt mồ hôi rơi nhòe trang giấy...' },
      { time: 12, text: 'Để em đến bên bờ ước mơ...' },
      { time: 18, text: 'Dẫu năm tháng vô tình trôi mãi mãi...' },
      { time: 24, text: 'Có hay bao mùa lá rơi, cô vẫn đứng nơi đây...' },
      { time: 30, text: 'Chờ đàn em nhỏ bước qua dòng sông tri thức...' },
      { time: 36, text: 'Dòng sông xanh tuổi thơ, sáng mãi trong tim chúng em...' },
      { time: 42, text: '45 học trò thương chúc cô Ngô Thị Linh luôn bình an.' },
    ],
  },
];

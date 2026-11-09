// Ứng dụng Quản lý Phòng trọ - Modern Rental Management System
const { createApp, ref, computed, onMounted, watch } = Vue;

// Danh sách ngân hàng phổ biến hỗ trợ VietQR
const POPULAR_BANKS = [
  { bin: '970422', code: 'MB', name: 'MBBank - Ngân hàng Quân Đội' },
  { bin: '970436', code: 'VCB', name: 'Vietcombank - Ngoại thương VN' },
  { bin: '970407', code: 'TCB', name: 'Techcombank - Kỹ thương VN' },
  { bin: '970415', code: 'CTG', name: 'VietinBank - Công thương VN' },
  { bin: '970418', code: 'BIDV', name: 'BIDV - Đầu tư & Phát triển' },
  { bin: '970416', code: 'ACB', name: 'ACB - Ngân hàng Á Châu' },
  { bin: '970432', code: 'VPB', name: 'VPBank - Việt Nam Thịnh Vượng' },
  { bin: '970423', code: 'TPB', name: 'TPBank - Tiên Phong' },
  { bin: '970403', code: 'STB', name: 'Sacombank - Sài Gòn Thương Tín' },
  { bin: '970405', code: 'VBA', name: 'Agribank - Nông nghiệp VN' },
  { bin: '970441', code: 'VIB', name: 'VIB - Quốc tế' },
  { bin: '970448', code: 'OCB', name: 'OCB - Phương Đông' }
];

// Danh sách tiện ích phòng gợi ý
const POPULAR_AMENITIES = [
  'Máy lạnh', 'Nóng lạnh', 'Tủ lạnh', 'Máy giặt', 'Gác lửng', 
  'Ban công', 'Kệ bếp', 'Giường nệm', 'Tủ quần áo', 'Bàn làm việc', 'Cửa sổ thoáng'
];

// Dữ liệu mẫu khởi tạo
const DEFAULT_SAMPLE_DATA = {
  settings: {
    houseName: 'Nhà Trọ Xanh (Eco House)',
    address: '168 Đường Số 10, Linh Trung, TP. Thủ Đức, TP. Hồ Chí Minh',
    phone: '0908 123 456',
    bankBin: '970422',
    bankCode: 'MB',
    bankAccount: '0908123456',
    accountHolder: 'NGUYEN VAN CHU TRO',
    defaultPrices: {
      electricPrice: 3500, // 3.500đ / kWh
      waterPrice: 20000,   // 20.000đ / khối
      internetPrice: 80000,// 80.000đ / phòng
      trashPrice: 30000,   // 30.000đ / phòng
      servicePrice: 0      // phí dịch vụ khác nếu có
    }
  },
  rooms: [
    {
      id: 'R101',
      name: 'Phòng 101',
      floor: 1,
      price: 3200000,
      deposit: 3200000,
      maxTenants: 2,
      area: 24,
      amenities: ['Máy lạnh', 'Nóng lạnh', 'Gác lửng', 'Kệ bếp', 'Tủ quần áo'],
      status: 'occupied',
      currentElectric: 450,
      currentWater: 65,
      note: 'Gần cửa ra vào, có cửa sổ thoáng mát, ban công phơi đồ',
      images: [
        {
          id: 'img_101_1',
          url: 'vendor/demo-room-1.jpg',
          caption: 'Không gian phòng ngủ có cửa sổ đón nắng',
          createdAt: '2026-11-01'
        },
        {
          id: 'img_101_2',
          url: 'vendor/demo-room-2.jpg',
          caption: 'Khu vực bếp nấu ăn sạch sẽ',
          createdAt: '2026-11-01'
        }
      ]
    },
    {
      id: 'R102',
      name: 'Phòng 102',
      floor: 1,
      price: 3000000,
      deposit: 3000000,
      maxTenants: 2,
      area: 22,
      amenities: ['Máy lạnh', 'Gác lửng', 'Kệ bếp'],
      status: 'occupied',
      currentElectric: 280,
      currentWater: 42,
      note: 'Dãy tầng 1, thuận tiện đi lại, xe máy để trước cửa',
      images: [
        {
          id: 'img_102_1',
          url: 'vendor/demo-room-3.jpg',
          caption: 'Phòng studio tầng 1 thoáng sáng',
          createdAt: '2026-11-02'
        }
      ]
    },
    {
      id: 'R201',
      name: 'Phòng 201',
      floor: 2,
      price: 3500000,
      deposit: 3500000,
      maxTenants: 3,
      area: 28,
      amenities: ['Máy lạnh', 'Nóng lạnh', 'Tủ lạnh', 'Gác lửng', 'Ban công', 'Kệ bếp'],
      status: 'occupied',
      currentElectric: 615,
      currentWater: 88,
      note: 'Có ban công rộng phơi đồ, view thoáng mát đón gió',
      images: [
        {
          id: 'img_201_1',
          url: 'vendor/demo-room-4.jpg',
          caption: 'Căn hộ dịch vụ ban công tầng 2',
          createdAt: '2026-11-03'
        },
        {
          id: 'img_201_2',
          url: 'vendor/demo-room-5.jpg',
          caption: 'Ban công rộng rãi hướng Đông Nam',
          createdAt: '2026-11-03'
        }
      ]
    },
    {
      id: 'R202',
      name: 'Phòng 202',
      floor: 2,
      price: 3200000,
      deposit: 3200000,
      maxTenants: 2,
      area: 25,
      amenities: ['Máy lạnh', 'Nóng lạnh', 'Gác lửng', 'Kệ bếp'],
      status: 'available',
      currentElectric: 110,
      currentWater: 15,
      note: 'Vừa sơn sửa lại sạch đẹp, sẵn sàng đón khách vào ở ngay',
      images: [
        {
          id: 'img_202_1',
          url: 'vendor/demo-room-6.jpg',
          caption: 'Phòng vừa sơn sửa mới 100%',
          createdAt: '2026-11-05'
        }
      ]
    },
    {
      id: 'R301',
      name: 'Phòng 301',
      floor: 3,
      price: 2800000,
      deposit: 2800000,
      maxTenants: 2,
      area: 20,
      amenities: ['Gác lửng', 'Kệ bếp', 'Quạt trần'],
      status: 'available',
      currentElectric: 85,
      currentWater: 10,
      note: 'Phòng tầng 3 yên tĩnh, thích hợp sinh viên hoặc người làm việc từ xa',
      images: [
        {
          id: 'img_301_1',
          url: 'vendor/demo-room-7.jpg',
          caption: 'Không gian phòng tầng 3 yên tĩnh',
          createdAt: '2026-11-06'
        }
      ]
    },
    {
      id: 'R302',
      name: 'Phòng 302',
      floor: 3,
      price: 3400000,
      deposit: 3400000,
      maxTenants: 3,
      area: 26,
      amenities: ['Máy lạnh', 'Nóng lạnh', 'Gác lửng', 'Ban công'],
      status: 'maintenance',
      currentElectric: 320,
      currentWater: 40,
      note: 'Đang bảo dưỡng hệ thống điều hòa và kiểm tra chống thấm',
      images: [
        {
          id: 'img_302_1',
          url: 'vendor/demo-room-8.jpg',
          caption: 'Hiện trạng phòng trước khi sửa chữa',
          createdAt: '2026-11-07'
        }
      ]
    }
  ],
  tenants: [
    {
      id: 'T101',
      roomId: 'R101',
      fullName: 'Trần Văn Minh',
      phone: '0912 345 678',
      idCard: '079201004561',
      hometown: 'Đồng Nai',
      birthDate: '2001-05-15',
      vehiclePlate: '60-B2 456.78',
      startDate: '2026-02-01',
      deposit: 3200000,
      isRepresentative: true,
      note: 'Kỹ sư phần mềm, đi làm văn phòng',
      status: 'active'
    },
    {
      id: 'T102',
      roomId: 'R101',
      fullName: 'Lê Hoàng Nam',
      phone: '0988 234 567',
      idCard: '079202008922',
      hometown: 'Bình Phước',
      birthDate: '2001-08-20',
      vehiclePlate: '93-P1 987.65',
      startDate: '2026-02-01',
      deposit: 0,
      isRepresentative: false,
      note: 'Ở ghép cùng bạn Minh',
      status: 'active'
    },
    {
      id: 'T201',
      roomId: 'R102',
      fullName: 'Nguyễn Thị Thu Thảo',
      phone: '0977 112 233',
      idCard: '072199003344',
      hometown: 'Tiền Giang',
      birthDate: '1999-11-12',
      vehiclePlate: '63-B9 112.23',
      startDate: '2026-03-10',
      deposit: 3000000,
      isRepresentative: true,
      note: 'Nhân viên kế toán',
      status: 'active'
    },
    {
      id: 'T301',
      roomId: 'R201',
      fullName: 'Võ Minh Quân',
      phone: '0933 889 900',
      idCard: '048200001234',
      hometown: 'Đà Nẵng',
      birthDate: '2000-03-25',
      vehiclePlate: '43-C1 567.89',
      startDate: '2026-01-05',
      deposit: 3500000,
      isRepresentative: true,
      note: 'Chuyên viên Marketing',
      status: 'active'
    }
  ],
  invoices: [
    {
      id: 'HD-202611-101',
      roomId: 'R101',
      roomName: 'Phòng 101',
      month: '2026-11',
      createdDate: '2026-11-01',
      dueDate: '2026-11-08',
      paidDate: null,
      status: 'unpaid',
      paymentMethod: 'Chuyển khoản VietQR',
      roomPrice: 3200000,
      oldElectric: 380,
      newElectric: 450,
      electricUsage: 70,
      electricPrice: 3500,
      electricTotal: 245000,
      oldWater: 60,
      newWater: 65,
      waterUsage: 5,
      waterPrice: 20000,
      waterTotal: 100000,
      internetPrice: 80000,
      trashPrice: 30000,
      otherFee: 0,
      otherFeeReason: '',
      discount: 0,
      totalAmount: 3655000,
      note: 'Tiền phòng tháng 11/2026'
    },
    {
      id: 'HD-202611-102',
      roomId: 'R102',
      roomName: 'Phòng 102',
      month: '2026-11',
      createdDate: '2026-11-01',
      dueDate: '2026-11-08',
      paidDate: '2026-11-03',
      status: 'paid',
      paymentMethod: 'Chuyển khoản VietQR',
      roomPrice: 3000000,
      oldElectric: 220,
      newElectric: 280,
      electricUsage: 60,
      electricPrice: 3500,
      electricTotal: 210000,
      oldWater: 38,
      newWater: 42,
      waterUsage: 4,
      waterPrice: 20000,
      waterTotal: 80000,
      internetPrice: 80000,
      trashPrice: 30000,
      otherFee: 0,
      otherFeeReason: '',
      discount: 0,
      totalAmount: 3400000,
      note: 'Đã nhận chuyển khoản MBBank'
    },
    {
      id: 'HD-202611-201',
      roomId: 'R201',
      roomName: 'Phòng 201',
      month: '2026-11',
      createdDate: '2026-11-01',
      dueDate: '2026-11-08',
      paidDate: null,
      status: 'unpaid',
      paymentMethod: 'Chuyển khoản VietQR',
      roomPrice: 3500000,
      oldElectric: 520,
      newElectric: 615,
      electricUsage: 95,
      electricPrice: 3500,
      electricTotal: 332500,
      oldWater: 81,
      newWater: 88,
      waterUsage: 7,
      waterPrice: 20000,
      waterTotal: 140000,
      internetPrice: 80000,
      trashPrice: 30000,
      otherFee: 0,
      otherFeeReason: '',
      discount: 0,
      totalAmount: 4082500,
      note: 'Tiền phòng tháng 11/2026'
    }
  ]
};

// Hàm đọc số thành chữ tiếng Việt chuẩn xác
function docSoTienThanhChu(soTien) {
  if (isNaN(soTien) || soTien <= 0) return 'Không đồng';
  const ChuSo = [' không ', ' một ', ' hai ', ' ba ', ' bốn ', ' năm ', ' sáu ', ' bảy ', ' tám ', ' chín '];
  const Tien = ['', ' nghìn', ' triệu', ' tỷ', ' nghìn tỷ', ' triệu tỷ'];

  function docSoBaChuSo(baSo) {
    let tram = Math.floor(baSo / 100);
    let chuc = Math.floor((baSo % 100) / 10);
    let donvi = baSo % 10;
    let ketQua = '';

    if (tram == 0 && chuc == 0 && donvi == 0) return '';
    if (tram != 0) {
      ketQua += ChuSo[tram] + ' trăm ';
      if (chuc == 0 && donvi != 0) ketQua += ' linh ';
    }
    if (chuc != 0 && chuc != 1) {
      ketQua += ChuSo[chuc] + ' mươi';
      if (chuc == 0 && donvi != 0) ketQua += ' linh ';
    }
    if (chuc == 1) ketQua += ' mười ';
    switch (donvi) {
      case 1:
        if (chuc != 0 && chuc != 1) ketQua += ' mốt ';
        else ketQua += ChuSo[donvi];
        break;
      case 5:
        if (chuc == 0) ketQua += ChuSo[donvi];
        else ketQua += ' lăm ';
        break;
      default:
        if (donvi != 0) ketQua += ChuSo[donvi];
        break;
    }
    return ketQua;
  }

  let lan = 0;
  let i = 0;
  let so = Math.floor(soTien);
  let ketQua = '';
  let viTri = [];

  if (so < 0) return 'Số tiền âm';
  if (so > 8999999999999999) return 'Số tiền quá lớn';

  viTri[5] = Math.floor(so / 1000000000000000);
  so = so - viTri[5] * 1000000000000000;
  viTri[4] = Math.floor(so / 1000000000000);
  so = so - viTri[4] * 1000000000000;
  viTri[3] = Math.floor(so / 1000000000);
  so = so - viTri[3] * 1000000000;
  viTri[2] = Math.floor(so / 1000000);
  so = so - viTri[2] * 1000000;
  viTri[1] = Math.floor(so / 1000);
  so = so - viTri[1] * 1000;
  viTri[0] = Math.floor(so);

  if (viTri[5] > 0) lan = 5;
  else if (viTri[4] > 0) lan = 4;
  else if (viTri[3] > 0) lan = 3;
  else if (viTri[2] > 0) lan = 2;
  else if (viTri[1] > 0) lan = 1;
  else lan = 0;

  for (i = lan; i >= 0; i--) {
    let tmp = docSoBaChuSo(viTri[i]);
    ketQua += tmp;
    if (viTri[i] > 0) ketQua += Tien[i];
    if (i > 0 && tmp.length > 0) ketQua += ',';
  }

  ketQua = ketQua.replace(/  +/g, ' ').trim();
  ketQua = ketQua.replace(/,$/, '');
  ketQua = ketQua.charAt(0).toUpperCase() + ketQua.slice(1) + ' đồng';
  return ketQua;
}

// Khởi chạy ứng dụng Vue 3
createApp({
  setup() {
    // Tab đang chọn
    const activeTab = ref('dashboard');
    const apiToken = ref(localStorage.getItem('qlpt_access_token') || '');
    const currentUser = ref(null);
    const showLogin = ref(!apiToken.value);
    const isLoadingData = ref(false);
    const legacyDataAvailable = ref(false);
    const dashboardData = ref({});
    const loginForm = ref({ email: '', password: '' });
    const lastSyncedData = { settings: null, rooms: new Map(), tenants: new Map(), invoices: new Map(), contracts: new Map() };
    let syncQueue = Promise.resolve();
    let loadingFromServer = false;

    async function apiRequest(path, options = {}) {
      const headers = { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(options.headers || {}) };
      if (apiToken.value) headers.Authorization = `Bearer ${apiToken.value}`;
      const response = await fetch(`/api${path}`, { ...options, headers });
      if (response.status === 204) return null;
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(result.error || `Yêu cầu thất bại (${response.status})`);
        error.status = response.status;
        throw error;
      }
      return result;
    }

    function fileContentUrl(file) {
      if (typeof file?.url !== 'string' || !/^\/api\/files\/[^/?]+\/content\?token=/.test(file.url)) {
        throw new Error('Máy chủ không trả liên kết tệp có chữ ký hợp lệ.');
      }
      return file.url;
    }

    function cloneData(value) { return JSON.parse(JSON.stringify(value)); }
    function createUuid() { return crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }); }

    async function login() {
      try {
        const result = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(loginForm.value) });
        apiToken.value = result.token;
        localStorage.setItem('qlpt_access_token', result.token);
        currentUser.value = result.user;
        showLogin.value = false;
        await loadData();
        loginForm.value.password = '';
        showToast('Đăng nhập thành công.');
      } catch (error) {
        showToast(error.message, 'error');
      }
    }

    function logout() {
      apiToken.value = '';
      currentUser.value = null;
      localStorage.removeItem('qlpt_access_token');
      showLogin.value = true;
    }

    // Dữ liệu chính
    const settings = ref({});
    const rooms = ref([]);
    const tenants = ref([]);
    const invoices = ref([]);
    const contracts = ref([]);
    const payments = ref([]);
    const checkoutHistory = ref([]);
    const users = ref([]);
    const userForm = ref({ name: '', email: '', password: '', role: 'staff' });
    const showContractModal = ref(false);
    const isEditingContract = ref(false);
    const contractForm = ref({ id: '', roomId: '', tenantId: '', startDate: new Date().toISOString().slice(0, 10), endDate: '', rent: 0, deposit: 0, terms: '', status: 'active', contractFileId: null });
    const contractFilter = ref('active');
    const filteredContracts = computed(() => contracts.value.filter(c => contractFilter.value === 'all' || c.status === contractFilter.value));

    // Dữ liệu phụ trợ
    const popularBanks = ref(POPULAR_BANKS);
    const popularAmenities = ref(POPULAR_AMENITIES);

    // Bộ lọc & Tìm kiếm
    const roomFilterStatus = ref('all');
    const roomFilterFloor = ref('all');
    const roomSearchQuery = ref('');

    const tenantSearchQuery = ref('');
    const tenantFilterRoom = ref('all');

    const invoiceFilterStatus = ref('all');
    const currentMonth = ref(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const invoiceFilterMonth = ref(new Date().toISOString().slice(0, 7));

    // Modals state
    const showRoomModal = ref(false);
    const isEditingRoom = ref(false);
    const roomForm = ref({
      id: '',
      name: '',
      floor: 1,
      price: 3000000,
      deposit: 3000000,
      maxTenants: 2,
      area: 20,
      amenities: [],
      status: 'available',
      currentElectric: 0,
      currentWater: 0,
      note: '',
      images: []
    });

    // Modal xem chi tiết phòng & album ảnh
    const showRoomDetailModal = ref(false);
    const selectedRoomDetail = ref(null);

    // Trình xem ảnh Lightbox toàn màn hình
    const showLightbox = ref(false);
    const lightboxImages = ref([]);
    const lightboxIndex = ref(0);
    const lightboxTitle = ref('');
    const isCompressingImage = ref(false);
    const roomFileInput = ref(null);

    const showTenantModal = ref(false);
    const isEditingTenant = ref(false);
    const tenantForm = ref({
      id: '',
      roomId: '',
      fullName: '',
      phone: '',
      idCard: '',
      hometown: '',
      birthDate: '',
      vehiclePlate: '',
      startDate: new Date().toISOString().slice(0, 10),
      deposit: 0,
      isRepresentative: true,
      note: '',
      status: 'active'
    });

    const showInvoiceModal = ref(false);
    const invoiceForm = ref({
      id: '',
      roomId: '',
      month: new Date().toISOString().slice(0, 7),
      createdDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      roomPrice: 0,
      oldElectric: 0,
      newElectric: 0,
      electricPrice: 3500,
      oldWater: 0,
      newWater: 0,
      waterPrice: 20000,
      internetPrice: 80000,
      trashPrice: 30000,
      otherFee: 0,
      otherFeeReason: '',
      discount: 0,
      note: ''
    });

    // Modal xem chi tiết hóa đơn & in ấn
    const showDetailInvoiceModal = ref(false);
    const selectedInvoice = ref(null);

    // Modal trả phòng
    const showCheckoutModal = ref(false);
    const checkoutTarget = ref(null);

    // Toast thông báo
    const toastMessage = ref('');
    const toastType = ref('success'); // 'success', 'error', 'info'
    const showToastFlag = ref(false);

    function showToast(msg, type = 'success') {
      toastMessage.value = msg;
      toastType.value = type;
      showToastFlag.value = true;
      setTimeout(() => {
        showToastFlag.value = false;
      }, 3500);
    }

    // Tải dữ liệu dùng chung từ REST API/PostgreSQL sau khi đăng nhập.
    async function loadData() {
      if (!apiToken.value) { showLogin.value = true; return; }
      const wasLoading = loadingFromServer;
      isLoadingData.value = true;
      loadingFromServer = true;
      try {
        const [me, storedSettings, storedRooms, storedTenants, storedInvoices, storedContracts, storedPayments, storedCheckouts, dashboard] = await Promise.all([
          apiRequest('/auth/me'), apiRequest('/settings'), apiRequest('/rooms'), apiRequest('/tenants'), apiRequest('/invoices'), apiRequest('/contracts'), apiRequest('/payments'), apiRequest('/checkouts'), apiRequest(`/dashboard?month=${encodeURIComponent(invoiceFilterMonth.value)}`)
        ]);
        currentUser.value = me.user;
        settings.value = { houseName: '', address: '', phone: '', bankBin: '', bankCode: '', bankAccount: '', accountHolder: '', defaultPrices: { electricPrice: 3500, waterPrice: 20000, internetPrice: 80000, trashPrice: 30000, servicePrice: 0 }, ...(storedSettings || {}) };
        rooms.value = storedRooms.map(r => ({ ...r, images: Array.isArray(r.images) ? r.images : [] }));
        tenants.value = storedTenants;
        invoices.value = storedInvoices;
        contracts.value = storedContracts;
        payments.value = storedPayments;
        checkoutHistory.value = storedCheckouts;
        dashboardData.value = dashboard;
        legacyDataAvailable.value = !rooms.value.length && !tenants.value.length && !invoices.value.length && !!localStorage.getItem('QL_PHONG_TRO_DATA_V2');
        lastSyncedData.settings = cloneData(settings.value);
        for (const [key, rows] of [['rooms', rooms.value], ['tenants', tenants.value], ['invoices', invoices.value], ['contracts', contracts.value]]) {
          lastSyncedData[key] = new Map(rows.map(row => [row.id, cloneData(row)]));
        }
        showLogin.value = false;
      } catch (error) {
        if (error.status === 401) {
          localStorage.removeItem('qlpt_access_token');
          apiToken.value = '';
          currentUser.value = null;
          showLogin.value = true;
        }
        showToast(`Không tải được dữ liệu từ máy chủ: ${error.message}`, 'error');
      } finally {
        loadingFromServer = wasLoading;
        isLoadingData.value = false;
      }
    }

    // Đồng bộ thay đổi từng bản ghi qua REST API, không lưu dữ liệu nghiệp vụ trong trình duyệt.
    function saveData() {
      if (loadingFromServer || !apiToken.value || !currentUser.value) return;
      const snapshot = {
        settings: cloneData(settings.value), rooms: cloneData(rooms.value), tenants: cloneData(tenants.value),
        invoices: cloneData(invoices.value), contracts: cloneData(contracts.value)
      };
      syncQueue = syncQueue.then(async () => {
        for (const resource of ['rooms', 'tenants', 'invoices', 'contracts']) {
          const base = lastSyncedData[resource];
          const current = new Map(snapshot[resource].map(row => [row.id, row]));
          for (const [id, row] of current) {
            if (JSON.stringify(row) === JSON.stringify(base.get(id))) continue;
            const method = base.has(id) ? 'PUT' : 'POST';
            try {
              await apiRequest(`/${resource}${method === 'PUT' ? `/${encodeURIComponent(id)}` : ''}`, { method, body: JSON.stringify(row) });
              base.set(id, row);
            } catch (error) {
              showToast(`Không lưu được ${resource}: ${error.message}`, 'error');
              await loadData();
              return;
            }
          }
          for (const id of [...base.keys()]) {
            if (current.has(id)) continue;
            try { await apiRequest(`/${resource}/${encodeURIComponent(id)}`, { method: 'DELETE' }); base.delete(id); }
            catch (error) { showToast(`Không xóa được dữ liệu trên máy chủ: ${error.message}`, 'error'); await loadData(); return; }
          }
        }
        if (JSON.stringify(snapshot.settings) !== JSON.stringify(lastSyncedData.settings)) {
          try { await apiRequest('/settings', { method: 'PUT', body: JSON.stringify(snapshot.settings) }); lastSyncedData.settings = snapshot.settings; }
          catch (error) { showToast(`Không lưu được cài đặt: ${error.message}`, 'error'); await loadData(); return; }
        }
        try { dashboardData.value = await apiRequest(`/dashboard?month=${encodeURIComponent(invoiceFilterMonth.value)}`); }
        catch (error) { console.warn('Không thể làm mới thống kê:', error); }
      }).catch(error => { console.error('Lỗi đồng bộ dữ liệu:', error); showToast(error.message, 'error'); });
    }

    async function importLegacyData() {
      if (!legacyDataAvailable.value || rooms.value.length || tenants.value.length || invoices.value.length) { showToast('Chỉ có thể nhập dữ liệu cũ khi cơ sở dữ liệu đang trống.', 'error'); return; }
      if (!confirm('Nhập dữ liệu phòng trọ từ LocalStorage của trình duyệt này vào PostgreSQL? Hãy tải bản sao lưu máy chủ trước nếu đã có dữ liệu quan trọng.')) return;
      try {
        const parsed = JSON.parse(localStorage.getItem('QL_PHONG_TRO_DATA_V2') || '{}');
        if (!parsed.settings || !Array.isArray(parsed.rooms) || !Array.isArray(parsed.tenants) || !Array.isArray(parsed.invoices)) throw new Error('Dữ liệu LocalStorage cũ không đúng cấu trúc.');
        const fileMetadata = [], files = [];
        const roomsWithRemoteImages = [];
        for (const room of parsed.rooms) {
          const images = [];
          for (const image of room.images || []) {
            if (!image.url?.startsWith('data:')) { images.push(image); continue; }
            const blob = await (await fetch(image.url)).blob();
            const id = crypto.randomUUID ? crypto.randomUUID() : `legacy-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
            const ext = blob.type === 'image/png' ? '.png' : blob.type === 'image/webp' ? '.webp' : '.jpg';
            const originalName = `${(image.caption || 'anh-phong').replace(/[^\p{L}\p{N}-]/gu, '_')}${ext}`;
            fileMetadata.push({ id, originalName, objectKey: `legacy/${id}${ext}`, mimeType: blob.type || 'image/jpeg', sizeBytes: blob.size, entityType: 'room', entityId: room.id, caption: image.caption || '', uploadedAt: image.createdAt || new Date().toISOString() });
            files.push({ id, contentBase64: await blob.arrayBuffer().then(buf => { const bytes = new Uint8Array(buf); let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte); return btoa(binary); }) });
            images.push({ ...image, id, fileId: id, url: `/api/files/${id}/content` });
          }
          roomsWithRemoteImages.push({ ...room, images });
        }
        await apiRequest('/backup', { method: 'POST', body: JSON.stringify({ schemaVersion: 1, settings: parsed.settings, rooms: roomsWithRemoteImages, tenants: parsed.tenants, invoices: parsed.invoices, contracts: [], payments: [], fileMetadata, files, checkoutHistory: [], handoverRecords: [] }) });
        localStorage.removeItem('QL_PHONG_TRO_DATA_V2');
        legacyDataAvailable.value = false;
        await loadData();
        showToast('Đã nhập dữ liệu cũ vào PostgreSQL và chuyển ảnh sang MinIO.');
      } catch (error) { showToast(`Không nhập được dữ liệu cũ: ${error.message}`, 'error'); }
    }

    watch([settings, rooms, tenants, invoices, contracts], saveData, { deep: true });
    watch(invoiceFilterMonth, async month => { if (apiToken.value) { try { dashboardData.value = await apiRequest(`/dashboard?month=${encodeURIComponent(month)}`); } catch (error) { showToast(error.message, 'error'); } } });

    // Khôi phục dữ liệu mẫu
    function resetToDefaultData(notify = true) {
      if (rooms.value.length || tenants.value.length || invoices.value.length || contracts.value.length) {
        showToast('Cơ sở dữ liệu đã có dữ liệu. Hãy xuất bản sao lưu trước; không thể nạp mẫu đè lên dữ liệu hiện có.', 'error');
        return;
      }
      settings.value = JSON.parse(JSON.stringify(DEFAULT_SAMPLE_DATA.settings));
      rooms.value = JSON.parse(JSON.stringify(DEFAULT_SAMPLE_DATA.rooms));
      tenants.value = JSON.parse(JSON.stringify(DEFAULT_SAMPLE_DATA.tenants));
      invoices.value = JSON.parse(JSON.stringify(DEFAULT_SAMPLE_DATA.invoices));
      saveData();
      if (notify) {
        showToast('Đã nạp dữ liệu mẫu ban đầu thành công!');
      }
    }

    // Xóa toàn bộ dữ liệu
    async function clearAllData() {
      if (currentUser.value?.role !== 'administrator') { showToast('Chỉ quản trị viên mới được xóa dữ liệu.', 'error'); return; }
      if (confirm('CẢNH BÁO: Thao tác này sẽ xóa dữ liệu nghiệp vụ. Hãy tải bản sao lưu trước. Bạn có chắc chắn không?')) {
        try {
          await apiRequest('/data', { method: 'DELETE' });
          loadingFromServer = true;
          rooms.value = []; tenants.value = []; invoices.value = []; contracts.value = []; payments.value = [];
          for (const name of ['rooms','tenants','invoices','contracts']) lastSyncedData[name].clear();
          loadingFromServer = false;
          showToast('Đã xóa dữ liệu nghiệp vụ. Tài khoản và cài đặt được giữ lại.', 'info');
        } catch (error) { loadingFromServer = false; showToast(`Không xóa được dữ liệu: ${error.message}`, 'error'); }
      }
    }

    // Xuất file dữ liệu JSON dự phòng
    async function exportDataJSON() {
      try {
        const snapshot = await apiRequest('/backup');
        const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const downloadAnchor = document.createElement('a');
        downloadAnchor.href = url;
        downloadAnchor.download = `SaoLuu_PhongTro_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(downloadAnchor); downloadAnchor.click(); downloadAnchor.remove(); URL.revokeObjectURL(url);
        showToast('Đã xuất dữ liệu và tệp đính kèm từ máy chủ.');
      } catch (error) { showToast(`Không xuất được sao lưu: ${error.message}`, 'error'); }
    }

    // Nhập file dữ liệu JSON
    function importDataJSON(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          if (!parsed.rooms || !parsed.settings || !Array.isArray(parsed.rooms) || !Array.isArray(parsed.tenants || []) || !Array.isArray(parsed.invoices || [])) { showToast('File JSON không đúng cấu trúc ứng dụng!', 'error'); return; }
          if (!confirm('Khôi phục sẽ thay thế dữ liệu nghiệp vụ hiện có, bao gồm hóa đơn, lịch sử thanh toán và tệp. Bạn đã tải bản sao lưu hiện tại và muốn tiếp tục chứ?')) return;
          apiRequest('/backup', { method: 'POST', body: JSON.stringify(parsed) })
            .then(async () => { await loadData(); showToast('Đã khôi phục dữ liệu và tệp đính kèm.'); })
            .catch(err => showToast(`Không khôi phục được dữ liệu: ${err.message}`, 'error'));
        } catch (err) {
          showToast('Lỗi khi đọc file sao lưu!', 'error');
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    }

    // Định dạng tiền tệ VND
    function formatCurrency(amount) {
      if (!amount && amount !== 0) return '0 đ';
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    }

    // Định dạng ngày tháng
    function formatDate(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('vi-VN');
    }

    // ==========================================
    // COMPUTED STATS (THỐNG KÊ TỔNG QUAN)
    // ==========================================
    const stats = computed(() => {
      const totalRooms = dashboardData.value.total ?? rooms.value.length;
      const occupiedRooms = dashboardData.value.occupied ?? rooms.value.filter(r => r.status === 'occupied').length;
      const availableRooms = dashboardData.value.available ?? rooms.value.filter(r => r.status === 'available').length;
      const maintenanceRooms = dashboardData.value.maintenance ?? rooms.value.filter(r => r.status === 'maintenance').length;
      const occupancyRate = dashboardData.value.occupancyRate ?? (totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0);

      const activeTenantsCount = dashboardData.value.activeTenantsCount ?? tenants.value.filter(t => t.status === 'active').length;

      // Doanh thu theo tháng đang xem
      const monthInvoices = invoices.value.filter(inv => inv.month === invoiceFilterMonth.value);
      const expectedRevenue = dashboardData.value.month === invoiceFilterMonth.value ? dashboardData.value.expectedRevenue : monthInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
      const collectedRevenue = dashboardData.value.month === invoiceFilterMonth.value ? dashboardData.value.collectedRevenue : monthInvoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
      const debtRevenue = dashboardData.value.month === invoiceFilterMonth.value ? dashboardData.value.debtRevenue : expectedRevenue - collectedRevenue;

      // Danh sách hóa đơn chưa thanh toán
      const unpaidInvoicesList = invoices.value.filter(inv => inv.status !== 'paid');

      return {
        totalRooms,
        occupiedRooms,
        availableRooms,
        maintenanceRooms,
        occupancyRate,
        activeTenantsCount,
        expectedRevenue,
        collectedRevenue,
        debtRevenue,
        unpaidCount: unpaidInvoicesList.length,
        unpaidInvoicesList,
        upcomingInvoicesList: dashboardData.value.upcomingInvoices || []
      };
    });

    // Danh sách tầng hiện có để lọc
    const availableFloors = computed(() => {
      const floors = new Set(rooms.value.map(r => r.floor));
      return Array.from(floors).sort((a, b) => a - b);
    });

    // Lọc danh sách phòng
    const filteredRooms = computed(() => {
      return rooms.value.filter(room => {
        const matchesStatus = roomFilterStatus.value === 'all' || room.status === roomFilterStatus.value;
        const matchesFloor = roomFilterFloor.value === 'all' || room.floor.toString() === roomFilterFloor.value.toString();
        const matchesQuery = !roomSearchQuery.value || room.name.toLowerCase().includes(roomSearchQuery.value.toLowerCase().trim());
        return matchesStatus && matchesFloor && matchesQuery;
      });
    });

    // Lọc danh sách khách thuê
    const filteredTenants = computed(() => {
      return tenants.value.filter(tenant => {
        if (tenant.status !== 'active') return false;
        const matchesRoom = tenantFilterRoom.value === 'all' || tenant.roomId === tenantFilterRoom.value;
        const query = tenantSearchQuery.value.toLowerCase().trim();
        const matchesQuery = !query || 
          tenant.fullName.toLowerCase().includes(query) ||
          tenant.phone.includes(query) ||
          tenant.idCard.includes(query) ||
          getRoomName(tenant.roomId).toLowerCase().includes(query);
        return matchesRoom && matchesQuery;
      });
    });

    // Lọc danh sách hóa đơn
    const filteredInvoices = computed(() => {
      return invoices.value.filter(inv => {
        const matchesMonth = !invoiceFilterMonth.value || inv.month === invoiceFilterMonth.value;
        const matchesStatus = invoiceFilterStatus.value === 'all' || (invoiceFilterStatus.value === 'unpaid' && inv.status !== 'paid') || inv.status === invoiceFilterStatus.value;
        return matchesMonth && matchesStatus;
      }).sort((a, b) => (b.month || '').localeCompare(a.month || '') || (b.createdDate || '').localeCompare(a.createdDate || '') || b.id.localeCompare(a.id));
    });

    // ==========================================
    // ROOM HELPERS & ACTIONS
    // ==========================================
    function getRoom(id) {
      return rooms.value.find(r => r.id === id);
    }

    function getRoomName(id) {
      const r = getRoom(id);
      return r ? r.name : 'Chưa xếp phòng';
    }

    function getTenantsInRoom(roomId) {
      return tenants.value.filter(t => t.roomId === roomId && t.status === 'active');
    }

    function getRepresentativeTenant(roomId) {
      const activeTenants = getTenantsInRoom(roomId);
      return activeTenants.find(t => t.isRepresentative) || activeTenants[0] || null;
    }

    // ==========================================
    // QUẢN LÝ ẢNH & GHI CHÚ PHÒNG TRỌ
    // ==========================================

    // Nén ảnh bằng Canvas HTML5 để lưu trữ tối ưu trong LocalStorage
    function compressImage(file, maxWidth = 1000, maxHeight = 1000, quality = 0.78) {
      return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
          return reject(new Error('Vui lòng chọn file hình ảnh hợp lệ'));
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            let w = img.width;
            let h = img.height;
            if (w > h) {
              if (w > maxWidth) {
                h = Math.round((h * maxWidth) / w);
                w = maxWidth;
              }
            } else {
              if (h > maxHeight) {
                w = Math.round((w * maxHeight) / h);
                h = maxHeight;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(dataUrl);
          };
          img.onerror = () => reject(new Error('Không thể đọc dữ liệu hình ảnh'));
          img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Lỗi khi đọc file ảnh'));
        reader.readAsDataURL(file);
      });
    }

    async function handleRoomImageFiles(files) {
      if (!files || files.length === 0) return;
      if (!roomForm.value.images) roomForm.value.images = [];

      isCompressingImage.value = true;
      let count = 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const compressedDataUrl = await compressImage(file);
          const rawName = file.name ? file.name.replace(/\.[^/.]+$/, "") : `Ảnh ${roomForm.value.images.length + 1}`;
          const form = new FormData();
          const imageBlob = await (await fetch(compressedDataUrl)).blob();
          form.append('file', imageBlob, `${rawName || 'anh-phong'}.jpg`);
          form.append('entityType', 'room');
          form.append('entityId', roomForm.value.id);
          form.append('caption', rawName);
          const uploaded = await apiRequest('/files', { method: 'POST', body: form });
          roomForm.value.images.push({
            id: uploaded.id,
            fileId: uploaded.id,
            url: fileContentUrl(uploaded),
            caption: rawName,
            createdAt: uploaded.uploadedAt || new Date().toISOString().slice(0, 10)
          });
          count++;
        } catch (err) {
          console.warn('Lỗi xử lý ảnh:', err);
          showToast(`Không tải được ảnh lên MinIO: ${err.message}`, 'error');
        }
      }
      isCompressingImage.value = false;
      if (count > 0) {
        showToast(`Đã thêm ${count} ảnh vào ghi chú phòng!`);
      }
    }

    function onRoomImageSelect(event) {
      const files = event.target.files;
      if (files && files.length > 0) {
        handleRoomImageFiles(files);
      }
      event.target.value = '';
    }

    function handleRoomFormDrop(event) {
      event.preventDefault();
      const dt = event.dataTransfer;
      if (dt && dt.files && dt.files.length > 0) {
        handleRoomImageFiles(dt.files);
      }
    }

    function handleRoomFormPaste(event) {
      const items = (event.clipboardData || event.originalEvent?.clipboardData)?.items;
      if (!items) return;
      const imageFiles = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type && items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        event.preventDefault();
        handleRoomImageFiles(imageFiles);
        showToast('Đã dán ảnh từ Clipboard (Ctrl+V) thành công!');
      }
    }

    async function removeRoomImage(index) {
      if (!roomForm.value.images) return;
      const image = roomForm.value.images[index];
      if (image?.fileId) {
        try { await apiRequest(`/files/${image.fileId}`, { method: 'DELETE' }); }
        catch (error) { showToast(`Không xóa được ảnh trên MinIO: ${error.message}`, 'error'); return; }
      }
      roomForm.value.images.splice(index, 1);
      showToast('Đã xóa ảnh khỏi phòng');
    }

    function setAsCoverImage(index) {
      if (!roomForm.value.images || index <= 0) return;
      const img = roomForm.value.images.splice(index, 1)[0];
      roomForm.value.images.unshift(img);
      showToast('Đã đặt làm ảnh chính của phòng!');
    }

    function addRoomImageUrl() {
      const url = prompt('Nhập đường dẫn (URL) hình ảnh phòng:');
      if (url && url.trim()) {
        if (!roomForm.value.images) roomForm.value.images = [];
        roomForm.value.images.push({
          id: 'img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          url: url.trim(),
          caption: '',
          createdAt: new Date().toISOString().slice(0, 10)
        });
        showToast('Đã thêm ảnh từ liên kết thành công!');
      }
    }

    function openRoomDetailModal(room) {
      selectedRoomDetail.value = room;
      showRoomDetailModal.value = true;
    }

    function openLightbox(images, startIndex = 0, title = '') {
      if (!images || images.length === 0) return;
      lightboxImages.value = images.map((img, idx) => {
        if (typeof img === 'string') {
          return { url: img, caption: `Ảnh ${idx + 1}` };
        }
        return { url: img.url, caption: img.caption || `Ảnh ${idx + 1}`, createdAt: img.createdAt };
      });
      lightboxIndex.value = Math.max(0, Math.min(startIndex, lightboxImages.value.length - 1));
      lightboxTitle.value = title ? `Phòng ${title}` : 'Ảnh phòng trọ';
      showLightbox.value = true;
    }

    function closeLightbox() {
      showLightbox.value = false;
    }

    function lightboxNext() {
      if (lightboxImages.value.length <= 1) return;
      lightboxIndex.value = (lightboxIndex.value + 1) % lightboxImages.value.length;
    }

    function lightboxPrev() {
      if (lightboxImages.value.length <= 1) return;
      lightboxIndex.value = (lightboxIndex.value - 1 + lightboxImages.value.length) % lightboxImages.value.length;
    }

    function openAddRoomModal() {
      isEditingRoom.value = false;
      const nextNum = rooms.value.length + 1;
      roomForm.value = {
        id: 'R' + Date.now().toString().slice(-4),
        name: `Phòng ${nextNum < 10 ? '10' + nextNum : nextNum}`,
        floor: 1,
        price: 3000000,
        deposit: 3000000,
        maxTenants: 2,
        area: 22,
        amenities: ['Máy lạnh', 'Gác lửng', 'Kệ bếp'],
        status: 'available',
        currentElectric: 0,
        currentWater: 0,
        note: '',
        images: []
      };
      showRoomModal.value = true;
    }

    function openEditRoomModal(room) {
      isEditingRoom.value = true;
      const clone = JSON.parse(JSON.stringify(room));
      if (!clone.images) clone.images = [];
      clone.images = clone.images.map((img, i) => {
        if (typeof img === 'string') {
          return { id: 'img_' + i + '_' + Date.now(), url: img, caption: '', createdAt: new Date().toISOString().slice(0, 10) };
        }
        return img;
      });
      roomForm.value = clone;
      showRoomModal.value = true;
    }

    function saveRoom() {
      if (!roomForm.value.name) {
        showToast('Vui lòng nhập tên phòng!', 'error');
        return;
      }
      if (!roomForm.value.images) {
        roomForm.value.images = [];
      }

      if (isEditingRoom.value) {
        const index = rooms.value.findIndex(r => r.id === roomForm.value.id);
        if (index !== -1) {
          rooms.value[index] = { ...roomForm.value };
          if (selectedRoomDetail.value && selectedRoomDetail.value.id === roomForm.value.id) {
            selectedRoomDetail.value = { ...roomForm.value };
          }
          showToast('Cập nhật thông tin phòng thành công!');
        }
      } else {
        rooms.value.push({ ...roomForm.value });
        showToast('Thêm phòng mới thành công!');
      }
      showRoomModal.value = false;
    }

    function deleteRoom(room) {
      const activeTenants = getTenantsInRoom(room.id);
      if (activeTenants.length > 0) {
        showToast(`Không thể xóa phòng ${room.name} vì đang có ${activeTenants.length} người thuê!`, 'error');
        return;
      }
      if (contracts.value.some(c => c.roomId === room.id) || invoices.value.some(i => i.roomId === room.id) || checkoutHistory.value.some(c => c.roomId === room.id)) {
        showToast('Không thể xóa phòng có lịch sử hợp đồng, hóa đơn hoặc trả phòng. Hãy giữ hồ sơ để đối soát.', 'error');
        return;
      }
      if (confirm(`Bạn có chắc chắn muốn xóa "${room.name}" khỏi danh sách?`)) {
        rooms.value = rooms.value.filter(r => r.id !== room.id);
        showToast(`Đã xóa ${room.name} thành công!`);
      }
    }

    function toggleAmenity(item) {
      const idx = roomForm.value.amenities.indexOf(item);
      if (idx > -1) {
        roomForm.value.amenities.splice(idx, 1);
      } else {
        roomForm.value.amenities.push(item);
      }
    }

    // ==========================================
    // TENANT HELPERS & ACTIONS
    // ==========================================
    function openAddTenantModal(preselectedRoomId = '') {
      isEditingTenant.value = false;
      const initialDeposit = preselectedRoomId ? (getRoom(preselectedRoomId)?.deposit || 0) : 3000000;
      tenantForm.value = {
        id: 'T' + Date.now().toString().slice(-4),
        roomId: preselectedRoomId,
        fullName: '',
        phone: '',
        idCard: '',
        hometown: '',
        birthDate: '',
        vehiclePlate: '',
        startDate: new Date().toISOString().slice(0, 10),
        deposit: initialDeposit,
        isRepresentative: true,
        note: '',
        status: 'active'
      };
      showTenantModal.value = true;
    }

    function openEditTenantModal(tenant) {
      isEditingTenant.value = true;
      tenantForm.value = JSON.parse(JSON.stringify(tenant));
      showTenantModal.value = true;
    }

    function saveTenant() {
      if (!tenantForm.value.fullName || !tenantForm.value.phone) {
        showToast('Vui lòng nhập họ tên và số điện thoại khách thuê!', 'error');
        return;
      }
      if (!tenantForm.value.roomId) {
        showToast('Vui lòng chọn phòng trọ cho khách!', 'error');
        return;
      }

      if (isEditingTenant.value) {
        const index = tenants.value.findIndex(t => t.id === tenantForm.value.id);
        if (index !== -1) {
          tenants.value[index] = { ...tenantForm.value };
          showToast('Cập nhật thông tin khách thuê thành công!');
        }
      } else {
        tenants.value.push({ ...tenantForm.value });
        // Tự động chuyển trạng thái phòng sang Đang thuê
        const targetRoom = getRoom(tenantForm.value.roomId);
        if (targetRoom && targetRoom.status === 'available') {
          targetRoom.status = 'occupied';
        }
        showToast(`Đã thêm khách thuê vào ${getRoomName(tenantForm.value.roomId)} thành công!`);
      }
      showTenantModal.value = false;
    }

    function deleteTenant(tenant) {
      if (contracts.value.some(c => c.tenantId === tenant.id)) { showToast('Không thể xóa khách thuê có lịch sử hợp đồng.', 'error'); return; }
      if (confirm(`Bạn có chắc muốn xóa dữ liệu của khách ${tenant.fullName}?`)) {
        tenants.value = tenants.value.filter(t => t.id !== tenant.id);
        // Kiểm tra xem phòng còn người không, nếu hết thì hỏi chuyển sang còn trống
        const remaining = getTenantsInRoom(tenant.roomId);
        if (remaining.length === 0) {
          const room = getRoom(tenant.roomId);
          if (room) room.status = 'available';
        }
        showToast('Đã xóa khách thuê!');
      }
    }

    function openAddContractModal(preselectedRoomId = '') {
      isEditingContract.value = false;
      const room = preselectedRoomId ? getRoom(preselectedRoomId) : rooms.value.find(r => r.status === 'available');
      contractForm.value = {
        id: `HDTH-${Date.now()}`, roomId: room?.id || '', tenantId: '',
        startDate: new Date().toISOString().slice(0, 10), endDate: '', rent: room?.price || 0,
        deposit: room?.deposit || 0, terms: '', status: 'active', contractFileId: null, handoverFileIds: [], uploadedDuringEditIds: []
      };
      showContractModal.value = true;
    }

    function openEditContractModal(contract) {
      isEditingContract.value = true;
      contractForm.value = { ...cloneData(contract), uploadedDuringEditIds: [] };
      showContractModal.value = true;
    }

    function onContractRoomChange() {
      const room = getRoom(contractForm.value.roomId);
      if (room) { contractForm.value.rent = room.price; contractForm.value.deposit = room.deposit; }
    }

    function saveContract() {
      const form = contractForm.value;
      if (!form.roomId || !form.tenantId || !form.startDate || Number(form.rent) < 0 || Number(form.deposit) < 0) {
        showToast('Vui lòng chọn phòng, khách thuê, ngày bắt đầu và số tiền hợp lệ.', 'error'); return;
      }
      if (form.endDate && form.endDate < form.startDate) { showToast('Ngày kết thúc không được trước ngày bắt đầu.', 'error'); return; }
      const existing = contracts.value.findIndex(c => c.id === form.id);
      const savedForm = { ...form };
      delete savedForm.uploadedDuringEditIds; delete savedForm.contractFileName;
      if (isEditingContract.value && existing >= 0) contracts.value.splice(existing, 1, savedForm);
      else contracts.value.unshift(savedForm);
      const tenant = tenants.value.find(t => t.id === form.tenantId);
      const room = getRoom(form.roomId);
      if (form.status === 'active') {
        if (tenant) { tenant.roomId = form.roomId; tenant.status = 'active'; tenant.startDate = form.startDate; tenant.deposit = Number(form.deposit); }
        if (room) room.status = 'occupied';
      } else if (tenant) tenant.status = 'left';
      showContractModal.value = false;
      form.uploadedDuringEditIds = [];
      showToast(isEditingContract.value ? 'Đã cập nhật hợp đồng.' : 'Đã tạo hợp đồng.');
    }

    async function cancelContract() {
      for (const id of contractForm.value.uploadedDuringEditIds || []) { try { await apiRequest(`/files/${id}`, { method: 'DELETE' }); } catch {} }
      contractForm.value.uploadedDuringEditIds = [];
      showContractModal.value = false;
    }

    function deleteContract(contract) {
      if (contract.status === 'active') { showToast('Hãy kết thúc hợp đồng trước khi xóa.', 'error'); return; }
      if (confirm(`Xóa hồ sơ hợp đồng ${contract.id}? Lịch sử thuê phòng liên quan sẽ bị ảnh hưởng.`)) {
        contracts.value = contracts.value.filter(c => c.id !== contract.id);
      }
    }

    async function uploadContractFile(event) {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      if (file.type !== 'application/pdf') { showToast('Chỉ nhận tệp PDF hợp đồng.', 'error'); return; }
      try {
        const form = new FormData();
        form.append('file', file); form.append('entityType', 'contract'); form.append('entityId', contractForm.value.id);
        const result = await apiRequest('/files', { method: 'POST', body: form });
        contractForm.value.contractFileId = result.id;
        contractForm.value.contractFileName = result.originalName;
        contractForm.value.uploadedDuringEditIds.push(result.id);
        showToast('Đã tải hợp đồng PDF lên MinIO.');
      } catch (error) { showToast(`Tải tệp thất bại: ${error.message}`, 'error'); }
    }

    async function uploadCheckinImages(event) {
      const files = Array.from(event.target.files || []); event.target.value = '';
      if (!contractForm.value.handoverFileIds) contractForm.value.handoverFileIds = [];
      for (const file of files) {
        try {
          const dataUrl = await compressImage(file);
          const blob = await (await fetch(dataUrl)).blob();
          const form = new FormData(); form.append('file', blob, file.name || 'ban-giao.jpg');
          form.append('entityType', 'checkin'); form.append('entityId', contractForm.value.id); form.append('caption', file.name || 'Ảnh bàn giao');
          const uploaded = await apiRequest('/files', { method: 'POST', body: form });
          contractForm.value.handoverFileIds.push(uploaded.id);
          contractForm.value.uploadedDuringEditIds.push(uploaded.id);
        } catch (error) { showToast(`Không tải được ảnh bàn giao: ${error.message}`, 'error'); }
      }
    }

    async function createUser() {
      try {
        await apiRequest('/users', { method: 'POST', body: JSON.stringify(userForm.value) });
        users.value = await apiRequest('/users');
        userForm.value = { name: '', email: '', password: '', role: 'staff' };
        showToast('Đã tạo tài khoản người dùng.');
      } catch (error) { showToast(`Không tạo được tài khoản: ${error.message}`, 'error'); }
    }

    async function loadUsers() {
      if (currentUser.value?.role !== 'administrator') return;
      try { users.value = await apiRequest('/users'); }
      catch (error) { showToast(`Không tải được danh sách tài khoản: ${error.message}`, 'error'); }
    }

    async function toggleUserActive(user) {
      if (user.id === currentUser.value?.id && user.active) { showToast('Không thể tự khóa tài khoản đang đăng nhập.', 'error'); return; }
      const next = !user.active;
      if (!confirm(`${next ? 'Kích hoạt' : 'Khóa'} tài khoản ${user.email}?`)) return;
      try { await apiRequest(`/users/${user.id}`, { method: 'PATCH', body: JSON.stringify({ active: next }) }); users.value = await apiRequest('/users'); showToast('Đã cập nhật tài khoản.'); }
      catch (error) { showToast(error.message, 'error'); }
    }

    // Trả phòng (Check-out)
    function openCheckoutModal(room) {
      const roomTenants = getTenantsInRoom(room.id);
      checkoutTarget.value = {
        room: room,
        tenants: roomTenants,
        id: createUuid(),
        images: [],
        totalDeposit: roomTenants.reduce((sum, t) => sum + (t.deposit || 0), 0),
        deduction: 0,
        deductionReason: '',
        refundAmount: roomTenants.reduce((sum, t) => sum + (t.deposit || 0), 0)
      };
      showCheckoutModal.value = true;
    }

    async function uploadCheckoutImages(event) {
      const files = Array.from(event.target.files || []); event.target.value = '';
      if (!checkoutTarget.value) return;
      for (const file of files) {
        try {
          const dataUrl = await compressImage(file);
          const blob = await (await fetch(dataUrl)).blob();
          const form = new FormData(); form.append('file', blob, file.name || 'tra-phong.jpg');
          form.append('entityType', 'checkout'); form.append('entityId', checkoutTarget.value.id); form.append('caption', file.name || 'Ảnh trả phòng');
          const uploaded = await apiRequest('/files', { method: 'POST', body: form });
          checkoutTarget.value.images.push({ ...uploaded, url: fileContentUrl(uploaded) });
        } catch (error) { showToast(`Không tải được ảnh trả phòng: ${error.message}`, 'error'); }
      }
    }

    async function cancelCheckout() {
      if (checkoutTarget.value?.images?.length && !confirm('Đóng phiếu trả phòng và xóa các ảnh vừa tải lên?')) return;
      for (const image of checkoutTarget.value?.images || []) { try { await apiRequest(`/files/${image.id}`, { method: 'DELETE' }); } catch {} }
      checkoutTarget.value = null; showCheckoutModal.value = false;
    }

    function calculateRefund() {
      if (!checkoutTarget.value) return;
      checkoutTarget.value.refundAmount = Math.max(0, checkoutTarget.value.totalDeposit - (checkoutTarget.value.deduction || 0));
    }

    async function confirmCheckout() {
      if (!checkoutTarget.value) return;
      const roomId = checkoutTarget.value.room.id;
      try {
        const result = await apiRequest('/checkout', { method: 'POST', body: JSON.stringify({
          id: checkoutTarget.value.id,
          roomId,
          tenantIds: checkoutTarget.value.tenants.map(t => t.id),
          depositTotal: Number(checkoutTarget.value.totalDeposit || 0),
          deduction: Number(checkoutTarget.value.deduction || 0),
          deductionReason: checkoutTarget.value.deductionReason || '',
          fileIds: checkoutTarget.value.images.map(image => image.id)
        }) });
        showCheckoutModal.value = false;
        showToast(`Đã lưu lịch sử trả phòng. Hoàn cọc: ${formatCurrency(result.refundAmount)}`);
        await loadData();
      } catch (error) { showToast(`Không thể hoàn tất trả phòng: ${error.message}`, 'error'); }
    }

    // ==========================================
    // INVOICE & BILLING ACTIONS
    // ==========================================
    function openCreateInvoiceModal(preselectedRoomId = '') {
      const room = preselectedRoomId ? getRoom(preselectedRoomId) : (rooms.value.find(r => r.status === 'occupied') || rooms.value[0]);
      
      if (!room) {
        showToast('Chưa có phòng nào để lập hóa đơn!', 'error');
        return;
      }

      const defaultPrices = settings.value.defaultPrices || DEFAULT_SAMPLE_DATA.settings.defaultPrices;

      // Tìm hóa đơn gần nhất của phòng này để lấy chỉ số cũ
      const roomInvoices = invoices.value.filter(i => i.roomId === room.id).sort((a, b) => (b.month || '').localeCompare(a.month || '') || (b.createdDate || '').localeCompare(a.createdDate || ''));
      const lastInv = roomInvoices[0];

      const oldE = lastInv ? lastInv.newElectric : (room.currentElectric || 0);
      const oldW = lastInv ? lastInv.newWater : (room.currentWater || 0);

      invoiceForm.value = {
        id: `HD-${currentMonth.value.replace('-', '')}-${room.name.replace(/\D/g, '') || Date.now().toString().slice(-3)}`,
        roomId: room.id,
        month: currentMonth.value,
        createdDate: new Date().toISOString().slice(0, 10),
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        roomPrice: room.price || 3000000,
        oldElectric: oldE,
        newElectric: oldE + 50, // gợi ý số mới
        electricPrice: defaultPrices.electricPrice || 3500,
        oldWater: oldW,
        newWater: oldW + 4,   // gợi ý số mới
        waterPrice: defaultPrices.waterPrice || 20000,
        internetPrice: defaultPrices.internetPrice || 80000,
        trashPrice: defaultPrices.trashPrice || 30000,
        otherFee: 0,
        otherFeeReason: '',
        discount: 0,
        note: `Tiền phòng ${room.name} tháng ${invoiceForm.value ? currentMonth.value : ''}`
      };
      showInvoiceModal.value = true;
    }

    // Tự động cập nhật thông tin khi đổi phòng trong Form Hóa đơn
    function onInvoiceRoomChange() {
      const room = getRoom(invoiceForm.value.roomId);
      if (!room) return;
      invoiceForm.value.roomPrice = room.price;

      const roomInvoices = invoices.value.filter(i => i.roomId === room.id).sort((a, b) => (b.month || '').localeCompare(a.month || '') || (b.createdDate || '').localeCompare(a.createdDate || ''));
      const lastInv = roomInvoices[0];

      invoiceForm.value.oldElectric = lastInv ? lastInv.newElectric : (room.currentElectric || 0);
      invoiceForm.value.newElectric = invoiceForm.value.oldElectric + 50;
      invoiceForm.value.oldWater = lastInv ? lastInv.newWater : (room.currentWater || 0);
      invoiceForm.value.newWater = invoiceForm.value.oldWater + 4;
      invoiceForm.value.note = `Tiền phòng ${room.name} tháng ${invoiceForm.value.month}`;
    }

    // Tính toán tức thì các mục trong Hóa đơn đang lập
    const invoicePreview = computed(() => {
      const form = invoiceForm.value;
      const electricUsage = Math.max(0, (form.newElectric || 0) - (form.oldElectric || 0));
      const electricTotal = electricUsage * (form.electricPrice || 0);

      const waterUsage = Math.max(0, (form.newWater || 0) - (form.oldWater || 0));
      const waterTotal = waterUsage * (form.waterPrice || 0);

      const subTotal = (form.roomPrice || 0) + electricTotal + waterTotal + (form.internetPrice || 0) + (form.trashPrice || 0) + (form.otherFee || 0);
      const totalAmount = Math.max(0, subTotal - (form.discount || 0));

      return {
        electricUsage,
        electricTotal,
        waterUsage,
        waterTotal,
        totalAmount
      };
    });

    function saveInvoice() {
      const form = invoiceForm.value;
      const room = getRoom(form.roomId);

      if (!room) {
        showToast('Vui lòng chọn phòng trọ!', 'error');
        return;
      }
      if (form.newElectric < form.oldElectric) {
        showToast('Chỉ số điện mới không thể nhỏ hơn chỉ số điện cũ!', 'error');
        return;
      }
      if (form.newWater < form.oldWater) {
        showToast('Chỉ số nước mới không thể nhỏ hơn chỉ số nước cũ!', 'error');
        return;
      }

      // Kiểm tra trùng lặp hóa đơn tháng này
      const exists = invoices.value.find(i => i.roomId === form.roomId && i.month === form.month);
      if (exists) {
        if (exists.status === 'paid' || exists.status === 'partial') {
          showToast('Không thể ghi đè hóa đơn đã có lịch sử thanh toán.', 'error');
          return;
        }
        if (!confirm(`Hóa đơn cho ${room.name} trong tháng ${form.month} đã tồn tại! Bạn có muốn ghi đè không?`)) {
          return;
        }
      }

      const newInv = {
        id: exists?.id || form.id || `HD-${form.month.replace('-', '')}-${form.roomId}`,
        roomId: form.roomId,
        roomName: room.name,
        month: form.month,
        createdDate: form.createdDate,
        dueDate: form.dueDate,
        paidDate: null,
        status: 'unpaid',
        paymentMethod: 'Chuyển khoản VietQR',
        roomPrice: form.roomPrice,
        oldElectric: form.oldElectric,
        newElectric: form.newElectric,
        electricUsage: invoicePreview.value.electricUsage,
        electricPrice: form.electricPrice,
        electricTotal: invoicePreview.value.electricTotal,
        oldWater: form.oldWater,
        newWater: form.newWater,
        waterUsage: invoicePreview.value.waterUsage,
        waterPrice: form.waterPrice,
        waterTotal: invoicePreview.value.waterTotal,
        internetPrice: form.internetPrice,
        trashPrice: form.trashPrice,
        otherFee: form.otherFee || 0,
        otherFeeReason: form.otherFeeReason || '',
        discount: form.discount || 0,
        totalAmount: invoicePreview.value.totalAmount,
        note: form.note || ''
      };

      // Cập nhật chỉ số điện nước hiện tại của phòng
      room.currentElectric = form.newElectric;
      room.currentWater = form.newWater;

      if (exists) invoices.value.splice(invoices.value.findIndex(i => i.id === exists.id), 1, newInv);
      else invoices.value.unshift(newInv);
      showToast(`Đã tạo hóa đơn ${newInv.id} cho ${room.name} thành công!`);
      showInvoiceModal.value = false;

      // Mở modal xem và in ngay cho tiện
      viewInvoiceDetail(newInv);
    }

    function markInvoiceAsPaid(invoice) {
      apiRequest(`/payments?invoiceId=${encodeURIComponent(invoice.id)}`).then(rows => {
        const alreadyPaid = rows.reduce((sum, payment) => sum + Number(payment.amount), 0);
        const amount = Number(invoice.totalAmount) - alreadyPaid;
        if (amount <= 0) { showToast('Hóa đơn đã được thanh toán đủ.', 'info'); return; }
        const method = prompt('Phương thức thanh toán (cash/bank/other):', 'bank');
        if (method === null) return;
        return apiRequest('/payments', { method: 'POST', body: JSON.stringify({ invoiceId: invoice.id, amount, method }) });
      }).then(payment => {
        if (!payment) return;
        invoice.status = 'paid';
        invoice.paidDate = new Date().toISOString().slice(0, 10);
        payments.value.unshift(payment);
        showToast(`Đã ghi nhận khoản thanh toán ${invoice.roomName}.`);
        if (window.confetti) window.confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      }).catch(error => showToast(`Không ghi nhận được thanh toán: ${error.message}`, 'error'));
    }

    function markInvoiceAsUnpaid(invoice) {
      showToast('Hóa đơn có lịch sử thanh toán không thể tự chuyển về chưa thanh toán. Hãy lập giao dịch hoàn tiền có chứng từ.', 'error');
    }

    function deleteInvoice(invoice) {
      if (payments.value.some(p => p.invoiceId === invoice.id)) { showToast('Không thể xóa hóa đơn có lịch sử thanh toán.', 'error'); return; }
      if (confirm(`Bạn có chắc muốn xóa hóa đơn "${invoice.id}" của ${invoice.roomName}?`)) {
        invoices.value = invoices.value.filter(i => i.id !== invoice.id);
        showToast('Đã xóa hóa đơn!');
      }
    }

    // Xem chi tiết hóa đơn & chuẩn bị in / VietQR
    function viewInvoiceDetail(invoice) {
      selectedInvoice.value = invoice;
      showDetailInvoiceModal.value = true;
    }

    // Link mã QR thanh toán ngân hàng tự động (chuẩn VietQR)
    const vietQrUrl = computed(() => {
      if (!selectedInvoice.value) return '';
      const s = settings.value;
      if (!s.bankAccount || !s.bankBin) return '';
      const amount = selectedInvoice.value.totalAmount || 0;
      const desc = `${selectedInvoice.value.roomName.replace(/\s+/g, '')} ${selectedInvoice.value.month.replace('-', '')}`;
      return `https://api.vietqr.io/image/${s.bankBin}-${s.bankAccount}-compact2.jpg?amount=${amount}&addInfo=${encodeURIComponent(desc)}&accountName=${encodeURIComponent(s.accountHolder || '')}`;
    });
    const invoicePayments = computed(() => selectedInvoice.value ? payments.value.filter(p => p.invoiceId === selectedInvoice.value.id) : []);

    // In hóa đơn
    function printCurrentInvoice() {
      window.print();
    }

    // Sao chép tin nhắn Zalo gửi khách
    function copyZaloMessage(inv) {
      const rep = getRepresentativeTenant(inv.roomId);
      const repName = rep ? rep.fullName : 'bạn';
      const msg = `[THÔNG BÁO TIỀN PHÒNG]
Kính gửi: ${repName} - ${inv.roomName} (${settings.value.houseName || 'Nhà trọ'})
Kỳ đóng tiền: Tháng ${inv.month}
-------------------------
1. Tiền phòng: ${formatCurrency(inv.roomPrice)}
2. Tiền điện (${inv.oldElectric} -> ${inv.newElectric} = ${inv.electricUsage} số x ${formatCurrency(inv.electricPrice)}): ${formatCurrency(inv.electricTotal)}
3. Tiền nước (${inv.oldWater} -> ${inv.newWater} = ${inv.waterUsage} khối x ${formatCurrency(inv.waterPrice)}): ${formatCurrency(inv.waterTotal)}
4. Tiền Wifi: ${formatCurrency(inv.internetPrice)}
5. Tiền Rác & Vệ sinh: ${formatCurrency(inv.trashPrice)}
${inv.otherFee ? `6. Chi phí khác (${inv.otherFeeReason || 'Phụ thu'}): ${formatCurrency(inv.otherFee)}\n` : ''}${inv.discount ? `7. Giảm trừ: -${formatCurrency(inv.discount)}\n` : ''}-------------------------
TỔNG CỘNG: ${formatCurrency(inv.totalAmount)}
(Bằng chữ: ${docSoTienThanhChu(inv.totalAmount)})

* Hạn thanh toán: trước ngày ${formatDate(inv.dueDate)}
* STK Chuyển khoản: ${settings.value.bankAccount} (${settings.value.bankCode || 'Ngân hàng'}) - Chủ TK: ${settings.value.accountHolder}
* Nội dung CK: ${inv.roomName.replace(/\s+/g, '')} ${inv.month.replace('-', '')}
Xin cảm ơn!`;

      navigator.clipboard.writeText(msg).then(() => {
        showToast('Đã sao chép nội dung tin nhắn gửi Zalo/SMS vào bộ nhớ tạm!');
      }).catch(() => {
        showToast('Không thể sao chép văn bản!', 'error');
      });
    }

    // Lưu Cài đặt
    function saveSettings() {
      // Đồng bộ bankCode từ bankBin
      const bank = POPULAR_BANKS.find(b => b.bin === settings.value.bankBin);
      if (bank) {
        settings.value.bankCode = bank.code;
      }
      saveData();
      showToast('Đã lưu cài đặt thông tin nhà trọ thành công!');
    }

    onMounted(() => {
      loadData();
      window.addEventListener('keydown', (e) => {
        if (showLightbox.value) {
          if (e.key === 'Escape') closeLightbox();
          if (e.key === 'ArrowRight') lightboxNext();
          if (e.key === 'ArrowLeft') lightboxPrev();
        } else if (showRoomDetailModal.value && e.key === 'Escape') {
          showRoomDetailModal.value = false;
        }
      });
    });

    return {
      activeTab,
      apiToken,
      currentUser,
      showLogin,
      isLoadingData,
      legacyDataAvailable,
      dashboardData,
      loginForm,
      login,
      logout,
      loadData,
      importLegacyData,
      settings,
      rooms,
      tenants,
      invoices,
      contracts,
      payments,
      checkoutHistory,
      users,
      userForm,
      createUser,
      loadUsers,
      toggleUserActive,
      showContractModal,
      isEditingContract,
      contractForm,
      contractFilter,
      filteredContracts,
      popularBanks,
      popularAmenities,
      stats,
      availableFloors,
      filteredRooms,
      filteredTenants,
      filteredInvoices,
      roomFilterStatus,
      roomFilterFloor,
      roomSearchQuery,
      tenantSearchQuery,
      tenantFilterRoom,
      invoiceFilterStatus,
      invoiceFilterMonth,
      currentMonth,

      // Modals
      showRoomModal,
      isEditingRoom,
      roomForm,
      showTenantModal,
      isEditingTenant,
      tenantForm,
      showInvoiceModal,
      invoiceForm,
      invoicePreview,
      showDetailInvoiceModal,
      selectedInvoice,
      showCheckoutModal,
      checkoutTarget,

      // Quản lý ảnh & Ghi chú phòng
      showRoomDetailModal,
      selectedRoomDetail,
      openRoomDetailModal,
      showLightbox,
      lightboxImages,
      lightboxIndex,
      lightboxTitle,
      openLightbox,
      closeLightbox,
      lightboxNext,
      lightboxPrev,
      isCompressingImage,
      roomFileInput,
      onRoomImageSelect,
      handleRoomFormDrop,
      handleRoomFormPaste,
      removeRoomImage,
      setAsCoverImage,
      addRoomImageUrl,

      // Toast
      toastMessage,
      toastType,
      showToastFlag,
      showToast,

      // Helpers
      formatCurrency,
      formatDate,
      docSoTienThanhChu,
      getRoom,
      getRoomName,
      getTenantsInRoom,
      getRepresentativeTenant,
      vietQrUrl,
      invoicePayments,

      // Actions
      openAddRoomModal,
      openEditRoomModal,
      saveRoom,
      deleteRoom,
      toggleAmenity,

      openAddTenantModal,
      openEditTenantModal,
      saveTenant,
      deleteTenant,
      openAddContractModal,
      openEditContractModal,
      saveContract,
      deleteContract,
      cancelContract,
      onContractRoomChange,
      uploadContractFile,
      uploadCheckinImages,
      openCheckoutModal,
      calculateRefund,
      confirmCheckout,
      uploadCheckoutImages,
      cancelCheckout,

      openCreateInvoiceModal,
      onInvoiceRoomChange,
      saveInvoice,
      markInvoiceAsPaid,
      markInvoiceAsUnpaid,
      deleteInvoice,
      viewInvoiceDetail,
      printCurrentInvoice,
      copyZaloMessage,

      saveSettings,
      resetToDefaultData,
      clearAllData,
      exportDataJSON,
      importDataJSON
    };
  }
}).mount('#app');

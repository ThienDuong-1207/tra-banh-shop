"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReactTable, getCoreRowModel, type ColumnDef, type ColumnSizingState, type VisibilityState } from "@tanstack/react-table";
import { supabase } from "@/lib/admin/supabaseClient";
import { Role, Product, ProductInput, PriceChangeRequest, CATEGORY_ORDER } from "@/lib/admin/types";
import { QUY_CACH_SUGGESTIONS, TY_LE_SUGGESTIONS, DVT_SUGGESTIONS, extractQuantityFromQuyCach } from "@/lib/admin/suggestionLists";
import { stripXlsxDrawings } from "@/lib/admin/stripXlsxDrawings";
import { formatDate, relativeTimeVi, downloadBlob } from "@/lib/admin/format";
import Segmented from "@/components/admin/Segmented";
import Field from "@/components/admin/Field";
import { TrashIcon } from "@/components/admin/icons";

// Lựa chọn thêm trong bộ lọc "Nhóm hàng" — mọi sản phẩm trừ Công cụ dụng cụ
// (Sales/Kế toán ít khi cần xem lẫn dụng cụ pha chế khi lọc "Tất cả").
const CATEGORY_ALL_EXCEPT_TOOLS = "Tất cả (trừ CCDC)";
const TOOLS_CATEGORY_SHEET = "Công cụ dụng cụ";

// Chỉ dùng TanStack Table để quản lý ĐỘ RỘNG (kéo giãn) từng cột của bảng
// sản phẩm — không dùng cơ chế render cell/row của nó, toàn bộ JSX từng ô
// (sửa inline, phân quyền theo role...) vẫn viết tay như cũ trong ProductRow.
// Kích thước mặc định đo lại từ dữ liệu thật (canvas measureText đúng font
// app đang dùng, lấy mốc p95 + nhãn cột) thay vì áng chừng — vài cột trước
// đây dư quá nhiều (Mã nội bộ, Đơn vị cấp 2...) trong khi Tên hóa đơn lại
// hẹp hơn hẳn nội dung thật (có dòng dài gần 200 ký tự).
const PRODUCT_COLUMNS: ColumnDef<Product, unknown>[] = [
  { id: "select", size: 36, enableResizing: false },
  { id: "photo", size: 52, enableResizing: false },
  { id: "ten_hang_hoa", size: 220, minSize: 160 },
  { id: "category_sheet", size: 180, minSize: 140 },
  { id: "ma_noi_bo", size: 130, minSize: 110 },
  { id: "ten_hoa_don", size: 260, minSize: 160 },
  { id: "dvt", size: 90, minSize: 70 },
  { id: "gia_ban", size: 130, minSize: 110 },
  { id: "gia_hop", size: 130, minSize: 100 },
  { id: "gia_thung", size: 130, minSize: 110 },
  { id: "quy_cach", size: 190, minSize: 150 },
  { id: "ty_le", size: 110, minSize: 90 },
  { id: "dvt_cap_2", size: 120, minSize: 90 },
  { id: "ty_le_cap_2", size: 120, minSize: 90 },
  { id: "brand", size: 220, minSize: 160 },
  { id: "nha_cung_cap", size: 160, minSize: 130 },
  { id: "ma_hang_hoa", size: 160, minSize: 120 },
  { id: "ma_vach", size: 170, minSize: 110 },
  { id: "ma_thung", size: 170, minSize: 120 },
  { id: "status", size: 130, minSize: 100 },
  { id: "actions", size: 120, enableResizing: false },
];

// Chế độ "Update giá" (compact) ẩn đúng nhóm cột này cùng lúc — không phải
// bật/tắt từng cột riêng, nên chỉ cần 1 checkbox điều khiển toàn bộ nhóm qua
// columnVisibility, thay vì 1 state `compactView` tách rời như trước.
const COMPACT_HIDDEN_COLUMN_IDS = [
  "category_sheet",
  "ma_noi_bo",
  "ten_hoa_don",
  "dvt",
  "gia_hop",
  "quy_cach",
  "ty_le",
  "dvt_cap_2",
  "ty_le_cap_2",
  "brand",
  "nha_cung_cap",
  "ma_hang_hoa",
  "ma_vach",
  "ma_thung",
  "status",
  "actions",
];

const COLUMN_SIZING_STORAGE_KEY = "product-table-column-sizing";

// Nhãn cột — dùng lại trong tính năng "tự vừa cột" (bấm đúp tay kéo) để đo
// độ rộng chữ thật của TIÊU ĐỀ cột, không chỉ dữ liệu — vì tiêu đề không tự
// xuống dòng (trừ 2 cột trong HEADER_WRAP_COLUMN_IDS bên dưới) nên vẫn là
// ràng buộc thật, có thể còn rộng hơn cả dữ liệu (vd "Mã hàng NCC").
const COLUMN_HEADER_LABELS: Record<string, string> = {
  ten_hang_hoa: "Tên hàng hóa",
  category_sheet: "Nhóm hàng",
  ma_noi_bo: "Mã nội bộ",
  ten_hoa_don: "Tên hóa đơn",
  dvt: "ĐVT",
  gia_ban: "Giá bán lẻ",
  gia_hop: "Giá Hộp",
  gia_thung: "Giá thùng",
  quy_cach: "Quy cách thùng",
  ty_le: "Tỷ lệ quy đổi",
  dvt_cap_2: "Đơn vị cấp 2 (Hộp)",
  ty_le_cap_2: "Tỷ lệ quy đổi cấp 2",
  brand: "Thương hiệu",
  nha_cung_cap: "Nhà cung cấp",
  ma_hang_hoa: "Mã hàng NCC",
  ma_vach: "Mã vạch",
  ma_thung: "Mã thùng",
  status: "Trạng thái",
};
// 2 cột có tiêu đề dài nhưng được phép xuống 2 dòng (.col-header-wrap trong
// CSS) — không tính độ rộng tiêu đề vào công thức tự vừa cột, chỉ tính theo
// dữ liệu thật (thường trống), nếu không sẽ mất tác dụng thu hẹp của việc
// cho xuống dòng.
const HEADER_WRAP_COLUMN_IDS = new Set(["dvt_cap_2", "ty_le_cap_2"]);

function loadStoredColumnSizing(): ColumnSizingState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(COLUMN_SIZING_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Gộp "Quản lý sản phẩm" + "Ảnh sản phẩm" — tách khỏi HomeClient.tsx (Giai
// đoạn 1 tái cấu trúc theo role, xem docs/component-conventions.md) để dùng
// lại nguyên khối này ở /admin/sale (Giai đoạn 2) mà không copy code. Tự tải
// dữ liệu riêng (products/brandNames/price_change_requests) thay vì nhận qua
// props — cùng pattern OrdersView/CustomersView đã dùng.
export default function ProductsView({ role }: { role: Role }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [brandNames, setBrandNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("Tất cả");
  const [brandFilter, setBrandFilter] = useState<string>("Tất cả");
  const [missingOnly, setMissingOnly] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  // "compactView" giờ chỉ là 1 giá trị suy ra từ columnVisibility (đại diện
  // bằng 1 cột trong nhóm bị ẩn cùng lúc) — không còn là state riêng, để
  // tránh 2 nguồn sự thật lệch nhau.
  const compactView = columnVisibility.category_sheet === false;
  const [tab, setTab] = useState<"all" | "pending" | "draft">("all");
  const [priceRequests, setPriceRequests] = useState<PriceChangeRequest[]>([]);
  const [completeDraftTarget, setCompleteDraftTarget] = useState<Product | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState<"misa" | "word" | "misa-update" | "vertical" | null>(null);
  const [exportingRollLabel, setExportingRollLabel] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [exportingQuote, setExportingQuote] = useState(false);
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [exportingInventory, setExportingInventory] = useState(false);
  const [exportingAll, setExportingAll] = useState<"category" | "brand" | "word" | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [photoUploadingId, setPhotoUploadingId] = useState<string | null>(null);
  const [missingPhotoOnly, setMissingPhotoOnly] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importOnlyNew, setImportOnlyNew] = useState(false);
  const [formTarget, setFormTarget] = useState<Product | null>(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*, brand:brands(name)")
      .order("category_sheet", { ascending: true })
      .order("ten_hang_hoa", { ascending: true });
    if (error) {
      alert("Lỗi tải dữ liệu: " + error.message);
    } else {
      setProducts(data as Product[]);
    }
    setLoading(false);
  }, []);

  const loadBrandNames = useCallback(async () => {
    const { data, error } = await supabase.from("brands").select("name").order("name");
    if (!error) setBrandNames((data ?? []).map((b) => b.name as string));
  }, []);

  // RLS already scopes this per role: sales only sees their own requests,
  // kế toán/admin sees everyone's — chỉ cần để tính badge "Vừa đề xuất giá"
  // trên từng dòng, KHÔNG dùng để duyệt/từ chối ở đây (đó là việc của
  // PriceRequestsView, vẫn nằm trong HomeClient.tsx với bản fetch riêng).
  const loadPriceRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from("price_change_requests")
      .select(
        "*, product:products(ten_hang_hoa, ma_noi_bo, gia_ban, gia_thung), proposer:profiles!price_change_requests_proposed_by_fkey(display_name, username)"
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (!error) setPriceRequests((data ?? []) as PriceChangeRequest[]);
  }, []);

  const [priceChangesThisMonth, setPriceChangesThisMonth] = useState(0);
  const loadPriceChangesThisMonth = useCallback(async () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { count, error } = await supabase
      .from("price_history")
      .select("id", { count: "exact", head: true })
      .gte("changed_at", monthStart);
    if (!error) setPriceChangesThisMonth(count ?? 0);
  }, []);

  useEffect(() => {
    loadProducts();
    loadBrandNames();
    loadPriceRequests();
    loadPriceChangesThisMonth();
  }, []);

  // Gõ được mượt ngay lập tức trong ô tìm kiếm, nhưng chỉ lọc lại danh sách
  // (và re-render toàn bộ bảng) sau khi người dùng ngừng gõ ~280ms.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 280);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) setMoreMenuOpen(false);
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) setExportMenuOpen(false);
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  const pendingIds = useMemo(
    () =>
      new Set(
        products
          .filter((p) => !p.last_exported_at || new Date(p.updated_at) > new Date(p.last_exported_at))
          .map((p) => p.id)
      ),
    [products]
  );

  const missingPhotoCount = useMemo(() => products.filter((p) => !p.photo_url).length, [products]);

  // Thống kê tháng cho thanh KPI đầu trang "Quản lý hàng hóa". monthStart
  // tính 1 lần mỗi khi products đổi (đủ dùng — không cần theo dõi realtime
  // qua nửa đêm giao tháng).
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthLabel = String(now.getMonth() + 1).padStart(2, "0");
    const newThisMonth = products.filter((p) => p.created_at && new Date(p.created_at) >= monthStart).length;
    const missingPrice = products.filter((p) => !p.gia_ban).length;
    const draftCount = products.filter((p) => p.is_draft).length;
    return { monthLabel, newThisMonth, missingPrice, draftCount };
  }, [products]);

  // Everything except the tab (Tất cả / Chờ xuất file) filter — used both to
  // build `visible` and to count each tab accurately for the CURRENT
  // category/brand/search filters, instead of showing a raw whole-catalog
  // count that doesn't match what the tab actually shows once other filters
  // are active.
  const filteredByCriteria = useMemo(() => {
    let list = products;
    if (category === CATEGORY_ALL_EXCEPT_TOOLS) list = list.filter((p) => p.category_sheet !== TOOLS_CATEGORY_SHEET);
    else if (category !== "Tất cả") list = list.filter((p) => p.category_sheet === category);
    if (brandFilter !== "Tất cả") list = list.filter((p) => p.brand?.name === brandFilter);
    if (missingOnly) list = list.filter(isMissingInfo);
    if (missingPhotoOnly) list = list.filter((p) => !p.photo_url);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.ten_hang_hoa?.toLowerCase().includes(q) ||
          p.ten_hoa_don?.toLowerCase().includes(q) ||
          p.ma_noi_bo?.toLowerCase().includes(q) ||
          p.ma_vach?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, category, brandFilter, missingOnly, missingPhotoOnly, search]);

  const visible = useMemo(() => {
    if (tab === "pending") return filteredByCriteria.filter((p) => pendingIds.has(p.id));
    if (tab === "draft") return filteredByCriteria.filter((p) => p.is_draft);
    return filteredByCriteria;
  }, [filteredByCriteria, tab, pendingIds]);

  // Phân trang bảng sản phẩm — catalog có thể lên tới hàng trăm/nghìn dòng,
  // render hết 1 lần vừa chậm vừa không cần thiết khi chỉ xem/sửa 1 khu vực.
  const PAGE_SIZE = 100;
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [tab, category, brandFilter, missingOnly, missingPhotoOnly, search]);
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedVisible = useMemo(
    () => visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [visible, currentPage]
  );

  // Kéo giãn cột bảng sản phẩm — chỉ dùng TanStack Table cho phần trạng thái
  // độ rộng cột; JSX từng ô vẫn do ProductRow tự vẽ như cũ.
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(loadStoredColumnSizing);
  useEffect(() => {
    try {
      window.localStorage.setItem(COLUMN_SIZING_STORAGE_KEY, JSON.stringify(columnSizing));
    } catch {
      // localStorage có thể bị chặn (chế độ ẩn danh...) — bỏ qua, không ảnh hưởng chức năng chính.
    }
  }, [columnSizing]);
  const productTable = useReactTable({
    data: pagedVisible,
    columns: PRODUCT_COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onChange",
    state: { columnSizing, columnVisibility },
    onColumnSizingChange: setColumnSizing,
    onColumnVisibilityChange: setColumnVisibility,
    // Ghim "Chọn" + "Ảnh" + "Tên hàng hóa" bên trái khi cuộn ngang — offset
    // (left) của từng cột tính từ độ rộng thật của các cột ghim trước đó
    // thay vì hardcode trong CSS, nên vẫn đúng nếu độ rộng cột ghim thay đổi.
    initialState: { columnPinning: { left: ["select", "photo", "ten_hang_hoa"] } },
  });
  const [productHeaderRow] = productTable.getHeaderGroups();
  const photoColumnStickyLeft = productTable.getColumn("photo")?.getStart("left") ?? 36;
  const nameColumnStickyLeft = productTable.getColumn("ten_hang_hoa")?.getStart("left") ?? 88;

  // Tự vừa cột (bấm đúp tay kéo, giống Excel) — đo độ rộng chữ THẬT bằng
  // canvas (đúng font đang render, không cần dựng thử DOM) của mọi ô đang
  // hiển thị trong cột (trang hiện tại) + nhãn cột, rồi set độ rộng vừa
  // khít. Chặn trần 460px để 1 dòng dữ liệu dị biệt không kéo giãn cả bảng.
  const measureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  function measureTextWidth(text: string, font: string): number {
    if (!text) return 0;
    if (!measureCanvasRef.current) measureCanvasRef.current = document.createElement("canvas");
    const ctx = measureCanvasRef.current.getContext("2d");
    if (!ctx) return 0;
    ctx.font = font;
    return ctx.measureText(text).width;
  }
  const CELL_AUTOFIT_BUFFER = 56; // đệm ô (padding) + đệm input/select bên trong + khoảng chừa
  const SELECT_ARROW_BUFFER = 24; // <select> cần thêm chỗ cho mũi tên xổ xuống, không tính chung với input/text
  const HEADER_AUTOFIT_BUFFER = 40;
  function autoFitColumn(columnId: string) {
    const scrollEl = tableScrollRef.current;
    if (!scrollEl) return;
    const cells = scrollEl.querySelectorAll(`tbody [data-col-id="${columnId}"]`);
    let maxContentWidth = 0;
    let hasSelect = false;
    cells.forEach((cell) => {
      const select = cell.querySelector("select");
      const input = cell.querySelector("input");
      let text = "";
      let el: Element = cell;
      if (select) {
        text = select.options[select.selectedIndex]?.text ?? "";
        el = select;
        hasSelect = true;
      } else if (input) {
        text = (input as HTMLInputElement).value;
        el = input;
      } else {
        text = cell.textContent ?? "";
      }
      const font = getComputedStyle(el).font;
      const w = measureTextWidth(text, font);
      if (w > maxContentWidth) maxContentWidth = w;
    });
    let target = maxContentWidth + CELL_AUTOFIT_BUFFER + (hasSelect ? SELECT_ARROW_BUFFER : 0);
    if (!HEADER_WRAP_COLUMN_IDS.has(columnId)) {
      const label = COLUMN_HEADER_LABELS[columnId];
      if (label) {
        const headerFont = '700 11.5px -apple-system, "Segoe UI", "SF Pro Text", Roboto, "Helvetica Neue", Arial, sans-serif';
        const headerW = measureTextWidth(label.toUpperCase(), headerFont);
        target = Math.max(target, headerW + HEADER_AUTOFIT_BUFFER);
      }
    }
    const minSize = productTable.getColumn(columnId)?.columnDef.minSize ?? 60;
    const next = Math.max(minSize, Math.min(460, Math.round(target)));
    setColumnSizing((prev) => ({ ...prev, [columnId]: next }));
  }

  function renderResizeHandle(columnId: string) {
    const header = productHeaderRow.headers.find((h) => h.id === columnId);
    if (!header || !header.column.getCanResize()) return null;
    return (
      <div
        className={`col-resize-handle${header.column.getIsResizing() ? " is-resizing" : ""}`}
        onMouseDown={header.getResizeHandler()}
        onTouchStart={header.getResizeHandler()}
        onDoubleClick={(e) => {
          e.stopPropagation();
          autoFitColumn(columnId);
        }}
        title="Kéo để chỉnh độ rộng — bấm đúp để tự vừa cột"
      />
    );
  }

  const draftInFilter = useMemo(() => filteredByCriteria.filter((p) => p.is_draft).length, [filteredByCriteria]);

  // Only ever one meaningful "pending" request per product in practice — if
  // more than one somehow exists, the most recent wins (price_requests is
  // already ordered newest-first by loadPriceRequests).
  const pendingRequestByProduct = useMemo(() => {
    const map = new Map<string, PriceChangeRequest>();
    for (const r of priceRequests) {
      if (r.status === "pending" && !map.has(r.product_id)) map.set(r.product_id, r);
    }
    return map;
  }, [priceRequests]);

  const pendingInFilter = useMemo(
    () => filteredByCriteria.filter((p) => pendingIds.has(p.id)).length,
    [filteredByCriteria, pendingIds]
  );

  // Products picked earlier (e.g. a whole different category) that the
  // current filter/tab no longer shows — kept visible below `visible` instead
  // of disappearing, so a multi-category selection stays reviewable while
  // browsing to add more.
  const selectedElsewhere = useMemo(() => {
    const visibleIds = new Set(pagedVisible.map((p) => p.id));
    return products.filter((p) => selected.has(p.id) && !visibleIds.has(p.id));
  }, [products, selected, pagedVisible]);

  // Mọi role gõ thẳng vào ô giá — nhưng không ai ghi thẳng vào products nữa,
  // chỉ tạo/cập nhật 1 đề xuất giá; giá thật chỉ đổi khi Kế toán/Admin duyệt
  // (kể cả tự duyệt đề xuất của chính mình).
  const proposePrice = useCallback(
    async (p: Product, field: "gia_ban" | "gia_thung", value: string) => {
      const num = value.trim() === "" ? null : Number(value.replace(/[^\d]/g, ""));
      if (value.trim() !== "" && (num === null || Number.isNaN(num))) {
        alert("Giá không hợp lệ");
        return;
      }
      setSavingId(p.id);
      try {
        const res = await fetch("/api/admin/price-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: p.id, field, value: num }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gửi đề xuất thất bại");
        await loadPriceRequests();
      } catch (e: any) {
        alert("Gửi đề xuất thất bại: " + e.message);
      } finally {
        setSavingId(null);
      }
    },
    [loadPriceRequests]
  );

  // Sửa nhanh các cột khác ngoài giá (Tên hàng hóa, Nhóm hàng, Mã nội bộ,
  // ĐVT, Quy cách, Tỷ lệ, Thương hiệu, Mã vạch, Mã thùng, Tên hóa đơn) — ghi
  // thẳng DB ngay, không qua đề xuất/duyệt; quyền theo từng trường được
  // chặn ở API (app/api/admin/products/[id]/field/route.ts).
  const updateProductField = useCallback(
    async (p: Product, field: string, value: string | number | null) => {
      setSavingId(p.id);
      try {
        const res = await fetch(`/api/admin/products/${p.id}/field`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ field, value }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Lưu thất bại");
        setProducts((prev) => prev.map((x) => (x.id === p.id ? data : x)));
        if (field === "brand") await loadBrandNames();
      } catch (e: any) {
        alert("Lưu thất bại: " + e.message);
      } finally {
        setSavingId(null);
      }
    },
    [loadBrandNames]
  );

  // Tải/xoá ảnh thật riêng SKU — ghi thẳng qua client Supabase (RLS đã cho
  // phép sales/accountant/admin sửa products, staff bị chặn), không qua API
  // field-permission route vì photo_url không nằm trong FIELD_PERMISSIONS.
  async function uploadProductPhoto(p: Product, file: File) {
    setPhotoUploadingId(p.id);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${p.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("product-photos").upload(path, file, { upsert: true });
    if (uploadError) {
      alert("Tải ảnh thất bại: " + uploadError.message);
      setPhotoUploadingId(null);
      return;
    }
    const { data: publicUrlData } = supabase.storage.from("product-photos").getPublicUrl(path);
    const photoUrl = publicUrlData.publicUrl;
    const { error: updateError } = await supabase.from("products").update({ photo_url: photoUrl }).eq("id", p.id);
    setPhotoUploadingId(null);
    if (updateError) {
      alert("Lưu ảnh thất bại: " + updateError.message);
      return;
    }
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, photo_url: photoUrl } : x)));
  }

  async function removeProductPhoto(p: Product) {
    if (!p.photo_url) return;
    if (!confirm(`Xoá ảnh của "${p.ten_hang_hoa}"?`)) return;
    const { error } = await supabase.from("products").update({ photo_url: null }).eq("id", p.id);
    if (error) {
      alert("Xoá ảnh thất bại: " + error.message);
      return;
    }
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, photo_url: null } : x)));
  }

  async function submitCompleteDraft(fields: {
    ma_noi_bo: string;
    ten_hoa_don: string;
    quy_cach: string;
    dvt: string;
    ty_le: string;
    brand: string;
  }) {
    if (!completeDraftTarget) return;
    try {
      const res = await fetch(`/api/admin/products/${completeDraftTarget.id}/complete-draft`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ma_noi_bo: fields.ma_noi_bo,
          ten_hoa_don: fields.ten_hoa_don || null,
          quy_cach: fields.quy_cach || null,
          dvt: fields.dvt || null,
          ty_le: fields.ty_le ? Number(fields.ty_le) : null,
          brand: fields.brand || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Hoàn thiện sản phẩm thất bại");
      setCompleteDraftTarget(null);
      await loadProducts();
    } catch (e: any) {
      alert("Hoàn thiện sản phẩm thất bại: " + e.message);
    }
  }

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Ô tick "chọn tất cả" ở header bảng thay cho nút cũ — bấm khi chưa chọn
  // đủ hết `visible` sẽ CHỌN THÊM toàn bộ (giữ đúng hành vi cộng dồn cũ: lọc
  // theo nhóm A, tick hết, đổi bộ lọc sang nhóm B, tick tiếp — vẫn cộng dồn
  // được lựa chọn nhiều nhóm cho báo giá thay vì mỗi lần tick lại thay hẳn
  // lựa chọn trước); bấm khi đã chọn đủ hết `visible` sẽ BỎ CHỌN đúng những
  // dòng đang hiện đó (không đụng tới lựa chọn ở nhóm khác không hiện ra).
  const allVisibleSelected = visible.length > 0 && visible.every((p) => selected.has(p.id));
  const someVisibleSelected = visible.some((p) => selected.has(p.id));
  function toggleSelectAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        for (const p of visible) next.delete(p.id);
      } else {
        for (const p of visible) next.add(p.id);
      }
      return next;
    });
  }

  async function doExport(kind: "misa" | "word" | "misa-update" | "vertical") {
    if (selected.size === 0) {
      alert("Chọn ít nhất 1 sản phẩm để xuất file.");
      return;
    }
    setExporting(kind);
    try {
      const res = await fetch(`/api/admin/export-${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t);
      }
      const blob = await res.blob();
      const filenames = {
        misa: "MISA_Nhap_khau_hang_hoa.xlsx",
        word: "Bang_gia_block_7.7x4cm_Update.docx",
        "misa-update": "MISA_Cap_nhat_thong_tin.xlsx",
        vertical: "Bang_gia_dung.pdf",
      };
      downloadBlob(blob, filenames[kind]);

      const now = new Date().toISOString();
      const { error } = await supabase
        .from("products")
        .update({ last_exported_at: now })
        .in("id", Array.from(selected));
      if (error) throw error;
      await loadProducts();
      setSelected(new Set());
    } catch (e: any) {
      alert("Xuất file thất bại: " + e.message);
    } finally {
      setExporting(null);
    }
  }

  // Single-tag-per-page 5x3cm label for roll label printers (iPOS IP3350...).
  // Products without a mã vạch get one minted server-side and saved back —
  // marks last_exported_at same as doExport(), since this prints the price.
  async function doExportRollLabel() {
    if (selected.size === 0) {
      alert("Chọn ít nhất 1 sản phẩm để xuất file.");
      return;
    }
    setExportingRollLabel(true);
    try {
      const res = await fetch("/api/admin/export-roll-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || (await res.text()));
      }
      const blob = await res.blob();
      downloadBlob(blob, "Tem_cuon_5x3cm.docx");

      const now = new Date().toISOString();
      const { error } = await supabase.from("products").update({ last_exported_at: now }).in("id", Array.from(selected));
      if (error) throw error;
      await loadProducts();
      setSelected(new Set());
    } catch (e: any) {
      alert("Xuất file thất bại: " + e.message);
    } finally {
      setExportingRollLabel(false);
    }
  }

  async function doExportQuote(fields: QuoteFormFields) {
    setExportingQuote(true);
    try {
      const res = await fetch("/api/admin/export-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), ...fields }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || (await res.text()));
      }
      const blob = await res.blob();
      // Tên file tải về đặt qua thuộc tính <a download> phía trình duyệt
      // (không qua header Content-Disposition của server), nên có dấu tiếng
      // Việt vẫn hiển thị đúng, không lo lỗi encoding header như file MISA.
      const [yyyy, mm, dd] = (fields.date || new Date().toISOString().slice(0, 10)).split("-");
      downloadBlob(blob, `Bảng báo giá ${dd}-${mm}-${yyyy.slice(2)}.pdf`);
      setQuoteModalOpen(false);
    } catch (e: any) {
      alert("Xuất báo giá thất bại: " + e.message);
    } finally {
      setExportingQuote(false);
    }
  }

  async function doExportInventoryCheck(fields: InventoryCheckFormFields) {
    setExportingInventory(true);
    try {
      const res = await fetch("/api/admin/export-inventory-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), startDate: fields.startDate }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || (await res.text()));
      }
      const blob = await res.blob();
      const days = getWorkingDaysClient(fields.startDate, 12);
      const fmt = (d: Date) => `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
      downloadBlob(blob, `Phiếu kiểm kho_${fmt(days[0])}_${fmt(days[days.length - 1])}.pdf`);
      setInventoryModalOpen(false);
    } catch (e: any) {
      alert("Xuất phiếu kiểm kho thất bại: " + e.message);
    } finally {
      setExportingInventory(false);
    }
  }

  async function dismissPending() {
    if (selected.size === 0) {
      alert("Chọn ít nhất 1 sản phẩm để bỏ chờ xuất file.");
      return;
    }
    if (!confirm(`Bỏ chờ xuất file cho ${selected.size} sản phẩm? Sẽ không tải file nào, chỉ tắt trạng thái "chờ xuất".`)) return;
    setDismissing(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase.from("products").update({ last_exported_at: now }).in("id", Array.from(selected));
      if (error) throw error;
      await loadProducts();
      setSelected(new Set());
    } catch (e: any) {
      alert("Thao tác thất bại: " + e.message);
    } finally {
      setDismissing(false);
    }
  }

  async function handleDeleteSelectedProducts() {
    if (selected.size === 0) {
      alert("Chọn ít nhất 1 sản phẩm để xóa.");
      return;
    }
    if (!confirm(`Xóa ${selected.size} sản phẩm đã chọn? Không thể hoàn tác.`)) return;
    setDeletingSelected(true);
    try {
      const results = await Promise.all(
        Array.from(selected).map(async (id) => {
          const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
          return { id, ok: res.ok };
        })
      );
      const failed = results.filter((r) => !r.ok).length;
      await loadProducts();
      setSelected(new Set());
      if (failed > 0) alert(`Xóa thất bại ${failed}/${results.length} sản phẩm.`);
    } catch (e: any) {
      alert("Xóa thất bại: " + e.message);
    } finally {
      setDeletingSelected(false);
    }
  }

  const EXPORT_ALL_ROUTES: Record<"category" | "brand" | "word", { url: string; filename: string }> = {
    category: { url: "/api/admin/export-by-category", filename: "Danh_sach_theo_loai.xlsx" },
    brand: { url: "/api/admin/export-by-brand", filename: "Danh_sach_theo_thuong_hieu.xlsx" },
    word: { url: "/api/admin/export-word-all", filename: "Bang_gia_block_7.7x4cm_Toan_bo.docx" },
  };

  async function doExportAll(kind: "category" | "brand" | "word") {
    setMoreMenuOpen(false);
    setExportingAll(kind);
    try {
      const { url, filename } = EXPORT_ALL_ROUTES[kind];
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t);
      }
      const blob = await res.blob();
      downloadBlob(blob, filename);
    } catch (e: any) {
      alert("Xuất file thất bại: " + e.message);
    } finally {
      setExportingAll(null);
    }
  }

  async function handleImportFile(file: File) {
    setMoreMenuOpen(false);
    setImporting(true);
    try {
      // Chỉ cần đọc dữ liệu ô, không cần hình ảnh/logo nhúng trong file — gỡ
      // ảnh ngay trên trình duyệt trước khi tải lên để file nhỏ lại, tránh bị
      // chặn ở tầng hạ tầng do quá dung lượng cho phép (413 Request Entity
      // Too Large) trước cả khi tới được code xử lý của app.
      const cleaned = await stripXlsxDrawings(await file.arrayBuffer());
      const cleanedFile = new File([cleaned], file.name, { type: file.type });

      const form = new FormData();
      form.append("file", cleanedFile);
      form.append("mode", importOnlyNew ? "new-only" : "update-all");
      const res = await fetch("/api/admin/import-products", { method: "POST", body: form });
      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new Error(
          res.status === 413
            ? "File vẫn còn quá lớn để tải lên (giới hạn khoảng 4MB). Vui lòng chia nhỏ file hoặc giảm bớt dữ liệu rồi thử lại."
            : `Máy chủ phản hồi không hợp lệ (mã lỗi ${res.status}). Vui lòng thử lại sau.`
        );
      }
      if (!res.ok) throw new Error(data.error || "Nhập file thất bại");
      const skipped = data.skippedSheets?.length ? ` (bỏ qua sheet: ${data.skippedSheets.join(", ")})` : "";
      const skippedIncomplete = data.skippedIncomplete > 0 ? ` Bỏ qua ${data.skippedIncomplete} dòng thiếu Tên hàng hóa hoặc Mã hàng hóa.` : "";
      const summary = importOnlyNew
        ? `Đã thêm ${data.newCount} sản phẩm mới. ${data.existingCount} sản phẩm đã tồn tại (giữ nguyên, không thay đổi).`
        : `Đã cập nhật ${data.existingCount} sản phẩm đã có và thêm ${data.newCount} sản phẩm mới.`;
      alert(`${summary} ${data.brandsUpserted} thương hiệu.${skipped}${skippedIncomplete}`);
      await loadProducts();
      await loadBrandNames();
    } catch (e: any) {
      alert("Nhập file thất bại: " + e.message);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSaveProduct(input: ProductInput) {
    if (!formTarget) return;
    try {
      const res = await fetch(`/api/admin/products/${formTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lưu thất bại");
      setFormTarget(null);
      await loadProducts();
      await loadBrandNames();
    } catch (e: any) {
      alert("Lưu sản phẩm thất bại: " + e.message);
    }
  }

  // Thêm sản phẩm bằng dòng trống ở cuối bảng (kiểu Excel) — khác
  // handleSaveProduct ở chỗ không rời tab/không chọn sẵn sản phẩm, để có thể
  // gõ liên tiếp nhiều dòng mà không bị nhảy màn hình sau mỗi lần lưu.
  async function handleCreateProductInline(input: ProductInput): Promise<boolean> {
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Thêm sản phẩm thất bại");
      await loadProducts();
      await loadBrandNames();
      return true;
    } catch (e: any) {
      alert("Thêm sản phẩm thất bại: " + e.message);
      return false;
    }
  }

  const handleDeleteProduct = useCallback(
    async (p: Product) => {
      if (!confirm(`Xóa sản phẩm "${p.ten_hang_hoa}"? Không thể hoàn tác.`)) return;
      try {
        const res = await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Xóa thất bại");
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(p.id);
          return next;
        });
        await loadProducts();
      } catch (e: any) {
        alert("Xóa sản phẩm thất bại: " + e.message);
      }
    },
    [loadProducts]
  );

  function renderRow(p: Product, extraClassName?: string) {
    return (
      <ProductRow
        key={p.id}
        product={p}
        extraClassName={extraClassName}
        role={role}
        compactView={compactView}
        brandNames={brandNames}
        isSelected={selected.has(p.id)}
        isPending={pendingIds.has(p.id)}
        pendingRequest={pendingRequestByProduct.get(p.id)}
        isSaving={savingId === p.id}
        onToggleSelect={toggleSelect}
        onUpdateField={updateProductField}
        onProposePrice={proposePrice}
        onEdit={setFormTarget}
        onDelete={handleDeleteProduct}
        onCompleteDraft={setCompleteDraftTarget}
        onUploadPhoto={uploadProductPhoto}
        onRemovePhoto={removeProductPhoto}
        photoUploading={photoUploadingId === p.id}
        photoColumnStickyLeft={photoColumnStickyLeft}
        nameColumnStickyLeft={nameColumnStickyLeft}
      />
    );
  }

  return (
    <div className="app app-full table-page">
      <header className="app-header">
        <div className="app-header-title-group">
          <div className="app-header-title">
            <h1>Quản lý giá sản phẩm — Tiệm Trà Bánh</h1>
          </div>
          <p className="app-header-meta app-header-meta-accent">
            {products.length} sản phẩm · {monthlyStats.newThisMonth} mới · {priceChangesThisMonth} đổi giá (tháng {monthlyStats.monthLabel}) ·{" "}
            {missingPhotoCount} thiếu ảnh
          </p>
        </div>
      </header>

      <div className="toolbar">
        <div className="search-field">
          <SearchIcon />
          <input placeholder="Tìm theo tên / mã / mã vạch..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>Tất cả</option>
          <option>{CATEGORY_ALL_EXCEPT_TOOLS}</option>
          {CATEGORY_ORDER.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
          <option>Tất cả</option>
          {brandNames.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
        <label className={`toggle-pill${missingOnly ? " active" : ""}`}>
          <input type="checkbox" checked={missingOnly} onChange={(e) => setMissingOnly(e.target.checked)} />
          <WarningIcon />
          Thiếu thông tin
        </label>
        <label className={`toggle-pill${missingPhotoOnly ? " active" : ""}`}>
          <input type="checkbox" checked={missingPhotoOnly} onChange={(e) => setMissingPhotoOnly(e.target.checked)} />
          <PhotoIcon />
          Thiếu ảnh
        </label>
        <label className={`switch-field${compactView ? " has-checked" : ""}`}>
          <span className="switch">
            <input
              type="checkbox"
              checked={compactView}
              onChange={(e) => {
                const hide = e.target.checked;
                setColumnVisibility((prev) => {
                  const next = { ...prev };
                  for (const id of COMPACT_HIDDEN_COLUMN_IDS) next[id] = !hide;
                  return next;
                });
              }}
            />
            <span className="switch-track">
              <span className="switch-knob" />
            </span>
          </span>
          Update giá
        </label>

        <div className="toolbar-spacer" />

        <div className="menu-wrap" ref={moreMenuRef}>
          <button className="btn" onClick={() => setMoreMenuOpen((v) => !v)} disabled={importing || exportingAll !== null}>
            {importing || exportingAll !== null ? "Đang xử lý..." : "Nhập & xuất"}
            <ChevronDownIcon />
          </button>
          {moreMenuOpen && (
            <div className="menu">
              <button className="menu-item-accent" onClick={() => fileInputRef.current?.click()}>
                <ImportIcon />
                Nhập từ Excel
              </button>
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: "6px 10px 4px",
                  fontSize: 12.5,
                  color: "var(--muted)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={importOnlyNew}
                  onChange={(e) => setImportOnlyNew(e.target.checked)}
                  style={{ marginTop: 2 }}
                />
                <span>
                  Chỉ thêm sản phẩm mới (giữ nguyên sản phẩm đã có)
                  <br />
                  <span style={{ fontSize: 11.5 }}>
                    {importOnlyNew
                      ? "Bỏ tick để cập nhật giá/tên/mã vạch... của sản phẩm đã có theo file."
                      : "Sẽ cập nhật mọi thông tin theo file. Riêng Mã nội bộ không bao giờ bị đổi qua import — chỉ sửa được bằng tay."}
                  </span>
                </span>
              </label>
              <div className="menu-divider" />
              <button onClick={() => doExportAll("category")}>
                <SheetIcon />
                Xuất theo loại sản phẩm
              </button>
              <button onClick={() => doExportAll("brand")}>
                <SheetIcon />
                Xuất theo thương hiệu
              </button>
              <button onClick={() => doExportAll("word")}>
                <DocIcon />
                Xuất toàn bộ bảng giá (.docx)
              </button>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImportFile(file);
          }}
        />
      </div>

      <div className="view-row">
        <div className="view-row-left">
          <Segmented
            items={[
              { key: "all", label: `Tất cả (${filteredByCriteria.length})`, active: tab === "all", onClick: () => setTab("all") },
              { key: "pending", label: `Chờ xuất file (${pendingInFilter})`, active: tab === "pending", onClick: () => setTab("pending") },
              { key: "draft", label: `Chưa hoàn chỉnh (${draftInFilter})`, active: tab === "draft", onClick: () => setTab("draft") },
            ]}
          />
          {selected.size > 0 && (
            <button className="btn btn-danger" onClick={() => setSelected(new Set())}>
              Bỏ chọn
            </button>
          )}
        </div>

        {selected.size > 0 && (
          <div className="selection-bar">
            <span>
              Đã chọn <b>{selected.size}</b> sản phẩm
            </span>
            <div className="menu-wrap" ref={exportMenuRef}>
              <button
                className="btn btn-primary"
                disabled={exporting !== null || exportingRollLabel}
                onClick={() => setExportMenuOpen((v) => !v)}
              >
                {exporting !== null || exportingRollLabel ? "Đang xuất..." : "Xuất file"}
                <ChevronDownIcon />
              </button>
              {exportMenuOpen && (
                <div className="menu">
                  <button
                    onClick={() => {
                      setExportMenuOpen(false);
                      doExport("misa");
                    }}
                  >
                    <SheetIcon />
                    Xuất MISA_Nhập khẩu hàng hóa
                  </button>
                  <button
                    onClick={() => {
                      setExportMenuOpen(false);
                      doExport("misa-update");
                    }}
                  >
                    <SheetIcon />
                    Xuất cập nhật MISA
                  </button>
                  <button
                    onClick={() => {
                      setExportMenuOpen(false);
                      doExport("word");
                    }}
                  >
                    <DocIcon />
                    Block giá 7.7x4cm
                  </button>
                  <button
                    onClick={() => {
                      setExportMenuOpen(false);
                      doExport("vertical");
                    }}
                  >
                    <DocIcon />
                    Bảng giá đứng
                  </button>
                  <button
                    onClick={() => {
                      setExportMenuOpen(false);
                      setQuoteModalOpen(true);
                    }}
                  >
                    <QuoteIcon />
                    Xuất báo giá (PDF)
                  </button>
                  <button
                    onClick={() => {
                      setExportMenuOpen(false);
                      doExportRollLabel();
                    }}
                  >
                    <SheetIcon />
                    Xuất tem cuộn 5x3cm
                  </button>
                  <button
                    onClick={() => {
                      setExportMenuOpen(false);
                      setInventoryModalOpen(true);
                    }}
                  >
                    <DocIcon />
                    Phiếu kiểm kho (PDF)
                  </button>
                </div>
              )}
            </div>
            {tab === "pending" && (
              <button className="btn btn-danger" disabled={dismissing} onClick={dismissPending}>
                {dismissing ? "Đang xử lý..." : "Bỏ chờ xuất file"}
              </button>
            )}
            {role === "admin" && (
              <button className="btn btn-danger" disabled={deletingSelected} onClick={handleDeleteSelectedProducts}>
                {deletingSelected ? "Đang xóa..." : "Xóa tất cả"}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="table-card">
        <div className="table-scroll" ref={tableScrollRef}>
          <table className="product-table" style={{ width: productTable.getTotalSize() }}>
            <colgroup>
              <col style={{ width: productTable.getColumn("select")?.getSize() }} />
              <col style={{ width: productTable.getColumn("photo")?.getSize() }} />
              <col style={{ width: productTable.getColumn("ten_hang_hoa")?.getSize() }} />
              {!compactView && <col style={{ width: productTable.getColumn("category_sheet")?.getSize() }} />}
              {!compactView && <col style={{ width: productTable.getColumn("ma_noi_bo")?.getSize() }} />}
              {!compactView && <col style={{ width: productTable.getColumn("ten_hoa_don")?.getSize() }} />}
              {!compactView && <col style={{ width: productTable.getColumn("dvt")?.getSize() }} />}
              <col style={{ width: productTable.getColumn("gia_ban")?.getSize() }} />
              {!compactView && <col style={{ width: productTable.getColumn("gia_hop")?.getSize() }} />}
              <col style={{ width: productTable.getColumn("gia_thung")?.getSize() }} />
              {!compactView && <col style={{ width: productTable.getColumn("quy_cach")?.getSize() }} />}
              {!compactView && <col style={{ width: productTable.getColumn("ty_le")?.getSize() }} />}
              {!compactView && <col style={{ width: productTable.getColumn("dvt_cap_2")?.getSize() }} />}
              {!compactView && <col style={{ width: productTable.getColumn("ty_le_cap_2")?.getSize() }} />}
              {!compactView && <col style={{ width: productTable.getColumn("brand")?.getSize() }} />}
              {!compactView && <col style={{ width: productTable.getColumn("nha_cung_cap")?.getSize() }} />}
              {!compactView && <col style={{ width: productTable.getColumn("ma_hang_hoa")?.getSize() }} />}
              {!compactView && <col style={{ width: productTable.getColumn("ma_vach")?.getSize() }} />}
              {!compactView && <col style={{ width: productTable.getColumn("ma_thung")?.getSize() }} />}
              {!compactView && <col style={{ width: productTable.getColumn("status")?.getSize() }} />}
              {!compactView && <col style={{ width: productTable.getColumn("actions")?.getSize() }} />}
            </colgroup>
            <thead>
              <tr>
                <th className="col-check">
                  <input
                    type="checkbox"
                    aria-label="Chọn tất cả đang hiện"
                    checked={allVisibleSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected;
                    }}
                    onChange={toggleSelectAllVisible}
                  />
                </th>
                <th className="col-photo" style={{ left: photoColumnStickyLeft }}>
                  Ảnh
                </th>
                <th className="col-name" style={{ left: nameColumnStickyLeft }}>
                  Tên hàng hóa
                  {renderResizeHandle("ten_hang_hoa")}
                </th>
                {!compactView && (
                  <th className="col-group">
                    Nhóm hàng
                    {renderResizeHandle("category_sheet")}
                  </th>
                )}
                {!compactView && (
                  <th className="col-code">
                    Mã nội bộ
                    {renderResizeHandle("ma_noi_bo")}
                  </th>
                )}
                {!compactView && (
                  <th className="col-invoice">
                    Tên hóa đơn
                    {renderResizeHandle("ten_hoa_don")}
                  </th>
                )}
                {!compactView && (
                  <th className="col-dvt">
                    ĐVT
                    {renderResizeHandle("dvt")}
                  </th>
                )}
                <th className="num">
                  Giá bán lẻ
                  {renderResizeHandle("gia_ban")}
                </th>
                {!compactView && (
                  <th className="num">
                    Giá Hộp
                    {renderResizeHandle("gia_hop")}
                  </th>
                )}
                <th className="num">
                  Giá thùng
                  {renderResizeHandle("gia_thung")}
                </th>
                {!compactView && (
                  <th className="col-spec">
                    Quy cách thùng
                    {renderResizeHandle("quy_cach")}
                  </th>
                )}
                {!compactView && (
                  <th className="num">
                    Tỷ lệ quy đổi
                    {renderResizeHandle("ty_le")}
                  </th>
                )}
                {!compactView && (
                  <th className="col-header-wrap">
                    Đơn vị cấp 2 (Hộp)
                    {renderResizeHandle("dvt_cap_2")}
                  </th>
                )}
                {!compactView && (
                  <th className="num col-header-wrap">
                    Tỷ lệ quy đổi cấp 2
                    {renderResizeHandle("ty_le_cap_2")}
                  </th>
                )}
                {!compactView && (
                  <th className="col-brand">
                    Thương hiệu
                    {renderResizeHandle("brand")}
                  </th>
                )}
                {!compactView && (
                  <th>
                    Nhà cung cấp
                    {renderResizeHandle("nha_cung_cap")}
                  </th>
                )}
                {!compactView && (
                  <th className="col-code">
                    Mã hàng NCC
                    {renderResizeHandle("ma_hang_hoa")}
                  </th>
                )}
                {!compactView && (
                  <th className="col-code">
                    Mã vạch
                    {renderResizeHandle("ma_vach")}
                  </th>
                )}
                {!compactView && (
                  <th className="col-code">
                    Mã thùng
                    {renderResizeHandle("ma_thung")}
                  </th>
                )}
                {!compactView && (
                  <th className="col-status">
                    Trạng thái
                    {renderResizeHandle("status")}
                  </th>
                )}
                {!compactView && <th></th>}
              </tr>
            </thead>
            <tbody>
              {tab === "all" && (role === "sales" || role === "admin") && (
                <NewProductRow
                  role={role}
                  compactView={compactView}
                  brandNames={brandNames}
                  categoryFilter={category}
                  onCreate={handleCreateProductInline}
                  photoColumnStickyLeft={photoColumnStickyLeft}
                  nameColumnStickyLeft={nameColumnStickyLeft}
                />
              )}
              {loading && (
                <tr>
                  <td colSpan={21} className="loading-state">
                    Đang tải...
                  </td>
                </tr>
              )}
              {!loading && visible.length === 0 && (
                <tr>
                  <td colSpan={21} className="empty-state">
                    Không có sản phẩm nào.
                  </td>
                </tr>
              )}
              {pagedVisible.map((p) => renderRow(p))}
              {selectedElsewhere.length > 0 && (
                <tr className="section-divider-row">
                  <td colSpan={21} className="section-divider">
                    Đã chọn ở bộ lọc khác ({selectedElsewhere.length})
                  </td>
                </tr>
              )}
              {selectedElsewhere.map((p) => renderRow(p, "is-selected-elsewhere"))}
            </tbody>
          </table>
        </div>
      </div>

      {pageCount > 1 && (
        <div className="pagination-bar">
          <button className="btn btn-quiet" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
            ← Trước
          </button>
          <span>
            Trang {currentPage}/{pageCount} ({visible.length} sản phẩm)
          </span>
          <button className="btn btn-quiet" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>
            Sau →
          </button>
        </div>
      )}

      <p className="helper-text">
        Sửa giá xong tự lưu ngay (không cần bấm nút riêng). Sản phẩm nào vừa đổi giá sẽ tự hiện ở tab &quot;Chờ xuất
        file&quot; — chọn xong bấm xuất MISA hoặc Word, chỉ đúng các sản phẩm đã chọn.
      </p>

      {formTarget !== null && (
        <ProductForm
          initial={formTarget}
          brandNames={brandNames}
          role={role}
          onCancel={() => setFormTarget(null)}
          onSave={handleSaveProduct}
        />
      )}

      {quoteModalOpen && (
        <QuoteForm
          selectedCount={selected.size}
          submitting={exportingQuote}
          onCancel={() => setQuoteModalOpen(false)}
          onSubmit={doExportQuote}
        />
      )}

      {inventoryModalOpen && (
        <InventoryCheckForm
          selectedCount={selected.size}
          submitting={exportingInventory}
          onCancel={() => setInventoryModalOpen(false)}
          onSubmit={doExportInventoryCheck}
        />
      )}

      {completeDraftTarget && (
        <CompleteDraftForm
          product={completeDraftTarget}
          brandNames={brandNames}
          onCancel={() => setCompleteDraftTarget(null)}
          onSubmit={submitCompleteDraft}
        />
      )}
    </div>
  );
}

type ProductRowProps = {
  product: Product;
  extraClassName?: string;
  role: Role;
  compactView: boolean;
  brandNames: string[];
  isSelected: boolean;
  isPending: boolean;
  pendingRequest: PriceChangeRequest | undefined;
  isSaving: boolean;
  onToggleSelect: (id: string) => void;
  onUpdateField: (p: Product, field: string, value: string | number | null) => void;
  onProposePrice: (p: Product, field: "gia_ban" | "gia_thung", value: string) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  onCompleteDraft: (p: Product) => void;
  onUploadPhoto: (p: Product, file: File) => void;
  onRemovePhoto: (p: Product) => void;
  photoUploading: boolean;
  photoColumnStickyLeft: number;
  nameColumnStickyLeft: number;
};

// Bọc React.memo để 1 dòng không re-render khi state không liên quan của
// component cha (search, page, savingId của dòng khác...) thay đổi — mọi
// prop callback truyền vào đây đều ổn định (useCallback / setState) ở nơi gọi.
const ProductRow = memo(function ProductRow({
  product: p,
  extraClassName,
  role,
  compactView,
  brandNames,
  isSelected,
  isPending,
  pendingRequest,
  isSaving,
  onToggleSelect,
  onUpdateField,
  onProposePrice,
  onEdit,
  onDelete,
  onCompleteDraft,
  onUploadPhoto,
  onRemovePhoto,
  photoUploading,
  photoColumnStickyLeft,
  nameColumnStickyLeft,
}: ProductRowProps) {
  const className = [isPending ? "is-pending" : "", extraClassName ?? ""].filter(Boolean).join(" ");
  const isAdmin = role === "admin";
  const canEditPhoto = role === "sales" || role === "accountant" || role === "admin";
  const photoInputId = `photo-upload-${p.id}`;

  function selectBrand(newValue: string) {
    if (newValue === "__new__") {
      const name = window.prompt("Tên thương hiệu mới:");
      if (name && name.trim()) onUpdateField(p, "brand", name.trim());
      return;
    }
    onUpdateField(p, "brand", newValue);
  }

  return (
    <tr className={className}>
      <td className="col-check">
        <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(p.id)} />
      </td>
      <td className="col-photo" style={{ left: photoColumnStickyLeft }}>
        {canEditPhoto ? (
          <label htmlFor={photoInputId} className="row-photo-thumb" title={p.photo_url ? "Đổi ảnh" : "Tải ảnh"}>
            {photoUploading ? (
              <span className="row-photo-uploading">...</span>
            ) : p.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.photo_url} alt="" />
            ) : (
              <span>—</span>
            )}
            {p.photo_url && !photoUploading && (
              <button
                type="button"
                className="row-photo-remove"
                title="Xoá ảnh"
                onClick={(e) => {
                  e.preventDefault();
                  onRemovePhoto(p);
                }}
              >
                ×
              </button>
            )}
            <input
              id={photoInputId}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              disabled={photoUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUploadPhoto(p, file);
                e.target.value = "";
              }}
            />
          </label>
        ) : p.photo_url ? (
          <span className="row-photo-thumb">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.photo_url} alt="" />
          </span>
        ) : (
          <span className="row-photo-thumb">—</span>
        )}
      </td>
      <td className="col-name" data-col-id="ten_hang_hoa" style={{ left: nameColumnStickyLeft }}>
        <InlineTextCell
          value={p.ten_hang_hoa}
          onSave={(v) => onUpdateField(p, "ten_hang_hoa", v)}
          saving={isSaving}
          disabled={!isAdmin}
          title={!isAdmin ? "Chỉ Admin mới đổi được tên hàng hóa" : undefined}
          clickToEdit
        />
        {p.is_draft && <span className="pill pill-warm draft-badge">Nháp</span>}
      </td>
      {!compactView && (
        <td className="col-group" data-label="Nhóm hàng" data-col-id="category_sheet">
          {isAdmin ? (
            <select value={p.category_sheet} onChange={(e) => onUpdateField(p, "category_sheet", e.target.value)} disabled={isSaving}>
              {CATEGORY_ORDER.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          ) : (
            p.category_sheet
          )}
        </td>
      )}
      {!compactView && (
        <td className="code-cell col-code" data-label="Mã nội bộ" data-col-id="ma_noi_bo">
          <InlineTextCell
            value={p.ma_noi_bo}
            onSave={(v) => onUpdateField(p, "ma_noi_bo", v)}
            saving={isSaving}
            disabled={!isAdmin}
          />
        </td>
      )}
      {!compactView && (
        <td className="col-invoice" data-label="Tên hóa đơn" data-col-id="ten_hoa_don">
          <InlineTextCell
            value={p.ten_hoa_don}
            onSave={(v) => onUpdateField(p, "ten_hoa_don", v)}
            saving={isSaving}
            disabled={role === "sales" || role === "staff"}
            clickToEdit
          />
        </td>
      )}
      {!compactView && (
        <td className="col-dvt" data-label="ĐVT" data-col-id="dvt">
          {isAdmin ? (
            <select value={p.dvt ?? ""} onChange={(e) => onUpdateField(p, "dvt", e.target.value)} disabled={isSaving}>
              <option value="">—</option>
              {withCurrent(DVT_SUGGESTIONS, p.dvt ?? "").map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          ) : (
            p.dvt ?? "—"
          )}
        </td>
      )}
      <td className="num" data-label="Giá bán lẻ" data-col-id="gia_ban">
        <PriceInput
          value={pendingRequest?.proposed_gia_ban != null ? pendingRequest.proposed_gia_ban : p.gia_ban}
          onSave={(v) => onProposePrice(p, "gia_ban", v)}
          saving={isSaving}
          disabled={role === "staff"}
        />
      </td>
      {!compactView && (
        <td className="num" data-label="Giá Hộp" data-col-id="gia_hop">
          <PriceInput
            value={p.gia_hop}
            onSave={(v) => onUpdateField(p, "gia_hop", v === "" ? null : Number(v.replace(/[^\d]/g, "")))}
            saving={isSaving}
            disabled={role === "staff"}
          />
        </td>
      )}
      <td className="num" data-label="Giá thùng" data-col-id="gia_thung">
        <PriceInput
          value={pendingRequest?.proposed_gia_thung != null ? pendingRequest.proposed_gia_thung : p.gia_thung}
          onSave={(v) => onProposePrice(p, "gia_thung", v)}
          saving={isSaving}
          disabled={role === "staff"}
        />
      </td>
      {!compactView && (
        <td className="col-spec" data-label="Quy cách thùng" data-col-id="quy_cach">
          {isAdmin ? (
            <select value={p.quy_cach ?? ""} onChange={(e) => onUpdateField(p, "quy_cach", e.target.value)} disabled={isSaving}>
              <option value="">—</option>
              {withCurrent(QUY_CACH_SUGGESTIONS, p.quy_cach ?? "").map((q) => (
                <option key={q}>{q}</option>
              ))}
            </select>
          ) : (
            p.quy_cach ?? "—"
          )}
        </td>
      )}
      {!compactView && (
        <td className="num" data-label="Tỷ lệ quy đổi" data-col-id="ty_le">
          {isAdmin ? (
            <select value={p.ty_le?.toString() ?? ""} onChange={(e) => onUpdateField(p, "ty_le", e.target.value)} disabled={isSaving}>
              <option value="">—</option>
              {withCurrent(TY_LE_SUGGESTIONS, p.ty_le?.toString() ?? "").map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          ) : (
            p.ty_le ?? "—"
          )}
        </td>
      )}
      {!compactView && (
        <td data-label="Đơn vị cấp 2 (Hộp)" data-col-id="dvt_cap_2">
          {isAdmin ? (
            <select value={p.dvt_cap_2 ?? ""} onChange={(e) => onUpdateField(p, "dvt_cap_2", e.target.value)} disabled={isSaving}>
              <option value="">—</option>
              {withCurrent(DVT_SUGGESTIONS, p.dvt_cap_2 ?? "").map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          ) : (
            p.dvt_cap_2 ?? "—"
          )}
        </td>
      )}
      {!compactView && (
        <td className="num" data-label="Tỷ lệ quy đổi cấp 2" data-col-id="ty_le_cap_2">
          {isAdmin ? (
            <select value={p.ty_le_cap_2?.toString() ?? ""} onChange={(e) => onUpdateField(p, "ty_le_cap_2", e.target.value)} disabled={isSaving}>
              <option value="">—</option>
              {withCurrent(TY_LE_SUGGESTIONS, p.ty_le_cap_2?.toString() ?? "").map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          ) : (
            p.ty_le_cap_2 ?? "—"
          )}
        </td>
      )}
      {!compactView && (
        <td className="col-brand" data-label="Thương hiệu" data-col-id="brand">
          {isAdmin ? (
            <select value={brandNames.includes(p.brand?.name ?? "") ? p.brand?.name : ""} onChange={(e) => selectBrand(e.target.value)} disabled={isSaving}>
              <option value="">—</option>
              {brandNames.map((b) => (
                <option key={b}>{b}</option>
              ))}
              <option value="__new__">+ Thương hiệu mới…</option>
            </select>
          ) : (
            p.brand?.name ?? "—"
          )}
        </td>
      )}
      {!compactView && (
        <td data-label="Nhà cung cấp" data-col-id="nha_cung_cap">
          <InlineTextCell value={p.nha_cung_cap} onSave={(v) => onUpdateField(p, "nha_cung_cap", v)} saving={isSaving} disabled={!isAdmin} />
        </td>
      )}
      {!compactView && (
        <td className="code-cell col-code" data-label="Mã hàng NCC" data-col-id="ma_hang_hoa">
          <InlineTextCell value={p.ma_hang_hoa} onSave={(v) => onUpdateField(p, "ma_hang_hoa", v)} saving={isSaving} disabled={!isAdmin} />
        </td>
      )}
      {!compactView && (
        <td className="code-cell col-code" data-label="Mã vạch" data-col-id="ma_vach">
          <InlineTextCell value={p.ma_vach} onSave={(v) => onUpdateField(p, "ma_vach", v)} saving={isSaving} disabled={!isAdmin} />
        </td>
      )}
      {!compactView && (
        <td className="code-cell col-code" data-label="Mã thùng" data-col-id="ma_thung">
          <InlineTextCell value={p.ma_thung} onSave={(v) => onUpdateField(p, "ma_thung", v)} saving={isSaving} disabled={!isAdmin} />
        </td>
      )}
      {!compactView && (
        <td className="col-status" data-label="Trạng thái" data-col-id="status">
          <StatusPill product={p} isPending={isPending} />
        </td>
      )}
      {!compactView && (
        <td className="col-actions">
          <div className="row-actions">
            {p.is_draft && (role === "accountant" || role === "admin") && (
              <button className="btn btn-quiet" onClick={() => onCompleteDraft(p)}>
                Hoàn thiện
              </button>
            )}
            {role === "admin" && (
              <button className="icon-btn" title="Sửa (Mã nhóm thay thế, Trạng thái, Xuất xứ)" aria-label="Sửa sản phẩm" onClick={() => onEdit(p)}>
                <EditIcon />
              </button>
            )}
            {role === "admin" && (
              <button className="icon-btn danger" title="Xóa" aria-label="Xóa sản phẩm" onClick={() => onDelete(p)}>
                <TrashIcon />
              </button>
            )}
          </div>
        </td>
      )}
    </tr>
  );
});

function PriceInput({
  value,
  onSave,
  saving,
  disabled,
}: {
  value: number | null;
  onSave: (v: string) => void;
  saving: boolean;
  disabled?: boolean;
}) {
  const [local, setLocal] = useState(value?.toString() ?? "");
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setLocal(value?.toString() ?? "");
  }, [value, focused]);
  return (
    <input
      className="price-input"
      // Shown formatted ("113.000") while at rest, raw digits while being
      // typed — formatting mid-edit would fight the cursor position.
      value={focused ? local : value?.toLocaleString("vi-VN") ?? ""}
      disabled={saving || disabled}
      onFocus={() => {
        setFocused(true);
        setLocal(value?.toString() ?? "");
      }}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        setFocused(false);
        if (local !== (value?.toString() ?? "")) onSave(local);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
    />
  );
}

// Ô chữ sửa nhanh trực tiếp trong bảng (Tên hàng hóa, Mã nội bộ, Tên hóa
// đơn, Mã vạch, Mã thùng) — cùng cơ chế với PriceInput (bộ đệm gõ riêng +
// lưu khi rời ô), nhưng ghi thẳng DB ngay, không qua đề xuất/duyệt.
//
// `clickToEdit`: dành cho Tên hàng hóa — input 1 dòng không tự xuống dòng
// được dù cột rộng bao nhiêu, nên mặc định hiện dạng chữ thường (xuống dòng
// tự nhiên khi dài), chỉ chuyển thành ô nhập khi bấm vào.
function InlineTextCell({
  value,
  onSave,
  saving,
  placeholder,
  disabled,
  title,
  clickToEdit,
}: {
  value: string | null;
  onSave: (v: string) => void;
  saving: boolean;
  placeholder?: string;
  disabled?: boolean;
  title?: string;
  clickToEdit?: boolean;
}) {
  const [local, setLocal] = useState(value ?? "");
  const [focused, setFocused] = useState(false);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (!focused) setLocal(value ?? "");
  }, [value, focused]);

  if (disabled) return <span title={title}>{value ?? "—"}</span>;

  if (clickToEdit && !editing) {
    return (
      <span
        className="inline-cell-text"
        title={title ?? "Bấm để sửa"}
        onClick={() => {
          setLocal(value ?? "");
          setEditing(true);
        }}
      >
        {value || <span className="inline-cell-placeholder">{placeholder ?? "—"}</span>}
      </span>
    );
  }

  return (
    <input
      className="inline-cell-input"
      autoFocus={clickToEdit}
      value={focused ? local : value ?? ""}
      placeholder={placeholder}
      disabled={saving}
      title={title}
      onFocus={() => {
        setFocused(true);
        setLocal(value ?? "");
      }}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        setFocused(false);
        if (local !== (value ?? "")) onSave(local);
        if (clickToEdit) setEditing(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape" && clickToEdit) {
          setLocal(value ?? "");
          setEditing(false);
        }
      }}
    />
  );
}

function StatusPill({ product, isPending }: { product: Product; isPending: boolean }) {
  const title = `Cập nhật: ${formatDate(product.updated_at)}${
    product.last_exported_at ? " · Đã xuất: " + formatDate(product.last_exported_at) : ""
  }`;
  if (isPending) {
    return (
      <span className="pill pill-warm" title={title}>
        <span className="dot" />
        {product.last_exported_at ? "Vừa sửa giá" : "Mới thêm"}
      </span>
    );
  }
  return (
    <span className="pill pill-success" title={title}>
      <span className="dot" />
      Đã xuất {relativeTimeVi(product.last_exported_at!)}
    </span>
  );
}

type FormState = {
  ma_noi_bo: string;
  ten_hang_hoa: string;
  ten_hoa_don: string;
  dvt: string;
  gia_ban: string;
  gia_thung: string;
  quy_cach: string;
  ty_le: string;
  dvt_cap_2: string;
  ty_le_cap_2: string;
  gia_hop: string;
  brand: string;
  nha_cung_cap: string;
  ma_hang_hoa: string;
  ma_vach: string;
  ma_thung: string;
  ma_nhom_thay_the: string;
  trang_thai: string;
  xuat_xu: string;
  category_sheet: string;
};

function productToFormState(p: Product | null): FormState {
  return {
    ma_noi_bo: p?.ma_noi_bo ?? "",
    ten_hang_hoa: p?.ten_hang_hoa ?? "",
    ten_hoa_don: p?.ten_hoa_don ?? "",
    dvt: p?.dvt ?? "",
    gia_ban: p?.gia_ban?.toString() ?? "",
    gia_thung: p?.gia_thung?.toString() ?? "",
    quy_cach: p?.quy_cach ?? "",
    ty_le: p?.ty_le?.toString() ?? "",
    dvt_cap_2: p?.dvt_cap_2 ?? "",
    ty_le_cap_2: p?.ty_le_cap_2?.toString() ?? "",
    gia_hop: p?.gia_hop?.toString() ?? "",
    brand: p?.brand?.name ?? "",
    nha_cung_cap: p?.nha_cung_cap ?? "",
    ma_hang_hoa: p?.ma_hang_hoa ?? "",
    ma_vach: p?.ma_vach ?? "",
    ma_thung: p?.ma_thung ?? "",
    ma_nhom_thay_the: p?.ma_nhom_thay_the ?? "",
    trang_thai: p?.trang_thai ?? "",
    xuat_xu: p?.xuat_xu ?? "",
    category_sheet: p?.category_sheet ?? CATEGORY_ORDER[0],
  };
}

function formStateToInput(f: FormState): ProductInput {
  const str = (s: string) => (s.trim() === "" ? null : s.trim());
  const num = (s: string) => (s.trim() === "" ? null : Number(s));
  return {
    ma_noi_bo: f.ma_noi_bo.trim(),
    ten_hang_hoa: f.ten_hang_hoa.trim(),
    ten_hoa_don: str(f.ten_hoa_don),
    dvt: str(f.dvt),
    gia_ban: num(f.gia_ban),
    gia_thung: num(f.gia_thung),
    quy_cach: str(f.quy_cach),
    ty_le: num(f.ty_le),
    dvt_cap_2: str(f.dvt_cap_2),
    ty_le_cap_2: num(f.ty_le_cap_2),
    gia_hop: num(f.gia_hop),
    brand: str(f.brand),
    nha_cung_cap: str(f.nha_cung_cap),
    ma_hang_hoa: str(f.ma_hang_hoa),
    ma_vach: str(f.ma_vach),
    ma_thung: str(f.ma_thung),
    ma_nhom_thay_the: str(f.ma_nhom_thay_the),
    trang_thai: str(f.trang_thai),
    xuat_xu: str(f.xuat_xu),
    category_sheet: f.category_sheet,
  };
}

// Dropdown options are curated suggestions, not an exhaustive list — if the
// current value isn't among them (custom/legacy data), keep it selectable.
function withCurrent(options: (string | number)[], current: string): string[] {
  const strOptions = options.map(String);
  return current && !strOptions.includes(current) ? [...strOptions, current] : strOptions;
}

type QuoteFormFields = {
  date: string; // yyyy-mm-dd
};

function QuoteForm({
  selectedCount,
  submitting,
  onCancel,
  onSubmit,
}: {
  selectedCount: number;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (fields: QuoteFormFields) => void;
}) {
  const [form, setForm] = useState<QuoteFormFields>({
    date: new Date().toISOString().slice(0, 10),
  });

  function set<K extends keyof QuoteFormFields>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal">
        <h2>Xuất báo giá (PDF)</h2>
        <p className="modal-sub">{selectedCount} sản phẩm đã chọn sẽ đưa vào bảng báo giá.</p>

        <div className="field-group">
          <div className="field-grid">
            <Field label="Ngày báo giá">
              <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onCancel} disabled={submitting}>
            Hủy
          </button>
          <button className="btn btn-primary" disabled={submitting} onClick={() => onSubmit(form)}>
            {submitting ? "Đang xuất..." : "Xuất PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}

type InventoryCheckFormFields = {
  startDate: string; // yyyy-mm-dd
};

// Mặc định chọn sẵn thứ Hai gần nhất (hôm nay nếu hôm nay đã là thứ Hai) —
// đúng khuyến nghị "nên bắt đầu từ thứ Hai" trong đề xuất, người dùng vẫn có
// thể tự đổi ngày khác nếu muốn.
function nextMonday(): string {
  const d = new Date();
  const day = d.getDay(); // 0 = CN, 1 = T2, ...
  const diff = day === 1 ? 0 : day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function InventoryCheckForm({
  selectedCount,
  submitting,
  onCancel,
  onSubmit,
}: {
  selectedCount: number;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (fields: InventoryCheckFormFields) => void;
}) {
  const [form, setForm] = useState<InventoryCheckFormFields>({ startDate: nextMonday() });

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal">
        <h2>Xuất phiếu kiểm kho (PDF)</h2>
        <p className="modal-sub">
          {selectedCount} sản phẩm đã chọn sẽ đưa vào phiếu — 12 ngày kiểm kho (Thứ 2 - Thứ 7, bỏ qua Chủ nhật) tính từ ngày bắt đầu.
        </p>

        <div className="field-group">
          <div className="field-grid">
            <Field label="Ngày bắt đầu (nên là Thứ 2)">
              <input type="date" value={form.startDate} onChange={(e) => setForm({ startDate: e.target.value })} />
            </Field>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onCancel} disabled={submitting}>
            Hủy
          </button>
          <button className="btn btn-primary" disabled={submitting} onClick={() => onSubmit(form)}>
            {submitting ? "Đang xuất..." : "Xuất PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Trùng lặp có chủ đích với lib/inventoryCheckBuilder.ts (không import thẳng
// từ đó — file đó có import pdfmake/pdfFonts phía server, đưa vào bundle
// client sẽ vỡ vì dùng process.cwd()/fs). Chỉ cần hàm thuần này để tính ngày
// kết thúc cho tên file tải về, nên chấp nhận lặp code thay vì tách thêm 1
// file dùng chung chỉ cho 1 hàm nhỏ.
function getWorkingDaysClient(startDateStr: string, count: number): Date[] {
  const days: Date[] = [];
  let cur = new Date(startDateStr + "T00:00:00");
  while (days.length < count) {
    if (cur.getDay() !== 0) days.push(new Date(cur));
    cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
  }
  return days;
}

function CompleteDraftForm({
  product,
  brandNames,
  onCancel,
  onSubmit,
}: {
  product: Product;
  brandNames: string[];
  onCancel: () => void;
  onSubmit: (fields: {
    ma_noi_bo: string;
    ten_hoa_don: string;
    quy_cach: string;
    dvt: string;
    ty_le: string;
    brand: string;
  }) => Promise<void>;
}) {
  const [maNoiBo, setMaNoiBo] = useState("");
  const [tenHoaDon, setTenHoaDon] = useState("");
  const [quyCach, setQuyCach] = useState("");
  const [dvt, setDvt] = useState("");
  const [tyLe, setTyLe] = useState("");
  const [brand, setBrand] = useState("");
  const [saving, setSaving] = useState(false);

  function handleQuyCach(value: string) {
    const autoTyLe = tyLe.trim() === "" ? extractQuantityFromQuyCach(value) : null;
    setQuyCach(value);
    if (autoTyLe !== null) setTyLe(String(autoTyLe));
  }

  async function submit() {
    if (!maNoiBo.trim()) {
      alert("Cần nhập Mã nội bộ.");
      return;
    }
    setSaving(true);
    await onSubmit({ ma_noi_bo: maNoiBo, ten_hoa_don: tenHoaDon, quy_cach: quyCach, dvt, ty_le: tyLe, brand });
    setSaving(false);
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal">
        <h2>Hoàn thiện sản phẩm</h2>
        <p className="modal-sub">{product.ten_hang_hoa}</p>

        <div className="field-group">
          <div className="field-grid">
            <Field label="Mã nội bộ *">
              <input autoFocus value={maNoiBo} onChange={(e) => setMaNoiBo(e.target.value)} />
            </Field>
            <Field label="Tên trên hóa đơn">
              <input value={tenHoaDon} onChange={(e) => setTenHoaDon(e.target.value)} />
            </Field>
            <Field label="Đơn vị tính">
              <input value={dvt} onChange={(e) => setDvt(e.target.value)} />
            </Field>
            <Field label="Quy cách thùng">
              <select value={quyCach} onChange={(e) => handleQuyCach(e.target.value)}>
                <option value="">— Chọn quy cách —</option>
                {withCurrent(QUY_CACH_SUGGESTIONS, quyCach).map((q) => (
                  <option key={q}>{q}</option>
                ))}
              </select>
            </Field>
            <Field label="Tỷ lệ quy đổi">
              <select value={tyLe} onChange={(e) => setTyLe(e.target.value)}>
                <option value="">— Chọn tỷ lệ —</option>
                {withCurrent(TY_LE_SUGGESTIONS, tyLe).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Thương hiệu / NCC">
              <select value={brandNames.includes(brand) ? brand : ""} onChange={(e) => setBrand(e.target.value)}>
                <option value="">— Chọn thương hiệu —</option>
                {brandNames.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onCancel}>
            Hủy
          </button>
          <button className="btn btn-primary" disabled={saving} onClick={submit}>
            {saving ? "Đang lưu..." : "Hoàn thiện"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Dòng trống ở cuối bảng "Quản lý hàng hóa" để thêm sản phẩm mới kiểu Excel —
// gõ thẳng vào các ô cùng cấu trúc cột với bảng, Enter để lưu (không lưu khi
// blur từng ô, tránh gửi dữ liệu dở dang lúc mới Tab qua ô kế tiếp). Sau khi
// lưu thành công, dòng tự trống lại để gõ tiếp dòng kế tiếp.
function NewProductRow({
  role,
  compactView,
  brandNames,
  categoryFilter,
  onCreate,
  photoColumnStickyLeft,
  nameColumnStickyLeft,
}: {
  role: Role;
  compactView: boolean;
  brandNames: string[];
  categoryFilter: string;
  onCreate: (input: ProductInput) => Promise<boolean>;
  photoColumnStickyLeft: number;
  nameColumnStickyLeft: number;
}) {
  const defaultCategory = categoryFilter !== "Tất cả" ? categoryFilter : CATEGORY_ORDER[0];
  const blank = (): FormState => ({ ...productToFormState(null), category_sheet: defaultCategory });

  const [form, setForm] = useState<FormState>(blank);
  const [brandCustom, setBrandCustom] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const isSales = role === "sales";
  const canSubmit = isSales ? form.ten_hang_hoa.trim() !== "" : form.ma_noi_bo.trim() !== "" && form.ten_hang_hoa.trim() !== "";

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setQuyCach(value: string) {
    setForm((prev) => {
      const autoTyLe = prev.ty_le.trim() === "" ? extractQuantityFromQuyCach(value) : null;
      return { ...prev, quy_cach: value, ty_le: autoTyLe !== null ? String(autoTyLe) : prev.ty_le };
    });
  }

  async function commit() {
    if (!canSubmit) {
      alert(isSales ? "Cần nhập Tên hàng hóa trước khi lưu." : "Cần nhập Mã nội bộ và Tên hàng hóa trước khi lưu.");
      return;
    }
    setSaving(true);
    const ok = await onCreate(formStateToInput(form));
    setSaving(false);
    if (ok) {
      // Nháy nhẹ "✓ Đã thêm" 1.2s trước khi trống lại, để chắc chắn người
      // dùng thấy đã lưu thành công thay vì dòng lặng lẽ biến mất.
      setJustSaved(true);
      setTimeout(() => {
        setForm(blank());
        setBrandCustom(false);
        setJustSaved(false);
      }, 1200);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTableRowElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    }
  }

  return (
    <tr className={`new-product-row${justSaved ? " just-saved" : ""}`} onKeyDown={handleKeyDown}>
      <td className="col-check">
        <PlusIcon />
      </td>
      <td className="col-photo" style={{ left: photoColumnStickyLeft }}>
        <span className="row-photo-thumb">—</span>
      </td>
      <td className="col-name" style={{ left: nameColumnStickyLeft }}>
        <input
          placeholder="+ Tên hàng hóa mới..."
          value={form.ten_hang_hoa}
          onChange={(e) => set("ten_hang_hoa", e.target.value)}
          disabled={saving || justSaved}
        />
      </td>
      {!compactView && (
        <td data-label="Nhóm hàng">
          <select value={form.category_sheet} onChange={(e) => set("category_sheet", e.target.value)} disabled={saving || justSaved}>
            {CATEGORY_ORDER.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </td>
      )}
      {!compactView && (
        <td data-label="Mã nội bộ">
          {!isSales && (
            <input placeholder="Mã nội bộ" value={form.ma_noi_bo} onChange={(e) => set("ma_noi_bo", e.target.value)} disabled={saving || justSaved} />
          )}
        </td>
      )}
      {!compactView && (
        <td data-label="Tên hóa đơn">
          {!isSales && <input value={form.ten_hoa_don} onChange={(e) => set("ten_hoa_don", e.target.value)} disabled={saving || justSaved} />}
        </td>
      )}
      {!compactView && (
        <td data-label="ĐVT">
          {!isSales && (
            <select value={form.dvt} onChange={(e) => set("dvt", e.target.value)} disabled={saving || justSaved}>
              <option value="">—</option>
              {withCurrent(DVT_SUGGESTIONS, form.dvt).map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          )}
        </td>
      )}
      <td className="num" data-label="Giá bán lẻ">
        {!isSales && (
          <input
            className="price-input"
            inputMode="numeric"
            value={form.gia_ban}
            onChange={(e) => set("gia_ban", e.target.value)}
            disabled={saving || justSaved}
          />
        )}
      </td>
      {!compactView && (
        <td className="num" data-label="Giá Hộp">
          {!isSales && (
            <input
              className="price-input"
              inputMode="numeric"
              value={form.gia_hop}
              onChange={(e) => set("gia_hop", e.target.value)}
              disabled={saving || justSaved}
            />
          )}
        </td>
      )}
      <td className="num" data-label="Giá thùng">
        {!isSales && (
          <input
            className="price-input"
            inputMode="numeric"
            value={form.gia_thung}
            onChange={(e) => set("gia_thung", e.target.value)}
            disabled={saving || justSaved}
          />
        )}
      </td>
      {!compactView && (
        <td data-label="Quy cách thùng">
          {!isSales && (
            <select value={form.quy_cach} onChange={(e) => setQuyCach(e.target.value)} disabled={saving || justSaved}>
              <option value="">—</option>
              {withCurrent(QUY_CACH_SUGGESTIONS, form.quy_cach).map((q) => (
                <option key={q}>{q}</option>
              ))}
            </select>
          )}
        </td>
      )}
      {!compactView && (
        <td className="num" data-label="Tỷ lệ quy đổi">
          {!isSales && (
            <select value={form.ty_le} onChange={(e) => set("ty_le", e.target.value)} disabled={saving || justSaved}>
              <option value="">—</option>
              {withCurrent(TY_LE_SUGGESTIONS, form.ty_le).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          )}
        </td>
      )}
      {!compactView && (
        <td data-label="Đơn vị cấp 2 (Hộp)">
          {!isSales && (
            <select value={form.dvt_cap_2} onChange={(e) => set("dvt_cap_2", e.target.value)} disabled={saving || justSaved}>
              <option value="">—</option>
              {withCurrent(DVT_SUGGESTIONS, form.dvt_cap_2).map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          )}
        </td>
      )}
      {!compactView && (
        <td className="num" data-label="Tỷ lệ quy đổi cấp 2">
          {!isSales && (
            <select value={form.ty_le_cap_2} onChange={(e) => set("ty_le_cap_2", e.target.value)} disabled={saving || justSaved}>
              <option value="">—</option>
              {withCurrent(TY_LE_SUGGESTIONS, form.ty_le_cap_2).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          )}
        </td>
      )}
      {!compactView && (
        <td data-label="Thương hiệu">
          {!isSales &&
            (brandCustom ? (
              <input
                placeholder="Thương hiệu mới"
                value={form.brand}
                onChange={(e) => set("brand", e.target.value)}
                disabled={saving || justSaved}
              />
            ) : (
              <select
                value={brandNames.includes(form.brand) ? form.brand : ""}
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    setBrandCustom(true);
                    set("brand", "");
                  } else {
                    set("brand", e.target.value);
                  }
                }}
                disabled={saving || justSaved}
              >
                <option value="">—</option>
                {brandNames.map((b) => (
                  <option key={b}>{b}</option>
                ))}
                <option value="__new__">+ Thương hiệu mới…</option>
              </select>
            ))}
        </td>
      )}
      {!compactView && (
        <td data-label="Nhà cung cấp">
          {!isSales && <input value={form.nha_cung_cap} onChange={(e) => set("nha_cung_cap", e.target.value)} disabled={saving || justSaved} />}
        </td>
      )}
      {!compactView && (
        <td data-label="Mã hàng NCC">
          {!isSales && <input value={form.ma_hang_hoa} onChange={(e) => set("ma_hang_hoa", e.target.value)} disabled={saving || justSaved} />}
        </td>
      )}
      {!compactView && (
        <td data-label="Mã vạch">{!isSales && <input value={form.ma_vach} onChange={(e) => set("ma_vach", e.target.value)} disabled={saving || justSaved} />}</td>
      )}
      {!compactView && (
        <td data-label="Mã thùng">{!isSales && <input value={form.ma_thung} onChange={(e) => set("ma_thung", e.target.value)} disabled={saving || justSaved} />}</td>
      )}
      {!compactView && <td />}
      {!compactView && (
        <td className="col-actions">
          <button
            type="button"
            className={`btn btn-sm ${justSaved ? "btn-success" : "btn-primary"}`}
            disabled={saving || justSaved || !canSubmit}
            onClick={commit}
          >
            {justSaved ? "✓ Đã thêm" : saving ? "Đang lưu..." : "Thêm"}
          </button>
        </td>
      )}
    </tr>
  );
}

function ProductForm({
  initial,
  brandNames,
  role,
  onCancel,
  onSave,
}: {
  initial: Product;
  brandNames: string[];
  role: Role;
  onCancel: () => void;
  onSave: (input: ProductInput) => Promise<void>;
}) {
  const [form, setForm] = useState<FormState>(() => productToFormState(initial));
  const [saving, setSaving] = useState(false);

  const [brandCustom, setBrandCustom] = useState(!!initial.brand?.name && !brandNames.includes(initial.brand.name));
  // Số ít sản phẩm bán đủ 3 cấp (Gói/Túi → Hộp → Thùng, vd Bột Rau Câu) mới
  // cần tới phần này — ẩn mặc định để không làm rối form cho các sản phẩm
  // 2 cấp bình thường, tự mở sẵn nếu sản phẩm đã có dữ liệu cấp Hộp.
  const [showHopTier, setShowHopTier] = useState(Boolean(initial.dvt_cap_2 || initial.ty_le_cap_2 || initial.gia_hop));

  // Chỉ Admin mới đổi được tên hàng hóa — Kế toán vẫn sửa được các trường
  // khác, chỉ riêng tên bị khóa (app/api/admin/products/[id]/route.ts chặn ở API).
  const nameLocked = role !== "admin";

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setQuyCach(value: string) {
    setForm((prev) => {
      const autoTyLe = prev.ty_le.trim() === "" ? extractQuantityFromQuyCach(value) : null;
      return { ...prev, quy_cach: value, ty_le: autoTyLe !== null ? String(autoTyLe) : prev.ty_le };
    });
  }

  async function submit() {
    if (!form.ma_noi_bo.trim() || !form.ten_hang_hoa.trim()) {
      alert("Cần nhập Mã nội bộ và Tên hàng hóa.");
      return;
    }
    setSaving(true);
    await onSave(formStateToInput(form));
    setSaving(false);
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal">
        <h2>Sửa sản phẩm</h2>
        <p className="modal-sub">Điền thông tin cơ bản trước — các mục còn lại có thể bổ sung sau.</p>

        <div className="field-group">
          <h3>Thông tin cơ bản</h3>
          <div className="field-grid">
            <Field label="Mã nội bộ *">
              <input value={form.ma_noi_bo} onChange={(e) => set("ma_noi_bo", e.target.value)} />
            </Field>
            <Field label="Nhóm hàng *">
              <select value={form.category_sheet} onChange={(e) => set("category_sheet", e.target.value)}>
                {CATEGORY_ORDER.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label={nameLocked ? "Tên hàng hóa (gốc) — chỉ Admin đổi được" : "Tên hàng hóa (gốc) *"}>
              <input
                value={form.ten_hang_hoa}
                onChange={(e) => set("ten_hang_hoa", e.target.value)}
                disabled={nameLocked}
                title={nameLocked ? "Chỉ Admin mới đổi được tên hàng hóa" : undefined}
              />
            </Field>
            <Field label="Tên trên hóa đơn">
              <input value={form.ten_hoa_don} onChange={(e) => set("ten_hoa_don", e.target.value)} />
            </Field>
            <Field label="Đơn vị tính">
              <select value={form.dvt} onChange={(e) => set("dvt", e.target.value)}>
                <option value="">— Chọn ĐVT —</option>
                {withCurrent(DVT_SUGGESTIONS, form.dvt).map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <div className="field-group">
          <h3>Giá &amp; quy cách thùng</h3>
          <div className="field-grid">
            <Field label="Giá bán lẻ">
              <input value={form.gia_ban} onChange={(e) => set("gia_ban", e.target.value)} />
            </Field>
            <Field label="Giá thùng">
              <input value={form.gia_thung} onChange={(e) => set("gia_thung", e.target.value)} />
            </Field>
            <Field label="Quy cách thùng">
              <select value={form.quy_cach} onChange={(e) => setQuyCach(e.target.value)}>
                <option value="">— Chọn quy cách —</option>
                {withCurrent(QUY_CACH_SUGGESTIONS, form.quy_cach).map((q) => (
                  <option key={q}>{q}</option>
                ))}
              </select>
            </Field>
            <Field label="Tỷ lệ quy đổi">
              <select value={form.ty_le} onChange={(e) => set("ty_le", e.target.value)}>
                <option value="">— Chọn tỷ lệ —</option>
                {withCurrent(TY_LE_SUGGESTIONS, form.ty_le).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        {showHopTier ? (
          <div className="field-group">
            <h3>Cấp đóng gói trung gian (Hộp)</h3>
            <p className="modal-sub">Chỉ điền nếu sản phẩm bán đủ 3 cấp Gói/Túi → Hộp → Thùng — sản phẩm bình thường để trống.</p>
            <div className="field-grid">
              <Field label="Đơn vị cấp 2 (Hộp)">
                <select value={form.dvt_cap_2} onChange={(e) => set("dvt_cap_2", e.target.value)}>
                  <option value="">— Chọn đơn vị —</option>
                  {withCurrent(DVT_SUGGESTIONS, form.dvt_cap_2).map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </Field>
              <Field label="Tỷ lệ quy đổi cấp 2">
                <select value={form.ty_le_cap_2} onChange={(e) => set("ty_le_cap_2", e.target.value)}>
                  <option value="">— Chọn tỷ lệ —</option>
                  {withCurrent(TY_LE_SUGGESTIONS, form.ty_le_cap_2).map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Giá Hộp">
                <input value={form.gia_hop} onChange={(e) => set("gia_hop", e.target.value)} />
              </Field>
            </div>
          </div>
        ) : (
          <button type="button" className="btn btn-quiet" onClick={() => setShowHopTier(true)}>
            + Thêm cấp đóng gói (Hộp)
          </button>
        )}

        <div className="field-group">
          <h3>Thương hiệu &amp; mã liên quan</h3>
          <div className="field-grid">
            <Field label="Thương hiệu / NCC">
              {brandCustom ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    autoFocus
                    placeholder="Nhập tên thương hiệu mới"
                    value={form.brand}
                    onChange={(e) => set("brand", e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="button" className="btn btn-quiet" onClick={() => setBrandCustom(false)}>
                    Chọn từ danh sách
                  </button>
                </div>
              ) : (
                <select
                  value={brandNames.includes(form.brand) ? form.brand : ""}
                  onChange={(e) => {
                    if (e.target.value === "__new__") {
                      setBrandCustom(true);
                      set("brand", "");
                    } else {
                      set("brand", e.target.value);
                    }
                  }}
                >
                  <option value="">— Chọn thương hiệu —</option>
                  {brandNames.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                  <option value="__new__">+ Thương hiệu mới…</option>
                </select>
              )}
            </Field>
            <Field label="Nhà cung cấp">
              <input value={form.nha_cung_cap} onChange={(e) => set("nha_cung_cap", e.target.value)} />
            </Field>
            <Field label="Mã hàng NCC">
              <input value={form.ma_hang_hoa} onChange={(e) => set("ma_hang_hoa", e.target.value)} />
            </Field>
            <Field label="Mã vạch">
              <input value={form.ma_vach} onChange={(e) => set("ma_vach", e.target.value)} />
            </Field>
            <Field label="Mã thùng">
              <input value={form.ma_thung} onChange={(e) => set("ma_thung", e.target.value)} />
            </Field>
            <Field label="Mã nhóm thay thế">
              <input value={form.ma_nhom_thay_the} onChange={(e) => set("ma_nhom_thay_the", e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="field-group">
          <h3>Kênh bán &amp; khác</h3>
          <div className="field-grid">
            <Field label="Trạng thái">
              <input value={form.trang_thai} onChange={(e) => set("trang_thai", e.target.value)} />
            </Field>
            <Field label="Xuất xứ">
              <input value={form.xuat_xu} onChange={(e) => set("xuat_xu", e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onCancel}>
            Hủy
          </button>
          <button className="btn btn-primary" disabled={saving} onClick={submit}>
            {saving ? "Đang lưu..." : "Lưu sản phẩm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Sub-line under the product name in the table: mã vạch + mã thùng (the
// scannable codes staff actually use day-to-day) instead of mã nội bộ, which
// is still shown as a tooltip on hover.
// A product "thiếu thông tin" if it has no thương hiệu, no mã vạch, or an
// inconsistent quy cách thùng (only some of quy_cach/ty_le/gia_thung are set).
function isMissingInfo(p: Product): boolean {
  if (!p.brand_id) return true;
  if (!p.ma_vach) return true;
  const thungFields = [p.quy_cach, p.ty_le, p.gia_thung];
  const thungFieldsSet = thungFields.filter((v) => v !== null && v !== undefined && v !== "").length;
  if (thungFieldsSet > 0 && thungFieldsSet < thungFields.length) return true;
  return false;
}

function PhotoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="m21 16-5.5-5.5L5 21" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function WarningIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function ChevronDownIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
function ImportIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}
function SheetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M9 4v16" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" />
    </svg>
  );
}
function QuoteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M8 13h5M8 17h3" />
    </svg>
  );
}
function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

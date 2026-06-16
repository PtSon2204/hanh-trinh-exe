import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import Footer from "../../../shared/components/Footer";
import Navbar from "../../../shared/components/Navbar";
import type { PagedResult } from "../../../shared/types/pagination";
import type {
	ProductFilterOptions,
	ProductListItem,
	ProductQuery,
} from "../../../shared/types/product.types";
import productApi from "../api/productApi";
import Pagination from "../components/Pagination";
import ProductCard from "../components/ProductCard";
import ProductFilters from "../components/ProductFilters";
import "../styles/products.css";

const SORT_OPTIONS = [
	{ key: "newest", label: "Mới nhất", value: "newest", desc: false },
	{ key: "price-asc", label: "Giá thấp → cao", value: "price", desc: false },
	{ key: "price-desc", label: "Giá cao → thấp", value: "price", desc: true },
	{ key: "name-asc", label: "Tên A → Z", value: "name", desc: false },
];

const PAGE_SIZE = 12;
const PRODUCT_SKELETON_KEYS = Array.from(
	{ length: PAGE_SIZE },
	(_, index) => `product-skeleton-${index}`,
);

export default function ProductListPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
	const [searchKeyword, setSearchKeyword] = useState("");

	// Build query from URL
	const buildQueryFromURL = useCallback((): ProductQuery => {
		return {
			keyword: searchParams.get("keyword") || undefined,
			name: searchParams.get("name") || undefined,
			category: searchParams.get("category") || undefined,
			material: searchParams.get("material") || undefined,
			university: searchParams.get("university") || undefined,
			universityId: searchParams.get("universityId")
				? Number(searchParams.get("universityId"))
				: undefined,
			hasBaseProduct: searchParams.get("hasBaseProduct")
				? searchParams.get("hasBaseProduct") === "true"
				: undefined,
			isCustomizable: searchParams.get("isCustomizable")
				? searchParams.get("isCustomizable") === "true"
				: undefined,
			minPrice: searchParams.get("minPrice")
				? Number(searchParams.get("minPrice"))
				: undefined,
			maxPrice: searchParams.get("maxPrice")
				? Number(searchParams.get("maxPrice"))
				: undefined,
			sortBy: searchParams.get("sortBy") || "newest",
			sortDescending: searchParams.get("sortDescending") === "true",
			pageNumber: searchParams.get("page")
				? Number(searchParams.get("page"))
				: 1,
			pageSize: PAGE_SIZE,
		};
	}, [searchParams]);

	const [query, setQuery] = useState<ProductQuery>(buildQueryFromURL);
	const [data, setData] = useState<PagedResult<ProductListItem> | null>(null);
	const [filterOptions, setFilterOptions] =
		useState<ProductFilterOptions | null>(null);
	const [loading, setLoading] = useState(true);
	const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);

	// Sync URL → query
	useEffect(() => {
		setQuery(buildQueryFromURL());
	}, [buildQueryFromURL]);

	// Sync query parameters to search input state
	useEffect(() => {
		setSearchKeyword(query.keyword ?? "");
	}, [query.keyword]);

	useEffect(() => {
		let cancelled = false;
		setFilterOptionsLoading(true);
		productApi
			.getFilterOptions()
			.then((res) => {
				if (!cancelled) setFilterOptions(res);
			})
			.catch(() => {
				if (!cancelled) toast.error("Không thể tải bộ lọc sản phẩm");
			})
			.finally(() => {
				if (!cancelled) setFilterOptionsLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	// Fetch products
	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		productApi
			.getProducts(query)
			.then((res) => {
				if (!cancelled) setData(res);
			})
			.catch(() => {
				if (!cancelled) toast.error("Không thể tải danh sách sản phẩm");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [query]);

	// Sync query → URL
	const updateQuery = (newQuery: ProductQuery) => {
		const params = new URLSearchParams();
		if (newQuery.keyword) params.set("keyword", newQuery.keyword);
		if (newQuery.name) params.set("name", newQuery.name);
		if (newQuery.category) params.set("category", newQuery.category);
		if (newQuery.material) params.set("material", newQuery.material);
		if (newQuery.university) params.set("university", newQuery.university);
		if (newQuery.universityId)
			params.set("universityId", String(newQuery.universityId));
		if (newQuery.hasBaseProduct != null)
			params.set("hasBaseProduct", String(newQuery.hasBaseProduct));
		if (newQuery.isCustomizable != null)
			params.set("isCustomizable", String(newQuery.isCustomizable));
		if (newQuery.minPrice != null)
			params.set("minPrice", String(newQuery.minPrice));
		if (newQuery.maxPrice != null)
			params.set("maxPrice", String(newQuery.maxPrice));
		if (newQuery.sortBy) params.set("sortBy", newQuery.sortBy);
		if (newQuery.sortDescending) params.set("sortDescending", "true");
		if (newQuery.pageNumber && newQuery.pageNumber > 1)
			params.set("page", String(newQuery.pageNumber));
		setSearchParams(params, { replace: true });
	};

	const handleFilterChange = (newQ: ProductQuery) => updateQuery(newQ);
	const handlePageChange = (page: number) =>
		updateQuery({ ...query, pageNumber: page });

	const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const opt =
			SORT_OPTIONS.find((option) => option.key === e.target.value) ??
			SORT_OPTIONS[0];
		updateQuery({
			...query,
			sortBy: opt.value,
			sortDescending: opt.desc,
			pageNumber: 1,
		});
	};

	const currentSortKey =
		SORT_OPTIONS.find(
			(o) =>
				o.value === (query.sortBy || "newest") &&
				o.desc === (query.sortDescending ?? false),
		)?.key ?? SORT_OPTIONS[0].key;

	const handleInlineSearch = () => {
		updateQuery({
			...query,
			keyword: searchKeyword.trim() || undefined,
			name: undefined,
			pageNumber: 1,
		});
	};

	const handleClearSearch = () => {
		setSearchKeyword("");
		updateQuery({
			...query,
			keyword: undefined,
			name: undefined,
			pageNumber: 1,
		});
	};

	const hasInlineSearch = !!query.keyword || !!query.name;

	return (
		<div
			className="plp flex flex-col min-h-screen"
			style={{ fontFamily: "'Outfit', sans-serif" }}
		>
			<Navbar />

			<main className="flex-grow flex-1">
				{/* ─── Hero banner ─── */}
				<div className="plp-hero">
					<div className="plp-hero__content">
						<h1 className="plp-hero__title">Bộ sưu tập sản phẩm</h1>
						<p className="plp-hero__sub">
							Khám phá đa dạng kiểu dáng, chất liệu và mẫu thiết kế đồng phục
							cho trường lớp của bạn.
						</p>
					</div>
				</div>

				{/* ─── Main content ─── */}
				<div className="plp-main">
					{/* Mobile filter toggle */}
					<button
						className="plp-filter-toggle"
						type="button"
						onClick={() => setMobileFilterOpen((o) => !o)}
					>
						{mobileFilterOpen ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
					</button>

					<div className="plp-layout">
						{/* Sidebar */}
						<div
							className={`plp-sidebar ${mobileFilterOpen ? "plp-sidebar--open" : ""}`}
						>
							<ProductFilters
								filterOptions={filterOptions}
								loading={filterOptionsLoading}
								query={query}
								onChange={handleFilterChange}
							/>
						</div>

						{/* Products grid */}
						<div className="plp-content">
							{/* Toolbar */}
							<div className="plp-toolbar">
								<p className="plp-toolbar__count">
									{loading
										? "Đang tải..."
										: `${data?.totalRecords ?? 0} sản phẩm`}
								</p>
								<div className="plp-toolbar__sort">
									<label htmlFor="sort-select">Sắp xếp:</label>
									<select
										id="sort-select"
										value={currentSortKey}
										onChange={handleSortChange}
									>
										{SORT_OPTIONS.map((o) => (
											<option key={o.key} value={o.key}>
												{o.label}
											</option>
										))}
									</select>
								</div>
							</div>

							{/* Inline search bar */}
							<div className="plp-search-bar" style={{ marginBottom: "1rem" }}>
								<div className="plp-search-bar__input-wrap">
									<input
										type="text"
										className="plp-search-bar__input"
										placeholder="Tìm sản phẩm, trường, kiểu dáng, chất liệu..."
										value={searchKeyword}
										onChange={(e) => setSearchKeyword(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter") handleInlineSearch();
										}}
										id="inline-search-input"
									/>
									<button
										className="plp-search-bar__btn"
										type="button"
										onClick={handleInlineSearch}
									>
										Tìm kiếm
									</button>
								</div>
								{hasInlineSearch && (
									<button
										className="plp-search-bar__clear"
										type="button"
										onClick={handleClearSearch}
									>
										Xoá bộ lọc
									</button>
								)}
							</div>

							{/* Grid */}
							{loading ? (
								<div className="plp-grid">
									{PRODUCT_SKELETON_KEYS.map((skeletonKey) => (
										<div key={skeletonKey} className="product-card-skeleton">
											<div className="product-card-skeleton__img" />
											<div className="product-card-skeleton__body">
												<div className="product-card-skeleton__line product-card-skeleton__line--title" />
												<div className="product-card-skeleton__line product-card-skeleton__line--sub" />
												<div className="product-card-skeleton__line product-card-skeleton__line--price" />
											</div>
										</div>
									))}
								</div>
							) : data && data.data.length > 0 ? (
								<>
									<div className="plp-grid">
										{data.data.map((p) => (
											<ProductCard key={p.productId} product={p} />
										))}
									</div>
									<Pagination
										pageNumber={data.pageNumber}
										totalPages={data.totalPages}
										onPageChange={handlePageChange}
									/>
								</>
							) : (
								<div className="plp-empty">
									<h3>Không tìm thấy sản phẩm</h3>
									<p>Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm.</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</main>

			<Footer />
		</div>
	);
}

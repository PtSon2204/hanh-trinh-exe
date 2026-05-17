import { Link, useLocation } from "react-router-dom";

type ErrorPageState = {
	message?: string;
	title?: string;
};

export function ErrorPage() {
	const location = useLocation();
	const state = location.state as ErrorPageState | null;

	return (
		<main className="app-error-page">
			<section className="app-error-card" aria-labelledby="error-page-title">
				<p className="app-error-card__eyebrow">Truy cập bị từ chối</p>
				<h1 id="error-page-title">
					{state?.title ?? "Bạn không có quyền vào khu vực này"}
				</h1>
				<p>
					{state?.message ??
						"Vui lòng đăng nhập bằng tài khoản quản trị viên để tiếp tục."}
				</p>
				<div className="app-error-card__actions">
					<Link to="/login">Đăng nhập</Link>
					<Link to="/">Về trang chủ</Link>
				</div>
			</section>
		</main>
	);
}

export default ErrorPage;

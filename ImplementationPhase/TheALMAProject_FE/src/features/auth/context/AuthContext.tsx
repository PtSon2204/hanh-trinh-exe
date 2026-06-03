import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import type { UserSession } from "../../../shared/types/auth.types";
import axiosClient from "../../../shared/api/axiosClient";

// ─── Context Shape ────────────────────────────────────────────────────────────
interface AuthContextValue {
	user: UserSession | null;
	isAuthenticated: boolean;
	login: (session: UserSession) => void;
	logout: () => void;
}

// ─── JWT Payload — khớp với claims được tạo trong JwtService.cs ───────────────
interface JwtPayload {
	nameid: string;       // ClaimTypes.NameIdentifier → UserId
	email: string;        // ClaimTypes.Email
	role: string;         // ClaimTypes.Role  ← đây là role thật, server ký
	unique_name: string;  // ClaimTypes.Name  → FullName
	exp: number;          // Expiration (Unix timestamp)
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Helper: Decode JWT và lấy role thật từ payload ──────────────────────────
// SECURITY: Role được lấy từ JWT (được server ký bằng SecretKey),
// KHÔNG từ localStorage (người dùng có thể sửa tùy ý qua DevTools).
// Kẻ tấn công không thể giả mạo role vì JWT đã được ký số.
function loadSession(): UserSession | null {
	try {
		const token = localStorage.getItem("token");
		if (!token) return null;

		// Decode JWT để lấy claims thật — không cần verify signature ở đây
		// vì mọi request API đều bị backend verify JWT lại.
		// Mục đích: lấy role ĐÚNG để hiển thị UI, ngăn client-side spoofing.
		const decoded = jwtDecode<JwtPayload>(token);

		// Kiểm tra token có hết hạn chưa (exp là Unix timestamp tính bằng giây)
		if (decoded.exp * 1000 < Date.now()) {
			// Token hết hạn → xóa sạch localStorage và yêu cầu đăng nhập lại
			localStorage.removeItem("token");
			localStorage.removeItem("userAvatarUrl");
			return null;
		}

		return {
			token,
			email: decoded.email ?? "",
			fullName: decoded.unique_name ?? "",
			role: decoded.role ?? "",           // ← LẤY TỪ JWT, không từ localStorage
			avatarUrl: localStorage.getItem("userAvatarUrl") || null,
		};
	} catch {
		// Token bị lỗi format → xóa và yêu cầu đăng nhập lại
		localStorage.removeItem("token");
		localStorage.removeItem("userAvatarUrl");
		return null;
	}
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<UserSession | null>(loadSession);

	const login = useCallback((session: UserSession) => {
		// Chỉ lưu token vào localStorage — role/email/fullName sẽ được
		// decode từ JWT mỗi lần load, tránh việc người dùng sửa trực tiếp.
		localStorage.setItem("token", session.token);
		if (session.avatarUrl) {
			localStorage.setItem("userAvatarUrl", session.avatarUrl);
		} else {
			localStorage.removeItem("userAvatarUrl");
		}
		setUser(session);
	}, []);

	const logout = useCallback(() => {
		localStorage.removeItem("token");
		localStorage.removeItem("userAvatarUrl");
		setUser(null);
	}, []);

	// Sync profile (especially avatar and fullName) if not yet synced in session
	useEffect(() => {
		if (user && !user.avatarUrl) {
			axiosClient.get("/profile")
				.then(res => {
					if (res.data?.avatarUrl) {
						login({
							...user,
							avatarUrl: res.data.avatarUrl,
							fullName: res.data.fullName ?? user.fullName,
						});
					}
				})
				.catch(err => {
					console.error("Failed to sync profile avatar on load:", err);
				});
		}
	}, [user, login]);

	return (
		<AuthContext.Provider
			value={{ user, isAuthenticated: !!user, login, logout }}
		>
			{children}
		</AuthContext.Provider>
	);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
	return ctx;
}

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useState, useEffect } from "react";
import type { UserSession } from "../../../shared/types/auth.types";
import axiosClient from "../../../shared/api/axiosClient";

// ─── Context Shape ────────────────────────────────────────────────────────────
interface AuthContextValue {
	user: UserSession | null;
	isAuthenticated: boolean;
	login: (session: UserSession) => void;
	logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Helper: hydrate from localStorage ────────────────────────────────────────
function loadSession(): UserSession | null {
	try {
		const token = localStorage.getItem("token");
		// Chỉ cần token là đủ để xác nhận đã đăng nhập.
		// Các field khác fallback về "" nếu không có (tránh trường hợp BE
		// không trả về role hoặc trả về null làm loadSession() return null
		// dù user đã login hợp lệ).
		if (token) {
			return {
				token,
				email: localStorage.getItem("userEmail") ?? "",
				fullName: localStorage.getItem("userFullName") ?? "",
				role: localStorage.getItem("userRole") ?? "",
				avatarUrl: localStorage.getItem("userAvatarUrl") || null,
			};
		}
	} catch {
		// ignore
	}
	return null;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<UserSession | null>(loadSession);

	const login = useCallback((session: UserSession) => {
		localStorage.setItem("token", session.token);
		localStorage.setItem("userEmail", session.email);
		localStorage.setItem("userFullName", session.fullName);
		localStorage.setItem("userRole", session.role);
		if (session.avatarUrl) {
			localStorage.setItem("userAvatarUrl", session.avatarUrl);
		} else {
			localStorage.removeItem("userAvatarUrl");
		}
		setUser(session);
	}, []);

	const logout = useCallback(() => {
		localStorage.removeItem("token");
		localStorage.removeItem("userEmail");
		localStorage.removeItem("userFullName");
		localStorage.removeItem("userRole");
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

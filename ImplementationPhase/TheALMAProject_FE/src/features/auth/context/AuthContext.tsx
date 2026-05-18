import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useState } from "react";
import type { UserSession } from "../../../shared/types/auth.types";

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
		const email = localStorage.getItem("userEmail");
		const fullName = localStorage.getItem("userFullName");
		const role = localStorage.getItem("userRole");
		if (token && email && fullName && role) {
			return { token, email, fullName, role };
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
		setUser(session);
	}, []);

	const logout = useCallback(() => {
		localStorage.removeItem("token");
		localStorage.removeItem("userEmail");
		localStorage.removeItem("userFullName");
		localStorage.removeItem("userRole");
		setUser(null);
	}, []);

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

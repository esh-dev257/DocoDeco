import { useCallback, useEffect, useState } from "react"
import type { User } from "../types"
import * as api from "./api"

const TOKEN_KEY = "auth_token"

export function getToken(): string | null {
	return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
	localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
	localStorage.removeItem(TOKEN_KEY)
}

// Decision: Decode JWT client-side to extract user info without a network request.
// The JWT is still verified server-side on every API call — this is just for
// quick UI rendering (user email, protected route guards).
function decodeJwtPayload(token: string): { sub: string; email: string; exp?: number } | null {
	try {
		const payload = JSON.parse(atob(token.split(".")[1]))
		return payload
	} catch {
		return null
	}
}

// Check if user is authenticated (for route guards — no hook needed)
export function isAuthenticated(): boolean {
	const token = getToken()
	if (!token) return false
	const payload = decodeJwtPayload(token)
	if (!payload) return false
	// Check expiry
	const exp = payload.exp
	if (exp && exp * 1000 < Date.now()) {
		clearToken()
		return false
	}
	return true
}

// useAuth hook — provides user state, login, and logout for components
export function useAuth() {
	const [user, setUser] = useState<User | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		const token = getToken()
		if (token) {
			const payload = decodeJwtPayload(token)
			if (payload) {
				setUser({ id: payload.sub, email: payload.email, createdAt: 0 })
			} else {
				clearToken()
			}
		}
		setIsLoading(false)
	}, [])

	const login = useCallback(async (email: string) => {
		const result = await api.login(email)
		setToken(result.token)
		setUser({
			id: result.user.id,
			email: result.user.email,
			createdAt: result.user.createdAt,
		})
		return result
	}, [])

	const logout = useCallback(() => {
		clearToken()
		setUser(null)
	}, [])

	return { user, isLoading, login, logout, isAuthenticated: !!user }
}

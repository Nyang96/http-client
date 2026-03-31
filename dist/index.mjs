import e from "axios";
//#region src/utils/resolveLogger.ts
var t = (e) => e ? typeof e == "function" ? e : (e, t) => {
	t ? console.log(e, t) : console.log(e);
} : () => {}, n = (e, t) => {
	e.interceptors.request.use((e) => (e._requestStartTime = Date.now(), t(`${e.method?.toUpperCase()} ${e.url}`), e));
}, r = (e, t) => {
	e.interceptors.response.use((e) => {
		if (e.config._requestStartTime) {
			let n = Date.now() - e.config._requestStartTime;
			t(`${e.config.method?.toUpperCase()} ${e.config.url} (${n}ms)`);
		}
		return e;
	});
}, i = (e, t) => {
	e.interceptors.request.use(async (e) => {
		let n = await t.getAccessToken();
		return n && (e.headers.Authorization = `Bearer ${n}`), e;
	});
}, a = (e, t, n) => {
	let r = t.auth, i = !1, a = [], o = (e = null, t = null) => {
		a.forEach(({ resolve: n, reject: r }) => {
			e ? r(e) : n(t);
		}), a = [];
	}, s = r.shouldRefresh ?? ((e) => {
		let t = e.response?.status, n = e.response?.data?.message, i = r.refreshCondition?.statusCodes ?? [], a = r.refreshCondition?.messages ?? [];
		return t != null && i.includes(t) || n != null && a.includes(n);
	});
	e.interceptors.response.use(null, async (c) => {
		let l = c.config;
		if (c.code === "ERR_CANCELED" || !s(c) || l?._alreadyRetried || !l) return Promise.reject(c);
		if (i) return new Promise((t, n) => {
			a.push({
				resolve: (n) => {
					l.headers.Authorization = `Bearer ${n}`, t(e(l));
				},
				reject: n
			});
		});
		l._alreadyRetried = !0, i = !0;
		try {
			let i = await r.getRefreshToken();
			if (!i) throw Error("No refresh token available");
			let a = await r.refreshRequest(i, t.baseURL);
			return await r.onTokenRefreshed(a), l.headers.Authorization = `Bearer ${a.accessToken}`, o(null, a.accessToken), n("Token refreshed, retrying request"), e(l);
		} catch (e) {
			return o(e, null), n("Token refresh failed"), await r.onAuthFailure(), Promise.reject(e);
		} finally {
			i = !1;
		}
	});
}, o = (e, t, n) => {
	let { statusCodes: r, maxCount: i, backoff: a = "exponential" } = t;
	e.interceptors.response.use(null, async (t) => {
		let o = t.config, s = t.response?.status ?? 0, c = o?._retryCount ?? 0;
		if (r.includes(s) && c < i && o) {
			o._retryCount = c + 1;
			let t = a === "exponential" ? 2 ** c * 1e3 : 1e3;
			return n(`Retry ${c + 1}/${i} after ${t}ms`), await new Promise((e) => setTimeout(e, t)), e(o);
		}
		return Promise.reject(t);
	});
}, s = (e, t, n) => {
	t.onError && e.interceptors.response.use(null, async (e) => {
		let r = e.config, i = {
			url: r?.url,
			method: r?.method,
			status: e.response?.status,
			duration: r?._requestStartTime ? Date.now() - r._requestStartTime : null,
			retryCount: r?._retryCount ?? 0,
			clientType: n
		};
		return await t.onError(e, i), Promise.reject(e);
	});
}, c = (e) => {
	e.interceptors.request.use((e) => {
		let t = e.data;
		return t instanceof FormData || t instanceof Blob ? e.headers.delete("Content-Type") : t instanceof URLSearchParams && e.headers.set("Content-Type", "application/x-www-form-urlencoded"), e;
	});
}, l = (e) => {
	let l = t(e.debug), d = u(e);
	n(d, l), c(d), r(d, l), e.retry && o(d, e.retry, l), s(d, e, "public");
	let f = null;
	return e.auth && (f = u(e), n(f, l), c(f), i(f, e.auth), r(f, l), a(f, e, l), e.retry && o(f, e.retry, l), s(f, e, "private")), {
		publicClient: d,
		privateClient: f
	};
}, u = (t) => e.create({
	baseURL: t.baseURL,
	timeout: t.timeout ?? 3e4,
	withCredentials: t.withCredentials ?? !1,
	headers: {
		"Content-Type": "application/json",
		...t.defaultHeaders
	}
});
//#endregion
export { l as createApiClient };

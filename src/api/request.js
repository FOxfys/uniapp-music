// src/api/request.js
const BASE_URL = 'https://music.686909.xyz';

export const request = (options) => {
	return new Promise((resolve, reject) => {
		const cookie = uni.getStorageSync('session_cookie') || '';
		
		const header = { 
			'Cookie': cookie,
			...options.header 
		};

		// 修复：动态设置 Content-Type
		if (options.method && options.method.toUpperCase() === 'POST') {
			if (options.url === '/user/login' || options.url === '/user/register') {
				header['Content-Type'] = 'application/x-www-form-urlencoded';
			} else {
				header['Content-Type'] = 'application/json';
			}
		} 
		// 针对 DELETE 请求，显式移除 Content-Type，或者设置为 text/plain
		else if (options.method && options.method.toUpperCase() === 'DELETE') {
			// header['Content-Type'] = 'text/plain'; // 可选
		}

		console.log(`[Request] ${options.method || 'GET'} ${options.url}`, { data: options.data, header });

		uni.request({
			url: BASE_URL + options.url,
			method: options.method || 'GET',
			data: options.data || {},
			header: header,
			success: (res) => {
				console.log(`[Response] ${res.statusCode}`, res.data);
				
				let setCookie = res.header['Set-Cookie'] || res.header['set-cookie'];
				if (setCookie) {
					if (Array.isArray(setCookie)) {
						setCookie = setCookie.join('; ');
					}
					uni.setStorageSync('session_cookie', setCookie);
					console.log('Cookie saved:', setCookie);
				}

				if (typeof res.data === 'string') {
					console.warn('Received string response (likely HTML):', res.data.substring(0, 100));
					if (options.url.includes('logout')) {
						resolve({ code: 200, message: 'Logged out' });
						return;
					}
					uni.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
					uni.removeStorageSync('userInfo');
					uni.removeStorageSync('session_cookie');
					uni.navigateTo({ url: '/pages/login/login' });
					reject(res.data);
					return;
				}

				if (res.statusCode >= 200 && res.statusCode < 300) {
					const responseData = res.data || {};
					if (typeof responseData === 'object') {
						if (responseData.code === undefined && responseData.status === undefined) {
							responseData.code = 200;
						}
						if (responseData.status === 200) {
							responseData.code = 200;
						}
					}
					resolve(responseData);
				} else if (res.statusCode === 401) {
					uni.showToast({ title: '请先登录', icon: 'none' });
					uni.navigateTo({ url: '/pages/login/login' });
					reject(res.data);
				} else {
					uni.showToast({
						title: res.data.message || `错误 ${res.statusCode}`,
						icon: 'none'
					});
					reject(res.data);
				}
			},
			fail: (err) => {
				console.error('[Request Fail]', err);
				uni.showToast({ title: '网络请求失败', icon: 'none' });
				reject(err);
			}
		});
	});
};

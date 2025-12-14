// src/api/request.js
const BASE_URL = 'https://music.686909.xyz';

export const request = (options) => {
	return new Promise((resolve, reject) => {
		uni.request({
			url: BASE_URL + options.url,
			method: options.method || 'GET',
			data: options.data || {},
			header: {
				// 'Content-Type': 'application/json',
				// 在这里可以统一设置Token，从Storage中获取
				// 'Authorization': uni.getStorageSync('token') || ''
			},
			success: (res) => {
				if (res.statusCode === 200) {
					// 简单的成功判断，具体根据你的后端返回格式
					if (res.data.code === 200 || res.data.status === 200) {
						resolve(res.data);
					} else if (res.data.code === 401) {
						// 未登录或Token失效
						uni.showToast({
							title: '请先登录',
							icon: 'none'
						});
						// 跳转到登录页
						uni.navigateTo({
							url: '/pages/login/login'
						});
						reject(res.data);
					} else {
						// 其他业务错误，部分接口可能没有code字段，直接返回数据
						// 这里做一个兼容，如果res.data本身就是数据对象，也resolve
						resolve(res.data);
					}
				} else {
					// HTTP状态码错误
					uni.showToast({
						title: `网络错误 ${res.statusCode}`,
						icon: 'none'
					});
					reject(res);
				}
			},
			fail: (err) => {
				uni.showToast({
					title: '请求接口失败',
					icon: 'none'
				});
				reject(err);
			}
		});
	});
};

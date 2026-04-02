import axios from 'axios';
import { appMessage } from './app-message';

// API基础URL - 各服务文件中已包含完整路径
const API_BASE_URL = '';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const createApiError = (errorMessage: string, error: any) => {
  const apiError = new Error(errorMessage) as Error & {
    status?: number;
    response?: any;
    data?: any;
  };

  apiError.name = 'ApiError';
  apiError.status = error.response?.status;
  apiError.response = error.response;
  apiError.data = error.response?.data;

  return apiError;
};

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加token到请求头
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 处理API统一响应格式
    if (response.data && response.data.success === false) {
      const errorMsg = response.data.error || response.data.message || '请求失败';
      appMessage.error(errorMsg);
      return Promise.reject(createApiError(errorMsg, { response }));
    }
    return response.data?.data || response.data;
  },
  (error) => {
    // 处理HTTP错误
    let errorMessage = '网络请求失败';

    if (error.response) {
      // 服务器返回错误状态码
      // 尝试从响应数据中获取详细错误信息
      if (error.response.data && (error.response.data.error || error.response.data.message)) {
        errorMessage = error.response.data.error || error.response.data.message;
      } else {
        switch (error.response.status) {
          case 400:
            errorMessage = '请求参数错误';
            break;
          case 401:
            errorMessage = '未授权，请重新登录';
            localStorage.removeItem('token');
            window.location.href = '/login';
            break;
          case 403:
            errorMessage = '拒绝访问';
            break;
          case 404:
            errorMessage = '请求的资源不存在';
            break;
          case 500:
            errorMessage = '服务器内部错误';
            break;
          default:
            errorMessage = `请求失败: ${error.response.status}`;
        }
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      errorMessage = '网络连接失败，请检查网络设置';
    } else {
      // 请求配置出错
      errorMessage = error.message;
    }

    appMessage.error(errorMessage);
    console.error('API请求错误:', error);
    return Promise.reject(createApiError(errorMessage, error));
  }
);

export default api;

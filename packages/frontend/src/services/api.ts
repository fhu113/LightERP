import axios from 'axios';
import { message } from 'antd';

// API基础URL - 支持环境变量配置
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加token等认证信息
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
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
      const errorMsg = response.data.error || '请求失败';
      message.error(errorMsg);
      return Promise.reject(new Error(errorMsg));
    }
    return response.data?.data || response.data;
  },
  (error) => {
    // 处理HTTP错误
    let errorMessage = '网络请求失败';

    if (error.response) {
      // 服务器返回错误状态码
      // 尝试从响应数据中获取详细错误信息
      if (error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      } else {
        switch (error.response.status) {
          case 400:
            errorMessage = '请求参数错误';
            break;
          case 401:
            errorMessage = '未授权，请重新登录';
            // 可以在这里跳转到登录页
            // window.location.href = '/login';
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

    message.error(errorMessage);
    console.error('API请求错误:', error);
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;
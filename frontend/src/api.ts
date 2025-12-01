import axios from 'axios'
import type { Transaction, Category, CategoryStats, MonthlyData } from './types'

const API_BASE = '/api'

export const api = {
  transactions: {
    getAll: async (params?: {
      startDate?: string
      endDate?: string
      category?: string
      institution?: string
    }): Promise<Transaction[]> => {
      const response = await axios.get(`${API_BASE}/transactions`, { params })
      return response.data
    },

    getStats: async (params?: {
      startDate?: string
      endDate?: string
    }): Promise<CategoryStats[]> => {
      const response = await axios.get(`${API_BASE}/transactions/stats`, { params })
      return response.data
    },

    getMonthly: async (): Promise<MonthlyData> => {
      const response = await axios.get(`${API_BASE}/transactions/monthly`)
      return response.data
    },

    upload: async (file: File, institution: string): Promise<{ success: boolean; count: number; message: string }> => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('institution', institution)

      const response = await axios.post(`${API_BASE}/transactions/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data
    },

    update: async (
      id: number,
      data: Partial<Pick<Transaction, 'category' | 'description' | 'amount' | 'date'>>
    ): Promise<{ success: boolean; message: string }> => {
      const response = await axios.put(`${API_BASE}/transactions/${id}`, data)
      return response.data
    },

    delete: async (id: number): Promise<{ success: boolean; message: string }> => {
      const response = await axios.delete(`${API_BASE}/transactions/${id}`)
      return response.data
    }
  },

  categories: {
    getAll: async (): Promise<Category[]> => {
      const response = await axios.get(`${API_BASE}/categories`)
      return response.data
    },

    create: async (data: {
      name: string
      color?: string
      icon?: string
    }): Promise<{ success: boolean; id: number; message: string }> => {
      const response = await axios.post(`${API_BASE}/categories`, data)
      return response.data
    },

    update: async (
      id: number,
      data: Partial<Pick<Category, 'name' | 'color' | 'icon'>>
    ): Promise<{ success: boolean; message: string }> => {
      const response = await axios.put(`${API_BASE}/categories/${id}`, data)
      return response.data
    },

    delete: async (id: number): Promise<{ success: boolean; message: string }> => {
      const response = await axios.delete(`${API_BASE}/categories/${id}`)
      return response.data
    }
  },

  plaid: {
    createLinkToken: async (): Promise<{ link_token: string }> => {
      const response = await axios.post(`${API_BASE}/plaid/create_link_token`)
      return response.data
    },

    exchangePublicToken: async (publicToken: string): Promise<{ success: boolean; accounts: any[] }> => {
      const response = await axios.post(`${API_BASE}/plaid/exchange_public_token`, {
        public_token: publicToken
      })
      return response.data
    },

    getAccounts: async (): Promise<any[]> => {
      const response = await axios.get(`${API_BASE}/plaid/accounts`)
      return response.data
    },

    syncAccount: async (accountId: number): Promise<{ success: boolean; added: number; modified: number; removed: number }> => {
      const response = await axios.post(`${API_BASE}/plaid/sync/${accountId}`)
      return response.data
    },

    syncAll: async (): Promise<{ success: boolean; results: any[] }> => {
      const response = await axios.post(`${API_BASE}/plaid/sync_all`)
      return response.data
    },

    disconnectAccount: async (accountId: number): Promise<{ success: boolean; message: string }> => {
      const response = await axios.delete(`${API_BASE}/plaid/account/${accountId}`)
      return response.data
    }
  }
}

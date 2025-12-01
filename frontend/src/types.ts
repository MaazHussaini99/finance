export interface Transaction {
  id: number
  date: string
  description: string
  amount: number
  category: string
  institution: string
  account_type: string
  original_data: string
  created_at: string
}

export interface Category {
  id: number
  name: string
  color: string
  icon: string
  created_at: string
}

export interface CategoryStats {
  category: string
  count: number
  total: number
  average: number
}

export interface MonthlyData {
  [month: string]: {
    category: string
    total: number
    count: number
  }[]
}

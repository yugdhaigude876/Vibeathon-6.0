export interface MenuItem {
  id: string
  name: string
  description?: string | null
  price: number
  category: string
  is_available: boolean
  image_url?: string | null
  created_at?: string
}

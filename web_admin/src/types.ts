export interface Item {
  id: string;
  name: string;
  category: 'Barang' | 'Ruangan';
  is_available: boolean;
  image_url?: string | null;
  quantity?: number;
  available_quantity?: number;
}

export interface BorrowLog {
  id: string;
  item_id: string;
  borrower_name: string;
  borrow_date: string;
  status: 'Dipinjam' | 'Selesai';
  items?: {
    name: string;
    category: string;
  } | null;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
}


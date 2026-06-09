export interface Item {
  id: string;
  name: string;
  category: 'Barang' | 'Ruangan';
  is_available: boolean;
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

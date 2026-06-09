# PinjamKuy 🏷️

Sistem peminjaman inventaris & ruangan modern dengan antarmuka premium dark mode.

## Tech Stack

- **Framework:** Flutter (Material 3)
- **Backend:** Supabase (Realtime)
- **State Management:** GetX
- **PDF Export:** pdf + printing

## Getting Started

### Prerequisites

- Flutter SDK ^3.11
- Supabase project (with `items` and `borrow_logs` tables)

### Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/YOUR_USERNAME/pinjamkuy.git
   cd pinjamkuy
   ```

2. Install dependencies:
   ```bash
   flutter pub get
   ```

3. Set your Supabase anon key:
   ```bash
   # Option A: Run with --dart-define
   flutter run --dart-define=SUPABASE_ANON_KEY=your_key_here

   # Option B: Edit lib/main.dart directly
   ```

### Run

```bash
flutter run
```

### Build for Web (Vercel)

```bash
flutter build web --dart-define=SUPABASE_ANON_KEY=your_key_here
```

Then deploy the `build/web` folder to Vercel:

```bash
cd build/web
npx vercel --prod
```

### Build APK

```bash
flutter build apk --dart-define=SUPABASE_ANON_KEY=your_key_here
```

## Database Schema

### `items` table
| Column        | Type    | Default |
|---------------|---------|---------|
| id            | uuid    | gen_random_uuid() |
| name          | text    |         |
| category      | text    | 'Barang' or 'Ruangan' |
| is_available  | boolean | true    |

### `borrow_logs` table
| Column        | Type        | Default |
|---------------|-------------|---------|
| id            | uuid        | gen_random_uuid() |
| item_id       | uuid (FK)   |         |
| borrower_name | text        |         |
| borrow_date   | timestamptz |         |
| status        | text        | 'Dipinjam' or 'Selesai' |

## Features

- ✅ Real-time catalog with Supabase streams
- ✅ Smart item borrowing with bottom sheet forms
- ✅ Admin dashboard with active borrowing management
- ✅ PDF report generation with styled tables
- ✅ Premium dark mode design
- ✅ Shimmer loading states
- ✅ Category filtering & search
- ✅ Web & Mobile deployment ready

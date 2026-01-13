# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Golf Intranet is a Next.js 16 application for managing golf course reservations and tee times. Built with TypeScript, Supabase, and Tailwind CSS, it provides user authentication, course time management, reservation tracking, and admin functionality.

## Development Commands

### Development Server
```bash
pnpm dev          # Start dev server on http://localhost:3000
pnpm build        # Build production bundle
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

### Database Management
Apply migrations manually via Supabase Dashboard SQL Editor:
1. Execute `supabase/migrations/20240101000000_create_initial_schema.sql`
2. Execute `supabase/migrations/20240101000001_enable_rls.sql`

## Environment Setup

Required environment variables in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Architecture

### Authentication System
- **Phone-based auth**: Users log in with phone numbers (converted to email format: `{phone}@golf-intranet.local`)
- **User types**: `manager` (default) and `admin` (elevated permissions)
- **Auth flow**: `middleware.ts` → `useAuth` hook → Supabase Auth
- **Profile management**: Auth users linked to `users` table via UUID

### Database Schema (8 Tables)

**Core Tables:**
- `users`: User profiles linked to Supabase auth.users
- `golf_clubs`: Golf club information and reservation settings
- `courses`: Individual courses within golf clubs
- `site_ids`: External booking site identifiers per golf club

**Transaction Tables:**
- `course_times`: Tee time reservations (main entity)
- `join_persons`: Players joining a tee time (1-4 per time)
- `black_lists`: Blocked phone numbers
- `holidays`: Non-bookable dates

**Key Enums:**
- `user_type`: 'manager' | 'admin'
- `course_time_status`: '판매완료' | '미판매' | '타업체마감'
- `join_person_status`: '입금확인전' | '입금확인중' | '입금완료' | '환불확인중' | '환불완료'
- `golf_region`: '경기북부' | '경기남부' | '충청도' | '경상남도' | '강원도'
- `requirements_type`: '조건없음' | '인회필' | '예변필' | '인회필/예변필'

### State Management (Zustand)

**Store Locations:**
- `src/lib/stores/course-time-store.ts`: Tee time CRUD operations
- `src/lib/stores/join-person-store.ts`: Join person CRUD operations
- `src/lib/stores/black-list-store.ts`: Blacklist CRUD with search functionality

**Store Pattern:**
- Each store exports a custom hook (`useCourseTimeStore`, `useJoinPersonStore`, `useBlackListStore`)
- Stores handle fetching, creating, updating, and deleting entities
- Error and loading states managed within stores
- Supabase client operations with proper error handling

### Route Structure

```
src/app/
├── (auth)/
│   └── login/page.tsx                    # Phone-based login
├── (dashboard)/                          # Protected routes (middleware enforced)
│   ├── layout.tsx                        # Sidebar + Header wrapper
│   ├── course-time/
│   │   ├── page.tsx                      # Table view of tee times
│   │   ├── register/page.tsx             # Create/edit tee time form
│   │   └── text-view/page.tsx            # Mobile-optimized list view
│   ├── reservation/
│   │   ├── page.tsx                      # Join persons card view
│   │   └── detail/page.tsx               # Tee time detail with join management
│   ├── black-list/page.tsx               # Blacklist management
│   ├── my-performance/page.tsx           # User's sales performance
│   ├── site-id-status/page.tsx           # Site ID availability status
│   └── admin/                            # Admin-only routes (middleware enforced)
│       ├── manage-users/page.tsx         # User management (CRUD)
│       ├── manage-site-ids/page.tsx      # Site ID management
│       ├── deposit/page.tsx              # Payment/refund approval
│       └── performance/page.tsx          # All users' performance stats
└── page.tsx                              # Root redirect to dashboard
```

### Component Architecture

**Layout Components** (`src/components/layout/`):
- `sidebar.tsx`: Collapsible navigation with role-based menu items
- `header.tsx`: Page title and user role badge display

**UI Components** (`src/components/ui/`):
- Built with shadcn/ui and Radix UI primitives
- Includes: button, input, label, dialog, dropdown-menu, table, card, tabs, sonner (toast), select, checkbox, badge, separator, form

### Authentication & Authorization

**Middleware** (`src/middleware.ts`):
- Protects `/dashboard/*` routes (redirects to `/login` if unauthenticated)
- Protects `/dashboard/admin/*` routes (requires `admin` user type)
- Uses `@supabase/ssr` for server-side session management

**useAuth Hook** (`src/lib/hooks/useAuth.ts`):
- Provides: `user`, `profile`, `loading`, `signIn`, `signOut`, `isAdmin`
- Listens to auth state changes and syncs user profile from `users` table
- Phone number → email conversion in `signIn` method

### Row Level Security (RLS)

**Policies Applied:**
- Users can only view their own data (filtered by `author_id`)
- Admins have unrestricted access via `type = 'admin'` checks
- All tables use RLS to enforce multi-tenancy
- See `supabase/migrations/20240101000001_enable_rls.sql` for policy details

## Coding Conventions

### TypeScript Types
- Database types generated in `src/lib/types/database.types.ts`
- Use strict Database types for Supabase queries:
  ```typescript
  type CourseTime = Database['public']['Tables']['course_times']['Row']
  type CourseTimeInsert = Database['public']['Tables']['course_times']['Insert']
  ```
- Extend with relation types when joining tables:
  ```typescript
  interface CourseTimeWithRelations extends CourseTime {
    courses?: { id: string, golf_club_name: string } | null
  }
  ```

### Supabase Client Usage
- **Client-side**: `createClient()` from `src/lib/supabase/client.ts`
- **Server-side**: `createClient()` from `src/lib/supabase/server.ts` (uses cookies)
- Always use `.single()` when expecting one row
- Always use `.select()` to specify returned columns (avoid `select('*')` in production)

### Form Handling
- Use `react-hook-form` with `@hookform/resolvers/zod` for validation
- Form schema defined with `zod` for type-safe validation
- Example pattern:
  ```typescript
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { ... }
  })
  ```

### Styling
- Tailwind CSS with custom design tokens in `src/app/globals.css`
- Color scheme: Blue (#0066FF) → Indigo (#6366F1) gradient
- Use `cn()` utility from `src/lib/utils.ts` for conditional classes
- Mobile-first responsive design (prioritize mobile UX)

## Important Implementation Details

### Phone Number Authentication
- Users authenticate with phone numbers, not emails
- Backend converts: `phoneNumber` → `${phoneNumber}@golf-intranet.local`
- When creating users via Supabase Dashboard, use this email format
- User profile UUID must match auth.users UUID

### Tee Time Status Management
- `course_times.status`: '판매완료' (sold), '미판매' (available), '타업체마감' (closed by other company)
- Status determines UI styling (badges, colors)
- Automatic status updates not implemented (manual change required)

### Join Person Slots
- Each `course_time` can have 0-4 `join_persons`
- Frontend displays 4 slots (empty slots shown as available)
- Payment status tracked per join person, not per tee time

### Charge Fee Calculation
- `users.charge_rate`: Percentage (0-100)
- `course_times.charge_fee`: Flat fee amount
- Calculation logic not enforced by database (manual entry)

## Testing a Fresh Setup

1. Create Supabase project and set environment variables
2. Run migrations via SQL Editor
3. Create test user:
   ```sql
   -- In Authentication UI, create user with email: 01012345678@golf-intranet.local
   -- Copy the generated UUID

   INSERT INTO public.users (id, type, phone_number, name, charge_rate)
   VALUES ('uuid-from-auth', 'admin', '01012345678', '테스트관리자', 10);
   ```
4. Start dev server: `pnpm dev`
5. Login with phone: `01012345678` and the password set in step 3

## Features Implemented (Phases 1-15)

### Core Features
- **Authentication**: Phone-based login system with role-based access control
- **Tee Time Management**: Create, edit, delete tee times with filtering and search
- **Text View**: Mobile-optimized view with date grouping
- **Reservation Management**: Join person slots (1-4 per tee time) with payment tracking
- **Blacklist Management**: Block users by phone number with search functionality
- **Performance Tracking**: User-specific sales statistics with date filtering

### Admin Features (Admin Role Only)
- **User Management**: Create, edit, delete users; change roles and commission rates
- **Site ID Management**: Manage external booking site identifiers per golf club
- **Payment Management**: Approve/reject payments and refunds with status tracking
- **Global Performance**: View all users' sales statistics and golf club metrics

## Known Limitations

- No automated testing setup
- Database migrations must be run manually (no CLI integration)
- No real-time subscriptions (manual refresh required)
- No Line Notify or Telegram Bot integration (planned in phase 16)
- Performance optimization not implemented (no pagination, infinite scroll, etc.)

## Documentation References

- Setup guide: `SETUP_GUIDE.md` (Korean, detailed Supabase setup)
- Progress tracking: `PROGRESS.md` (Korean, all phases 1-15 completed)

# Golf Intranet Backend Architecture

## Overview

This application uses a **3-tier architecture** with Prisma ORM for type-safe database access. This replaces the previous Supabase direct access pattern that was causing RLS (Row Level Security) issues.

```
┌─────────────┐
│  Frontend   │  React/Next.js + Zustand stores
│  (Browser)  │  Uses fetch() to call API routes
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Backend   │  Next.js API Routes (/pages/api/*)
│  (Server)   │  Uses Prisma Client for DB access
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Database   │  PostgreSQL on Supabase
│   (Supabase)│  RLS completely disabled
└─────────────┘
```

## Why This Architecture?

### Previous Issues (Supabase Direct Access)
- ❌ RLS policies were complex and error-prone
- ❌ Circular reference issues (policies referencing each other)
- ❌ Infinite loading when policies failed
- ❌ Frontend had direct database access (security concern)
- ❌ No type safety between frontend and database

### Current Benefits (3-Tier with Prisma)
- ✅ No RLS needed - all access control in backend
- ✅ Type-safe database access with auto-generated types
- ✅ Clear separation of concerns
- ✅ Single source of truth for database schema
- ✅ Better error messages and debugging
- ✅ API routes can be tested independently

## Technology Stack

- **Frontend**: Next.js 16, React 19, Zustand (state management)
- **Backend**: Next.js API Routes (Pages Router)
- **ORM**: Prisma 5.22.0
- **Database**: PostgreSQL on Supabase
- **Package Manager**: pnpm 10.27.0
- **Language**: TypeScript 5.9

## Directory Structure

```
golf_intranet_new/
├── prisma/
│   └── schema.prisma          # Database schema (single source of truth)
├── src/
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── supabase/
│   │   │   ├── client.ts      # Supabase client (auth only)
│   │   │   └── server.ts      # Supabase server (auth only)
│   │   └── stores/            # Zustand stores (call APIs)
│   │       ├── course-time-store.ts
│   │       ├── join-person-store.ts
│   │       └── ...
│   └── pages/
│       └── api/               # Backend API routes
│           ├── course-times.ts
│           ├── join-persons.ts
│           ├── black-lists.ts
│           └── admin/
│               └── courses.ts
└── package.json
```

## Critical Pattern: Enum Mapping

### The Problem

The database uses **Korean enum values** (e.g., `'남남'`, `'입금확인전'`), but Prisma requires **ASCII-only enum identifiers** in the schema.

### The Solution

We use Prisma's `@map` directive to map English enum names to Korean database values:

**In `prisma/schema.prisma`:**
```prisma
enum JoinType {
  M        @map("남")
  F        @map("여")
  MM       @map("남남")
  FF       @map("여여")
  TRANSFER @map("양도")
}

enum JoinPersonStatus {
  PENDING_CONFIRM  @map("입금확인전")
  CONFIRMING       @map("입금확인중")
  CONFIRMED        @map("입금완료")
}
```

**In API routes (e.g., `/pages/api/join-persons.ts`):**
```typescript
// Define mapping at top of file
const JOIN_TYPE_MAP: Record<string, string> = {
  '남': 'M',
  '여': 'F',
  '남남': 'MM',
  '여여': 'FF',
  '양도': 'TRANSFER',
}

const STATUS_MAP: Record<string, string> = {
  '입금확인전': 'PENDING_CONFIRM',
  '입금확인중': 'CONFIRMING',
  '입금완료': 'CONFIRMED',
}

// Use in POST/PUT handlers
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const data = req.body

  // Map Korean → English
  const joinTypeEnum = JOIN_TYPE_MAP[data.join_type] || data.join_type
  const statusEnum = STATUS_MAP[data.status] || STATUS_MAP['입금확인전']

  const prismaData = {
    joinType: joinTypeEnum,  // Use English enum
    status: statusEnum,
    // ... other fields
  }

  await prisma.joinPerson.create({ data: prismaData })
}
```

### ⚠️ CRITICAL: All Enums Must Be Mapped

Every API route that handles enum fields **MUST** map Korean values to English. Currently implemented:

| Enum | Used In | Mapping Required |
|------|---------|-----------------|
| `JoinType` | `join-persons.ts` | ✅ Implemented |
| `JoinPersonStatus` | `join-persons.ts` | ✅ Implemented |
| `RequirementsType` | `course-times.ts` | ✅ Implemented |
| `CourseTimeStatus` | `course-times.ts` | ✅ Implemented |
| `GolfRegion` | `admin/courses.ts` | ✅ Implemented |
| `UserType` | - | N/A (not user-facing) |

## API Route Pattern

All API routes follow this standard pattern:

### 1. File Structure
```typescript
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

// Define enum mappings if needed
const ENUM_MAP: Record<string, string> = {
  '한글값': 'ENGLISH_VALUE',
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res)
      case 'POST':
        return await handlePost(req, res)
      case 'PUT':
        return await handlePut(req, res)
      case 'DELETE':
        return await handleDelete(req, res)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
```

### 2. Field Name Convention

- **Database/Prisma**: `camelCase` (e.g., `managerId`, `phoneNumber`)
- **Frontend/API**: `snake_case` (e.g., `manager_id`, `phone_number`)

**Convert in API routes:**
```typescript
// POST: snake_case → camelCase
const prismaData = {
  managerId: data.manager_id,
  phoneNumber: data.phone_number,
  greenFee: data.green_fee,
}

// GET: camelCase → snake_case
const transformed = {
  manager_id: record.managerId,
  phone_number: record.phoneNumber,
  green_fee: record.greenFee,
}
```

### 3. Relations/Includes

Use Prisma's `include` to fetch related data:

```typescript
const courseTime = await prisma.courseTime.findUnique({
  where: { id },
  include: {
    course: {
      select: {
        id: true,
        golfClubName: true,
        courseName: true,
      },
    },
    author: {
      select: {
        id: true,
        name: true,
      },
    },
  },
})
```

## Frontend Store Pattern

Zustand stores now call API routes instead of accessing Supabase directly:

**Before (Direct Supabase Access):**
```typescript
// ❌ OLD - Don't do this
const { data, error } = await supabase
  .from('course_times')
  .select('*')
  .eq('id', id)
```

**After (API Route):**
```typescript
// ✅ NEW - Do this
fetchCourseTimes: async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.startDate) params.append('startDate', filters.startDate)

  const url = `/api/course-times${params.toString() ? `?${params}` : ''}`
  const response = await fetch(url)

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to fetch course times')
  }

  const data = await response.json()
  set({ courseTimes: data, loading: false })
}
```

## Database Schema Management

### Making Schema Changes

1. **Edit `prisma/schema.prisma`**
   ```prisma
   model NewModel {
     id        String   @id @default(uuid())
     name      String
     createdAt DateTime @default(now()) @map("created_at")

     @@map("new_models")  // DB table name
   }
   ```

2. **Push to database**
   ```bash
   pnpm db:push
   ```

3. **Regenerate Prisma Client**
   ```bash
   pnpm db:generate
   ```

### Adding New Enums

If database has Korean enum values:

1. **Define in schema with @map:**
   ```prisma
   enum MyEnum {
     VALUE_ONE   @map("값1")
     VALUE_TWO   @map("값2")
   }
   ```

2. **Create mapping in API route:**
   ```typescript
   const MY_ENUM_MAP: Record<string, string> = {
     '값1': 'VALUE_ONE',
     '값2': 'VALUE_TWO',
   }
   ```

3. **Use in handlers:**
   ```typescript
   const enumValue = MY_ENUM_MAP[data.my_field] || data.my_field
   ```

## Authentication

Authentication still uses Supabase Auth (not Prisma):

```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = createClient(req, res)
const { data: { session } } = await supabase.auth.getSession()

if (!session) {
  return res.status(401).json({ error: '인증이 필요합니다' })
}

// Then use Prisma to check user type
const user = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: { type: true },
})

if (user.type !== 'ADMIN') {
  return res.status(403).json({ error: '관리자 권한이 필요합니다' })
}
```

## Common Errors and Solutions

### Error: "Invalid enum value"
**Cause:** Korean value passed directly to Prisma without mapping
**Solution:** Add enum mapping in API route (see "Enum Mapping" section)

### Error: "Unknown field"
**Cause:** Using snake_case field name with Prisma (expects camelCase)
**Solution:** Convert field names before passing to Prisma

### Error: "Type '...' is not assignable"
**Cause:** Prisma types don't match your data
**Solution:** Run `pnpm db:generate` to regenerate types

### Error: "Relation does not exist"
**Cause:** Trying to include a relation that's not defined in schema
**Solution:** Check `schema.prisma` and ensure relation exists

## Development Workflow

1. **Start development server:**
   ```bash
   pnpm dev
   ```

2. **Make database changes:**
   ```bash
   # Edit prisma/schema.prisma
   pnpm db:push
   pnpm db:generate
   ```

3. **View database:**
   ```bash
   pnpm db:studio  # Opens Prisma Studio in browser
   ```

4. **Build for production:**
   ```bash
   pnpm build
   ```

## Environment Variables

Required in `.env.local`:

```env
# Database (Supabase)
DATABASE_URL="postgresql://..."           # Connection pooling URL
DIRECT_URL="postgresql://..."             # Direct connection URL

# Supabase (Auth only)
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
```

## Key Differences from Old Architecture

| Aspect | Old (Supabase Direct) | New (Prisma) |
|--------|----------------------|--------------|
| **Data Access** | Frontend → Supabase Client → DB | Frontend → API Route → Prisma → DB |
| **RLS** | Complex policies enabled | Completely disabled |
| **Type Safety** | Manual type definitions | Auto-generated from schema |
| **Security** | RLS policies | Backend-only DB access |
| **Enums** | Korean values directly | English with @map |
| **Auth** | Supabase Auth + RLS | Supabase Auth + Backend checks |

## Adding a New API Route

1. **Create file in `/src/pages/api/my-resource.ts`**

2. **Follow standard pattern:**
   ```typescript
   import type { NextApiRequest, NextApiResponse } from 'next'
   import { prisma } from '@/lib/prisma'

   // Add enum mappings if needed

   export default async function handler(req, res) {
     try {
       switch (req.method) {
         case 'GET': return await handleGet(req, res)
         case 'POST': return await handlePost(req, res)
         case 'PUT': return await handlePut(req, res)
         case 'DELETE': return await handleDelete(req, res)
         default: return res.status(405).json({ error: 'Method not allowed' })
       }
     } catch (error) {
       console.error('API Error:', error)
       return res.status(500).json({ error: 'Internal server error' })
     }
   }

   async function handleGet(req, res) { /* ... */ }
   async function handlePost(req, res) { /* ... */ }
   async function handlePut(req, res) { /* ... */ }
   async function handleDelete(req, res) { /* ... */ }
   ```

3. **Update Zustand store to call new API**

4. **Test the endpoint**

## Testing

### Test API Endpoints
```bash
# Using curl
curl http://localhost:3000/api/course-times

# Using httpie
http GET localhost:3000/api/course-times

# Using Postman/Insomnia
GET http://localhost:3000/api/course-times
```

### Check Database
```bash
pnpm db:studio
# Opens Prisma Studio at http://localhost:5555
```

## Resources

- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js API Routes**: https://nextjs.org/docs/pages/building-your-application/routing/api-routes
- **Prisma Enum Mapping**: https://www.prisma.io/docs/orm/prisma-schema/data-model/models#mapping-model-names-to-tables

## Support

For questions or issues, check:
1. This documentation
2. Prisma schema at `prisma/schema.prisma`
3. Existing API routes in `/src/pages/api/` for examples
4. `MIGRATION_GUIDE.md` for migration-specific info

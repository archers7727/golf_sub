'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react'

type GolfClub = {
  id: string
  name: string
  region: string
  reservable_count_type: string
  reservable_count_1: number
  reservable_count_2: number
  site_ids: SiteId[]
}

type SiteId = {
  id: string
  site_id: string
  name: string
  disabled: boolean
  hidden: boolean
}

export default function SiteIdStatusPage() {
  const [golfClubs, setGolfClubs] = useState<GolfClub[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<string>('all')

  const regions = ['경기북부', '경기남부', '충청도', '경상남도', '강원도']

  const fetchSiteIds = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      let query = supabase
        .from('golf_clubs')
        .select(
          `
          id,
          name,
          region,
          reservable_count_type,
          reservable_count_1,
          reservable_count_2,
          hidden,
          site_ids (
            id,
            site_id,
            name,
            disabled,
            hidden
          )
        `
        )
        .is('deleted_at', null)
        .eq('hidden', false)
        .order('name')

      if (selectedRegion !== 'all') {
        query = query.eq('region', selectedRegion)
      }

      const { data, error } = await query

      if (error) throw error

      // site_ids도 hidden이 아닌 것만 필터링
      const filteredData = (data || []).map((club: any) => ({
        ...club,
        site_ids: (club.site_ids || []).filter((siteId: SiteId) => !siteId.hidden),
      }))

      setGolfClubs(filteredData as GolfClub[])
    } catch (error) {
      console.error('Error fetching site IDs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSiteIds()
  }, [selectedRegion])

  const getReservableCountText = (club: GolfClub) => {
    if (club.reservable_count_type === 'TOTAL') {
      return `전체 ${club.reservable_count_1}개`
    } else {
      return `평일 ${club.reservable_count_1}개 / 주말 ${club.reservable_count_2}개`
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">사이트ID 현황</h1>
        <p className="text-muted-foreground mt-1">골프장별 사이트ID 사용 현황을 확인합니다</p>
      </div>

      {/* 지역 필터 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">지역 필터</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 max-w-xs">
              <Label htmlFor="region">지역 선택</Label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger id="region">
                  <SelectValue placeholder="지역을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 골프장별 사이트ID 목록 */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            로딩 중...
          </CardContent>
        </Card>
      ) : golfClubs.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
            사이트ID가 등록된 골프장이 없습니다
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {golfClubs.map((club) => (
            <Card key={club.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{club.name}</CardTitle>
                    <CardDescription className="mt-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{club.region}</Badge>
                        <span className="text-sm">
                          예약 가능 수: {getReservableCountText(club)}
                        </span>
                      </div>
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {club.site_ids.length}개 사이트ID
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {club.site_ids.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    등록된 사이트ID가 없습니다
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {club.site_ids.map((siteId) => (
                      <div
                        key={siteId.id}
                        className={`border rounded-lg p-4 ${
                          siteId.disabled
                            ? 'bg-gray-50 border-gray-200'
                            : 'bg-white border-blue-200 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="space-y-1">
                            <div className="font-medium text-sm">{siteId.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {siteId.site_id}
                            </div>
                          </div>
                          {siteId.disabled ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge
                            variant={siteId.disabled ? 'destructive' : 'default'}
                            className="text-xs"
                          >
                            {siteId.disabled ? '비활성' : '활성'}
                          </Badge>
                          {siteId.hidden && (
                            <Badge variant="outline" className="text-xs">
                              <EyeOff className="h-3 w-3 mr-1" />
                              숨김
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 통계 정보 */}
      {golfClubs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">전체 통계</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">총 골프장</p>
                <p className="text-2xl font-bold">{golfClubs.length}개</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">총 사이트ID</p>
                <p className="text-2xl font-bold">
                  {golfClubs.reduce((sum, club) => sum + club.site_ids.length, 0)}개
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">활성 사이트ID</p>
                <p className="text-2xl font-bold text-green-600">
                  {golfClubs.reduce(
                    (sum, club) =>
                      sum + club.site_ids.filter((s) => !s.disabled).length,
                    0
                  )}
                  개
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

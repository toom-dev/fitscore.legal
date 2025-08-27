import { Card, CardContent, CardHeader } from "@/src/components/ui/card"
import { Skeleton } from "@/src/components/ui/skeleton"

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div>
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <div className="p-2 bg-primary/10 rounded-full">
                <Skeleton className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Classification Summary Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <Skeleton className="w-5 h-5 mr-2" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="relative overflow-hidden rounded-lg p-4 border bg-card">
                <div className="flex items-center justify-between mb-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="h-8 w-8" />
                </div>
                <Skeleton className="h-4 w-16 mb-1" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-1 w-12 ml-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Candidates Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <Skeleton className="w-5 h-5 mr-2" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-48 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-8 w-12 mb-1" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function CandidatesSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex justify-between items-start">
        <div>
          <Skeleton className="h-9 w-32 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Filters Card Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <Skeleton className="w-5 h-5 mr-2" />
            <Skeleton className="h-6 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div>
              <Skeleton className="h-4 w-48 mb-2" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-24" />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candidates List Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center">
                <Skeleton className="w-5 h-5 mr-2" />
                <Skeleton className="h-6 w-32" />
              </div>
              <Skeleton className="h-4 w-64 mt-2" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div>
                      <Skeleton className="h-5 w-48 mb-1" />
                      <Skeleton className="h-4 w-64 mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <Skeleton className="h-8 w-12 mb-1" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination Skeleton */}
          <div className="flex items-center justify-between pt-4 border-t mt-4">
            <Skeleton className="h-4 w-64" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-20" />
              <div className="flex items-center space-x-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-8" />
                ))}
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function QuestionsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex justify-between items-start">
        <div>
          <Skeleton className="h-9 w-32 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-16" />
              <div className="p-2 bg-primary/10 rounded-full">
                <Skeleton className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-8 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Questions by Category Skeleton */}
      {Array.from({ length: 3 }).map((_, categoryIndex) => (
        <Card key={categoryIndex}>
          <CardHeader>
            <div className="flex items-center">
              <Skeleton className="w-4 h-4 rounded-full mr-3" />
              <Skeleton className="h-6 w-40" />
            </div>
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, questionIndex) => (
                <div key={questionIndex} className="flex items-start justify-between p-6 border rounded-lg bg-card">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    
                    <Skeleton className="h-6 w-96 mb-2" />
                    <Skeleton className="h-4 w-80 mb-3" />
                    
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-24 mb-2" />
                      <div className="space-y-1">
                        {Array.from({ length: 4 }).map((_, altIndex) => (
                          <div key={altIndex} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                            <div className="flex items-center space-x-2">
                              <Skeleton className="w-5 h-5 rounded-full" />
                              <Skeleton className="h-3 w-48" />
                            </div>
                            <Skeleton className="h-4 w-12" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

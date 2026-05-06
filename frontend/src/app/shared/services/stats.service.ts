import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../environments/environment'
import type { StatsData } from '../models'

@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly http = inject(HttpClient)

  getStats(): Observable<StatsData> {
    return this.http.get<StatsData>(`${environment.apiUrl}/admin/stats`)
  }
}

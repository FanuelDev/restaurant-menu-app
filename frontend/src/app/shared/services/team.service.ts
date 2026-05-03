import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../environments/environment'
import type { TeamMember } from '../models'

export interface CreateMemberPayload {
  fullName: string
  email: string
  password: string
  phone?: string
}

export interface UpdateMemberPayload {
  fullName?: string
  phone?: string
  isActive?: boolean
}

@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly http = inject(HttpClient)

  getMembers(): Observable<TeamMember[]> {
    return this.http.get<TeamMember[]>(`${environment.apiUrl}/admin/team`)
  }

  createMember(payload: CreateMemberPayload): Observable<TeamMember> {
    return this.http.post<TeamMember>(`${environment.apiUrl}/admin/team`, payload)
  }

  updateMember(id: number, payload: UpdateMemberPayload): Observable<TeamMember> {
    return this.http.put<TeamMember>(`${environment.apiUrl}/admin/team/${id}`, payload)
  }

  deleteMember(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/admin/team/${id}`)
  }
}

export interface ContactRequest {
  name: string;
  email: string;
  company?: string;
  platform?: string;
  stack?: string;
  gmv?: string;
  notes?: string;
}

export interface ContactResponse {
  id: string;
  submitted_at: string;
}


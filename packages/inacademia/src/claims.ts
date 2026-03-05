export interface InAcademiaUser {
  sub: string;
  affiliation?: string;
  domain?: string;
  institution?: string;
  idp_hint?: string;
  reuse_detection?: string[];
  transaction_id?: string;
}

import { AbstractControl, ValidationErrors } from '@angular/forms';

const DOMAIN_PATTERN = /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

export const domainValidator = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value || '').trim().toLowerCase();
  if (!value) {
    return null;
  }
  return DOMAIN_PATTERN.test(value) ? null : { domain: true };
};

export const normalizeDomain = (value: string): string =>
  value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');

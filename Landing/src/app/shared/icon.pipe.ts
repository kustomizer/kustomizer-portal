import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ICONS } from './icon-map';

@Pipe({
  name: 'iconSvg',
  standalone: true,
  pure: true
})
export class IconPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(name: string | null | undefined): SafeHtml {
    if (!name) {
      return '';
    }
    const svg = ICONS[name];
    if (!svg) {
      return '';
    }
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}

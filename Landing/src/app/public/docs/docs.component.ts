import { Component, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

type SectionId =
  | 'getting-started'
  | 'installation'
  | 'configuration'
  | 'routing'
  | 'components'
  | 'ssr'
  | 'api';

interface NavItem {
  id: SectionId;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-docs',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './docs.component.html',
  styleUrl: './docs.component.css',
})
export class DocsComponent {
  private readonly platformId = inject(PLATFORM_ID);
  readonly activeSection = signal<SectionId>('getting-started');
  readonly mobileNavOpen = signal(false);
  readonly copiedIndex = signal<number>(-1);

  // Code strings for copy-to-clipboard
  readonly installCode = `import { provideStore } from '@ngrx/store';
import {
  provideVisualEditor,
  provideVisualEditorStore,
  provideEditorComponents,
  STORE_DOMAIN,
} from '@kustomizerr/visual-editor';
import { editorComponents } from './editor-components';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideStore(),
    provideVisualEditorStore(),
    { provide: STORE_DOMAIN, useValue: 'your-store.myshopify.com' },
    provideVisualEditor({ api: { apiUrl: 'https://kustomizer.xyz' } }),
    provideEditorComponents(editorComponents),
    provideClientHydration(withEventReplay()),
  ],
};`;

  readonly configCode = `provideVisualEditor({
  // Backend connection
  api: {
    apiUrl: 'https://kustomizer.xyz',
  },

  // UI toggles
  ui: {
    showBackButton: true,
    showPublishButtons: true,
    showSaveButton: true,
  },

  // Custom navigation handler
  navigation: {
    navigationService: MyCustomNavigation,
  },
})`;

  readonly routingCode = `export const routes: Routes = [
  // Admin panel (editor + page manager)
  {
    path: 'admin',
    loadComponent: () =>
      import('@kustomizerr/visual-editor')
        .then(m => m.AdminPanelComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('@kustomizerr/visual-editor')
            .then(m => m.PageManagerComponent),
      },
      {
        path: 'pages/:pageId',
        loadComponent: () =>
          import('@kustomizerr/visual-editor')
            .then(m => m.VisualEditorComponent),
      },
    ],
  },

  // Public pages (rendered for visitors)
  {
    path: 'pages/:slug',
    loadComponent: () =>
      import('./pages/page-renderer.component')
        .then(m => m.PageRendererComponent),
    resolve: { page: pageResolver },
  },
];`;

  readonly rendererCode = `import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import {
  DynamicRendererComponent, Page
} from '@kustomizerr/visual-editor';

@Component({
  selector: 'app-page-renderer',
  standalone: true,
  imports: [DynamicRendererComponent],
  template: \`
    @if (page()) {
      @for (section of page()!.sections;
           track section.id) {
        <lib-dynamic-renderer
          [element]="section"
          [context]="{ isEditor: false }" />
      }
    }
  \`,
})
export class PageRendererComponent {
  private readonly route = inject(ActivatedRoute);
  readonly page = toSignal(
    this.route.data.pipe(
      map(d => d['page'] as Page | null)
    ),
    { initialValue: null }
  );
}`;

  readonly componentCode = `import { Component, input } from '@angular/core';

@Component({
  selector: 'app-hero',
  standalone: true,
  template: \`
    <section [style.background]="bgColor()"
             class="hero-section">
      <h1>{{ title() }}</h1>
      <p>{{ subtitle() }}</p>
    </section>
  \`,
})
export class HeroComponent {
  readonly title = input('Welcome');
  readonly subtitle = input('Your story starts here');
  readonly bgColor = input('#1a1a2e');

  // Required internal inputs
  readonly _elementId = input('');
  readonly _children = input<unknown[]>([]);
  readonly _context = input<Record<string, unknown>>({});
}`;

  readonly definitionCode = `import { ComponentDefinition } from '@kustomizerr/visual-editor';
import { HeroComponent } from './hero.component';

export const heroDefinition: ComponentDefinition = {
  type: 'hero',
  name: 'Hero Banner',
  category: 'layout',
  component: HeroComponent,
  isSection: true,
  draggable: true,
  deletable: true,
  props: {
    title: {
      type: 'string',
      label: 'Title',
      defaultValue: 'Welcome',
      group: 'Content',
    },
    subtitle: {
      type: 'string',
      label: 'Subtitle',
      defaultValue: 'Your story starts here',
      group: 'Content',
    },
    bgColor: {
      type: 'color',
      label: 'Background',
      defaultValue: '#1a1a2e',
      group: 'Style',
    },
  },
};`;

  readonly registerCode = `import { heroDefinition } from './hero/hero.definition';

export const editorComponents = [
  heroDefinition,
  // ...add more definitions here
];`;

  readonly ssrCode = `import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Admin: client-only (interactive editor)
  { path: 'admin/**', renderMode: RenderMode.Client },

  // Public pages: server-rendered (SEO + fast)
  { path: '**', renderMode: RenderMode.Server },
];`;

  readonly resolverCode = `import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { VisualEditorFacade, Page } from '@kustomizerr/visual-editor';
import { catchError, of } from 'rxjs';

export const pageResolver: ResolveFn<Page | null> =
  (route) => {
    const facade = inject(VisualEditorFacade);
    const slug = route.paramMap.get('slug');

    if (!slug) return of(null);

    return facade
      .getPublishedPageBySlug(slug)
      .pipe(catchError(() => of(null)));
  };`;

  readonly navItems: NavItem[] = [
    { id: 'getting-started', label: 'Getting Started', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'installation', label: 'Installation', icon: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3' },
    { id: 'configuration', label: 'Configuration', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
    { id: 'routing', label: 'Routing', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
    { id: 'components', label: 'Custom Components', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { id: 'ssr', label: 'SSR Setup', icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01' },
    { id: 'api', label: 'API Reference', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
  ];

  setSection(id: SectionId): void {
    this.activeSection.set(id);
    this.mobileNavOpen.set(false);
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0 });
    }
  }

  toggleMobileNav(): void {
    this.mobileNavOpen.set(!this.mobileNavOpen());
  }

  copyCode(text: string, index: number): void {
    if (!isPlatformBrowser(this.platformId)) return;
    navigator.clipboard.writeText(text).then(() => {
      this.copiedIndex.set(index);
      setTimeout(() => this.copiedIndex.set(-1), 2000);
    });
  }
}

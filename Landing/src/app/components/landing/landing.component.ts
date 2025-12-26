import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { IconPipe } from '../../icon.pipe';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, IconPipe],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent {
  readonly navLinks = [
    { href: '#product', label: 'Product' },
    { href: '#how-it-works', label: 'How it works' },
    { href: '#differentiation', label: 'Why us' },
    { href: '#faq', label: 'FAQ' },
  ];

  readonly benefits = [
    { icon: 'zap', text: 'Launch campaigns faster' },
    { icon: 'ticket', text: 'Fewer dev tickets' },
    { icon: 'gauge', text: 'Keep Core Web Vitals' },
  ];

  readonly trustLogos = [
    'Enterprise Brand',
    'Fashion Co',
    'Home Goods',
    'Sports Gear',
    'Luxury Watch',
    'Beauty Brand',
  ];

  readonly painPoints = [
    {
      title: 'Waiting for dev time',
      description: 'Simple copy changes take days. Management team waits in a ticket queue.',
      icon: 'clock',
    },
    {
      title: 'Developer bottleneck',
      description: 'Engineers spend cycles on content updates instead of product work.',
      icon: 'code',
    },
    {
      title: 'Slower time-to-market',
      description: 'Campaigns miss windows. Seasonal updates slip. Competitors move faster.',
      icon: 'trending-down',
    },
  ];

  readonly howItWorks = [
    {
      title: 'Create sections with code',
      description: 'Write Angular components your way. Full TypeScript support.',
      step: '1',
      icon: 'code',
    },
    {
      title: 'Register with Kustomizer',
      description: 'Tell Kustomizer about your components. Define configurable props.',
      step: '2',
      icon: 'layout',
    },
    {
      title: 'Visual editing + Shopify sync',
      description: 'Non-technical teams edit visually. Changes sync to Shopify products.',
      step: '3',
      icon: 'eye',
    },
  ];

  readonly solutionPillars = [
    { label: 'Use your real components', sublabel: 'Angular SSR in V1' },
    { label: 'Shopify-native storage', sublabel: 'Metafields, no external CMS' },
    { label: 'Zero runtime overhead', sublabel: 'SSR-friendly output' },
  ];

  readonly steps = [
    {
      number: '01',
      title: 'Connect your Shopify store',
      description: 'Install the Kustomizer app and connect your Shopify Plus store. We use native Shopify APIs for secure, reliable integration.',
      icon: 'link',
    },
    {
      number: '02',
      title: 'Enable editable sections',
      description: 'Developers mark which Angular components are editable. Kustomizer imports your real design system — no rebuilding required.',
      icon: 'layers',
    },
    {
      number: '03',
      title: 'Edit → Preview → Publish',
      description: 'Store Owners/Admins edit text, images, and layout visually. Preview drafts, then publish with confidence. Rollback anytime if needed.',
      icon: 'eye',
    },
  ];

  readonly features = [
    {
      title: 'Visual section editor',
      description: 'Edit text, images, and links directly. Reorder sections with drag-and-drop. Basic styling and layout controls.',
      icon: 'edit',
    },
    {
      title: 'Shopify-native persistence',
      description: 'Content stores in Shopify metafields. No external CMS needed. Your data stays where it belongs.',
      icon: 'database',
    },
    {
      title: 'Preview mode',
      description: 'Draft vs published separation. See changes before they go live. Catch issues before customers do.',
      icon: 'eye',
    },
    {
      title: 'Manual publish flow',
      description: 'Confirm before publishing. No accidental updates. Full control over what goes live and when.',
      icon: 'check',
    },
    {
      title: 'Version history & rollback',
      description: 'Simple history of published versions. One-click rollback if something goes wrong.',
      icon: 'history',
    },
    {
      title: 'Performance-first output',
      description: 'SSR-friendly rendering. No heavy client-side scripts. Keep your Core Web Vitals intact.',
      icon: 'gauge',
    },
  ];

  readonly comparisonHeaders = [
    { key: 'kustomizer', label: 'Kustomizer', highlight: true },
    { key: 'shopifyTheme', label: 'Shopify Theme Customizer', highlight: false },
    { key: 'builderIo', label: 'Builder.io / Shogun', highlight: false },
    { key: 'headlessCms', label: 'Headless CMS', highlight: false },
    { key: 'inHouse', label: 'In-house Editor', highlight: false },
  ];

  readonly comparisonRows = [
    {
      criteria: 'Works with headless architecture',
      kustomizer: 'yes',
      shopifyTheme: 'no',
      builderIo: 'yes',
      headlessCms: 'yes',
      inHouse: 'yes',
    },
    {
      criteria: 'Imports your real components',
      kustomizer: 'yes',
      shopifyTheme: 'no',
      builderIo: 'partial',
      headlessCms: 'no',
      inHouse: 'yes',
    },
    {
      criteria: 'Zero runtime performance impact',
      kustomizer: 'yes',
      shopifyTheme: 'yes',
      builderIo: 'no',
      headlessCms: 'yes',
      inHouse: 'partial',
    },
    {
      criteria: 'Enterprise governance (preview, publish, rollback)',
      kustomizer: 'yes',
      shopifyTheme: 'partial',
      builderIo: 'yes',
      headlessCms: 'yes',
      inHouse: 'partial',
    },
    {
      criteria: 'No vendor lock-in',
      kustomizer: 'yes',
      shopifyTheme: 'no',
      builderIo: 'no',
      headlessCms: 'partial',
      inHouse: 'yes',
    },
    {
      criteria: 'Shopify-first persistence',
      kustomizer: 'yes',
      shopifyTheme: 'yes',
      builderIo: 'no',
      headlessCms: 'no',
      inHouse: 'partial',
    },
    {
      criteria: 'Low maintenance cost',
      kustomizer: 'yes',
      shopifyTheme: 'yes',
      builderIo: 'yes',
      headlessCms: 'yes',
      inHouse: 'no',
    },
  ];

  readonly useCases = [
    {
      title: 'Campaign landing pages in hours',
      description: 'Launch Black Friday, seasonal promos, or product drops without waiting for dev sprints. Management owns the timeline.',
      metric: 'Hours, not weeks',
      icon: 'rocket',
    },
    {
      title: 'Seasonal homepage updates',
      description: 'Swap hero banners, update messaging, refresh visuals — all without filing a single dev ticket.',
      metric: 'Zero tickets filed',
      icon: 'calendar',
    },
    {
      title: 'Safe multi-team publishing',
      description: 'International teams can edit their regional content with preview and rollback. Mistakes are reversible.',
      metric: '1-click rollback',
      icon: 'globe',
    },
    {
      title: 'Faster experimentation',
      description: 'Test headlines, layouts, and messaging without engineering overhead. Keep iteration velocity high while preserving performance.',
      metric: 'Iterate freely',
      icon: 'flask',
    },
  ];

  readonly securityFeatures = [
    {
      title: 'Role-based access',
      description: 'Designed for teams with different permission levels. Control who can edit, preview, and publish.',
      note: 'Permissions roadmap in progress',
      icon: 'users',
    },
    {
      title: 'Audit trail & versioning',
      description: 'Track changes with version history. See who published what and when. Meet compliance needs.',
      icon: 'fileCheck',
    },
    {
      title: 'Data stays in Shopify',
      description: 'Content persists to Shopify metafields. No third-party data storage. Your data, your platform.',
      icon: 'lock',
    },
    {
      title: 'HTTPS everywhere',
      description: 'All communication encrypted in transit. Secure connections between editor, storefront, and Shopify.',
      icon: 'server',
    },
    {
      title: 'Least-privilege integrations',
      description: 'We request only the Shopify scopes we need. No unnecessary access to your store data.',
      icon: 'eye',
    },
    {
      title: 'Enterprise-grade infrastructure',
      description: 'Built on secure, reliable cloud infrastructure. Designed to scale with enterprise workloads.',
      icon: 'shield',
    },
  ];

  readonly finalBullets = [
    'Edit real Angular components visually',
    'Content persists to Shopify natively',
    'Preview, publish, and rollback with confidence',
    'Zero runtime performance overhead',
  ];

  readonly faqs = [
    {
      question: 'Does this work with headless architecture?',
      answer: 'Yes. Kustomizer is specifically built for headless storefronts. It works with your existing Angular SSR setup (with React/Next.js support coming later) without requiring you to change your architecture.',
    },
    {
      question: 'Do we need to move content to a new CMS?',
      answer: 'No. Content persists directly to Shopify using native mechanisms like metafields. You do not need to adopt an external CMS or migrate existing content. Shopify remains your single source of truth.',
    },
    {
      question: 'Will this hurt our site performance?',
      answer: 'No. Kustomizer is designed to avoid runtime overhead. There is no heavy JavaScript bundle injected into your frontend. Output is SSR-friendly, so your Core Web Vitals stay intact.',
    },
    {
      question: 'Which frontend frameworks are supported?',
      answer: 'Currently, Angular SSR is supported in our first version. React and Next.js support are on our roadmap and coming soon. We are building stack-by-stack to ensure deep integration quality.',
    },
    {
      question: 'What pages can we edit with Kustomizer?',
      answer: 'In the first version of Kustomizer, you can edit Home pages and Campaign Landing pages. Product page editing is not included in the initial release but is planned for future versions.',
    },
    {
      question: 'Can we rollback if something goes wrong?',
      answer: 'Yes. Kustomizer keeps a simple version history of published versions. You can rollback to a previous version with one click if needed.',
    },
    {
      question: 'How do developers enable components for editing?',
      answer: 'Developers mark specific components or sections as editable in the Angular codebase. Kustomizer then imports these components and makes them available in the visual editor — no rebuild of your UI library required.',
    },
    {
      question: 'Is there a preview mode before publishing?',
      answer: 'Yes. Kustomizer separates draft and published states. You can preview changes exactly as they will appear to customers before committing to publish.',
    },
    {
      question: 'What does pricing look like?',
      answer: 'We are currently in private pilot mode. If you are interested, book a demo to discuss early access and pilot pricing. Enterprise pricing will be finalized based on pilot feedback.',
    },
    {
      question: 'How do we get started?',
      answer: 'Book a demo to see Kustomizer in action. If it is a fit, we will work with your team to connect your Shopify store, enable editable components, and get you publishing within days.',
    },
  ];

  readonly footerLinks = {
    product: [
      { label: 'Features', href: '#product' },
      { label: 'How it Works', href: '#how-it-works' },
      { label: 'Comparison', href: '#differentiation' },
      { label: 'FAQ', href: '#faq' },
    ],
    company: [
      { label: 'About', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: '#demo' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Security', href: '#' },
    ],
  };

  readonly currentYear = new Date().getFullYear();

  mobileMenuOpen = false;
  isScrolled = false;
  faqOpen: number | null = null;
  formStatus: 'idle' | 'submitting' | 'done' = 'idle';

  @HostListener('window:scroll')
  onWindowScroll() {
    this.isScrolled = window.pageYOffset > 50;
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  toggleFaq(index: number): void {
    this.faqOpen = this.faqOpen === index ? null : index;
  }

  cellValue(row: Record<string, string>, key: string): string {
    return row[key];
  }

  cellLabel(value: string): string {
    if (value === 'yes') {
      return 'Yes';
    }
    if (value === 'no') {
      return 'No';
    }
    return 'Partial';
  }

  submitLead(event: Event): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    this.formStatus = 'submitting';

    setTimeout(() => {
      this.formStatus = 'done';
      form.reset();
    }, 900);
  }
}

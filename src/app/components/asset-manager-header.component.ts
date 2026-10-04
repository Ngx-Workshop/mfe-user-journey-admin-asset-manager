import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { NgxParticleHeader } from '@tmdjr/ngx-shared-headers';

@Component({
  selector: 'ngx-mfe-asset-manager-header',
  imports: [MatIcon, NgxParticleHeader],
  template: `
    <ngx-particle-header>
      <div class="asset-header">
        <div class="asset-header__eyebrow">
          <mat-icon>photo_library</mat-icon>
          NGX-WORKSHOP / CONTENT LIBRARY
        </div>
        <h1 class="asset-header__title">Asset Manager</h1>
        <p class="asset-header__subtitle">
          A home for your workshop files and creative resources.
        </p>
      </div>
    </ngx-particle-header>
  `,
  styles: `
      :host,
      ngx-particle-header {
        display: block;
      }

      .asset-header {
        width: min(100% - 3rem, 1440px);
        margin: 0 auto;
        padding: 2.5rem 0 2.25rem;
        color: var(--mat-sys-on-primary);
      }

      .asset-header__eyebrow {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        margin-bottom: 0.55rem;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.13em;
        text-transform: uppercase;
        opacity: 0.8;
      }

      .asset-header__eyebrow mat-icon {
        width: 1rem;
        height: 1rem;
        font-size: 1rem;
      }

      .asset-header__title {
        margin: 0;
        font-size: clamp(2rem, 4vw, 3.25rem);
        font-weight: 500;
        line-height: 1.05;
        letter-spacing: -0.04em;
      }

      .asset-header__subtitle {
        margin: 0.75rem 0 0;
        font-size: 1rem;
        opacity: 0.78;
      }

      @media (max-width: 700px) {
        .asset-header {
          width: min(100% - 2rem, 1440px);
          padding: 2rem 0;
        }
      }
    `,
})
export class MfeAssetManagerHeader {}

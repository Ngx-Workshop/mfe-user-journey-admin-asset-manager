import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

@Component({
  selector: 'ngx-asset-manager-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dl class="asset-summary" aria-label="Library overview">
      <div>
        <dt>Total assets</dt>
        <dd>{{ total() }}</dd>
      </div>
      <div>
        <dt>Active assets</dt>
        <dd>{{ active() }}</dd>
      </div>
      <!-- <div>
        <dt>Stored assets</dt>
        <dd>{{ received() }}</dd>
      </div> -->
      <div>
        <dt>Archived</dt>
        <dd>{{ archived() }}</dd>
      </div>
    </dl>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    .asset-summary {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 6px;
      margin: 0;
    }
    .asset-summary div {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 8px;
      background: var(--ngx-color-surface);
      border: 1px solid var(--ngx-color-border);
      border-radius: var(--ngx-radius);
      text-align: center;
    }
    dt {
      color: var(--ngx-color-muted);
      font-size: 0.65rem;
    }
    dd {
      color: var(--ngx-color-text);
      order: -1;
      margin: 0;
      font: 600 1rem/1.5 var(--ngx-font-mono);
    }
  `,
})
export class AssetManagerSummaryComponent {
  readonly total = input.required<number>();
  readonly active = input.required<number>();
  readonly received = input.required<number>();
  readonly archived = input.required<number>();
}

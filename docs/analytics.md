# Google Analytics 4 setup

The frontend implementation is consent-gated and configured with Measurement ID `G-HD2ZEDZG45`.

## 1. Create the GA4 property

1. In Google Analytics Admin, create a GA4 property for `Zonzerigue Leadership International (ZLI)`.
2. Use the `Africa/Abidjan` reporting time zone and `CFA Franc BCEAO (XOF)` currency.
3. Create a Web data stream for `https://lafabriqueduleader.com`.
4. Confirm that its Measurement ID is `G-HD2ZEDZG45`.
5. In the stream's enhanced measurement settings, disable page changes based on browser history. The application sends its own SPA `page_view` events and disables the automatic config page view to prevent duplicates.

## 2. Configure builds

For local development, set these values in `.env.local`:

```dotenv
VITE_GA_MEASUREMENT_ID=G-HD2ZEDZG45
VITE_TRACKING_ENDPOINT=
```

Terraform defines and exports the production Measurement ID:

```hcl
ga_measurement_id = "G-HD2ZEDZG45"
```

`scripts/deploy-frontend.sh` reads the `ga_measurement_id` Terraform output before building. Deploy with:

```bash
make deploy PROFILE=TerraformMindapax
```

`VITE_TRACKING_ENDPOINT` stays empty unless a separate, consent-aware first-party event store is intentionally introduced.

## 3. Register custom dimensions

In **Admin > Data display > Custom definitions**, create these event-scoped custom dimensions:

| Dimension name | Event parameter |
| --- | --- |
| Source | `source` |
| Order type | `order_type` |
| Quantity | `quantity` |
| Request type | `request_type` |

The application never sends names, email addresses, phone numbers, organization names, ambassador codes, or free-text form content to GA4.

## 4. Mark key events

In **Admin > Data display > Events**, create or mark these exact event names as key events:

- `whatsapp_order_click`
- `amazon_order_click`
- `beyond_form_submit`
- `excerpt_form_submit`

`order_navigation_click` measures navigation to the order section and must not be marked as a key event.

## 5. Verify before production

Use a private browser window so there is no stored consent choice.

1. Open the site on desktop and mobile. Confirm that no request to `googletagmanager.com` or `google-analytics.com` occurs before consent.
2. Refuse analytics. Navigate and click an offer. Confirm that the Google tag remains unloaded.
3. Open **Cookie preferences**, accept analytics, and connect Google Tag Assistant.
4. Navigate between `/`, `/au-dela-du-livre/`, `/en/`, and `/beyond-the-book/`. Confirm one `page_view` per route change.
5. Trigger each conversion once and confirm one event with the expected parameters in Tag Assistant and GA4 Realtime or DebugView.
6. Reopen **Cookie preferences**, refuse analytics, and confirm that subsequent actions do not produce analytics events.

The measurement is ready for release when the four key events appear once per action and their parameters match the selected offer or request.

# TODO

## Analytics and conversion tracking

Status: Application deployed; GA4 verification pending

- [x] Create a Google Analytics 4 property and web data stream.
- [x] Obtain the GA4 Measurement ID (`G-HD2ZEDZG45`).
- [x] Add `VITE_GA_MEASUREMENT_ID` to local and production environment configuration.
- [x] Deploy `G-HD2ZEDZG45` from Terraform and verify that Google loads only after consent.
- [x] Add an analytics consent banner and load the Google tag only after consent.
- [x] Initialize `gtag.js` without double-counting existing `dataLayer` events.
- [x] Keep `VITE_TRACKING_ENDPOINT` empty unless first-party event storage is required.
- [x] Split the current `order_click` event into navigation and actual order events.
- [x] Track actual WhatsApp orders as `whatsapp_order_click`.
- [x] Track successful Au-delà du livre submissions as `beyond_form_submit`.
- [x] Keep `amazon_order_click` and `excerpt_form_submit` as conversion events.
- [x] Register `source`, `order_type`, `quantity`, and `request_type` as GA4 custom dimensions.
- [x] Mark `whatsapp_order_click`, `amazon_order_click`, `beyond_form_submit`, and `excerpt_form_submit` as GA4 key events.
- [x] Update the privacy/cookie documentation for analytics usage.
- [ ] Verify events with GA4 Realtime and Google Tag Assistant on desktop and mobile.

Setup and verification instructions: [`docs/analytics.md`](docs/analytics.md).

Definition of done: conversions are reported once, contain the expected event parameters, respect the visitor's consent choice, and do not interrupt ordering or form submission flows.

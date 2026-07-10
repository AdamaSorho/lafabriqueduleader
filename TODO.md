# TODO

## Analytics and conversion tracking

Status: Deferred

- [ ] Create a Google Analytics 4 property and web data stream.
- [ ] Obtain the GA4 Measurement ID (`G-XXXXXXXXXX`).
- [ ] Add `VITE_GA_MEASUREMENT_ID` to local and production environment configuration.
- [ ] Add an analytics consent banner and load the Google tag only after consent.
- [ ] Initialize `gtag.js` without double-counting existing `dataLayer` events.
- [ ] Keep `VITE_TRACKING_ENDPOINT` empty unless first-party event storage is required.
- [ ] Split the current `order_click` event into navigation and actual order events.
- [ ] Track actual WhatsApp orders as `whatsapp_order_click`.
- [ ] Track successful Au-delà du livre submissions as `beyond_form_submit`.
- [ ] Keep `amazon_order_click` and `excerpt_form_submit` as conversion events.
- [ ] Register `source`, `order_type`, `quantity`, and `request_type` as GA4 custom dimensions.
- [ ] Mark `whatsapp_order_click`, `amazon_order_click`, `beyond_form_submit`, and `excerpt_form_submit` as GA4 key events.
- [ ] Update the privacy/cookie documentation for analytics usage.
- [ ] Verify events with GA4 Realtime and Google Tag Assistant on desktop and mobile.

Definition of done: conversions are reported once, contain the expected event parameters, respect the visitor's consent choice, and do not interrupt ordering or form submission flows.

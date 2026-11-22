# Editorial portal (version 1.1)

The French portal is `/admin/`; the English portal is `/en/admin/`.

## Publishing content

1. Sign in with an invited editorial account. On the first visit, use the temporary password from the invitation and choose your own password.
2. Select **Ajouter un contenu / Add content**, then Resources or Media and the appropriate category.
3. Enter a title, summary, and article text or source link. Use the visual editor for section headings, bold, italics, underline, strikethrough, bullet/numbered lists, quotes, links, and dividers. The toolbar also provides undo, redo, and clear formatting. For media, supply the URL of the hosted podcast, video, interview, keynote, or press article.
4. Use the French and English tabs to enter translations. A completely empty translation stays absent from that language. Each nonempty published translation needs a title, summary, and article text or link.
5. Save a draft or preview it. Drafts are visible only to editors.
6. Select **Afficher dans le bandeau « À la une »** to include the published title in the spotlight strip, where each headline enters slowly from the right, pauses for reading, and exits to the left.
7. Publish. The public site fetches content on load and when the tab regains focus; publishing from the same tab also refreshes its content.
8. To remove an item from public view, open it and select **Dépublier et enregistrer / Unpublish and save**. The draft remains available to the team.

## External spotlights

Choose **Ajouter un spotlight externe / Add an external spotlight** in the admin portal. Select the headline category, then enter a headline and full HTTP/HTTPS destination URL for each language you want to publish. No article body or summary is needed. The preview shows the headline and destination domain. Save as a draft, publish, edit, or unpublish using the usual controls.

Published external spotlights appear only in the spotlight strip and open their destination directly in a new tab. Featured articles created on this site continue to link to their own article sections. Each language can point to a different URL. A completely empty translation stays absent in that language.

The content API stores these as resource records with the optional `spotlightOnly: true` flag, keeping the existing record types compatible with older clients. Deploy the content Lambda update before the frontend when releasing this feature. No database migration or infrastructure changes are required.

Two editors can work on different items independently. If someone saves the same item first, the API rejects a stale update; copy your changes before reloading the latest version. An unsaved edit triggers a browser warning when leaving the portal. Sessions last 30 minutes; reauthenticate after expiry.

Article bodies support formatting. The editor, preview, and public articles share the same typography. Existing plain-text articles keep their line breaks and can be formatted when edited. Titles and summaries remain plain text. YouTube media can play on the page; other media opens on its host platform. Uploads, scheduled publication, and general page layout editing are outside this release.

## Architecture and deployment

The existing React/Vite frontend remains hosted in S3. A dedicated API Gateway HTTP API invokes a separate content Lambda and DynamoDB table. Each content item is one record with a conditional revision check. The public endpoint returns published translations only. Admin routes require an access token with `content/write` scope and membership in the `editors` Cognito group.

Authentication uses the authorization-code flow with PKCE. There is no browser client secret, public self-registration, or Lambda Function URL. The browser stores a short-lived access token in session storage and discards refresh tokens. Admin pages use `noindex,nofollow` and do not load analytics. API responses are not cached.

- [AWS JWT authorizers](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-jwt-authorizer.html)
- [Cognito authorization endpoint and PKCE](https://docs.aws.amazon.com/cognito/latest/developerguide/authorization-endpoint.html)

The new infrastructure has separate local Terraform state under `infra/content/`, uses the `TerraformMindapax` AWS profile, and defaults to `us-east-1`. It does not modify the existing order/excerpt stack. Keep its ignored state securely backed up; the content table has point-in-time recovery and deletion protection.

```sh
npm run check:content
npm run build:content
terraform -chdir=infra/content init
# Create ignored infra/content/terraform.tfvars from the example and set editor_emails.
terraform -chdir=infra/content plan -out=content.tfplan
terraform -chdir=infra/content apply content.tfplan
make deploy PROFILE=TerraformMindapax
```

The frontend deployment script reads public configuration from the content Terraform outputs. For a separate build environment, provide:

- `VITE_CONTENT_API_BASE`: content API endpoint.
- `VITE_ADMIN_AUTH_DOMAIN`: Cognito hosted sign-in origin.
- `VITE_ADMIN_CLIENT_ID`: public Cognito app client ID.

When deploying the formatting update, run `npm run check:content` and `npm run build:content`, then plan/apply `infra/content` before deploying the frontend. The API must support the new optional `bodyRich` document field before editors start saving formatted articles. A plain-text `body` is derived from the validated document for backward compatibility; no data migration is needed.

Run a complete build after setting these values; a previous unconfigured build cannot enable the portal. The existing form API continues to use `VITE_API_BASE`.

Terraform creates editor accounts without sending email. Once the portal is live and the invitation is authorized, send the temporary-password invitation:

```sh
bash scripts/invite-content-editor.sh editor@example.com
```

Invitations expire after seven days. To add or replace an editor, update the local `editor_emails` list, inspect/apply the plan, and invite the new account. Removing an email from that list deletes the corresponding Cognito account, so review removals carefully. To suspend access immediately, disable the Cognito user; already-issued access tokens can remain valid until their 30-minute expiry.

The initial implementation scans the small editorial table, including all DynamoDB scan pages. For a substantially larger library, introduce paginated public and admin APIs and a published-content index before reaching API response-size limits.

## Checks

`npm run check:content` covers authorization, draft visibility, publishing/unpublishing, independent records, stale revisions, bilingual validation, media links, unsafe URL schemes, brand naming, and storage failure responses. `npm run build` prerenders ten localized routes and generates the public sitemap, excluding admin routes.

## Local editorial preview

Run `npm run preview:editorial` and open `http://127.0.0.1:4173/admin/`. The Sign in button opens the local demo without live credentials. It includes a featured internal article and an external spotlight draft. Changes stay in memory and never reach AWS; restarting restores the examples. Set `EDITORIAL_PREVIEW_PORT` if port 4173 is already in use. This preview script is excluded from the production build.

## Resource browsing

Resources use a catalogue of summaries, with six cards per page. Opening a card shows the full formatted article in a reading view. Search matches titles, summaries, and article text, including accent-insensitive French searches. The two main themes remain **Pratiquer le leadership / Leadership in practice** and **Les tendances du leadership / Leadership trends**.

Public filters and the Resources navigation menu show only themes/topics with published content in the selected language. There are no empty category sections. One empty state covers a library without published resources; a separate message handles searches without results.

Filters and page numbers are carried in the URL (`group`, `topic`, `q`, `page`). Article links retain the existing `#entry-ID` format. Returning from an article or using browser Back restores the catalogue selection. Existing category/group fragments open the corresponding filter; empty topics fall back to their populated parent theme or the full catalogue. The admin category options remain complete so editors can publish into a topic that is currently empty.

Pagination is client-side over the existing published-content endpoint. The local editorial preview includes fourteen clearly local sample resources so pagination and reading views can be reviewed without publishing sample content. The media library uses the same catalogue navigation pattern, described below.

## YouTube media

Create or edit a Media item and paste its YouTube URL in **Lien du média / Media link**. Standard watch URLs, youtu.be shares, Shorts, live-video URLs, and individual embed URLs are recognized. Supported start times are preserved. The admin preview and public media library provide **Lire la vidéo / Play video**, which loads the player on request, and **Regarder sur YouTube / Watch on YouTube**.

The site generates a player URL from the validated video ID; editors do not paste iframe HTML. Non-YouTube links continue to open normally. Playback depends on the video's availability and the owner's embedding settings; the YouTube link remains accessible beside the player. See [YouTube's embedding guide](https://support.google.com/youtube/answer/171780) and [player requirements](https://developers.google.com/youtube/terms/required-minimum-functionality).

These grouping and playback changes use existing categories and URL fields and need no data migration. The local preview includes clearly labelled demonstration content for both resource groups and a YouTube player example.

## Media browsing

The media library shows six cards per page, with search and filters for formats that have published content in the selected language. Empty formats are omitted from both the catalogue and the navigation menu. YouTube entries use their video thumbnail, with a format illustration if the image is unavailable. Other media uses a format icon.

Opening a card shows one media detail view, with its description, notes, and either the existing YouTube player or a link to the hosting platform. Players are never mounted for every item in the catalogue. The YouTube player loads when Play is selected. No media durations or dates are invented when they are absent from the source content.

Media URLs store `format`, `q`, and `page`; the existing `#entry-ID` links still open individual media. Older category fragments, such as `#podcasts`, select that format when it contains published items. Returning to the library or using browser Back restores the selection. Resource and media query state are kept separate.

The local preview includes thirteen illustrative media entries across four populated formats, so pagination and hidden empty formats can be reviewed. Only the labelled YouTube demonstration entry uses a real video; example.com links are placeholders. These browsing changes need no content migration or new backend fields.

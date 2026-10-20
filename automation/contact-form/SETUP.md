# Contact form setup (about 10 minutes)

The homepage form posts to a small Google Apps Script web app that runs on your own Google account. For each message it:

1. checks it (required fields, valid email, length, spam guards, rate limit),
2. asks Gemini to triage it (`good`, `unclear`, or `not_a_fit`, with a one-sentence reason),
3. adds a row to a Google Sheet,
4. emails you (and posts to Slack if you set that up),
5. sends the visitor a short plain auto-reply from your Gmail. The AI triage is never in that reply.

Nothing secret lives in this folder. Your keys go in **Script Properties**, which only you can see.

Until you finish step 9, the site still works: the form shows “The form isn’t connected yet — please email me.” when someone presses **Send it**.

## 1. Create the Sheet

1. Go to [sheets.new](https://sheets.new) and name it `Portfolio inquiries`.
2. Rename the first tab (bottom left) to `Inquiries`.
3. Paste this header row into cell **A1** (it fills A1 to H1):

   ```
   Timestamp	Name	Email	Message	Triage	Reason	Source page	User agent
   ```

4. Copy the Sheet ID from the address bar. It is the long part between `/d/` and `/edit`:
   `https://docs.google.com/spreadsheets/d/`**`1AbC...xyz`**`/edit`

## 2. Open Apps Script

In the Sheet, choose **Extensions → Apps Script**. A new tab opens with a file called `Code.gs`.

## 3. Paste the code

1. Delete everything in `Code.gs`, then paste the whole of [`Code.gs`](./Code.gs) from this folder.
2. Show the manifest: click the gear (**Project Settings**) on the left and tick **Show "appsscript.json" manifest file in editor**.
3. Go back to the editor (the `< >` icon), open `appsscript.json`, replace its contents with [`appsscript.json`](./appsscript.json) from this folder.
4. Press **⌘S** (or Ctrl+S) to save.

## 4. Get a Gemini API key

Use the Gemini key you saved in your local `.env`, or make a new one at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (**Create API key**). Keep it private: it only ever goes into Script Properties, never into the website code.

If you skip this, every inquiry is still saved and emailed, just triaged as `unclear`.

## 5. Set Script Properties

**Project Settings** (gear) → scroll to **Script Properties** → **Add script property** for each:

| Property            | Value                                                       |
| ------------------- | ----------------------------------------------------------- |
| `SHEET_ID`          | the ID from step 1                                          |
| `OWNER_EMAIL`       | `jomarivillanueva83@gmail.com`                              |
| `GEMINI_API_KEY`    | the key from step 4                                         |
| `GEMINI_MODEL`      | optional, defaults to `gemini-2.5-flash`                    |
| `SLACK_WEBHOOK_URL` | optional, a Slack incoming webhook URL (skipped when unset) |

Click **Save script properties**.

## 6. Deploy as a web app

1. Top right: **Deploy → New deployment**.
2. Click the gear next to **Select type** and choose **Web app**.
3. Description: `contact form`.
4. **Execute as: Me**. **Who has access: Anyone**.
5. Click **Deploy**.

## 7. Authorize

Google asks for permission the first time. Choose your account. If you see “Google hasn’t verified this app”, click **Advanced → Go to (project name) (unsafe)**: it is your own script. Allow access to Sheets, sending email as you, and connecting to external services (Gemini and Slack).

## 8. Copy the web app URL

Copy the **Web app URL**. It ends in `/exec`.

Check it works by opening it in your browser. You should see:

```json
{ "ok": true, "service": "contact-form" }
```

## 9. Connect the site

Send the `/exec` URL to Claude, or paste it yourself into `src/data/profile.ts`:

```ts
contactEndpoint: 'https://script.google.com/macros/s/XXXX/exec',
```

Then rebuild and deploy the site as usual.

## 10. Test it

From a terminal (replace the URL and use your own email so you get the auto-reply). Keep `-L` and leave out `-X POST`: Google answers with a redirect that curl must follow as a GET.

```sh
curl -L 'https://script.google.com/macros/s/XXXX/exec' \
  -H 'Content-Type: text/plain' \
  --data "{\"name\":\"Test\",\"email\":\"you@example.com\",\"message\":\"Every Monday I copy form leads into HubSpot by hand.\",\"company\":\"\",\"startedAt\":$(($(date +%s) * 1000 - 10000)),\"elapsedMs\":10000,\"page\":\"/curl-test\"}"
```

You should get `{"ok":true}`, a new row in the Sheet, an email titled `[Portfolio] good — Test`, and the auto-reply. A bad request returns `{"ok":false,"error":"invalid"}`.

## After you edit the code

Saving is not enough: the live URL keeps running the old version until you redeploy.

**Deploy → Manage deployments** → pencil (edit) on your deployment → **Version: New version** → **Deploy**. The `/exec` URL stays the same, so the site needs no change.

(Choosing **New deployment** instead would create a second URL.)

## Good to know

- **Limits.** Up to 5 messages per email address and 30 in total per hour. A free Gmail account can send about 100 emails a day from Apps Script; each inquiry uses two (yours and the auto-reply).
- **Logs.** Failures are logged under **Executions** (left sidebar) in Apps Script. Visitors only ever see a generic error.
- **Spam.** The form has a hidden field bots tend to fill and refuses submissions made less than 3 seconds after the page loaded. The script checks both again.
- **Turning it off.** Deploy → Manage deployments → Archive. The site then shows its “Couldn’t send just now” message with your email.

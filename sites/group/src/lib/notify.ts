// Lead-visibility alerts (ratified addition): a new enquiry/application
// emails admissions/HR — leads must not rot unseen until Nucleus 3.0.
// MailChannels' Workers send API when ALERT_EMAILS is configured
// (credential sitting); console log otherwise so dev flows are visible.
export async function sendAlert(
  env: { ALERT_EMAILS?: string },
  subject: string,
  lines: string[],
): Promise<void> {
  const recipients = (env.ALERT_EMAILS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (recipients.length === 0) {
    console.log(`[alert suppressed — ALERT_EMAILS unset] ${subject}\n  ${lines.join('\n  ')}`);
    return;
  }
  try {
    await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: recipients.map((email) => ({ email })) }],
        from: { email: 'website@fountainheadschools.org', name: 'Fountainhead Website' },
        subject,
        content: [{ type: 'text/plain', value: lines.join('\n') }],
      }),
    });
  } catch (e) {
    // Alerting must never fail a submission.
    console.error(`alert send failed: ${e}`);
  }
}

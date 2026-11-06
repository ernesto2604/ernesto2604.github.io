import { expect, test } from './fixtures';
import profile from '../../src/content/profile.json' with { type: 'json' };

// The real service is never called: the request is intercepted and answered like FormSubmit does.
test('the message form posts the text with the fixed subject and confirms', async ({ page }) => {
  let sent: Record<string, string> = {};
  await page.route('https://formsubmit.co/ajax/**', async (route) => {
    sent = route.request().postDataJSON();
    await route.fulfill({ json: { success: 'true', message: 'The form was submitted successfully.' } });
  });
  await page.goto('/es/#contact');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await page.getByRole('textbox', { name: 'Tu mensaje' }).fill('Hola, ¿hablamos de una vacante?');
  await page.getByRole('textbox', { name: /Tu email/ }).fill('reclutadora@example.com');
  await page.getByRole('button', { name: 'Enviar', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Enviado' })).toBeVisible();
  expect(sent).toMatchObject({ message: 'Hola, ¿hablamos de una vacante?', email: 'reclutadora@example.com', _subject: 'Mensaje del Portfolio' });
  await expect(page.getByRole('textbox', { name: 'Tu mensaje' })).toHaveValue('');
});

test('a send that fails on both services says so and points to the email', async ({ page }) => {
  await page.route('https://formsubmit.co/ajax/**', (route) => route.fulfill({ status: 500, json: { success: 'false' } }));
  await page.route('https://api.web3forms.com/submit', (route) => route.fulfill({ status: 500, json: { success: false } }));
  await page.goto('/#contact');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await page.getByRole('textbox', { name: 'Your message' }).fill('Hello');
  await page.getByRole('textbox', { name: /Your email/ }).fill('recruiter@example.com');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'ercoal04@gmail.com' })).toBeVisible();
});

test('when FormSubmit fails the message goes through Web3Forms', async ({ page }) => {
  test.skip(!profile.web3formsKey, 'needs the Web3Forms access key in profile.json');
  let sent: Record<string, string> = {};
  await page.route('https://formsubmit.co/ajax/**', (route) => route.fulfill({ status: 522, body: 'error code: 522' }));
  await page.route('https://api.web3forms.com/submit', async (route) => {
    sent = route.request().postDataJSON();
    await route.fulfill({ json: { success: true, message: 'Email sent successfully!' } });
  });
  await page.goto('/#contact');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await page.getByRole('textbox', { name: 'Your message' }).fill('Hello');
  await page.getByRole('textbox', { name: /Your email/ }).fill('recruiter@example.com');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Sent' })).toBeVisible();
  expect(sent).toMatchObject({ access_key: profile.web3formsKey, message: 'Hello', email: 'recruiter@example.com' });
});

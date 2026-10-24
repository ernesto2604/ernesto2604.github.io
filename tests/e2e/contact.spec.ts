import { expect, test } from './fixtures';

// The real service is never called: the request is intercepted and answered like FormSubmit does.
test('the message form posts the text with the fixed subject and confirms', async ({ page }) => {
  let sent: Record<string, string> = {};
  await page.route('https://formsubmit.co/ajax/**', async (route) => {
    sent = route.request().postDataJSON();
    await route.fulfill({ json: { success: 'true', message: 'The form was submitted successfully.' } });
  });
  await page.goto('/es/#contact');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await page.getByRole('textbox', { name: 'O déjame un mensaje aquí' }).fill('Hola, ¿hablamos de una vacante?');
  await page.getByRole('textbox', { name: /Tu email/ }).fill('reclutadora@example.com');
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Enviado' })).toBeVisible();
  expect(sent).toMatchObject({ message: 'Hola, ¿hablamos de una vacante?', email: 'reclutadora@example.com', _subject: 'Mensaje del Portfolio' });
  await expect(page.getByRole('textbox', { name: 'O déjame un mensaje aquí' })).toHaveValue('');
});

test('a failed send says so and points to the email', async ({ page }) => {
  await page.route('https://formsubmit.co/ajax/**', (route) => route.fulfill({ status: 500, json: { success: 'false' } }));
  await page.goto('/#contact');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await page.getByRole('textbox', { name: 'Or leave me a message here' }).fill('Hello');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'ercoal04@gmail.com' })).toBeVisible();
});

export function sendEmail(to: string, subject: string, body: string) {
  // In a real app, this would send an email using a service like SendGrid or SES
  console.log(`Sending email to ${to}: ${subject}`);
  console.log(body);
}   
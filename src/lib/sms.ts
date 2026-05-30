export async function sendSMS(
  phone: string,
  message: string
) {
  const username = process.env.SMS_GATE_USER!;
  const password = process.env.SMS_GATE_PASS!;
  const smsGateway = process.env.SMS_GATE!;

  const basicAuth = Buffer.from(
    `${username}:${password}`
  ).toString("base64");

  const payload = {
    textMessage: {
      text: message,
    },
    phoneNumbers: [phone],
  };

  console.log(
    "SMS PAYLOAD:",
    JSON.stringify(payload, null, 2)
  );

  const response = await fetch(
    `${smsGateway}/message`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.text();

  console.log("SMS RESPONSE:", data);

  if (!response.ok) {
    throw new Error("Failed to send SMS");
  }
}